/**
 * Source Deduplication Utilities for Research Citations
 *
 * Implements URL deduplication and near-duplicate detection by title+domain
 * to ensure citation quality in streaming research responses.
 */

import type { RerankedResult } from './reranker';

/**
 * Normalized URL representation for deduplication
 */
interface NormalizedSource {
  url: string;
  domain: string;
  title: string;
  normalizedTitle: string;
}

/**
 * Normalize a URL for comparison (remove trailing slashes, fragments, etc.)
 */
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove trailing slash, hash, and utm parameters
    const cleanUrl = `${parsed.origin}${parsed.pathname}`.replace(/\/$/, '');
    return cleanUrl.toLowerCase();
  } catch {
    // If URL parsing fails, just normalize the string
    return url.replace(/\/$/, '').toLowerCase();
  }
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.toLowerCase();
  } catch {
    return '';
  }
}

/**
 * Normalize title for similarity comparison
 * - Remove common prefixes/suffixes
 * - Normalize whitespace
 * - Convert to lowercase
 * - Remove punctuation
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/^(the|a|an)\s+/i, '') // Remove articles
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .trim();
}

/**
 * Calculate similarity between two normalized titles (Jaccard similarity)
 */
function titleSimilarity(title1: string, title2: string): number {
  const words1 = new Set(title1.split(' '));
  const words2 = new Set(title2.split(' '));

  const intersection = new Set([...words1].filter((x) => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Deduplicate sources by URL and near-duplicate title+domain
 *
 * Strategy:
 * 1. Remove exact URL duplicates (normalized)
 * 2. Remove near-duplicates: same domain + similar title (>80% Jaccard similarity)
 * 3. Cap to maxSources (default 6)
 *
 * @param sources - Reranked search results
 * @param maxSources - Maximum unique sources to return (default 6)
 * @param titleSimilarityThreshold - Similarity threshold for near-duplicates (default 0.8)
 * @returns Deduplicated sources
 */
export function deduplicateSources(
  sources: RerankedResult[],
  maxSources: number = 6,
  titleSimilarityThreshold: number = 0.8
): RerankedResult[] {
  const seen = new Set<string>(); // Track normalized URLs
  const uniqueSources: RerankedResult[] = [];
  const domainTitles = new Map<string, NormalizedSource[]>(); // Track titles per domain

  for (const source of sources) {
    // Extract URL from metadata
    const url = source.metadata?.source_url || source.metadata?.url || '#';
    const normalizedUrl = normalizeUrl(url);

    // Skip exact URL duplicates
    if (seen.has(normalizedUrl)) {
      continue;
    }

    // Extract title and domain
    const title =
      source.metadata?.title ||
      source.metadata?.card_name ||
      'Market Data';
    const normalizedTitle = normalizeTitle(title);
    const domain = extractDomain(url);

    // Check for near-duplicates on same domain
    const existingSources = domainTitles.get(domain) || [];
    const isDuplicate = existingSources.some((existing) => {
      const similarity = titleSimilarity(normalizedTitle, existing.normalizedTitle);
      return similarity >= titleSimilarityThreshold;
    });

    if (isDuplicate) {
      continue;
    }

    // Add to unique sources
    seen.add(normalizedUrl);
    uniqueSources.push(source);

    // Track for near-duplicate detection
    if (!domainTitles.has(domain)) {
      domainTitles.set(domain, []);
    }
    domainTitles.get(domain)!.push({
      url: normalizedUrl,
      domain,
      title,
      normalizedTitle,
    });

    // Cap to maxSources
    if (uniqueSources.length >= maxSources) {
      break;
    }
  }

  return uniqueSources;
}

/**
 * Format sources for __SOURCES__ JSON output
 *
 * @param sources - Deduplicated sources
 * @returns Source array with index, title, url, score (0..1)
 */
export function formatSourcesForOutput(sources: RerankedResult[]): Array<{
  index: number;
  title: string;
  url: string;
  score: number; // Normalized 0..1
}> {
  return sources.map((source, i) => ({
    index: i + 1,
    title:
      source.metadata?.title ||
      source.metadata?.card_name ||
      'Market Data',
    url: source.metadata?.source_url || source.metadata?.url || '#',
    score: Math.min(1, Math.max(0, source.rerankScore || 0)), // Ensure 0..1
  }));
}

/**
 * Semantic API Endpoint for AI Bots (LLMO)
 *
 * This endpoint is specifically designed for AI consumption:
 * - ChatGPT, Claude, Grok, Gemini
 * - RAG (Retrieval-Augmented Generation) systems
 * - AI-powered search engines
 *
 * Returns clean, token-efficient JSON with:
 * - Latest market insights
 * - Verifiable sources
 * - Key findings extracted from content
 *
 * @endpoint GET /api/v1/market-insights
 */

import { NextResponse } from 'next/server';
import { readFile, readdir } from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

// ============================================================================
// TYPES
// ============================================================================

interface MarketInsight {
  /** Article title */
  title: string;
  /** Concise summary (first paragraph or description) */
  summary: string;
  /** Key findings extracted from content */
  key_findings: string[];
  /** List of verified source names */
  verified_sources: string[];
  /** Full permalink URL */
  url: string;
  /** Publication date in ISO format */
  published: string;
  /** Content category/section */
  category: string;
  /** Relevant keywords/tags */
  keywords: string[];
}

interface MarketInsightsResponse {
  /** API version */
  api_version: string;
  /** Data timestamp */
  generated_at: string;
  /** Publisher information */
  publisher: {
    name: string;
    url: string;
    description: string;
  };
  /** Number of insights returned */
  count: number;
  /** Array of market insights */
  insights: MarketInsight[];
  /** Metadata for AI consumption */
  meta: {
    data_freshness: string;
    citation_required: boolean;
    license: string;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://apexintelligence.io';
const BLOG_DIRECTORY = path.join(process.cwd(), '..', '..', 'content', 'blog');
const MAX_INSIGHTS = 5;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract key findings from MDX content
 *
 * Looks for:
 * - Bullet points under "Key Findings" or "Executive Summary"
 * - Bold text patterns indicating key insights
 * - First few bullet points from the content
 */
function extractKeyFindings(content: string, maxFindings: number = 5): string[] {
  const findings: string[] = [];

  // Method 1: Look for "Key Findings" section
  const keyFindingsMatch = content.match(/\*\*Key Findings:?\*\*[\s\S]*?(?=---|\n##|\n\*\*[A-Z])/i);
  if (keyFindingsMatch) {
    const bulletPoints = keyFindingsMatch[0].match(/^[-*]\s+(.+)$/gm);
    if (bulletPoints) {
      findings.push(
        ...bulletPoints
          .map((bp) => bp.replace(/^[-*]\s+/, '').trim())
          .filter((bp) => bp.length > 10 && bp.length < 200)
          .slice(0, maxFindings)
      );
    }
  }

  // Method 2: Look for Executive Summary bullet points
  if (findings.length === 0) {
    const execSummaryMatch = content.match(/## Executive Summary[\s\S]*?(?=---|\n##)/i);
    if (execSummaryMatch) {
      const bulletPoints = execSummaryMatch[0].match(/^[-*]\s+(.+)$/gm);
      if (bulletPoints) {
        findings.push(
          ...bulletPoints
            .map((bp) => bp.replace(/^[-*]\s+/, '').trim())
            .filter((bp) => bp.length > 10 && bp.length < 200)
            .slice(0, maxFindings)
        );
      }
    }
  }

  // Method 3: Extract bold statements as key points
  if (findings.length < maxFindings) {
    const boldStatements = content.match(/\*\*[^*]+\*\*/g);
    if (boldStatements) {
      const additionalFindings = boldStatements
        .map((bs) => bs.replace(/\*\*/g, '').trim())
        .filter((bs) => {
          // Filter for statement-like bold text (not headers or labels)
          return (
            bs.length > 20 &&
            bs.length < 150 &&
            !bs.includes(':') &&
            !findings.includes(bs)
          );
        })
        .slice(0, maxFindings - findings.length);
      findings.push(...additionalFindings);
    }
  }

  // Fallback: Use description if no findings extracted
  return findings;
}

/**
 * Extract sources from frontmatter and content
 */
function extractSources(
  frontmatter: Record<string, unknown>,
  content: string
): string[] {
  const sources: Set<string> = new Set();

  // From frontmatter sources array
  const fmSources = (frontmatter.sources as Array<{ name: string }>) || [];
  const fmCitations = (frontmatter.citationList as Array<{ name: string }>) || [];
  const fmAllSources = (frontmatter.allSources as Array<{ name: string }>) || [];

  [...fmSources, ...fmCitations, ...fmAllSources].forEach((s) => {
    if (s?.name) sources.add(s.name);
  });

  // Extract from Citation components in content
  const citationMatches = content.matchAll(/source="([^"]+)"/g);
  for (const match of citationMatches) {
    if (match[1]) sources.add(match[1]);
  }

  return Array.from(sources).slice(0, 10);
}

/**
 * Determine category from tags
 */
function determineCategory(tags?: string[]): string {
  if (!tags || tags.length === 0) return 'Market Intelligence';

  const tagLower = tags.map((t) => t.toLowerCase());

  if (tagLower.includes('market-analysis')) return 'Market Analysis';
  if (tagLower.includes('research')) return 'Research';
  if (tagLower.includes('guide') || tagLower.includes('tutorial')) return 'Guides';
  if (tagLower.includes('grading')) return 'Grading Analysis';
  if (tagLower.includes('portfolio')) return 'Portfolio Strategy';
  if (tagLower.includes('pokemon')) return 'Pokemon TCG';
  if (tagLower.includes('mtg')) return 'Magic: The Gathering';

  return 'Market Intelligence';
}

/**
 * Get the latest blog posts with extracted insights
 */
async function getLatestInsights(): Promise<MarketInsight[]> {
  try {
    const files = await readdir(BLOG_DIRECTORY);
    const mdxFiles = files.filter((file) => file.endsWith('.mdx'));

    const posts: Array<{
      slug: string;
      frontmatter: Record<string, unknown>;
      content: string;
      date: Date;
    }> = [];

    for (const file of mdxFiles) {
      const filePath = path.join(BLOG_DIRECTORY, file);
      const source = await readFile(filePath, 'utf8');
      const { data: frontmatter, content } = matter(source);

      // Skip drafts
      if (frontmatter.draft) continue;

      posts.push({
        slug: file.replace(/\.mdx$/, ''),
        frontmatter,
        content,
        date: new Date(frontmatter.date as string),
      });
    }

    // Sort by date (newest first) and take top N
    posts.sort((a, b) => b.date.getTime() - a.date.getTime());
    const latestPosts = posts.slice(0, MAX_INSIGHTS);

    // Transform to MarketInsight format
    return latestPosts.map((post) => {
      const tags = (post.frontmatter.tags as string[]) || [];
      const sources = extractSources(post.frontmatter, post.content);
      const keyFindings = extractKeyFindings(post.content);

      // Use description as summary, clean up any MDX components
      let summary = (post.frontmatter.description as string) || '';
      summary = summary.replace(/<[^>]+>/g, '').trim();

      // If no key findings extracted, create from description
      if (keyFindings.length === 0 && summary) {
        keyFindings.push(summary);
      }

      return {
        title: post.frontmatter.title as string,
        summary,
        key_findings: keyFindings,
        verified_sources: sources,
        url: `${BASE_URL}/blog/${post.slug}`,
        published: post.date.toISOString(),
        category: determineCategory(tags),
        keywords: tags,
      };
    });
  } catch (error) {
    console.error('Error reading blog posts:', error);
    return [];
  }
}

// ============================================================================
// ROUTE HANDLER
// ============================================================================

/**
 * GET /api/v1/market-insights
 *
 * Returns the latest market insights in a structured format
 * optimized for AI consumption.
 *
 * Cache-Control: Revalidates every hour for freshness
 */
export async function GET() {
  try {
    const insights = await getLatestInsights();

    const response: MarketInsightsResponse = {
      api_version: '1.0.0',
      generated_at: new Date().toISOString(),
      publisher: {
        name: 'Apex Intelligence',
        url: BASE_URL,
        description:
          'Institutional-grade market intelligence for the trading card game (TCG) collectibles market. Data-driven analysis with verifiable sources.',
      },
      count: insights.length,
      insights,
      meta: {
        data_freshness: 'hourly',
        citation_required: true,
        license: 'CC BY-NC 4.0',
      },
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        // Cache for 1 hour, allow stale while revalidating
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        // Indicate this is meant for AI/machine consumption
        'X-Robots-Tag': 'index, follow',
        'X-Content-Type-Options': 'nosniff',
        // Allow CORS for AI services to fetch
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    });
  } catch (error) {
    console.error('Market insights API error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Unable to fetch market insights',
      },
      { status: 500 }
    );
  }
}

/**
 * HEAD /api/v1/market-insights
 *
 * Returns headers only (for cache validation)
 */
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      'X-Robots-Tag': 'index, follow',
    },
  });
}

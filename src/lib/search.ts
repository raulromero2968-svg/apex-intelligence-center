import { getCached, stableKey, getCachedWithMeta } from '@/lib/cache';
import * as Sentry from '@sentry/nextjs';

export type SearchParams = {
  q?: string;
  tags?: string[];
  sources?: string[];
  from?: string;
  to?: string;
};

/**
 * Normalize search parameters for consistent cache keys
 */
function normalize(p: URLSearchParams | Record<string, any>): SearchParams {
  const obj = p instanceof URLSearchParams ? Object.fromEntries(p) : p;
  const asArr = (v: unknown) =>
    typeof v === 'string' ? v.split(',') : Array.isArray(v) ? v : [];
  return {
    q: (obj.q || '').toString().slice(0, 160),
    tags: asArr(obj.tags).filter(Boolean).sort(),
    sources: asArr(obj.sources).filter(Boolean).sort(),
    from: obj.from || undefined,
    to: obj.to || undefined,
  };
}

/**
 * Placeholder search index function
 * Replace with actual implementation when search is set up
 */
async function searchIndex(params: SearchParams): Promise<any[]> {
  // This will be replaced with actual search implementation
  // For now, return empty array
  Sentry.addBreadcrumb({
    category: 'search',
    level: 'debug',
    data: params,
  });
  return [];
}

/**
 * Cached search with normalized parameters
 * Uses source-specific tags for precise invalidation
 */
export async function cachedSearch(
  raw: URLSearchParams | Record<string, any>
) {
  const params = normalize(raw);
  const key = stableKey('search', params);
  const tags = ['search', ...params.sources.map((s) => `source:${s}`)];

  return getCached(
    key,
    tags,
    async () => {
      return Sentry.startSpan(
        { name: 'search.query', op: 'compute' },
        async (span) => {
          const res = await searchIndex(params);
          span?.setData?.('resultCount', Array.isArray(res) ? res.length : undefined);
          return res;
        }
      );
    },
    45
  );
}

/**
 * Cached search with metadata for cache headers
 * Returns both results and cache hit/miss information
 */
export async function cachedSearchWithMeta(
  raw: URLSearchParams | Record<string, any>
) {
  const params = normalize(raw);
  const key = stableKey('search', params);
  const tags = ['search', ...params.sources.map((s) => `source:${s}`)];

  return getCachedWithMeta(
    key,
    tags,
    async () => {
      return Sentry.startSpan(
        { name: 'search.query', op: 'compute' },
        async (span) => {
          const res = await searchIndex(params);
          span?.setData?.('resultCount', Array.isArray(res) ? res.length : undefined);
          return res;
        }
      );
    },
    45
  );
}

// Export normalize for use in admin tools
export { normalize };

/**
 * Embedding Cache - Redis-based caching for OpenAI embeddings
 *
 * Reduces API calls to OpenAI (50-70% cost savings on repeated queries)
 * Sub-10ms cache hits vs 200ms embedding generation
 *
 * Cache Strategy:
 * - Report embeddings: 1 day TTL (static content)
 * - Query embeddings: 1 hour TTL (frequently repeated searches)
 * - LRU eviction via Redis maxmemory policy (limit to top 10K reports)
 *
 * Trade-offs:
 * - GOOD: Reduces API calls to OpenAI (cost savings 50-70% on repeats)
 * - GOOD: Sub-10ms cache hits vs 200ms embeds
 * - GOOD: Scales horizontally with Redis cluster
 * - BAD: Stale cache on report updates; invalidate on edit via Redis del
 * - BAD: Memory usage (1536-dim vector ~6KB/report); limit to top 10K reports via LRU
 *
 * Reference: knowledge-02-ai-rag-architecture-v2.md
 *
 * @module lib/cache/embedding-cache
 */

import * as Sentry from '@sentry/nextjs';

// =============================================================================
// CONSTANTS
// =============================================================================

/** TTL for report embeddings (1 day in seconds) */
export const REPORT_EMBEDDING_TTL = 86400;

/** TTL for query embeddings (1 hour in seconds) */
export const QUERY_EMBEDDING_TTL = 3600;

/** Cache key prefixes */
export const CACHE_KEYS = {
  REPORT_EMBEDDING: 'embed:report:',
  QUERY_EMBEDDING: 'embed:query:',
} as const;

// =============================================================================
// REDIS CLIENT (Lazy initialization)
// =============================================================================

let redisClient: any = null;

/**
 * Get or initialize Redis client (Upstash REST API)
 */
async function getRedis(): Promise<any | undefined> {
  if (redisClient !== null) return redisClient;

  try {
    const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;
    if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
      const { Redis } = await import('@upstash/redis');
      redisClient = new Redis({
        url: UPSTASH_REDIS_REST_URL,
        token: UPSTASH_REDIS_REST_TOKEN,
      });
    } else {
      redisClient = undefined;
    }
  } catch (error) {
    console.warn('Redis initialization failed:', error);
    redisClient = undefined;
  }

  return redisClient;
}

// =============================================================================
// HASH FUNCTION FOR QUERY KEYS
// =============================================================================

/**
 * Generate a simple hash for query strings
 * Uses FNV-1a hash algorithm for fast, deterministic hashing
 */
function hashQuery(query: string): string {
  let hash = 2166136261;
  for (let i = 0; i < query.length; i++) {
    hash ^= query.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

// =============================================================================
// EMBEDDING CACHE OPERATIONS
// =============================================================================

export interface EmbeddingCacheStats {
  hits: number;
  misses: number;
  hitRate: number;
}

/**
 * Get cached embedding for a report
 *
 * @param reportId - UUID of the report
 * @returns Cached embedding array or null if not found
 */
export async function getCachedReportEmbedding(
  reportId: string
): Promise<number[] | null> {
  try {
    const redis = await getRedis();
    if (!redis) return null;

    const cacheKey = `${CACHE_KEYS.REPORT_EMBEDDING}${reportId}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      // Redis may return parsed JSON directly or a string
      const embedding = typeof cached === 'string' ? JSON.parse(cached) : cached;

      Sentry.addBreadcrumb({
        category: 'cache',
        message: `Embedding cache hit: ${reportId}`,
        level: 'debug',
      });

      return embedding;
    }

    return null;
  } catch (error) {
    console.warn('Embedding cache get failed:', error);
    return null;
  }
}

/**
 * Cache embedding for a report
 *
 * @param reportId - UUID of the report
 * @param embedding - Embedding array (1536 floats)
 * @param ttl - Time to live in seconds (default: 1 day)
 */
export async function cacheReportEmbedding(
  reportId: string,
  embedding: number[],
  ttl: number = REPORT_EMBEDDING_TTL
): Promise<void> {
  try {
    const redis = await getRedis();
    if (!redis) return;

    const cacheKey = `${CACHE_KEYS.REPORT_EMBEDDING}${reportId}`;
    await redis.set(cacheKey, JSON.stringify(embedding), { ex: ttl });

    Sentry.addBreadcrumb({
      category: 'cache',
      message: `Embedding cached: ${reportId}`,
      level: 'debug',
    });
  } catch (error) {
    console.warn('Embedding cache set failed:', error);
  }
}

/**
 * Invalidate cached embedding for a report
 * Call this when a report is updated or deleted
 *
 * @param reportId - UUID of the report
 */
export async function invalidateReportEmbedding(reportId: string): Promise<void> {
  try {
    const redis = await getRedis();
    if (!redis) return;

    const cacheKey = `${CACHE_KEYS.REPORT_EMBEDDING}${reportId}`;
    await redis.del(cacheKey);

    Sentry.addBreadcrumb({
      category: 'cache',
      message: `Embedding invalidated: ${reportId}`,
      level: 'info',
    });
  } catch (error) {
    console.warn('Embedding cache invalidate failed:', error);
  }
}

/**
 * Get cached embedding for a search query
 *
 * @param query - Search query string
 * @returns Cached embedding array or null if not found
 */
export async function getCachedQueryEmbedding(
  query: string
): Promise<number[] | null> {
  try {
    const redis = await getRedis();
    if (!redis) return null;

    const queryHash = hashQuery(query.toLowerCase().trim());
    const cacheKey = `${CACHE_KEYS.QUERY_EMBEDDING}${queryHash}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      const embedding = typeof cached === 'string' ? JSON.parse(cached) : cached;

      Sentry.addBreadcrumb({
        category: 'cache',
        message: `Query embedding cache hit: ${queryHash}`,
        level: 'debug',
      });

      return embedding;
    }

    return null;
  } catch (error) {
    console.warn('Query embedding cache get failed:', error);
    return null;
  }
}

/**
 * Cache embedding for a search query
 *
 * @param query - Search query string
 * @param embedding - Embedding array (1536 floats)
 * @param ttl - Time to live in seconds (default: 1 hour)
 */
export async function cacheQueryEmbedding(
  query: string,
  embedding: number[],
  ttl: number = QUERY_EMBEDDING_TTL
): Promise<void> {
  try {
    const redis = await getRedis();
    if (!redis) return;

    const queryHash = hashQuery(query.toLowerCase().trim());
    const cacheKey = `${CACHE_KEYS.QUERY_EMBEDDING}${queryHash}`;
    await redis.set(cacheKey, JSON.stringify(embedding), { ex: ttl });

    Sentry.addBreadcrumb({
      category: 'cache',
      message: `Query embedding cached: ${queryHash}`,
      level: 'debug',
    });
  } catch (error) {
    console.warn('Query embedding cache set failed:', error);
  }
}

// =============================================================================
// COMBINED EMBEDDING RETRIEVAL WITH CACHING
// =============================================================================

/**
 * Get embedding for content, checking cache first
 * If not cached, generates new embedding and caches it
 *
 * @param content - Text content to embed
 * @param reportId - Report ID for cache key
 * @param generateEmbedding - Function to generate embedding if not cached
 * @returns Embedding array and cache status
 */
export async function getEmbeddingWithCache(
  content: string,
  reportId: string,
  generateEmbedding: (text: string) => Promise<number[]>
): Promise<{ embedding: number[]; cached: boolean }> {
  // Try cache first
  const cached = await getCachedReportEmbedding(reportId);
  if (cached) {
    return { embedding: cached, cached: true };
  }

  // Generate new embedding
  const embedding = await generateEmbedding(content);

  // Cache for future use (async, non-blocking)
  cacheReportEmbedding(reportId, embedding).catch((error) => {
    console.warn('Background cache failed:', error);
  });

  return { embedding, cached: false };
}

/**
 * Get embedding for a search query, checking cache first
 *
 * @param query - Search query
 * @param generateEmbedding - Function to generate embedding if not cached
 * @returns Embedding array and cache status
 */
export async function getQueryEmbeddingWithCache(
  query: string,
  generateEmbedding: (text: string) => Promise<number[]>
): Promise<{ embedding: number[]; cached: boolean }> {
  // Try cache first
  const cached = await getCachedQueryEmbedding(query);
  if (cached) {
    return { embedding: cached, cached: true };
  }

  // Generate new embedding
  const embedding = await generateEmbedding(query);

  // Cache for future use (async, non-blocking)
  cacheQueryEmbedding(query, embedding).catch((error) => {
    console.warn('Background cache failed:', error);
  });

  return { embedding, cached: false };
}

// =============================================================================
// BATCH OPERATIONS
// =============================================================================

/**
 * Batch cache multiple report embeddings
 * Useful for bulk indexing operations
 *
 * @param embeddings - Array of {reportId, embedding} pairs
 */
export async function batchCacheReportEmbeddings(
  embeddings: Array<{ reportId: string; embedding: number[] }>
): Promise<void> {
  try {
    const redis = await getRedis();
    if (!redis) return;

    // Use pipeline for batch operations
    const pipeline = redis.pipeline();
    for (const { reportId, embedding } of embeddings) {
      const cacheKey = `${CACHE_KEYS.REPORT_EMBEDDING}${reportId}`;
      pipeline.set(cacheKey, JSON.stringify(embedding), { ex: REPORT_EMBEDDING_TTL });
    }
    await pipeline.exec();

    Sentry.addBreadcrumb({
      category: 'cache',
      message: `Batch cached ${embeddings.length} embeddings`,
      level: 'info',
    });
  } catch (error) {
    console.warn('Batch embedding cache failed:', error);
  }
}

/**
 * Batch invalidate multiple report embeddings
 * Useful for bulk update/delete operations
 *
 * @param reportIds - Array of report IDs to invalidate
 */
export async function batchInvalidateReportEmbeddings(
  reportIds: string[]
): Promise<void> {
  try {
    const redis = await getRedis();
    if (!redis) return;

    const keys = reportIds.map((id) => `${CACHE_KEYS.REPORT_EMBEDDING}${id}`);
    await redis.del(...keys);

    Sentry.addBreadcrumb({
      category: 'cache',
      message: `Batch invalidated ${reportIds.length} embeddings`,
      level: 'info',
    });
  } catch (error) {
    console.warn('Batch embedding invalidate failed:', error);
  }
}

/**
 * LLM Response Caching with Redis
 *
 * Implements prompt caching to reduce costs and latency for repeated requests.
 * Uses Redis with MD5 hash keys for efficient lookup.
 *
 * Trade-offs:
 * - GOOD: Reduces costs 30-50% for common queries
 * - BAD: Stale cache for dynamic content; requires invalidation strategy
 *
 * References:
 * - Multi-LLM Integration Plan Section 3: Prompt Engineering and Caching
 */

import { createHash } from 'crypto';
import { redis } from '@/server/redis/client';
import type { LLMResponse, ChatMessage, LLMProvider } from './types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CACHE_CONFIG = {
  /** Default TTL in seconds (1 day) */
  DEFAULT_TTL_SECONDS: 86400,
  /** Prefix for cache keys */
  KEY_PREFIX: 'llm:cache:',
  /** Maximum cache entry size in bytes */
  MAX_ENTRY_SIZE: 100000,
  /** Cache hit rate tracking window */
  STATS_WINDOW_SECONDS: 3600,
};

// ============================================================================
// CACHE KEY GENERATION
// ============================================================================

/**
 * Generate cache key from messages and options
 * Uses MD5 hash for efficient storage and lookup
 */
function generateCacheKey(
  messages: ChatMessage[],
  provider?: LLMProvider,
  model?: string,
  temperature?: number
): string {
  const keyContent = JSON.stringify({
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    provider,
    model,
    temperature: temperature ?? 0.7,
  });

  const hash = createHash('md5').update(keyContent).digest('hex');
  return `${CACHE_CONFIG.KEY_PREFIX}${hash}`;
}

// ============================================================================
// CACHED RESPONSE TYPE
// ============================================================================

interface CachedResponse {
  response: LLMResponse;
  cachedAt: string;
  expiresAt: string;
}

// ============================================================================
// CACHE OPERATIONS
// ============================================================================

/**
 * Get cached response for messages
 */
export async function getCachedResponse(
  messages: ChatMessage[],
  provider?: LLMProvider,
  model?: string,
  temperature?: number
): Promise<LLMResponse | null> {
  try {
    const key = generateCacheKey(messages, provider, model, temperature);
    const cached = await redis.get<CachedResponse>(key);

    if (cached) {
      // Track cache hit
      await incrementCacheStats('hits');

      // Return cached response with cache indicator
      return {
        ...cached.response,
        // Add metadata to indicate this is from cache
        latencyMs: 0, // Cache retrieval is essentially instant
      };
    }

    // Track cache miss
    await incrementCacheStats('misses');
    return null;
  } catch (error) {
    console.error('[LLM_CACHE] Error getting cached response:', error);
    return null;
  }
}

/**
 * Cache a response for future use
 */
export async function cacheResponse(
  messages: ChatMessage[],
  response: LLMResponse,
  ttlSeconds: number = CACHE_CONFIG.DEFAULT_TTL_SECONDS
): Promise<boolean> {
  try {
    // Don't cache fallback responses or errors
    if (response.isFallback && response.fallbackReason) {
      return false;
    }

    const key = generateCacheKey(
      messages,
      response.provider,
      response.model,
      undefined // Temperature not available in response
    );

    const cachedData: CachedResponse = {
      response,
      cachedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    };

    // Check size limit
    const serialized = JSON.stringify(cachedData);
    if (serialized.length > CACHE_CONFIG.MAX_ENTRY_SIZE) {
      console.warn('[LLM_CACHE] Response too large to cache:', serialized.length);
      return false;
    }

    await redis.set(key, cachedData, { ex: ttlSeconds });
    await incrementCacheStats('stores');

    return true;
  } catch (error) {
    console.error('[LLM_CACHE] Error caching response:', error);
    return false;
  }
}

/**
 * Invalidate cache for specific messages
 */
export async function invalidateCache(
  messages: ChatMessage[],
  provider?: LLMProvider,
  model?: string
): Promise<boolean> {
  try {
    const key = generateCacheKey(messages, provider, model);
    await redis.del(key);
    return true;
  } catch (error) {
    console.error('[LLM_CACHE] Error invalidating cache:', error);
    return false;
  }
}

/**
 * Invalidate all cache entries with pattern
 * Warning: This can be expensive on large datasets
 */
export async function invalidateCachePattern(pattern: string): Promise<number> {
  try {
    // Note: SCAN-based deletion would be more efficient for production
    // This is a simplified implementation
    const keys = await redis.keys(`${CACHE_CONFIG.KEY_PREFIX}${pattern}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    return keys.length;
  } catch (error) {
    console.error('[LLM_CACHE] Error invalidating cache pattern:', error);
    return 0;
  }
}

// ============================================================================
// CACHE STATISTICS
// ============================================================================

const STATS_KEY = 'llm:cache:stats';

interface CacheStats {
  hits: number;
  misses: number;
  stores: number;
  hitRate: number;
  lastReset: string;
}

async function incrementCacheStats(
  metric: 'hits' | 'misses' | 'stores'
): Promise<void> {
  try {
    const key = `${STATS_KEY}:${metric}`;
    await redis.incr(key);

    // Set expiry if new key
    await redis.expire(key, CACHE_CONFIG.STATS_WINDOW_SECONDS);
  } catch (error) {
    // Stats are non-critical, just log
    console.error('[LLM_CACHE] Error updating stats:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<CacheStats> {
  try {
    const [hits, misses, stores] = await Promise.all([
      redis.get<number>(`${STATS_KEY}:hits`),
      redis.get<number>(`${STATS_KEY}:misses`),
      redis.get<number>(`${STATS_KEY}:stores`),
    ]);

    const totalRequests = (hits || 0) + (misses || 0);
    const hitRate = totalRequests > 0 ? (hits || 0) / totalRequests : 0;

    return {
      hits: hits || 0,
      misses: misses || 0,
      stores: stores || 0,
      hitRate,
      lastReset: new Date(Date.now() - CACHE_CONFIG.STATS_WINDOW_SECONDS * 1000).toISOString(),
    };
  } catch (error) {
    console.error('[LLM_CACHE] Error getting cache stats:', error);
    return {
      hits: 0,
      misses: 0,
      stores: 0,
      hitRate: 0,
      lastReset: new Date().toISOString(),
    };
  }
}

/**
 * Reset cache statistics
 */
export async function resetCacheStats(): Promise<void> {
  try {
    await Promise.all([
      redis.del(`${STATS_KEY}:hits`),
      redis.del(`${STATS_KEY}:misses`),
      redis.del(`${STATS_KEY}:stores`),
    ]);
  } catch (error) {
    console.error('[LLM_CACHE] Error resetting cache stats:', error);
  }
}

// ============================================================================
// CACHED COMPLETION WRAPPER
// ============================================================================

import { chatCompletion, type LLMRequestOptions } from './llm-provider';

/**
 * Execute chat completion with caching
 *
 * This is the main entry point for cached LLM requests.
 * It checks cache first, then falls back to live completion.
 */
export async function cachedChatCompletion(
  messages: ChatMessage[],
  options: LLMRequestOptions = {}
): Promise<LLMResponse> {
  // Check if caching is enabled
  if (options.enableCache === false) {
    return chatCompletion(messages, options);
  }

  // Try to get cached response
  const cached = await getCachedResponse(
    messages,
    options.preferredProvider,
    options.model,
    options.temperature
  );

  if (cached) {
    return cached;
  }

  // Execute live completion
  const response = await chatCompletion(messages, options);

  // Cache the response
  const ttl = options.cacheTtlSeconds ?? CACHE_CONFIG.DEFAULT_TTL_SECONDS;
  await cacheResponse(messages, response, ttl);

  return response;
}

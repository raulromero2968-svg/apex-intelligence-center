/**
 * eBay Data Caching Layer - Redis Integration
 *
 * Implements aggressive caching strategy to stay within eBay's 5,000 calls/day limit.
 * TTL: 24 hours (historical data doesn't change rapidly)
 *
 * Architecture: 13_LAUNCH_01
 */

import { Redis } from 'ioredis';
import type { EbaySalePoint } from './finding-api';

// Use existing Redis connection
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const CACHE_PREFIX = 'ebay_sold:';
const CACHE_TTL = 86400; // 24 hours in seconds

export interface CachedEbaySales {
  sales: EbaySalePoint[];
  cachedAt: number;
  expiresAt: number;
}

/**
 * Get cached eBay sales data for a card
 *
 * @param cardSlug - Unique card identifier (e.g., "charizard-base-set-4")
 * @returns Cached sales or null if not found/expired
 */
export async function getCachedEbaySales(cardSlug: string): Promise<EbaySalePoint[] | null> {
  try {
    const key = `${CACHE_PREFIX}${cardSlug}`;
    // @ts-expect-error - Redis type resolution issue
    const cached = await redis.get(key);

    if (!cached) {
      return null;
    }

    const data: CachedEbaySales = JSON.parse(cached);

    // Check if expired (defense in depth)
    if (Date.now() > data.expiresAt) {
      await redis.del(key);
      return null;
    }

    return data.sales;
  } catch (error) {
    console.error('[EbayCache] Error reading cache:', error);
    return null;
  }
}

/**
 * Cache eBay sales data for a card
 *
 * @param cardSlug - Unique card identifier
 * @param sales - eBay sale points to cache
 */
export async function cacheEbaySales(cardSlug: string, sales: EbaySalePoint[]): Promise<void> {
  try {
    const key = `${CACHE_PREFIX}${cardSlug}`;
    const now = Date.now();

    const data: CachedEbaySales = {
      sales,
      cachedAt: now,
      expiresAt: now + CACHE_TTL * 1000,
    };

    await redis.setex(key, CACHE_TTL, JSON.stringify(data));
  } catch (error) {
    console.error('[EbayCache] Error writing cache:', error);
    // Don't throw - caching failure should not break the app
  }
}

/**
 * Invalidate cached eBay data for a card
 * Used when manual refresh is requested or manipulation detected
 *
 * @param cardSlug - Unique card identifier
 */
export async function invalidateEbayCache(cardSlug: string): Promise<void> {
  try {
    const key = `${CACHE_PREFIX}${cardSlug}`;
    await redis.del(key);
  } catch (error) {
    console.error('[EbayCache] Error invalidating cache:', error);
  }
}

/**
 * Get cache statistics for monitoring
 */
export async function getEbayCacheStats(): Promise<{
  totalKeys: number;
  memoryUsage: number;
}> {
  try {
    const keys = await redis.keys(`${CACHE_PREFIX}*`);
    const info = await redis.info('memory');
    const memoryMatch = info.match(/used_memory:(\d+)/);
    const memoryUsage = memoryMatch ? parseInt(memoryMatch[1], 10) : 0;

    return {
      totalKeys: keys.length,
      memoryUsage,
    };
  } catch (error) {
    console.error('[EbayCache] Error getting stats:', error);
    return { totalKeys: 0, memoryUsage: 0 };
  }
}

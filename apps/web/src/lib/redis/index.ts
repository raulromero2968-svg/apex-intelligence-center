/**
 * Upstash Redis Client with Pub/Sub Support
 *
 * Global singleton for Redis operations including:
 * - Caching (price data, watchlist lookups)
 * - Pub/Sub (real-time price updates)
 * - Session management (JWT revocation)
 *
 * Production patterns from knowledge-10-api-realtime.md
 */

import { Redis } from '@upstash/redis';

// Environment validation
if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.warn(
    'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set. ' +
    'Redis features will be disabled.'
  );
}

/**
 * Global Redis client instance
 * Uses Upstash REST API for serverless compatibility
 */
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
}) as any;

/**
 * Redis key namespacing helpers
 */
export const RedisKeys = {
  // Price caching
  cardPrice: (cardId: string) => `card:${cardId}:price`,
  cardPriceHistory: (cardId: string) => `card:${cardId}:price:history`,

  // Watchlist
  userWatchlist: (userId: string) => `watchlist:user:${userId}`,
  cardWatchers: (cardId: string) => `watchlist:card:${cardId}`,

  // Pub/Sub channels
  priceUpdateChannel: (cardId: string) => `price:update:${cardId}`,
  globalPriceChannel: () => `price:update:*`,

  // Session management (used by JWT auth)
  sessionRevoked: (sessionId: string) => `session:revoked:${sessionId}`,

  // Rate limiting
  rateLimit: (identifier: string) => `ratelimit:${identifier}`,
} as const;

/**
 * Cache helpers with common TTLs
 */
export const CacheTTL = {
  PRICE_CURRENT: 60, // 1 minute for current prices
  PRICE_HISTORY: 3600, // 1 hour for historical data
  WATCHLIST: 300, // 5 minutes for watchlist cache
  SESSION_REVOKE: 7 * 24 * 60 * 60, // 7 days (max JWT lifetime)
} as const;

/**
 * Type-safe price update payload for pub/sub
 */
export interface PriceUpdatePayload {
  cardId: string;
  price: number;
  previousPrice?: number;
  changePercent: number;
  timestamp: string;
  source: string;
}

/**
 * Publish price update to Redis pub/sub
 *
 * @param cardId - Card ID to publish update for
 * @param payload - Price update data
 * @returns Number of subscribers that received the message
 */
export async function publishPriceUpdate(
  cardId: string,
  payload: PriceUpdatePayload
): Promise<number> {
  try {
    // NOTE: Upstash Redis REST API does not support pub/sub
    // For real-time updates, consider using Socket.IO or SSE instead
    // This is a no-op placeholder that maintains the interface
    console.warn('publishPriceUpdate called but Upstash REST Redis does not support pub/sub');
    return 0;
  } catch (error) {
    console.error('Failed to publish price update:', error);
    return 0;
  }
}

/**
 * Cache current price for a card
 *
 * @param cardId - Card ID
 * @param price - Current market price
 */
export async function cacheCardPrice(cardId: string, price: number): Promise<void> {
  try {
    const key = RedisKeys.cardPrice(cardId);
    await redis.set(key, price, { ex: CacheTTL.PRICE_CURRENT });
  } catch (error) {
    console.error('Failed to cache card price:', error);
  }
}

/**
 * Get cached price for a card
 *
 * @param cardId - Card ID
 * @returns Cached price or null if not found/expired
 */
export async function getCachedCardPrice(cardId: string): Promise<number | null> {
  try {
    const key = RedisKeys.cardPrice(cardId);
    const price = await redis.get(key);
    return price as number | null;
  } catch (error) {
    console.error('Failed to get cached card price:', error);
    return null;
  }
}

/**
 * Cache user's watchlist for fast lookups
 *
 * @param userId - User ID
 * @param cardIds - Array of card IDs in watchlist
 */
export async function cacheUserWatchlist(userId: string, cardIds: string[]): Promise<void> {
  try {
    const key = RedisKeys.userWatchlist(userId);
    await redis.set(key, JSON.stringify(cardIds), { ex: CacheTTL.WATCHLIST });
  } catch (error) {
    console.error('Failed to cache user watchlist:', error);
  }
}

/**
 * Get cached user watchlist
 *
 * @param userId - User ID
 * @returns Array of card IDs or null if not cached
 */
export async function getCachedUserWatchlist(userId: string): Promise<string[] | null> {
  try {
    const key = RedisKeys.userWatchlist(userId);
    const data = await redis.get(key);
    return data ? JSON.parse(data as string) : null;
  } catch (error) {
    console.error('Failed to get cached user watchlist:', error);
    return null;
  }
}

/**
 * Invalidate user's watchlist cache (call after add/remove)
 *
 * @param userId - User ID
 */
export async function invalidateUserWatchlistCache(userId: string): Promise<void> {
  try {
    const key = RedisKeys.userWatchlist(userId);
    await redis.del(key);
  } catch (error) {
    console.error('Failed to invalidate watchlist cache:', error);
  }
}

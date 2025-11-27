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

import { Redis as UpstashRedis } from '@upstash/redis';

// Re-export the Redis type for consumers
export type { Redis } from '@upstash/redis';

/**
 * Global Redis client instance
 * Uses Upstash REST API for serverless compatibility
 */
export const redis: UpstashRedis = new UpstashRedis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

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

  // Reality Check - Session Tracking
  sessionActivity: (userId: string) => `session:activity:${userId}`,
  realityCheckTrigger: () => `reality-check:global-trigger`,
  realityCheckAck: (userId: string) => `reality-check:ack:${userId}`,
  realityCheckChannel: () => `reality-check:trigger`,

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
  SESSION_ACTIVITY: 5, // 5 seconds (session heartbeat)
  REALITY_CHECK_TRIGGER: 3600, // 1 hour (global trigger TTL)
  REALITY_CHECK_ACK: 24 * 60 * 60, // 24 hours (user acknowledgment)
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
    const channel = RedisKeys.priceUpdateChannel(cardId);
    // Note: Upstash Redis REST API may not support PUBLISH directly
    // This is a placeholder - may need to use a different Redis client for pub/sub
    // @ts-ignore - publish may not be available in Upstash REST API
    // @ts-ignore - Redis type resolution issue
    const subscribers = await redis.publish(channel, JSON.stringify(payload));
    return (subscribers as number) ?? 0;
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
    // @ts-ignore - Upstash Redis types may be incomplete
    // @ts-ignore - Redis type resolution issue
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
    // @ts-ignore - Upstash Redis types may be incomplete
    const price = await redis.get<number>(key);
    return price;
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
    // @ts-ignore - Upstash Redis types may be incomplete
    // @ts-ignore - Redis type resolution issue
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
    // @ts-ignore - Upstash Redis types may be incomplete
    const data = await redis.get<string>(key);
    return data ? JSON.parse(data) : null;
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
    // @ts-ignore - Upstash Redis types may be incomplete
    // @ts-ignore - Redis type resolution issue
    await redis.del(key);
  } catch (error) {
    console.error('Failed to invalidate watchlist cache:', error);
  }
}

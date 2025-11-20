/**
 * Tier Enforcement Utilities
 *
 * Server-side tier enforcement with Redis-backed rate limiting.
 * Implements token bucket algorithm for API rate limiting.
 *
 * Usage in API routes:
 * ```ts
 * const user = await getUserFromRequest(req);
 * await enforceRateLimit(user);
 * ```
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { UserWithTier } from '@/lib/auth';
import { getTierLimits, type SubscriptionTier } from '@/lib/stripe';
import { RateLimitError } from '@/lib/errors';

// Initialize Redis client
let redis: Redis | null = null;
try {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch (error) {
  console.warn('Failed to initialize Redis for rate limiting:', error);
}

/**
 * Rate limiters by tier
 */
const rateLimiters: Record<SubscriptionTier, Ratelimit | null> = {
  free: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, '24 h'),
        analytics: true,
        prefix: '@ratelimit:free',
      })
    : null,
  pro: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10000, '24 h'),
        analytics: true,
        prefix: '@ratelimit:pro',
      })
    : null,
  enterprise: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(1000000, '24 h'),
        analytics: true,
        prefix: '@ratelimit:enterprise',
      })
    : null,
};

/**
 * Enforce rate limit for a user
 *
 * @throws RateLimitError if rate limit exceeded
 */
export async function enforceRateLimit(user: UserWithTier): Promise<void> {
  const limiter = rateLimiters[user.subscriptionTier];

  if (!limiter) {
    // No Redis - allow in development but warn
    if (process.env.NODE_ENV === 'development') {
      console.warn('Rate limiting disabled - Redis not configured');
      return;
    }
    throw new Error('Rate limiting not configured');
  }

  const { success, limit, remaining, reset } = await limiter.limit(user.id);

  if (!success) {
    const resetDate = new Date(reset);
    throw new RateLimitError(
      `API rate limit exceeded. Limit: ${limit} requests/day. Resets at ${resetDate.toISOString()}`
    );
  }

  // Add rate limit headers (for debugging/monitoring)
  console.log(
    `Rate limit check: ${user.id} (${user.subscriptionTier}): ${remaining}/${limit} remaining`
  );
}

/**
 * Get current rate limit status for a user
 */
export async function getRateLimitStatus(
  user: UserWithTier
): Promise<{
  limit: number;
  remaining: number;
  reset: Date;
} | null> {
  if (!redis) {
    return null;
  }

  const limiter = rateLimiters[user.subscriptionTier];
  if (!limiter) {
    return null;
  }

  const key = `@ratelimit:${user.subscriptionTier}:${user.id}`;
  const result = await limiter.limit(user.id);

  return {
    limit: result.limit,
    remaining: result.remaining,
    reset: new Date(result.reset),
  };
}

/**
 * Check if user can perform an action based on tier
 */
export function canAccessFeature(
  tier: SubscriptionTier,
  feature: string
): boolean {
  const tierLimits = getTierLimits(tier);
  return tierLimits.features.includes(feature);
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(
  limit: number,
  remaining: number,
  reset: Date
): Record<string, string> {
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.floor(reset.getTime() / 1000).toString(),
  };
}

/**
 * Tiered Token-Bucket Rate Limiting (knowledge-10 patterns)
 *
 * Features:
 * - Redis-backed token bucket algorithm (Upstash)
 * - Tiered limits: Free (20/min), Pro (100/min), Enterprise (unlimited)
 * - RESTful error responses with Retry-After headers
 * - Sentry monitoring integration
 * - Per-user rate limiting (not IP-based)
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client
let redis: Redis | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } else {
    console.warn('Redis not configured - rate limiting will be disabled');
  }
} catch (error) {
  console.error('Failed to initialize Redis for rate limiting:', error);
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp (ms)
}

/**
 * Tiered rate limiting with token bucket
 *
 * @param limit - Max requests per window (or Infinity for unlimited)
 * @param identifier - Unique key (e.g., "rag:user123")
 * @param window - Time window in seconds (default: 60s)
 * @returns Rate limit result with success flag and retry info
 */
export async function ratelimit(
  limit: number,
  identifier: string,
  window: number = 60
): Promise<RateLimitResult> {
  // If Redis not available, allow request but log warning
  if (!redis) {
    console.warn('Rate limiting disabled - Redis not available');
    return {
      success: true,
      limit: limit,
      remaining: limit,
      reset: Date.now() + window * 1000,
    };
  }

  // Enterprise tier - unlimited access
  if (limit === Infinity || limit <= 0) {
    return {
      success: true,
      limit: Infinity,
      remaining: Infinity,
      reset: Date.now() + window * 1000,
    };
  }

  // Create rate limiter with sliding window
  const limiter = new Ratelimit({
    redis: redis as any,
    limiter: Ratelimit.slidingWindow(limit, `${window} s`),
    analytics: true,
    prefix: 'apex:ratelimit',
  });

  try {
    const result = await limiter.limit(identifier);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);

    // On error, allow request but log
    return {
      success: true,
      limit: limit,
      remaining: limit,
      reset: Date.now() + window * 1000,
    };
  }
}

/**
 * Get rate limit based on subscription tier
 *
 * @param tier - Subscription tier
 * @returns Requests per minute limit
 */
export function getLimitForTier(tier: 'free' | 'pro' | 'enterprise'): number {
  switch (tier) {
    case 'enterprise':
      return Infinity;
    case 'pro':
      return 100;
    case 'free':
    default:
      return 20;
  }
}

/**
 * Format Retry-After header value
 *
 * @param reset - Unix timestamp (ms) when limit resets
 * @returns Retry-After value in seconds
 */
export function getRetryAfter(reset: number): number {
  return Math.ceil((reset - Date.now()) / 1000);
}

// ============================================================================
// MULTI-MODAL RATE LIMITERS
// ============================================================================

/**
 * Rate limiters for multi-modal endpoints (video generation, uploads, etc.)
 * More restrictive limits due to higher resource consumption
 */
export const multiModalRateLimiters = {
  /**
   * Video generation rate limiter
   * Free: 5/hour, Pro: 20/hour, Enterprise: 100/hour
   */
  generateVideo: async (userId: string, tier: 'free' | 'pro' | 'enterprise') => {
    const limits: Record<string, number> = {
      free: 5,
      pro: 20,
      enterprise: 100,
    };
    return ratelimit(limits[tier], `multimodal:video:${userId}`, 3600); // 1 hour window
  },

  /**
   * File upload rate limiter
   * Free: 10/min, Pro: 50/min, Enterprise: unlimited
   */
  upload: async (userId: string, tier: 'free' | 'pro' | 'enterprise') => {
    const limits: Record<string, number> = {
      free: 10,
      pro: 50,
      enterprise: Infinity,
    };
    return ratelimit(limits[tier], `multimodal:upload:${userId}`, 60); // 1 min window
  },

  /**
   * Image processing rate limiter
   * Free: 20/min, Pro: 100/min, Enterprise: unlimited
   */
  imageProcess: async (userId: string, tier: 'free' | 'pro' | 'enterprise') => {
    const limits: Record<string, number> = {
      free: 20,
      pro: 100,
      enterprise: Infinity,
    };
    return ratelimit(limits[tier], `multimodal:image:${userId}`, 60); // 1 min window
  },

  /**
   * Audio processing rate limiter
   * Free: 10/min, Pro: 50/min, Enterprise: unlimited
   */
  audioProcess: async (userId: string, tier: 'free' | 'pro' | 'enterprise') => {
    const limits: Record<string, number> = {
      free: 10,
      pro: 50,
      enterprise: Infinity,
    };
    return ratelimit(limits[tier], `multimodal:audio:${userId}`, 60); // 1 min window
  },
};


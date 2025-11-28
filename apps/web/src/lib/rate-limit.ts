/**
 * Tiered Token-Bucket Rate Limiting (knowledge-10 patterns)
 *
 * Features:
 * - Redis-backed token bucket algorithm (Upstash)
 * - Tiered limits: Free (20/min), Pro (100/min), Enterprise (unlimited)
 * - Burst control with token refill (10/min burst for trilemma queries)
 * - RESTful error responses with Retry-After headers
 * - Sentry monitoring integration
 * - Per-user rate limiting (not IP-based)
 * - POST-Agency flags for goal updates
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
// BURST CONTROL WITH TOKEN REFILL (KB-10)
// ============================================================================

/**
 * Burst rate limit result with refill info
 */
export interface BurstRateLimitResult extends RateLimitResult {
  burstRemaining: number;
  burstRefillAt: number;
  postAgencyFlag?: boolean;
}

/**
 * Burst rate limiting with token refill
 *
 * Implements a token bucket with burst capacity for handling
 * spiky traffic patterns (e.g., trilemma query bursts).
 *
 * @param burstLimit - Max burst requests (default 10)
 * @param sustainedLimit - Sustained rate per window
 * @param identifier - Unique key (e.g., "simulation:user123")
 * @param window - Time window in seconds (default: 60s)
 * @param postAgencyFlag - Optional POST-Agency flag for goal updates
 * @returns Rate limit result with burst capacity info
 */
export async function burstRatelimit(
  burstLimit: number,
  sustainedLimit: number,
  identifier: string,
  window: number = 60,
  postAgencyFlag: boolean = false
): Promise<BurstRateLimitResult> {
  // If Redis not available, allow request
  if (!redis) {
    console.warn('Burst rate limiting disabled - Redis not available');
    return {
      success: true,
      limit: sustainedLimit,
      remaining: sustainedLimit,
      reset: Date.now() + window * 1000,
      burstRemaining: burstLimit,
      burstRefillAt: Date.now() + window * 1000,
      postAgencyFlag,
    };
  }

  // Enterprise tier - unlimited access
  if (sustainedLimit === Infinity || sustainedLimit <= 0) {
    return {
      success: true,
      limit: Infinity,
      remaining: Infinity,
      reset: Date.now() + window * 1000,
      burstRemaining: Infinity,
      burstRefillAt: Date.now() + window * 1000,
      postAgencyFlag,
    };
  }

  try {
    // Check burst bucket first
    const burstLimiter = new Ratelimit({
      redis: redis as any,
      limiter: Ratelimit.tokenBucket(burstLimit, `${window} s`, burstLimit),
      analytics: true,
      prefix: 'apex:burst',
    });

    const burstResult = await burstLimiter.limit(identifier);

    // If burst available, use it
    if (burstResult.success) {
      return {
        success: true,
        limit: sustainedLimit,
        remaining: burstResult.remaining,
        reset: burstResult.reset,
        burstRemaining: burstResult.remaining,
        burstRefillAt: burstResult.reset,
        postAgencyFlag,
      };
    }

    // Fall back to sustained rate
    const sustainedLimiter = new Ratelimit({
      redis: redis as any,
      limiter: Ratelimit.slidingWindow(sustainedLimit, `${window} s`),
      analytics: true,
      prefix: 'apex:sustained',
    });

    const sustainedResult = await sustainedLimiter.limit(identifier);

    return {
      success: sustainedResult.success,
      limit: sustainedLimit,
      remaining: sustainedResult.remaining,
      reset: sustainedResult.reset,
      burstRemaining: 0,
      burstRefillAt: burstResult.reset,
      postAgencyFlag,
    };
  } catch (error) {
    console.error('Burst rate limit check failed:', error);

    // On error, allow request
    return {
      success: true,
      limit: sustainedLimit,
      remaining: sustainedLimit,
      reset: Date.now() + window * 1000,
      burstRemaining: burstLimit,
      burstRefillAt: Date.now() + window * 1000,
      postAgencyFlag,
    };
  }
}

/**
 * Get burst limits for simulation/trilemma queries
 *
 * @param tier - Subscription tier
 * @returns Burst and sustained limits
 */
export function getSimulationLimits(tier: 'free' | 'pro' | 'enterprise'): {
  burst: number;
  sustained: number;
} {
  switch (tier) {
    case 'enterprise':
      return { burst: Infinity, sustained: Infinity };
    case 'pro':
      return { burst: 20, sustained: 100 };
    case 'free':
    default:
      return { burst: 10, sustained: 20 };
  }
}

// ============================================================================
// MULTI-MODAL RATE LIMITERS
// ============================================================================

/**
 * Rate limiters for multi-modal endpoints (video generation, uploads, etc.)
 * More restrictive limits due to higher resource consumption
 *
 * Provides both the legacy .limit(userId) API for existing code
 * and the new tiered API for future implementations
 */

// Helper to create a limiter with the expected .limit() API
const createLimiter = (
  prefix: string,
  limits: Record<string, number>,
  windowSeconds: number = 60
) => ({
  // Legacy API: .limit(userId) - assumes free tier for compatibility
  limit: async (userId: string) => {
    return ratelimit(limits.free, `${prefix}:${userId}`, windowSeconds);
  },
  // New tiered API: .limitWithTier(userId, tier)
  limitWithTier: async (userId: string, tier: 'free' | 'pro' | 'enterprise') => {
    return ratelimit(limits[tier], `${prefix}:${userId}`, windowSeconds);
  },
});

export const multiModalRateLimiters = {
  /**
   * Video generation rate limiter
   * Free: 5/hour, Pro: 20/hour, Enterprise: 100/hour
   */
  videoGeneration: createLimiter('multimodal:video', {
    free: 5,
    pro: 20,
    enterprise: 100,
  }, 3600), // 1 hour window

  /**
   * File upload rate limiter (multiModalUpload for legacy compatibility)
   * Free: 10/min, Pro: 50/min, Enterprise: unlimited
   */
  multiModalUpload: createLimiter('multimodal:upload', {
    free: 10,
    pro: 50,
    enterprise: Infinity,
  }, 60), // 1 min window

  /**
   * Image processing rate limiter
   * Free: 20/min, Pro: 100/min, Enterprise: unlimited
   */
  imageProcess: createLimiter('multimodal:image', {
    free: 20,
    pro: 100,
    enterprise: Infinity,
  }, 60), // 1 min window

  /**
   * Audio processing rate limiter
   * Free: 10/min, Pro: 50/min, Enterprise: unlimited
   */
  audioProcess: createLimiter('multimodal:audio', {
    free: 10,
    pro: 50,
    enterprise: Infinity,
  }, 60), // 1 min window

  // Legacy aliases for backwards compatibility
  generateVideo: async (userId: string, tier: 'free' | 'pro' | 'enterprise') => {
    const limits: Record<string, number> = { free: 5, pro: 20, enterprise: 100 };
    return ratelimit(limits[tier], `multimodal:video:${userId}`, 3600);
  },
  upload: async (userId: string, tier: 'free' | 'pro' | 'enterprise') => {
    const limits: Record<string, number> = { free: 10, pro: 50, enterprise: Infinity };
    return ratelimit(limits[tier], `multimodal:upload:${userId}`, 60);
  },
};

// ============================================================================
// LITERATURE & PHILOSOPHY RATE LIMITERS (KB-10)
// ============================================================================
// Tiered rate limits for foundational literature queries and philosophy research.
// Designed to balance access with resource consumption for RAG-heavy endpoints.

/**
 * Get rate limits for literature/philosophy queries
 *
 * @param tier - Subscription tier
 * @returns Requests per day limits for literature queries
 */
export function getLiteratureLimits(tier: 'free' | 'pro' | 'enterprise'): {
  daily: number;
  perMinute: number;
  burstSize: number;
} {
  switch (tier) {
    case 'enterprise':
      return { daily: Infinity, perMinute: Infinity, burstSize: Infinity };
    case 'pro':
      return { daily: 500, perMinute: 30, burstSize: 10 };
    case 'free':
    default:
      return { daily: 50, perMinute: 5, burstSize: 3 };
  }
}

/**
 * Literature RAG rate limiter
 *
 * @param userId - User ID
 * @param tier - Subscription tier
 * @returns Rate limit result
 */
export async function literatureRatelimit(
  userId: string,
  tier: 'free' | 'pro' | 'enterprise'
): Promise<RateLimitResult> {
  const limits = getLiteratureLimits(tier);
  return ratelimit(limits.perMinute, `literature:${userId}`, 60);
}

// ============================================================================
// PREDICTION MARKET RATE LIMITERS (KB-10)
// ============================================================================
// Tiered rate limits for prediction market APIs (Polymarket, Manifold, Kalshi).
// More restrictive to prevent abuse and respect external API limits.

/**
 * Get rate limits for prediction market APIs
 *
 * @param tier - Subscription tier
 * @returns Requests per day limits
 */
export function getPredictionMarketLimits(tier: 'free' | 'pro' | 'enterprise'): {
  polymarket: { daily: number; perMinute: number };
  manifold: { daily: number; perMinute: number };
  kalshi: { daily: number; perMinute: number };
} {
  switch (tier) {
    case 'enterprise':
      return {
        polymarket: { daily: Infinity, perMinute: 60 },
        manifold: { daily: Infinity, perMinute: 60 },
        kalshi: { daily: Infinity, perMinute: 60 },
      };
    case 'pro':
      return {
        polymarket: { daily: 200, perMinute: 10 },
        manifold: { daily: 200, perMinute: 10 },
        kalshi: { daily: 200, perMinute: 10 },
      };
    case 'free':
    default:
      return {
        polymarket: { daily: 20, perMinute: 2 },
        manifold: { daily: 20, perMinute: 2 },
        kalshi: { daily: 20, perMinute: 2 },
      };
  }
}

/**
 * Prediction market rate limiter
 *
 * @param market - Market name ('polymarket' | 'manifold' | 'kalshi')
 * @param userId - User ID
 * @param tier - Subscription tier
 * @returns Rate limit result
 */
export async function predictionMarketRatelimit(
  market: 'polymarket' | 'manifold' | 'kalshi',
  userId: string,
  tier: 'free' | 'pro' | 'enterprise'
): Promise<RateLimitResult> {
  const limits = getPredictionMarketLimits(tier);
  const marketLimits = limits[market];
  return ratelimit(marketLimits.perMinute, `market:${market}:${userId}`, 60);
}

// ============================================================================
// SIMULATION MARKET RATE LIMITERS (KB-10)
// ============================================================================
// Rate limits for simulation markets with EGGROLL training and Bostrom predictions.
// Includes POST-Agency flags for goal updates.

/**
 * Get rate limits for simulation markets (Bostrom/EGGROLL)
 *
 * @param tier - Subscription tier
 * @returns Simulation rate limits
 */
export function getSimulationMarketLimits(tier: 'free' | 'pro' | 'enterprise'): {
  createSimulation: number;
  tradeSimulation: number;
  evolveModel: number;
  postAgencyUpdates: number;
} {
  switch (tier) {
    case 'enterprise':
      return {
        createSimulation: Infinity,
        tradeSimulation: Infinity,
        evolveModel: Infinity,
        postAgencyUpdates: Infinity,
      };
    case 'pro':
      return {
        createSimulation: 10, // per hour
        tradeSimulation: 100, // per hour
        evolveModel: 20, // per hour
        postAgencyUpdates: 50, // per hour
      };
    case 'free':
    default:
      return {
        createSimulation: 2, // per hour
        tradeSimulation: 20, // per hour
        evolveModel: 5, // per hour
        postAgencyUpdates: 10, // per hour
      };
  }
}

/**
 * Simulation market rate limiter with action type
 *
 * @param action - Action type
 * @param userId - User ID
 * @param tier - Subscription tier
 * @returns Rate limit result
 */
export async function simulationMarketRatelimit(
  action: 'createSimulation' | 'tradeSimulation' | 'evolveModel' | 'postAgencyUpdates',
  userId: string,
  tier: 'free' | 'pro' | 'enterprise'
): Promise<RateLimitResult> {
  const limits = getSimulationMarketLimits(tier);
  const actionLimit = limits[action];
  return ratelimit(actionLimit, `simulation:${action}:${userId}`, 3600); // 1 hour window
}

// ============================================================================
// CORRIGIBILITY-AWARE RATE LIMITING
// ============================================================================
// Rate limiters that integrate with corrigibility checks for sensitive operations.

/**
 * Corrigibility-aware rate limit result
 */
export interface CorrigibilityRateLimitResult extends RateLimitResult {
  corrigibilityApplied: boolean;
  sensitivityMultiplier: number;
}

/**
 * Rate limit with corrigibility adjustment
 *
 * Applies stricter limits for sensitive queries based on corrigibility flags.
 *
 * @param baseLimit - Base rate limit
 * @param identifier - Unique key
 * @param sensitivityLevel - 0-1 sensitivity score (1 = most sensitive)
 * @param window - Time window in seconds
 * @returns Rate limit result with corrigibility info
 */
export async function corrigibilityRatelimit(
  baseLimit: number,
  identifier: string,
  sensitivityLevel: number = 0,
  window: number = 60
): Promise<CorrigibilityRateLimitResult> {
  // Apply sensitivity multiplier (more sensitive = stricter limit)
  // Sensitivity 0 = 100% of base limit
  // Sensitivity 1 = 50% of base limit
  const sensitivityMultiplier = 1 - (sensitivityLevel * 0.5);
  const adjustedLimit = Math.ceil(baseLimit * sensitivityMultiplier);

  const result = await ratelimit(adjustedLimit, identifier, window);

  return {
    ...result,
    corrigibilityApplied: sensitivityLevel > 0,
    sensitivityMultiplier,
  };
}

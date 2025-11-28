/**
 * Polymarket API Integration Route (KB-10 patterns)
 *
 * Provides integration with Polymarket prediction markets API:
 * - Fetch real-time event odds for TCG simulations
 * - Cache responses with tiered TTL
 * - Tiered rate limiting (free: 5/day, pro: 50/day)
 *
 * Features:
 * - Secure JWT authentication (KB-05)
 * - Tiered rate limiting (KB-10)
 * - Redis caching for API responses
 * - Error handling with Sentry
 *
 * References:
 * - Polymarket API: https://docs.polymarket.com/
 * - Bostrom's Trilemma: Existential predictions for simulation markets
 *
 * @module api/markets/polymarket
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import type { Scope } from '@sentry/types';
import { Redis } from '@upstash/redis';
import { getUserFromRequest, UserWithTier } from '@/lib/auth';
import { ratelimit, getRetryAfter } from '@/lib/rate-limit';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Polymarket API base URLs
 */
const POLYMARKET_GAMMA_API = 'https://gamma-api.polymarket.com';

/**
 * Rate limits by tier (requests per day)
 */
const POLYMARKET_LIMITS: Record<string, number> = {
  free: 5,
  pro: 50,
  enterprise: Infinity,
};

/**
 * Cache TTL by tier (seconds)
 */
const CACHE_TTL: Record<string, number> = {
  free: 3600, // 1 hour for free tier
  pro: 300, // 5 minutes for pro
  enterprise: 60, // 1 minute for enterprise
};

// ============================================================================
// REDIS CLIENT
// ============================================================================

let redis: Redis | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch (error) {
  console.warn('Redis not configured for Polymarket cache');
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for fetching event by ID
 */
const GetEventSchema = z.object({
  eventId: z.string().min(1, 'Event ID required'),
});

/**
 * Schema for searching markets
 */
const SearchMarketsSchema = z.object({
  query: z.string().min(1).max(200).optional(),
  category: z.string().optional(),
  active: z.boolean().optional().default(true),
  limit: z.number().int().min(1).max(50).optional().default(10),
  offset: z.number().int().min(0).optional().default(0),
});

// ============================================================================
// TYPES
// ============================================================================

interface PolymarketEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  endDate: string;
  outcomes: Array<{
    outcome: string;
    price: number;
  }>;
  volume: number;
  liquidity: number;
  active: boolean;
}

interface CachedResponse<T> {
  data: T;
  cachedAt: string;
  expiresAt: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get cache key for Polymarket request
 */
function getCacheKey(type: string, identifier: string): string {
  return `polymarket:${type}:${identifier}`;
}

/**
 * Get rate limit for Polymarket based on tier
 */
function getPolymarketLimit(tier: string): number {
  return POLYMARKET_LIMITS[tier] || POLYMARKET_LIMITS.free;
}

/**
 * Fetch from cache or API
 */
async function fetchWithCache<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttl: number
): Promise<{ data: T; cached: boolean }> {
  // Try cache first
  if (redis) {
    try {
      const cached = await redis.get<CachedResponse<T>>(cacheKey);
      if (cached && new Date(cached.expiresAt) > new Date()) {
        return { data: cached.data, cached: true };
      }
    } catch (error) {
      console.warn('Cache read failed:', error);
    }
  }

  // Fetch fresh data
  const data = await fetchFn();

  // Cache the result
  if (redis) {
    try {
      const cachedResponse: CachedResponse<T> = {
        data,
        cachedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
      };
      await redis.set(cacheKey, cachedResponse, { ex: ttl });
    } catch (error) {
      console.warn('Cache write failed:', error);
    }
  }

  return { data, cached: false };
}

/**
 * Apply secure headers to response
 */
function secureHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  return response;
}

// ============================================================================
// GET - Fetch Polymarket event by ID or search markets
// ============================================================================

/**
 * GET /api/markets/polymarket
 *
 * Fetch Polymarket event data by ID or search markets.
 *
 * @example
 * ```bash
 * # Get specific event
 * curl "/api/markets/polymarket?eventId=abc123" \
 *   -H "Authorization: Bearer <token>"
 *
 * # Search markets
 * curl "/api/markets/polymarket?query=bitcoin&limit=10" \
 *   -H "Authorization: Bearer <token>"
 * ```
 */
export async function GET(request: NextRequest) {
  let user: UserWithTier | null = null;

  try {
    // Step 1: Authentication (KB-05)
    user = await getUserFromRequest(request);

    if (!user) {
      return secureHeaders(
        NextResponse.json(
          { error: 'Unauthorized', message: 'Valid authentication required' },
          { status: 401 }
        )
      );
    }

    // Step 2: Rate limiting (KB-10 tiered)
    const limit = getPolymarketLimit(user.subscriptionTier);
    const { success, reset, remaining } = await ratelimit(
      limit,
      `polymarket:${user.id}`,
      86400 // 24 hour window
    );

    if (!success) {
      Sentry.withScope((scope: Scope) => {
        scope.setUser({ id: user!.id, email: user!.email });
        scope.setTag('rate_limit', 'polymarket_exceeded');
      });

      return secureHeaders(
        NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: `You have exceeded your ${user.subscriptionTier} tier limit for Polymarket API (${limit}/day)`,
            retryAfter: getRetryAfter(reset),
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(getRetryAfter(reset)),
              'X-RateLimit-Limit': String(limit),
              'X-RateLimit-Remaining': '0',
            },
          }
        )
      );
    }

    // Step 3: Parse query parameters
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    // Determine TTL based on tier
    const ttl = CACHE_TTL[user.subscriptionTier] || CACHE_TTL.free;

    if (eventId) {
      // Fetch specific event
      const parsed = GetEventSchema.safeParse({ eventId });
      if (!parsed.success) {
        return secureHeaders(
          NextResponse.json(
            { error: 'Invalid request', details: parsed.error.issues },
            { status: 400 }
          )
        );
      }

      const cacheKey = getCacheKey('event', eventId);
      const { data, cached } = await fetchWithCache<PolymarketEvent>(
        cacheKey,
        async () => {
          // Fetch from Polymarket API
          const response = await fetch(
            `${POLYMARKET_GAMMA_API}/events/${eventId}`,
            {
              headers: {
                'Accept': 'application/json',
              },
              next: { revalidate: ttl },
            }
          );

          if (!response.ok) {
            if (response.status === 404) {
              throw new Error(`Event not found: ${eventId}`);
            }
            throw new Error(`Polymarket API error: ${response.status}`);
          }

          return response.json();
        },
        ttl
      );

      Sentry.addBreadcrumb({
        category: 'polymarket',
        level: 'info',
        message: 'Event fetched',
        data: { eventId, cached },
      });

      return secureHeaders(
        NextResponse.json({
          event: data,
          metadata: {
            cached,
            tier: user.subscriptionTier,
            cacheTtl: ttl,
          },
          rateLimit: { limit, remaining, reset },
        })
      );
    } else {
      // Search markets
      const searchParsed = SearchMarketsSchema.safeParse({
        query: searchParams.get('query') || undefined,
        category: searchParams.get('category') || undefined,
        active: searchParams.get('active') !== 'false',
        limit: parseInt(searchParams.get('limit') || '10'),
        offset: parseInt(searchParams.get('offset') || '0'),
      });

      if (!searchParsed.success) {
        return secureHeaders(
          NextResponse.json(
            { error: 'Invalid request', details: searchParsed.error.issues },
            { status: 400 }
          )
        );
      }

      const { query, category, active, limit: resultLimit, offset } = searchParsed.data;

      // Build cache key from search params
      const cacheKeyParts = [
        query || 'all',
        category || 'all',
        active ? 'active' : 'all',
        resultLimit,
        offset,
      ];
      const cacheKey = getCacheKey('search', cacheKeyParts.join(':'));

      const { data: markets, cached } = await fetchWithCache<PolymarketEvent[]>(
        cacheKey,
        async () => {
          // Build query string
          const queryParams = new URLSearchParams();
          if (query) queryParams.set('q', query);
          if (category) queryParams.set('category', category);
          queryParams.set('active', String(active));
          queryParams.set('limit', String(resultLimit));
          queryParams.set('offset', String(offset));

          const response = await fetch(
            `${POLYMARKET_GAMMA_API}/markets?${queryParams.toString()}`,
            {
              headers: {
                'Accept': 'application/json',
              },
              next: { revalidate: ttl },
            }
          );

          if (!response.ok) {
            throw new Error(`Polymarket API error: ${response.status}`);
          }

          return response.json();
        },
        ttl
      );

      Sentry.addBreadcrumb({
        category: 'polymarket',
        level: 'info',
        message: 'Markets searched',
        data: { query, resultsCount: markets.length, cached },
      });

      return secureHeaders(
        NextResponse.json({
          markets,
          metadata: {
            query,
            category,
            active,
            limit: resultLimit,
            offset,
            resultsCount: markets.length,
            cached,
            tier: user.subscriptionTier,
            cacheTtl: ttl,
          },
          rateLimit: { limit, remaining, reset },
        })
      );
    }
  } catch (error) {
    Sentry.withScope((scope: Scope) => {
      if (user) {
        scope.setUser({ id: user.id, email: user.email });
      }
      Sentry.captureException(error);
    });

    // Handle specific error types
    if (error instanceof Error && error.message.includes('not found')) {
      return secureHeaders(
        NextResponse.json(
          { error: 'Not found', message: error.message },
          { status: 404 }
        )
      );
    }

    return secureHeaders(
      NextResponse.json(
        {
          error: 'Polymarket fetch failed',
          message:
            process.env.NODE_ENV === 'development'
              ? error instanceof Error
                ? error.message
                : 'Unknown error'
              : 'An unexpected error occurred',
        },
        { status: 500 }
      )
    );
  }
}

// ============================================================================
// POST - Sync Polymarket data for TCG simulations
// ============================================================================

/**
 * POST /api/markets/polymarket
 *
 * Sync Polymarket event data for use in TCG simulations.
 * Stores event odds in the local database for correlation analysis.
 *
 * @example
 * ```bash
 * curl -X POST /api/markets/polymarket \
 *   -H "Authorization: Bearer <token>" \
 *   -d '{"eventIds": ["abc123", "def456"]}'
 * ```
 */
export async function POST(request: NextRequest) {
  let user: UserWithTier | null = null;

  try {
    // Step 1: Authentication
    user = await getUserFromRequest(request);

    if (!user) {
      return secureHeaders(
        NextResponse.json(
          { error: 'Unauthorized', message: 'Valid authentication required' },
          { status: 401 }
        )
      );
    }

    // Step 2: Pro/Enterprise only for sync
    if (user.subscriptionTier === 'free') {
      return secureHeaders(
        NextResponse.json(
          {
            error: 'Forbidden',
            message: 'Market sync requires Pro or Enterprise subscription',
          },
          { status: 403 }
        )
      );
    }

    // Step 3: Rate limiting (stricter for sync)
    const limit = Math.floor(getPolymarketLimit(user.subscriptionTier) / 5);
    const { success, reset, remaining } = await ratelimit(
      limit,
      `polymarket:sync:${user.id}`,
      86400
    );

    if (!success) {
      return secureHeaders(
        NextResponse.json(
          { error: 'Rate limit exceeded', retryAfter: getRetryAfter(reset) },
          { status: 429 }
        )
      );
    }

    // Step 4: Validate request
    const body = await request.json();
    const SyncSchema = z.object({
      eventIds: z.array(z.string()).min(1).max(10),
    });

    const parsed = SyncSchema.safeParse(body);
    if (!parsed.success) {
      return secureHeaders(
        NextResponse.json(
          { error: 'Invalid request', details: parsed.error.issues },
          { status: 400 }
        )
      );
    }

    const { eventIds } = parsed.data;

    // Step 5: Fetch and sync events
    const syncResults: Array<{
      eventId: string;
      status: 'synced' | 'failed';
      error?: string;
    }> = [];

    for (const eventId of eventIds) {
      try {
        const response = await fetch(
          `${POLYMARKET_GAMMA_API}/events/${eventId}`,
          {
            headers: { 'Accept': 'application/json' },
          }
        );

        if (!response.ok) {
          syncResults.push({
            eventId,
            status: 'failed',
            error: `API error: ${response.status}`,
          });
          continue;
        }

        const eventData = await response.json();

        // TODO: Store in polymarket_events table via db.insert()
        // For now, cache in Redis
        if (redis) {
          const cacheKey = getCacheKey('event', eventId);
          await redis.set(
            cacheKey,
            {
              data: eventData,
              cachedAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
            },
            { ex: 3600 }
          );
        }

        syncResults.push({ eventId, status: 'synced' });
      } catch (error) {
        syncResults.push({
          eventId,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const syncedCount = syncResults.filter((r) => r.status === 'synced').length;

    Sentry.addBreadcrumb({
      category: 'polymarket',
      level: 'info',
      message: 'Markets synced',
      data: {
        total: eventIds.length,
        synced: syncedCount,
        failed: eventIds.length - syncedCount,
      },
    });

    return secureHeaders(
      NextResponse.json({
        syncResults,
        metadata: {
          totalRequested: eventIds.length,
          synced: syncedCount,
          failed: eventIds.length - syncedCount,
        },
        rateLimit: { limit, remaining, reset },
      })
    );
  } catch (error) {
    Sentry.withScope((scope: Scope) => {
      if (user) {
        scope.setUser({ id: user.id, email: user.email });
      }
      Sentry.captureException(error);
    });

    return secureHeaders(
      NextResponse.json(
        {
          error: 'Sync failed',
          message:
            process.env.NODE_ENV === 'development'
              ? error instanceof Error
                ? error.message
                : 'Unknown error'
              : 'An unexpected error occurred',
        },
        { status: 500 }
      )
    );
  }
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';

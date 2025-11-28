/**
 * Kalshi Prediction Markets API Route
 *
 * Integrates with Kalshi's regulated prediction market API for simulation market predictions.
 * Combines with TCG simulation models for Bostrom trilemma-inspired forecasting.
 *
 * Kalshi Overview:
 * - US-regulated prediction market (CFTC-registered)
 * - Binary outcome contracts (yes/no events)
 * - Focus: Elections, weather, economic indicators
 * - API: REST with OAuth2/token authentication
 *
 * Integration with Apex:
 * - Fetch real-time market odds from Kalshi
 * - Hybrid with TCG simulation models for "simulated reality" predictions
 * - Tiered rate limiting (free: 5/day, pro: 50/day)
 *
 * Trade-offs:
 * - GOOD: Kalshi's regulation ensures ethical markets (FHI alignment)
 * - BAD: Limited to US events; complement with Manifold for global simulations
 * - ETHICAL: Follow longtermist principles, avoid speculation on harm
 *
 * From knowledge-10-api-architecture.md (KB-10 patterns)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { redis } from '@/lib/redis';
import * as Sentry from '@sentry/nextjs';
import type { Span } from '@sentry/types';

// ============================================================================
// Runtime Configuration
// ============================================================================

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================================
// Validation Schemas (KB-10: input validation)
// ============================================================================

const KalshiQuerySchema = z.object({
  eventId: z.string().optional(),
  seriesTicker: z.string().optional(),
  status: z.enum(['open', 'closed', 'settled']).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

const KalshiActionSchema = z.object({
  action: z.enum(['list-markets', 'get-event', 'get-series', 'health']),
  params: z.record(z.any()).optional(),
});

// ============================================================================
// Types
// ============================================================================

interface KalshiMarket {
  ticker: string;
  title: string;
  subtitle?: string;
  yes_price: number; // 0-100 cents
  no_price: number;
  volume: number;
  open_interest: number;
  status: string;
  close_time?: string;
  result?: 'yes' | 'no';
  category?: string;
}

interface KalshiEvent {
  event_ticker: string;
  title: string;
  mutually_exclusive: boolean;
  markets: KalshiMarket[];
  category?: string;
}

interface KalshiAPIResponse<T> {
  cursor?: string;
  data?: T;
  markets?: KalshiMarket[];
  event?: KalshiEvent;
  error?: string;
}

interface RateLimitData {
  tokens: number;
  lastRefill: number;
}

// ============================================================================
// Rate Limiting (KB-10: tiered rate limiting)
// ============================================================================

/**
 * Tiered rate limiting configuration
 * - free: 5 requests/day (burst: 2/min)
 * - pro: 50 requests/day (burst: 10/min)
 * - enterprise: 500 requests/day (burst: 50/min)
 */
const RATE_LIMIT_CONFIG = {
  free: { daily: 5, burst: 2, burstWindow: 60 },
  pro: { daily: 50, burst: 10, burstWindow: 60 },
  enterprise: { daily: 500, burst: 50, burstWindow: 60 },
} as const;

type UserTier = keyof typeof RATE_LIMIT_CONFIG;

/**
 * Check and consume rate limit tokens
 */
async function checkRateLimit(
  userId: string,
  tier: UserTier = 'free'
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  // Check if Redis URL is configured
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    // No Redis = no rate limiting (development mode)
    return { allowed: true, remaining: 999, resetAt: 0 };
  }

  const config = RATE_LIMIT_CONFIG[tier];
  const dailyKey = `rate:kalshi:daily:${userId}`;
  const burstKey = `rate:kalshi:burst:${userId}`;
  const now = Date.now();

  try {
    // Check daily limit
    // @ts-ignore - Upstash Redis types may be incomplete
    const dailyRaw = await redis.get(dailyKey);
    const dailyData = dailyRaw as RateLimitData | null;
    const dailyTokens = dailyData?.tokens ?? config.daily;

    if (dailyTokens <= 0) {
      const resetAt = dailyData?.lastRefill ?? now + 86400000;
      return { allowed: false, remaining: 0, resetAt };
    }

    // Check burst limit
    // @ts-ignore - Upstash Redis types may be incomplete
    const burstRaw = await redis.get(burstKey);
    const burstData = burstRaw as RateLimitData | null;
    const burstTokens = burstData?.tokens ?? config.burst;

    if (burstTokens <= 0) {
      const resetAt = burstData?.lastRefill ?? now + config.burstWindow * 1000;
      return { allowed: false, remaining: dailyTokens, resetAt };
    }

    // Consume tokens
    await Promise.all([
      // @ts-ignore - Upstash Redis types may be incomplete
      redis.set(dailyKey, JSON.stringify({ tokens: dailyTokens - 1, lastRefill: now }), { ex: 86400 }),
      // @ts-ignore - Upstash Redis types may be incomplete
      redis.set(burstKey, JSON.stringify({ tokens: burstTokens - 1, lastRefill: now }), { ex: config.burstWindow }),
    ]);

    return { allowed: true, remaining: dailyTokens - 1, resetAt: 0 };
  } catch (error) {
    console.error('[Kalshi] Rate limit check failed:', error);
    return { allowed: true, remaining: 999, resetAt: 0 }; // Fail open
  }
}

/**
 * Extract user tier from JWT claims or headers
 */
function getUserTier(request: NextRequest): UserTier {
  // In production, extract from JWT claims: { role: 'pro', ... }
  const tierHeader = request.headers.get('x-user-tier');
  if (tierHeader && tierHeader in RATE_LIMIT_CONFIG) {
    return tierHeader as UserTier;
  }
  return 'free';
}

// ============================================================================
// Kalshi API Client
// ============================================================================

const KALSHI_API_BASE = 'https://api.elections.kalshi.com/trade-api/v2';

/**
 * Make authenticated request to Kalshi API
 */
async function kalshiFetch<T>(
  endpoint: string,
  params?: Record<string, string | number | undefined>
): Promise<KalshiAPIResponse<T>> {
  const apiToken = process.env.KALSHI_API_TOKEN;

  if (!apiToken) {
    // Return mock data in development
    return getMockKalshiData(endpoint) as KalshiAPIResponse<T>;
  }

  // Build URL with query params
  const url = new URL(`${KALSHI_API_BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      // 10 second timeout
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Kalshi API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new Error('Kalshi API timeout');
    }
    throw error;
  }
}

/**
 * Mock Kalshi data for development/demo
 */
function getMockKalshiData(endpoint: string): KalshiAPIResponse<unknown> {
  if (endpoint.includes('/events/')) {
    return {
      event: {
        event_ticker: 'DEMO-EVENT',
        title: 'Demo Prediction Event',
        mutually_exclusive: true,
        category: 'demo',
        markets: [
          {
            ticker: 'DEMO-YES',
            title: 'Demo outcome will occur',
            yes_price: 65,
            no_price: 35,
            volume: 100000,
            open_interest: 50000,
            status: 'open',
            close_time: '2025-12-31T23:59:59Z',
          },
        ],
      },
    };
  }

  // Default: return market list
  return {
    markets: [
      {
        ticker: 'DEMO-ELECTION-2024',
        title: 'Demo Election Prediction',
        subtitle: 'Will candidate X win?',
        yes_price: 52,
        no_price: 48,
        volume: 500000,
        open_interest: 250000,
        status: 'open',
        close_time: '2025-11-05T23:59:59Z',
        category: 'politics',
      },
      {
        ticker: 'DEMO-WEATHER-2024',
        title: 'Demo Weather Prediction',
        subtitle: 'Will temperature exceed 100F in City X?',
        yes_price: 30,
        no_price: 70,
        volume: 50000,
        open_interest: 25000,
        status: 'open',
        close_time: '2025-08-31T23:59:59Z',
        category: 'weather',
      },
      {
        ticker: 'DEMO-ECON-2024',
        title: 'Demo Economic Prediction',
        subtitle: 'Will GDP growth exceed 3%?',
        yes_price: 40,
        no_price: 60,
        volume: 200000,
        open_interest: 100000,
        status: 'open',
        close_time: '2025-12-31T23:59:59Z',
        category: 'economics',
      },
    ],
    cursor: 'demo-cursor-next',
  };
}

/**
 * Transform Kalshi market to TCG simulation format
 */
function transformToSimulationFormat(market: KalshiMarket): {
  market: KalshiMarket;
  trilemmaMapping: {
    extinction: number; // Probability of "bad" outcome
    posthuman_avoidance: number; // Probability of "neutral" outcome
    simulation: number; // Probability of "outlier" outcome
  };
  simulationNotes: string;
} {
  // Map Kalshi binary odds to Bostrom trilemma probabilities
  // This is a conceptual mapping for TCG simulation markets
  const yesProb = market.yes_price / 100;
  const noProb = market.no_price / 100;

  return {
    market,
    trilemmaMapping: {
      // "Extinction" = market resolves badly (low outcome)
      extinction: noProb * 0.3,
      // "Posthuman avoidance" = stable/expected outcome
      posthuman_avoidance: Math.min(yesProb, noProb) * 0.5 + 0.1,
      // "Simulation" = outlier/unexpected outcome
      simulation: 1 - (noProb * 0.3) - (Math.min(yesProb, noProb) * 0.5 + 0.1),
    },
    simulationNotes: `TCG simulation mapping: This market's ${yesProb > 0.5 ? 'YES' : 'NO'} probability (${Math.max(yesProb, noProb) * 100}%) maps to base reality scenarios. Outlier events (>2 std dev) map to simulation hypothesis outcomes.`,
  };
}

// ============================================================================
// Route Handlers
// ============================================================================

/**
 * GET /api/markets/kalshi
 *
 * Fetch prediction markets from Kalshi API
 * Supports: list markets, get event, get series
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID().slice(0, 8);

  return Sentry.startSpan(
    { name: 'markets:kalshi:get', op: 'http.server' },
    async (span: Span) => {
      span?.setAttribute('requestId', requestId);

      try {
        // Extract user info
        const userId = request.headers.get('x-user-id') || 'anonymous';
        const tier = getUserTier(request);

        span?.setAttribute('userId', userId);
        span?.setAttribute('tier', tier);

        // Check rate limit
        const rateLimit = await checkRateLimit(userId, tier);
        if (!rateLimit.allowed) {
          return NextResponse.json(
            {
              ok: false,
              error: 'Rate limit exceeded',
              remaining: rateLimit.remaining,
              resetAt: new Date(rateLimit.resetAt).toISOString(),
              requestId,
            },
            {
              status: 429,
              headers: {
                'X-RateLimit-Remaining': String(rateLimit.remaining),
                'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
              },
            }
          );
        }

        // Parse query params
        const { searchParams } = new URL(request.url);
        const query = KalshiQuerySchema.parse({
          eventId: searchParams.get('eventId'),
          seriesTicker: searchParams.get('seriesTicker'),
          status: searchParams.get('status'),
          limit: searchParams.get('limit'),
          cursor: searchParams.get('cursor'),
        });

        span?.setAttribute('eventId', query.eventId || 'none');
        span?.setAttribute('limit', query.limit);

        // Fetch from Kalshi
        let response: KalshiAPIResponse<unknown>;

        if (query.eventId) {
          // Get specific event
          response = await kalshiFetch<KalshiEvent>(`/events/${query.eventId}`);
        } else if (query.seriesTicker) {
          // Get series
          response = await kalshiFetch<KalshiMarket[]>(`/series/${query.seriesTicker}/markets`, {
            limit: query.limit,
            cursor: query.cursor,
          });
        } else {
          // List markets
          response = await kalshiFetch<KalshiMarket[]>('/markets', {
            status: query.status,
            limit: query.limit,
            cursor: query.cursor,
          });
        }

        // Transform markets to simulation format
        const markets = response.markets || (response.event?.markets ?? []);
        const simulationMarkets = markets.map(transformToSimulationFormat);

        const latencyMs = Date.now() - startTime;
        span?.setAttribute('latencyMs', latencyMs);
        span?.setAttribute('marketCount', markets.length);

        return NextResponse.json(
          {
            ok: true,
            data: {
              markets: simulationMarkets,
              event: response.event,
              cursor: response.cursor,
            },
            meta: {
              source: 'kalshi',
              count: markets.length,
              latencyMs,
              requestId,
              tier,
              remaining: rateLimit.remaining,
            },
            // Ethical disclaimer for prediction markets
            disclaimer: 'Prediction markets are for informational purposes. Per FHI longtermism principles, avoid speculation on harmful outcomes.',
          },
          {
            headers: {
              'X-RateLimit-Remaining': String(rateLimit.remaining),
              'X-Request-Id': requestId,
              'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
            },
          }
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        Sentry.captureException(error, {
          extra: { requestId, url: request.url },
        });

        console.error('[Kalshi] GET error:', errorMessage);

        // Handle validation errors
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            {
              ok: false,
              error: 'Invalid request parameters',
              details: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
              requestId,
            },
            { status: 400 }
          );
        }

        return NextResponse.json(
          {
            ok: false,
            error: 'Failed to fetch Kalshi markets',
            message: errorMessage,
            requestId,
          },
          { status: 500 }
        );
      }
    }
  );
}

/**
 * POST /api/markets/kalshi
 *
 * Perform actions on Kalshi markets
 * Supports: list-markets, get-event, get-series, health
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID().slice(0, 8);

  return Sentry.startSpan(
    { name: 'markets:kalshi:post', op: 'http.server' },
    async (span: Span) => {
      span?.setAttribute('requestId', requestId);

      try {
        // Extract user info
        const userId = request.headers.get('x-user-id') || 'anonymous';
        const tier = getUserTier(request);

        // Check rate limit
        const rateLimit = await checkRateLimit(userId, tier);
        if (!rateLimit.allowed) {
          return NextResponse.json(
            {
              ok: false,
              error: 'Rate limit exceeded',
              remaining: rateLimit.remaining,
              resetAt: new Date(rateLimit.resetAt).toISOString(),
              requestId,
            },
            { status: 429 }
          );
        }

        // Parse body
        const body = await request.json();
        const { action, params } = KalshiActionSchema.parse(body);

        span?.setAttribute('action', action);

        switch (action) {
          case 'health': {
            // Check Kalshi API health
            const hasToken = !!process.env.KALSHI_API_TOKEN;
            return NextResponse.json({
              ok: true,
              data: {
                status: 'healthy',
                kalshiConnected: hasToken,
                mode: hasToken ? 'live' : 'demo',
              },
              requestId,
            });
          }

          case 'list-markets': {
            const response = await kalshiFetch<KalshiMarket[]>('/markets', {
              status: params?.status,
              limit: params?.limit || 20,
              cursor: params?.cursor,
            });

            const markets = response.markets || [];
            const simulationMarkets = markets.map(transformToSimulationFormat);

            return NextResponse.json({
              ok: true,
              data: { markets: simulationMarkets, cursor: response.cursor },
              meta: { count: markets.length, latencyMs: Date.now() - startTime },
              requestId,
            });
          }

          case 'get-event': {
            if (!params?.eventId) {
              return NextResponse.json(
                { ok: false, error: 'eventId required', requestId },
                { status: 400 }
              );
            }

            const response = await kalshiFetch<KalshiEvent>(`/events/${params.eventId}`);

            return NextResponse.json({
              ok: true,
              data: response.event,
              meta: { latencyMs: Date.now() - startTime },
              requestId,
            });
          }

          case 'get-series': {
            if (!params?.seriesTicker) {
              return NextResponse.json(
                { ok: false, error: 'seriesTicker required', requestId },
                { status: 400 }
              );
            }

            const response = await kalshiFetch<KalshiMarket[]>(
              `/series/${params.seriesTicker}/markets`,
              { limit: params?.limit || 20 }
            );

            const markets = response.markets || [];
            const simulationMarkets = markets.map(transformToSimulationFormat);

            return NextResponse.json({
              ok: true,
              data: { markets: simulationMarkets },
              meta: { count: markets.length, latencyMs: Date.now() - startTime },
              requestId,
            });
          }

          default:
            return NextResponse.json(
              { ok: false, error: `Unknown action: ${action}`, requestId },
              { status: 400 }
            );
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        Sentry.captureException(error, {
          extra: { requestId },
        });

        console.error('[Kalshi] POST error:', errorMessage);

        if (error instanceof z.ZodError) {
          return NextResponse.json(
            {
              ok: false,
              error: 'Invalid request body',
              details: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
              requestId,
            },
            { status: 400 }
          );
        }

        return NextResponse.json(
          {
            ok: false,
            error: 'Failed to process Kalshi request',
            message: errorMessage,
            requestId,
          },
          { status: 500 }
        );
      }
    }
  );
}

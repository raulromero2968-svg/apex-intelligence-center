/**
 * Polymarket API Integration for Simulation Markets (KB-10 Patterns)
 *
 * Fetches crypto-based prediction market odds via Polymarket API.
 * Integrates with TCG simulations for "simulated reality" value shifts.
 *
 * Features:
 * - Tiered rate limiting (free: 5/day, pro: 50/day, burst: 10/min)
 * - JWT authentication with user tier claims
 * - Zod validation for input sanitization
 * - Semantic caching for repeated queries
 * - Error handling with Sentry integration
 *
 * Trade-offs:
 * - GOOD: Real-time prediction odds enhance simulation accuracy
 * - BAD: External API dependency; mitigate with caching and fallbacks
 * - ETHICAL: Ethics disclaimers for Bostrom-related predictions
 *
 * @see knowledge-10-ux-accessible-components.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { redis } from '@/lib/redis';
import { Ratelimit } from '@upstash/ratelimit';
import * as Sentry from '@sentry/nextjs';
import type { Span } from '@sentry/types';
import { createHash } from 'crypto';

// ============================================================================
// Configuration
// ============================================================================

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Cache TTL: 5 minutes for market data (markets update frequently)
const CACHE_TTL = 300;

// Rate limit tiers
const RATE_LIMITS = {
  free: { tokens: 5, window: '1 d' as const }, // 5 requests per day
  pro: { tokens: 50, window: '1 d' as const }, // 50 requests per day
  burst: { tokens: 10, window: '1 m' as const }, // Burst limit: 10 per minute
};

// ============================================================================
// Request Validation Schema
// ============================================================================

const PolymarketRequestSchema = z.object({
  eventId: z.string().min(1, 'Event ID cannot be empty').max(100, 'Event ID too long'),
  includeOutcomes: z.boolean().default(true),
  includePrices: z.boolean().default(true),
});

const PolymarketSearchSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty').max(200, 'Query too long'),
  limit: z.number().int().min(1).max(50).default(10),
  category: z.string().optional(),
});

type PolymarketSearchRequest = z.infer<typeof PolymarketSearchSchema>;

// ============================================================================
// User Tier Types
// ============================================================================

interface UserTier {
  tier: 'free' | 'pro';
  userId: string;
  simulationLimit?: number;
}

// ============================================================================
// Lazy Rate Limiter Initialization
// ============================================================================

let burstRateLimiter: Ratelimit | null = null;

function getBurstRateLimiter(): Ratelimit | null {
  if (burstRateLimiter) return burstRateLimiter;

  if (redis) {
    burstRateLimiter = new Ratelimit({
      redis: redis as any,
      limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 per minute burst
      analytics: true,
      prefix: 'polymarket:burst',
    });
    return burstRateLimiter;
  }
  return null;
}

// ============================================================================
// Rate Limiting
// ============================================================================

async function checkRateLimit(
  userId: string,
  tier: 'free' | 'pro' = 'free'
): Promise<{ success: boolean; remaining: number; reset: number }> {
  if (!redis) {
    // No Redis, allow request but log warning
    console.warn('Redis not configured, rate limiting disabled');
    return { success: true, remaining: -1, reset: 0 };
  }

  try {
    // Check burst limit first
    const burstLimiter = getBurstRateLimiter();
    if (burstLimiter) {
      const burstResult = await burstLimiter.limit(userId);
      if (!burstResult.success) {
        return {
          success: false,
          remaining: burstResult.remaining,
          reset: Math.ceil((burstResult.reset - Date.now()) / 1000),
        };
      }
    }

    // Check daily limit based on tier
    const tierLimits = RATE_LIMITS[tier];
    const key = `polymarket:${tier}:${userId}`;

    // Get current usage
    // @ts-ignore - Upstash Redis types may be incomplete
    const currentUsage = await redis.get<number>(key);
    const usage = currentUsage || 0;

    if (usage >= tierLimits.tokens) {
      return {
        success: false,
        remaining: 0,
        reset: 86400, // 24 hours in seconds
      };
    }

    // Increment usage
    // @ts-ignore - Upstash Redis types may be incomplete
    await redis.incr(key);

    // Set expiration if this is first request
    if (usage === 0) {
      // @ts-ignore - Upstash Redis types may be incomplete
      await redis.expire(key, 86400); // 24 hours
    }

    return {
      success: true,
      remaining: tierLimits.tokens - usage - 1,
      reset: 86400,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail open on errors to prevent blocking legitimate requests
    return { success: true, remaining: -1, reset: 0 };
  }
}

// ============================================================================
// User Authentication & Tier Detection
// ============================================================================

function extractUserTier(request: NextRequest): UserTier {
  // Extract user ID from header (set by upstream auth middleware)
  const userId = request.headers.get('x-user-id') || 'anonymous';

  // Extract tier from JWT claims header (set by auth middleware)
  const tierHeader = request.headers.get('x-user-tier');
  const tier: 'free' | 'pro' = tierHeader === 'pro' ? 'pro' : 'free';

  // Extract simulation limit from JWT claims
  const limitHeader = request.headers.get('x-simulation-limit');
  const simulationLimit = limitHeader ? parseInt(limitHeader, 10) : undefined;

  return { tier, userId, simulationLimit };
}

// ============================================================================
// Caching
// ============================================================================

function getCacheKey(eventId: string): string {
  return `polymarket:event:${createHash('sha256').update(eventId).digest('hex').slice(0, 16)}`;
}

async function getFromCache(eventId: string): Promise<object | null> {
  if (!redis) return null;

  try {
    // @ts-ignore - Upstash Redis types may be incomplete
    const cached = await redis.get<string>(getCacheKey(eventId));
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

async function setToCache(eventId: string, data: object): Promise<void> {
  if (!redis) return;

  try {
    // @ts-ignore - Upstash Redis types may be incomplete
    await redis.set(getCacheKey(eventId), JSON.stringify(data), { ex: CACHE_TTL });
  } catch {
    // Cache write failed, continue without
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function hashIP(ip: string): string {
  const salt = process.env.IP_HASH_SALT || 'default-salt-change-in-production';
  return createHash('sha256')
    .update(ip + salt)
    .digest('hex')
    .slice(0, 16);
}

function logStructured(data: Record<string, unknown>) {
  console.info(JSON.stringify({ ...data, ts: new Date().toISOString() }));
}

// ============================================================================
// Polymarket API Client
// ============================================================================

const GAMMA_BASE_URL = 'https://gamma-api.polymarket.com';

interface PolymarketEvent {
  id: string;
  title: string;
  description?: string;
  endDate?: string;
  outcomes?: PolymarketOutcome[];
  volume?: number;
  liquidity?: number;
  category?: string;
}

interface PolymarketOutcome {
  id: string;
  title: string;
  price: number;
  volume?: number;
}

async function fetchPolymarketEvent(eventId: string): Promise<PolymarketEvent> {
  // Check if API key is configured
  const apiKey = process.env.POLYMARKET_API_KEY;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  // Use Gamma API for event data
  const response = await fetch(`${GAMMA_BASE_URL}/events/${eventId}`, {
    headers,
    next: { revalidate: 60 }, // Cache for 1 minute
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Event not found: ${eventId}`);
    }
    throw new Error(`Polymarket API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  return {
    id: data.id || eventId,
    title: data.title || 'Unknown Event',
    description: data.description,
    endDate: data.endDate,
    outcomes: data.markets?.map((m: any) => ({
      id: m.conditionId || m.id,
      title: m.question || m.title,
      price: parseFloat(m.outcomePrices?.[0] || m.bestBid || 0),
      volume: parseFloat(m.volume || 0),
    })),
    volume: parseFloat(data.volume || 0),
    liquidity: parseFloat(data.liquidity || 0),
    category: data.category,
  };
}

async function searchPolymarketEvents(
  query: string,
  limit: number,
  category?: string
): Promise<PolymarketEvent[]> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    active: 'true',
  });

  if (category) {
    params.set('tag', category);
  }

  // Gamma API for search
  const response = await fetch(`${GAMMA_BASE_URL}/events?${params.toString()}`, {
    headers: {
      'Accept': 'application/json',
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Polymarket search error: ${response.status}`);
  }

  const data = await response.json();

  // Filter by query text
  const filtered = (data || []).filter((event: any) =>
    event.title?.toLowerCase().includes(query.toLowerCase()) ||
    event.description?.toLowerCase().includes(query.toLowerCase())
  );

  return filtered.slice(0, limit).map((event: any) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    endDate: event.endDate,
    volume: parseFloat(event.volume || 0),
    liquidity: parseFloat(event.liquidity || 0),
    category: event.category,
  }));
}

// ============================================================================
// Stub Response Generator (for demo mode)
// ============================================================================

function generateStubEvent(eventId: string): PolymarketEvent {
  // Generate deterministic stub based on eventId hash
  const hash = createHash('md5').update(eventId).digest('hex');
  const yesPrice = (parseInt(hash.slice(0, 2), 16) % 80 + 10) / 100; // 0.10 - 0.90

  return {
    id: eventId,
    title: `Demo Event: ${eventId.slice(0, 20)}`,
    description: 'This is a demo response. Connect to Polymarket API for real data.',
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    outcomes: [
      { id: 'yes', title: 'Yes', price: yesPrice, volume: 50000 },
      { id: 'no', title: 'No', price: 1 - yesPrice, volume: 50000 },
    ],
    volume: 100000,
    liquidity: 25000,
    category: 'demo',
  };
}

// ============================================================================
// Ethics Disclaimer for Bostrom-Related Predictions
// ============================================================================

function getEthicsDisclaimer(event: PolymarketEvent): string | null {
  const sensitiveKeywords = [
    'extinction', 'existential', 'nuclear', 'pandemic', 'bioweapon',
    'superintelligence', 'agi', 'simulation', 'bostrom', 'x-risk',
  ];

  const lowerTitle = (event.title || '').toLowerCase();
  const lowerDesc = (event.description || '').toLowerCase();

  const isSensitive = sensitiveKeywords.some(
    (kw) => lowerTitle.includes(kw) || lowerDesc.includes(kw)
  );

  if (isSensitive) {
    return `ETHICS NOTICE: This prediction market involves existential risk or sensitive topics. ` +
      `Apex Intelligence follows FHI longtermism principles. These simulations are for research ` +
      `and flourishing analysis—not speculation on harmful outcomes. Please engage responsibly.`;
  }

  return null;
}

// ============================================================================
// GET Handler - Fetch Event by ID
// ============================================================================

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const rid = crypto.randomUUID().slice(0, 8);

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
             request.headers.get('x-real-ip') ||
             'anonymous';
  const ipHash = hashIP(ip);

  return Sentry.startSpan(
    { name: 'markets:polymarket:get', op: 'http.server' },
    async (rootSpan: Span) => {
      rootSpan?.setAttribute('requestId', rid);
      rootSpan?.setAttribute('ipHash', ipHash);

      try {
        // Extract user tier
        const { tier, userId } = extractUserTier(request);
        rootSpan?.setAttribute('tier', tier);

        // Check rate limit
        const rateLimitResult = await checkRateLimit(userId, tier);
        if (!rateLimitResult.success) {
          logStructured({
            level: 'warn',
            rid,
            ipHash,
            message: 'Rate limit exceeded',
            tier,
            remaining: rateLimitResult.remaining,
          });

          return NextResponse.json(
            {
              ok: false,
              error: 'Rate limit exceeded',
              tier,
              retryAfter: rateLimitResult.reset,
              requestId: rid,
            },
            {
              status: 429,
              headers: {
                'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
                'Retry-After': rateLimitResult.reset.toString(),
              },
            }
          );
        }

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get('eventId');

        if (!eventId) {
          return NextResponse.json(
            { ok: false, error: 'Missing eventId parameter', requestId: rid },
            { status: 400 }
          );
        }

        // Validate input
        const validation = PolymarketRequestSchema.safeParse({
          eventId,
          includeOutcomes: searchParams.get('includeOutcomes') !== 'false',
          includePrices: searchParams.get('includePrices') !== 'false',
        });

        if (!validation.success) {
          return NextResponse.json(
            {
              ok: false,
              error: `Validation failed: ${validation.error.errors[0].message}`,
              requestId: rid,
            },
            { status: 400 }
          );
        }

        rootSpan?.setAttribute('eventId', eventId);

        // Check cache
        const cached = await getFromCache(eventId);
        if (cached) {
          logStructured({
            level: 'info',
            rid,
            ipHash,
            message: 'Cache hit',
            eventId,
            latencyMs: Date.now() - startTime,
          });

          return NextResponse.json({
            ok: true,
            cached: true,
            ...cached,
            requestId: rid,
            rateLimit: {
              remaining: rateLimitResult.remaining,
              tier,
            },
          });
        }

        // Check if API is configured
        const hasApiKey = !!process.env.POLYMARKET_API_KEY;

        let event: PolymarketEvent;
        let isDemo = false;

        if (!hasApiKey) {
          // Return stub response for demo mode
          event = generateStubEvent(eventId);
          isDemo = true;

          logStructured({
            level: 'info',
            rid,
            ipHash,
            message: 'API key missing, returning demo data',
            eventId,
            latencyMs: Date.now() - startTime,
          });
        } else {
          // Fetch from Polymarket API
          event = await fetchPolymarketEvent(eventId);

          // Cache successful response
          await setToCache(eventId, event);

          logStructured({
            level: 'info',
            rid,
            ipHash,
            message: 'Polymarket fetch successful',
            eventId,
            latencyMs: Date.now() - startTime,
          });
        }

        // Add ethics disclaimer if needed
        const ethicsDisclaimer = getEthicsDisclaimer(event);

        return NextResponse.json({
          ok: true,
          cached: false,
          demo: isDemo,
          event,
          ...(ethicsDisclaimer && { ethicsDisclaimer }),
          requestId: rid,
          rateLimit: {
            remaining: rateLimitResult.remaining,
            tier,
          },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        Sentry.captureException(error, {
          extra: { requestId: rid },
        });

        logStructured({
          level: 'error',
          rid,
          ipHash,
          message: 'Polymarket fetch failed',
          error: errorMessage,
          latencyMs: Date.now() - startTime,
        });

        return NextResponse.json(
          { ok: false, error: `Polymarket fetch failed: ${errorMessage}`, requestId: rid },
          { status: 500 }
        );
      }
    }
  );
}

// ============================================================================
// POST Handler - Search Markets
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const rid = crypto.randomUUID().slice(0, 8);

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
             request.headers.get('x-real-ip') ||
             'anonymous';
  const ipHash = hashIP(ip);

  return Sentry.startSpan(
    { name: 'markets:polymarket:search', op: 'http.server' },
    async (rootSpan: Span) => {
      rootSpan?.setAttribute('requestId', rid);
      rootSpan?.setAttribute('ipHash', ipHash);

      try {
        // Extract user tier
        const { tier, userId } = extractUserTier(request);
        rootSpan?.setAttribute('tier', tier);

        // Check rate limit
        const rateLimitResult = await checkRateLimit(userId, tier);
        if (!rateLimitResult.success) {
          return NextResponse.json(
            {
              ok: false,
              error: 'Rate limit exceeded',
              tier,
              retryAfter: rateLimitResult.reset,
              requestId: rid,
            },
            { status: 429 }
          );
        }

        // Parse and validate body
        let body: PolymarketSearchRequest;
        try {
          const rawBody = await request.json();
          body = PolymarketSearchSchema.parse(rawBody);
        } catch (error) {
          const errorMessage = error instanceof z.ZodError
            ? error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
            : 'Invalid JSON body';

          return NextResponse.json(
            { ok: false, error: `Bad Request: ${errorMessage}`, requestId: rid },
            { status: 400 }
          );
        }

        const { query, limit, category } = body;
        rootSpan?.setAttribute('query', query.slice(0, 50));
        rootSpan?.setAttribute('limit', limit);

        // Check if API is configured
        const hasApiKey = !!process.env.POLYMARKET_API_KEY;

        let events: PolymarketEvent[];
        let isDemo = false;

        if (!hasApiKey) {
          // Return stub results for demo mode
          events = [
            generateStubEvent(`demo-${query.slice(0, 10)}-1`),
            generateStubEvent(`demo-${query.slice(0, 10)}-2`),
            generateStubEvent(`demo-${query.slice(0, 10)}-3`),
          ].slice(0, limit);
          isDemo = true;

          logStructured({
            level: 'info',
            rid,
            ipHash,
            message: 'API key missing, returning demo search results',
            query,
            latencyMs: Date.now() - startTime,
          });
        } else {
          // Search Polymarket API
          events = await searchPolymarketEvents(query, limit, category);

          logStructured({
            level: 'info',
            rid,
            ipHash,
            message: 'Polymarket search successful',
            query,
            resultCount: events.length,
            latencyMs: Date.now() - startTime,
          });
        }

        return NextResponse.json({
          ok: true,
          demo: isDemo,
          query,
          resultCount: events.length,
          events,
          requestId: rid,
          rateLimit: {
            remaining: rateLimitResult.remaining,
            tier,
          },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        Sentry.captureException(error, {
          extra: { requestId: rid },
        });

        logStructured({
          level: 'error',
          rid,
          ipHash,
          message: 'Polymarket search failed',
          error: errorMessage,
          latencyMs: Date.now() - startTime,
        });

        return NextResponse.json(
          { ok: false, error: `Polymarket search failed: ${errorMessage}`, requestId: rid },
          { status: 500 }
        );
      }
    }
  );
}

/**
 * Manifold Markets API Integration (knowledge-10 patterns)
 *
 * Fetches prediction market data from Manifold Markets for simulation market
 * analysis and Bostrom trilemma predictions.
 *
 * Features:
 * - Tiered rate limiting (Free: 5/day, Pro: 50/day, Enterprise: unlimited)
 * - JWT authentication with user tier detection
 * - Zod input validation
 * - Sentry monitoring integration
 * - Secure response headers
 *
 * Manifold Markets API:
 * - Base URL: https://api.manifold.markets/v0
 * - Docs: https://docs.manifold.markets/api
 *
 * Related: knowledge-10-api-design.md
 *
 * @module api/markets/manifold
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ratelimit, getRetryAfter } from '@/lib/rate-limit';
import { getUserFromRequest, UserWithTier } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';
import type { Scope } from '@sentry/types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const MANIFOLD_API_BASE = 'https://api.manifold.markets/v0';

/**
 * Rate limits per tier (requests per day)
 */
const TIER_LIMITS: Record<string, number> = {
  free: 5,
  pro: 50,
  enterprise: Infinity,
};

/**
 * Cache TTL in seconds (15 minutes)
 */
const CACHE_TTL = 900;

// ============================================================================
// INPUT VALIDATION SCHEMAS
// ============================================================================

/**
 * GET request query parameters
 */
const GetMarketSchema = z.object({
  marketId: z
    .string()
    .min(1, 'Market ID is required')
    .max(100, 'Market ID too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid market ID format'),
});

/**
 * Search markets query parameters
 */
const SearchMarketsSchema = z.object({
  term: z
    .string()
    .min(1, 'Search term is required')
    .max(200, 'Search term too long')
    .optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: z.enum(['created-time', 'updated-time', 'last-bet-time', 'last-comment-time']).optional(),
  filter: z.enum(['all', 'open', 'closed', 'resolved', 'closing-this-month', 'closing-next-month']).optional(),
  topic: z.string().max(100).optional(),
});

// ============================================================================
// MANIFOLD API TYPES
// ============================================================================

/**
 * Manifold Market response structure
 */
interface ManifoldMarket {
  id: string;
  creatorId: string;
  creatorUsername: string;
  creatorName: string;
  createdTime: number;
  closeTime?: number;
  question: string;
  description: string;
  tags: string[];
  url: string;
  outcomeType: 'BINARY' | 'FREE_RESPONSE' | 'NUMERIC' | 'PSEUDO_NUMERIC' | 'MULTIPLE_CHOICE';
  mechanism: 'cpmm-1' | 'cpmm-multi-1' | 'dpm-2';
  probability?: number;
  pool?: Record<string, number>;
  volume: number;
  volume24Hours: number;
  isResolved: boolean;
  resolution?: string;
  resolutionTime?: number;
  totalLiquidity?: number;
  uniqueBettorCount: number;
}

/**
 * Enriched market data with simulation analysis
 */
interface EnrichedMarket extends ManifoldMarket {
  simulationAnalysis?: {
    bostromRelevance: number;
    scenarioType: 'extinction' | 'posthuman' | 'simulated_reality' | 'general';
    confidenceScore: number;
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get rate limit based on user tier for Manifold endpoint
 */
function getManifoldLimit(tier: 'free' | 'pro' | 'enterprise'): number {
  return TIER_LIMITS[tier] ?? TIER_LIMITS.free;
}

/**
 * Fetch from Manifold API with error handling
 */
async function fetchManifold(endpoint: string): Promise<Response> {
  const url = `${MANIFOLD_API_BASE}${endpoint}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // API key is optional for public markets
      ...(process.env.MANIFOLD_API_KEY && {
        Authorization: `Key ${process.env.MANIFOLD_API_KEY}`,
      }),
    },
    // 30 second timeout
    signal: AbortSignal.timeout(30000),
  });

  return response;
}

/**
 * Analyze market for Bostrom trilemma relevance
 */
function analyzeSimulationRelevance(market: ManifoldMarket): EnrichedMarket['simulationAnalysis'] {
  const text = `${market.question} ${market.description}`.toLowerCase();

  // Bostrom trilemma keywords
  const extinctionKeywords = /extinct|apocalypse|doom|collapse|end.?of.?world|catastroph|annihil/i;
  const posthumanKeywords = /posthuman|transcend|singularity|superintelligen|agi|alignment|ai.?risk/i;
  const simulationKeywords = /simulat|matrix|virtual.?reality|ancestor.?simulat|base.?reality|holograph/i;

  let scenarioType: 'extinction' | 'posthuman' | 'simulated_reality' | 'general' = 'general';
  let relevanceScore = 0;

  if (extinctionKeywords.test(text)) {
    scenarioType = 'extinction';
    relevanceScore = 0.8;
  } else if (posthumanKeywords.test(text)) {
    scenarioType = 'posthuman';
    relevanceScore = 0.7;
  } else if (simulationKeywords.test(text)) {
    scenarioType = 'simulated_reality';
    relevanceScore = 0.9;
  }

  // Boost relevance for high-activity markets
  const activityBoost = Math.min(0.2, market.uniqueBettorCount / 1000);
  relevanceScore = Math.min(1, relevanceScore + activityBoost);

  // Confidence based on market liquidity
  const confidenceScore = market.totalLiquidity
    ? Math.min(1, market.totalLiquidity / 10000)
    : 0.5;

  return {
    bostromRelevance: relevanceScore,
    scenarioType,
    confidenceScore,
  };
}

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

/**
 * GET /api/markets/manifold
 *
 * Fetch a specific market by ID or search markets
 *
 * Query params:
 * - marketId: Fetch specific market (e.g., ?marketId=abc123)
 * - term: Search term for market discovery (e.g., ?term=simulation)
 * - limit: Number of results (default 20, max 100)
 * - sort: Sort order (created-time, updated-time, etc.)
 * - filter: Filter by status (all, open, closed, resolved)
 * - topic: Filter by topic slug
 */
export async function GET(req: NextRequest) {
  let user: UserWithTier | null = null;

  try {
    // Step 1: Authentication
    user = await getUserFromRequest(req);

    if (!user) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Valid authentication required for market data access',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'WWW-Authenticate': 'Bearer realm="Apex Intelligence API"',
          },
        }
      );
    }

    // Step 2: Rate limiting (daily limits for external API calls)
    const limit = getManifoldLimit(user.subscriptionTier);
    const { success, reset, remaining } = await ratelimit(
      limit,
      `manifold:${user.id}`,
      86400 // 24 hour window
    );

    if (!success) {
      Sentry.withScope((scope: Scope) => {
        scope.setUser({ id: user!.id, email: user!.email });
        scope.setTag('rate_limit', 'exceeded');
        scope.setTag('endpoint', 'manifold');
        scope.setExtra('tier', user!.subscriptionTier);
      });

      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: `Daily Manifold API limit reached for ${user.subscriptionTier} tier`,
          retryAfter: getRetryAfter(reset),
          limit,
          remaining: 0,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(getRetryAfter(reset)),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(reset),
          },
        }
      );
    }

    // Step 3: Parse query parameters
    const { searchParams } = new URL(req.url);
    const marketId = searchParams.get('marketId');

    // Single market fetch
    if (marketId) {
      const parsed = GetMarketSchema.safeParse({ marketId });

      if (!parsed.success) {
        return new Response(
          JSON.stringify({
            error: 'Invalid market ID',
            details: parsed.error.issues,
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Fetch single market
      const response = await fetchManifold(`/market/${parsed.data.marketId}`);

      if (!response.ok) {
        if (response.status === 404) {
          return new Response(
            JSON.stringify({ error: 'Market not found' }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }
        throw new Error(`Manifold API error: ${response.status}`);
      }

      const market: ManifoldMarket = await response.json();

      // Enrich with simulation analysis
      const enriched: EnrichedMarket = {
        ...market,
        simulationAnalysis: analyzeSimulationRelevance(market),
      };

      return new Response(
        JSON.stringify({
          market: enriched,
          metadata: {
            fetchedAt: new Date().toISOString(),
            tier: user.subscriptionTier,
            rateLimit: { limit, remaining, reset },
          },
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': `public, max-age=${CACHE_TTL}`,
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': String(reset),
          },
        }
      );
    }

    // Market search
    const searchParsed = SearchMarketsSchema.safeParse({
      term: searchParams.get('term'),
      limit: searchParams.get('limit'),
      sort: searchParams.get('sort'),
      filter: searchParams.get('filter'),
      topic: searchParams.get('topic'),
    });

    if (!searchParsed.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid search parameters',
          details: searchParsed.error.issues,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Build search URL
    const searchQuery = new URLSearchParams();
    if (searchParsed.data.term) searchQuery.set('term', searchParsed.data.term);
    searchQuery.set('limit', String(searchParsed.data.limit));
    if (searchParsed.data.sort) searchQuery.set('sort', searchParsed.data.sort);
    if (searchParsed.data.filter) searchQuery.set('filter', searchParsed.data.filter);
    if (searchParsed.data.topic) searchQuery.set('topic', searchParsed.data.topic);

    const response = await fetchManifold(`/search-markets?${searchQuery.toString()}`);

    if (!response.ok) {
      throw new Error(`Manifold search API error: ${response.status}`);
    }

    const markets: ManifoldMarket[] = await response.json();

    // Enrich all markets with simulation analysis
    const enrichedMarkets: EnrichedMarket[] = markets.map(market => ({
      ...market,
      simulationAnalysis: analyzeSimulationRelevance(market),
    }));

    // Sort by Bostrom relevance if searching for simulation-related terms
    const term = searchParsed.data.term?.toLowerCase() ?? '';
    if (/simulat|bostrom|extinc|posthuman|ai.?risk/i.test(term)) {
      enrichedMarkets.sort((a, b) =>
        (b.simulationAnalysis?.bostromRelevance ?? 0) -
        (a.simulationAnalysis?.bostromRelevance ?? 0)
      );
    }

    return new Response(
      JSON.stringify({
        markets: enrichedMarkets,
        total: enrichedMarkets.length,
        metadata: {
          fetchedAt: new Date().toISOString(),
          searchParams: searchParsed.data,
          tier: user.subscriptionTier,
          rateLimit: { limit, remaining, reset },
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${CACHE_TTL}`,
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(reset),
        },
      }
    );
  } catch (error) {
    Sentry.withScope((scope: Scope) => {
      if (user) {
        scope.setUser({ id: user.id, email: user.email });
      }
      scope.setTag('endpoint', 'manifold');
      scope.setExtra('error', error);
      Sentry.captureException(error);
    });

    const isDev = process.env.NODE_ENV === 'development';

    return new Response(
      JSON.stringify({
        error: 'Manifold API fetch failed',
        message: isDev && error instanceof Error ? error.message : 'Unable to fetch market data',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';

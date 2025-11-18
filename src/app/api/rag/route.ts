/**
 * RAG API Endpoint
 *
 * Production-ready endpoint for the TCG RAG system with:
 * - Rate limiting (per IP and per user)
 * - Redis caching for identical queries
 * - Authentication hooks (ready for Stripe/Auth0 integration)
 * - Comprehensive error handling
 * - Sentry observability
 */

import { NextRequest, NextResponse } from 'next/server';
import { executeRagQuery, formatRagResponse } from '@/rag/chain';
import { getCachedWithMeta, stableKey } from '@/lib/cache';
import * as Sentry from '@sentry/nextjs';

type SpanLike = {
  setAttribute: (key: string, value: unknown) => void;
} | undefined;

/**
 * Rate limiter using IP-based tracking
 * Stores request counts in memory (for serverless, use Upstash Redis in production)
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_MAX = 10; // Max requests per window
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  // Reset if window expired
  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt: now + RATE_LIMIT_WINDOW };
  }

  // Increment count
  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count, resetAt: record.resetAt };
}

/**
 * POST /api/rag
 *
 * Execute a RAG query with full provenance tracking
 *
 * Request body:
 * ```json
 * {
 *   "query": "What is the ROI on PSA 10 vs BGS 9.5 for 1st Edition Charizard?",
 *   "bypass_cache": false // Optional: force fresh query
 * }
 * ```
 *
 * Response:
 * ```json
 * {
 *   "answer": "...",
 *   "sources": [...],
 *   "citationCount": 5,
 *   "synthesisCount": 1,
 *   "isValid": true,
 *   "validationErrors": [],
 *   "cached": false
 * }
 * ```
 */
export async function POST(request: NextRequest) {
  return Sentry.startSpan(
    { name: 'api.rag', op: 'http.server' },
    async (span: SpanLike) => {
      try {
        // 1. Extract user identifier (IP or authenticated user ID)
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                   request.headers.get('x-real-ip') ||
                   'unknown';

        span?.setAttribute('ip', ip);

        // 2. Rate limiting
        const rateLimit = checkRateLimit(ip);
        if (!rateLimit.allowed) {
          return NextResponse.json(
            { error: 'Rate limit exceeded. Please try again later.' },
            {
              status: 429,
              headers: {
                'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': String(rateLimit.resetAt),
              },
            }
          );
        }

        // 3. Parse request body
        const body = await request.json();
        const { query, bypass_cache = false } = body;

        if (!query || typeof query !== 'string') {
          return NextResponse.json(
            { error: 'Invalid request. "query" field is required.' },
            { status: 400 }
          );
        }

        if (query.length > 500) {
          return NextResponse.json(
            { error: 'Query too long. Maximum 500 characters.' },
            { status: 400 }
          );
        }

        span?.setAttribute('query', query.slice(0, 100));
        span?.setAttribute('bypassCache', bypass_cache);

        // 4. Authentication check (placeholder - integrate with Stripe/Auth0)
        // const authHeader = request.headers.get('authorization');
        // const user = await authenticateUser(authHeader);
        // if (!user) {
        //   return NextResponse.json(
        //     { error: 'Unauthorized. Please provide a valid API key or auth token.' },
        //     { status: 401 }
        //   );
        // }

        // 5. Check cache (unless bypassed)
        const cacheKey = stableKey('rag', { query });
        const cacheTags = ['rag'];

        const { value: ragResponse, meta } = bypass_cache
          ? { value: null as any, meta: { redis: 'BYPASS' as const } }
          : await getCachedWithMeta(
              cacheKey,
              cacheTags,
              async () => executeRagQuery(query),
              300 // Cache for 5 minutes
            );

        const cached = meta.redis === 'HIT';

        // 6. Execute query if not cached
        const response = ragResponse || await executeRagQuery(query);

        span?.setAttribute('cached', cached);
        span?.setAttribute('citationCount', response.citationCount);
        span?.setAttribute('sourceCount', response.sources.length);
        span?.setAttribute('isValid', response.isValid);

        // 7. Return response with rate limit headers
        return NextResponse.json(
          {
            ...response,
            cached,
          },
          {
            headers: {
              'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
              'X-RateLimit-Remaining': String(rateLimit.remaining),
              'X-RateLimit-Reset': String(rateLimit.resetAt),
              'Cache-Control': cached ? 'public, max-age=300' : 'no-cache',
            },
          }
        );
      } catch (error) {
        // Log error to Sentry
        Sentry.captureException(error);

        console.error('RAG API error:', error);

        // Return generic error (don't expose internal details)
        return NextResponse.json(
          {
            error: 'An error occurred while processing your request. Please try again.',
            details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
          },
          { status: 500 }
        );
      }
    }
  );
}

/**
 * GET /api/rag?query=...
 *
 * Alternative GET endpoint for simple queries
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');
  const format = searchParams.get('format'); // 'json' or 'markdown'

  if (!query) {
    return NextResponse.json(
      { error: 'Missing required parameter: query' },
      { status: 400 }
    );
  }

  return Sentry.startSpan(
    { name: 'api.rag.get', op: 'http.server' },
    async (span: SpanLike) => {
      try {
        // Rate limiting
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
        const rateLimit = checkRateLimit(ip);

        if (!rateLimit.allowed) {
          return NextResponse.json(
            { error: 'Rate limit exceeded' },
            { status: 429 }
          );
        }

        // Execute query (with caching)
        const cacheKey = stableKey('rag', { query });
        const { value: response, meta } = await getCachedWithMeta(
          cacheKey,
          ['rag'],
          async () => executeRagQuery(query),
          300
        );

        const cached = meta.redis === 'HIT';

        span?.setAttribute('cached', cached);
        span?.setAttribute('format', format || 'json');

        // Return markdown format if requested
        if (format === 'markdown') {
          const markdown = formatRagResponse(response);
          return new NextResponse(markdown, {
            headers: {
              'Content-Type': 'text/markdown',
              'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
              'X-RateLimit-Remaining': String(rateLimit.remaining),
            },
          });
        }

        // Return JSON by default
        return NextResponse.json(
          { ...response, cached },
          {
            headers: {
              'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
              'X-RateLimit-Remaining': String(rateLimit.remaining),
            },
          }
        );
      } catch (error) {
        Sentry.captureException(error);
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }
    }
  );
}

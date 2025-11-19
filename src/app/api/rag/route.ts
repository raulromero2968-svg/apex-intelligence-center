/**
 * Secure RAG API Endpoint (knowledge-05 + knowledge-10 patterns)
 *
 * Production-ready endpoint with enterprise security:
 * - Secure JWT authentication with refresh token rotation (knowledge-05)
 * - Tiered token-bucket rate limiting with Redis (knowledge-10)
 * - Strict input validation + PII blocking (Zod)
 * - Sentry monitoring with user context
 * - Secure response headers (CSP, nosniff, no-frame)
 * - RESTful error responses with Retry-After
 */

import { NextRequest } from 'next/server';
import { ragFusionPipeline } from '@/lib/rag/rag-fusion';
import { ratelimit, getLimitForTier, getRetryAfter } from '@/lib/rate-limit';
import * as Sentry from '@sentry/nextjs';
import type { Scope } from '@sentry/types';
import { z } from 'zod';
import { getUserFromRequest, UserWithTier } from '@/lib/auth/jwt';

// Strict input validation with PII blocking
const QuerySchema = z.object({
  query: z
    .string()
    .min(1, 'Query cannot be empty')
    .max(1500, 'Query too long (max 1500 characters)')
    .regex(
      /^[\p{L}\p{N}\s\-.!,?()"'&:/+@#]+$/u,
      'Query contains invalid characters'
    )
    .refine(
      (q) => {
        const lower = q.toLowerCase();
        // Block PII and sensitive terms
        return !/(?:password|token|key|ssn|social.?security|credit.?card|cvv|passport|api.?key|private.?key|secret)/i.test(
          lower
        );
      },
      'Query contains restricted terms'
    ),
});

/**
 * POST /api/rag
 *
 * Secure RAG query endpoint with zero-trust authentication
 */
export async function POST(req: NextRequest) {
  let user: UserWithTier | null = null;

  try {
    // Step 1: Secure JWT authentication (knowledge-05)
    user = await getUserFromRequest(req);

    if (!user) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Valid authentication required',
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

    // Step 2: Tiered token-bucket rate limiting (knowledge-10)
    const limit = getLimitForTier(user.subscriptionTier);
    const { success, reset, remaining } = await ratelimit(limit, `rag:${user.id}`);

    if (!success) {
      Sentry.withScope((scope: Scope) => {
        scope.setUser({ id: user!.id, email: user!.email });
        scope.setTag('rate_limit', 'exceeded');
        scope.setExtra('tier', user!.subscriptionTier);
      });

      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: `You have exceeded your ${user.subscriptionTier} tier limit`,
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

    // Step 3: Strict input validation + PII blocking
    const body = await req.json();
    const parsed = QuerySchema.safeParse(body);

    if (!parsed.success) {
      Sentry.withScope((scope: Scope) => {
        scope.setUser({ id: user!.id, email: user!.email });
        scope.setExtra('validation_errors', parsed.error.issues);
        Sentry.captureException(new Error('Invalid RAG query format'));
      });

      return new Response(
        JSON.stringify({
          error: 'Invalid query format',
          details: parsed.error.issues.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { query } = parsed.data;

    // Step 4: Execute RAG-Fusion pipeline
    Sentry.withScope((scope: Scope) => {
      scope.setUser({ id: user!.id, email: user!.email });
      scope.setTag('query_length', String(query.length));
      scope.setExtra('tier', user!.subscriptionTier);
    });

    const response = await ragFusionPipeline(query);

    // Step 5: Return secure response with headers
    return new Response(
      JSON.stringify({
        response,
        metadata: {
          userId: user.id,
          tier: user.subscriptionTier,
          rateLimit: {
            limit,
            remaining,
            reset,
          },
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(reset),
        },
      }
    );
  } catch (error) {
    // Step 6: Error handling with Sentry context
    Sentry.withScope((scope: Scope) => {
      if (user) {
        scope.setUser({ id: user.id, email: user.email });
      }
      scope.setExtra('error', error);
      Sentry.captureException(error);
    });

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : 'Unknown error'
            : 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

// Force dynamic rendering (no static optimization)
export const dynamic = 'force-dynamic';

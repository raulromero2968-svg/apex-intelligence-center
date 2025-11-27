/**
 * Livelihood Analysis API Endpoint
 *
 * Secure endpoint for AI-powered livelihood impact analysis.
 * Implements Phase 2 of AI Livelihood Analysis master plan.
 *
 * Features:
 * - Multi-agent analysis (Analyzer, Discoverer, Verifier)
 * - Job impact assessments
 * - Upskilling pathway recommendations
 * - Policy compliance verification
 *
 * Security:
 * - JWT authentication (knowledge-05)
 * - Tiered rate limiting (knowledge-10)
 * - Policy compliance checking (Phase 3)
 * - Input validation with PII blocking
 *
 * @see master-plan-ai-livelihood-analysis Phase 2
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import type { Scope } from '@sentry/types';
import { getUserFromRequest, type UserWithTier } from '@/lib/auth';
import { ratelimit, getLimitForTier, getRetryAfter } from '@/lib/rate-limit';
import {
  livelihoodAgent,
  type LivelihoodAgentParams,
  type LivelihoodAgentResponse,
} from '@/lib/agents/livelihood-agent';
import {
  checkFeaturePolicy,
  logPolicyAudit,
  detectRegion,
} from '@/lib/compliance/policy-checker';

// ============================================================================
// INPUT VALIDATION
// ============================================================================

const LivelyhoodQuerySchema = z.object({
  query: z
    .string()
    .min(5, 'Query must be at least 5 characters')
    .max(1000, 'Query too long (max 1000 characters)')
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
  cardId: z.string().optional(),
  region: z.string().length(2).optional(),
  includeDiscovery: z.boolean().default(true),
  includeCompliance: z.boolean().default(true),
});

// ============================================================================
// RESPONSE HEADERS
// ============================================================================

const secureHeaders = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
};

// ============================================================================
// API HANDLERS
// ============================================================================

/**
 * POST /api/livelihood
 *
 * Execute livelihood analysis with multi-agent pipeline
 */
export async function POST(req: NextRequest) {
  let user: UserWithTier | null = null;

  try {
    // Step 1: Authenticate user
    user = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Valid authentication required',
        },
        {
          status: 401,
          headers: {
            ...secureHeaders,
            'WWW-Authenticate': 'Bearer realm="Apex Intelligence API"',
          },
        }
      );
    }

    // Step 2: Rate limiting (more generous for livelihood - complex queries)
    const baseLimit = getLimitForTier(user.subscriptionTier);
    const livelihoodLimit = Math.ceil(baseLimit * 0.5); // 50% of standard limit
    const { success, reset, remaining } = await ratelimit(livelihoodLimit, `livelihood:${user.id}`);

    if (!success) {
      Sentry.withScope((scope: Scope) => {
        scope.setUser({ id: user!.id, email: user!.email });
        scope.setTag('rate_limit', 'exceeded');
        scope.setTag('endpoint', 'livelihood');
      });

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `You have exceeded your ${user.subscriptionTier} tier limit for livelihood analysis`,
          retryAfter: getRetryAfter(reset),
        },
        {
          status: 429,
          headers: {
            ...secureHeaders,
            'Retry-After': String(getRetryAfter(reset)),
            'X-RateLimit-Limit': String(livelihoodLimit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(reset),
          },
        }
      );
    }

    // Step 3: Validate input
    const body = await req.json();
    const parsed = LivelyhoodQuerySchema.safeParse(body);

    if (!parsed.success) {
      Sentry.withScope((scope: Scope) => {
        scope.setUser({ id: user!.id, email: user!.email });
        scope.setExtra('validation_errors', parsed.error.issues);
        Sentry.captureException(new Error('Invalid livelihood query format'));
      });

      return NextResponse.json(
        {
          error: 'Invalid query format',
          details: parsed.error.issues.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        },
        {
          status: 400,
          headers: secureHeaders,
        }
      );
    }

    const { query, cardId, region, includeDiscovery, includeCompliance } = parsed.data;

    // Step 4: Detect region and check policy compliance
    const detectedRegion = region || detectRegion({ headers: req.headers });
    const policyCheck = await checkFeaturePolicy(user.id, 'job_impact_analysis', detectedRegion);

    // Log policy check
    await logPolicyAudit(user.id, 'livelihood_query', policyCheck, { query: query.slice(0, 100) });

    if (!policyCheck.isAllowed) {
      return NextResponse.json(
        {
          error: 'Policy violation',
          message: policyCheck.message || 'Feature not available in your region',
          framework: policyCheck.framework,
          restrictions: policyCheck.restrictions,
        },
        {
          status: 403,
          headers: {
            ...secureHeaders,
            'X-Policy-Framework': policyCheck.framework,
            'X-Policy-Risk-Level': policyCheck.riskLevel,
          },
        }
      );
    }

    // Step 5: Execute livelihood agent pipeline
    Sentry.withScope((scope: Scope) => {
      scope.setUser({ id: user!.id, email: user!.email });
      scope.setTag('query_length', String(query.length));
      scope.setTag('region', detectedRegion);
      scope.setExtra('includeDiscovery', includeDiscovery);
      scope.setExtra('includeCompliance', includeCompliance);
    });

    const agentParams: LivelihoodAgentParams = {
      query,
      userId: user.id,
      cardId,
      region: detectedRegion,
      includeDiscovery,
      includeCompliance,
    };

    const result: LivelihoodAgentResponse = await livelihoodAgent(agentParams);

    // Step 6: Return response with policy headers
    return NextResponse.json(
      {
        success: true,
        data: {
          response: result.response,
          analysisType: result.analysisType,
          impactAssessment: result.impactAssessment,
          discoveryResults: result.discoveryResults,
          policyContext: result.policyContext,
          confidenceScore: result.confidenceScore,
          citations: result.citations,
        },
        metadata: {
          userId: user.id,
          tier: user.subscriptionTier,
          region: detectedRegion,
          framework: policyCheck.framework,
          executionMetrics: result.executionMetrics,
          rateLimit: {
            limit: livelihoodLimit,
            remaining,
            reset,
          },
        },
      },
      {
        status: 200,
        headers: {
          ...secureHeaders,
          'X-RateLimit-Limit': String(livelihoodLimit),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(reset),
          'X-Policy-Framework': policyCheck.framework,
          'X-Policy-Risk-Level': policyCheck.riskLevel,
          ...(policyCheck.requiresConsent && {
            'X-Policy-Requires-Consent': 'true',
          }),
          ...(policyCheck.message && {
            'X-AI-Transparency': policyCheck.message,
          }),
        },
      }
    );
  } catch (error) {
    // Error handling with Sentry context
    Sentry.withScope((scope: Scope) => {
      if (user) {
        scope.setUser({ id: user.id, email: user.email });
      }
      scope.setTag('endpoint', 'livelihood');
      scope.setExtra('error', error);
      Sentry.captureException(error);
    });

    console.error('[LIVELIHOOD_API_ERROR]', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : 'Unknown error'
            : 'An unexpected error occurred while processing your livelihood analysis',
      },
      {
        status: 500,
        headers: secureHeaders,
      }
    );
  }
}

/**
 * GET /api/livelihood
 *
 * Get user's livelihood analysis history
 */
export async function GET(req: NextRequest) {
  let user: UserWithTier | null = null;

  try {
    // Authenticate user
    user = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Valid authentication required',
        },
        {
          status: 401,
          headers: {
            ...secureHeaders,
            'WWW-Authenticate': 'Bearer realm="Apex Intelligence API"',
          },
        }
      );
    }

    // Rate limiting
    const { success, reset, remaining } = await ratelimit(100, `livelihood-history:${user.id}`);

    if (!success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: getRetryAfter(reset),
        },
        {
          status: 429,
          headers: {
            ...secureHeaders,
            'Retry-After': String(getRetryAfter(reset)),
          },
        }
      );
    }

    // Parse query params
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const analysisType = searchParams.get('type');

    // Fetch history from database
    const { db } = await import('@/lib/db');
    const { eq, desc, and } = await import('drizzle-orm');
    const { livelihoodAnalysis } = await import('@/db/schema/spatial-livelihood');

    const conditions = [eq(livelihoodAnalysis.userId, user.id)];
    if (analysisType) {
      conditions.push(eq(livelihoodAnalysis.analysisType, analysisType as any));
    }

    const history = await db
      .select({
        id: livelihoodAnalysis.id,
        query: livelihoodAnalysis.query,
        analysisType: livelihoodAnalysis.analysisType,
        response: livelihoodAnalysis.response,
        confidenceScore: livelihoodAnalysis.confidenceScore,
        reliabilityTier: livelihoodAnalysis.reliabilityTier,
        createdAt: livelihoodAnalysis.createdAt,
      })
      .from(livelihoodAnalysis)
      .where(and(...conditions))
      .orderBy(desc(livelihoodAnalysis.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(
      {
        success: true,
        data: history,
        pagination: {
          limit,
          offset,
          hasMore: history.length === limit,
        },
      },
      {
        status: 200,
        headers: {
          ...secureHeaders,
          'X-RateLimit-Remaining': String(remaining),
        },
      }
    );
  } catch (error) {
    Sentry.withScope((scope: Scope) => {
      if (user) {
        scope.setUser({ id: user.id, email: user.email });
      }
      Sentry.captureException(error);
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch livelihood history',
      },
      {
        status: 500,
        headers: secureHeaders,
      }
    );
  }
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';

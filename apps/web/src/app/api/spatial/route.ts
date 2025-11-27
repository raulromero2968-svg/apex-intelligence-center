/**
 * Spatial RAG API Endpoint
 *
 * Secure endpoint for spatial AI-powered market intelligence.
 * Implements Phase 1 of AI Livelihood Analysis master plan.
 *
 * Features:
 * - 3D market space visualizations
 * - Spatial embeddings for card positioning
 * - World model-inspired market predictions
 * - Livelihood-focused insights
 *
 * Security:
 * - JWT authentication (knowledge-05)
 * - Tiered rate limiting (knowledge-10)
 * - Input validation with PII blocking
 *
 * @see master-plan-ai-livelihood-analysis Phase 1
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import type { Scope } from '@sentry/types';
import { getUserFromRequest, type UserWithTier } from '@/lib/auth';
import { ratelimit, getLimitForTier, getRetryAfter } from '@/lib/rate-limit';
import {
  spatialRAG,
  generateSpatialEmbeddings,
  predictMarketPosition,
  type SpatialRAGParams,
  type SpatialContextType,
} from '@/lib/ai/spatial-rag';
import { checkFeaturePolicy, detectRegion } from '@/lib/compliance/policy-checker';

// ============================================================================
// INPUT VALIDATION
// ============================================================================

const SpatialQuerySchema = z.object({
  query: z
    .string()
    .min(3, 'Query must be at least 3 characters')
    .max(1000, 'Query too long (max 1000 characters)')
    .refine(
      (q) => {
        const lower = q.toLowerCase();
        return !/(?:password|token|key|ssn|social.?security|credit.?card|cvv|passport|api.?key)/i.test(
          lower
        );
      },
      'Query contains restricted terms'
    ),
  cardId: z.string().optional(),
  contextType: z
    .enum(['market_position', 'trend_vector', 'cluster_centroid', 'price_trajectory', 'volatility_surface'])
    .default('market_position'),
  includeVisualization: z.boolean().default(true),
  topK: z.number().int().min(1).max(50).default(10),
});

const EmbeddingRequestSchema = z.object({
  cardId: z.string().min(1, 'Card ID is required'),
});

const PredictionRequestSchema = z.object({
  cardId: z.string().min(1, 'Card ID is required'),
  timeframe: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
});

// ============================================================================
// RESPONSE HEADERS
// ============================================================================

const secureHeaders = {
  'Content-Type': 'application/json',
  'Cache-Control': 'private, max-age=300', // 5 min cache for spatial data
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
};

// ============================================================================
// API HANDLERS
// ============================================================================

/**
 * POST /api/spatial
 *
 * Execute spatial RAG query for market intelligence
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
            'Cache-Control': 'no-store',
            'WWW-Authenticate': 'Bearer realm="Apex Intelligence API"',
          },
        }
      );
    }

    // Step 2: Rate limiting
    const limit = getLimitForTier(user.subscriptionTier);
    const { success, reset, remaining } = await ratelimit(limit, `spatial:${user.id}`);

    if (!success) {
      Sentry.withScope((scope: Scope) => {
        scope.setUser({ id: user!.id, email: user!.email });
        scope.setTag('rate_limit', 'exceeded');
        scope.setTag('endpoint', 'spatial');
      });

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `You have exceeded your ${user.subscriptionTier} tier limit`,
          retryAfter: getRetryAfter(reset),
        },
        {
          status: 429,
          headers: {
            ...secureHeaders,
            'Cache-Control': 'no-store',
            'Retry-After': String(getRetryAfter(reset)),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(reset),
          },
        }
      );
    }

    // Step 3: Parse and determine action
    const body = await req.json();
    const action = body.action || 'query';

    switch (action) {
      case 'query':
        return handleSpatialQuery(body, user, remaining, reset, limit, req.headers);

      case 'embed':
        return handleEmbedding(body, user, remaining, reset);

      case 'predict':
        return handlePrediction(body, user, remaining, reset, req.headers);

      default:
        return NextResponse.json(
          {
            error: 'Invalid action',
            message: 'Supported actions: query, embed, predict',
          },
          {
            status: 400,
            headers: secureHeaders,
          }
        );
    }
  } catch (error) {
    Sentry.withScope((scope: Scope) => {
      if (user) {
        scope.setUser({ id: user.id, email: user.email });
      }
      scope.setTag('endpoint', 'spatial');
      scope.setExtra('error', error);
      Sentry.captureException(error);
    });

    console.error('[SPATIAL_API_ERROR]', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : 'Unknown error'
            : 'An unexpected error occurred',
      },
      {
        status: 500,
        headers: { ...secureHeaders, 'Cache-Control': 'no-store' },
      }
    );
  }
}

/**
 * Handle spatial RAG query
 */
async function handleSpatialQuery(
  body: unknown,
  user: UserWithTier,
  remaining: number,
  reset: number,
  limit: number,
  headers: Headers
): Promise<NextResponse> {
  // Validate input
  const parsed = SpatialQuerySchema.safeParse(body);

  if (!parsed.success) {
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

  const { query, cardId, contextType, includeVisualization, topK } = parsed.data;

  // Check policy
  const region = detectRegion({ headers });
  const policyCheck = await checkFeaturePolicy(user.id, 'spatial_rag', region);

  if (!policyCheck.isAllowed) {
    return NextResponse.json(
      {
        error: 'Policy violation',
        message: policyCheck.message,
      },
      {
        status: 403,
        headers: {
          ...secureHeaders,
          'X-Policy-Framework': policyCheck.framework,
        },
      }
    );
  }

  // Execute spatial RAG
  Sentry.withScope((scope: Scope) => {
    scope.setUser({ id: user.id, email: user.email });
    scope.setTag('query_length', String(query.length));
    scope.setTag('contextType', contextType);
  });

  const params: SpatialRAGParams = {
    query,
    cardId,
    userId: user.id,
    contextType: contextType as SpatialContextType,
    includeVisualization,
    topK,
  };

  const result = await spatialRAG(params);

  return NextResponse.json(
    {
      success: true,
      data: {
        answer: result.answer,
        spatialContext: {
          contextType: result.spatialContext.metadata.contextType,
          coordinates: result.spatialContext.metadata.coordinates,
        },
        similarDocuments: result.similarDocuments,
        visualization: result.visualization,
        livelihoodInsights: result.livelihoodInsights,
      },
      metadata: {
        userId: user.id,
        tier: user.subscriptionTier,
        rateLimit: { limit, remaining, reset },
      },
    },
    {
      status: 200,
      headers: {
        ...secureHeaders,
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset': String(reset),
      },
    }
  );
}

/**
 * Handle embedding generation
 */
async function handleEmbedding(
  body: unknown,
  user: UserWithTier,
  remaining: number,
  reset: number
): Promise<NextResponse> {
  const parsed = EmbeddingRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid request',
        details: parsed.error.issues,
      },
      {
        status: 400,
        headers: secureHeaders,
      }
    );
  }

  const { cardId } = parsed.data;

  const result = await generateSpatialEmbeddings(cardId, user.id);

  return NextResponse.json(
    {
      success: true,
      data: {
        cardId,
        spatialContext: result.metadata.spatialContext,
        coordinates: result.metadata.coordinates,
        contextType: result.metadata.contextType,
      },
      metadata: {
        userId: user.id,
        rateLimit: { remaining, reset },
      },
    },
    {
      status: 200,
      headers: secureHeaders,
    }
  );
}

/**
 * Handle market prediction
 */
async function handlePrediction(
  body: unknown,
  user: UserWithTier,
  remaining: number,
  reset: number,
  headers: Headers
): Promise<NextResponse> {
  const parsed = PredictionRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid request',
        details: parsed.error.issues,
      },
      {
        status: 400,
        headers: secureHeaders,
      }
    );
  }

  const { cardId, timeframe } = parsed.data;

  // Check policy for predictions (limited risk)
  const region = detectRegion({ headers });
  const policyCheck = await checkFeaturePolicy(user.id, 'market_prediction', region);

  const prediction = await predictMarketPosition(cardId, timeframe);

  return NextResponse.json(
    {
      success: true,
      data: {
        cardId: prediction.cardId,
        predictedTrend: prediction.predictedTrend,
        confidence: prediction.confidence,
        timeframe: prediction.timeframe,
        reasoning: prediction.reasoning,
        spatialPosition: prediction.spatialPosition,
      },
      metadata: {
        userId: user.id,
        rateLimit: { remaining, reset },
        policyNote: policyCheck.message,
      },
      warnings: [
        'AI-generated prediction - verify with additional research',
        'Past performance does not guarantee future results',
      ],
    },
    {
      status: 200,
      headers: {
        ...secureHeaders,
        'X-AI-Transparency': 'Prediction generated by AI model',
        ...(policyCheck.requiresConsent && { 'X-Policy-Requires-Consent': 'true' }),
      },
    }
  );
}

/**
 * GET /api/spatial
 *
 * Get spatial embedding info for a card
 */
export async function GET(req: NextRequest) {
  let user: UserWithTier | null = null;

  try {
    user = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        {
          status: 401,
          headers: { ...secureHeaders, 'Cache-Control': 'no-store' },
        }
      );
    }

    const { searchParams } = new URL(req.url);
    const cardId = searchParams.get('cardId');
    const action = searchParams.get('action') || 'info';

    if (action === 'clusters') {
      // Return cluster information
      const { db } = await import('@/lib/db');
      const { sql } = await import('drizzle-orm');
      const { spatialEmbeddings } = await import('@/db/schema/spatial-livelihood');

      const clusters = await db
        .select({
          clusterLabel: sql<string>`coordinates->>'clusterLabel'`.as('clusterLabel'),
          count: sql<number>`count(*)`.as('count'),
        })
        .from(spatialEmbeddings)
        .groupBy(sql`coordinates->>'clusterLabel'`);

      return NextResponse.json(
        {
          success: true,
          data: {
            clusters: clusters.map((c) => ({
              label: c.clusterLabel || 'unknown',
              count: Number(c.count),
            })),
          },
        },
        {
          status: 200,
          headers: secureHeaders,
        }
      );
    }

    if (!cardId) {
      return NextResponse.json(
        {
          error: 'Missing cardId parameter',
          message: 'Provide cardId to get spatial embedding info',
        },
        {
          status: 400,
          headers: secureHeaders,
        }
      );
    }

    // Get latest spatial embedding for card
    const { db } = await import('@/lib/db');
    const { eq, desc } = await import('drizzle-orm');
    const { spatialEmbeddings } = await import('@/db/schema/spatial-livelihood');

    const embedding = await db
      .select({
        id: spatialEmbeddings.id,
        spatialContext: spatialEmbeddings.spatialContext,
        contextType: spatialEmbeddings.contextType,
        coordinates: spatialEmbeddings.coordinates,
        temporalData: spatialEmbeddings.temporalData,
        createdAt: spatialEmbeddings.createdAt,
      })
      .from(spatialEmbeddings)
      .where(eq(spatialEmbeddings.cardId, cardId))
      .orderBy(desc(spatialEmbeddings.createdAt))
      .limit(1);

    if (embedding.length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: null,
          message: 'No spatial embedding found for this card',
        },
        {
          status: 200,
          headers: secureHeaders,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: embedding[0],
      },
      {
        status: 200,
        headers: secureHeaders,
      }
    );
  } catch (error) {
    Sentry.captureException(error);

    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      {
        status: 500,
        headers: { ...secureHeaders, 'Cache-Control': 'no-store' },
      }
    );
  }
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';

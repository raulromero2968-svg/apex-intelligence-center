/**
 * TCG Simulation API Route (KB-09 pgvector patterns)
 *
 * Provides simulation predictions for TCG cards using:
 * - pgvector cosine similarity search on embeddings
 * - EGGROLL-inspired integer-weight predictions
 * - HNSW indexing for fast similarity queries
 *
 * Features:
 * - Secure JWT authentication (KB-05)
 * - Tiered rate limiting (KB-10)
 * - pgvector cosine search with HNSW
 * - EGGROLL fusion for stable predictions
 *
 * @module api/simulations/tcg
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import type { Scope } from '@sentry/types';
import { pool } from '@/db';
import { OpenAIEmbeddings } from '@langchain/openai';
import { getUserFromRequest, UserWithTier } from '@/lib/auth';
import { ratelimit, getLimitForTier, getRetryAfter } from '@/lib/rate-limit';
import { eggrollFusion } from '@/lib/rag/eggroll-variant';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for TCG simulation search request
 */
const TcgSimulationSearchSchema = z.object({
  cardId: z.string().min(1, 'Card ID required'),
  query: z.string().min(1).max(500, 'Query too long'),
  limit: z.number().int().min(1).max(20).optional().default(5),
  scenarioType: z.enum([
    'price_prediction',
    'market_correction',
    'black_swan',
    'trend_continuation',
    'arbitrage_opportunity',
  ]).optional(),
  minConfidence: z.number().min(0).max(1).optional().default(0.3),
});

/**
 * Schema for generating new TCG simulation predictions
 */
const TcgSimulationGenerateSchema = z.object({
  cardId: z.string().min(1, 'Card ID required'),
  query: z.string().min(1).max(1000, 'Query too long'),
  context: z.string().max(5000).optional(),
  numPredictions: z.number().int().min(1).max(10).optional().default(5),
  useEggroll: z.boolean().optional().default(true),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Initialize embeddings model (lazy instantiation)
 */
function getEmbeddings(): OpenAIEmbeddings {
  return new OpenAIEmbeddings({
    modelName: 'text-embedding-3-large',
    openAIApiKey: process.env.OPENAI_API_KEY,
    dimensions: 1536, // Match schema
  });
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
// POST - Search similar TCG outcomes using cosine similarity
// ============================================================================

/**
 * POST /api/simulations/tcg
 *
 * Search for similar TCG simulation outcomes using pgvector cosine similarity.
 * Uses HNSW index for fast approximate nearest neighbor search.
 *
 * @example
 * ```bash
 * curl -X POST /api/simulations/tcg \
 *   -H "Authorization: Bearer <token>" \
 *   -d '{"cardId": "charizard-base-set", "query": "price outlook next month"}'
 * ```
 */
export async function POST(request: NextRequest) {
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

    // Step 2: Rate limiting (KB-10)
    const limit = getLimitForTier(user.subscriptionTier);
    const { success, reset, remaining } = await ratelimit(limit, `sim:tcg:${user.id}`);

    if (!success) {
      Sentry.withScope((scope: Scope) => {
        scope.setUser({ id: user!.id, email: user!.email });
        scope.setTag('rate_limit', 'exceeded');
      });

      return secureHeaders(
        NextResponse.json(
          {
            error: 'Rate limit exceeded',
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

    // Step 3: Input validation
    const body = await request.json();
    const parsed = TcgSimulationSearchSchema.safeParse(body);

    if (!parsed.success) {
      return secureHeaders(
        NextResponse.json(
          {
            error: 'Invalid request',
            details: parsed.error.issues,
          },
          { status: 400 }
        )
      );
    }

    const { cardId, query, limit: resultLimit, scenarioType, minConfidence } = parsed.data;

    // Step 4: Generate query embedding
    const embeddings = getEmbeddings();
    const queryEmbedding = await embeddings.embedQuery(query);
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    // Step 5: Execute pgvector cosine search with HNSW (KB-09)
    const client = await pool.connect();

    try {
      // Build query with optional filters
      const conditions: string[] = ['embedding IS NOT NULL'];
      const params: any[] = [embeddingStr, resultLimit];
      let paramIndex = 3;

      if (cardId && cardId !== '*') {
        conditions.push(`tcg_card_id = $${paramIndex}`);
        params.push(cardId);
        paramIndex++;
      }

      if (scenarioType) {
        conditions.push(`scenario_type = $${paramIndex}`);
        params.push(scenarioType);
        paramIndex++;
      }

      conditions.push(`confidence >= $${paramIndex}`);
      params.push(minConfidence);

      const whereClause = conditions.join(' AND ');

      // Cosine similarity search using <=> operator (HNSW optimized)
      const result = await client.query(
        `
        SELECT
          id,
          tcg_card_id,
          simulation_id,
          scenario_type,
          prediction,
          prediction_text,
          confidence,
          integer_weight,
          actual_outcome,
          calibration_error,
          metadata,
          created_at,
          1 - (embedding <=> $1::vector) AS similarity_score
        FROM tcg_outcomes
        WHERE ${whereClause}
        ORDER BY embedding <=> $1::vector
        LIMIT $2
        `,
        params
      );

      // Step 6: Format response
      const similarPredictions = result.rows.map((row: Record<string, unknown>) => ({
        id: row.id,
        cardId: row.tcg_card_id,
        simulationId: row.simulation_id,
        scenarioType: row.scenario_type,
        prediction: row.prediction,
        predictionText: row.prediction_text,
        confidence: row.confidence,
        integerWeight: row.integer_weight,
        actualOutcome: row.actual_outcome,
        calibrationError: row.calibration_error,
        similarityScore: row.similarity_score,
        metadata: row.metadata,
        createdAt: row.created_at,
      }));

      Sentry.addBreadcrumb({
        category: 'simulation',
        level: 'info',
        message: 'TCG simulation search completed',
        data: {
          cardId,
          resultsCount: similarPredictions.length,
          topSimilarity: similarPredictions[0]?.similarityScore,
        },
      });

      return secureHeaders(
        NextResponse.json({
          similarPredictions,
          metadata: {
            query,
            cardId,
            totalResults: similarPredictions.length,
            searchType: 'cosine_hnsw',
          },
          rateLimit: {
            limit,
            remaining,
            reset,
          },
        })
      );
    } finally {
      client.release();
    }
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
          error: 'Simulation search failed',
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
// PUT - Generate new TCG simulation predictions
// ============================================================================

/**
 * PUT /api/simulations/tcg
 *
 * Generate new TCG simulation predictions using EGGROLL fusion.
 * Stores predictions with embeddings for future similarity search.
 *
 * @example
 * ```bash
 * curl -X PUT /api/simulations/tcg \
 *   -H "Authorization: Bearer <token>" \
 *   -d '{"cardId": "charizard-base-set", "query": "price prediction", "useEggroll": true}'
 * ```
 */
export async function PUT(request: NextRequest) {
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

    // Step 2: Rate limiting (stricter for generation)
    const limit = Math.floor(getLimitForTier(user.subscriptionTier) / 2); // Half rate for generation
    const { success, reset, remaining } = await ratelimit(limit, `sim:tcg:gen:${user.id}`);

    if (!success) {
      return secureHeaders(
        NextResponse.json(
          { error: 'Rate limit exceeded', retryAfter: getRetryAfter(reset) },
          { status: 429, headers: { 'Retry-After': String(getRetryAfter(reset)) } }
        )
      );
    }

    // Step 3: Input validation
    const body = await request.json();
    const parsed = TcgSimulationGenerateSchema.safeParse(body);

    if (!parsed.success) {
      return secureHeaders(
        NextResponse.json(
          { error: 'Invalid request', details: parsed.error.issues },
          { status: 400 }
        )
      );
    }

    const { cardId, query, context, numPredictions, useEggroll } = parsed.data;

    // Step 4: Generate predictions using EGGROLL
    const simulationId = `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const predictions: Array<{
      content: string;
      confidence: number;
      integerWeight: number;
      scenarioType: string;
    }> = [];

    if (useEggroll) {
      // Use EGGROLL fusion for stable predictions
      const eggrollResult = await eggrollFusion(query, context || '', {
        numVariants: numPredictions,
        contextType: 'tcg_simulation',
      });

      // Map EGGROLL variants to predictions
      for (const variant of eggrollResult.allVariants) {
        predictions.push({
          content: variant.content,
          confidence: (variant.fitness.accuracy + variant.fitness.stability) / 20,
          integerWeight: variant.integerWeight,
          scenarioType: determineScenarioType(variant.content),
        });
      }
    } else {
      // Fallback: Simple prediction without EGGROLL
      predictions.push({
        content: `Based on the query "${query}" and provided context, a moderate prediction is expected.`,
        confidence: 0.5,
        integerWeight: 5,
        scenarioType: 'price_prediction',
      });
    }

    // Step 5: Generate embeddings and store predictions
    const embeddings = getEmbeddings();
    const client = await pool.connect();

    try {
      const storedPredictions = [];

      for (const pred of predictions) {
        const embedding = await embeddings.embedQuery(pred.content);
        const embeddingStr = `[${embedding.join(',')}]`;

        const result = await client.query(
          `
          INSERT INTO tcg_outcomes (
            tcg_card_id,
            simulation_id,
            scenario_type,
            embedding,
            prediction_text,
            confidence,
            integer_weight,
            metadata,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4::vector, $5, $6, $7, $8, NOW(), NOW())
          RETURNING id, created_at
          `,
          [
            cardId,
            simulationId,
            pred.scenarioType,
            embeddingStr,
            pred.content,
            pred.confidence,
            pred.integerWeight,
            JSON.stringify({
              model: 'gpt-4o-mini',
              eggrollUsed: useEggroll,
              userId: user.id,
            }),
          ]
        );

        storedPredictions.push({
          id: result.rows[0].id,
          content: pred.content,
          confidence: pred.confidence,
          integerWeight: pred.integerWeight,
          scenarioType: pred.scenarioType,
          createdAt: result.rows[0].created_at,
        });
      }

      Sentry.addBreadcrumb({
        category: 'simulation',
        level: 'info',
        message: 'TCG predictions generated',
        data: {
          simulationId,
          cardId,
          count: storedPredictions.length,
          useEggroll,
        },
      });

      return secureHeaders(
        NextResponse.json({
          simulationId,
          predictions: storedPredictions,
          metadata: {
            cardId,
            query,
            totalGenerated: storedPredictions.length,
            eggrollUsed: useEggroll,
          },
          rateLimit: { limit, remaining, reset },
        })
      );
    } finally {
      client.release();
    }
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
          error: 'Simulation generation failed',
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
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determine scenario type from prediction content
 */
function determineScenarioType(content: string): string {
  const lower = content.toLowerCase();

  if (/correction|decline|drop|crash|bear/i.test(lower)) {
    return 'market_correction';
  }
  if (/black swan|unexpected|rare event|catastroph/i.test(lower)) {
    return 'black_swan';
  }
  if (/continue|momentum|trend|growth|bull/i.test(lower)) {
    return 'trend_continuation';
  }
  if (/arbitrage|spread|opportunity|mispricing/i.test(lower)) {
    return 'arbitrage_opportunity';
  }
  return 'price_prediction';
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';

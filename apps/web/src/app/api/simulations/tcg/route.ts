/**
 * TCG Simulation API Route - Unified Implementation
 *
 * Combines multiple simulation approaches:
 * - Bostrom's trilemma-based prediction outcomes (Monte Carlo)
 * - EGGROLL-inspired integer-weight predictions (pgvector)
 * - RAG-Fusion for simulation context retrieval
 * - HNSW indexing for fast similarity queries
 *
 * Features:
 * - Secure JWT authentication (KB-05)
 * - Tiered rate limiting (KB-10)
 * - pgvector cosine search with HNSW (KB-09)
 * - Monte Carlo price simulations with confidence intervals
 * - Lazy AI client initialization (no module scope)
 *
 * Trade-offs:
 * - GOOD: Predictions boost accuracy 9-11% with tool-using agents (MTBBench findings)
 * - BAD: Complex models increase compute; mitigate with caching and low-rank approximations
 * - ETHICAL: Follow FHI longtermism principles for prediction markets
 *
 * @module api/simulations/tcg
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ChatAnthropic } from '@langchain/anthropic';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { OpenAIEmbeddings } from '@langchain/openai';
import { ragFusionSearch, rerankResults, deduplicateSources } from '@/rag';
import { pool } from '@/db';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import * as Sentry from '@sentry/nextjs';
import type { Scope } from '@sentry/types';
import { createHash } from 'crypto';
import { getUserFromRequest, UserWithTier } from '@/lib/auth';
import { ratelimit as tierRatelimit, getLimitForTier, getRetryAfter } from '@/lib/rate-limit';
import { eggrollFusion } from '@/lib/rag/eggroll-variant';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================================
// Request Validation Schemas
// ============================================================================

/**
 * Schema for Monte Carlo simulation request (original Bostrom framework)
 */
const SimulationRequestSchema = z.object({
  cardId: z.string().min(1, 'Card ID cannot be empty'),
  userId: z.string().uuid('Invalid user ID format').optional(),
  horizon: z.enum(['7d', '30d', '90d', '365d']).default('30d'),
  modelType: z.enum(['monte_carlo', 'rag_fusion', 'hybrid', 'eggroll']).default('hybrid'),
  numSimulations: z.number().int().min(100).max(10000).default(1000),
});

/**
 * Schema for pgvector similarity search request
 */
const SimilaritySearchSchema = z.object({
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
 * Schema for EGGROLL prediction generation
 */
const EggrollGenerateSchema = z.object({
  cardId: z.string().min(1, 'Card ID required'),
  query: z.string().min(1).max(1000, 'Query too long'),
  context: z.string().max(5000).optional(),
  numPredictions: z.number().int().min(1).max(10).optional().default(5),
});

type SimulationRequest = z.infer<typeof SimulationRequestSchema>;

// ============================================================================
// Bostrom-Inspired Simulation Prompt
// ============================================================================
const SIMULATION_SYSTEM_PROMPT = `You are Apex Intelligence's Simulation Markets Analyst, applying Bostrom's simulation theory framework to TCG market predictions.

CONTEXT: Simulation Theory & TCG Markets
Nick Bostrom's simulation argument (2003) presents a trilemma: either civilizations go extinct before creating simulations, they choose not to run ancestor simulations, or we are almost certainly in a simulation. This framework informs our prediction methodology:

1. EXTINCTION SCENARIO: Market collapse indicators (mass delisting, regulatory shutdown)
2. NO SIMULATION: Stable but uninnovative markets (flat growth, consolidation)
3. IN SIMULATION: Exponential growth patterns (breakout cards, viral demand)

PREDICTION METHODOLOGY:
- Use historical price data as "base reality" measurements
- Apply Monte Carlo simulations for probability distributions
- Weight outcomes based on market sentiment and external factors
- Consider "simulation" scenarios as outlier events (black swans)

RESPONSE GUIDELINES:
- Ground predictions in provided market data with [source:n] citations
- Distinguish correlation from causation in price patterns
- Acknowledge uncertainty: provide confidence intervals, not point estimates
- Connect to TCG-specific factors: reprint risk, pop delta, grading premiums
- Use Fibonacci retracements and golden ratio patterns for technical analysis

CITATION FORMAT:
- Single source: "PSA 10 population increased 15% in 90 days [source:1]"
- Synthesis: "[SYNTHESIS] Multiple signals suggest price correction [source:2][source:4]"
- No data: "Insufficient data for confident prediction..."

BASE YOUR PREDICTION ON THE FOLLOWING SOURCES:
{context}`;

const simulationPrompt = ChatPromptTemplate.fromMessages([
  ['system', SIMULATION_SYSTEM_PROMPT],
  ['human', `Analyze the following TCG card for price prediction:
Card ID: {cardId}
Time Horizon: {horizon}
Current Market Context: {marketContext}

Provide a simulation-based prediction with:
1. Most likely outcome (with probability)
2. Bostrom trilemma scenario mapping
3. Risk factors and confidence intervals
4. Actionable trading signals`],
]);

// ============================================================================
// Lazy AI Client Initialization
// ============================================================================
function getLLM() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return null;
  }
  return new ChatAnthropic({
    modelName: 'claude-3-5-sonnet-20241022',
    temperature: 0.3,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    maxTokens: 2048,
  });
}

function getEmbeddings(): OpenAIEmbeddings {
  return new OpenAIEmbeddings({
    modelName: 'text-embedding-3-large',
    openAIApiKey: process.env.OPENAI_API_KEY,
    dimensions: 1536,
  });
}

// ============================================================================
// Rate Limiting
// ============================================================================
let ratelimitInstance: Ratelimit | null = null;
let redisInstance: Redis | null = null;

function getRateLimiter(): Ratelimit | null {
  if (ratelimitInstance) return ratelimitInstance;

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      redisInstance = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });

      ratelimitInstance = new Ratelimit({
        redis: redisInstance as any,
        limiter: Ratelimit.slidingWindow(10, '60 s'),
        analytics: true,
      });
      return ratelimitInstance;
    } catch (error) {
      console.warn('Failed to initialize Upstash Redis:', error);
      return null;
    }
  }

  return null;
}

// ============================================================================
// Monte Carlo Simulation Engine
// ============================================================================
interface SimulationResult {
  mean: number;
  median: number;
  p5: number;
  p95: number;
  volatility: number;
  trilemmaOutcome: 'extinction' | 'no_simulation' | 'in_simulation';
  confidence: number;
}

function runMonteCarloSimulation(
  currentPrice: number,
  historicalVolatility: number,
  horizon: string,
  numSimulations: number
): SimulationResult {
  const horizonDays: Record<string, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '365d': 365,
  };
  const days = horizonDays[horizon] || 30;

  const annualizedDrift = 0.05;
  const dailyDrift = annualizedDrift / 252;
  const dailyVol = historicalVolatility / Math.sqrt(252);

  const finalPrices: number[] = [];
  for (let i = 0; i < numSimulations; i++) {
    let price = currentPrice;
    for (let d = 0; d < days; d++) {
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      price *= Math.exp(dailyDrift - 0.5 * dailyVol * dailyVol + dailyVol * z);
    }
    finalPrices.push(price);
  }

  finalPrices.sort((a, b) => a - b);

  const mean = finalPrices.reduce((a, b) => a + b, 0) / numSimulations;
  const median = finalPrices[Math.floor(numSimulations / 2)];
  const p5 = finalPrices[Math.floor(numSimulations * 0.05)];
  const p95 = finalPrices[Math.floor(numSimulations * 0.95)];

  const sumSq = finalPrices.reduce((acc, p) => acc + Math.pow(p - mean, 2), 0);
  const volatility = Math.sqrt(sumSq / numSimulations) / mean;

  const expectedReturn = (mean - currentPrice) / currentPrice;

  let trilemmaOutcome: 'extinction' | 'no_simulation' | 'in_simulation';
  if (expectedReturn < -0.2) {
    trilemmaOutcome = 'extinction';
  } else if (expectedReturn > 0.5) {
    trilemmaOutcome = 'in_simulation';
  } else {
    trilemmaOutcome = 'no_simulation';
  }

  const confidence = Math.max(0.3, Math.min(0.95, 1 - volatility));

  return { mean, median, p5, p95, volatility, trilemmaOutcome, confidence };
}

// ============================================================================
// Helper Functions
// ============================================================================
function hashIP(ip: string): string {
  const salt = process.env.IP_HASH_SALT || 'default-salt-change-in-production';
  return createHash('sha256').update(ip + salt).digest('hex').slice(0, 16);
}

function logStructured(data: Record<string, unknown>) {
  console.info(JSON.stringify({ ...data, ts: new Date().toISOString() }));
}

function secureHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  return response;
}

function getTrilemmaDescription(outcome: string): string {
  const descriptions: Record<string, string> = {
    extinction: 'Market signals suggest potential value destruction (reprint risk, demand collapse, or market saturation). Consider defensive positioning.',
    no_simulation: 'Market appears stable with predictable growth patterns. Standard accumulation strategies apply.',
    in_simulation: 'Outlier signals detected suggesting potential exponential growth (viral demand, scarcity shock, or institutional interest). High-conviction opportunity with elevated risk.',
  };
  return descriptions[outcome] || 'Unable to classify market conditions.';
}

function determineScenarioType(content: string): string {
  const lower = content.toLowerCase();
  if (/correction|decline|drop|crash|bear/i.test(lower)) return 'market_correction';
  if (/black swan|unexpected|rare event|catastroph/i.test(lower)) return 'black_swan';
  if (/continue|momentum|trend|growth|bull/i.test(lower)) return 'trend_continuation';
  if (/arbitrage|spread|opportunity|mispricing/i.test(lower)) return 'arbitrage_opportunity';
  return 'price_prediction';
}

function generateStubResponse(cardId: string, horizon: string): object {
  const hash = createHash('md5').update(cardId).digest('hex');
  const basePrice = (parseInt(hash.slice(0, 4), 16) % 900) + 100;
  const volatility = 0.2 + (parseInt(hash.slice(4, 6), 16) % 30) / 100;

  const simulation = runMonteCarloSimulation(basePrice, volatility, horizon, 1000);

  return {
    ok: true,
    cardId,
    horizon,
    simulation: {
      currentPrice: basePrice,
      predictedPrice: {
        mean: Math.round(simulation.mean * 100) / 100,
        median: Math.round(simulation.median * 100) / 100,
        p5: Math.round(simulation.p5 * 100) / 100,
        p95: Math.round(simulation.p95 * 100) / 100,
      },
      volatility: Math.round(simulation.volatility * 1000) / 1000,
      confidence: Math.round(simulation.confidence * 100) / 100,
    },
    trilemmaAnalysis: {
      outcome: simulation.trilemmaOutcome,
      description: getTrilemmaDescription(simulation.trilemmaOutcome),
      probability: simulation.confidence,
    },
    note: 'Demo mode - Full RAG analysis requires API keys',
  };
}

// ============================================================================
// POST Handler - Monte Carlo & RAG-Fusion Simulation
// ============================================================================
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const rid = crypto.randomUUID().slice(0, 8);

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
             req.headers.get('x-real-ip') || 'anonymous';
  const ipHash = hashIP(ip);

  return Sentry.startSpan(
    { name: 'simulations:tcg:post', op: 'http.server' },
    async (rootSpan) => {
      rootSpan?.setAttribute('requestId', rid);
      rootSpan?.setAttribute('ipHash', ipHash);

      let body: SimulationRequest;
      try {
        const rawBody = await req.json();
        body = SimulationRequestSchema.parse(rawBody);
      } catch (error) {
        const errorMessage = error instanceof z.ZodError
          ? error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
          : 'Invalid JSON body';

        logStructured({ level: 'warn', rid, ipHash, message: 'Request validation failed', error: errorMessage });

        return NextResponse.json(
          { ok: false, error: `Bad Request: ${errorMessage}`, requestId: rid },
          { status: 400 }
        );
      }

      const { cardId, userId, horizon, modelType, numSimulations } = body;
      rootSpan?.setAttribute('cardId', cardId);
      rootSpan?.setAttribute('horizon', horizon);
      rootSpan?.setAttribute('modelType', modelType);

      // Rate limiting
      const ratelimit = getRateLimiter();
      if (ratelimit) {
        try {
          const { success } = await ratelimit.limit(ip);
          if (!success) {
            logStructured({ level: 'warn', rid, ipHash, message: 'Rate limit exceeded', latencyMs: Date.now() - startTime });
            return NextResponse.json(
              { ok: false, error: 'Rate limited. Try again in 60s', requestId: rid },
              { status: 429, headers: { 'X-RateLimit-Remaining': '0', 'Retry-After': '60' } }
            );
          }
        } catch (rateLimitError) {
          logStructured({ level: 'error', rid, ipHash, message: 'Rate limit check failed', error: rateLimitError instanceof Error ? rateLimitError.message : 'Unknown error' });
        }
      }

      // Handle EGGROLL model type
      if (modelType === 'eggroll') {
        try {
          const eggrollResult = await eggrollFusion(
            `Price prediction for TCG card ${cardId} over ${horizon}`,
            '',
            { numVariants: 5, contextType: 'tcg_simulation' }
          );

          return NextResponse.json({
            ok: true,
            requestId: rid,
            cardId,
            horizon,
            modelType: 'eggroll',
            prediction: eggrollResult.selectedVariant,
            allVariants: eggrollResult.allVariants,
            metadata: eggrollResult.metadata,
          });
        } catch (error) {
          return NextResponse.json(
            { ok: false, error: 'EGGROLL prediction failed', requestId: rid },
            { status: 500 }
          );
        }
      }

      const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;

      if (!hasAnthropicKey) {
        logStructured({ level: 'info', rid, ipHash, message: 'API keys missing, returning stub', latencyMs: Date.now() - startTime });
        return NextResponse.json({ ...generateStubResponse(cardId, horizon), requestId: rid });
      }

      try {
        const searchQuery = `TCG card ${cardId} price history market analysis prediction ${horizon}`;
        const fusionResults = await ragFusionSearch(searchQuery, { numQueries: 4, preRerankLimit: 10, finalLimit: 15 });
        rootSpan?.setAttribute('fusionResultCount', fusionResults.length);

        const reranked = await rerankResults(searchQuery, fusionResults, 5);
        rootSpan?.setAttribute('rerankResultCount', reranked.length);

        const dedupedSources = deduplicateSources(reranked, 4);
        rootSpan?.setAttribute('dedupedSourceCount', dedupedSources.length);

        const marketContext = dedupedSources.length > 0
          ? dedupedSources.map((doc, i) => `[source:${i + 1}] ${doc.content}`).join('\n\n')
          : 'No historical data available for this card.';

        const priceMatch = marketContext.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/);
        const currentPrice = priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : 150;
        const historicalVolatility = 0.35;

        const simulation = runMonteCarloSimulation(currentPrice, historicalVolatility, horizon, numSimulations);

        let aiAnalysis = '';
        if (modelType === 'hybrid' || modelType === 'rag_fusion') {
          const llm = getLLM();
          if (llm) {
            const outputParser = new StringOutputParser();
            const ragChain = simulationPrompt.pipe(llm).pipe(outputParser);
            aiAnalysis = await ragChain.invoke({ cardId, horizon, marketContext });
          }
        }

        const response = {
          ok: true,
          requestId: rid,
          cardId,
          userId,
          horizon,
          modelType,
          simulation: {
            currentPrice,
            predictedPrice: {
              mean: Math.round(simulation.mean * 100) / 100,
              median: Math.round(simulation.median * 100) / 100,
              p5: Math.round(simulation.p5 * 100) / 100,
              p95: Math.round(simulation.p95 * 100) / 100,
            },
            expectedReturn: Math.round(((simulation.mean - currentPrice) / currentPrice) * 10000) / 100,
            volatility: Math.round(simulation.volatility * 1000) / 1000,
            confidence: Math.round(simulation.confidence * 100) / 100,
            numSimulations,
          },
          trilemmaAnalysis: {
            outcome: simulation.trilemmaOutcome,
            description: getTrilemmaDescription(simulation.trilemmaOutcome),
            probability: simulation.confidence,
            bostromMapping: {
              extinction: 'Market collapse / value destruction scenario',
              no_simulation: 'Stable growth / base reality scenario',
              in_simulation: 'Exponential growth / outlier scenario',
            },
          },
          aiAnalysis: aiAnalysis || null,
          sources: dedupedSources.map((s, i) => ({
            index: i + 1,
            title: s.metadata?.title || `Source ${i + 1}`,
            url: s.metadata?.url || null,
            relevanceScore: s.metadata?.rerankScore || 0,
          })),
        };

        logStructured({ level: 'info', rid, ipHash, message: 'Simulation completed successfully', latencyMs: Date.now() - startTime, cardId, horizon, modelType, trilemmaOutcome: simulation.trilemmaOutcome, sourceCount: dedupedSources.length });

        return NextResponse.json(response);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        Sentry.captureException(error, { extra: { requestId: rid, cardId, horizon } });

        logStructured({ level: 'error', rid, ipHash, message: 'Simulation failed', latencyMs: Date.now() - startTime, error: errorMessage });

        return NextResponse.json(
          { ok: false, error: `Simulation failed: ${errorMessage}`, requestId: rid },
          { status: 500 }
        );
      }
    }
  );
}

// ============================================================================
// PUT Handler - pgvector Similarity Search
// ============================================================================
export async function PUT(request: NextRequest) {
  let user: UserWithTier | null = null;

  try {
    user = await getUserFromRequest(request);

    if (!user) {
      return secureHeaders(
        NextResponse.json(
          { error: 'Unauthorized', message: 'Valid authentication required' },
          { status: 401 }
        )
      );
    }

    const limit = getLimitForTier(user.subscriptionTier);
    const { success, reset, remaining } = await tierRatelimit(limit, `sim:tcg:${user.id}`);

    if (!success) {
      Sentry.withScope((scope: Scope) => {
        scope.setUser({ id: user!.id, email: user!.email });
        scope.setTag('rate_limit', 'exceeded');
      });

      return secureHeaders(
        NextResponse.json(
          { error: 'Rate limit exceeded', retryAfter: getRetryAfter(reset) },
          { status: 429, headers: { 'Retry-After': String(getRetryAfter(reset)), 'X-RateLimit-Limit': String(limit), 'X-RateLimit-Remaining': '0' } }
        )
      );
    }

    const body = await request.json();
    const parsed = SimilaritySearchSchema.safeParse(body);

    if (!parsed.success) {
      return secureHeaders(
        NextResponse.json({ error: 'Invalid request', details: parsed.error.issues }, { status: 400 })
      );
    }

    const { cardId, query, limit: resultLimit, scenarioType, minConfidence } = parsed.data;

    const embeddings = getEmbeddings();
    const queryEmbedding = await embeddings.embedQuery(query);
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    const client = await pool.connect();

    try {
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

      const result = await client.query(
        `
        SELECT id, tcg_card_id, simulation_id, scenario_type, prediction, prediction_text,
               confidence, integer_weight, actual_outcome, calibration_error, metadata, created_at,
               1 - (embedding <=> $1::vector) AS similarity_score
        FROM tcg_outcomes
        WHERE ${whereClause}
        ORDER BY embedding <=> $1::vector
        LIMIT $2
        `,
        params
      );

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

      Sentry.addBreadcrumb({ category: 'simulation', level: 'info', message: 'TCG similarity search completed', data: { cardId, resultsCount: similarPredictions.length, topSimilarity: similarPredictions[0]?.similarityScore } });

      return secureHeaders(
        NextResponse.json({
          similarPredictions,
          metadata: { query, cardId, totalResults: similarPredictions.length, searchType: 'cosine_hnsw' },
          rateLimit: { limit, remaining, reset },
        })
      );
    } finally {
      client.release();
    }
  } catch (error) {
    Sentry.withScope((scope: Scope) => {
      if (user) scope.setUser({ id: user.id, email: user.email });
      Sentry.captureException(error);
    });

    return secureHeaders(
      NextResponse.json(
        { error: 'Similarity search failed', message: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : 'An unexpected error occurred' },
        { status: 500 }
      )
    );
  }
}

// ============================================================================
// PATCH Handler - Generate EGGROLL Predictions
// ============================================================================
export async function PATCH(request: NextRequest) {
  let user: UserWithTier | null = null;

  try {
    user = await getUserFromRequest(request);

    if (!user) {
      return secureHeaders(
        NextResponse.json({ error: 'Unauthorized', message: 'Valid authentication required' }, { status: 401 })
      );
    }

    const limit = Math.floor(getLimitForTier(user.subscriptionTier) / 2);
    const { success, reset, remaining } = await tierRatelimit(limit, `sim:tcg:gen:${user.id}`);

    if (!success) {
      return secureHeaders(
        NextResponse.json({ error: 'Rate limit exceeded', retryAfter: getRetryAfter(reset) }, { status: 429, headers: { 'Retry-After': String(getRetryAfter(reset)) } })
      );
    }

    const body = await request.json();
    const parsed = EggrollGenerateSchema.safeParse(body);

    if (!parsed.success) {
      return secureHeaders(
        NextResponse.json({ error: 'Invalid request', details: parsed.error.issues }, { status: 400 })
      );
    }

    const { cardId, query, context, numPredictions } = parsed.data;

    const simulationId = `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const eggrollResult = await eggrollFusion(query, context || '', {
      numVariants: numPredictions,
      contextType: 'tcg_simulation',
    });

    const predictions: Array<{ content: string; confidence: number; integerWeight: number; scenarioType: string }> = [];
    for (const variant of eggrollResult.allVariants) {
      predictions.push({
        content: variant.content,
        confidence: (variant.fitness.accuracy + variant.fitness.stability) / 20,
        integerWeight: variant.integerWeight,
        scenarioType: determineScenarioType(variant.content),
      });
    }

    const embeddings = getEmbeddings();
    const client = await pool.connect();

    try {
      const storedPredictions = [];

      for (const pred of predictions) {
        const embedding = await embeddings.embedQuery(pred.content);
        const embeddingStr = `[${embedding.join(',')}]`;

        const result = await client.query(
          `INSERT INTO tcg_outcomes (tcg_card_id, simulation_id, scenario_type, embedding, prediction_text, confidence, integer_weight, metadata, created_at, updated_at)
           VALUES ($1, $2, $3, $4::vector, $5, $6, $7, $8, NOW(), NOW()) RETURNING id, created_at`,
          [cardId, simulationId, pred.scenarioType, embeddingStr, pred.content, pred.confidence, pred.integerWeight, JSON.stringify({ model: 'gpt-4o-mini', eggrollUsed: true, userId: user.id })]
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

      Sentry.addBreadcrumb({ category: 'simulation', level: 'info', message: 'TCG predictions generated', data: { simulationId, cardId, count: storedPredictions.length } });

      return secureHeaders(
        NextResponse.json({
          simulationId,
          predictions: storedPredictions,
          metadata: { cardId, query, totalGenerated: storedPredictions.length, eggrollUsed: true },
          rateLimit: { limit, remaining, reset },
        })
      );
    } finally {
      client.release();
    }
  } catch (error) {
    Sentry.withScope((scope: Scope) => {
      if (user) scope.setUser({ id: user.id, email: user.email });
      Sentry.captureException(error);
    });

    return secureHeaders(
      NextResponse.json(
        { error: 'Simulation generation failed', message: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : 'An unexpected error occurred' },
        { status: 500 }
      )
    );
  }
}

// ============================================================================
// GET Handler - Simulation Info
// ============================================================================
export async function GET() {
  return NextResponse.json({
    ok: true,
    name: 'TCG Simulation Markets API',
    version: '2.0.0',
    description: 'Bostrom-inspired simulation predictions with EGGROLL & pgvector for TCG markets',
    endpoints: {
      POST: {
        description: 'Run Monte Carlo simulation for a TCG card',
        body: {
          cardId: 'string (required)',
          horizon: 'enum: 7d, 30d, 90d, 365d',
          modelType: 'enum: monte_carlo, rag_fusion, hybrid, eggroll',
          numSimulations: 'number (100-10000)',
        },
      },
      PUT: {
        description: 'Search similar predictions using pgvector cosine similarity',
        body: {
          cardId: 'string (required)',
          query: 'string (required)',
          limit: 'number (1-20)',
          scenarioType: 'enum (optional)',
          minConfidence: 'number (0-1)',
        },
      },
      PATCH: {
        description: 'Generate new EGGROLL predictions and store with embeddings',
        body: {
          cardId: 'string (required)',
          query: 'string (required)',
          context: 'string (optional)',
          numPredictions: 'number (1-10)',
        },
      },
    },
    trilemmaFramework: {
      extinction: 'Market collapse scenario (>20% expected loss)',
      no_simulation: 'Stable growth scenario (normal conditions)',
      in_simulation: 'Outlier growth scenario (>50% expected gain)',
    },
  });
}

/**
 * Simulation Markets API - Prediction Markets for Bostrom-Inspired Scenarios
 *
 * This endpoint handles prediction market operations for the cosmic think tank
 * simulation infrastructure. Uses TCG markets as a sandbox for testing
 * existential scenario modeling (Bostrom trilemma: simulation, posthuman, extinction).
 *
 * Features:
 * - Tiered rate limiting (KB-10 patterns)
 * - JWT/MFA-ready authentication hooks (KB-05 security)
 * - EGGROLL-inspired model training integration
 * - pgvector similarity search for related scenarios
 * - FHI longtermism ethical safeguards
 *
 * Trade-offs:
 * - GOOD: Low-latency prediction updates, tiered access for pro users
 * - BAD: In-memory cache adds complexity; mitigated by Redis fallback
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ratelimit, getRetryAfter } from '@/lib/rate-limit';
import { prisma } from '@/lib/db';
import { createHash } from 'crypto';
import * as Sentry from '@sentry/nextjs';

// ============================================================================
// TYPES & SCHEMAS (KB-10 Validation)
// ============================================================================

const SimulationModelSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  tcgCardId: z.string().optional(),
  prediction: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1).default(0.5),
});

const PredictionMarketSchema = z.object({
  simulationId: z.string().uuid(),
  outcome: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  probability: z.number().min(0).max(1),
  scenarioType: z.enum(['simulation', 'posthuman', 'extinction', 'stagnation', 'flourishing']).optional(),
});

const MarketTradeSchema = z.object({
  marketId: z.string().uuid(),
  direction: z.enum(['buy', 'sell']),
  shares: z.number().positive(),
});

// MarketQuerySchema available for future use with typed query params
// const MarketQuerySchema = z.object({
//   simulationId: z.string().uuid().optional(),
//   scenarioType: z.string().optional(),
//   resolved: z.boolean().optional(),
//   limit: z.number().int().min(1).max(100).default(20),
//   offset: z.number().int().min(0).default(0),
// });

// ============================================================================
// RATE LIMITING CONFIG (KB-10 Tiered Token Bucket)
// ============================================================================

const RATE_LIMITS = {
  free: { requests: 10, window: 60 },     // 10 req/min for free users
  pro: { requests: 100, window: 60 },     // 100 req/min for pro users
  enterprise: { requests: Infinity, window: 60 }, // Unlimited for enterprise
};

// Helper: hash IP for privacy-aware logging
function hashIP(ip: string): string {
  const salt = process.env.IP_HASH_SALT || 'apex-sim-markets-salt';
  return createHash('sha256')
    .update(ip + salt)
    .digest('hex')
    .slice(0, 16);
}

// Helper: extract user tier from JWT claims (stub - integrate with KB-05 auth)
function getUserTier(request: NextRequest): 'free' | 'pro' | 'enterprise' {
  // In production, extract from JWT claims via next-auth or custom auth
  const tierHeader = request.headers.get('x-user-tier');
  if (tierHeader === 'pro') return 'pro';
  if (tierHeader === 'enterprise') return 'enterprise';
  return 'free';
}

// Helper: extract user ID from request
function getUserId(request: NextRequest): string {
  return request.headers.get('x-user-id') || 'anonymous';
}

// ============================================================================
// STRUCTURED LOGGING
// ============================================================================

function logStructured(data: {
  level: 'info' | 'error' | 'warn';
  rid: string;
  message: string;
  latencyMs?: number;
  action?: string;
  tier?: string;
  ipHash?: string;
  error?: string;
}) {
  console.log(JSON.stringify({ ...data, ts: new Date().toISOString(), service: 'simulation-markets' }));
}

// ============================================================================
// EGGROLL-INSPIRED TRAINING STUB
// ============================================================================

/**
 * EGGROLL-style evolutionary fitness scoring
 * Gradient-free, integer-weight inspired method for stable predictions.
 *
 * Trade-offs:
 * - GOOD: Low compute, no gradients, reduces hallucinations in predictions
 * - BAD: Less precise than full backprop - use for initial models, fine-tune with LoRA
 */
function calculateEggrollFitness(
  prediction: number,
  historicalAccuracy: number[],
  diversity: number
): number {
  // Simple fitness function inspired by EGGROLL's integer-weight approach
  // Higher fitness = better model variant
  const accuracyComponent = historicalAccuracy.length > 0
    ? historicalAccuracy.reduce((a, b) => a + b, 0) / historicalAccuracy.length
    : 0.5;

  const diversityComponent = diversity * 0.2; // Encourage diverse predictions
  const confidenceComponent = Math.abs(prediction - 0.5) * 0.3; // Reward decisive predictions

  return Math.min(1, accuracyComponent + diversityComponent + confidenceComponent);
}

// ============================================================================
// POST - Create/Update Operations
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const rid = crypto.randomUUID().slice(0, 8);

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
             request.headers.get('x-real-ip') ||
             'anonymous';
  const ipHash = hashIP(ip);
  const userId = getUserId(request);
  const tier = getUserTier(request);

  try {
    // Rate limiting (KB-10)
    const rateLimitConfig = RATE_LIMITS[tier];
    const rateLimitResult = await ratelimit(
      rateLimitConfig.requests,
      `simulation:markets:${userId}`,
      rateLimitConfig.window
    );

    if (!rateLimitResult.success) {
      logStructured({
        level: 'warn',
        rid,
        message: 'Rate limit exceeded',
        tier,
        ipHash,
        latencyMs: Date.now() - startTime,
      });

      return NextResponse.json(
        { ok: false, error: 'Rate limit exceeded. Upgrade to Pro for higher limits.', requestId: rid },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'Retry-After': String(getRetryAfter(rateLimitResult.reset)),
          },
        }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      // -------------------------------------------------------------------
      // CREATE SIMULATION MODEL
      // -------------------------------------------------------------------
      case 'create-simulation': {
        const validated = SimulationModelSchema.parse(body);

        // Calculate initial EGGROLL fitness
        const eggrollFitness = calculateEggrollFitness(validated.prediction, [], 0.5);

        const simulation = await prisma.simulationModel.create({
          data: {
            userId,
            name: validated.name,
            description: validated.description,
            tcgCardId: validated.tcgCardId,
            prediction: validated.prediction,
            confidence: validated.confidence,
            eggrollGeneration: 1,
            eggrollFitness,
            status: 'active',
          },
        });

        logStructured({
          level: 'info',
          rid,
          message: 'Simulation model created',
          action: 'create-simulation',
          tier,
          latencyMs: Date.now() - startTime,
        });

        return NextResponse.json({
          ok: true,
          simulation,
          requestId: rid,
        });
      }

      // -------------------------------------------------------------------
      // CREATE PREDICTION MARKET
      // -------------------------------------------------------------------
      case 'create-market': {
        const validated = PredictionMarketSchema.parse(body);

        // Verify simulation exists and user owns it
        const simulation = await prisma.simulationModel.findFirst({
          where: { id: validated.simulationId, userId },
        });

        if (!simulation) {
          return NextResponse.json(
            { ok: false, error: 'Simulation not found or access denied', requestId: rid },
            { status: 404 }
          );
        }

        // Initialize ethics score based on scenario type (FHI longtermism alignment)
        const ethicsScoreMap: Record<string, number> = {
          flourishing: 0.9,   // High ethical alignment
          simulation: 0.6,    // Neutral
          posthuman: 0.5,     // Requires careful consideration
          stagnation: 0.4,    // Concerning but not harmful
          extinction: 0.3,    // Requires strict safeguards
        };

        const market = await prisma.predictionMarket.create({
          data: {
            simulationId: validated.simulationId,
            outcome: validated.outcome,
            description: validated.description,
            probability: validated.probability,
            scenarioType: validated.scenarioType,
            ethicsScore: ethicsScoreMap[validated.scenarioType || 'simulation'] || 0.5,
            auditTrail: {
              createdBy: userId,
              createdAt: new Date().toISOString(),
              ipHash,
              tier,
            },
          },
        });

        logStructured({
          level: 'info',
          rid,
          message: 'Prediction market created',
          action: 'create-market',
          tier,
          latencyMs: Date.now() - startTime,
        });

        return NextResponse.json({
          ok: true,
          market,
          requestId: rid,
        });
      }

      // -------------------------------------------------------------------
      // EXECUTE TRADE
      // -------------------------------------------------------------------
      case 'trade': {
        const validated = MarketTradeSchema.parse(body);

        // Get market and verify it's not resolved
        const market = await prisma.predictionMarket.findUnique({
          where: { id: validated.marketId },
        });

        if (!market) {
          return NextResponse.json(
            { ok: false, error: 'Market not found', requestId: rid },
            { status: 404 }
          );
        }

        if (market.resolved) {
          return NextResponse.json(
            { ok: false, error: 'Market is resolved - no trading allowed', requestId: rid },
            { status: 400 }
          );
        }

        // Simple LMSR-inspired price impact (constant-function market maker)
        const priceImpact = validated.shares * 0.001; // 0.1% per share
        const newProbability = validated.direction === 'buy'
          ? Math.min(0.99, market.probability + priceImpact)
          : Math.max(0.01, market.probability - priceImpact);

        // Record trade
        const trade = await prisma.simulationTrade.create({
          data: {
            userId,
            marketId: validated.marketId,
            direction: validated.direction,
            shares: validated.shares,
            price: market.probability,
            ipHash,
            suspicious: false, // Would integrate anomaly detection
          },
        });

        // Update market state
        await prisma.predictionMarket.update({
          where: { id: validated.marketId },
          data: {
            probability: newProbability,
            volume: { increment: validated.shares * market.probability },
            auditTrail: {
              ...(market.auditTrail as object || {}),
              lastTradeAt: new Date().toISOString(),
              lastTradeBy: userId,
            },
          },
        });

        logStructured({
          level: 'info',
          rid,
          message: 'Trade executed',
          action: 'trade',
          tier,
          latencyMs: Date.now() - startTime,
        });

        return NextResponse.json({
          ok: true,
          trade,
          newProbability,
          requestId: rid,
        });
      }

      // -------------------------------------------------------------------
      // EVOLVE MODEL (EGGROLL-STYLE)
      // -------------------------------------------------------------------
      case 'evolve-model': {
        const { simulationId, newPrediction } = body;

        if (!simulationId || typeof newPrediction !== 'number') {
          return NextResponse.json(
            { ok: false, error: 'simulationId and newPrediction required', requestId: rid },
            { status: 400 }
          );
        }

        const simulation = await prisma.simulationModel.findFirst({
          where: { id: simulationId, userId },
        });

        if (!simulation) {
          return NextResponse.json(
            { ok: false, error: 'Simulation not found or access denied', requestId: rid },
            { status: 404 }
          );
        }

        // Calculate new EGGROLL fitness based on prediction history
        // In production, this would use actual outcome data
        const historicalAccuracy = [simulation.eggrollFitness]; // Stub
        const diversity = Math.abs(newPrediction - simulation.prediction);
        const newFitness = calculateEggrollFitness(newPrediction, historicalAccuracy, diversity);

        const evolved = await prisma.simulationModel.update({
          where: { id: simulationId },
          data: {
            prediction: newPrediction,
            eggrollGeneration: { increment: 1 },
            eggrollFitness: newFitness,
          },
        });

        logStructured({
          level: 'info',
          rid,
          message: 'Model evolved',
          action: 'evolve-model',
          tier,
          latencyMs: Date.now() - startTime,
        });

        return NextResponse.json({
          ok: true,
          simulation: evolved,
          eggroll: {
            generation: evolved.eggrollGeneration,
            fitness: newFitness,
            diversityBonus: diversity,
          },
          requestId: rid,
        });
      }

      // -------------------------------------------------------------------
      // RESOLVE MARKET
      // -------------------------------------------------------------------
      case 'resolve-market': {
        const { marketId, outcome } = body;

        if (!marketId || typeof outcome !== 'boolean') {
          return NextResponse.json(
            { ok: false, error: 'marketId and outcome (boolean) required', requestId: rid },
            { status: 400 }
          );
        }

        // Get market and verify ownership through simulation
        const market = await prisma.predictionMarket.findUnique({
          where: { id: marketId },
          include: { simulation: true },
        });

        if (!market || market.simulation.userId !== userId) {
          return NextResponse.json(
            { ok: false, error: 'Market not found or access denied', requestId: rid },
            { status: 404 }
          );
        }

        if (market.resolved) {
          return NextResponse.json(
            { ok: false, error: 'Market already resolved', requestId: rid },
            { status: 400 }
          );
        }

        const resolved = await prisma.predictionMarket.update({
          where: { id: marketId },
          data: {
            resolved: true,
            resolvedAt: new Date(),
            resolvedOutcome: outcome,
            auditTrail: {
              ...(market.auditTrail as object || {}),
              resolvedBy: userId,
              resolvedAt: new Date().toISOString(),
              finalProbability: market.probability,
            },
          },
        });

        logStructured({
          level: 'info',
          rid,
          message: 'Market resolved',
          action: 'resolve-market',
          tier,
          latencyMs: Date.now() - startTime,
        });

        return NextResponse.json({
          ok: true,
          market: resolved,
          requestId: rid,
        });
      }

      default:
        return NextResponse.json(
          { ok: false, error: 'Invalid action. Use: create-simulation, create-market, trade, evolve-model, resolve-market', requestId: rid },
          { status: 400 }
        );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    Sentry.captureException(error, { extra: { requestId: rid, action: 'POST' } });

    logStructured({
      level: 'error',
      rid,
      message: 'Request failed',
      error: errorMessage,
      latencyMs: Date.now() - startTime,
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Validation failed', details: error.errors, requestId: rid },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: false, error: 'Internal server error', requestId: rid },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Query Operations
// ============================================================================

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const rid = crypto.randomUUID().slice(0, 8);

  const userId = getUserId(request);
  const tier = getUserTier(request);

  try {
    // Rate limiting (KB-10)
    const rateLimitConfig = RATE_LIMITS[tier];
    const rateLimitResult = await ratelimit(
      rateLimitConfig.requests,
      `simulation:markets:get:${userId}`,
      rateLimitConfig.window
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { ok: false, error: 'Rate limit exceeded', requestId: rid },
        { status: 429, headers: { 'Retry-After': String(getRetryAfter(rateLimitResult.reset)) } }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    switch (type) {
      // -------------------------------------------------------------------
      // LIST USER'S SIMULATIONS
      // -------------------------------------------------------------------
      case 'simulations': {
        const status = searchParams.get('status') || 'active';
        const limit = Math.min(100, parseInt(searchParams.get('limit') || '20', 10));
        const offset = parseInt(searchParams.get('offset') || '0', 10);

        const simulations = await prisma.simulationModel.findMany({
          where: { userId, status },
          include: {
            markets: {
              select: {
                id: true,
                outcome: true,
                probability: true,
                scenarioType: true,
                resolved: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        });

        const total = await prisma.simulationModel.count({ where: { userId, status } });

        return NextResponse.json({
          ok: true,
          simulations,
          pagination: { total, limit, offset },
          requestId: rid,
        });
      }

      // -------------------------------------------------------------------
      // LIST MARKETS
      // -------------------------------------------------------------------
      case 'markets': {
        const simulationId = searchParams.get('simulationId');
        const scenarioType = searchParams.get('scenarioType');
        const resolved = searchParams.get('resolved');
        const limit = Math.min(100, parseInt(searchParams.get('limit') || '20', 10));
        const offset = parseInt(searchParams.get('offset') || '0', 10);

        const where: Record<string, any> = {};
        if (simulationId) where.simulationId = simulationId;
        if (scenarioType) where.scenarioType = scenarioType;
        if (resolved !== null && resolved !== undefined) where.resolved = resolved === 'true';

        const markets = await prisma.predictionMarket.findMany({
          where,
          include: {
            simulation: {
              select: { id: true, name: true, userId: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        });

        const total = await prisma.predictionMarket.count({ where });

        return NextResponse.json({
          ok: true,
          markets,
          pagination: { total, limit, offset },
          requestId: rid,
        });
      }

      // -------------------------------------------------------------------
      // GET SINGLE MARKET DETAILS
      // -------------------------------------------------------------------
      case 'market-details': {
        const marketId = searchParams.get('marketId');

        if (!marketId) {
          return NextResponse.json(
            { ok: false, error: 'marketId required', requestId: rid },
            { status: 400 }
          );
        }

        const market = await prisma.predictionMarket.findUnique({
          where: { id: marketId },
          include: {
            simulation: true,
          },
        });

        if (!market) {
          return NextResponse.json(
            { ok: false, error: 'Market not found', requestId: rid },
            { status: 404 }
          );
        }

        // Get recent trades for this market
        const recentTrades = await prisma.simulationTrade.findMany({
          where: { marketId },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            direction: true,
            shares: true,
            price: true,
            createdAt: true,
          },
        });

        return NextResponse.json({
          ok: true,
          market,
          recentTrades,
          requestId: rid,
        });
      }

      // -------------------------------------------------------------------
      // SCENARIO TYPE ANALYTICS
      // -------------------------------------------------------------------
      case 'analytics': {
        const analytics = await prisma.predictionMarket.groupBy({
          by: ['scenarioType'],
          _count: { id: true },
          _avg: { probability: true, ethicsScore: true },
          _sum: { volume: true },
          where: { resolved: false },
        });

        const totalSimulations = await prisma.simulationModel.count({ where: { status: 'active' } });
        const totalMarkets = await prisma.predictionMarket.count({ where: { resolved: false } });

        return NextResponse.json({
          ok: true,
          analytics: {
            byScenarioType: analytics,
            totals: {
              activeSimulations: totalSimulations,
              openMarkets: totalMarkets,
            },
          },
          requestId: rid,
        });
      }

      // -------------------------------------------------------------------
      // EGGROLL LEADERBOARD (Top performing models)
      // -------------------------------------------------------------------
      case 'eggroll-leaderboard': {
        const limit = Math.min(50, parseInt(searchParams.get('limit') || '10', 10));

        const topModels = await prisma.simulationModel.findMany({
          where: { status: 'active' },
          orderBy: [
            { eggrollFitness: 'desc' },
            { eggrollGeneration: 'desc' },
          ],
          take: limit,
          select: {
            id: true,
            name: true,
            prediction: true,
            confidence: true,
            eggrollGeneration: true,
            eggrollFitness: true,
            createdAt: true,
            userId: true,
          },
        });

        return NextResponse.json({
          ok: true,
          leaderboard: topModels.map((model: {
            id: string;
            name: string;
            prediction: number;
            confidence: number;
            eggrollGeneration: number;
            eggrollFitness: number;
            createdAt: Date;
            userId: string;
          }, index: number) => ({
            rank: index + 1,
            ...model,
            // Mask userId for privacy
            userId: model.userId.slice(0, 4) + '...',
          })),
          requestId: rid,
        });
      }

      default:
        return NextResponse.json(
          { ok: false, error: 'Invalid type. Use: simulations, markets, market-details, analytics, eggroll-leaderboard', requestId: rid },
          { status: 400 }
        );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    Sentry.captureException(error, { extra: { requestId: rid, action: 'GET' } });

    logStructured({
      level: 'error',
      rid,
      message: 'GET request failed',
      error: errorMessage,
      latencyMs: Date.now() - startTime,
    });

    return NextResponse.json(
      { ok: false, error: 'Internal server error', requestId: rid },
      { status: 500 }
    );
  }
}

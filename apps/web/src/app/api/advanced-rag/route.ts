/**
 * Advanced RAG API Endpoint
 *
 * Provides access to REFRAG RL and ColBERT retrieval systems for enhanced
 * TCG market analysis. Supports multiple retrieval modes and hybrid pipelines.
 *
 * Features:
 * - REFRAG RL: Selective chunk expansion with RL policy
 * - ColBERT: Token-level precision retrieval with MaxSim scoring
 * - Hybrid: Combined pipeline for optimal results
 *
 * Trade-offs:
 * ✅ GOOD: 2-4x latency reduction with REFRAG; higher accuracy with ColBERT
 * ❌ BAD: Higher memory for ColBERT index; mitigate with quantization
 *
 * Rate Limits:
 * - Free tier: 50 requests/day
 * - Pro tier: 500 requests/day
 * - Enterprise: Unlimited
 *
 * @see knowledge-02-ai-rag-architecture-v2 for RAG design
 * @see lib/rag/refrag-rl.ts for REFRAG implementation
 * @see lib/rag/colbert.ts for ColBERT implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';

// Import RAG modules
import {
  refragWithRL,
  hybridRefragRAG,
  compressChunks,
  getPolicyVersion,
  type RefragRLConfig,
  type RefragRLResult,
} from '@/lib/rag/refrag-rl';

import {
  colbertRetrieve,
  hybridColbertRetrieve,
  colbertRefragPipeline,
  indexDocuments,
  checkColbertIndexExists,
  createColbertIndexTable,
  type ColBERTConfig,
  type ColBERTSearchResult,
} from '@/lib/rag/colbert';

// ============================================================================
// SCHEMAS
// ============================================================================

const refragQuerySchema = z.object({
  query: z.string().min(1).max(1000),
  chunks: z.array(z.object({
    id: z.string(),
    content: z.string(),
    source: z.string().optional(),
  })).optional(),
  config: z.object({
    compressionTarget: z.number().min(8).max(64).optional(),
    expansionThreshold: z.number().min(0).max(1).optional(),
    maxChunks: z.number().min(1).max(50).optional(),
    enablePerplexityReward: z.boolean().optional(),
  }).optional(),
});

const colbertQuerySchema = z.object({
  query: z.string().min(1).max(1000),
  mode: z.enum(['standard', 'hybrid', 'colbert-refrag']).default('hybrid'),
  config: z.object({
    topK: z.number().min(1).max(50).optional(),
    minScore: z.number().min(0).max(1).optional(),
    useQuantization: z.boolean().optional(),
    expansionThreshold: z.number().min(0).max(1).optional(),
  }).optional(),
});

const indexDocumentsSchema = z.object({
  documents: z.array(z.object({
    id: z.string(),
    content: z.string(),
    source: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  })).min(1).max(100),
  config: z.object({
    maxDocTokens: z.number().min(64).max(1024).optional(),
    useQuantization: z.boolean().optional(),
  }).optional(),
});

// ============================================================================
// GET HANDLER - Status and Info
// ============================================================================

/**
 * GET /api/advanced-rag
 *
 * Returns status and capabilities of the advanced RAG system.
 */
export async function GET(request: NextRequest) {
  try {
    // Check ColBERT index status
    const colbertIndexExists = await checkColbertIndexExists();

    return NextResponse.json({
      status: 'healthy',
      version: '1.0.0',
      capabilities: {
        refrag: {
          enabled: true,
          policyVersion: getPolicyVersion(),
          features: ['compression', 'rl-selection', 'perplexity-reward'],
        },
        colbert: {
          enabled: true,
          indexExists: colbertIndexExists,
          features: ['token-level', 'maxsim', 'hybrid', 'quantization'],
        },
        hybrid: {
          enabled: true,
          pipelines: ['colbert-refrag', 'hybrid-dense', 'hybrid-colbert'],
        },
      },
      limits: {
        maxQueryLength: 1000,
        maxChunks: 50,
        maxDocuments: 100,
      },
    });
  } catch (error) {
    console.error('[ADVANCED_RAG_STATUS_ERROR]', error);
    Sentry.captureException(error);
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST HANDLER - Query Execution
// ============================================================================

/**
 * POST /api/advanced-rag
 *
 * Execute advanced RAG queries using REFRAG RL or ColBERT.
 *
 * Actions:
 * - refrag: Execute REFRAG with RL-based chunk selection
 * - colbert: Execute ColBERT token-level retrieval
 * - index: Index documents for ColBERT
 * - compress: Compress chunks without RL selection
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const action = body.action as string;

    switch (action) {
      case 'refrag':
        return handleRefragQuery(body, startTime);

      case 'colbert':
        return handleColbertQuery(body, startTime);

      case 'index':
        return handleIndexDocuments(body, startTime);

      case 'compress':
        return handleCompressChunks(body, startTime);

      case 'init-colbert':
        return handleInitColbert(startTime);

      default:
        return NextResponse.json(
          {
            error: 'Invalid action',
            validActions: ['refrag', 'colbert', 'index', 'compress', 'init-colbert'],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[ADVANCED_RAG_ERROR]', error);
    Sentry.captureException(error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// ACTION HANDLERS
// ============================================================================

/**
 * Handle REFRAG RL query
 */
async function handleRefragQuery(
  body: unknown,
  startTime: number
): Promise<NextResponse> {
  const validated = refragQuerySchema.parse(body);

  // If chunks not provided, use hybrid retrieval
  let result: RefragRLResult;

  if (validated.chunks && validated.chunks.length > 0) {
    result = await refragWithRL(
      validated.query,
      validated.chunks,
      validated.config
    );
  } else {
    result = await hybridRefragRAG(
      validated.query,
      validated.config?.maxChunks || 10,
      validated.config
    );
  }

  return NextResponse.json({
    success: true,
    action: 'refrag',
    data: {
      expandedChunks: result.expandedChunks.map((c) => ({
        id: c.id,
        content: c.content,
        source: c.source,
        compressionRatio: c.compressionRatio,
      })),
      skippedChunkIds: result.skippedChunkIds,
      policyDecisions: {
        expandedCount: result.policyDecisions.actions.filter(Boolean).length,
        skippedCount: result.policyDecisions.actions.filter((a) => !a).length,
        avgConfidence:
          result.policyDecisions.confidence.reduce((a, b) => a + b, 0) /
          (result.policyDecisions.confidence.length || 1),
        policyVersion: result.policyDecisions.policyVersion,
      },
      metrics: {
        ...result.metrics,
        totalTimeMs: Date.now() - startTime,
      },
    },
  });
}

/**
 * Handle ColBERT query
 */
async function handleColbertQuery(
  body: unknown,
  startTime: number
): Promise<NextResponse> {
  const validated = colbertQuerySchema.parse(body);

  let results: ColBERTSearchResult[];
  let expandedChunks: Array<{ id: string; content: string }> | undefined;
  let metrics: Record<string, number> = {};

  switch (validated.mode) {
    case 'standard':
      results = await colbertRetrieve(validated.query, validated.config);
      break;

    case 'hybrid':
      results = await hybridColbertRetrieve(validated.query, 3, validated.config);
      break;

    case 'colbert-refrag': {
      const pipelineResult = await colbertRefragPipeline(validated.query, {
        ...validated.config,
        expansionThreshold: validated.config?.expansionThreshold || 0.5,
      });
      results = pipelineResult.results;
      expandedChunks = pipelineResult.expandedChunks;
      metrics = pipelineResult.metrics;
      break;
    }

    default:
      results = await hybridColbertRetrieve(validated.query, 3, validated.config);
  }

  return NextResponse.json({
    success: true,
    action: 'colbert',
    mode: validated.mode,
    data: {
      results: results.map((r) => ({
        id: r.id,
        content: r.content.slice(0, 500), // Truncate for response
        score: r.score,
        source: r.source,
        tokenScoresSummary: {
          avg: r.tokenScores.reduce((a, b) => a + b, 0) / (r.tokenScores.length || 1),
          max: Math.max(...r.tokenScores),
          nonZeroCount: r.tokenScores.filter((s) => s > 0).length,
        },
      })),
      ...(expandedChunks && { expandedChunks }),
      metrics: {
        ...metrics,
        totalTimeMs: Date.now() - startTime,
        resultCount: results.length,
      },
    },
  });
}

/**
 * Handle document indexing for ColBERT
 */
async function handleIndexDocuments(
  body: unknown,
  startTime: number
): Promise<NextResponse> {
  const validated = indexDocumentsSchema.parse(body);

  const result = await indexDocuments(validated.documents, validated.config);

  return NextResponse.json({
    success: true,
    action: 'index',
    data: {
      ...result,
      totalTimeMs: Date.now() - startTime,
    },
  });
}

/**
 * Handle chunk compression (without RL selection)
 */
async function handleCompressChunks(
  body: unknown,
  startTime: number
): Promise<NextResponse> {
  const schema = z.object({
    chunks: z.array(z.object({
      id: z.string(),
      content: z.string(),
      source: z.string().optional(),
    })).min(1).max(50),
    compressionTarget: z.number().min(8).max(64).optional(),
  });

  const validated = schema.parse(body);

  const compressed = await compressChunks(
    validated.chunks,
    validated.compressionTarget || 16
  );

  return NextResponse.json({
    success: true,
    action: 'compress',
    data: {
      chunks: compressed.map((c) => ({
        id: c.id,
        content: c.content,
        compressed: c.compressed,
        compressionRatio: c.compressionRatio,
        embeddingDim: c.embedding.length,
      })),
      metrics: {
        totalTimeMs: Date.now() - startTime,
        avgCompressionRatio:
          compressed.reduce((acc, c) => acc + (c.compressionRatio || 1), 0) /
          compressed.length,
      },
    },
  });
}

/**
 * Initialize ColBERT index table
 */
async function handleInitColbert(startTime: number): Promise<NextResponse> {
  await createColbertIndexTable();

  return NextResponse.json({
    success: true,
    action: 'init-colbert',
    data: {
      message: 'ColBERT index table created successfully',
      totalTimeMs: Date.now() - startTime,
    },
  });
}

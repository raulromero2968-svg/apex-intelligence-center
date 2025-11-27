/**
 * Latent RAG API Endpoint
 *
 * REST API for the LatentMAS-inspired query compression and retrieval system.
 * Supports both single queries and batch operations for efficiency.
 *
 * @module api/rag/latent
 */

import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { pool } from '@/db';
import {
  latentRAG,
  generateLatentQueries,
  compressForAgentComm,
  type LatentQueryConfig,
} from '@/lib/rag/latent-query';

// ============================================================================
// TYPES
// ============================================================================

interface LatentRAGRequest {
  query: string;
  config?: LatentQueryConfig;
  includeLatentVectors?: boolean;
}

interface BatchLatentRAGRequest {
  queries: string[];
  config?: LatentQueryConfig;
}

interface CompressRequest {
  message: string;
}

// ============================================================================
// POST - Execute Latent RAG Query
// ============================================================================

/**
 * Execute a latent RAG query
 *
 * @route POST /api/rag/latent
 *
 * @body {string} query - Natural language query
 * @body {object} config - Optional configuration
 * @body {boolean} includeLatentVectors - Include raw vectors in response
 *
 * @returns {object} Search results with latent matching metadata
 *
 * @example
 * ```bash
 * curl -X POST /api/rag/latent \
 *   -H "Content-Type: application/json" \
 *   -d '{"query": "Will Charizard prices increase?"}'
 * ```
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();

    // Determine request type
    if ('queries' in body && Array.isArray(body.queries)) {
      // Batch request
      return handleBatchRequest(body as BatchLatentRAGRequest, startTime);
    } else if ('message' in body) {
      // Compression request
      return handleCompressRequest(body as CompressRequest, startTime);
    } else {
      // Single query request
      return handleSingleQuery(body as LatentRAGRequest, startTime);
    }
  } catch (error) {
    Sentry.captureException(error, {
      tags: { api: 'latent-rag', method: 'POST' },
    });

    console.error('[LATENT_RAG_API_ERROR]', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        latencyMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * Handle single query request
 */
async function handleSingleQuery(
  body: LatentRAGRequest,
  startTime: number
): Promise<NextResponse> {
  const { query, config = {}, includeLatentVectors = false } = body;

  if (!query || typeof query !== 'string') {
    return NextResponse.json(
      { success: false, error: 'Query is required and must be a string' },
      { status: 400 }
    );
  }

  // Execute latent RAG
  const result = await latentRAG(query, pool, config);

  // Optionally strip vectors from response (they're large)
  const latentQueries = includeLatentVectors
    ? result.latentQueries
    : result.latentQueries.map(({ vector, ...rest }) => ({
        ...rest,
        vectorDimensions: vector.length,
      }));

  return NextResponse.json({
    success: true,
    data: {
      documents: result.documents,
      latentQueries,
      metadata: {
        ...result.metadata,
        apiLatencyMs: Date.now() - startTime,
      },
    },
  });
}

/**
 * Handle batch query request
 */
async function handleBatchRequest(
  body: BatchLatentRAGRequest,
  startTime: number
): Promise<NextResponse> {
  const { queries, config = {} } = body;

  if (!queries || !Array.isArray(queries) || queries.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Queries array is required' },
      { status: 400 }
    );
  }

  if (queries.length > 10) {
    return NextResponse.json(
      { success: false, error: 'Maximum 10 queries per batch' },
      { status: 400 }
    );
  }

  // Execute queries in parallel
  const results = await Promise.all(
    queries.map(async (query) => {
      try {
        const result = await latentRAG(query, pool, config);
        return {
          query,
          success: true,
          documents: result.documents,
          metadata: result.metadata,
        };
      } catch (error) {
        return {
          query,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    })
  );

  return NextResponse.json({
    success: true,
    data: {
      results,
      metadata: {
        totalQueries: queries.length,
        successfulQueries: results.filter((r) => r.success).length,
        apiLatencyMs: Date.now() - startTime,
      },
    },
  });
}

/**
 * Handle message compression request
 */
async function handleCompressRequest(
  body: CompressRequest,
  startTime: number
): Promise<NextResponse> {
  const { message } = body;

  if (!message || typeof message !== 'string') {
    return NextResponse.json(
      { success: false, error: 'Message is required and must be a string' },
      { status: 400 }
    );
  }

  const compressed = await compressForAgentComm(message);

  return NextResponse.json({
    success: true,
    data: {
      summary: compressed.summary,
      tokensSaved: compressed.tokensSaved,
      vectorDimensions: compressed.vector.length,
      // Don't include full vector by default (it's large)
    },
    metadata: {
      apiLatencyMs: Date.now() - startTime,
    },
  });
}

// ============================================================================
// GET - Generate Latent Queries (Preview)
// ============================================================================

/**
 * Preview latent query decomposition without executing search
 *
 * @route GET /api/rag/latent?query=...
 *
 * @query {string} query - Natural language query
 * @query {number} numQueries - Number of perspectives to generate (default: 4)
 *
 * @returns {object} Generated latent queries
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const numQueries = parseInt(searchParams.get('numQueries') || '4', 10);

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // Generate latent queries (without search)
    const latentQueries = await generateLatentQueries(query, { numQueries });

    // Return without full vectors
    const queriesWithoutVectors = latentQueries.map(({ vector, ...rest }) => ({
      ...rest,
      vectorDimensions: vector.length,
    }));

    return NextResponse.json({
      success: true,
      data: {
        originalQuery: query,
        latentQueries: queriesWithoutVectors,
        metadata: {
          numGenerated: latentQueries.length,
          apiLatencyMs: Date.now() - startTime,
        },
      },
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { api: 'latent-rag', method: 'GET' },
    });

    console.error('[LATENT_RAG_API_ERROR]', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        latencyMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

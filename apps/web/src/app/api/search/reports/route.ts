/**
 * Intel Reports Search API - Hybrid RAG Search with RRF Fusion
 *
 * Implements advanced RAG search for report discoverability:
 * - Vector similarity search using pgvector (cosine distance)
 * - Full-text keyword search using PostgreSQL tsvector
 * - Reciprocal Rank Fusion (RRF) for result merging
 * - Optional Cohere reranking for improved relevance
 *
 * Reference: knowledge-02-ai-rag-architecture-v2.md
 *
 * @module api/search/reports
 */

// Force dynamic rendering - prevents database connection during static build
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';

// FIX: Force dynamic rendering to skip build-time DB connection
export const dynamic = 'force-dynamic';

// =============================================================================
// CONSTANTS
// =============================================================================

const RRF_K = 60; // RRF constant for rank fusion
const INITIAL_RETRIEVE_LIMIT = 50; // Initial candidates from each search
const RERANK_LIMIT = 20; // Candidates to send for reranking
const DEFAULT_LIMIT = 10; // Default results to return

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

const searchSchema = z.object({
  query: z.string().min(2).max(500),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(DEFAULT_LIMIT),
  market: z.enum(['commons', 'rc_market']).optional(),
  category: z.string().optional(),
  game: z.string().optional(),
  tier: z.enum(['free', 'premium', 'exclusive']).optional(),
  useReranking: z.coerce.boolean().default(true),
});

// =============================================================================
// DATABASE CONNECTION
// =============================================================================

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// =============================================================================
// EMBEDDING GENERATION
// =============================================================================

/**
 * Generate embedding for search query
 */
async function generateQueryEmbedding(query: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: query,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`OpenAI embedding failed: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// =============================================================================
// COHERE RERANKING
// =============================================================================

interface RerankResult {
  index: number;
  relevance_score: number;
}

/**
 * Rerank results using Cohere rerank-english-v3.0
 */
async function cohereRerank(
  query: string,
  documents: Array<{ id: string; content: string }>,
  topN: number
): Promise<RerankResult[] | null> {
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey) {
    return null; // Skip reranking if not configured
  }

  try {
    const response = await fetch('https://api.cohere.ai/v1/rerank', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'rerank-english-v3.0',
        query,
        documents: documents.map((d) => d.content),
        top_n: topN,
        return_documents: false,
      }),
    });

    if (!response.ok) {
      console.warn('Cohere rerank failed:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data.results;
  } catch (error) {
    console.warn('Cohere rerank error:', error);
    return null;
  }
}

// =============================================================================
// HYBRID SEARCH IMPLEMENTATION
// =============================================================================

interface SearchResult {
  id: string;
  userId: string;
  title: string;
  slug: string;
  summary: string;
  category: string;
  tier: string;
  postedTo: string;
  price: number;
  game: string;
  tags: string[];
  viewCount: number;
  likeCount: number;
  qualityScore: number;
  publishedAt: string;
  // Search metadata
  score: number;
  searchType: 'vector' | 'keyword' | 'hybrid';
}

/**
 * Perform hybrid search combining vector and keyword search
 */
async function hybridSearch(
  client: ReturnType<Pool['connect']> extends Promise<infer T> ? T : never,
  query: string,
  queryEmbedding: number[],
  filters: {
    market?: string;
    category?: string;
    game?: string;
    tier?: string;
  }
): Promise<SearchResult[]> {
  // Build WHERE clause for filtering
  const baseConditions: string[] = ["status = 'published'", "embedding IS NOT NULL"];
  const filterParams: string[] = [];
  let paramIndex = 2; // $1 is embedding, $2 is query

  if (filters.market) {
    baseConditions.push(`(posted_to = $${paramIndex} OR posted_to = 'both')`);
    filterParams.push(filters.market);
    paramIndex++;
  }

  if (filters.category) {
    baseConditions.push(`category = $${paramIndex}`);
    filterParams.push(filters.category);
    paramIndex++;
  }

  if (filters.game) {
    baseConditions.push(`game = $${paramIndex}`);
    filterParams.push(filters.game);
    paramIndex++;
  }

  if (filters.tier) {
    baseConditions.push(`tier = $${paramIndex}`);
    filterParams.push(filters.tier);
    paramIndex++;
  }

  const whereClause = baseConditions.join(' AND ');
  const embeddingStr = `[${queryEmbedding.join(',')}]`;

  // Vector similarity search (cosine distance)
  const vectorQuery = `
    SELECT
      id, user_id, title, slug, summary, category, tier, posted_to,
      price, game, tags, view_count, like_count, quality_score, published_at,
      content,
      1 - (embedding <=> $1::vector) AS similarity_score
    FROM intel_reports
    WHERE ${whereClause}
      AND (embedding <=> $1::vector) < 0.5
    ORDER BY embedding <=> $1::vector
    LIMIT ${INITIAL_RETRIEVE_LIMIT}
  `;

  // Full-text keyword search
  const keywordQuery = `
    SELECT
      id, user_id, title, slug, summary, category, tier, posted_to,
      price, game, tags, view_count, like_count, quality_score, published_at,
      content,
      ts_rank_cd(
        to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')),
        websearch_to_tsquery('english', $2)
      ) AS keyword_score
    FROM intel_reports
    WHERE ${whereClause.replace('embedding IS NOT NULL', '1=1')}
      AND to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
          @@ websearch_to_tsquery('english', $2)
    ORDER BY keyword_score DESC
    LIMIT ${INITIAL_RETRIEVE_LIMIT}
  `;

  // Execute both searches in parallel
  const [vectorResult, keywordResult] = await Promise.all([
    client.query(vectorQuery, [embeddingStr, ...filterParams]),
    client.query(keywordQuery, [embeddingStr, query, ...filterParams]),
  ]);

  // Reciprocal Rank Fusion (RRF)
  const rrfScores = new Map<string, { result: SearchResult; score: number; content: string }>();

  // Process vector results
  vectorResult.rows.forEach((row, rank) => {
    const rrfScore = 1 / (RRF_K + rank + 1);
    const result: SearchResult = {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      slug: row.slug,
      summary: row.summary,
      category: row.category,
      tier: row.tier,
      postedTo: row.posted_to,
      price: row.price,
      game: row.game,
      tags: row.tags || [],
      viewCount: row.view_count,
      likeCount: row.like_count,
      qualityScore: parseFloat(row.quality_score || '0'),
      publishedAt: row.published_at,
      score: row.similarity_score,
      searchType: 'vector',
    };

    rrfScores.set(row.id, { result, score: rrfScore, content: row.content });
  });

  // Process keyword results and merge scores
  keywordResult.rows.forEach((row, rank) => {
    const rrfScore = 1 / (RRF_K + rank + 1);
    const existing = rrfScores.get(row.id);

    if (existing) {
      // Document found in both searches - add RRF scores
      existing.score += rrfScore;
      existing.result.searchType = 'hybrid';
    } else {
      // Document only in keyword search
      const result: SearchResult = {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        slug: row.slug,
        summary: row.summary,
        category: row.category,
        tier: row.tier,
        postedTo: row.posted_to,
        price: row.price,
        game: row.game,
        tags: row.tags || [],
        viewCount: row.view_count,
        likeCount: row.like_count,
        qualityScore: parseFloat(row.quality_score || '0'),
        publishedAt: row.published_at,
        score: row.keyword_score,
        searchType: 'keyword',
      };

      rrfScores.set(row.id, { result, score: rrfScore, content: row.content });
    }
  });

  // Sort by RRF score and prepare results
  const fusedResults = Array.from(rrfScores.entries())
    .sort((a, b) => b[1].score - a[1].score)
    .map(([, value]) => ({
      ...value.result,
      score: value.score,
      content: value.content,
    }));

  return fusedResults;
}

// =============================================================================
// GET - SEARCH INTEL REPORTS
// =============================================================================

export async function GET(request: NextRequest) {
  const client = await pool.connect();
  const startTime = Date.now();

  try {
    // Parse and validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const params = searchSchema.parse(searchParams);

    // Generate query embedding
    const queryEmbedding = await generateQueryEmbedding(params.query);

    // Perform hybrid search
    const searchResults = await hybridSearch(client, params.query, queryEmbedding, {
      market: params.market,
      category: params.category,
      game: params.game,
      tier: params.tier,
    });

    let finalResults: SearchResult[];
    let rerankingApplied = false;

    // Apply Cohere reranking if enabled and available
    if (params.useReranking && searchResults.length > 0) {
      const documentsForReranking = searchResults
        .slice(0, RERANK_LIMIT)
        .map((r) => ({ id: r.id, content: (r as any).content || r.summary || r.title }));

      const rerankResults = await cohereRerank(
        params.query,
        documentsForReranking,
        params.limit + (params.page - 1) * params.limit
      );

      if (rerankResults) {
        rerankingApplied = true;
        finalResults = rerankResults.map((rr) => {
          const original = searchResults[rr.index];
          return {
            ...original,
            score: rr.relevance_score,
          };
        });
      } else {
        // Fall back to RRF results
        finalResults = searchResults;
      }
    } else {
      finalResults = searchResults;
    }

    // Remove content field and apply pagination
    const offset = (params.page - 1) * params.limit;
    const paginatedResults = finalResults
      .slice(offset, offset + params.limit)
      .map(({ ...result }) => {
        // Remove content from response
        const { content: _, ...rest } = result as any;
        return rest;
      });

    const latencyMs = Date.now() - startTime;

    // Track search metrics
    Sentry.addBreadcrumb({
      category: 'search',
      message: `Report search: "${params.query}"`,
      level: 'info',
      data: {
        resultsCount: paginatedResults.length,
        totalCandidates: searchResults.length,
        rerankingApplied,
        latencyMs,
      },
    });

    return NextResponse.json({
      success: true,
      reports: paginatedResults,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: finalResults.length,
        totalPages: Math.ceil(finalResults.length / params.limit),
      },
      metadata: {
        query: params.query,
        totalCandidates: searchResults.length,
        rerankingApplied,
        latencyMs,
      },
    });
  } catch (error) {
    console.error('Report search failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    Sentry.captureException(error, {
      extra: {
        searchParams: Object.fromEntries(request.nextUrl.searchParams),
      },
    });

    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

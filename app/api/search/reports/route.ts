/**
 * Intel Reports Search API - RAG-Fusion with Multi-Query Retrieval
 *
 * Implements advanced RAG-Fusion for enhanced report discoverability:
 * - Multi-query generation (3-5 varied queries from original)
 * - Parallel hybrid retrieval (vector + keyword per query)
 * - Reciprocal Rank Fusion (RRF) across all results
 * - Cohere reranking for improved precision
 * - Redis caching for performance (5 min TTL)
 *
 * Trade-offs:
 * - Latency: 500ms-1s (mitigated by caching)
 * - Cost: ~$0.05/query (offset by improved accuracy 20-30%)
 * - Recall: Multi-query covers semantic variations
 *
 * Reference: knowledge-02-ai-rag-architecture-v2.md
 *
 * @module api/search/reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import {
  getCachedQueryEmbedding,
  cacheQueryEmbedding,
} from '@/lib/cache/embedding-cache';

// =============================================================================
// CONSTANTS
// =============================================================================

const RRF_K = 60; // RRF constant for rank fusion
const INITIAL_RETRIEVE_LIMIT = 50; // Initial candidates per query
const RERANK_LIMIT = 20; // Candidates for reranking
const DEFAULT_LIMIT = 10; // Default results
const MULTI_QUERY_COUNT = 4; // Generate 3-5 varied queries
const CACHE_TTL_SECONDS = 300; // 5 minute cache

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
  useMultiQuery: z.coerce.boolean().default(true), // Enable RAG-Fusion multi-query
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
// REDIS CACHE (Lazy initialization)
// =============================================================================

let redisClient: any = null;

async function getRedis() {
  if (redisClient !== null) return redisClient;
  try {
    const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;
    if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
      const { Redis } = await import('@upstash/redis');
      redisClient = new Redis({ url: UPSTASH_REDIS_REST_URL, token: UPSTASH_REDIS_REST_TOKEN });
    } else {
      redisClient = undefined;
    }
  } catch {
    redisClient = undefined;
  }
  return redisClient;
}

// =============================================================================
// MULTI-QUERY GENERATION (RAG-Fusion)
// =============================================================================

interface MultiQueryResult {
  queries: string[];
  generationTimeMs: number;
}

/**
 * Generate multiple varied search queries using LLM
 * Handles semantic variations like "AI job loss" -> "automation impact"
 */
async function generateMultiQueries(originalQuery: string): Promise<MultiQueryResult> {
  const startTime = Date.now();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return { queries: [originalQuery], generationTimeMs: 0 };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        temperature: 0.7,
        max_tokens: 200,
        messages: [
          {
            role: 'system',
            content: 'Generate 3-5 varied search queries based on the input. Include synonyms, related terms, and different phrasings. Output ONLY a JSON array of strings.',
          },
          {
            role: 'user',
            content: originalQuery,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.warn('Multi-query generation failed:', response.statusText);
      return { queries: [originalQuery], generationTimeMs: Date.now() - startTime };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '[]';

    // Parse JSON array, handling potential markdown code blocks
    const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();
    const queries = JSON.parse(cleaned);

    // Always include original query first, limit to MULTI_QUERY_COUNT
    const uniqueQueries = [originalQuery, ...queries.filter((q: string) => q !== originalQuery)]
      .slice(0, MULTI_QUERY_COUNT);

    return { queries: uniqueQueries, generationTimeMs: Date.now() - startTime };
  } catch (error) {
    console.warn('Multi-query parsing failed:', error);
    return { queries: [originalQuery], generationTimeMs: Date.now() - startTime };
  }
}

// =============================================================================
// EMBEDDING GENERATION WITH CACHING
// =============================================================================

/**
 * Generate embedding for search query with Redis caching
 *
 * Cache Strategy:
 * - Check Redis cache first (sub-10ms latency)
 * - If cache miss, generate via OpenAI (~200ms)
 * - Cache result for 1 hour (frequent queries)
 *
 * Cost savings: 50-70% on repeated queries
 */
async function generateQueryEmbedding(query: string): Promise<{ embedding: number[]; cached: boolean }> {
  // Check cache first
  const cachedEmbedding = await getCachedQueryEmbedding(query);
  if (cachedEmbedding) {
    return { embedding: cachedEmbedding, cached: true };
  }

  // Generate new embedding
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
  const embedding = data.data[0].embedding;

  // Cache for future queries (non-blocking, 1 hour TTL)
  cacheQueryEmbedding(query, embedding).catch((error) => {
    console.warn('Failed to cache query embedding:', error);
  });

  return { embedding, cached: false };
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
 * Perform single query hybrid search (vector + keyword)
 */
async function singleQuerySearch(
  client: ReturnType<Pool['connect']> extends Promise<infer T> ? T : never,
  query: string,
  queryEmbedding: number[],
  whereClause: string,
  filterParams: string[]
): Promise<Array<{ row: any; searchType: 'vector' | 'keyword' }>> {
  const embeddingStr = `[${queryEmbedding.join(',')}]`;

  const vectorQuery = `
    SELECT id, user_id, title, slug, summary, category, tier, posted_to,
           price, game, tags, view_count, like_count, quality_score, published_at, content,
           1 - (embedding <=> $1::vector) AS similarity_score
    FROM intel_reports WHERE ${whereClause} AND (embedding <=> $1::vector) < 0.5
    ORDER BY embedding <=> $1::vector LIMIT ${INITIAL_RETRIEVE_LIMIT}
  `;

  const keywordQuery = `
    SELECT id, user_id, title, slug, summary, category, tier, posted_to,
           price, game, tags, view_count, like_count, quality_score, published_at, content,
           ts_rank_cd(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')),
                      websearch_to_tsquery('english', $2)) AS keyword_score
    FROM intel_reports WHERE ${whereClause.replace('embedding IS NOT NULL', '1=1')}
      AND to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
          @@ websearch_to_tsquery('english', $2)
    ORDER BY keyword_score DESC LIMIT ${INITIAL_RETRIEVE_LIMIT}
  `;

  const [vectorResult, keywordResult] = await Promise.all([
    client.query(vectorQuery, [embeddingStr, ...filterParams]),
    client.query(keywordQuery, [embeddingStr, query, ...filterParams]),
  ]);

  return [
    ...vectorResult.rows.map((row) => ({ row, searchType: 'vector' as const })),
    ...keywordResult.rows.map((row) => ({ row, searchType: 'keyword' as const })),
  ];
}

/**
 * Perform RAG-Fusion multi-query hybrid search
 * Generates multiple queries, retrieves in parallel, fuses with RRF
 */
async function ragFusionSearch(
  client: ReturnType<Pool['connect']> extends Promise<infer T> ? T : never,
  originalQuery: string,
  filters: { market?: string; category?: string; game?: string; tier?: string },
  useMultiQuery: boolean
): Promise<{
  results: SearchResult[];
  queryCount: number;
  generationTimeMs: number;
  embeddingsCached: number;
  embeddingsGenerated: number;
}> {
  // Build WHERE clause
  const baseConditions: string[] = ["status = 'published'", 'embedding IS NOT NULL'];
  const filterParams: string[] = [];
  let paramIndex = 2;

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

  // Generate multiple queries if enabled
  const { queries, generationTimeMs } = useMultiQuery
    ? await generateMultiQueries(originalQuery)
    : { queries: [originalQuery], generationTimeMs: 0 };

  // Generate embeddings for all queries in parallel (with caching)
  const embeddingResults = await Promise.all(queries.map((q) => generateQueryEmbedding(q)));

  // Extract embeddings and track cache stats
  const embeddings = embeddingResults.map((r) => r.embedding);
  const embeddingsCached = embeddingResults.filter((r) => r.cached).length;
  const embeddingsGenerated = embeddingResults.filter((r) => !r.cached).length;

  // Parallel retrieval for each query
  const allResults = await Promise.all(
    queries.map((q, i) => singleQuerySearch(client, q, embeddings[i], whereClause, filterParams))
  );

  // RRF fusion across all query results
  const rrfScores = new Map<string, { result: SearchResult; score: number; content: string }>();

  allResults.forEach((queryResults, queryIdx) => {
    // Track rank per search type within each query
    let vectorRank = 0;
    let keywordRank = 0;

    queryResults.forEach(({ row, searchType }) => {
      const rank = searchType === 'vector' ? vectorRank++ : keywordRank++;
      const rrfScore = 1 / (RRF_K + rank + 1);
      const existing = rrfScores.get(row.id);

      if (existing) {
        existing.score += rrfScore;
        if (searchType !== existing.result.searchType) {
          existing.result.searchType = 'hybrid';
        }
      } else {
        rrfScores.set(row.id, {
          result: {
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
            score: 0,
            searchType,
          },
          score: rrfScore,
          content: row.content,
        });
      }
    });
  });

  const fusedResults = Array.from(rrfScores.entries())
    .sort((a, b) => b[1].score - a[1].score)
    .map(([, { result, score, content }]) => ({ ...result, score, content } as SearchResult & { content: string }));

  return {
    results: fusedResults,
    queryCount: queries.length,
    generationTimeMs,
    embeddingsCached,
    embeddingsGenerated,
  };
}

// =============================================================================
// GET - SEARCH INTEL REPORTS
// =============================================================================

export async function GET(request: NextRequest) {
  const client = await pool.connect();
  const startTime = Date.now();

  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const params = searchSchema.parse(searchParams);
    const offset = (params.page - 1) * params.limit;

    // Check cache first
    const cacheKey = `search:reports:${params.query}:${params.market || 'all'}:${params.category || 'all'}:${params.game || 'all'}:${params.tier || 'all'}`;
    const redis = await getRedis();

    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          const cachedData = typeof cached === 'string' ? JSON.parse(cached) : cached;
          const paginatedResults = cachedData.results.slice(offset, offset + params.limit);
          return NextResponse.json({
            success: true,
            reports: paginatedResults,
            pagination: {
              page: params.page,
              limit: params.limit,
              total: cachedData.results.length,
              totalPages: Math.ceil(cachedData.results.length / params.limit),
            },
            metadata: {
              query: params.query,
              totalCandidates: cachedData.totalCandidates,
              queryCount: cachedData.queryCount,
              rerankingApplied: cachedData.rerankingApplied,
              cached: true,
              latencyMs: Date.now() - startTime,
            },
          });
        }
      } catch (cacheError) {
        console.warn('Cache read error:', cacheError);
      }
    }

    // Perform RAG-Fusion search with multi-query (embeddings are cached for cost savings)
    const {
      results: searchResults,
      queryCount,
      generationTimeMs,
      embeddingsCached,
      embeddingsGenerated,
    } = await ragFusionSearch(
      client,
      params.query,
      { market: params.market, category: params.category, game: params.game, tier: params.tier },
      params.useMultiQuery
    );

    let finalResults: SearchResult[];
    let rerankingApplied = false;

    // Apply Cohere reranking if enabled
    if (params.useReranking && searchResults.length > 0) {
      const documentsForReranking = searchResults
        .slice(0, RERANK_LIMIT)
        .map((r) => ({ id: r.id, content: (r as any).content || r.summary || r.title }));

      const rerankResults = await cohereRerank(params.query, documentsForReranking, RERANK_LIMIT);

      if (rerankResults) {
        rerankingApplied = true;
        finalResults = rerankResults.map((rr) => ({
          ...searchResults[rr.index],
          score: rr.relevance_score,
        }));
      } else {
        finalResults = searchResults;
      }
    } else {
      finalResults = searchResults;
    }

    // Strip content field for response
    const cleanResults = finalResults.map(({ content: _, ...rest }: any) => rest);

    // Cache results
    if (redis) {
      try {
        await redis.set(
          cacheKey,
          JSON.stringify({
            results: cleanResults,
            totalCandidates: searchResults.length,
            queryCount,
            rerankingApplied,
            embeddingsCached,
            embeddingsGenerated,
          }),
          { ex: CACHE_TTL_SECONDS }
        );
      } catch (cacheError) {
        console.warn('Cache write error:', cacheError);
      }
    }

    const paginatedResults = cleanResults.slice(offset, offset + params.limit);
    const latencyMs = Date.now() - startTime;

    Sentry.addBreadcrumb({
      category: 'search',
      message: `RAG-Fusion search: "${params.query}"`,
      level: 'info',
      data: {
        resultsCount: paginatedResults.length,
        queryCount,
        rerankingApplied,
        latencyMs,
        generationTimeMs,
        embeddingsCached,
        embeddingsGenerated,
      },
    });

    return NextResponse.json({
      success: true,
      reports: paginatedResults,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: cleanResults.length,
        totalPages: Math.ceil(cleanResults.length / params.limit),
      },
      metadata: {
        query: params.query,
        totalCandidates: searchResults.length,
        queryCount,
        multiQueryGenerationMs: generationTimeMs,
        rerankingApplied,
        cached: false,
        latencyMs,
        // Embedding cache stats for cost/performance monitoring
        embeddingCache: {
          hits: embeddingsCached,
          misses: embeddingsGenerated,
          hitRate: queryCount > 0 ? embeddingsCached / queryCount : 0,
        },
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
      extra: { searchParams: Object.fromEntries(request.nextUrl.searchParams) },
    });

    return NextResponse.json({ success: false, error: 'Search failed' }, { status: 500 });
  } finally {
    client.release();
  }
}

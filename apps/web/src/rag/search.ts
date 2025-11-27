/**
 * TCG Hybrid Search Engine for RAG System
 *
 * Combines three search strategies for optimal retrieval:
 * 1. Vector Similarity (semantic search via pgvector)
 * 2. Keyword Search (BM25-style full-text search)
 * 3. Metadata Filtering (structured queries on JSONB)
 *
 * This is the foundation of our provenance-tracked RAG system.
 */

import { OpenAIEmbeddings } from '@langchain/openai';
import { pool } from '@/db';
import * as Sentry from '@sentry/nextjs';
import type { Span } from '@sentry/types';

// Initialize OpenAI embeddings (same model as ingestion)
const embeddings = new OpenAIEmbeddings({
  modelName: 'text-embedding-3-large',
  openAIApiKey: process.env.OPENAI_API_KEY,
});

/**
 * Search result document with provenance metadata
 */
export interface SearchResult {
  id: string;
  content: string;
  metadata: Record<string, any>;
  score: number; // Similarity score (0-1)
  source_type: string;
  created_at: Date;
}

/**
 * Search filters for metadata-based filtering
 */
export interface SearchFilters {
  card_name?: string;
  set?: string;
  grade?: string;
  source_type?: string;
  date_from?: string;
  date_to?: string;
  min_price?: number;
  max_price?: number;
}

/**
 * Hybrid search configuration
 */
export interface HybridSearchOptions {
  query: string;
  filters?: SearchFilters;
  limit?: number;
  vectorWeight?: number; // Weight for vector search (0-1, default 0.7)
  keywordWeight?: number; // Weight for keyword search (0-1, default 0.3)
  minScore?: number; // Minimum similarity threshold (0-1, default 0.5)
}

/**
 * Execute hybrid search combining vector similarity and keyword matching
 *
 * This function implements a weighted hybrid search strategy that combines:
 * - Semantic similarity via pgvector cosine distance
 * - Keyword matching via PostgreSQL full-text search (ts_rank)
 * - Metadata filtering for precise queries
 *
 * @param options - Search configuration
 * @returns Array of search results with provenance metadata
 *
 * @example
 * ```typescript
 * const results = await hybridSearch({
 *   query: "What is the ROI on PSA 10 vs BGS 9.5 for 1st Edition Charizard?",
 *   filters: {
 *     card_name: "Charizard",
 *     grade: "PSA 10"
 *   },
 *   limit: 10
 * });
 * ```
 */
export async function hybridSearch(
  options: HybridSearchOptions
): Promise<SearchResult[]> {
  const {
    query,
    filters = {},
    limit = 10,
    vectorWeight = 0.7,
    keywordWeight = 0.3,
    minScore = 0.5,
  } = options;

  return Sentry.startSpan(
    { name: 'rag.search', op: 'search' },
    async (span: Span) => {
      span?.setAttribute('query', query.slice(0, 100));
      span?.setAttribute('limit', limit);

      // 1. Generate query embedding
      const queryEmbedding = await embeddings.embedQuery(query);
      const embeddingStr = `[${queryEmbedding.join(',')}]`;

      // 2. Build metadata filter clauses
      const filterClauses: string[] = [];
      const filterParams: any[] = [];
      let paramIndex = 1;

      if (filters.source_type) {
        filterClauses.push(`source_type = $${paramIndex}`);
        filterParams.push(filters.source_type);
        paramIndex++;
      }

      if (filters.card_name) {
        filterClauses.push(`metadata->>'card_name' ILIKE $${paramIndex}`);
        filterParams.push(`%${filters.card_name}%`);
        paramIndex++;
      }

      if (filters.set) {
        filterClauses.push(`metadata->>'set' ILIKE $${paramIndex}`);
        filterParams.push(`%${filters.set}%`);
        paramIndex++;
      }

      if (filters.grade) {
        filterClauses.push(`metadata->>'grade' = $${paramIndex}`);
        filterParams.push(filters.grade);
        paramIndex++;
      }

      if (filters.date_from) {
        filterClauses.push(`created_at >= $${paramIndex}`);
        filterParams.push(filters.date_from);
        paramIndex++;
      }

      if (filters.date_to) {
        filterClauses.push(`created_at <= $${paramIndex}`);
        filterParams.push(filters.date_to);
        paramIndex++;
      }

      if (filters.min_price !== undefined) {
        filterClauses.push(`(metadata->>'sale_price')::numeric >= $${paramIndex}`);
        filterParams.push(filters.min_price);
        paramIndex++;
      }

      if (filters.max_price !== undefined) {
        filterClauses.push(`(metadata->>'sale_price')::numeric <= $${paramIndex}`);
        filterParams.push(filters.max_price);
        paramIndex++;
      }

      const whereClause = filterClauses.length > 0
        ? `WHERE ${filterClauses.join(' AND ')}`
        : '';

      // 3. Execute hybrid search query
      // Combines vector similarity (cosine distance) and keyword ranking (ts_rank)
      const client = await pool.connect();
      try {
        const queryText = `
          WITH vector_search AS (
            SELECT
              id,
              content,
              metadata,
              source_type,
              created_at,
              1 - (embedding <=> $${paramIndex}::vector) AS vector_score
            FROM tcg_documents
            ${whereClause}
            ORDER BY embedding <=> $${paramIndex}::vector
            LIMIT ${limit * 2}
          ),
          keyword_search AS (
            SELECT
              id,
              ts_rank(to_tsvector('english', content), plainto_tsquery('english', $${paramIndex + 1})) AS keyword_score
            FROM tcg_documents
            ${whereClause}
          )
          SELECT
            v.id,
            v.content,
            v.metadata,
            v.source_type,
            v.created_at,
            (COALESCE(v.vector_score, 0) * $${paramIndex + 2} + COALESCE(k.keyword_score, 0) * $${paramIndex + 3}) AS combined_score
          FROM vector_search v
          LEFT JOIN keyword_search k ON v.id = k.id
          WHERE (COALESCE(v.vector_score, 0) * $${paramIndex + 2} + COALESCE(k.keyword_score, 0) * $${paramIndex + 3}) >= $${paramIndex + 4}
          ORDER BY combined_score DESC
          LIMIT $${paramIndex + 5}
        `;

        const queryParams = [
          ...filterParams,
          embeddingStr, // Query embedding for vector search
          query, // Query text for keyword search
          vectorWeight,
          keywordWeight,
          minScore,
          limit,
        ];

        const result = await client.query(queryText, queryParams);

        span?.setAttribute('resultCount', result.rows.length);

        return result.rows.map((row) => ({
          id: row.id,
          content: row.content,
          metadata: row.metadata,
          score: row.combined_score,
          source_type: row.source_type,
          created_at: row.created_at,
        }));
      } finally {
        client.release();
      }
    }
  );
}

/**
 * Pure vector similarity search (semantic only)
 *
 * Useful for exploratory queries where keyword matching is not needed
 *
 * @param query - Natural language query
 * @param limit - Maximum number of results
 * @param filters - Optional metadata filters
 */
export async function vectorSearch(
  query: string,
  limit: number = 10,
  filters?: SearchFilters
): Promise<SearchResult[]> {
  return hybridSearch({
    query,
    limit,
    filters,
    vectorWeight: 1.0,
    keywordWeight: 0.0,
    minScore: 0.3,
  });
}

/**
 * Pure keyword search (BM25-style)
 *
 * Useful for exact term matching (e.g., specific card names, set numbers)
 *
 * @param query - Keyword query
 * @param limit - Maximum number of results
 * @param filters - Optional metadata filters
 */
export async function keywordSearch(
  query: string,
  limit: number = 10,
  filters?: SearchFilters
): Promise<SearchResult[]> {
  const filterClauses: string[] = [];
  const filterParams: any[] = [];
  let paramIndex = 1;

  if (filters?.source_type) {
    filterClauses.push(`source_type = $${paramIndex}`);
    filterParams.push(filters.source_type);
    paramIndex++;
  }

  if (filters?.card_name) {
    filterClauses.push(`metadata->>'card_name' ILIKE $${paramIndex}`);
    filterParams.push(`%${filters.card_name}%`);
    paramIndex++;
  }

  if (filters?.set) {
    filterClauses.push(`metadata->>'set' ILIKE $${paramIndex}`);
    filterParams.push(`%${filters.set}%`);
    paramIndex++;
  }

  const whereClause = filterClauses.length > 0
    ? `WHERE ${filterClauses.join(' AND ')}`
    : '';

  const client = await pool.connect();
  try {
    const result = await client.query(
      `
      SELECT
        id,
        content,
        metadata,
        source_type,
        created_at,
        ts_rank(to_tsvector('english', content), plainto_tsquery('english', $${paramIndex})) AS score
      FROM tcg_documents
      ${whereClause}
      ORDER BY score DESC
      LIMIT $${paramIndex + 1}
      `,
      [...filterParams, query, limit]
    );

    return result.rows.map((row) => ({
      id: row.id,
      content: row.content,
      metadata: row.metadata,
      score: row.score,
      source_type: row.source_type,
      created_at: row.created_at,
    }));
  } finally {
    client.release();
  }
}


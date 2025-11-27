/**
 * Cohere Reranker for TCG RAG System
 *
 * The reranker takes initial search results and re-scores them based on
 * relevance to the query. This significantly improves the quality of
 * retrieved context for the LLM.
 *
 * Why reranking matters:
 * - Vector search can miss nuanced query intent
 * - Keyword search can be too literal
 * - Reranking uses a specialized model to understand query-document relevance
 */

import { CohereClient } from 'cohere-ai';
import { SearchResult } from './search';
import * as Sentry from '@sentry/nextjs';
import type { Span } from '@sentry/types';

/**
 * Reranked search result with improved relevance score
 */
export interface RerankedResult extends SearchResult {
  rerankScore: number; // Cohere relevance score (0-1)
  originalScore: number; // Original search score
}

/**
 * Rerank search results using Cohere's rerank model
 *
 * Takes the top N results from hybrid search and re-scores them using
 * Cohere's rerank-english-v3.0 model for improved relevance.
 *
 * Best practice: Retrieve 2-3x more results than needed, then rerank to topN
 *
 * @param query - User's query
 * @param documents - Search results to rerank
 * @param topN - Number of top results to return after reranking
 * @param cohereClient - Optional Cohere client instance (supports lazy instantiation)
 * @returns Reranked results sorted by relevance
 *
 * @example
 * ```typescript
 * const searchResults = await hybridSearch({ query, limit: 30 });
 * const reranked = await rerankResults(query, searchResults, 10, cohereClient);
 * ```
 */
export async function rerankResults(
  query: string,
  documents: SearchResult[],
  topN: number = 10,
  cohereClient: CohereClient | null = null
): Promise<RerankedResult[]> {
  if (!cohereClient) {
    console.warn('Cohere client not provided, skipping reranking');
    return documents.slice(0, topN).map((doc) => ({
      ...doc,
      rerankScore: doc.score,
      originalScore: doc.score,
    }));
  }

  return Sentry.startSpan(
    { name: 'rag.rerank', op: 'reranking' },
    async (span: Span) => {
      span?.setAttribute('query', query.slice(0, 100));
      span?.setAttribute('documentCount', documents.length);
      span?.setAttribute('topN', topN);

      try {
        // Prepare documents for Cohere rerank API
        const cohereDocuments = documents.map((doc) => ({
          text: doc.content,
        }));

        // Call Cohere rerank API (optimized for investment-grade queries)
        const reranked = await cohereClient.rerank({
          query,
          documents: cohereDocuments,
          topN,
          model: 'rerank-multilingual-v3.0', // Better for diverse query angles
          returnDocuments: false, // Saves ~40% bandwidth/cost
        });

        // Map reranked results back to original documents with metadata
        const results: RerankedResult[] = reranked.results.map((result) => {
          const originalDoc = documents[result.index];
          return {
            ...originalDoc,
            rerankScore: result.relevanceScore,
            originalScore: originalDoc.score,
          };
        });

        span?.setAttribute('rerankResultCount', results.length);

        return results;
      } catch (error) {
        // Fallback to original results if reranking fails
        Sentry.captureException(error, {
          extra: {
            query,
            documentCount: documents.length,
          },
        });
        console.error('Reranking failed, falling back to original results:', error);
        return documents.slice(0, topN).map((doc) => ({
          ...doc,
          rerankScore: doc.score,
          originalScore: doc.score,
        }));
      }
    }
  );
}

/**
 * Get TCG context for RAG with hybrid search + reranking
 *
 * This is the primary function to use for retrieving context for the RAG chain.
 * It combines hybrid search with reranking for optimal results.
 *
 * @param query - User's query
 * @param cohereClient - Optional Cohere client instance (supports lazy instantiation)
 * @param preRerankLimit - Number of documents to retrieve before reranking (default: 30)
 * @param finalLimit - Number of documents to return after reranking (default: 10)
 * @returns Context string with provenance metadata
 *
 * @example
 * ```typescript
 * const { context, sources } = await getTcgContext(
 *   "What is the ROI on PSA 10 vs BGS 9.5 for 1st Edition Charizard?",
 *   cohereClient
 * );
 * ```
 */
export async function getTcgContext(
  query: string,
  cohereClient: CohereClient | null = null,
  preRerankLimit: number = 30,
  finalLimit: number = 8 // Optimized for investment queries
): Promise<{ context: string; sources: RerankedResult[] }> {
  const { hybridSearch } = await import('./search');

  return Sentry.startSpan(
    { name: 'rag.get_context', op: 'retrieval' },
    async (span: Span) => {
      // 1. Hybrid search to get candidate documents
      const searchResults = await hybridSearch({
        query,
        limit: preRerankLimit,
      });

      span?.setAttribute('searchResultCount', searchResults.length);

      // 2. Rerank for relevance
      const reranked = await rerankResults(query, searchResults, finalLimit, cohereClient);

      // 3. Format context with provenance markers
      const context = reranked
        .map((doc, i) => {
          // Format: [source:1] Content... <!-- provenance: {...} -->
          return `[source:${i + 1}] ${doc.content}\n<!-- provenance: ${JSON.stringify(doc.metadata)} -->`;
        })
        .join('\n\n');

      span?.setAttribute('contextLength', context.length);
      span?.setAttribute('sourceCount', reranked.length);

      return { context, sources: reranked };
    }
  );
}

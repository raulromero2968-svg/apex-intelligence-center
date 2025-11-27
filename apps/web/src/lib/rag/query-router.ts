/**
 * Query Router for Adaptive RAG
 *
 * Implements intelligent query routing based on query type analysis.
 * Routes queries to optimal retrieval strategies based on their nature:
 * - Navigational: Direct lookup queries (simple hybrid search)
 * - Factual: Fact-based queries (standard RAG-Fusion)
 * - Analytical: Complex reasoning queries (expanded RAG-Fusion with more queries)
 *
 * From knowledge-02-ai-rag-architecture-v2.md (Advanced RAG Architecture)
 */

import { ChatOpenAI } from '@langchain/openai';
import { ragFusionSearch, hybridSearch } from '@/rag';
import type { SearchResult } from '@/rag/search';

export type QueryType = 'navigational' | 'factual' | 'analytical';

/**
 * Route a query to the appropriate retrieval strategy
 *
 * Uses a lightweight classifier to determine query type:
 * - navigational: "What is X?", "Show me Y", "Find Z"
 * - factual: "How much did X sell for?", "What's the price of Y?"
 * - analytical: "Compare X to Y", "What's the ROI?", "Why did X happen?"
 *
 * @param query - User's query string
 * @returns Promise<QueryType> - The classified query type
 */
export async function routeQuery(query: string): Promise<QueryType> {
  // Quick heuristic-based routing (faster than LLM call)
  const lowerQuery = query.toLowerCase();

  // Navigational indicators
  const navigationalPatterns = [
    /^what is /,
    /^show me /,
    /^find /,
    /^get /,
    /^list /,
    /^define /,
  ];

  // Analytical indicators
  const analyticalPatterns = [
    /compare/,
    /versus|vs\.?/,
    /roi|return on investment/,
    /should i/,
    /why did/,
    /how does .* affect/,
    /implications/,
    /ethical/,
    /framework/,
    /analysis/,
    /evaluate/,
    /assess/,
    /impact/,
  ];

  // Check for navigational patterns
  for (const pattern of navigationalPatterns) {
    if (pattern.test(lowerQuery)) {
      // But override if also analytical
      const isAlsoAnalytical = analyticalPatterns.some((p) => p.test(lowerQuery));
      if (!isAlsoAnalytical) {
        return 'navigational';
      }
    }
  }

  // Check for analytical patterns
  for (const pattern of analyticalPatterns) {
    if (pattern.test(lowerQuery)) {
      return 'analytical';
    }
  }

  // Default to factual for straightforward queries
  return 'factual';
}

/**
 * Adaptive Retrieval RAG - Expands context when initial retrieval is insufficient
 *
 * Uses a more aggressive retrieval strategy:
 * - More RAG-Fusion queries (8-10)
 * - Lower similarity threshold
 * - Broader semantic search
 *
 * @param query - User's query string
 * @returns Promise<SearchResult[]> - Expanded search results
 */
export async function adaptiveRetrievalRAG(query: string): Promise<SearchResult[]> {
  // Use RAG-Fusion with more diverse query generation
  const results = await ragFusionSearch(query, {
    numQueries: 10, // More queries for better coverage
    preRerankLimit: 40, // Retrieve more candidates
    finalLimit: 15, // Return more final results
  });

  return results;
}

/**
 * Get retrieval configuration based on query type
 *
 * @param queryType - The classified query type
 * @returns Configuration object for retrieval
 */
export function getRetrievalConfig(queryType: QueryType): {
  numQueries: number;
  preRerankLimit: number;
  finalLimit: number;
  minScore: number;
} {
  switch (queryType) {
    case 'navigational':
      return {
        numQueries: 3,
        preRerankLimit: 15,
        finalLimit: 5,
        minScore: 0.6,
      };
    case 'factual':
      return {
        numQueries: 5,
        preRerankLimit: 25,
        finalLimit: 8,
        minScore: 0.5,
      };
    case 'analytical':
      return {
        numQueries: 8,
        preRerankLimit: 35,
        finalLimit: 12,
        minScore: 0.4,
      };
  }
}

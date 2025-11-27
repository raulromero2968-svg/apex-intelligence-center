/**
 * RAG-Fusion Implementation for Apex Intelligence
 *
 * RAG-Fusion generates multiple diverse search queries from a single user query,
 * then fuses the results using Reciprocal Rank Fusion (RRF) for superior retrieval quality.
 *
 * Key benefits over single-query retrieval:
 * - 23% improvement in retrieval recall (master prompt knowledge-39)
 * - Captures multiple semantic angles (price velocity, pop delta, grade premium, arbitrage, etc.)
 * - Reduces brittleness from single query vector
 *
 * Citation: "RAG-Fusion: A New Take on Retrieval-Augmented Generation" (2023)
 */

import { ChatAnthropic } from '@langchain/anthropic';
import { hybridSearch, SearchResult } from './search';
import * as Sentry from '@sentry/nextjs';
import type { Span } from '@sentry/types';

/**
 * RAG-Fusion configuration
 */
export interface RagFusionConfig {
  numQueries?: number; // Number of diverse queries to generate (default 6)
  model?: string; // Claude model for query generation
  temperature?: number; // Temperature for query generation (default 0.7 for diversity)
  rrf_k?: number; // RRF constant for ranking fusion (default 60)
  preRerankLimit?: number; // Documents to retrieve per query before fusion (default 20)
  finalLimit?: number; // Final documents to return after fusion (default 30)
}

/**
 * Fusion query generator using Claude
 */
export class RagFusionGenerator {
  private llm: ChatAnthropic;
  private config: Required<RagFusionConfig>;

  constructor(config: RagFusionConfig = {}) {
    this.config = {
      numQueries: config.numQueries || 6,
      model: config.model || 'claude-3-5-sonnet-20241022',
      temperature: config.temperature || 0.7,
      rrf_k: config.rrf_k || 60,
      preRerankLimit: config.preRerankLimit || 20,
      finalLimit: config.finalLimit || 30,
    };

    this.llm = new ChatAnthropic({
      modelName: this.config.model,
      temperature: this.config.temperature,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      maxTokens: 512,
    });
  }

  /**
   * Generate diverse queries from a single user query
   *
   * Generates exactly 6 queries covering different TCG investment angles:
   * 1. Price velocity / momentum
   * 2. Pop delta impact / supply dynamics
   * 3. Grade premium multiples (PSA 10 vs 9, CGC Black Label premium)
   * 4. Artist premium / set desirability
   * 5. Sealed vs singles arbitrage
   * 6. Regional arbitrage (US/EU/JP spreads)
   *
   * @param query - Original user query
   * @returns Array of diverse search queries
   */
  async generateQueries(query: string): Promise<string[]> {
    const prompt = `You are a TCG (Trading Card Game) market analyst. Generate exactly ${this.config.numQueries} diverse search queries to comprehensively answer the following question about TCG investing.

Each query should explore a DIFFERENT angle relevant to TCG market intelligence:
1. Price velocity and momentum trends
2. Population report changes (pop delta impact on value)
3. Grade premium multiples (PSA 10 vs 9, CGC Black Label premium, BGS 9.5 spreads)
4. Artist premiums and set desirability factors
5. Sealed product vs singles arbitrage opportunities
6. Regional market arbitrage (US vs EU vs JP pricing inefficiencies)

Original Question: "${query}"

Generate exactly ${this.config.numQueries} diverse search queries, each exploring a different angle. Output ONLY the queries, one per line, no numbering or explanation.`;

    try {
      const response = await this.llm.invoke(prompt);
      const text = typeof response.content === 'string' ? response.content : response.content[0].text;

      // Parse queries (one per line, remove numbering if present)
      const queries = (typeof text === 'string' ? text : String(text))
        .split('\n')
        .map((line) => line.trim())
        .map((line) => line.replace(/^\d+[\.)]\s*/, '')) // Remove "1. " or "1) " prefixes
        .filter((line) => line.length > 0)
        .slice(0, this.config.numQueries); // Ensure exactly numQueries

      // Fallback: if Claude didn't generate enough queries, add variations
      while (queries.length < this.config.numQueries) {
        queries.push(`${query} (variation ${queries.length + 1})`);
      }

      return queries;
    } catch (error) {
      Sentry.captureException(error, {
        extra: { query, config: this.config },
      });
      console.error('Failed to generate fusion queries:', error);

      // Fallback: use the original query multiple times with slight variations
      return [
        query,
        `${query} price trends`,
        `${query} population impact`,
        `${query} grade premium`,
        `${query} market analysis`,
        `${query} investment alpha`,
      ].slice(0, this.config.numQueries);
    }
  }

  /**
   * Execute RAG-Fusion: generate queries, search each, and fuse results
   *
   * @param query - Original user query
   * @returns Fused search results ranked by RRF score
   */
  async search(query: string): Promise<SearchResult[]> {
    return Sentry.startSpan(
      { name: 'rag.fusion.search', op: 'fusion' },
      async (span: Span) => {
        span?.setAttribute('query', query.slice(0, 100));

        // Step 1: Generate diverse queries
        const queries = await this.generateQueries(query);
        span?.setAttribute('fusionQueries', queries.length);

        console.log('RAG-Fusion queries:', queries);

        // Step 2: Search for each query in parallel
        const searchPromises = queries.map((q) =>
          hybridSearch({
            query: q,
            limit: this.config.preRerankLimit,
          })
        );

        const allResults = await Promise.all(searchPromises);
        const totalResults = allResults.reduce(
          (sum, results) => sum + results.length,
          0
        );
        span?.setAttribute('totalResults', totalResults);

        // Step 3: Reciprocal Rank Fusion (RRF)
        const fused = this.reciprocalRankFusion(allResults);
        span?.setAttribute('fusedResults', fused.length);

        return fused.slice(0, this.config.finalLimit);
      }
    );
  }

  /**
   * Reciprocal Rank Fusion (RRF)
   *
   * Fuses multiple ranked lists into a single ranked list using the formula:
   * RRF_score(doc) = Σ 1 / (k + rank(doc))
   *
   * where k is a constant (default 60) and rank is the position in each list.
   *
   * @param rankedLists - Array of search result arrays (one per query)
   * @returns Single fused and ranked result list
   */
  private reciprocalRankFusion(
    rankedLists: SearchResult[][]
  ): SearchResult[] {
    const k = this.config.rrf_k;
    const scores = new Map<string, number>();
    const docs = new Map<string, SearchResult>();

    // Calculate RRF scores for each document
    for (const results of rankedLists) {
      results.forEach((doc, rank) => {
        const docId = doc.id;
        const currentScore = scores.get(docId) || 0;
        const rrfScore = 1 / (k + rank + 1); // rank is 0-indexed, so add 1

        scores.set(docId, currentScore + rrfScore);

        // Store document metadata (first occurrence)
        if (!docs.has(docId)) {
          docs.set(docId, doc);
        }
      });
    }

    // Sort by RRF score descending
    const sortedDocs = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1]) // Sort by score descending
      .map(([docId, score]) => {
        const doc = docs.get(docId)!;
        return {
          ...doc,
          score: score, // Replace original score with RRF score
        };
      });

    return sortedDocs;
  }
}

/**
 * Factory function for RAG-Fusion
 *
 * @param config - RAG-Fusion configuration
 * @returns Configured RagFusionGenerator instance
 *
 * @example
 * ```typescript
 * const fusion = createRagFusion();
 * const results = await fusion.search("What is the ROI on PSA 10 Charizard?");
 * ```
 */
export function createRagFusion(
  config?: RagFusionConfig
): RagFusionGenerator {
  return new RagFusionGenerator(config);
}

/**
 * Standalone RAG-Fusion search function
 *
 * @param query - User query
 * @param config - Optional configuration
 * @returns Fused search results
 */
export async function ragFusionSearch(
  query: string,
  config?: RagFusionConfig
): Promise<SearchResult[]> {
  const fusion = createRagFusion(config);
  return fusion.search(query);
}

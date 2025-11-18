/**
 * RAG-Fusion Query Generator
 *
 * Generates multiple diverse queries from a single user query to improve
 * retrieval coverage. This addresses the "query brittleness" problem where
 * a single query formulation may miss relevant documents.
 *
 * Technique: Use LLM to generate 4 alternative phrasings + include original
 */

import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import * as Sentry from '@sentry/nextjs';

// Fast, cheap model for query generation
const llm = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  temperature: 0.7, // Some creativity for diverse queries
  openAIApiKey: process.env.OPENAI_API_KEY,
});

const QUERY_GENERATION_PROMPT = `You are a TCG market intelligence query expert. Given a user's question about trading cards, generate 4 alternative ways to phrase the same question that might retrieve different relevant information.

Rules:
- Keep each query focused and specific
- Vary the terminology (e.g., "ROI" vs "return on investment", "graded" vs "PSA/BGS")
- Include both broad and narrow formulations
- Focus on the core intent, not surface-level rephrasing

Return ONLY the 4 queries, one per line, with no numbering or extra text.

Original query: {query}

Alternative queries:`;

const template = ChatPromptTemplate.fromMessages([
  ['system', QUERY_GENERATION_PROMPT],
]);

const chain = template.pipe(llm).pipe(new StringOutputParser());

/**
 * Generate multiple diverse queries for RAG-Fusion
 *
 * Takes a single user query and generates 4 alternative phrasings,
 * then includes the original query for a total of 5 queries.
 *
 * @param query - Original user query
 * @returns Array of 5 diverse queries (4 generated + 1 original)
 *
 * @example
 * ```typescript
 * const queries = await generateMultipleQueries(
 *   "What is the ROI on PSA 10 Charizard?"
 * );
 * // Returns:
 * // [
 * //   "What is the ROI on PSA 10 Charizard?", // original
 * //   "How profitable is investing in PSA 10 Charizard cards?",
 * //   "What returns can I expect from buying graded Charizard PSA 10?",
 * //   "Charizard PSA 10 investment returns and profit margins",
 * //   "Historical price appreciation for gem mint Charizard cards"
 * // ]
 * ```
 */
export async function generateMultipleQueries(query: string): Promise<string[]> {
  return Sentry.startSpan(
    { name: 'rag.generate_queries', op: 'query_generation' },
    async (span) => {
      span?.setAttribute('originalQuery', query.slice(0, 100));

      try {
        // Generate alternative queries
        const response = await chain.invoke({ query });

        // Parse response (one query per line)
        const generatedQueries = response
          .split('\n')
          .map((q) => q.trim())
          .filter((q) => q.length > 0)
          .slice(0, 4); // Take first 4

        // Combine with original query (original first)
        const allQueries = [query, ...generatedQueries];

        span?.setAttribute('queryCount', allQueries.length);

        return allQueries;
      } catch (error) {
        // Fallback: just return original query if generation fails
        Sentry.captureException(error, {
          extra: { query },
        });
        console.error('Query generation failed, using original query only:', error);
        return [query];
      }
    }
  );
}

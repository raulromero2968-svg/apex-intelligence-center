/**
 * Self-Reflective RAG
 *
 * Implements context sufficiency checking for RAG pipelines.
 * Evaluates whether retrieved documents contain enough relevant information
 * to answer the user's query, triggering expanded retrieval when needed.
 *
 * From knowledge-02-ai-rag-architecture-v2.md (Advanced RAG Architecture)
 */

import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import type { SearchResult } from '@/rag/search';

/**
 * Self-reflective RAG context sufficiency check
 *
 * Evaluates whether the retrieved documents provide sufficient context
 * to answer the user's query comprehensively.
 *
 * @param query - User's query string
 * @param documents - Retrieved documents to evaluate
 * @returns Promise<boolean> - True if context is sufficient, false if expansion needed
 */
export async function selfReflectiveRAG(
  query: string,
  documents: SearchResult[]
): Promise<boolean> {
  // Quick heuristic checks first (avoid LLM call for obvious cases)

  // If no documents, definitely insufficient
  if (!documents || documents.length === 0) {
    return false;
  }

  // If very few documents with low scores, likely insufficient
  const avgScore =
    documents.reduce((sum, doc) => sum + (doc.score || 0), 0) / documents.length;
  if (documents.length < 3 && avgScore < 0.5) {
    return false;
  }

  // If we have good coverage (many high-scoring docs), likely sufficient
  const highScoreDocs = documents.filter((doc) => (doc.score || 0) > 0.7);
  if (highScoreDocs.length >= 5) {
    return true;
  }

  // For borderline cases, use LLM to evaluate
  // Only if OpenAI key is available
  if (!process.env.OPENAI_API_KEY) {
    // Conservative: assume sufficient if we have at least 3 documents
    return documents.length >= 3;
  }

  try {
    const llm = new ChatOpenAI({
      temperature: 0,
      modelName: 'gpt-4o-mini', // Fast and cheap for evaluation
      maxTokens: 10,
    });

    const contextSnippets = documents
      .slice(0, 5)
      .map((doc) => doc.content.slice(0, 300))
      .join('\n---\n');

    const evaluationPrompt = PromptTemplate.fromTemplate(`
You are evaluating whether retrieved documents contain sufficient information to answer a query.

Query: {query}

Retrieved Context (first 5 documents, truncated):
{context}

Does this context contain enough relevant information to provide a comprehensive answer?
Answer with ONLY "YES" or "NO".
`);

    const chain = evaluationPrompt.pipe(llm).pipe(new StringOutputParser());
    const response = await chain.invoke({
      query,
      context: contextSnippets,
    });

    return response.trim().toUpperCase() === 'YES';
  } catch (error) {
    console.error('[Self-Reflective] Evaluation failed, assuming sufficient:', error);
    // Conservative fallback: assume sufficient if we have documents
    return documents.length >= 3;
  }
}

/**
 * Check if documents contain relevant information for specific aspects of a query
 *
 * @param query - User's query string
 * @param documents - Retrieved documents
 * @param requiredAspects - Key aspects that should be covered
 * @returns Object with coverage analysis
 */
export function analyzeContextCoverage(
  query: string,
  documents: SearchResult[],
  requiredAspects?: string[]
): {
  totalDocuments: number;
  averageScore: number;
  highQualityCount: number;
  coverageEstimate: 'low' | 'medium' | 'high';
  recommendation: 'use_as_is' | 'expand_retrieval' | 'no_data';
} {
  if (!documents || documents.length === 0) {
    return {
      totalDocuments: 0,
      averageScore: 0,
      highQualityCount: 0,
      coverageEstimate: 'low',
      recommendation: 'no_data',
    };
  }

  const totalDocuments = documents.length;
  const averageScore =
    documents.reduce((sum, doc) => sum + (doc.score || 0), 0) / totalDocuments;
  const highQualityCount = documents.filter((doc) => (doc.score || 0) > 0.7).length;

  // Determine coverage estimate
  let coverageEstimate: 'low' | 'medium' | 'high';
  if (highQualityCount >= 5 || (totalDocuments >= 8 && averageScore > 0.6)) {
    coverageEstimate = 'high';
  } else if (highQualityCount >= 2 || (totalDocuments >= 5 && averageScore > 0.5)) {
    coverageEstimate = 'medium';
  } else {
    coverageEstimate = 'low';
  }

  // Determine recommendation
  let recommendation: 'use_as_is' | 'expand_retrieval' | 'no_data';
  if (coverageEstimate === 'high') {
    recommendation = 'use_as_is';
  } else if (coverageEstimate === 'low' && totalDocuments < 3) {
    recommendation = 'no_data';
  } else {
    recommendation = 'expand_retrieval';
  }

  return {
    totalDocuments,
    averageScore: Math.round(averageScore * 100) / 100,
    highQualityCount,
    coverageEstimate,
    recommendation,
  };
}

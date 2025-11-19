/**
 * RAG-Fusion Pipeline Wrapper
 *
 * Simple wrapper around the RAG chain for the secure API endpoint
 * Updated to support lazy LLM instantiation (prevents build-time failures)
 */

import { executeRagQuery } from '@/rag/chain';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { CohereClient } from 'cohere-ai';

export interface RagFusionParams {
  query: string;
  userId?: string;
  llm: BaseChatModel;
  judgeLlm: BaseChatModel;
  cohereReranker: CohereClient | null;
}

/**
 * Execute RAG-Fusion pipeline and return formatted response
 *
 * @param params - Pipeline parameters including query, LLM instances, and optional user ID
 * @returns Formatted response string
 */
export async function ragFusionPipeline(
  params: RagFusionParams
): Promise<string> {
  const { query, userId, llm, judgeLlm, cohereReranker } = params;

  const response = await executeRagQuery({
    question: query,
    userId,
    llm,
    judgeLlm,
    cohereReranker,
    useRagFusion: true,
  });

  // Return the answer with sources
  let output = response.answer;

  // Add validation warnings if needed
  if (!response.isValid && response.validationErrors.length > 0) {
    output += '\n\n⚠️ Note: Some citations may need review.';
  }

  return output;
}

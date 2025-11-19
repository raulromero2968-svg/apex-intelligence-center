/**
 * RAG-Fusion Pipeline Wrapper
 *
 * Simple wrapper around the RAG chain for the secure API endpoint
 */

import { executeRagQuery } from '@/rag/chain';

/**
 * Execute RAG-Fusion pipeline and return formatted response
 *
 * @param query - User query
 * @param userId - Optional user ID for compliance logging
 * @returns Formatted response string
 */
export async function ragFusionPipeline(
  query: string,
  userId?: string
): Promise<string> {
  const response = await executeRagQuery(query, userId, true);

  // Return the answer with sources
  let output = response.answer;

  // Add validation warnings if needed
  if (!response.isValid && response.validationErrors.length > 0) {
    output += '\n\n⚠️ Note: Some citations may need review.';
  }

  return output;
}

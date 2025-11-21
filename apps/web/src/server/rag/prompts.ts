/**
 * Contrarian RAG Prompt Templates
 * 
 * Defines prompt templates for mainstream and contrarian RAG responses.
 */

import type { CandidateDoc } from './retrieval';

/**
 * Format candidate documents for inclusion in prompt context
 */
function formatContextDocs(docs: CandidateDoc[]): string {
  return docs
    .map((doc, idx) => {
      const sourceInfo = doc.sourceUrl
        ? `Source: ${doc.sourceUrl}`
        : doc.sourceAuthor
        ? `Author: ${doc.sourceAuthor}`
        : 'Source: Unknown';
      
      return `[Document ${idx + 1} - ID: ${doc.id}]
${doc.content}
${sourceInfo}
Type: ${doc.sourceType}
Sentiment: ${doc.sentimentScore !== null ? doc.sentimentScore.toFixed(2) : 'N/A'}
---`;
    })
    .join('\n\n');
}

/**
 * Generate mainstream RAG prompt
 * 
 * Emphasizes high-prestige sources and conventional wisdom.
 * 
 * @param query - User query
 * @param contextDocs - Retrieved context documents
 * @param language - Response language (default: 'en')
 * @returns Formatted prompt for mainstream answer
 */
export function buildMainstreamPrompt(
  query: string,
  contextDocs: CandidateDoc[],
  language: string = 'en'
): string {
  const context = formatContextDocs(contextDocs);

  return `You are an expert TCG market analyst providing a mainstream, consensus-based answer.

Your task is to synthesize information from the provided sources to answer the user's query. Prioritize:
1. High-prestige sources (established marketplaces, official data, peer-reviewed research)
2. Consensus views and widely accepted market trends
3. Factual, verifiable information over speculation
4. Balanced perspectives that acknowledge mainstream market dynamics

CRITICAL INSTRUCTIONS:
- Distinguish clearly between FACT (verifiable data) and SPECULATION (opinions, predictions)
- Cite specific document IDs (e.g., [Document 1 - ID: abc123]) when referencing sources
- If information is uncertain or speculative, explicitly state this
- Provide evidence-based reasoning
- Acknowledge limitations and uncertainties in the data

User Query: ${query}

Context Documents:
${context}

Provide a comprehensive, mainstream answer that synthesizes the above sources. Use citations in the format [Document N - ID: xxx] to reference specific sources.`;
}

/**
 * Generate contrarian RAG prompt
 * 
 * Explicitly upweights low-prestige, fringe, or minority sources and challenges mainstream views.
 * 
 * @param query - User query
 * @param contextDocs - Retrieved context documents (should include fringe sources)
 * @param language - Response language (default: 'en')
 * @returns Formatted prompt for contrarian answer
 */
export function buildContrarianPrompt(
  query: string,
  contextDocs: CandidateDoc[],
  language: string = 'en'
): string {
  const context = formatContextDocs(contextDocs);

  return `You are a contrarian TCG market analyst providing an alternative perspective that challenges mainstream consensus.

Your task is to synthesize information from the provided sources to offer a contrarian answer to the user's query. Prioritize:
1. Low-prestige or fringe sources (forums, social media, minority opinions, alternative data)
2. Views that challenge mainstream market narratives
3. Underrepresented perspectives and contrarian hypotheses
4. Critical analysis of conventional wisdom

CRITICAL INSTRUCTIONS:
- Actively challenge mainstream assumptions
- Highlight alternative interpretations of the data
- Give weight to minority opinions and fringe sources
- Distinguish clearly between FACT (verifiable data) and SPECULATION (opinions, predictions)
- Cite specific document IDs (e.g., [Document 1 - ID: abc123]) when referencing sources
- Explicitly contrast your view with mainstream consensus where relevant
- Acknowledge when contrarian views are speculative or lack strong evidence

User Query: ${query}

Context Documents:
${context}

Provide a contrarian answer that challenges mainstream views and incorporates alternative perspectives from the above sources. Use citations in the format [Document N - ID: xxx] to reference specific sources.`;
}

/**
 * Extract source references from LLM response text
 * 
 * Parses citations in the format [Document N - ID: xxx] from response text.
 * 
 * @param responseText - LLM response text
 * @param contextDocs - Context documents used
 * @returns Array of source references with document IDs and URLs
 */
export function extractSources(
  responseText: string,
  contextDocs: CandidateDoc[]
): Array<{ id: string; url: string | null; type: string; author: string | null }> {
  const sourceMap = new Map<string, CandidateDoc>();
  for (const doc of contextDocs) {
    sourceMap.set(doc.id, doc);
  }

  // Match citations like [Document 1 - ID: abc123] or [ID: abc123]
  const citationRegex = /\[(?:Document\s+\d+\s*-\s*)?ID:\s*([a-f0-9-]+)\]/gi;
  const matches = [...responseText.matchAll(citationRegex)];
  const seenIds = new Set<string>();

  const sources: Array<{ id: string; url: string | null; type: string; author: string | null }> = [];

  for (const match of matches) {
    const docId = match[1];
    if (!seenIds.has(docId) && sourceMap.has(docId)) {
      const doc = sourceMap.get(docId)!;
      sources.push({
        id: docId,
        url: doc.sourceUrl,
        type: doc.sourceType,
        author: doc.sourceAuthor,
      });
      seenIds.add(docId);
    }
  }

  return sources;
}



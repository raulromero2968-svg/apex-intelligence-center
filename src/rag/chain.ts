/**
 * TCG RAG Chain with Citation Enforcement
 *
 * This is the core of the Apex Intelligence RAG system.
 * It solves the "attribution collapse" problem by enforcing strict citations
 * on every factual claim in AI-generated content.
 *
 * Key principles:
 * 1. Every factual claim MUST have an inline citation [source:n]
 * 2. Synthesis across sources MUST be marked with [SYNTHESIS]
 * 3. No speculation beyond provided data
 * 4. Full provenance chain from answer → source → original data
 */

import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { getTcgContext, RerankedResult } from './reranker';
import * as Sentry from '@sentry/nextjs';

// Initialize LLM
// Using gpt-4o for high-quality analysis with low temperature for consistency
const llm = new ChatOpenAI({
  modelName: process.env.OPENAI_MODEL || 'gpt-4o',
  temperature: 0.0, // No creativity - we want factual, grounded responses
  openAIApiKey: process.env.OPENAI_API_KEY,
});

/**
 * System prompt for TCG RAG with strict citation requirements
 *
 * This prompt is the enforcement mechanism for provenance tracking.
 * It's designed to prevent attribution collapse by requiring citations
 * on every single factual claim.
 */
const TCG_RAG_SYSTEM_PROMPT = `You are a world-class TCG (Trading Card Game) market analyst for Apex Intelligence. Your answers must be precise, data-driven, and objective.

CRITICAL CITATION REQUIREMENTS:
- **Every single factual claim, price, statistic, or market observation MUST end with an inline citation** [source:n] where n is the source number.
- If you synthesize information from multiple sources to draw a new conclusion, you MUST begin that sentence with [SYNTHESIS] and cite ALL sources used.
- Do not editorialize or speculate beyond the provided data. If the data doesn't support a claim, say "Based on the available data, I cannot confirm..." rather than guessing.
- If a user asks about something not covered in the sources, explicitly state: "The provided sources do not contain information about..."

CITATION FORMAT:
- Single source: "Charizard PSA 10 sold for $15,000 on October 28, 2025 [source:1]."
- Multiple sources: "[SYNTHESIS] The market trend suggests increasing prices for graded Charizards across both PSA and BGS [source:1][source:3][source:5]."
- No speculation: If you don't have data, say so explicitly.

ANALYSIS STYLE:
- Be concise and professional
- Use data to support every claim
- Compare prices, populations, and trends when relevant
- Explain ROI calculations step-by-step
- Acknowledge data limitations

BASE YOUR ENTIRE RESPONSE ON THE FOLLOWING SOURCES:
{context}`;

// Create prompt template
const tcgRagPrompt = ChatPromptTemplate.fromMessages([
  ['system', TCG_RAG_SYSTEM_PROMPT],
  ['human', '{question}'],
]);

// Create chain
const outputParser = new StringOutputParser();
const ragChain = tcgRagPrompt.pipe(llm).pipe(outputParser);

/**
 * RAG response with full provenance
 */
export interface RagResponse {
  answer: string;
  sources: RerankedResult[];
  citationCount: number;
  synthesisCount: number;
  isValid: boolean; // Whether citations passed validation
  validationErrors: string[];
}

/**
 * Validate citations in RAG response
 *
 * Ensures that the response contains proper citations and doesn't make
 * unsupported claims. This is the enforcement layer that prevents
 * "attribution collapse".
 *
 * @param response - LLM response text
 * @param sourceCount - Number of sources provided to the LLM
 * @returns Validation result with errors if any
 */
export function validateCitations(
  response: string,
  sourceCount: number
): { isValid: boolean; errors: string[]; citationCount: number; synthesisCount: number } {
  const errors: string[] = [];

  // 1. Check for citations
  const citations = response.match(/\[source:\d+\]/g) || [];
  const citationCount = citations.length;

  // 2. Count synthesis markers
  const synthesisMarkers = response.match(/\[SYNTHESIS\]/g) || [];
  const synthesisCount = synthesisMarkers.length;

  // 3. Check if response has factual content but no citations
  // Simple heuristic: if response is long (>100 chars) and has numbers/prices, it should have citations
  const hasNumbers = /\$\d+|\d+%|\d+,\d+/.test(response);
  const isLongResponse = response.length > 100;
  const hasFactualContent = hasNumbers || /\b(sold|price|population|grade|ROI)\b/i.test(response);

  if (isLongResponse && hasFactualContent && citationCount === 0) {
    // Check if it's a "no data" response
    const isNoDataResponse = /provided sources do not contain|cannot confirm|no information about/i.test(response);
    if (!isNoDataResponse) {
      errors.push('Response contains factual claims but no citations. Every claim must be cited with [source:n].');
    }
  }

  // 4. Validate citation numbers are within range
  for (const citation of citations) {
    const num = parseInt(citation.match(/\d+/)?.[0] || '0');
    if (num < 1 || num > sourceCount) {
      errors.push(`Invalid citation [source:${num}]. Only sources 1-${sourceCount} are available.`);
    }
  }

  // 5. Check for synthesis without citations
  if (synthesisCount > 0) {
    // Each synthesis should be followed by at least one citation
    const synthesisPattern = /\[SYNTHESIS\][^[]*(?:\[source:\d+\])/g;
    const validSynthesis = response.match(synthesisPattern) || [];
    if (validSynthesis.length < synthesisCount) {
      errors.push('SYNTHESIS markers found without supporting citations. Each synthesis must cite all sources used.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    citationCount,
    synthesisCount,
  };
}

/**
 * Execute RAG query with citation enforcement
 *
 * This is the main entry point for the TCG RAG system. It:
 * 1. Retrieves relevant context via hybrid search + reranking
 * 2. Generates a response using the LLM with strict citation requirements
 * 3. Validates that all claims are properly cited
 * 4. Returns the response with full provenance chain
 *
 * @param question - User's question
 * @returns RAG response with citations and sources
 *
 * @example
 * ```typescript
 * const response = await executeRagQuery(
 *   "What is the ROI on PSA 10 vs BGS 9.5 for 1st Edition Charizard?"
 * );
 * console.log(response.answer);
 * console.log(`Citations: ${response.citationCount}`);
 * console.log(`Sources: ${response.sources.length}`);
 * ```
 */
export async function executeRagQuery(question: string): Promise<RagResponse> {
  return Sentry.startSpan(
    { name: 'rag.execute', op: 'rag_query' },
    async (span) => {
      span?.setAttribute('question', question.slice(0, 100));

      // 1. Get context with provenance
      const { context, sources } = await getTcgContext(question);

      span?.setAttribute('sourceCount', sources.length);
      span?.setAttribute('contextLength', context.length);

      // 2. Generate response
      const answer = await ragChain.invoke({
        context,
        question,
      });

      span?.setAttribute('answerLength', answer.length);

      // 3. Validate citations
      const validation = validateCitations(answer, sources.length);

      span?.setAttribute('citationCount', validation.citationCount);
      span?.setAttribute('synthesisCount', validation.synthesisCount);
      span?.setAttribute('isValid', validation.isValid);

      if (!validation.isValid) {
        Sentry.captureMessage('RAG response failed citation validation', {
          level: 'warning',
          extra: {
            question,
            answer: answer.slice(0, 500),
            errors: validation.errors,
          },
        });
      }

      return {
        answer,
        sources,
        citationCount: validation.citationCount,
        synthesisCount: validation.synthesisCount,
        isValid: validation.isValid,
        validationErrors: validation.errors,
      };
    }
  );
}

/**
 * Format RAG response for display
 *
 * Converts the RAG response into a user-friendly format with
 * inline citations and a sources section.
 *
 * @param response - RAG response
 * @returns Formatted markdown response
 */
export function formatRagResponse(response: RagResponse): string {
  let output = response.answer;

  // Add validation warnings if needed
  if (!response.isValid) {
    output += '\n\n---\n\n**⚠️ Citation Validation Warnings:**\n';
    for (const error of response.validationErrors) {
      output += `- ${error}\n`;
    }
  }

  // Add sources section
  output += '\n\n---\n\n**Sources:**\n\n';

  for (let i = 0; i < response.sources.length; i++) {
    const source = response.sources[i];
    const sourceNum = i + 1;

    output += `**[${sourceNum}]** `;

    // Format based on source type
    if (source.source_type === 'ebay_listing') {
      output += `eBay Listing: ${source.metadata.card_name} - ${source.metadata.grade || 'Ungraded'}\n`;
      output += `   - Sale Price: $${source.metadata.sale_price}\n`;
      output += `   - Sale Date: ${source.metadata.sale_date}\n`;
      output += `   - Auction ID: ${source.metadata.auction_id}\n`;
      if (source.metadata.source_url) {
        output += `   - URL: ${source.metadata.source_url}\n`;
      }
    } else if (source.source_type === 'psa_pop_report') {
      output += `PSA Population Report: ${source.metadata.card_name} - ${source.metadata.grade}\n`;
      output += `   - Set: ${source.metadata.set}\n`;
      output += `   - Population: ${source.metadata.population}\n`;
      output += `   - Report Date: ${source.metadata.report_date}\n`;
    } else if (source.source_type === 'news_article') {
      output += `Article: "${source.metadata.title}"\n`;
      output += `   - Publication: ${source.metadata.publication}\n`;
      if (source.metadata.author) {
        output += `   - Author: ${source.metadata.author}\n`;
      }
      output += `   - Published: ${source.metadata.publish_date}\n`;
      if (source.metadata.source_url) {
        output += `   - URL: ${source.metadata.source_url}\n`;
      }
    } else {
      output += `${source.source_type}\n`;
      output += `   - Metadata: ${JSON.stringify(source.metadata, null, 2)}\n`;
    }

    output += `   - Relevance Score: ${(source.rerankScore * 100).toFixed(1)}%\n\n`;
  }

  return output;
}

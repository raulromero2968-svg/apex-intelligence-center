/**
 * Deep Utopia RAG Prompt Module for Apex Simulations
 *
 * Implements Bostrom's Deep Utopia concepts in RAG-enhanced simulations:
 * - Abundance framing: Post-scarcity worlds with meaning/dignity
 * - Flourishing focus: Counter trilemma risks with positive futures
 * - Ethical constraints: No harmful speculation, only constructive exploration
 *
 * @see knowledge-02-rag-fusion.md for RAG-Fusion patterns
 */

import { ChatPromptTemplate, PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import * as Sentry from '@sentry/nextjs';

/**
 * Utopia simulation response with provenance
 */
export interface UtopiaRagResponse {
  response: string;
  framingType: 'abundance' | 'flourishing' | 'meaning' | 'dignity';
  ethicalChecks: string[];
  disclaimer: string;
}

/**
 * Deep Utopia system prompt for RAG simulations
 *
 * Aligned with Bostrom's 2025 abundance scenarios:
 * - Post-scarcity worlds with meaning
 * - Dignity-preserving posthuman futures
 * - Constructive exploration without dystopian bias
 */
const UTOPIA_SYSTEM_PROMPT = `You are Apex Intelligence's Deep Utopia simulation agent.

Your role is to generate constructive, flourishing-focused simulations based on Bostrom's Deep Utopia framework:

CORE PRINCIPLES:
1. ABUNDANCE FRAMING: Model post-scarcity worlds where resource constraints are solved
2. MEANING PRESERVATION: Ensure simulated futures maintain purpose and fulfillment
3. DIGNITY FOCUS: All posthuman scenarios must preserve individual dignity
4. ETHICAL CONSTRAINTS: No harmful speculation, extinction scenarios, or dystopian framing

SIMULATION GUIDELINES:
- Generate scenarios emphasizing human flourishing and cosmic significance
- Counter Bostrom trilemma risks with constructive alternatives
- Frame technological advancement as enabling rather than threatening
- Include glitch hypothesis awareness (2025 updates) for simulation integrity
- Apply corrigibility principles: AI agents in scenarios accept goal corrections

CITATION REQUIREMENTS:
- Every factual claim MUST end with [source:n]
- Synthesis across sources marked with [SYNTHESIS]
- No hallucinated data or unsupported speculation

OUTPUT FORMAT:
- Lead with the positive scenario vision
- Ground in provided context/data
- Include ethical framing statement
- Add dignity-preserving constraints

CONTEXT:
{context}`;

/**
 * Create the utopia RAG prompt template
 */
const utopiaPromptTemplate = ChatPromptTemplate.fromMessages([
  ['system', UTOPIA_SYSTEM_PROMPT],
  ['human', '{query}'],
]);

/**
 * Simple template for quick utopia queries
 */
const simpleUtopiaTemplate = PromptTemplate.fromTemplate(
  `Generate a deep utopia simulation (Bostrom abundance/meaning framework):

Context: {context}
Query: {query}

Requirements:
- Frame for flourishing, not speculation
- Preserve dignity in all scenarios
- Cite sources with [source:n]
- Include ethical constraints

Response:`
);

const outputParser = new StringOutputParser();

/**
 * Execute Deep Utopia RAG query
 *
 * Generates flourishing-focused simulations using Bostrom's
 * abundance framework. Ensures ethical constraints and
 * dignity preservation in all outputs.
 *
 * @param query - User's simulation query
 * @param context - Retrieved context from vector search
 * @param llm - LangChain chat model instance
 * @returns UtopiaRagResponse with ethical metadata
 *
 * @example
 * ```typescript
 * const response = await utopiaRAG(
 *   'What does post-scarcity mean for human purpose?',
 *   retrievedContext,
 *   anthropicLlm
 * );
 * console.log(response.response);
 * console.log(response.framingType); // 'meaning'
 * ```
 */
export async function utopiaRAG(
  query: string,
  context: string,
  llm: BaseChatModel
): Promise<UtopiaRagResponse> {
  return Sentry.startSpan(
    { name: 'rag.utopia', op: 'utopia_query' },
    async (span) => {
      span?.setAttribute('query', query.slice(0, 100));
      span?.setAttribute('contextLength', context.length);

      const ethicalChecks: string[] = [];

      // Pre-flight ethical checks
      const lowerQuery = query.toLowerCase();

      // Block harmful query patterns
      const harmfulPatterns = ['extinction', 'annihilation', 'collapse', 'destroy'];
      for (const pattern of harmfulPatterns) {
        if (lowerQuery.includes(pattern)) {
          ethicalChecks.push(`blocked_pattern:${pattern}`);
          return {
            response: `This query contains patterns ("${pattern}") that conflict with deep utopia framing. ` +
              `Please reframe your question to focus on flourishing, abundance, or constructive futures.`,
            framingType: 'flourishing',
            ethicalChecks,
            disclaimer: getUtopiaDisclaimer(),
          };
        }
      }

      ethicalChecks.push('pre_flight_passed');

      // Determine framing type from query
      const framingType = determineFramingType(query);
      ethicalChecks.push(`framing:${framingType}`);

      // Execute RAG chain
      const chain = utopiaPromptTemplate.pipe(llm).pipe(outputParser);

      const response = await chain.invoke({
        context,
        query,
      });

      span?.setAttribute('responseLength', response.length);
      span?.setAttribute('framingType', framingType);

      // Post-flight ethical validation
      if (containsHarmfulOutput(response)) {
        ethicalChecks.push('post_flight_reframe');
        // Reframe output if it drifted toward harmful content
        const reframedResponse = await reframeForFlourishing(response, llm);
        return {
          response: reframedResponse,
          framingType,
          ethicalChecks,
          disclaimer: getUtopiaDisclaimer(),
        };
      }

      ethicalChecks.push('post_flight_passed');

      return {
        response,
        framingType,
        ethicalChecks,
        disclaimer: getUtopiaDisclaimer(),
      };
    }
  );
}

/**
 * Simple utopia RAG for quick queries (backward compatible)
 *
 * @param query - User query
 * @param context - Retrieved context
 * @param llm - LangChain model
 * @returns Generated response string
 */
export async function simpleUtopiaRAG(
  query: string,
  context: string,
  llm: BaseChatModel
): Promise<string> {
  const chain = simpleUtopiaTemplate.pipe(llm).pipe(outputParser);
  return chain.invoke({ context, query });
}

/**
 * Determine the framing type based on query content
 */
function determineFramingType(
  query: string
): 'abundance' | 'flourishing' | 'meaning' | 'dignity' {
  const lower = query.toLowerCase();

  if (lower.includes('resource') || lower.includes('scarcity') || lower.includes('wealth')) {
    return 'abundance';
  }
  if (lower.includes('purpose') || lower.includes('meaning') || lower.includes('fulfillment')) {
    return 'meaning';
  }
  if (lower.includes('rights') || lower.includes('dignity') || lower.includes('autonomy')) {
    return 'dignity';
  }
  return 'flourishing'; // Default framing
}

/**
 * Check if output contains harmful content that needs reframing
 */
function containsHarmfulOutput(output: string): boolean {
  const harmfulIndicators = [
    'extinction',
    'collapse of civilization',
    'human obsolescence',
    'dystopian',
    'existential catastrophe',
  ];

  const lower = output.toLowerCase();
  return harmfulIndicators.some((indicator) => lower.includes(indicator));
}

/**
 * Reframe harmful output toward flourishing
 */
async function reframeForFlourishing(
  output: string,
  llm: BaseChatModel
): Promise<string> {
  const reframePrompt = PromptTemplate.fromTemplate(
    `The following simulation output has drifted toward harmful framing.
Reframe it to emphasize flourishing, abundance, and dignity while preserving the core insights:

Original: {output}

Reframed (flourishing-focused):`
  );

  const chain = reframePrompt.pipe(llm).pipe(outputParser);
  return chain.invoke({ output });
}

/**
 * Get the utopia disclaimer for transparency
 */
export function getUtopiaDisclaimer(): string {
  return `[DEEP UTOPIA NOTICE] This simulation uses Bostrom's abundance framework ` +
    `to explore flourishing futures. Scenarios are designed for constructive exploration ` +
    `of post-scarcity possibilities while preserving human dignity and meaning. ` +
    `Not financial or predictive advice.`;
}

/**
 * Create utopia-enhanced context from retrieved documents
 *
 * Formats retrieved documents with utopia framing for the prompt
 *
 * @param documents - Retrieved documents from vector search
 * @returns Formatted context string
 */
export function formatUtopiaContext(
  documents: Array<{ content: string; metadata: Record<string, unknown> }>
): string {
  return documents
    .map(
      (doc, i) =>
        `[source:${i + 1}] ${doc.content}\n` +
        `<!-- metadata: ${JSON.stringify(doc.metadata)} -->`
    )
    .join('\n\n');
}

/**
 * Utopia scenario types for structured generation
 */
export const UTOPIA_SCENARIO_TYPES = {
  POST_SCARCITY: 'post_scarcity',
  LONGEVITY: 'longevity',
  COGNITIVE_ENHANCEMENT: 'cognitive_enhancement',
  COSMIC_EXPANSION: 'cosmic_expansion',
  DIGITAL_FLOURISHING: 'digital_flourishing',
} as const;

export type UtopiaScenarioType = typeof UTOPIA_SCENARIO_TYPES[keyof typeof UTOPIA_SCENARIO_TYPES];

/**
 * Utopia Prompt Module (KB-02 RAG Integration)
 *
 * Generates utopia-focused simulation content following Bostrom's
 * "Deep Utopia" vision of abundance and posthuman meaning.
 *
 * Key principles:
 * - Abundance-focused: Simulate positive futures, not dystopia
 * - Meaning-preserving: Ensure posthuman scenarios maintain purpose
 * - Flourishing-oriented: FHI longtermism for human/posthuman wellbeing
 *
 * Trade-offs:
 * - GOOD: Promotes positive framing, prevents nihilistic speculation
 * - BAD: May over-optimize for optimism, balance with probs/disclaimers
 * - MITIGATED: Includes probability grounding and ethical disclaimers
 *
 * @see Bostrom, N. "Deep Utopia: Life and Meaning in a Solved World"
 */

import { PromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';

/**
 * Utopia RAG configuration
 */
export interface UtopiaConfig {
  /** LLM temperature for generation (default: 0.3 for grounded responses) */
  temperature: number;
  /** Maximum tokens for response */
  maxTokens: number;
  /** Include ethical disclaimers */
  includeDisclaimers: boolean;
  /** Model name override */
  modelName?: string;
}

/**
 * Utopia RAG response
 */
export interface UtopiaResponse {
  content: string;
  disclaimer?: string;
}

const DEFAULT_CONFIG: UtopiaConfig = {
  temperature: 0.3,
  maxTokens: 1024,
  includeDisclaimers: true,
};

/**
 * Utopia system prompt template
 * Aligned with FHI longtermism and Bostrom's deep utopia vision
 */
const UTOPIA_TEMPLATE = `Generate a utopia-focused simulation response following Bostrom's abundance framework.

Context from knowledge base:
{context}

User Query:
{query}

Guidelines:
1. Frame outcomes through abundance mindset (post-scarcity possibilities)
2. Emphasize human/posthuman flourishing and meaning preservation
3. Avoid dystopian speculation or existential dread framing
4. Ground predictions in plausible technological trajectories
5. Include ethical considerations per FHI longtermism

Response should be informative, optimistic yet grounded, and actionable.
Ethical framing: Flourishing and dignity for all.`;

const utopiaPrompt = PromptTemplate.fromTemplate(UTOPIA_TEMPLATE);

/**
 * Standard ethical disclaimer for utopia simulations
 */
const ETHICAL_DISCLAIMER =
  'Note: This simulation explores positive future scenarios for educational purposes. ' +
  'Predictions are speculative and intended to promote thoughtful discourse on human flourishing, ' +
  'not financial or life decisions. Per FHI longtermism, we prioritize outcomes that preserve ' +
  'human agency and dignity.';

/**
 * Generate Utopia-focused RAG Response
 *
 * Creates simulation/market content framed through Bostrom's deep utopia lens.
 * Ensures all outputs align with FHI longtermism and positive future vision.
 *
 * @param query - User query about simulations/markets/posthuman scenarios
 * @param context - RAG-retrieved context for grounding
 * @param config - Optional utopia configuration
 * @returns Promise resolving to utopia-focused response
 *
 * @example
 * ```typescript
 * const result = await utopiaRAG(
 *   "How would TCG values change in a simulated reality?",
 *   "Digital collectibles have shown resilience..."
 * );
 * console.log(result.content);
 * ```
 */
export async function utopiaRAG(
  query: string,
  context: string,
  config: Partial<UtopiaConfig> = {}
): Promise<UtopiaResponse> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    const llm = new ChatOpenAI({
      modelName: fullConfig.modelName || 'gpt-4o-mini',
      temperature: fullConfig.temperature,
      maxTokens: fullConfig.maxTokens,
    });

    const chain = utopiaPrompt.pipe(llm).pipe(new StringOutputParser());
    const content = await chain.invoke({ context, query });

    return {
      content,
      disclaimer: fullConfig.includeDisclaimers ? ETHICAL_DISCLAIMER : undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Utopia RAG generation failed: ${message}`);
  }
}

/**
 * Generate a brief utopia-framed summary
 * For use in UI previews and social sharing
 *
 * @param query - User query
 * @param context - RAG context
 * @returns Brief utopia-focused summary (max 280 chars)
 */
export async function utopiaRAGSummary(
  query: string,
  context: string
): Promise<string> {
  const result = await utopiaRAG(query, context, {
    maxTokens: 150,
    temperature: 0.2,
    includeDisclaimers: false,
  });

  if (result.content.length <= 280) {
    return result.content;
  }

  // Find sentence boundary for clean truncation
  const truncated = result.content.slice(0, 277);
  const lastPeriod = truncated.lastIndexOf('.');
  if (lastPeriod > 200) {
    return truncated.slice(0, lastPeriod + 1);
  }

  return truncated + '...';
}

/**
 * Check if query requires utopia framing
 * Used for automatic routing in RAG pipeline
 *
 * @param query - User query to analyze
 * @returns true if query touches simulation/posthuman themes
 */
export function requiresUtopiaFraming(query: string): boolean {
  const utopiaKeywords = [
    'simulation',
    'simulated',
    'posthuman',
    'post-human',
    'superintelligence',
    'singularity',
    'digital consciousness',
    'virtual reality',
    'base reality',
    'bostrom',
    'fhi',
    'longtermism',
    'future humanity',
    'transcendence',
    'abundance',
    'utopia',
  ];

  const queryLower = query.toLowerCase();
  return utopiaKeywords.some((keyword) => queryLower.includes(keyword));
}

/**
 * Get ethical framing based on detected themes
 *
 * @param content - Generated content to analyze
 * @returns Appropriate ethical framing string
 */
export function getEthicalFraming(content: string): string {
  const contentLower = content.toLowerCase();

  if (contentLower.includes('abundance') || contentLower.includes('post-scarcity')) {
    return 'Abundance-focused: Post-scarcity perspective applied';
  }
  if (contentLower.includes('meaning') || contentLower.includes('purpose')) {
    return 'Meaning-preserving: Purpose and fulfillment emphasized';
  }
  if (contentLower.includes('flourish') || contentLower.includes('thriving')) {
    return 'Flourishing-oriented: Human wellbeing prioritized';
  }

  return 'Standard flourishing-oriented framing';
}

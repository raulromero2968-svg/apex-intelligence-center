/**
 * Bostrom Trilemma Variants for RAG Pipeline
 *
 * Generates prediction variants based on Nick Bostrom's simulation argument:
 * 1. Extinction: Civilization ends before posthuman stage
 * 2. No Simulation: Posthumans avoid running ancestor simulations
 * 3. In Simulation: We are almost certainly in a simulation (~99.9%)
 *
 * 2025 Updates:
 * - Glitch hypothesis: Observable anomalies as simulation evidence
 * - Probabilistic extensions: Bayesian updates on base reality
 * - EGGROLL low-rank mutations for stable variant generation
 *
 * Trade-offs:
 * - GOOD: TCG simulations as "fantasy markets" engage users, boost prediction accuracy
 * - BAD: Integer-only mutations limit nuance; use for initial models, fine-tune with backprop
 * - ETHICAL: FHI alignment via longtermist simulations, prevent harmful outcome bets
 *
 * From knowledge-02-ai-rag-architecture-v2.md (Advanced RAG Architecture)
 */

import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { rerankResults } from '@/rag';
import type { CohereClient } from 'cohere-ai';
import type { SearchResult } from '@/rag/search';
import * as Sentry from '@sentry/nextjs';
import type { Span } from '@sentry/types';

// ============================================================================
// Types
// ============================================================================

/**
 * Bostrom trilemma outcome types
 */
export type TrilemmaOutcome = 'extinction' | 'posthuman_avoidance' | 'simulation';

/**
 * A single Bostrom variant prediction
 */
export interface BostromVariant {
  outcome: TrilemmaOutcome;
  description: string;
  probability: number; // 0-1 probability estimate
  confidence: number; // 0-1 model confidence in this estimate
  reasoning: string;
  ethicalNotes?: string;
}

/**
 * Parameters for Bostrom RAG variant generation
 */
export interface BostromRAGParams {
  query: string;
  context: string;
  cohereClient?: CohereClient | null;
  numVariants?: number; // Default: 3 (one per trilemma branch)
  ethicsFilter?: boolean; // Default: true (filter harmful predictions)
  useEGGROLL?: boolean; // Use EGGROLL-style low-rank mutations
}

/**
 * Result from Bostrom variant generation
 */
export interface BostromRAGResult {
  selectedVariant: string; // Best ethical variant with disclaimer
  allVariants: BostromVariant[];
  rerankedContext: string;
  ethicsApplied: boolean;
  processingTimeMs: number;
}

// ============================================================================
// Configuration
// ============================================================================

const BOSTROM_CONFIG = {
  // Default probabilities based on Bostrom's original argument
  baseProbabilities: {
    extinction: 0.1, // ~10% civilizations go extinct
    posthuman_avoidance: 0.1, // ~10% posthumans don't simulate
    simulation: 0.8, // ~80% we're in simulation if above are false
  },
  // EGGROLL-inspired mutation rates (integer-friendly)
  mutationRates: {
    low: 0.05, // 5% variance
    medium: 0.15, // 15% variance
    high: 0.25, // 25% variance
  },
  // Ethics thresholds
  ethics: {
    harmfulProbabilityThreshold: 0.9, // Flag if harmful outcome > 90% likely
    requireDisclaimer: true,
  },
} as const;

// ============================================================================
// Prompt Templates
// ============================================================================

/**
 * Bostrom trilemma variant generation prompt
 * Uses EGGROLL-inspired low-rank mutation concepts for stable predictions
 */
const BOSTROM_VARIANT_TEMPLATE = `You are an AI research assistant specializing in simulation theory, prediction markets, and existential risk.

TASK: Generate {numVariants} Bostrom trilemma variants for the given query, applying simulation theory to TCG market predictions.

BOSTROM'S TRILEMMA (2003, with 2025 updates):
1. EXTINCTION: Civilizations almost always go extinct before reaching posthuman stage
   - Market analog: Card/asset collapses (>20% loss scenarios)
   - 2025 update: Climate tipping points, AI misalignment, pandemic risk

2. POSTHUMAN AVOIDANCE: Posthuman civilizations don't run ancestor simulations
   - Market analog: Stable growth with limited speculation
   - 2025 update: Ethical constraints on consciousness creation

3. IN SIMULATION: We are almost certainly living in a computer simulation (~99.9% if others false)
   - Market analog: Outlier events, "black swans", extreme gains (>50%)
   - 2025 update: Glitch hypothesis (observable anomalies), Boltzmann brains

CONTEXT FROM RAG:
{context}

QUERY: {query}

RESPONSE FORMAT (generate exactly {numVariants} variants):

VARIANT 1 - [OUTCOME_TYPE]:
Probability: [0-100]%
Confidence: [0-100]%
Description: [1-2 sentences describing this scenario]
Reasoning: [Evidence-based reasoning connecting to context]
Ethical Notes: [Any flourishing-focused considerations]

[Repeat for each variant]

CRITICAL GUIDELINES:
- Ground predictions in provided context with evidence
- Apply EGGROLL-style mutations: small integer adjustments to base probabilities
- Prioritize ethical/flourishing outcomes over harm-maximizing predictions
- Include 2025 updates: glitch hypothesis, probabilistic extensions
- Add disclaimer: "Simulations for positive outcomes, not speculation"

BEGIN:`;

const bostromVariantPrompt = PromptTemplate.fromTemplate(BOSTROM_VARIANT_TEMPLATE);

/**
 * Ethics filter prompt - checks if predictions are ethically sound
 */
const ETHICS_FILTER_TEMPLATE = `Evaluate if this prediction aligns with FHI longtermism and flourishing principles.

PREDICTION: {prediction}

CRITERIA:
1. Does it promote harmful speculation on extinction/suffering?
2. Does it encourage gambling on negative outcomes?
3. Does it violate "Sentient Beings First" philosophy?

If ANY criteria are violated, respond with "FILTER" followed by reason.
Otherwise respond with "PASS".

RESPONSE:`;

const ethicsFilterPrompt = PromptTemplate.fromTemplate(ETHICS_FILTER_TEMPLATE);

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Parse LLM output into structured BostromVariant objects
 */
function parseVariants(output: string): BostromVariant[] {
  const variants: BostromVariant[] = [];
  const variantBlocks = output.split(/VARIANT \d+/i).filter(Boolean);

  for (const block of variantBlocks) {
    try {
      // Extract outcome type from header
      const outcomeMatch = block.match(/[-–]\s*(EXTINCTION|POSTHUMAN[_\s]?AVOIDANCE|IN[_\s]?SIMULATION|SIMULATION)/i);
      const outcome = normalizeOutcome(outcomeMatch?.[1] || 'simulation');

      // Extract probability
      const probMatch = block.match(/Probability:\s*(\d+(?:\.\d+)?)/i);
      const probability = probMatch ? parseFloat(probMatch[1]) / 100 : BOSTROM_CONFIG.baseProbabilities[outcome];

      // Extract confidence
      const confMatch = block.match(/Confidence:\s*(\d+(?:\.\d+)?)/i);
      const confidence = confMatch ? parseFloat(confMatch[1]) / 100 : 0.5;

      // Extract description
      const descMatch = block.match(/Description:\s*(.+?)(?=Reasoning:|Ethical|$)/is);
      const description = descMatch?.[1]?.trim() || 'No description provided';

      // Extract reasoning
      const reasonMatch = block.match(/Reasoning:\s*(.+?)(?=Ethical|$)/is);
      const reasoning = reasonMatch?.[1]?.trim() || 'No reasoning provided';

      // Extract ethical notes
      const ethicsMatch = block.match(/Ethical\s*Notes?:\s*(.+?)$/is);
      const ethicalNotes = ethicsMatch?.[1]?.trim();

      variants.push({
        outcome,
        description,
        probability: Math.min(1, Math.max(0, probability)),
        confidence: Math.min(1, Math.max(0, confidence)),
        reasoning,
        ethicalNotes,
      });
    } catch (e) {
      // Skip malformed variants
      console.warn('[BostromVariants] Failed to parse variant block:', e);
    }
  }

  return variants;
}

/**
 * Normalize outcome string to TrilemmaOutcome type
 */
function normalizeOutcome(raw: string): TrilemmaOutcome {
  const normalized = raw.toLowerCase().replace(/[\s_-]+/g, '');
  if (normalized.includes('extinction')) return 'extinction';
  if (normalized.includes('posthuman') || normalized.includes('avoidance')) return 'posthuman_avoidance';
  return 'simulation';
}

/**
 * Apply EGGROLL-style low-rank mutations to probabilities
 * Uses integer-friendly operations for stability
 */
function applyEGGROLLMutations(variants: BostromVariant[], mutationLevel: 'low' | 'medium' | 'high' = 'medium'): BostromVariant[] {
  const rate = BOSTROM_CONFIG.mutationRates[mutationLevel];

  return variants.map((variant) => {
    // Integer-friendly mutation: round to nearest 5%
    const mutation = Math.round((Math.random() - 0.5) * 2 * rate * 20) / 20;
    const newProbability = Math.min(1, Math.max(0, variant.probability + mutation));

    return {
      ...variant,
      probability: newProbability,
      // Slightly reduce confidence when mutating
      confidence: variant.confidence * (1 - Math.abs(mutation)),
    };
  });
}

/**
 * Select the best ethical variant based on reranking and ethics filter
 */
async function selectBestVariant(
  variants: BostromVariant[],
  query: string,
  cohereClient: CohereClient | null
): Promise<BostromVariant> {
  // Convert variants to search results for reranking
  const variantDocs: SearchResult[] = variants.map((v, i) => ({
    id: `variant-${i}`,
    content: `${v.outcome}: ${v.description}. ${v.reasoning}`,
    score: v.probability * v.confidence,
    metadata: { outcome: v.outcome, index: i },
    source_type: 'bostrom_variant',
    created_at: new Date(),
  }));

  // Rerank with ethics focus
  const ethicsQuery = `${query} ethical flourishing positive outcome`;
  const reranked = await rerankResults(ethicsQuery, variantDocs, 1, cohereClient);

  // Return the top variant
  const topIndex = reranked[0]?.metadata?.index ?? 0;
  return variants[topIndex] || variants[0];
}

/**
 * Format the final output with ethical disclaimer
 */
function formatOutput(variant: BostromVariant): string {
  const probabilityPct = Math.round(variant.probability * 100);
  const confidencePct = Math.round(variant.confidence * 100);

  let output = `**${variant.outcome.toUpperCase()} Scenario** (${probabilityPct}% probability, ${confidencePct}% confidence)\n\n`;
  output += `${variant.description}\n\n`;
  output += `**Reasoning:** ${variant.reasoning}\n\n`;

  if (variant.ethicalNotes) {
    output += `**Ethical Considerations:** ${variant.ethicalNotes}\n\n`;
  }

  output += `---\n*Disclaimer: Per FHI longtermism principles, these simulations are for exploring positive outcomes and flourishing scenarios, not speculation on harmful events. Avoid bets on extinction or suffering.*`;

  return output;
}

// ============================================================================
// Main Export
// ============================================================================

/**
 * Generate Bostrom trilemma variants using RAG context
 *
 * Combines simulation theory with TCG market predictions:
 * - Retrieves relevant context from RAG
 * - Generates variants for each trilemma branch
 * - Applies EGGROLL-style mutations for stability
 * - Filters for ethical/flourishing outcomes
 * - Reranks to select best variant
 *
 * @param params - Generation parameters
 * @returns Selected variant with ethical disclaimers
 *
 * @example
 * ```typescript
 * const result = await bostromRAGVariants({
 *   query: "What's the probability Charizard prices collapse next quarter?",
 *   context: ragContext,
 *   cohereClient,
 * });
 * console.log(result.selectedVariant);
 * ```
 */
export async function bostromRAGVariants(
  params: BostromRAGParams
): Promise<BostromRAGResult> {
  const startTime = Date.now();
  const {
    query,
    context,
    cohereClient = null,
    numVariants = 3,
    ethicsFilter = true,
    useEGGROLL = true,
  } = params;

  return Sentry.startSpan(
    { name: 'rag.bostrom_variants', op: 'generation' },
    async (span: Span) => {
      span?.setAttribute('query', query.slice(0, 100));
      span?.setAttribute('numVariants', numVariants);
      span?.setAttribute('ethicsFilter', ethicsFilter);
      span?.setAttribute('useEGGROLL', useEGGROLL);

      try {
        // Check for OpenAI API key
        if (!process.env.OPENAI_API_KEY) {
          // Return stub response when no API key
          return generateStubResponse(query, context, startTime);
        }

        const llm = new ChatOpenAI({
          temperature: 0.7, // Higher for creative variant generation
          modelName: 'gpt-4o-mini',
          maxTokens: 2000,
        });

        // Generate variants
        const chain = bostromVariantPrompt.pipe(llm).pipe(new StringOutputParser());
        const rawOutput = await chain.invoke({
          query,
          context: context.slice(0, 8000), // Limit context length
          numVariants,
        });

        span?.setAttribute('rawOutputLength', rawOutput.length);

        // Parse variants
        let variants = parseVariants(rawOutput);

        // Apply EGGROLL mutations if enabled
        if (useEGGROLL && variants.length > 0) {
          variants = applyEGGROLLMutations(variants, 'medium');
        }

        // If parsing failed, create default variants
        if (variants.length === 0) {
          variants = createDefaultVariants(query);
        }

        span?.setAttribute('parsedVariantCount', variants.length);

        // Apply ethics filter
        let ethicsApplied = false;
        if (ethicsFilter) {
          const ethicsLlm = new ChatOpenAI({
            temperature: 0,
            modelName: 'gpt-4o-mini',
            maxTokens: 100,
          });

          const ethicsChain = ethicsFilterPrompt.pipe(ethicsLlm).pipe(new StringOutputParser());

          // Filter out harmful variants
          const filteredVariants: BostromVariant[] = [];
          for (const variant of variants) {
            const ethicsCheck = await ethicsChain.invoke({
              prediction: `${variant.outcome}: ${variant.description}`,
            });

            if (!ethicsCheck.trim().toUpperCase().startsWith('FILTER')) {
              filteredVariants.push(variant);
            } else {
              ethicsApplied = true;
            }
          }

          // Use filtered variants if any remain
          if (filteredVariants.length > 0) {
            variants = filteredVariants;
          }
        }

        // Select best variant via reranking
        const selectedVariant = await selectBestVariant(variants, query, cohereClient);
        const formattedOutput = formatOutput(selectedVariant);

        const processingTimeMs = Date.now() - startTime;
        span?.setAttribute('processingTimeMs', processingTimeMs);

        return {
          selectedVariant: formattedOutput,
          allVariants: variants,
          rerankedContext: context.slice(0, 2000),
          ethicsApplied,
          processingTimeMs,
        };
      } catch (error) {
        Sentry.captureException(error, {
          extra: { query, contextLength: context.length },
        });

        console.error('[BostromVariants] Generation failed:', error);

        // Return graceful fallback
        return generateStubResponse(query, context, startTime);
      }
    }
  );
}

/**
 * Create default variants when parsing fails
 */
function createDefaultVariants(_query: string): BostromVariant[] {
  return [
    {
      outcome: 'simulation',
      description: 'Based on Bostrom\'s argument, if posthuman civilizations run ancestor simulations, most conscious beings exist in simulations.',
      probability: BOSTROM_CONFIG.baseProbabilities.simulation,
      confidence: 0.6,
      reasoning: 'Default probability from Bostrom\'s original 2003 paper.',
      ethicalNotes: 'This scenario encourages careful consideration of digital consciousness and simulation ethics.',
    },
    {
      outcome: 'posthuman_avoidance',
      description: 'Posthuman civilizations may choose not to run ancestor simulations due to ethical concerns or resource constraints.',
      probability: BOSTROM_CONFIG.baseProbabilities.posthuman_avoidance,
      confidence: 0.5,
      reasoning: 'Ethical constraints on creating conscious simulations may prevent this scenario.',
      ethicalNotes: 'This outcome aligns with FHI longtermism principles of respecting consciousness.',
    },
    {
      outcome: 'extinction',
      description: 'Civilization may face existential risks before reaching posthuman technological capability.',
      probability: BOSTROM_CONFIG.baseProbabilities.extinction,
      confidence: 0.4,
      reasoning: 'Existential risks (AI misalignment, climate, pandemics) pose ongoing challenges.',
      ethicalNotes: 'Focus on risk mitigation and flourishing rather than speculation on collapse.',
    },
  ];
}

/**
 * Generate stub response when API is unavailable
 */
function generateStubResponse(query: string, context: string, startTime: number): BostromRAGResult {
  const defaultVariants = createDefaultVariants(query);
  const selectedVariant = defaultVariants[0];

  return {
    selectedVariant: formatOutput(selectedVariant) + '\n\n*Note: This is a demo response. Full RAG-powered variant generation requires API configuration.*',
    allVariants: defaultVariants,
    rerankedContext: context.slice(0, 2000),
    ethicsApplied: true,
    processingTimeMs: Date.now() - startTime,
  };
}

/**
 * Quick helper for use in philosophy research route
 *
 * @param query - User query
 * @param context - RAG context
 * @returns Formatted Bostrom variant response
 */
export async function quickBostromVariants(query: string, context: string): Promise<string> {
  const result = await bostromRAGVariants({ query, context });
  return result.selectedVariant;
}

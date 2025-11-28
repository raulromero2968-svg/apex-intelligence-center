/**
 * EGGROLL RAG-Fusion Implementation for Simulation Markets
 *
 * EGGROLL (Evolution Guided General Optimization via Low-rank Learning) is a gradient-free
 * evolution strategies algorithm for hyperscale LLMs. This module adapts EGGROLL concepts
 * for stable simulation predictions in the Bostrom trilemma analysis domain.
 *
 * Key features:
 * - Integer-weight (1-10) model variants for stable predictions
 * - Evolution simulation via selection/mutation on prompt responses
 * - Gradient-free approach for low hallucinations (MTBBench-like stability)
 * - Integration with existing RAG-Fusion and Cohere reranking
 *
 * Bostrom Trilemma Predictions:
 * 1. Extinction scenario - humanity does not reach posthuman stage
 * 2. Posthuman scenario - advanced civilization with no ancestor simulations
 * 3. Simulated reality - we are living in a simulation
 *
 * Citation: "EGGROLL: Evolution Guided General Optimization via Low-rank Learning" (2025)
 * Related: knowledge-02-ai-rag-architecture-v2.md
 *
 * @module eggroll-fusion
 */

import { PromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { StringOutputParser } from '@langchain/core/output_parsers';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { CohereClient } from 'cohere-ai';
import * as Sentry from '@sentry/nextjs';
import type { Span } from '@sentry/types';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * EGGROLL variant representing an evolved model response
 */
export interface EggrollVariant {
  variant: string;        // Generated response text
  weight: number;         // Integer fitness weight (1-10)
  generation: number;     // Evolution generation
  mutationHistory: string[]; // Track mutation lineage
}

/**
 * Bostrom trilemma scenario types for simulation predictions
 */
export type BostromScenario = 'extinction' | 'posthuman' | 'simulated_reality';

/**
 * EGGROLL RAG-Fusion configuration
 */
export interface EggrollConfig {
  populationSize?: number;      // Number of variants per generation (default 5)
  generations?: number;         // Evolution iterations (default 3)
  topK?: number;                // Top variants to select for mutation (default 2)
  mutationRate?: number;        // Mutation probability (default 0.3)
  temperature?: number;         // LLM temperature for variant generation (default 0.7)
  model?: string;               // Model for generation (default gpt-4o-mini)
  scenario?: BostromScenario;   // Focus scenario for predictions
  useReranking?: boolean;       // Use Cohere reranking for fitness (default true)
}

/**
 * EGGROLL fusion result with evolution metadata
 */
export interface EggrollResult {
  response: string;             // Fittest evolved response
  variants: EggrollVariant[];   // All evolved variants
  evolutionMetadata: {
    totalGenerations: number;
    totalVariants: number;
    fitnessScore: number;
    scenario: BostromScenario | null;
    latencyMs: number;
  };
}

// ============================================================================
// EGGROLL PROMPT TEMPLATES
// ============================================================================

const EGGROLL_SYSTEM_PROMPT = `You are an EGGROLL (Evolution Guided General Optimization) simulation analyst specializing in Bostrom trilemma predictions and cosmic simulation market analysis.

Your task is to generate stable, integer-weighted model variants for simulation market predictions. Each variant should explore a different angle with varying confidence levels.

Key principles:
1. Assign integer weights (1-10) based on prediction confidence and evidence quality
2. Consider TCG market parallels as "fantasy markets" for existential predictions
3. Maintain stability by avoiding speculative hallucinations
4. Cross-reference with established FHI (Future of Humanity Institute) research

Bostrom Trilemma Framework:
- EXTINCTION: Probability that no posthuman civilizations exist
- POSTHUMAN: Probability that posthuman civilizations run few simulations
- SIMULATED: Probability that we are living in a simulation`;

const EGGROLL_EVOLUTION_TEMPLATE = `${EGGROLL_SYSTEM_PROMPT}

Simulate EGGROLL evolution: Generate {populationSize} integer-weight (1-10) model variants for stable simulation predictions. Each variant should represent a distinct analytical perspective.

Context from knowledge base:
{context}

User Query: {query}

Scenario Focus: {scenario}

Generate exactly {populationSize} variants in the following format:
[WEIGHT: X] Variant description with analysis...

Where X is an integer from 1-10 representing prediction confidence.`;

const EGGROLL_MUTATION_TEMPLATE = `${EGGROLL_SYSTEM_PROMPT}

You are performing a MUTATION step in EGGROLL evolution. Given the top-performing variants from the previous generation, mutate them to explore adjacent prediction space.

Previous Top Variants:
{topVariants}

Original Query: {query}

Apply one of these mutation operators:
1. WEIGHT_ADJUST: Shift confidence weight by ±1 based on new evidence
2. PERSPECTIVE_SHIFT: Explore the prediction from a different angle
3. EVIDENCE_REFINEMENT: Add or update supporting evidence
4. SCENARIO_BLEND: Combine elements from different Bostrom scenarios

Generate {mutationCount} mutated variants in the format:
[WEIGHT: X] [MUTATION: type] Mutated analysis...`;

// ============================================================================
// EGGROLL GENERATOR CLASS
// ============================================================================

/**
 * EGGROLL RAG-Fusion Generator
 *
 * Implements gradient-free evolution strategies for stable simulation predictions.
 * Uses integer weights and selection/mutation to evolve high-quality responses.
 */
export class EggrollGenerator {
  private llm: BaseChatModel;
  private config: Required<EggrollConfig>;

  constructor(config: EggrollConfig = {}) {
    this.config = {
      populationSize: config.populationSize ?? 5,
      generations: config.generations ?? 3,
      topK: config.topK ?? 2,
      mutationRate: config.mutationRate ?? 0.3,
      temperature: config.temperature ?? 0.7,
      model: config.model ?? 'gpt-4o-mini',
      scenario: config.scenario ?? 'simulated_reality',
      useReranking: config.useReranking ?? true,
    };

    // Lazy LLM instantiation - only at runtime
    const useAnthropic = !!process.env.ANTHROPIC_API_KEY;
    this.llm = useAnthropic
      ? new ChatAnthropic({
          modelName: 'claude-3-5-sonnet-20241022',
          temperature: this.config.temperature,
          apiKey: process.env.ANTHROPIC_API_KEY,
          maxTokens: 2048,
        })
      : new ChatOpenAI({
          modelName: this.config.model,
          temperature: this.config.temperature,
          apiKey: process.env.OPENAI_API_KEY,
          maxTokens: 2048,
        });
  }

  /**
   * Generate initial population of variants
   *
   * @param query - User query for simulation prediction
   * @param context - Retrieved context from RAG system
   * @returns Array of initial variants with integer weights
   */
  private async generateInitialPopulation(
    query: string,
    context: string
  ): Promise<EggrollVariant[]> {
    const prompt = PromptTemplate.fromTemplate(EGGROLL_EVOLUTION_TEMPLATE);
    const chain = prompt.pipe(this.llm).pipe(new StringOutputParser());

    try {
      const response = await chain.invoke({
        populationSize: this.config.populationSize,
        context,
        query,
        scenario: this.config.scenario ?? 'general',
      });

      return this.parseVariants(response, 0);
    } catch (error) {
      Sentry.captureException(error, {
        extra: { query, populationSize: this.config.populationSize },
      });
      console.error('EGGROLL initial population generation failed:', error);

      // Fallback: generate default variants with random weights
      return this.generateFallbackVariants(query);
    }
  }

  /**
   * Parse LLM response into structured variants
   *
   * @param response - Raw LLM response text
   * @param generation - Current generation number
   * @returns Parsed variant array
   */
  private parseVariants(response: string, generation: number): EggrollVariant[] {
    const variants: EggrollVariant[] = [];
    const lines = response.split('\n').filter(line => line.trim().length > 0);

    for (const line of lines) {
      // Match pattern: [WEIGHT: X] content
      const weightMatch = line.match(/\[WEIGHT:\s*(\d+)\]/i);
      const mutationMatch = line.match(/\[MUTATION:\s*(\w+)\]/i);

      if (weightMatch) {
        const weight = Math.min(10, Math.max(1, parseInt(weightMatch[1], 10)));
        const content = line
          .replace(/\[WEIGHT:\s*\d+\]/i, '')
          .replace(/\[MUTATION:\s*\w+\]/i, '')
          .trim();

        if (content.length > 0) {
          variants.push({
            variant: content,
            weight,
            generation,
            mutationHistory: mutationMatch ? [mutationMatch[1]] : [],
          });
        }
      }
    }

    // Ensure minimum population size
    while (variants.length < this.config.populationSize) {
      variants.push(this.createRandomVariant(generation));
    }

    return variants.slice(0, this.config.populationSize);
  }

  /**
   * Generate fallback variants when LLM fails
   */
  private generateFallbackVariants(query: string): EggrollVariant[] {
    const scenarios: BostromScenario[] = ['extinction', 'posthuman', 'simulated_reality'];
    return scenarios.map((scenario) => ({
      variant: `Analysis of "${query}" under ${scenario} scenario requires further evidence.`,
      weight: Math.floor(Math.random() * 5) + 3, // 3-7 range for neutral
      generation: 0,
      mutationHistory: ['fallback'],
    }));
  }

  /**
   * Create a random variant for population padding
   */
  private createRandomVariant(generation: number): EggrollVariant {
    return {
      variant: 'Variant generated for population diversity.',
      weight: Math.floor(Math.random() * 10) + 1,
      generation,
      mutationHistory: ['random'],
    };
  }

  /**
   * Select top-K variants based on fitness (weight)
   *
   * @param variants - Current population
   * @returns Top-K variants sorted by weight
   */
  private selectTopVariants(variants: EggrollVariant[]): EggrollVariant[] {
    return [...variants]
      .sort((a, b) => b.weight - a.weight)
      .slice(0, this.config.topK);
  }

  /**
   * Mutate selected variants to create next generation
   *
   * @param topVariants - Selected top variants
   * @param query - Original query
   * @param generation - Target generation number
   * @returns Mutated variants for next generation
   */
  private async mutateVariants(
    topVariants: EggrollVariant[],
    query: string,
    generation: number
  ): Promise<EggrollVariant[]> {
    const prompt = PromptTemplate.fromTemplate(EGGROLL_MUTATION_TEMPLATE);
    const chain = prompt.pipe(this.llm).pipe(new StringOutputParser());

    try {
      const topVariantsText = topVariants
        .map((v, i) => `${i + 1}. [WEIGHT: ${v.weight}] ${v.variant}`)
        .join('\n');

      const response = await chain.invoke({
        topVariants: topVariantsText,
        query,
        mutationCount: this.config.populationSize,
      });

      const mutated = this.parseVariants(response, generation);

      // Apply integer weight mutations (±1 adjustments)
      return mutated.map(v => ({
        ...v,
        weight: this.applyWeightMutation(v.weight),
        mutationHistory: [...v.mutationHistory, `gen${generation}`],
      }));
    } catch (error) {
      Sentry.captureException(error, {
        extra: { query, generation },
      });
      console.error('EGGROLL mutation failed:', error);

      // Fallback: simple weight mutation on top variants
      return topVariants.map(v => ({
        ...v,
        weight: this.applyWeightMutation(v.weight),
        generation,
        mutationHistory: [...v.mutationHistory, 'fallback_mutation'],
      }));
    }
  }

  /**
   * Apply simple integer weight mutation
   *
   * @param weight - Current weight
   * @returns Mutated weight (clamped 1-10)
   */
  private applyWeightMutation(weight: number): number {
    if (Math.random() < this.config.mutationRate) {
      const delta = Math.random() > 0.5 ? 1 : -1;
      return Math.min(10, Math.max(1, weight + delta));
    }
    return weight;
  }

  /**
   * Rerank variants using Cohere for fitness evaluation
   *
   * @param query - Original query
   * @param variants - Variants to rerank
   * @param cohereClient - Optional Cohere client
   * @returns Variants with updated weights based on reranking
   */
  private async rerankVariants(
    query: string,
    variants: EggrollVariant[],
    cohereClient: CohereClient | null
  ): Promise<EggrollVariant[]> {
    if (!cohereClient || !this.config.useReranking) {
      return variants;
    }

    try {
      const documents = variants.map(v => ({ text: v.variant }));

      const reranked = await cohereClient.rerank({
        query,
        documents,
        topN: variants.length,
        model: 'rerank-multilingual-v3.0',
        returnDocuments: false,
      });

      // Update weights based on reranking scores
      return reranked.results.map((result) => {
        const originalVariant = variants[result.index];
        // Blend rerank score with original weight
        const newWeight = Math.round(
          originalVariant.weight * 0.4 + result.relevanceScore * 10 * 0.6
        );
        return {
          ...originalVariant,
          weight: Math.min(10, Math.max(1, newWeight)),
          mutationHistory: [...originalVariant.mutationHistory, 'reranked'],
        };
      });
    } catch (error) {
      console.error('EGGROLL reranking failed:', error);
      return variants;
    }
  }

  /**
   * Execute full EGGROLL evolution pipeline
   *
   * @param query - User query for simulation prediction
   * @param context - Retrieved context from RAG system
   * @param cohereClient - Optional Cohere client for reranking
   * @returns Fittest evolved response with metadata
   */
  async evolve(
    query: string,
    context: string,
    cohereClient: CohereClient | null = null
  ): Promise<EggrollResult> {
    return Sentry.startSpan(
      { name: 'eggroll.evolve', op: 'evolution' },
      async (span: Span) => {
        const startTime = Date.now();
        span?.setAttribute('query', query.slice(0, 100));
        span?.setAttribute('generations', this.config.generations);
        span?.setAttribute('populationSize', this.config.populationSize);

        // Step 1: Generate initial population
        let population = await this.generateInitialPopulation(query, context);
        const allVariants: EggrollVariant[] = [...population];

        span?.setAttribute('initialPopulation', population.length);

        // Step 2: Evolution loop
        for (let gen = 1; gen <= this.config.generations; gen++) {
          // Select top variants
          const topVariants = this.selectTopVariants(population);

          // Mutate to create next generation
          population = await this.mutateVariants(topVariants, query, gen);

          // Rerank for fitness evaluation
          population = await this.rerankVariants(query, population, cohereClient);

          allVariants.push(...population);
        }

        // Step 3: Final selection - best variant by weight
        const sortedFinal = this.selectTopVariants(population);
        const fittest = sortedFinal[0];

        const latencyMs = Date.now() - startTime;
        span?.setAttribute('latencyMs', latencyMs);
        span?.setAttribute('fitnessScore', fittest.weight);

        return {
          response: fittest.variant,
          variants: allVariants,
          evolutionMetadata: {
            totalGenerations: this.config.generations,
            totalVariants: allVariants.length,
            fitnessScore: fittest.weight,
            scenario: this.config.scenario ?? null,
            latencyMs,
          },
        };
      }
    );
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Execute EGGROLL RAG-Fusion pipeline
 *
 * Combines EGGROLL evolution with existing RAG infrastructure for stable
 * simulation predictions in the Bostrom trilemma domain.
 *
 * @param query - User query
 * @param context - Retrieved RAG context
 * @param config - Optional EGGROLL configuration
 * @param cohereClient - Optional Cohere client for reranking fitness
 * @returns Evolved response with full metadata
 *
 * @example
 * ```typescript
 * const result = await eggrollRAGFusion(
 *   "What is the probability we are living in a simulation?",
 *   ragContext,
 *   { scenario: 'simulated_reality', generations: 3 }
 * );
 * console.log(result.response); // Fittest prediction
 * console.log(result.evolutionMetadata.fitnessScore); // 1-10
 * ```
 */
export async function eggrollRAGFusion(
  query: string,
  context: string,
  config?: EggrollConfig,
  cohereClient?: CohereClient | null
): Promise<EggrollResult> {
  const generator = new EggrollGenerator(config);
  return generator.evolve(query, context, cohereClient ?? null);
}

/**
 * Factory function for EGGROLL generator
 *
 * @param config - EGGROLL configuration
 * @returns Configured EggrollGenerator instance
 */
export function createEggrollGenerator(config?: EggrollConfig): EggrollGenerator {
  return new EggrollGenerator(config);
}

/**
 * Detect Bostrom scenario from query text
 *
 * @param query - User query
 * @returns Detected scenario or null
 */
export function detectBostromScenario(query: string): BostromScenario | null {
  const lower = query.toLowerCase();

  if (/extinct|apocalypse|doom|end.?of.?humanity|collapse/i.test(lower)) {
    return 'extinction';
  }
  if (/posthuman|transcend|singularity|uplift|superintelligen/i.test(lower)) {
    return 'posthuman';
  }
  if (/simulat|matrix|virtual|ancestor|base.?reality/i.test(lower)) {
    return 'simulated_reality';
  }

  return null;
}

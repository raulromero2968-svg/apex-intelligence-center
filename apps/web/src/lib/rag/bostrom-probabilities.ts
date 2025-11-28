/**
 * Bostrom Trilemma Probabilities for RAG Pipeline
 *
 * Implements Bayesian/Monte Carlo simulation for Bostrom's simulation argument:
 * - P(e): Probability of extinction before posthuman stage
 * - P(a): Probability posthumans avoid ancestor simulations
 * - P(s): Probability we're in a simulation ≈ 1 - P(e) - P(a)
 *
 * Integrates with KB-02 RAG architecture for TCG simulation markets.
 * FHI alignment: Adds corrigibility checks to prevent harmful simulation outcomes.
 *
 * Trade-offs:
 * - GOOD: Probabilistic models add predictive accuracy to TCG simulations
 * - BAD: Over-reliance on assumptions risks ethical misalignment
 * - MITIGATED: FHI corrigibility checks cap overconfident predictions
 */

import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';

// ============================================================================
// TYPES
// ============================================================================

export interface BostromProbabilities {
  /** Probability of extinction before posthuman stage */
  extinction: number;
  /** Probability posthumans avoid running ancestor simulations */
  avoidance: number;
  /** Probability we are in a simulation */
  simulation: number;
  /** Confidence interval for simulation probability */
  confidenceInterval: { lower: number; upper: number };
  /** Whether FHI corrigibility cap was applied */
  corrigibilityCapped: boolean;
  /** Reasoning behind the probabilities */
  reasoning: string;
}

export interface BostromFusionParams {
  query: string;
  context: string;
  llm: BaseChatModel;
  /** Prior probabilities (default: uninformative uniform) */
  priors?: { extinction: number; avoidance: number };
  /** Number of Monte Carlo samples for confidence intervals */
  monteCarloSamples?: number;
}

export interface TCGSimulationOutcome {
  /** Outcome category based on Bostrom trilemma */
  category: 'extinction' | 'stable' | 'simulation';
  /** Probability of this outcome */
  probability: number;
  /** Description of the outcome */
  description: string;
  /** Market implications */
  marketImplication: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Default uninformative priors (uniform distribution) */
const DEFAULT_PRIORS = {
  extinction: 0.33,
  avoidance: 0.33,
};

/** FHI corrigibility cap: prevent overconfident simulation predictions */
const CORRIGIBILITY_CAP = 0.9;

/** Minimum probability floor to prevent degeneracy */
const PROBABILITY_FLOOR = 0.01;

/** Default Monte Carlo samples for confidence intervals */
const DEFAULT_MONTE_CARLO_SAMPLES = 1000;

// ============================================================================
// PROMPT TEMPLATES
// ============================================================================

const BOSTROM_PROBABILITY_TEMPLATE = `You are an expert in Nick Bostrom's simulation argument and probabilistic reasoning.

CONTEXT: Bostrom's Trilemma (2003)
One of three propositions must be true:
1. EXTINCTION (P_e): Civilizations almost always go extinct before posthuman stage
2. AVOIDANCE (P_a): Posthuman civilizations avoid running ancestor simulations
3. SIMULATION (P_s): We are almost certainly in a simulation (P_s ≈ 1 - P_e - P_a)

TASK: Analyze the following context and query to estimate trilemma probabilities.

CONTEXT FROM SOURCES:
{context}

QUERY:
{query}

ANALYSIS GUIDELINES:
- Ground estimates in provided sources with [source:n] citations where available
- Consider technological trends, existential risks, and simulation motivations
- Apply Bayesian reasoning: update priors based on evidence strength
- Distinguish correlation from causation in simulation evidence
- Flag speculative claims with uncertainty markers

RESPONSE FORMAT (provide exact numbers):
- Extinction probability (0-1): [number]
- Avoidance probability (0-1): [number]
- Reasoning: [2-3 sentences explaining the estimate]

Important: Probabilities should sum to approximately 1.0 (allowing for rounding).`;

const bostromPrompt = ChatPromptTemplate.fromMessages([
  ['system', BOSTROM_PROBABILITY_TEMPLATE],
  ['human', 'Calculate probabilities for: {query}'],
]);

// ============================================================================
// PROBABILITY PARSING
// ============================================================================

/**
 * Parse probabilities from LLM response
 */
function parseProbabilities(
  response: string,
  priors: { extinction: number; avoidance: number }
): { extinction: number; avoidance: number; reasoning: string } {
  // Extract probabilities using regex patterns
  const extinctionMatch = response.match(/[Ee]xtinction.*?(\d+\.?\d*)/);
  const avoidanceMatch = response.match(/[Aa]voidance.*?(\d+\.?\d*)/);
  const reasoningMatch = response.match(/[Rr]easoning[:\s]+(.+?)(?:\n|$)/s);

  let extinction = extinctionMatch
    ? parseFloat(extinctionMatch[1])
    : priors.extinction;
  let avoidance = avoidanceMatch
    ? parseFloat(avoidanceMatch[1])
    : priors.avoidance;

  // Normalize if values appear to be percentages
  if (extinction > 1) extinction /= 100;
  if (avoidance > 1) avoidance /= 100;

  // Clamp to valid probability range
  extinction = Math.max(PROBABILITY_FLOOR, Math.min(1 - PROBABILITY_FLOOR * 2, extinction));
  avoidance = Math.max(PROBABILITY_FLOOR, Math.min(1 - extinction - PROBABILITY_FLOOR, avoidance));

  const reasoning = reasoningMatch
    ? reasoningMatch[1].trim().slice(0, 500)
    : 'Probabilities estimated from context analysis.';

  return { extinction, avoidance, reasoning };
}

// ============================================================================
// MONTE CARLO SIMULATION
// ============================================================================

/**
 * Run Monte Carlo simulation for confidence intervals
 *
 * Uses Beta distribution sampling around point estimates
 */
function monteCarloConfidenceInterval(
  pointEstimate: number,
  samples: number = DEFAULT_MONTE_CARLO_SAMPLES
): { lower: number; upper: number } {
  // Simple bootstrap-style simulation
  // Uses normal approximation with clipping for probability bounds
  const sampleValues: number[] = [];
  const stdDev = 0.1; // Uncertainty parameter

  for (let i = 0; i < samples; i++) {
    // Box-Muller transform for normal sampling
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

    // Sample around point estimate with clipping
    const sample = Math.max(0, Math.min(1, pointEstimate + z * stdDev));
    sampleValues.push(sample);
  }

  // Sort and extract 95% confidence interval
  sampleValues.sort((a, b) => a - b);
  const lowerIdx = Math.floor(samples * 0.025);
  const upperIdx = Math.floor(samples * 0.975);

  return {
    lower: sampleValues[lowerIdx],
    upper: sampleValues[upperIdx],
  };
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Calculate Bostrom trilemma probabilities using RAG context
 *
 * Implements Bayesian reasoning with Monte Carlo confidence intervals.
 * Applies FHI corrigibility checks to prevent overconfident predictions.
 *
 * @param params - Fusion parameters including query, context, and LLM
 * @returns Bostrom probabilities with confidence intervals
 *
 * @example
 * ```typescript
 * const probs = await bostromProbFusion({
 *   query: "What's the probability we're in a simulation?",
 *   context: "[source:1] Recent AI advances...",
 *   llm: new ChatAnthropic({ modelName: 'claude-3-5-sonnet-20241022' }),
 * });
 * console.log(probs.simulation); // 0.66
 * ```
 */
export async function bostromProbFusion(
  params: BostromFusionParams
): Promise<BostromProbabilities> {
  const {
    query,
    context,
    llm,
    priors = DEFAULT_PRIORS,
    monteCarloSamples = DEFAULT_MONTE_CARLO_SAMPLES,
  } = params;

  try {
    // Build and execute chain
    const chain = bostromPrompt.pipe(llm).pipe(new StringOutputParser());
    const response = await chain.invoke({ context, query });

    // Parse probabilities from response
    const { extinction, avoidance, reasoning } = parseProbabilities(response, priors);

    // Calculate simulation probability
    let simulation = Math.max(PROBABILITY_FLOOR, 1 - extinction - avoidance);

    // FHI corrigibility check: cap overconfident simulation predictions
    let corrigibilityCapped = false;
    if (simulation > CORRIGIBILITY_CAP) {
      simulation = CORRIGIBILITY_CAP;
      corrigibilityCapped = true;
    }

    // Monte Carlo confidence intervals
    const confidenceInterval = monteCarloConfidenceInterval(simulation, monteCarloSamples);

    // Apply corrigibility cap to confidence interval upper bound
    if (confidenceInterval.upper > CORRIGIBILITY_CAP) {
      confidenceInterval.upper = CORRIGIBILITY_CAP;
    }

    return {
      extinction,
      avoidance,
      simulation,
      confidenceInterval,
      corrigibilityCapped,
      reasoning: corrigibilityCapped
        ? `${reasoning} [FHI corrigibility: simulation probability capped at ${CORRIGIBILITY_CAP * 100}% to prevent overconfidence]`
        : reasoning,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Bostrom probability fusion failed: ${errorMessage}`);
  }
}

// ============================================================================
// TCG SIMULATION MARKET INTEGRATION
// ============================================================================

/**
 * Map Bostrom probabilities to TCG simulation market outcomes
 *
 * Translates philosophical probabilities into market prediction categories:
 * - Extinction: Market collapse (>20% loss)
 * - Stable: Normal growth conditions
 * - Simulation: Outlier events (>50% gains, "black swans")
 *
 * @param probs - Bostrom probabilities
 * @returns Array of TCG simulation outcomes with market implications
 */
export function mapToTCGOutcomes(probs: BostromProbabilities): TCGSimulationOutcome[] {
  return [
    {
      category: 'extinction',
      probability: probs.extinction,
      description: 'Market collapse scenario - civilization-level disruption',
      marketImplication: 'Expect >20% loss, hedge with stable assets',
    },
    {
      category: 'stable',
      probability: probs.avoidance,
      description: 'Stable growth conditions - normal market dynamics',
      marketImplication: 'Standard valuation models apply, focus on fundamentals',
    },
    {
      category: 'simulation',
      probability: probs.simulation,
      description: 'Outlier event scenario - unprecedented market behavior',
      marketImplication: 'Potential >50% gains, watch for black swan indicators',
    },
  ];
}

/**
 * Calculate expected value for TCG market position
 *
 * Uses Bostrom probabilities to weight outcomes for investment decisions.
 *
 * @param probs - Bostrom probabilities
 * @param payoffs - Expected payoffs for each outcome (extinction, stable, simulation)
 * @returns Expected value of the position
 */
export function calculateExpectedValue(
  probs: BostromProbabilities,
  payoffs: { extinction: number; stable: number; simulation: number }
): number {
  return (
    probs.extinction * payoffs.extinction +
    probs.avoidance * payoffs.stable +
    probs.simulation * payoffs.simulation
  );
}

// ============================================================================
// BAYESIAN UPDATE
// ============================================================================

/**
 * Update Bostrom priors with new evidence
 *
 * Implements Bayesian update for iterative probability refinement.
 *
 * @param priors - Current probability estimates
 * @param evidence - Evidence strength (0-1) for each hypothesis
 * @param likelihoodRatios - How likely evidence is under each hypothesis
 * @returns Updated probabilities
 */
export function bayesianUpdate(
  priors: BostromProbabilities,
  likelihoodRatios: { extinction: number; avoidance: number; simulation: number }
): BostromProbabilities {
  // Bayes' theorem: P(H|E) = P(E|H) * P(H) / P(E)
  const unnormalized = {
    extinction: priors.extinction * likelihoodRatios.extinction,
    avoidance: priors.avoidance * likelihoodRatios.avoidance,
    simulation: priors.simulation * likelihoodRatios.simulation,
  };

  const normalizingConstant =
    unnormalized.extinction + unnormalized.avoidance + unnormalized.simulation;

  let simulation = unnormalized.simulation / normalizingConstant;
  let corrigibilityCapped = priors.corrigibilityCapped;

  // Apply corrigibility cap
  if (simulation > CORRIGIBILITY_CAP) {
    simulation = CORRIGIBILITY_CAP;
    corrigibilityCapped = true;
  }

  return {
    extinction: unnormalized.extinction / normalizingConstant,
    avoidance: unnormalized.avoidance / normalizingConstant,
    simulation,
    confidenceInterval: monteCarloConfidenceInterval(simulation),
    corrigibilityCapped,
    reasoning: `Bayesian update applied. ${corrigibilityCapped ? '[FHI corrigibility cap active]' : ''}`,
  };
}

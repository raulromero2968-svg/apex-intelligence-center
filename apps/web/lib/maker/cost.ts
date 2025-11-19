/**
 * MAKER Framework Cost Estimation
 *
 * Formulas adapted from the Cognizant AI Lab paper for calculating
 * optimal k (voting threshold) and estimating total execution costs.
 */

/**
 * Cost estimation parameters
 */
export interface CostParams {
  /**
   * Target task success rate (default: 0.999 = 99.9%)
   */
  targetSuccessRate?: number;

  /**
   * Steps per agent in sequence (default: 1 for MAD = Micro-Agent Decomposition)
   */
  stepsPerAgent?: number;

  /**
   * Total number of steps in the task
   */
  totalSteps: number;

  /**
   * Per-step success rate (0-1)
   * For database queries, this is typically 0.99-0.9999
   */
  perStepSuccessRate: number;

  /**
   * Cost per step execution (USD or arbitrary units)
   * For DB queries: ~$0.0001 per query on most platforms
   */
  costPerStep: number;

  /**
   * Valid response rate (default: 0.95)
   * Percentage of executions that return non-red-flagged results
   */
  validResponseRate?: number;
}

/**
 * Cost estimation result
 */
export interface CostEstimate {
  /**
   * Minimum k value to achieve target success rate
   */
  kMin: number;

  /**
   * Expected total votes across all steps
   */
  expectedTotalVotes: number;

  /**
   * Estimated total cost (same units as costPerStep)
   */
  estimatedCostUsd: number;

  /**
   * Expected votes per step
   */
  expectedVotesPerStep: number;

  /**
   * Estimated success rate with this k
   */
  estimatedSuccessRate: number;
}

/**
 * Calculate optimal k_min and estimate MAKER execution costs
 *
 * Based on formulas from the paper:
 * - k_min = ceil(log(t^(-m/s) - 1) / log((1-p)/p))
 * - Expected votes per step = k / (2p - 1)
 *
 * @param params - Cost estimation parameters
 * @returns Cost estimate with k_min and expected costs
 *
 * @example
 * ```ts
 * const estimate = estimateMAKERCost({
 *   totalSteps: 300,
 *   perStepSuccessRate: 0.999,
 *   costPerStep: 0.0001, // $0.0001 per DB query
 * });
 * // => { kMin: 2, expectedTotalVotes: 900, estimatedCostUsd: 0.09 }
 * ```
 */
export function estimateMAKERCost(params: CostParams): CostEstimate {
  const t = params.targetSuccessRate ?? 0.999;
  const m = params.stepsPerAgent ?? 1;
  const s = params.totalSteps;
  const p = params.perStepSuccessRate;
  const c = params.costPerStep;
  const v = params.validResponseRate ?? 0.95;

  // Formula from the paper: k_min = ceil(log(t^(-m/s) - 1) / log((1-p)/p))
  const numerator = Math.log(Math.pow(t, -m / s) - 1);
  const denominator = Math.log((1 - p) / p);
  const kMin = Math.max(1, Math.ceil(numerator / denominator));

  // Expected votes per step = k / (2p - 1)
  const expectedVotesPerStep = kMin / (2 * p - 1);

  // Total expected votes
  const expectedTotalVotes = expectedVotesPerStep * s;

  // Adjust for invalid responses
  const actualVotes = expectedTotalVotes / v;

  // Estimated success rate with this k
  const estimatedSuccessRate = Math.pow(
    1 - Math.pow((1 - p) / p, kMin),
    s / m
  );

  return {
    kMin,
    expectedVotesPerStep,
    expectedTotalVotes,
    estimatedCostUsd: actualVotes * c,
    estimatedSuccessRate,
  };
}

/**
 * Calculate per-step success rate required to achieve target with given k
 *
 * Useful for reverse engineering: "If I use k=3, what per-step success rate
 * do I need to achieve 99.9% overall success?"
 *
 * @param k - Voting threshold
 * @param targetSuccessRate - Target overall success rate
 * @param totalSteps - Number of steps
 * @returns Required per-step success rate
 */
export function calculateRequiredStepSuccessRate(
  k: number,
  targetSuccessRate: number,
  totalSteps: number
): number {
  // Solving for p in: t = (1 - ((1-p)/p)^k)^s
  // This is an approximation using binary search
  let low = 0.5;
  let high = 1.0;
  let iterations = 0;

  while (high - low > 0.0001 && iterations < 100) {
    const mid = (low + high) / 2;
    const successRate = Math.pow(1 - Math.pow((1 - mid) / mid, k), totalSteps);

    if (successRate < targetSuccessRate) {
      low = mid;
    } else {
      high = mid;
    }

    iterations++;
  }

  return (low + high) / 2;
}

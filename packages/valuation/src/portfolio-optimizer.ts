/**
 * Portfolio Optimization - Markowitz Efficient Frontier
 *
 * Implements mean-variance optimization for TCG card portfolios
 * Finds optimal allocation weights to maximize Sharpe ratio
 */

export interface PortfolioOptimization {
  weights: Record<string, number>; // cardId -> weight (0-1)
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
}

/**
 * Calculate covariance between two return series
 */
function covariance(returns1: number[], returns2: number[]): number {
  const n = Math.min(returns1.length, returns2.length);
  const mean1 = returns1.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
  const mean2 = returns2.slice(0, n).reduce((sum, val) => sum + val, 0) / n;

  let cov = 0;
  for (let i = 0; i < n; i++) {
    cov += (returns1[i] - mean1) * (returns2[i] - mean2);
  }

  return cov / (n - 1);
}

/**
 * Build covariance matrix from return series
 */
function buildCovarianceMatrix(returnsSeries: number[][]): number[][] {
  const n = returnsSeries.length;
  const matrix: number[][] = Array(n)
    .fill(0)
    .map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      matrix[i][j] = covariance(returnsSeries[i], returnsSeries[j]);
    }
  }

  return matrix;
}

/**
 * Calculate portfolio variance given weights and covariance matrix
 */
function portfolioVariance(weights: number[], covMatrix: number[][]): number {
  let variance = 0;
  const n = weights.length;

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      variance += weights[i] * weights[j] * covMatrix[i][j];
    }
  }

  return variance;
}

/**
 * Calculate portfolio expected return given weights and expected returns
 */
function portfolioReturn(weights: number[], expectedReturns: number[]): number {
  return weights.reduce((sum, weight, i) => sum + weight * expectedReturns[i], 0);
}

/**
 * Optimize portfolio using simplified mean-variance optimization
 *
 * This is a simplified version - production would use quadratic programming
 * (e.g., CVXPY in Python or quadprog in R)
 *
 * @param cardIds - Array of card IDs in portfolio
 * @param returnsSeries - Historical daily returns for each card
 * @param expectedReturns - Expected annual returns for each card
 * @param riskFreeRate - Risk-free rate (default: 4.5%)
 * @returns Optimal weights and metrics
 */
export function optimizePortfolio(
  cardIds: string[],
  returnsSeries: number[][],
  expectedReturns: number[],
  riskFreeRate: number = 4.5
): PortfolioOptimization {
  const n = cardIds.length;

  if (n === 0) {
    throw new Error('Portfolio must contain at least one card');
  }

  if (n === 1) {
    // Single asset - no optimization needed
    return {
      weights: { [cardIds[0]]: 1.0 },
      expectedReturn: expectedReturns[0],
      volatility: Math.sqrt(returnsSeries[0].reduce((sum, r) => sum + r * r, 0) / returnsSeries[0].length) * Math.sqrt(365) * 100,
      sharpeRatio: (expectedReturns[0] - riskFreeRate) / 1.0,
    };
  }

  // Build covariance matrix
  const covMatrix = buildCovarianceMatrix(returnsSeries);

  // Simple grid search for optimal weights
  // In production, use quadratic programming solver
  let bestSharpe = -Infinity;
  let bestWeights: number[] = [];

  const numTrials = 10000;

  for (let trial = 0; trial < numTrials; trial++) {
    // Generate random weights that sum to 1
    const randomWeights = Array(n)
      .fill(0)
      .map(() => Math.random());
    const sum = randomWeights.reduce((a, b) => a + b, 0);
    const weights = randomWeights.map(w => w / sum);

    // Calculate metrics
    const expectedRet = portfolioReturn(weights, expectedReturns);
    const variance = portfolioVariance(weights, covMatrix);
    const volatility = Math.sqrt(variance) * Math.sqrt(365) * 100;
    const sharpe = (expectedRet - riskFreeRate) / volatility;

    if (sharpe > bestSharpe) {
      bestSharpe = sharpe;
      bestWeights = weights;
    }
  }

  // Convert to result format
  const weightsMap: Record<string, number> = {};
  cardIds.forEach((id, i) => {
    weightsMap[id] = bestWeights[i];
  });

  const finalReturn = portfolioReturn(bestWeights, expectedReturns);
  const finalVariance = portfolioVariance(bestWeights, covMatrix);
  const finalVolatility = Math.sqrt(finalVariance) * Math.sqrt(365) * 100;

  return {
    weights: weightsMap,
    expectedReturn: finalReturn,
    volatility: finalVolatility,
    sharpeRatio: bestSharpe,
  };
}

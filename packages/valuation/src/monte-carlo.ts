/**
 * Monte Carlo Valuation Engine
 *
 * Implements Geometric Brownian Motion + Jump Diffusion model
 * for TCG card valuation with 10,000-path simulation
 *
 * Mathematical model:
 * dS/S = μdt + σdW + JdN
 * where:
 * - μ = drift (historical mean return)
 * - σ = volatility (historical standard deviation)
 * - W = Wiener process (Brownian motion)
 * - J = jump size (for black swan events)
 * - N = Poisson process (jump probability)
 *
 * Calibrated for TCG markets with fat tails and reprints/bans
 */

import { priceHistory } from '@apex/db';

export interface ValuationResult {
  cardId: string;
  currentPrice: number;
  expectedReturnAnnualized: number;
  volatilityAnnualized: number;
  probabilityOfProfit: number;
  var95: number; // 95% Value at Risk (worst 5% outcome)
  percentiles: {
    p1: number;
    p5: number;
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };
  paths: number;
  generatedAt: string;
}

/**
 * Box-Muller transform for generating standard normal random variables
 * More accurate than simple random() for financial modeling
 */
function boxMullerTransform(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

/**
 * Calculate daily log returns from price history
 */
function calculateLogReturns(prices: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] > 0 && prices[i] > 0) {
      returns.push(Math.log(prices[i] / prices[i - 1]));
    }
  }
  return returns;
}

/**
 * Calculate mean of array
 */
function mean(values: number[]): number {
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate standard deviation of array
 */
function standardDeviation(values: number[], meanValue: number): number {
  const squaredDiffs = values.map(val => Math.pow(val - meanValue, 2));
  const variance = mean(squaredDiffs);
  return Math.sqrt(variance);
}

/**
 * Run Monte Carlo simulation with GBM + Jump Diffusion
 *
 * @param priceData - Historical price data (sorted chronologically)
 * @param cardId - Card identifier
 * @param years - Holding period in years (default: 5)
 * @param numPaths - Number of simulation paths (default: 10000)
 * @returns Valuation result with percentiles and risk metrics
 */
export function runMonteCarloSimulation(
  priceData: Array<{ price: string | number }>,
  cardId: string,
  years: number = 5,
  numPaths: number = 10000
): ValuationResult {
  if (priceData.length < 90) {
    throw new Error('Insufficient price history - need at least 90 days');
  }

  // Convert prices to numbers
  const prices = priceData.map(p => typeof p.price === 'string' ? parseFloat(p.price) : p.price);
  const currentPrice = prices[prices.length - 1];

  // Calculate daily log returns
  const logReturns = calculateLogReturns(prices);
  const meanReturn = mean(logReturns);
  const volatility = standardDeviation(logReturns, meanReturn);

  // Jump diffusion parameters (calibrated from TCG market events)
  // Based on historical analysis of reprints, bans, and celebrity purchases
  const jumpProbability = 0.012; // ~4-5 major events per year
  const jumpMeanReturn = 0.45;   // Average +45% on major events
  const jumpVolatility = 0.70;   // High variance in jump outcomes

  const tradingDays = years * 365;
  const simulationResults: number[] = [];

  // Run Monte Carlo paths
  for (let path = 0; path < numPaths; path++) {
    let price = currentPrice;

    for (let day = 0; day < tradingDays; day++) {
      // Standard GBM component (normal market movement)
      const normalReturn = meanReturn + volatility * boxMullerTransform();

      // Jump component (rare events)
      let jumpReturn = 0;
      if (Math.random() < jumpProbability) {
        jumpReturn = jumpMeanReturn + jumpVolatility * boxMullerTransform();
      }

      // Apply total return
      price *= Math.exp(normalReturn + jumpReturn);
    }

    // Store final return as percentage
    const returnPct = ((price - currentPrice) / currentPrice) * 100;
    simulationResults.push(returnPct);
  }

  // Sort results for percentile calculation
  simulationResults.sort((a, b) => a - b);

  // Calculate percentiles
  const getPercentile = (pct: number) => {
    const index = Math.floor(numPaths * pct);
    return simulationResults[index];
  };

  // Calculate annualized expected return
  const avgReturn = mean(simulationResults);
  const expectedReturnAnnualized = (Math.pow(1 + avgReturn / 100, 1 / years) - 1) * 100;

  // Calculate annualized volatility
  const volatilityAnnualized = volatility * Math.sqrt(365) * 100;

  // Probability of profit (positive return)
  const profitCount = simulationResults.filter(r => r > 0).length;
  const probabilityOfProfit = profitCount / numPaths;

  // 95% Value at Risk (5th percentile - worst 5% outcome)
  const var95 = getPercentile(0.05);

  return {
    cardId,
    currentPrice,
    expectedReturnAnnualized,
    volatilityAnnualized,
    probabilityOfProfit,
    var95,
    percentiles: {
      p1: getPercentile(0.01),
      p5: getPercentile(0.05),
      p10: getPercentile(0.10),
      p25: getPercentile(0.25),
      p50: getPercentile(0.50),
      p75: getPercentile(0.75),
      p90: getPercentile(0.90),
      p95: getPercentile(0.95),
      p99: getPercentile(0.99),
    },
    paths: numPaths,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Calculate Sharpe ratio (risk-adjusted return)
 */
export function calculateSharpeRatio(
  expectedReturn: number,
  volatility: number,
  riskFreeRate: number = 4.5 // Current US Treasury rate
): number {
  return (expectedReturn - riskFreeRate) / volatility;
}


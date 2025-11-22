/**
 * Monte Carlo Simulator Tests
 */

import { describe, it, expect } from 'vitest';
import { runMonteCarloSimulation, calculateSharpeRatio } from '@apex/valuation';

describe('Monte Carlo Simulation', () => {
  it('should throw error with insufficient data', () => {
    const insufficientData = Array(50).fill({ price: '100' });

    expect(() => {
      runMonteCarloSimulation(insufficientData, 'test-card', 5, 1000);
    }).toThrow('Insufficient price history');
  });

  it('should return valid percentiles', () => {
    // Generate mock price data with trend
    const mockPrices = Array.from({ length: 365 }, (_, i) => ({
      price: (100 + i * 0.1 + Math.random() * 5).toString(),
    }));

    const result = runMonteCarloSimulation(mockPrices, 'test-card', 5, 1000);

    expect(result.percentiles.p1).toBeLessThan(result.percentiles.p50);
    expect(result.percentiles.p50).toBeLessThan(result.percentiles.p99);
    expect(result.percentiles.p5).toEqual(result.var95);
  });

  it('should calculate probability of profit', () => {
    const mockPrices = Array.from({ length: 365 }, (_, i) => ({
      price: (100 + i * 0.05).toString(),
    }));

    const result = runMonteCarloSimulation(mockPrices, 'test-card', 5, 1000);

    expect(result.probabilityOfProfit).toBeGreaterThanOrEqual(0);
    expect(result.probabilityOfProfit).toBeLessThanOrEqual(1);
  });

  it('should include all required fields', () => {
    const mockPrices = Array.from({ length: 365 }, (_, i) => ({
      price: '100',
    }));

    const result = runMonteCarloSimulation(mockPrices, 'test-card', 5, 100);

    expect(result).toHaveProperty('cardId');
    expect(result).toHaveProperty('currentPrice');
    expect(result).toHaveProperty('expectedReturnAnnualized');
    expect(result).toHaveProperty('volatilityAnnualized');
    expect(result).toHaveProperty('probabilityOfProfit');
    expect(result).toHaveProperty('var95');
    expect(result).toHaveProperty('percentiles');
    expect(result).toHaveProperty('generatedAt');
  });
});

describe('Sharpe Ratio Calculation', () => {
  it('should calculate positive Sharpe for good return/volatility', () => {
    const sharpe = calculateSharpeRatio(15, 20, 4.5);
    expect(sharpe).toBeGreaterThan(0);
  });

  it('should calculate negative Sharpe for returns below risk-free rate', () => {
    const sharpe = calculateSharpeRatio(3, 10, 4.5);
    expect(sharpe).toBeLessThan(0);
  });
});

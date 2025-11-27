/**
 * Calculate Arbitrage Micro-Agent
 *
 * Identifies profitable arbitrage opportunities between different price sources.
 * Third and final step in the arbitrage scanning pipeline.
 */

import type { ExtractedPrices, ArbitrageResult, ArbitrageOpportunity } from '../../types';

/**
 * Configuration for arbitrage calculation
 */
const ARBITRAGE_CONFIG = {
  /**
   * Combined fees as percentage of buy price
   * Includes: payment processing, shipping, platform fees, taxes
   */
  FEES_PERCENT: 0.15, // 15%

  /**
   * Minimum profit threshold in USD
   * Opportunities below this are filtered out
   */
  MIN_PROFIT_USD: 5.0,

  /**
   * Minimum profit margin percentage
   * Additional filter for proportional profitability
   */
  MIN_PROFIT_MARGIN_PCT: 10, // 10%
} as const;

/**
 * Calculate arbitrage opportunities for a card
 *
 * Compares all pairs of sources (buy vs sell) and identifies profitable opportunities
 * after accounting for fees and minimum thresholds.
 *
 * @param input - Extracted prices from extract-prices agent
 * @returns Arbitrage opportunities
 */
export function calculateArbitrageAgent(input: ExtractedPrices): ArbitrageResult {
  const opportunities: ArbitrageOpportunity[] = [];
  const sources = Object.keys(input.prices);

  // Compare all pairs of sources
  for (const buySource of sources) {
    for (const sellSource of sources) {
      // Skip same-source comparison
      if (buySource === sellSource) {
        continue;
      }

      const buyPrice = input.prices[buySource];
      const sellPrice = input.prices[sellSource];

      // Calculate fees based on buy price
      const fees = buyPrice * ARBITRAGE_CONFIG.FEES_PERCENT;

      // Calculate net profit
      const profit = sellPrice - buyPrice - fees;

      // Calculate profit margin percentage
      const profitMarginPct = (profit / buyPrice) * 100;

      // Check if opportunity meets thresholds
      if (
        profit >= ARBITRAGE_CONFIG.MIN_PROFIT_USD &&
        profitMarginPct >= ARBITRAGE_CONFIG.MIN_PROFIT_MARGIN_PCT
      ) {
        opportunities.push({
          cardId: input.cardId,
          buySource,
          buyPrice,
          sellSource,
          sellPrice,
          profit: Number(profit.toFixed(2)),
          profitMarginPct: Number(profitMarginPct.toFixed(2)),
          profitable: true,
        });
      }
    }
  }

  // Sort by profit (highest first)
  opportunities.sort((a, b) => b.profit - a.profit);

  return {
    cardId: input.cardId,
    opportunities,
  };
}

/**
 * Update arbitrage configuration (useful for testing or dynamic adjustment)
 */
export function updateArbitrageConfig(
  config: Partial<typeof ARBITRAGE_CONFIG>
): void {
  Object.assign(ARBITRAGE_CONFIG, config);
}

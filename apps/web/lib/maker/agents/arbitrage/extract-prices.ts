/**
 * Extract Prices Micro-Agent
 *
 * Normalizes and extracts the latest market prices per source from card price data.
 * Second step in the arbitrage scanning pipeline.
 */

import type { CardWithPrices, ExtractedPrices } from '../../types';

/**
 * Extract latest market prices per source
 *
 * Takes the most recent price entry per source and extracts the market price.
 * Filters out invalid prices (NaN, null, <= 0).
 *
 * @param input - Card with prices from fetch-card agent
 * @returns Normalized prices by source
 */
export function extractPricesAgent(input: CardWithPrices): ExtractedPrices {
  const pricesBySource: Record<string, number> = {};

  // Group by source and take the latest (prices are already sorted by date desc)
  const sourceMap = new Map<string, number>();

  for (const priceEntry of input.prices) {
    // Skip if we already have a price for this source (it's older)
    if (sourceMap.has(priceEntry.source)) {
      continue;
    }

    // Extract market price
    const marketPrice = Number(priceEntry.market);

    // Validate price
    if (!isNaN(marketPrice) && marketPrice > 0) {
      sourceMap.set(priceEntry.source, marketPrice);
    }
  }

  // Convert to plain object
  sourceMap.forEach((price, source) => {
    pricesBySource[source] = price;
  });

  return {
    cardId: input.cardId,
    prices: pricesBySource,
  };
}


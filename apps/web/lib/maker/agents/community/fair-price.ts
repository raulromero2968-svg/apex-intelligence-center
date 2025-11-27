/**
 * Fair Price Agent
 *
 * Analyzes market prices to detect scalping and recommend fair pricing.
 * Uses market data to calculate fair price ranges and flag overpriced listings.
 *
 * @see knowledge-02-ai-rag-architecture-v2
 */

import { db } from '@/db';
import { prices, cards } from '@/db/schema';
import { vendorInventories, scalpingReports } from '@/db/schema/tcg-community';
import { eq, desc, avg, sql, and, gte } from 'drizzle-orm';

export interface FairPriceConfig {
  /** Maximum acceptable markup percentage (default: 30%) */
  maxMarkupPercent: number;
  /** Minimum price data points required for analysis */
  minDataPoints: number;
  /** Days of price history to consider */
  lookbackDays: number;
  /** Weight for recent prices (0-1) */
  recentPriceWeight: number;
}

export interface FairPriceResult {
  cardId: string;
  cardName: string;
  marketPrice: number;
  fairPriceRange: {
    low: number;
    high: number;
  };
  recentTrend: 'rising' | 'falling' | 'stable';
  confidence: number;
  recommendation: string;
}

export interface ScalpingDetection {
  inventoryItemId: string;
  vendorId: string;
  listedPrice: number;
  marketPrice: number;
  markupPercent: number;
  isScalping: boolean;
  severity: 'none' | 'mild' | 'moderate' | 'severe';
  reason: string;
}

const DEFAULT_CONFIG: FairPriceConfig = {
  maxMarkupPercent: 30,
  minDataPoints: 5,
  lookbackDays: 30,
  recentPriceWeight: 0.7,
};

let config = { ...DEFAULT_CONFIG };

/**
 * Update fair price agent configuration
 */
export function updateFairPriceConfig(newConfig: Partial<FairPriceConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * Calculate fair price range for a card
 *
 * @param cardId - Card ID to analyze
 * @returns Fair price analysis results
 */
export async function fairPriceAgent(cardId: string): Promise<FairPriceResult> {
  // Get card details
  const card = await db.query.cards.findFirst({
    where: eq(cards.id, cardId),
  });

  if (!card) {
    throw new Error(`Card not found: ${cardId}`);
  }

  // Get price history
  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - config.lookbackDays);

  const priceHistory = await db.query.prices.findMany({
    where: and(
      eq(prices.cardId, cardId),
      gte(prices.date, lookbackDate)
    ),
    orderBy: [desc(prices.date)],
  });

  if (priceHistory.length < config.minDataPoints) {
    // Not enough data, return card's current price with low confidence
    return {
      cardId,
      cardName: card.name,
      marketPrice: priceHistory[0]?.market || 0,
      fairPriceRange: {
        low: (priceHistory[0]?.market || 0) * 0.9,
        high: (priceHistory[0]?.market || 0) * 1.3,
      },
      recentTrend: 'stable',
      confidence: 0.3,
      recommendation: 'Insufficient price data for accurate analysis',
    };
  }

  // Calculate weighted average (more weight on recent prices)
  let totalWeight = 0;
  let weightedSum = 0;

  priceHistory.forEach((price, index) => {
    const weight = config.recentPriceWeight * Math.pow(1 - config.recentPriceWeight, index);
    weightedSum += price.market * weight;
    totalWeight += weight;
  });

  const weightedAverage = weightedSum / totalWeight;

  // Calculate standard deviation for price stability
  const mean = priceHistory.reduce((sum, p) => sum + p.market, 0) / priceHistory.length;
  const variance = priceHistory.reduce((sum, p) => sum + Math.pow(p.market - mean, 2), 0) / priceHistory.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = stdDev / mean;

  // Determine trend
  const recentPrices = priceHistory.slice(0, 5);
  const olderPrices = priceHistory.slice(5, 10);

  let recentTrend: 'rising' | 'falling' | 'stable' = 'stable';
  if (recentPrices.length > 0 && olderPrices.length > 0) {
    const recentAvg = recentPrices.reduce((sum, p) => sum + p.market, 0) / recentPrices.length;
    const olderAvg = olderPrices.reduce((sum, p) => sum + p.market, 0) / olderPrices.length;
    const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (changePercent > 5) recentTrend = 'rising';
    else if (changePercent < -5) recentTrend = 'falling';
  }

  // Calculate fair price range
  const fairPriceRange = {
    low: weightedAverage * 0.95,
    high: weightedAverage * (1 + config.maxMarkupPercent / 100),
  };

  // Calculate confidence based on data quality
  const confidence = Math.min(
    0.95,
    0.5 +
    (priceHistory.length / (config.minDataPoints * 2)) * 0.2 +
    (1 - Math.min(coefficientOfVariation, 1)) * 0.25
  );

  // Generate recommendation
  let recommendation = '';
  if (recentTrend === 'rising') {
    recommendation = `Price is trending up. Fair range: $${fairPriceRange.low.toFixed(2)} - $${fairPriceRange.high.toFixed(2)}. Consider acting soon if within budget.`;
  } else if (recentTrend === 'falling') {
    recommendation = `Price is trending down. Fair range: $${fairPriceRange.low.toFixed(2)} - $${fairPriceRange.high.toFixed(2)}. May be worth waiting for better deals.`;
  } else {
    recommendation = `Price is stable. Fair range: $${fairPriceRange.low.toFixed(2)} - $${fairPriceRange.high.toFixed(2)}. Good time to buy at or below market.`;
  }

  return {
    cardId,
    cardName: card.name,
    marketPrice: weightedAverage,
    fairPriceRange,
    recentTrend,
    confidence,
    recommendation,
  };
}

/**
 * Detect potential scalping in a vendor listing
 *
 * @param inventoryItemId - Vendor inventory item ID to analyze
 * @returns Scalping detection results
 */
export async function detectScalping(inventoryItemId: string): Promise<ScalpingDetection> {
  // Get inventory item
  const item = await db.query.vendorInventories.findFirst({
    where: eq(vendorInventories.id, inventoryItemId),
    with: {
      card: true,
    },
  });

  if (!item) {
    throw new Error(`Inventory item not found: ${inventoryItemId}`);
  }

  const listedPrice = parseFloat(String(item.price));

  // Get fair price analysis
  let marketPrice = listedPrice; // Default if no card reference
  let markupPercent = 0;

  if (item.cardId) {
    try {
      const fairPrice = await fairPriceAgent(item.cardId);
      marketPrice = fairPrice.marketPrice;
      markupPercent = ((listedPrice - marketPrice) / marketPrice) * 100;
    } catch {
      // No price data available
    }
  }

  // Determine scalping severity
  let severity: 'none' | 'mild' | 'moderate' | 'severe' = 'none';
  let isScalping = false;
  let reason = 'Price appears fair';

  if (markupPercent > 100) {
    severity = 'severe';
    isScalping = true;
    reason = `Price is ${markupPercent.toFixed(0)}% above market value - severe overpricing detected`;
  } else if (markupPercent > 50) {
    severity = 'moderate';
    isScalping = true;
    reason = `Price is ${markupPercent.toFixed(0)}% above market value - significant markup`;
  } else if (markupPercent > config.maxMarkupPercent) {
    severity = 'mild';
    isScalping = true;
    reason = `Price is ${markupPercent.toFixed(0)}% above market value - above fair pricing threshold`;
  }

  return {
    inventoryItemId,
    vendorId: item.vendorId,
    listedPrice,
    marketPrice,
    markupPercent,
    isScalping,
    severity,
    reason,
  };
}

/**
 * Batch analyze vendor inventory for fair pricing
 *
 * @param vendorId - Vendor ID to analyze
 * @returns Summary of fair pricing analysis
 */
export async function analyzeVendorFairPricing(vendorId: string): Promise<{
  totalItems: number;
  fairPricedCount: number;
  overPricedCount: number;
  fairPricingScore: number;
  issues: ScalpingDetection[];
}> {
  // Get all listed inventory items
  const items = await db.query.vendorInventories.findMany({
    where: and(
      eq(vendorInventories.vendorId, vendorId),
      eq(vendorInventories.isListed, true)
    ),
  });

  const issues: ScalpingDetection[] = [];
  let fairPricedCount = 0;
  let overPricedCount = 0;

  for (const item of items) {
    const detection = await detectScalping(item.id);
    if (detection.isScalping) {
      overPricedCount++;
      issues.push(detection);
    } else {
      fairPricedCount++;
    }
  }

  const totalItems = items.length;
  const fairPricingScore = totalItems > 0
    ? (fairPricedCount / totalItems) * 100
    : 100;

  return {
    totalItems,
    fairPricedCount,
    overPricedCount,
    fairPricingScore,
    issues,
  };
}

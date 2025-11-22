/**
 * Triangulation Oracle v2 - Apex Price Calculation Engine
 *
 * Multi-source weighted moving average with statistical outlier detection.
 * Prevents manipulation via 3-sigma clamping and trust-weighted consensus.
 *
 * Architecture: 13_LAUNCH_03
 */

import { Redis } from 'ioredis';
import type { EbaySalePoint } from '@/lib/ebay/finding-api';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export interface SaleEvent {
  price: number;
  date: Date;
  source: 'ebay' | 'crowd' | 'pwcc' | 'goldin';
  trustScore: number; // 0.0 - 1.0
  userId?: string;
  verified: boolean;
}

export interface ApexPrice {
  price: number;
  confidence: number; // 0.0 - 1.0
  sampleSize: number;
  lastUpdated: Date;
  priceRange: {
    low: number;
    high: number;
    median: number;
  };
  volatilityFlag: boolean;
}

/**
 * Calculate the Apex Price using weighted moving average with outlier detection
 *
 * Formula:
 * Price_Apex = Σ(Price_i × Trust_i × Recency_i) / Σ(Trust_i × Recency_i)
 *
 * @param sales - Array of sale events from multiple sources
 * @param cardId - Card identifier for caching
 * @returns Calculated Apex Price with metadata
 */
export async function calculateApexPrice(
  sales: SaleEvent[],
  cardId: string
): Promise<ApexPrice> {
  if (sales.length === 0) {
    throw new Error('Cannot calculate price with zero sales');
  }

  // Step 1: Filter outliers using 3-sigma rule
  const filteredSales = filterOutliers(sales);

  if (filteredSales.length === 0) {
    // All sales were outliers - return mean of original sales with warning
    console.warn(`[Oracle] All sales filtered as outliers for card ${cardId}`);
    const meanPrice = sales.reduce((sum, s) => sum + s.price, 0) / sales.length;

    return {
      price: meanPrice,
      confidence: 0.1, // Very low confidence
      sampleSize: sales.length,
      lastUpdated: new Date(),
      priceRange: {
        low: Math.min(...sales.map(s => s.price)),
        high: Math.max(...sales.map(s => s.price)),
        median: calculateMedian(sales.map(s => s.price)),
      },
      volatilityFlag: true,
    };
  }

  // Step 2: Apply trust and recency weights
  const weightedSales = applyWeights(filteredSales);

  // Step 3: Calculate weighted average
  const totalWeight = weightedSales.reduce((sum, s) => sum + s.weight, 0);
  const weightedSum = weightedSales.reduce((sum, s) => sum + s.price * s.weight, 0);
  const apexPrice = weightedSum / totalWeight;

  // Step 4: Calculate confidence based on sample size and trust distribution
  const confidence = calculateConfidence(weightedSales);

  // Step 5: Calculate price range
  const prices = filteredSales.map(s => s.price);
  const priceRange = {
    low: Math.min(...prices),
    high: Math.max(...prices),
    median: calculateMedian(prices),
  };

  // Step 6: Detect volatility (high standard deviation)
  const stdDev = calculateStdDev(prices);
  const volatilityFlag = stdDev / apexPrice > 0.3; // >30% volatility

  const result: ApexPrice = {
    price: Math.round(apexPrice * 100) / 100, // Round to 2 decimals
    confidence,
    sampleSize: filteredSales.length,
    lastUpdated: new Date(),
    priceRange,
    volatilityFlag,
  };

  // Step 7: Cache result in Redis
  await cacheApexPrice(cardId, result);

  return result;
}

/**
 * Filter outliers using 3-sigma rule
 * Removes any sale that is >3 standard deviations from the mean
 */
function filterOutliers(sales: SaleEvent[]): SaleEvent[] {
  if (sales.length < 3) {
    return sales; // Need at least 3 data points for meaningful stats
  }

  const prices = sales.map(s => s.price);
  const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  const stdDev = calculateStdDev(prices);

  const threshold = 3 * stdDev;

  return sales.filter(sale => {
    const deviation = Math.abs(sale.price - mean);
    return deviation <= threshold;
  });
}

/**
 * Apply trust and recency weights to sales
 */
function applyWeights(sales: SaleEvent[]): Array<SaleEvent & { weight: number }> {
  const now = Date.now();

  return sales.map(sale => {
    // Trust multiplier based on source
    let trustMultiplier = sale.trustScore;

    if (sale.source === 'ebay' && sale.verified) {
      trustMultiplier = 1.0; // eBay API verified sales are fully trusted
    } else if (sale.source === 'pwcc' || sale.source === 'goldin') {
      trustMultiplier = 1.0; // Auction houses are fully trusted
    } else if (sale.source === 'crowd') {
      // Crowd submissions use user trust score
      trustMultiplier = Math.max(0.5, sale.trustScore); // Minimum 0.5 trust
    }

    // Recency decay: Sales >30 days old get 0.5x weight
    const ageInDays = (now - sale.date.getTime()) / (1000 * 60 * 60 * 24);
    const recencyMultiplier = ageInDays > 30 ? 0.5 : 1.0;

    // Combined weight
    const weight = trustMultiplier * recencyMultiplier;

    return { ...sale, weight };
  });
}

/**
 * Calculate confidence score based on sample size and trust distribution
 * Higher sample size and higher average trust = higher confidence
 */
function calculateConfidence(weightedSales: Array<SaleEvent & { weight: number }>): number {
  const sampleSize = weightedSales.length;
  const avgTrust = weightedSales.reduce((sum, s) => sum + s.trustScore, 0) / sampleSize;

  // Sample size contribution (logarithmic scale)
  const sampleFactor = Math.min(1.0, Math.log10(sampleSize + 1) / 2);

  // Trust factor (linear)
  const trustFactor = avgTrust;

  // Combined confidence (geometric mean)
  const confidence = Math.sqrt(sampleFactor * trustFactor);

  return Math.round(confidence * 100) / 100; // Round to 2 decimals
}

/**
 * Calculate standard deviation
 */
function calculateStdDev(values: number[]): number {
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Calculate median
 */
function calculateMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    return sorted[mid];
  }
}

/**
 * Cache Apex Price in Redis
 * Key: price:{cardId}
 * TTL: Calculated async via worker queue, so no expiry
 */
async function cacheApexPrice(cardId: string, price: ApexPrice): Promise<void> {
  try {
    const key = `price:${cardId}`;
    await redis.set(key, JSON.stringify(price));
  } catch (error) {
    console.error('[Oracle] Failed to cache price:', error);
  }
}

/**
 * Get cached Apex Price from Redis
 */
export async function getCachedApexPrice(cardId: string): Promise<ApexPrice | null> {
  try {
    const key = `price:${cardId}`;
    const cached = await redis.get(key);

    if (!cached) {
      return null;
    }

    return JSON.parse(cached);
  } catch (error) {
    console.error('[Oracle] Failed to read cached price:', error);
    return null;
  }
}

/**
 * Invalidate cached price (used when manipulation detected)
 */
export async function invalidateApexPrice(cardId: string): Promise<void> {
  try {
    const key = `price:${cardId}`;
    await redis.del(key);
  } catch (error) {
    console.error('[Oracle] Failed to invalidate price:', error);
  }
}

/**
 * Convert eBay sales to SaleEvents for Oracle processing
 */
export function ebayToSaleEvents(ebaySales: EbaySalePoint[]): SaleEvent[] {
  return ebaySales.map(sale => ({
    price: sale.price,
    date: sale.saleDate,
    source: 'ebay' as const,
    trustScore: 1.0, // eBay API verified
    verified: true,
  }));
}

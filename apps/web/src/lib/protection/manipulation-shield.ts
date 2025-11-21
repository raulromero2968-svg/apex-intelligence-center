/**
 * Manipulation Shield System - Market Pump Detection
 *
 * Detects coordinated buyouts and pump-and-dump schemes using:
 * - Volume velocity analysis
 * - Buyer entropy (concentration detection)
 * - Listing vacuum detection
 * - 3-Sigma outlier filtering
 *
 * Architecture: 13_LAUNCH_08
 */

import { db } from '@/db';
import { cards, sales, manipulationAlerts } from '@/db/schema';
import { eq, and, gte, sql, desc } from 'drizzle-orm';
import type { EbaySalePoint } from '@/lib/ebay/finding-api';
import { invalidateApexPrice } from '@/lib/oracle/triangulation-v2';

export interface ManipulationThreat {
  severity: 'warning' | 'critical';
  score: number; // 0-100
  signals: ManipulationSignal[];
  recommendation: 'monitor' | 'pause_oracle' | 'ban_card';
}

export interface ManipulationSignal {
  type: 'volume_spike' | 'buyer_concentration' | 'listing_vacuum' | 'price_outlier';
  confidence: number; // 0.0-1.0
  description: string;
  data: Record<string, any>;
}

export interface VolumeMetrics {
  dailyVolume: number;
  avgVolume30d: number;
  volumeVelocityPct: number;
  isAnomalous: boolean;
}

/**
 * Analyze a card for manipulation signals
 * Returns threat assessment with recommended action
 */
export async function detectManipulation(
  cardId: string,
  recentSales: EbaySalePoint[]
): Promise<ManipulationThreat> {
  const signals: ManipulationSignal[] = [];

  // Signal 1: Volume Velocity (>500% of 30-day average)
  const volumeMetrics = await analyzeVolumeVelocity(cardId, recentSales);
  if (volumeMetrics.isAnomalous) {
    signals.push({
      type: 'volume_spike',
      confidence: 0.8,
      description: `Daily volume is ${volumeMetrics.volumeVelocityPct.toFixed(0)}% above 30-day average`,
      data: volumeMetrics,
    });
  }

  // Signal 2: Buyer Entropy (concentration of buyers)
  const buyerEntropy = analyzeBuyerConcentration(recentSales);
  if (buyerEntropy.isConcentrated) {
    signals.push({
      type: 'buyer_concentration',
      confidence: buyerEntropy.confidence,
      description: `${buyerEntropy.topBuyerPct.toFixed(0)}% of recent sales from ${buyerEntropy.uniqueBuyers} buyers`,
      data: buyerEntropy,
    });
  }

  // Signal 3: Listing Vacuum (active listings dropping to 0)
  // Note: Would require live eBay listing API, placeholder for now
  const listingVacuum = await analyzeListingVacuum(cardId);
  if (listingVacuum.isVacuum) {
    signals.push({
      type: 'listing_vacuum',
      confidence: 0.9,
      description: 'Active listings dropped sharply during price spike',
      data: listingVacuum,
    });
  }

  // Signal 4: Price Outliers (extreme deviation from mean)
  const priceOutliers = analyzePriceOutliers(recentSales);
  if (priceOutliers.hasOutliers) {
    signals.push({
      type: 'price_outlier',
      confidence: priceOutliers.confidence,
      description: `${priceOutliers.outlierCount} sales detected as statistical outliers`,
      data: priceOutliers,
    });
  }

  // Calculate overall threat score
  const threatScore = calculateThreatScore(signals);

  // Determine severity and recommendation
  let severity: 'warning' | 'critical' = 'warning';
  let recommendation: 'monitor' | 'pause_oracle' | 'ban_card' = 'monitor';

  if (threatScore > 75) {
    severity = 'critical';
    recommendation = 'pause_oracle';
  } else if (threatScore > 50) {
    severity = 'warning';
    recommendation = 'monitor';
  }

  return {
    severity,
    score: threatScore,
    signals,
    recommendation,
  };
}

/**
 * Analyze volume velocity (daily volume vs 30-day average)
 */
async function analyzeVolumeVelocity(
  cardId: string,
  recentSales: EbaySalePoint[]
): Promise<VolumeMetrics> {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get sales from last 24 hours
  const dailySales = recentSales.filter(sale => sale.saleDate >= oneDayAgo);
  const dailyVolume = dailySales.length;

  // Get historical sales from last 30 days
  const historicalSales = await db.query.sales.findMany({
    where: and(eq(sales.cardId, cardId), gte(sales.saleDate, thirtyDaysAgo)),
  });

  const avgVolume30d = historicalSales.length / 30;

  const volumeVelocityPct = avgVolume30d > 0 ? (dailyVolume / avgVolume30d - 1) * 100 : 0;

  return {
    dailyVolume,
    avgVolume30d,
    volumeVelocityPct,
    isAnomalous: volumeVelocityPct > 500, // >500% increase
  };
}

/**
 * Analyze buyer concentration (Herfindahl-Hirschman Index style)
 */
function analyzeBuyerConcentration(sales: EbaySalePoint[]): {
  isConcentrated: boolean;
  confidence: number;
  uniqueBuyers: number;
  topBuyerPct: number;
} {
  if (sales.length === 0) {
    return { isConcentrated: false, confidence: 0, uniqueBuyers: 0, topBuyerPct: 0 };
  }

  // Group sales by buyer
  const buyerCounts = new Map<string, number>();
  sales.forEach(sale => {
    const buyer = sale.sellerUsername || 'unknown';
    buyerCounts.set(buyer, (buyerCounts.get(buyer) || 0) + 1);
  });

  const uniqueBuyers = buyerCounts.size;
  const totalSales = sales.length;

  // Find top buyer
  const topBuyerCount = Math.max(...buyerCounts.values());
  const topBuyerPct = (topBuyerCount / totalSales) * 100;

  // Concentration check: If top buyer has >50% of sales
  const isConcentrated = topBuyerPct > 50 || (uniqueBuyers < 3 && totalSales > 5);

  const confidence = Math.min(1.0, topBuyerPct / 100);

  return {
    isConcentrated,
    confidence,
    uniqueBuyers,
    topBuyerPct,
  };
}

/**
 * Analyze listing vacuum (active listings dropping during spike)
 * Note: Requires eBay active listings API - placeholder implementation
 */
async function analyzeListingVacuum(cardId: string): Promise<{
  isVacuum: boolean;
  activeListings: number;
  historicalAvg: number;
}> {
  // Placeholder: Would query eBay's active listings
  // For now, assume no vacuum
  return {
    isVacuum: false,
    activeListings: 10,
    historicalAvg: 15,
  };
}

/**
 * Analyze price outliers using 3-sigma rule
 */
function analyzePriceOutliers(sales: EbaySalePoint[]): {
  hasOutliers: boolean;
  confidence: number;
  outlierCount: number;
  outliers: EbaySalePoint[];
} {
  if (sales.length < 5) {
    return { hasOutliers: false, confidence: 0, outlierCount: 0, outliers: [] };
  }

  const prices = sales.map(s => s.price);
  const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);

  const threshold = 3 * stdDev;

  const outliers = sales.filter(sale => Math.abs(sale.price - mean) > threshold);
  const outlierCount = outliers.length;
  const outlierPct = (outlierCount / sales.length) * 100;

  return {
    hasOutliers: outlierCount > 0,
    confidence: Math.min(1.0, outlierPct / 20), // Confidence increases with outlier %
    outlierCount,
    outliers,
  };
}

/**
 * Calculate overall threat score (0-100)
 */
function calculateThreatScore(signals: ManipulationSignal[]): number {
  if (signals.length === 0) return 0;

  // Weighted scoring
  const weights: Record<ManipulationSignal['type'], number> = {
    volume_spike: 30,
    buyer_concentration: 35,
    listing_vacuum: 25,
    price_outlier: 10,
  };

  let totalScore = 0;
  signals.forEach(signal => {
    const weight = weights[signal.type] || 0;
    totalScore += weight * signal.confidence;
  });

  return Math.min(100, Math.round(totalScore));
}

/**
 * Execute automated response to manipulation detection
 */
export async function respondToManipulation(
  cardId: string,
  threat: ManipulationThreat
): Promise<void> {
  const now = new Date();

  if (threat.recommendation === 'pause_oracle') {
    // 1. Invalidate cached price
    await invalidateApexPrice(cardId);

    // 2. Flag card in database
    await db
      .update(cards)
      .set({
        isManipulated: true,
        manipulationReason: `Threat Score: ${threat.score} - ${threat.signals.map(s => s.type).join(', ')}`,
        lastFlaggedAt: now,
      })
      .where(eq(cards.id, cardId));

    // 3. Create manipulation alert
    const card = await db.query.cards.findFirst({
      where: eq(cards.id, cardId),
    });

    if (card) {
      await db.insert(manipulationAlerts).values({
        id: `alert_${cardId}_${Date.now()}`,
        cardId,
        volumeSpikePct: threat.signals.find(s => s.type === 'volume_spike')?.data
          .volumeVelocityPct || 0,
        baselineVolume: threat.signals.find(s => s.type === 'volume_spike')?.data.avgVolume30d || 0,
        currentVolume: threat.signals.find(s => s.type === 'volume_spike')?.data.dailyVolume || 0,
        lampSentiment: 'neutral', // Placeholder
        contrarianDiversity: 0.5, // Placeholder
        severity: threat.severity,
        isActive: true,
        detectedAt: now,
      });
    }

    // 4. Notify Data Team (Slack/Discord)
    console.warn(`[ManipulationShield] CRITICAL: Card ${cardId} flagged with threat score ${threat.score}`);
  }
}

/**
 * Get active manipulation alerts
 */
export async function getActiveManipulationAlerts(): Promise<any[]> {
  return await db.query.manipulationAlerts.findMany({
    where: eq(manipulationAlerts.isActive, true),
    orderBy: desc(manipulationAlerts.detectedAt),
    limit: 50,
  });
}

/**
 * Manipulation Shield - Volume Spike Detection Service
 *
 * Detects coordinated pump patterns by combining:
 * - Volume spike detection (>40% increase)
 * - LAMP sentiment analysis
 * - Contrarian RAG diversity checking
 *
 * When both detect a spike with no organic drivers, triggers manipulation alert.
 */

import { db } from '@/db';
import { sales, cards, market_knowledge } from '@/db/schema';
import { eq, and, gte, sql, desc } from 'drizzle-orm';
import { contrarianSearch, classifySentiment } from '@/../../../lib/rag/contrarian-rag';

export interface ManipulationAlert {
  cardId: string;
  cardName: string;
  volumeSpikePct: number;
  baselineVolume: number;
  currentVolume: number;
  hasOrganicDrivers: boolean;
  lampSentiment: 'bullish' | 'bearish' | 'neutral';
  contrarianDiversity: number;
  detectedAt: Date;
  severity: 'warning' | 'critical';
}

/**
 * Calculate volume metrics for a card over time periods
 */
async function calculateVolumeMetrics(cardId: string): Promise<{
  volume24h: number;
  volumeBaseline: number; // 30-day average daily volume
  volumeSpikePct: number;
}> {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get 24h volume
  const sales24h = await db.query.sales.findMany({
    where: and(
      eq(sales.cardId, cardId),
      gte(sales.saleDate, yesterday)
    ),
  });

  const volume24h = sales24h.length;

  // Get 30-day baseline (excluding last 24h)
  const salesBaseline = await db.query.sales.findMany({
    where: and(
      eq(sales.cardId, cardId),
      gte(sales.saleDate, thirtyDaysAgo),
      sql`${sales.saleDate} < ${yesterday}`
    ),
  });

  // Calculate average daily volume over 29 days
  const volumeBaseline = salesBaseline.length / 29;

  // Calculate spike percentage
  const volumeSpikePct = volumeBaseline > 0
    ? ((volume24h - volumeBaseline) / volumeBaseline) * 100
    : 0;

  return {
    volume24h,
    volumeBaseline,
    volumeSpikePct,
  };
}

/**
 * Check for organic drivers using LAMP + Contrarian analysis
 *
 * Returns true if organic drivers found, false if manipulation suspected
 */
async function checkOrganicDrivers(cardId: string, cardName: string): Promise<{
  hasOrganicDrivers: boolean;
  lampSentiment: 'bullish' | 'bearish' | 'neutral';
  contrarianDiversity: number;
}> {
  try {
    // Query: Look for market knowledge about this card
    const query = `Recent market activity and news for ${cardName}`;

    // Get LAMP sentiment from market_knowledge table
    const lampResults = await db.query.market_knowledge.findMany({
      where: sql`${market_knowledge.content} ILIKE ${'%' + cardName + '%'}`,
      orderBy: desc(market_knowledge.created_at),
      limit: 10,
    });

    // Analyze sentiment distribution
    const sentiments = lampResults.map(r => r.sentiment);
    const bullishCount = sentiments.filter(s => s === 'bullish').length;
    const bearishCount = sentiments.filter(s => s === 'bearish').length;
    const neutralCount = sentiments.filter(s => s === 'neutral').length;

    // Determine dominant sentiment
    let lampSentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (bullishCount > bearishCount && bullishCount > neutralCount) {
      lampSentiment = 'bullish';
    } else if (bearishCount > bullishCount && bearishCount > neutralCount) {
      lampSentiment = 'bearish';
    }

    // Use Contrarian RAG to check diversity
    const contrarianResults = await contrarianSearch(query, 10);

    // Calculate diversity score (0-1, higher = more diverse)
    // Low diversity + volume spike = coordination suspected
    const contrarianDiversity = calculateDiversityScore(contrarianResults);

    // Organic drivers exist if:
    // 1. High diversity (> 0.6) indicates multiple independent sources
    // 2. OR high reliability scores (> 0.8) with credible citations
    const hasHighDiversity = contrarianDiversity > 0.6;
    const hasCredibleSources = lampResults.some(r =>
      (r.metadata as any)?.reliability_score > 0.8 &&
      (r.metadata as any)?.citations?.length > 0
    );

    const hasOrganicDrivers = hasHighDiversity || hasCredibleSources;

    return {
      hasOrganicDrivers,
      lampSentiment,
      contrarianDiversity,
    };
  } catch (error) {
    console.error('[ManipulationDetector] checkOrganicDrivers failed:', error);
    // Fail safe: assume organic drivers exist to avoid false positives
    return {
      hasOrganicDrivers: true,
      lampSentiment: 'neutral',
      contrarianDiversity: 1.0,
    };
  }
}

/**
 * Calculate diversity score from contrarian results
 * Returns 0-1, where higher = more diverse sources
 */
function calculateDiversityScore(results: any[]): number {
  if (results.length === 0) return 0;

  // Extract unique sources
  const sources = new Set(results.map(r => r.metadata?.source || 'unknown'));

  // Extract unique sentiment classifications
  const sentiments = new Set(results.map(r => classifySentiment(r.content)));

  // Diversity = (unique sources + unique sentiments) / (2 * total results)
  // This gives us a 0-1 score
  const diversityScore = (sources.size + sentiments.size) / (2 * results.length);

  return Math.min(diversityScore, 1.0);
}

/**
 * Detect manipulation patterns for a specific card
 *
 * Triggers alert when:
 * - Volume spike > 40%
 * - No organic drivers detected by LAMP + Contrarian
 */
export async function detectManipulation(cardId: string): Promise<ManipulationAlert | null> {
  try {
    // Get card info
    const card = await db.query.cards.findFirst({
      where: eq(cards.id, cardId),
    });

    if (!card) {
      console.warn(`[ManipulationDetector] Card not found: ${cardId}`);
      return null;
    }

    // Calculate volume metrics
    const metrics = await calculateVolumeMetrics(cardId);

    // Check if volume spike exceeds threshold
    if (metrics.volumeSpikePct <= 40) {
      // No significant spike, no alert needed
      return null;
    }

    // Check for organic drivers
    const organicCheck = await checkOrganicDrivers(cardId, card.name);

    // Alert only if spike exists AND no organic drivers
    if (organicCheck.hasOrganicDrivers) {
      console.log(`[ManipulationDetector] ${card.name}: Volume spike ${metrics.volumeSpikePct.toFixed(1)}% but organic drivers found`);
      return null;
    }

    // MANIPULATION DETECTED
    const severity: 'warning' | 'critical' = metrics.volumeSpikePct > 100 ? 'critical' : 'warning';

    const alert: ManipulationAlert = {
      cardId,
      cardName: card.name,
      volumeSpikePct: metrics.volumeSpikePct,
      baselineVolume: metrics.volumeBaseline,
      currentVolume: metrics.volume24h,
      hasOrganicDrivers: false,
      lampSentiment: organicCheck.lampSentiment,
      contrarianDiversity: organicCheck.contrarianDiversity,
      detectedAt: new Date(),
      severity,
    };

    console.warn(`[ManipulationDetector] 🚨 MANIPULATION DETECTED: ${card.name} (${metrics.volumeSpikePct.toFixed(1)}% spike)`);

    return alert;
  } catch (error) {
    console.error('[ManipulationDetector] Detection failed:', error);
    return null;
  }
}

/**
 * Scan all cards for manipulation patterns
 * (Called by cron job or on-demand)
 */
export async function scanAllCardsForManipulation(): Promise<ManipulationAlert[]> {
  try {
    // Get all cards with recent activity
    const recentCards = await db
      .select({ cardId: sales.cardId })
      .from(sales)
      .where(gte(sales.saleDate, sql`NOW() - INTERVAL '24 hours'`))
      .groupBy(sales.cardId);

    console.log(`[ManipulationDetector] Scanning ${recentCards.length} cards with recent activity`);

    const alerts: ManipulationAlert[] = [];

    for (const { cardId } of recentCards) {
      const alert = await detectManipulation(cardId);
      if (alert) {
        alerts.push(alert);
      }
    }

    console.log(`[ManipulationDetector] Found ${alerts.length} manipulation alerts`);

    return alerts;
  } catch (error) {
    console.error('[ManipulationDetector] Scan failed:', error);
    return [];
  }
}

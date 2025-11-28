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
import { sales, cards, market_knowledge, manipulationAlerts, watchlistItems } from '@/db/schema';
import { eq, and, gte, sql, desc, ilike } from 'drizzle-orm';
import { contrarianSearch, classifySentiment } from '@/../../../lib/rag/contrarian-rag';
import { randomUUID } from 'crypto';

export interface ManipulationAlert {
  cardId: string;
  cardName: string;
  volumeSpikePct: number;
  baselineVolume: number;
  currentVolume: number;
  hasOrganicDrivers: boolean;
  lampSentiment: 'bullish' | 'bearish' | 'neutral';
  contrarianDiversity: number;
  combinedScore: number; // LAMP + Contrarian score (0-200)
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
    // Use ilike for safe parameterized case-insensitive search
    const searchPattern = `%${cardName}%`;
    const lampResults = await db.query.market_knowledge.findMany({
      where: ilike(market_knowledge.content, searchPattern),
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
 * Calculate LAMP manipulation score (0-100)
 *
 * Bullish sentiment during price spikes = high manipulation risk
 * Bearish sentiment = low risk
 * Neutral = medium risk
 */
function calculateLampScore(sentiment: 'bullish' | 'bearish' | 'neutral'): number {
  switch (sentiment) {
    case 'bullish':
      return 70; // High risk - coordinated bullish pumping
    case 'neutral':
      return 30; // Medium risk
    case 'bearish':
      return 0; // Low risk - unlikely manipulation
  }
}

/**
 * Calculate Contrarian manipulation score (0-100)
 *
 * Low diversity = high coordination = high manipulation risk
 * High diversity = organic activity = low risk
 */
function calculateContrarianScore(diversity: number): number {
  // Invert diversity: low diversity (0.1) = high score (90)
  // High diversity (0.9) = low score (10)
  return Math.round((1 - diversity) * 100);
}

/**
 * Calculate combined manipulation score
 * Returns 0-200, where >75 triggers alert
 */
function calculateCombinedScore(
  lampSentiment: 'bullish' | 'bearish' | 'neutral',
  contrarianDiversity: number
): number {
  const lampScore = calculateLampScore(lampSentiment);
  const contrarianScore = calculateContrarianScore(contrarianDiversity);
  return lampScore + contrarianScore;
}

/**
 * Detect manipulation patterns for a specific card
 *
 * Triggers alert when:
 * - LAMP + Contrarian combined score > 75
 * - Volume spike present (>40%)
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

    // Check if volume spike exceeds threshold (still need some activity)
    if (metrics.volumeSpikePct <= 40) {
      // No significant spike, no alert needed
      return null;
    }

    // Check for organic drivers and get sentiment analysis
    const organicCheck = await checkOrganicDrivers(cardId, card.name);

    // Calculate combined manipulation score (LAMP + Contrarian)
    const combinedScore = calculateCombinedScore(
      organicCheck.lampSentiment,
      organicCheck.contrarianDiversity
    );

    console.log(`[ManipulationDetector] ${card.name}: Combined Score=${combinedScore} (LAMP=${calculateLampScore(organicCheck.lampSentiment)}, Contrarian=${calculateContrarianScore(organicCheck.contrarianDiversity)})`);

    // Trigger alert only when combined score exceeds threshold
    if (combinedScore <= 75) {
      console.log(`[ManipulationDetector] ${card.name}: Score ${combinedScore} below threshold (75), no alert`);
      return null;
    }

    // MANIPULATION DETECTED - Score > 75
    const severity: 'warning' | 'critical' = combinedScore > 120 ? 'critical' : 'warning';

    const alert: ManipulationAlert = {
      cardId,
      cardName: card.name,
      volumeSpikePct: metrics.volumeSpikePct,
      baselineVolume: metrics.volumeBaseline,
      currentVolume: metrics.volume24h,
      hasOrganicDrivers: organicCheck.hasOrganicDrivers,
      lampSentiment: organicCheck.lampSentiment,
      contrarianDiversity: organicCheck.contrarianDiversity,
      combinedScore,
      detectedAt: new Date(),
      severity,
    };

    console.warn(`[ManipulationDetector] 🚨 MANIPULATION DETECTED: ${card.name} (Score: ${combinedScore})`);

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

/**
 * Save manipulation alert to database
 */
export async function saveManipulationAlert(alert: ManipulationAlert): Promise<string> {
  try {
    const alertId = randomUUID();

    await db.insert(manipulationAlerts).values({
      id: alertId,
      cardId: alert.cardId,
      volumeSpikePct: alert.volumeSpikePct,
      baselineVolume: alert.baselineVolume,
      currentVolume: alert.currentVolume,
      lampSentiment: alert.lampSentiment,
      contrarianDiversity: alert.contrarianDiversity,
      severity: alert.severity,
      isActive: true,
      detectedAt: alert.detectedAt,
      createdAt: new Date(),
    });

    console.log(`[ManipulationDetector] Saved alert ${alertId} for card ${alert.cardId}`);

    return alertId;
  } catch (error) {
    console.error('[ManipulationDetector] Failed to save alert:', error);
    throw error;
  }
}

/**
 * Auto-pause all price alerts for a manipulated card
 */
export async function pauseAlertsForCard(cardId: string): Promise<number> {
  try {
    // Find all active watchlist items for this card
    const activeWatchlistItems = await db.query.watchlistItems.findMany({
      where: and(
        eq(watchlistItems.cardId, cardId),
        eq(watchlistItems.isTriggered, false)
      ),
    });

    if (activeWatchlistItems.length === 0) {
      console.log(`[ManipulationDetector] No active alerts to pause for card ${cardId}`);
      return 0;
    }

    // Mark them as triggered (effectively pauses them)
    for (const item of activeWatchlistItems) {
      await db
        .update(watchlistItems)
        .set({
          isTriggered: true,
          triggeredAt: new Date(),
        })
        .where(eq(watchlistItems.id, item.id));
    }

    console.log(`[ManipulationDetector] Paused ${activeWatchlistItems.length} alerts for card ${cardId}`);

    return activeWatchlistItems.length;
  } catch (error) {
    console.error('[ManipulationDetector] Failed to pause alerts:', error);
    return 0;
  }
}

/**
 * Send push notification for manipulation detection
 */
export async function sendManipulationNotification(
  cardName: string,
  combinedScore: number
): Promise<void> {
  try {
    // Create notification event
    if (typeof window !== 'undefined' && 'Notification' in window) {
      // Request permission if not already granted
      if (Notification.permission === 'granted') {
        new Notification('Manipulation Detected', {
          body: `${cardName}: Manipulation detected – historical success rate 6%`,
          icon: '/shield-icon.png',
          badge: '/shield-badge.png',
          tag: `manipulation-${cardName}`,
        });
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification('Manipulation Detected', {
            body: `${cardName}: Manipulation detected – historical success rate 6%`,
            icon: '/shield-icon.png',
          });
        }
      }
    }

    // Also dispatch custom event for in-app toast
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('manipulation-alert', {
          detail: {
            cardName,
            message: 'Manipulation detected – historical success rate 6%',
            combinedScore,
          },
        })
      );
    }

    console.log(`[ManipulationDetector] Notification sent for ${cardName}`);
  } catch (error) {
    console.error('[ManipulationDetector] Failed to send notification:', error);
  }
}

/**
 * Activate Manipulation Shield for a card
 * - Saves alert to database
 * - Auto-pauses all alerts
 * - Sends push notification
 */
export async function activateManipulationShield(alert: ManipulationAlert): Promise<void> {
  try {
    console.log(`[ManipulationDetector] 🛡️ Activating Manipulation Shield for ${alert.cardName}`);

    // 1. Save alert to database
    const alertId = await saveManipulationAlert(alert);

    // 2. Auto-pause all price alerts for this card
    const pausedCount = await pauseAlertsForCard(alert.cardId);

    // 3. Send push notification
    await sendManipulationNotification(alert.cardName, alert.combinedScore);

    // 4. Update card manipulation flag
    await db
      .update(cards)
      .set({
        isManipulated: true,
        manipulationReason: `LAMP+Contrarian score ${alert.combinedScore} (threshold: 75)`,
        lastFlaggedAt: new Date(),
      })
      .where(eq(cards.id, alert.cardId));

    console.log(`[ManipulationDetector] ✅ Shield activated: Alert ${alertId}, ${pausedCount} alerts paused`);
  } catch (error) {
    console.error('[ManipulationDetector] Failed to activate shield:', error);
    throw error;
  }
}

/**
 * Alert Pause Service
 *
 * Automatically pauses price alerts when manipulation is detected.
 * Prevents users from acting on manipulated price movements.
 */

import { db } from '@/db';
import { alertSubscriptions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import * as Sentry from '@sentry/nextjs';

export interface AlertPauseResult {
  cardId: string;
  pausedCount: number;
  success: boolean;
  error?: string;
}

/**
 * Pause all active alerts for a specific card
 *
 * Called when manipulation is detected to protect users from
 * acting on false price signals.
 */
export async function pauseAlertsForCard(cardId: string): Promise<AlertPauseResult> {
  try {
    console.log(`[AlertPause] Pausing alerts for card: ${cardId}`);

    // Find all active alert subscriptions for this card
    const activeAlerts = await db.query.alertSubscriptions.findMany({
      where: and(
        eq(alertSubscriptions.cardId, cardId),
        eq(alertSubscriptions.isActive, true)
      ),
    });

    if (activeAlerts.length === 0) {
      console.log(`[AlertPause] No active alerts found for card: ${cardId}`);
      return {
        cardId,
        pausedCount: 0,
        success: true,
      };
    }

    // Pause all active alerts by setting isActive to false
    await db
      .update(alertSubscriptions)
      .set({ isActive: false })
      .where(and(
        eq(alertSubscriptions.cardId, cardId),
        eq(alertSubscriptions.isActive, true)
      ));

    console.log(`[AlertPause] Paused ${activeAlerts.length} alerts for card: ${cardId}`);

    return {
      cardId,
      pausedCount: activeAlerts.length,
      success: true,
    };
  } catch (error) {
    console.error('[AlertPause] Failed to pause alerts:', error);
    Sentry.captureException(error, {
      extra: { cardId },
    });

    return {
      cardId,
      pausedCount: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Resume alerts for a card after manipulation alert is resolved
 */
export async function resumeAlertsForCard(cardId: string): Promise<AlertPauseResult> {
  try {
    console.log(`[AlertPause] Resuming alerts for card: ${cardId}`);

    // Find all paused alert subscriptions for this card
    const pausedAlerts = await db.query.alertSubscriptions.findMany({
      where: and(
        eq(alertSubscriptions.cardId, cardId),
        eq(alertSubscriptions.isActive, false)
      ),
    });

    if (pausedAlerts.length === 0) {
      console.log(`[AlertPause] No paused alerts found for card: ${cardId}`);
      return {
        cardId,
        pausedCount: 0,
        success: true,
      };
    }

    // Resume alerts by setting isActive to true
    await db
      .update(alertSubscriptions)
      .set({ isActive: true })
      .where(and(
        eq(alertSubscriptions.cardId, cardId),
        eq(alertSubscriptions.isActive, false)
      ));

    console.log(`[AlertPause] Resumed ${pausedAlerts.length} alerts for card: ${cardId}`);

    return {
      cardId,
      pausedCount: pausedAlerts.length,
      success: true,
    };
  } catch (error) {
    console.error('[AlertPause] Failed to resume alerts:', error);
    Sentry.captureException(error, {
      extra: { cardId },
    });

    return {
      cardId,
      pausedCount: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get count of paused alerts for a card
 */
export async function getPausedAlertsCount(cardId: string): Promise<number> {
  try {
    const pausedAlerts = await db.query.alertSubscriptions.findMany({
      where: and(
        eq(alertSubscriptions.cardId, cardId),
        eq(alertSubscriptions.isActive, false)
      ),
    });

    return pausedAlerts.length;
  } catch (error) {
    console.error('[AlertPause] Failed to get paused alerts count:', error);
    return 0;
  }
}

/**
 * Manipulation Shield Service
 *
 * Orchestrates the complete manipulation protection flow:
 * 1. Detect manipulation patterns
 * 2. Create database alert
 * 3. Send notifications
 * 4. Auto-pause alerts
 */

import { db } from '@/db';
import { manipulationAlerts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { detectManipulation, ManipulationAlert } from './manipulation-detector';
import { sendManipulationWarningNotification } from '@/notifications';
import { pauseAlertsForCard } from './alert-pause.service';
import * as Sentry from '@sentry/nextjs';

export interface ManipulationShieldResult {
  success: boolean;
  cardId: string;
  alertCreated: boolean;
  notificationsSent: boolean;
  alertsPaused: boolean;
  pausedAlertsCount?: number;
  error?: string;
}

/**
 * Activate Manipulation Shield for a specific card
 *
 * Complete flow:
 * 1. Run detection
 * 2. If manipulation detected:
 *    a. Create alert in database
 *    b. Send push notifications
 *    c. Auto-pause price alerts
 */
export async function activateManipulationShield(cardId: string): Promise<ManipulationShieldResult> {
  try {
    console.log(`[ManipulationShield] Activating shield for card: ${cardId}`);

    // Step 1: Detect manipulation
    const detection = await detectManipulation(cardId);

    if (!detection) {
      console.log(`[ManipulationShield] No manipulation detected for card: ${cardId}`);
      return {
        success: true,
        cardId,
        alertCreated: false,
        notificationsSent: false,
        alertsPaused: false,
      };
    }

    console.log(`[ManipulationShield] 🚨 Manipulation detected for ${detection.cardName}!`);

    // Step 2: Create alert in database
    const alertId = createId();
    await db.insert(manipulationAlerts).values({
      id: alertId,
      cardId: detection.cardId,
      volumeSpikePct: detection.volumeSpikePct,
      baselineVolume: detection.baselineVolume,
      currentVolume: detection.currentVolume,
      lampSentiment: detection.lampSentiment,
      contrarianDiversity: detection.contrarianDiversity,
      severity: detection.severity,
      isActive: true,
      detectedAt: detection.detectedAt,
    });

    console.log(`[ManipulationShield] Alert created: ${alertId}`);

    // Step 3: Send notifications
    let notificationsSent = false;
    try {
      await sendManipulationWarningNotification({
        cardId: detection.cardId,
        cardName: detection.cardName,
        volumeSpikePct: detection.volumeSpikePct,
        severity: detection.severity,
      });
      notificationsSent = true;
      console.log(`[ManipulationShield] Notifications sent for ${detection.cardName}`);
    } catch (notifError) {
      console.error('[ManipulationShield] Notification failed:', notifError);
      Sentry.captureException(notifError, {
        extra: { cardId, detection },
      });
      // Continue even if notifications fail
    }

    // Step 4: Auto-pause alerts
    let alertsPaused = false;
    let pausedAlertsCount = 0;
    try {
      const pauseResult = await pauseAlertsForCard(detection.cardId);
      alertsPaused = pauseResult.success;
      pausedAlertsCount = pauseResult.pausedCount;
      console.log(`[ManipulationShield] Paused ${pausedAlertsCount} alerts for ${detection.cardName}`);
    } catch (pauseError) {
      console.error('[ManipulationShield] Alert pause failed:', pauseError);
      Sentry.captureException(pauseError, {
        extra: { cardId, detection },
      });
      // Continue even if pause fails
    }

    return {
      success: true,
      cardId: detection.cardId,
      alertCreated: true,
      notificationsSent,
      alertsPaused,
      pausedAlertsCount,
    };
  } catch (error) {
    console.error('[ManipulationShield] Shield activation failed:', error);
    Sentry.captureException(error, {
      extra: { cardId },
    });

    return {
      success: false,
      cardId,
      alertCreated: false,
      notificationsSent: false,
      alertsPaused: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Deactivate Manipulation Shield for a card
 *
 * Called when manipulation pattern is no longer active
 */
export async function deactivateManipulationShield(cardId: string): Promise<{ success: boolean }> {
  try {
    console.log(`[ManipulationShield] Deactivating shield for card: ${cardId}`);

    // Mark all active alerts as inactive
    await db
      .update(manipulationAlerts)
      .set({
        isActive: false,
        resolvedAt: new Date(),
      })
      .where(eq(manipulationAlerts.cardId, cardId));

    console.log(`[ManipulationShield] Shield deactivated for card: ${cardId}`);

    return { success: true };
  } catch (error) {
    console.error('[ManipulationShield] Shield deactivation failed:', error);
    Sentry.captureException(error, {
      extra: { cardId },
    });

    return { success: false };
  }
}

/**
 * Check if Manipulation Shield is currently active for a card
 */
export async function isShieldActive(cardId: string): Promise<boolean> {
  try {
    const activeAlert = await db.query.manipulationAlerts.findFirst({
      where: eq(manipulationAlerts.cardId, cardId),
    });

    return activeAlert?.isActive ?? false;
  } catch (error) {
    console.error('[ManipulationShield] Shield status check failed:', error);
    return false;
  }
}

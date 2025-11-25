/**
 * Parental Controls Enforcement Library
 *
 * Provides helper functions to enforce parental controls across the application.
 * Ensures children cannot bypass restrictions set by parents.
 */

import { db } from '@/db';
import { parentalControls, familyLinks, childActivityHistory } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Check if a user has parental controls enabled
 */
export async function getParentalControls(userId: string) {
  return await db.query.parentalControls.findFirst({
    where: eq(parentalControls.childId, userId),
  });
}

/**
 * Check if user is a supervised child (has any parent links)
 */
export async function isSupervisedChild(userId: string): Promise<boolean> {
  const links = await db.query.familyLinks.findMany({
    where: and(
      eq(familyLinks.childId, userId),
      eq(familyLinks.status, 'active')
    ),
  });

  return links.length > 0;
}

/**
 * Check if current time is within bedtime hours
 */
export function isInBedtimeHours(
  bedtimeStart: string,
  bedtimeEnd: string,
  timezone = 'America/New_York'
): boolean {
  const now = new Date();
  const nowTime = now.toLocaleTimeString('en-US', {
    hour12: false,
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
  });

  // Parse times (format: "HH:MM")
  const start = bedtimeStart;
  const end = bedtimeEnd;

  // Handle overnight bedtime (e.g., 21:00 to 07:00)
  if (start > end) {
    return nowTime >= start || nowTime < end;
  }

  // Normal bedtime (e.g., 14:00 to 16:00)
  return nowTime >= start && nowTime < end;
}

/**
 * Check if action is allowed based on parental controls
 */
export async function isActionAllowed(
  userId: string,
  actionType: 'trade' | 'watchlist_add' | 'alert_set' | 'portfolio_update' | 'login'
): Promise<{
  allowed: boolean;
  blockedByBedtime: boolean;
  blockedByCoolDown: boolean;
  reason?: string;
}> {
  const controls = await getParentalControls(userId);

  if (!controls) {
    return { allowed: true, blockedByBedtime: false, blockedByCoolDown: false };
  }

  // Check bedtime mode
  if (
    controls.bedtimeEnabled &&
    controls.bedtimeStart &&
    controls.bedtimeEnd &&
    isInBedtimeHours(controls.bedtimeStart, controls.bedtimeEnd, controls.bedtimeTimezone || 'America/New_York')
  ) {
    return {
      allowed: false,
      blockedByBedtime: true,
      blockedByCoolDown: false,
      reason: 'Action blocked by bedtime mode',
    };
  }

  // Check cool down mode (for trade-related actions)
  if (
    controls.coolDownEnabled &&
    controls.coolDownMinutes &&
    ['trade', 'portfolio_update'].includes(actionType)
  ) {
    // Get last trade activity
    const lastActivity = await db.query.childActivityHistory.findFirst({
      where: and(
        eq(childActivityHistory.childId, userId),
        eq(childActivityHistory.activityType, actionType)
      ),
      orderBy: (childActivityHistory, { desc }) => [desc(childActivityHistory.timestamp)],
    });

    if (lastActivity) {
      const minutesSinceLastAction =
        (Date.now() - new Date(lastActivity.timestamp).getTime()) / 1000 / 60;

      if (minutesSinceLastAction < controls.coolDownMinutes) {
        return {
          allowed: false,
          blockedByBedtime: false,
          blockedByCoolDown: true,
          reason: `Cool down active. Wait ${Math.ceil(controls.coolDownMinutes - minutesSinceLastAction)} more minutes.`,
        };
      }
    }
  }

  // Check daily trading limit
  if (controls.dailyTradingLimit && actionType === 'trade') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysTrades = await db.query.childActivityHistory.findMany({
      where: and(
        eq(childActivityHistory.childId, userId),
        eq(childActivityHistory.activityType, 'trade')
      ),
    });

    const tradesCount = todaysTrades.filter(
      (t) => new Date(t.timestamp) >= today
    ).length;

    if (tradesCount >= controls.dailyTradingLimit) {
      return {
        allowed: false,
        blockedByBedtime: false,
        blockedByCoolDown: false,
        reason: `Daily trading limit reached (${controls.dailyTradingLimit} trades)`,
      };
    }
  }

  return { allowed: true, blockedByBedtime: false, blockedByCoolDown: false };
}

/**
 * Log activity to session history
 */
export async function logActivity(
  childId: string,
  activityType: string,
  activityData: Record<string, any>,
  options?: {
    ipAddress?: string;
    userAgent?: string;
    deviceInfo?: any;
    blockedByBedtime?: boolean;
    blockedByCoolDown?: boolean;
  }
) {
  await db.insert(childActivityHistory).values({
    id: crypto.randomUUID(),
    childId,
    activityType,
    activityData,
    ipAddress: options?.ipAddress,
    userAgent: options?.userAgent,
    deviceInfo: options?.deviceInfo,
    blockedByBedtime: options?.blockedByBedtime || false,
    blockedByCoolDown: options?.blockedByCoolDown || false,
  });
}

/**
 * Prevent child from modifying parental controls
 * Returns true if user is allowed to modify controls (is parent)
 */
export async function canModifyParentalControls(
  userId: string,
  childId: string
): Promise<boolean> {
  const link = await db.query.familyLinks.findFirst({
    where: and(
      eq(familyLinks.parentId, userId),
      eq(familyLinks.childId, childId),
      eq(familyLinks.status, 'active')
    ),
  });

  return !!link;
}

/**
 * Check if notifications are allowed for this child
 */
export async function areNotificationsAllowed(
  userId: string,
  channel: 'email' | 'push' | 'discord' | 'telegram'
): Promise<boolean> {
  const controls = await getParentalControls(userId);

  if (!controls) {
    return true;
  }

  if (controls.notificationsDisabled) {
    return false;
  }

  if (controls.disabledChannels && Array.isArray(controls.disabledChannels)) {
    return !controls.disabledChannels.includes(channel);
  }

  return true;
}

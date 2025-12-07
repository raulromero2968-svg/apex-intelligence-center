/**
 * RC Economy - Reputation Credits Transaction Service
 *
 * Implements double-entry accounting for RC transactions with:
 * - Daily earning limits (anti-inflation)
 * - Per-action cooldowns
 * - Audit trail for all transactions
 * - Balance verification
 *
 * References:
 * - Payment Infrastructure Plan Section 3: RC Economy Technical Implementation
 * - Apex Commons schema (commonsRcTransactions, commonsUserProfiles)
 */

import { db } from '@/lib/db';
import { eq, and, sql, gte, desc } from 'drizzle-orm';
import {
  commonsUserProfiles,
  commonsRcTransactions,
  RC_REASON_CODES,
  RC_AMOUNTS,
  CONTRIBUTOR_LEVEL_THRESHOLDS,
  type RcReasonCode,
  type ContributorLevel,
} from '@apex/db/schema';
import { redis } from '@/server/redis/client';
import * as Sentry from '@sentry/nextjs';

import { DEFAULT_RC_LIMITS, type RcEarningLimits } from './types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const RC_CONFIG = {
  /** Redis key prefix for rate limiting */
  RATE_LIMIT_PREFIX: 'rc:limit:',
  /** Daily earnings key prefix */
  DAILY_EARNINGS_PREFIX: 'rc:daily:',
  /** Cooldown key prefix */
  COOLDOWN_PREFIX: 'rc:cooldown:',
  /** Maximum RC that can be transferred at once */
  MAX_TRANSFER_AMOUNT: 100,
  /** Minimum balance required for transfers */
  MIN_BALANCE_FOR_TRANSFER: 10,
  /** RC to USD peg (informational only) */
  RC_TO_USD_RATE: 0.10,
};

// ============================================================================
// TYPES
// ============================================================================

interface RcTransactionResult {
  success: boolean;
  transactionId?: string;
  newBalance: number;
  error?: string;
}

interface RcEarningCheck {
  canEarn: boolean;
  dailyEarned: number;
  dailyRemaining: number;
  cooldownRemaining?: number;
  reason?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getDailyKey(userId: string): string {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `${RC_CONFIG.DAILY_EARNINGS_PREFIX}${userId}:${date}`;
}

function getCooldownKey(userId: string, action: string): string {
  return `${RC_CONFIG.COOLDOWN_PREFIX}${userId}:${action}`;
}

function getSecondsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.ceil((midnight.getTime() - now.getTime()) / 1000);
}

function determineContributorLevel(reputationCredits: number): ContributorLevel {
  if (reputationCredits >= CONTRIBUTOR_LEVEL_THRESHOLDS.platinum) return 'platinum';
  if (reputationCredits >= CONTRIBUTOR_LEVEL_THRESHOLDS.gold) return 'gold';
  if (reputationCredits >= CONTRIBUTOR_LEVEL_THRESHOLDS.silver) return 'silver';
  return 'bronze';
}

// ============================================================================
// EARNING LIMIT CHECKS
// ============================================================================

/**
 * Check if user can earn RC (daily limit + cooldown check)
 */
export async function checkEarningEligibility(
  userId: string,
  action: RcReasonCode,
  limits: RcEarningLimits = DEFAULT_RC_LIMITS
): Promise<RcEarningCheck> {
  try {
    // Check daily total
    const dailyKey = getDailyKey(userId);
    const dailyEarned = (await redis.get<number>(dailyKey)) || 0;
    const dailyRemaining = Math.max(0, limits.dailyLimit - dailyEarned);

    if (dailyEarned >= limits.dailyLimit) {
      return {
        canEarn: false,
        dailyEarned,
        dailyRemaining: 0,
        reason: `Daily earning limit reached (${limits.dailyLimit} RC/day)`,
      };
    }

    // Check per-action limit
    const actionLimit = limits.perActionLimits[action];
    if (actionLimit !== undefined) {
      const amount = RC_AMOUNTS[action as keyof typeof RC_AMOUNTS] || 0;
      if (amount > actionLimit) {
        return {
          canEarn: false,
          dailyEarned,
          dailyRemaining,
          reason: `Action limit exceeded for ${action}`,
        };
      }
    }

    // Check cooldown
    const cooldownSeconds = limits.cooldownSeconds[action];
    if (cooldownSeconds) {
      const cooldownKey = getCooldownKey(userId, action);
      const cooldownRemaining = await redis.ttl(cooldownKey);

      if (cooldownRemaining > 0) {
        return {
          canEarn: false,
          dailyEarned,
          dailyRemaining,
          cooldownRemaining,
          reason: `Cooldown active: ${cooldownRemaining}s remaining`,
        };
      }
    }

    return {
      canEarn: true,
      dailyEarned,
      dailyRemaining,
    };
  } catch (error) {
    console.error('[RC_ECONOMY] Error checking eligibility:', error);
    // On error, allow the action (fail open for UX)
    return {
      canEarn: true,
      dailyEarned: 0,
      dailyRemaining: DEFAULT_RC_LIMITS.dailyLimit,
    };
  }
}

/**
 * Record daily earnings and set cooldown
 */
async function recordEarning(
  userId: string,
  amount: number,
  action: RcReasonCode
): Promise<void> {
  const dailyKey = getDailyKey(userId);
  const cooldownSeconds = DEFAULT_RC_LIMITS.cooldownSeconds[action];

  try {
    // Increment daily total
    const ttl = getSecondsUntilMidnight();
    await redis.incrby(dailyKey, Math.abs(amount));
    await redis.expire(dailyKey, ttl);

    // Set cooldown if applicable
    if (cooldownSeconds) {
      const cooldownKey = getCooldownKey(userId, action);
      await redis.set(cooldownKey, '1', { ex: cooldownSeconds });
    }
  } catch (error) {
    console.error('[RC_ECONOMY] Error recording earning:', error);
  }
}

// ============================================================================
// CORE TRANSACTION FUNCTIONS
// ============================================================================

/**
 * Earn RC for an action (with limit checks)
 *
 * This is the main function for rewarding users with RC.
 * Implements anti-inflation via daily limits and cooldowns.
 */
export async function earnRC(
  userId: string,
  reasonCode: RcReasonCode,
  referenceType?: string,
  referenceId?: string,
  customAmount?: number
): Promise<RcTransactionResult> {
  try {
    // Get amount for this action
    const amount = customAmount ?? RC_AMOUNTS[reasonCode as keyof typeof RC_AMOUNTS] ?? 0;

    if (amount <= 0) {
      return { success: false, newBalance: 0, error: 'Invalid amount for earning' };
    }

    // Check earning eligibility
    const eligibility = await checkEarningEligibility(userId, reasonCode);
    if (!eligibility.canEarn) {
      return {
        success: false,
        newBalance: 0,
        error: eligibility.reason,
      };
    }

    // Get user profile
    const profile = await db.query.commonsUserProfiles.findFirst({
      where: eq(commonsUserProfiles.userId, userId),
    });

    if (!profile) {
      return { success: false, newBalance: 0, error: 'User profile not found' };
    }

    const newBalance = profile.reputationCredits + amount;

    // Transaction: Update balance and create ledger entry
    const [transaction] = await db.transaction(async (tx) => {
      // Update user balance
      await tx
        .update(commonsUserProfiles)
        .set({
          reputationCredits: newBalance,
          contributorLevel: determineContributorLevel(newBalance),
          updatedAt: new Date(),
        })
        .where(eq(commonsUserProfiles.userId, userId));

      // Create transaction record
      const [txRecord] = await tx
        .insert(commonsRcTransactions)
        .values({
          userId: profile.id,
          amount,
          balance: newBalance,
          reason: `Earned ${amount} RC for ${reasonCode}`,
          reasonCode,
          referenceType,
          referenceId,
          metadata: { earnedAt: new Date().toISOString() },
        })
        .returning();

      return [txRecord];
    });

    // Record earning for rate limiting
    await recordEarning(userId, amount, reasonCode);

    return {
      success: true,
      transactionId: transaction.id,
      newBalance,
    };
  } catch (error) {
    console.error('[RC_ECONOMY] Error earning RC:', error);
    Sentry.captureException(error, {
      tags: { component: 'rc-economy', operation: 'earn' },
      extra: { userId, reasonCode },
    });
    return { success: false, newBalance: 0, error: 'Transaction failed' };
  }
}

/**
 * Spend RC for an action
 *
 * Used for actions that cost RC (e.g., creating proposals, boosting)
 */
export async function spendRC(
  userId: string,
  amount: number,
  reasonCode: RcReasonCode,
  referenceType?: string,
  referenceId?: string
): Promise<RcTransactionResult> {
  try {
    if (amount <= 0) {
      return { success: false, newBalance: 0, error: 'Invalid amount' };
    }

    // Get user profile
    const profile = await db.query.commonsUserProfiles.findFirst({
      where: eq(commonsUserProfiles.userId, userId),
    });

    if (!profile) {
      return { success: false, newBalance: 0, error: 'User profile not found' };
    }

    // Check sufficient balance
    if (profile.reputationCredits < amount) {
      return {
        success: false,
        newBalance: profile.reputationCredits,
        error: `Insufficient RC balance. Required: ${amount}, Available: ${profile.reputationCredits}`,
      };
    }

    const newBalance = profile.reputationCredits - amount;

    // Transaction: Update balance and create ledger entry
    const [transaction] = await db.transaction(async (tx) => {
      // Update user balance
      await tx
        .update(commonsUserProfiles)
        .set({
          reputationCredits: newBalance,
          contributorLevel: determineContributorLevel(newBalance),
          updatedAt: new Date(),
        })
        .where(eq(commonsUserProfiles.userId, userId));

      // Create transaction record (negative amount for spending)
      const [txRecord] = await tx
        .insert(commonsRcTransactions)
        .values({
          userId: profile.id,
          amount: -amount,
          balance: newBalance,
          reason: `Spent ${amount} RC for ${reasonCode}`,
          reasonCode,
          referenceType,
          referenceId,
          metadata: { spentAt: new Date().toISOString() },
        })
        .returning();

      return [txRecord];
    });

    return {
      success: true,
      transactionId: transaction.id,
      newBalance,
    };
  } catch (error) {
    console.error('[RC_ECONOMY] Error spending RC:', error);
    Sentry.captureException(error, {
      tags: { component: 'rc-economy', operation: 'spend' },
      extra: { userId, amount, reasonCode },
    });
    return { success: false, newBalance: 0, error: 'Transaction failed' };
  }
}

/**
 * Transfer RC between users
 *
 * Implements double-entry: debit sender, credit receiver
 */
export async function transferRC(
  fromUserId: string,
  toUserId: string,
  amount: number,
  reason?: string
): Promise<RcTransactionResult> {
  try {
    // Validate amount
    if (amount <= 0 || amount > RC_CONFIG.MAX_TRANSFER_AMOUNT) {
      return {
        success: false,
        newBalance: 0,
        error: `Invalid transfer amount. Max: ${RC_CONFIG.MAX_TRANSFER_AMOUNT}`,
      };
    }

    // Get both profiles
    const [fromProfile, toProfile] = await Promise.all([
      db.query.commonsUserProfiles.findFirst({
        where: eq(commonsUserProfiles.userId, fromUserId),
      }),
      db.query.commonsUserProfiles.findFirst({
        where: eq(commonsUserProfiles.userId, toUserId),
      }),
    ]);

    if (!fromProfile || !toProfile) {
      return { success: false, newBalance: 0, error: 'User profile not found' };
    }

    // Check sufficient balance (with minimum reserve)
    const requiredBalance = amount + RC_CONFIG.MIN_BALANCE_FOR_TRANSFER;
    if (fromProfile.reputationCredits < requiredBalance) {
      return {
        success: false,
        newBalance: fromProfile.reputationCredits,
        error: `Insufficient balance. Required: ${requiredBalance}, Available: ${fromProfile.reputationCredits}`,
      };
    }

    const senderNewBalance = fromProfile.reputationCredits - amount;
    const receiverNewBalance = toProfile.reputationCredits + amount;

    // Double-entry transaction
    await db.transaction(async (tx) => {
      // Debit sender
      await tx
        .update(commonsUserProfiles)
        .set({
          reputationCredits: senderNewBalance,
          contributorLevel: determineContributorLevel(senderNewBalance),
          updatedAt: new Date(),
        })
        .where(eq(commonsUserProfiles.userId, fromUserId));

      await tx.insert(commonsRcTransactions).values({
        userId: fromProfile.id,
        amount: -amount,
        balance: senderNewBalance,
        reason: reason || `Transferred ${amount} RC to user`,
        reasonCode: 'transfer_out' as RcReasonCode,
        referenceType: 'user',
        referenceId: toProfile.id,
        metadata: {
          transferType: 'outgoing',
          recipientId: toUserId,
          timestamp: new Date().toISOString(),
        },
      });

      // Credit receiver
      await tx
        .update(commonsUserProfiles)
        .set({
          reputationCredits: receiverNewBalance,
          contributorLevel: determineContributorLevel(receiverNewBalance),
          updatedAt: new Date(),
        })
        .where(eq(commonsUserProfiles.userId, toUserId));

      await tx.insert(commonsRcTransactions).values({
        userId: toProfile.id,
        amount,
        balance: receiverNewBalance,
        reason: reason || `Received ${amount} RC transfer`,
        reasonCode: 'transfer_in' as RcReasonCode,
        referenceType: 'user',
        referenceId: fromProfile.id,
        metadata: {
          transferType: 'incoming',
          senderId: fromUserId,
          timestamp: new Date().toISOString(),
        },
      });
    });

    return {
      success: true,
      newBalance: senderNewBalance,
    };
  } catch (error) {
    console.error('[RC_ECONOMY] Error transferring RC:', error);
    Sentry.captureException(error, {
      tags: { component: 'rc-economy', operation: 'transfer' },
      extra: { fromUserId, toUserId, amount },
    });
    return { success: false, newBalance: 0, error: 'Transfer failed' };
  }
}

/**
 * Admin adjustment (with audit trail)
 */
export async function adjustRC(
  userId: string,
  amount: number,
  reason: string,
  adminId: string
): Promise<RcTransactionResult> {
  try {
    const profile = await db.query.commonsUserProfiles.findFirst({
      where: eq(commonsUserProfiles.userId, userId),
    });

    if (!profile) {
      return { success: false, newBalance: 0, error: 'User profile not found' };
    }

    const newBalance = Math.max(0, profile.reputationCredits + amount);
    const reasonCode = amount >= 0 ? RC_REASON_CODES.ADMIN_GRANT : RC_REASON_CODES.ADMIN_DEDUCTION;

    const [transaction] = await db.transaction(async (tx) => {
      await tx
        .update(commonsUserProfiles)
        .set({
          reputationCredits: newBalance,
          contributorLevel: determineContributorLevel(newBalance),
          updatedAt: new Date(),
        })
        .where(eq(commonsUserProfiles.userId, userId));

      const [txRecord] = await tx
        .insert(commonsRcTransactions)
        .values({
          userId: profile.id,
          amount,
          balance: newBalance,
          reason,
          reasonCode,
          metadata: {
            adminId,
            adjustedAt: new Date().toISOString(),
            originalBalance: profile.reputationCredits,
          },
        })
        .returning();

      return [txRecord];
    });

    // Log for audit
    console.log(`[RC_AUDIT] Admin ${adminId} adjusted user ${userId} by ${amount} RC. Reason: ${reason}`);

    return {
      success: true,
      transactionId: transaction.id,
      newBalance,
    };
  } catch (error) {
    console.error('[RC_ECONOMY] Error adjusting RC:', error);
    Sentry.captureException(error, {
      tags: { component: 'rc-economy', operation: 'adjust' },
      extra: { userId, amount, adminId },
    });
    return { success: false, newBalance: 0, error: 'Adjustment failed' };
  }
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Get user's RC balance and stats
 */
export async function getUserRCBalance(userId: string): Promise<{
  balance: number;
  level: ContributorLevel;
  dailyEarned: number;
  dailyRemaining: number;
} | null> {
  const profile = await db.query.commonsUserProfiles.findFirst({
    where: eq(commonsUserProfiles.userId, userId),
  });

  if (!profile) return null;

  const dailyKey = getDailyKey(userId);
  const dailyEarned = (await redis.get<number>(dailyKey)) || 0;
  const dailyRemaining = Math.max(0, DEFAULT_RC_LIMITS.dailyLimit - dailyEarned);

  return {
    balance: profile.reputationCredits,
    level: profile.contributorLevel as ContributorLevel,
    dailyEarned,
    dailyRemaining,
  };
}

/**
 * Get transaction history for a user
 */
export async function getTransactionHistory(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ transactions: Array<typeof commonsRcTransactions.$inferSelect>; total: number }> {
  const profile = await db.query.commonsUserProfiles.findFirst({
    where: eq(commonsUserProfiles.userId, userId),
  });

  if (!profile) {
    return { transactions: [], total: 0 };
  }

  const [transactions, countResult] = await Promise.all([
    db
      .select()
      .from(commonsRcTransactions)
      .where(eq(commonsRcTransactions.userId, profile.id))
      .orderBy(desc(commonsRcTransactions.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(commonsRcTransactions)
      .where(eq(commonsRcTransactions.userId, profile.id)),
  ]);

  return {
    transactions,
    total: Number(countResult[0]?.count || 0),
  };
}

/**
 * Get global RC economy stats
 */
export async function getEconomyStats(): Promise<{
  totalCirculating: number;
  totalUsers: number;
  avgBalance: number;
  topEarners: Array<{ userId: string; balance: number; level: string }>;
}> {
  const [statsResult, topResult] = await Promise.all([
    db
      .select({
        totalCirculating: sql<number>`sum(reputation_credits)`,
        totalUsers: sql<number>`count(*)`,
        avgBalance: sql<number>`avg(reputation_credits)`,
      })
      .from(commonsUserProfiles),
    db
      .select({
        userId: commonsUserProfiles.userId,
        balance: commonsUserProfiles.reputationCredits,
        level: commonsUserProfiles.contributorLevel,
      })
      .from(commonsUserProfiles)
      .orderBy(desc(commonsUserProfiles.reputationCredits))
      .limit(10),
  ]);

  return {
    totalCirculating: Number(statsResult[0]?.totalCirculating || 0),
    totalUsers: Number(statsResult[0]?.totalUsers || 0),
    avgBalance: Number(statsResult[0]?.avgBalance || 0),
    topEarners: topResult.map((r) => ({
      userId: r.userId,
      balance: r.balance,
      level: r.level,
    })),
  };
}

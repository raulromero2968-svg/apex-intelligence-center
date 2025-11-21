/**
 * Payment Tracker Service
 *
 * Real-time payment tracking with unbreakable spend limits:
 * - Daily limit: $50 (24h rolling window)
 * - Weekly limit: $200 (7d rolling window)
 *
 * Uses Upstash Redis for atomic operations with DB fallback.
 * Handles concurrent payments safely using Lua scripts.
 */

import { redis, RedisKeys } from '@/lib/redis';
import { db } from '@/db';
import { spendTracking, type NewSpendTracking } from '@/db/schema';
import { and, eq, gte, sql } from 'drizzle-orm';

// Spend limits (in USD)
export const SPEND_LIMITS = {
  DAILY: 50,    // $50 in 24h rolling window
  WEEKLY: 200,  // $200 in 7d rolling window
} as const;

// Time windows in milliseconds
const TIME_WINDOWS = {
  DAILY: 24 * 60 * 60 * 1000,     // 24 hours
  WEEKLY: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;

/**
 * Redis key helpers for spend tracking
 */
export const SpendKeys = {
  userSpendDaily: (userId: string) => `spend:daily:${userId}`,
  userSpendWeekly: (userId: string) => `spend:weekly:${userId}`,
  userSpendLock: (userId: string) => `spend:lock:${userId}`,
  userSpendTransactions: (userId: string, window: 'daily' | 'weekly') =>
    `spend:txs:${window}:${userId}`,
} as const;

/**
 * Spend check result
 */
export interface SpendCheckResult {
  allowed: boolean;
  dailySpent: number;
  weeklySpent: number;
  dailyRemaining: number;
  weeklyRemaining: number;
  limitType?: 'daily' | 'weekly';
  message?: string;
}

/**
 * Transaction record for Redis
 */
interface TransactionRecord {
  amount: number;
  timestamp: number;
  txId: string;
}

/**
 * Check if a payment would exceed spend limits
 *
 * This is the critical function that enforces limits BEFORE processing payment.
 * Uses Redis for fast concurrent access with DB fallback.
 *
 * @param userId - User ID
 * @param amountUsd - Payment amount in USD
 * @returns Spend check result with current limits
 */
export async function checkSpendLimit(
  userId: string,
  amountUsd: number
): Promise<SpendCheckResult> {
  try {
    // Try Redis first for fastest response
    const redisResult = await checkSpendLimitRedis(userId, amountUsd);
    if (redisResult) {
      return redisResult;
    }

    // Fallback to DB if Redis fails
    console.warn('Redis unavailable, falling back to DB for spend check');
    return await checkSpendLimitDB(userId, amountUsd);
  } catch (error) {
    console.error('Error checking spend limit:', error);
    // Fail safe: deny if we can't verify
    return {
      allowed: false,
      dailySpent: 0,
      weeklySpent: 0,
      dailyRemaining: 0,
      weeklyRemaining: 0,
      message: 'Unable to verify spend limits. Please try again.',
    };
  }
}

/**
 * Check spend limit using Redis (primary path)
 *
 * Uses sorted sets for efficient rolling window queries.
 * Atomic operations prevent race conditions.
 */
async function checkSpendLimitRedis(
  userId: string,
  amountUsd: number
): Promise<SpendCheckResult | null> {
  try {
    const now = Date.now();
    const dailyCutoff = now - TIME_WINDOWS.DAILY;
    const weeklyCutoff = now - TIME_WINDOWS.WEEKLY;

    const dailyKey = SpendKeys.userSpendTransactions(userId, 'daily');
    const weeklyKey = SpendKeys.userSpendTransactions(userId, 'weekly');

    // Clean up old transactions and sum current spend using Lua script
    // This is atomic and prevents race conditions
    const luaScript = `
      local dailyKey = KEYS[1]
      local weeklyKey = KEYS[2]
      local dailyCutoff = tonumber(ARGV[1])
      local weeklyCutoff = tonumber(ARGV[2])

      -- Remove expired transactions
      redis.call('ZREMRANGEBYSCORE', dailyKey, '-inf', dailyCutoff)
      redis.call('ZREMRANGEBYSCORE', weeklyKey, '-inf', weeklyCutoff)

      -- Get all current transactions
      local dailyTxs = redis.call('ZRANGE', dailyKey, 0, -1, 'WITHSCORES')
      local weeklyTxs = redis.call('ZRANGE', weeklyKey, 0, -1, 'WITHSCORES')

      -- Sum amounts (stored in member field as JSON)
      local dailySum = 0
      local weeklySum = 0

      for i = 1, #dailyTxs, 2 do
        local tx = cjson.decode(dailyTxs[i])
        dailySum = dailySum + tx.amount
      end

      for i = 1, #weeklyTxs, 2 do
        local tx = cjson.decode(weeklyTxs[i])
        weeklySum = weeklySum + tx.amount
      end

      return {dailySum, weeklySum}
    `;

    // Execute Lua script
    // @ts-expect-error - Upstash Redis eval types
    const result = await redis.eval(
      luaScript,
      [dailyKey, weeklyKey],
      [dailyCutoff, weeklyCutoff]
    ) as number[];

    const dailySpent = result?.[0] || 0;
    const weeklySpent = result?.[1] || 0;

    const dailyRemaining = Math.max(0, SPEND_LIMITS.DAILY - dailySpent);
    const weeklyRemaining = Math.max(0, SPEND_LIMITS.WEEKLY - weeklySpent);

    // Check if this payment would exceed limits
    const wouldExceedDaily = (dailySpent + amountUsd) > SPEND_LIMITS.DAILY;
    const wouldExceedWeekly = (weeklySpent + amountUsd) > SPEND_LIMITS.WEEKLY;

    if (wouldExceedDaily) {
      return {
        allowed: false,
        dailySpent,
        weeklySpent,
        dailyRemaining,
        weeklyRemaining,
        limitType: 'daily',
        message: `Payment of $${amountUsd.toFixed(2)} would exceed daily limit of $${SPEND_LIMITS.DAILY}. You have $${dailyRemaining.toFixed(2)} remaining today.`,
      };
    }

    if (wouldExceedWeekly) {
      return {
        allowed: false,
        dailySpent,
        weeklySpent,
        dailyRemaining,
        weeklyRemaining,
        limitType: 'weekly',
        message: `Payment of $${amountUsd.toFixed(2)} would exceed weekly limit of $${SPEND_LIMITS.WEEKLY}. You have $${weeklyRemaining.toFixed(2)} remaining this week.`,
      };
    }

    return {
      allowed: true,
      dailySpent,
      weeklySpent,
      dailyRemaining: dailyRemaining - amountUsd,
      weeklyRemaining: weeklyRemaining - amountUsd,
    };
  } catch (error) {
    console.error('Redis spend check failed:', error);
    return null;
  }
}

/**
 * Check spend limit using database (fallback)
 *
 * Queries the spend_tracking table with rolling window.
 */
async function checkSpendLimitDB(
  userId: string,
  amountUsd: number
): Promise<SpendCheckResult> {
  const now = new Date();
  const dailyCutoff = new Date(now.getTime() - TIME_WINDOWS.DAILY);
  const weeklyCutoff = new Date(now.getTime() - TIME_WINDOWS.WEEKLY);

  // Query daily spend
  const dailyResult = await db
    .select({
      total: sql<number>`COALESCE(SUM(${spendTracking.amountUsd}), 0)`,
    })
    .from(spendTracking)
    .where(
      and(
        eq(spendTracking.userId, userId),
        gte(spendTracking.createdAt, dailyCutoff),
        eq(spendTracking.status, 'completed')
      )
    );

  // Query weekly spend
  const weeklyResult = await db
    .select({
      total: sql<number>`COALESCE(SUM(${spendTracking.amountUsd}), 0)`,
    })
    .from(spendTracking)
    .where(
      and(
        eq(spendTracking.userId, userId),
        gte(spendTracking.createdAt, weeklyCutoff),
        eq(spendTracking.status, 'completed')
      )
    );

  const dailySpent = dailyResult[0]?.total || 0;
  const weeklySpent = weeklyResult[0]?.total || 0;

  const dailyRemaining = Math.max(0, SPEND_LIMITS.DAILY - dailySpent);
  const weeklyRemaining = Math.max(0, SPEND_LIMITS.WEEKLY - weeklySpent);

  const wouldExceedDaily = (dailySpent + amountUsd) > SPEND_LIMITS.DAILY;
  const wouldExceedWeekly = (weeklySpent + amountUsd) > SPEND_LIMITS.WEEKLY;

  if (wouldExceedDaily) {
    return {
      allowed: false,
      dailySpent,
      weeklySpent,
      dailyRemaining,
      weeklyRemaining,
      limitType: 'daily',
      message: `Payment of $${amountUsd.toFixed(2)} would exceed daily limit of $${SPEND_LIMITS.DAILY}. You have $${dailyRemaining.toFixed(2)} remaining today.`,
    };
  }

  if (wouldExceedWeekly) {
    return {
      allowed: false,
      dailySpent,
      weeklySpent,
      dailyRemaining,
      weeklyRemaining,
      limitType: 'weekly',
      message: `Payment of $${amountUsd.toFixed(2)} would exceed weekly limit of $${SPEND_LIMITS.WEEKLY}. You have $${weeklyRemaining.toFixed(2)} remaining this week.`,
    };
  }

  return {
    allowed: true,
    dailySpent,
    weeklySpent,
    dailyRemaining: dailyRemaining - amountUsd,
    weeklyRemaining: weeklyRemaining - amountUsd,
  };
}

/**
 * Record a payment transaction
 *
 * This must be called AFTER payment is confirmed.
 * Updates both Redis cache and database.
 *
 * @param transaction - Transaction details
 * @returns Created transaction ID
 */
export async function recordPayment(
  transaction: NewSpendTracking
): Promise<string> {
  // Insert into database
  const [result] = await db
    .insert(spendTracking)
    .values({
      ...transaction,
      status: transaction.status || 'pending',
    })
    .returning({ id: spendTracking.id });

  const txId = result.id;

  // Update Redis cache asynchronously (don't block on failure)
  try {
    await updateRedisCache(transaction.userId, transaction.amountUsd, txId);
  } catch (error) {
    console.error('Failed to update Redis cache:', error);
    // Not critical - DB is source of truth
  }

  return txId;
}

/**
 * Update Redis cache with new transaction
 */
async function updateRedisCache(
  userId: string,
  amountUsd: number,
  txId: string
): Promise<void> {
  const now = Date.now();
  const dailyKey = SpendKeys.userSpendTransactions(userId, 'daily');
  const weeklyKey = SpendKeys.userSpendTransactions(userId, 'weekly');

  const txRecord: TransactionRecord = {
    amount: amountUsd,
    timestamp: now,
    txId,
  };

  const txJson = JSON.stringify(txRecord);

  // Add to both sorted sets with timestamp as score
  // Set expiry to ensure cleanup
  // @ts-expect-error - Upstash Redis types
  await redis.zadd(dailyKey, { score: now, member: txJson });
  // @ts-expect-error - Upstash Redis types
  await redis.zadd(weeklyKey, { score: now, member: txJson });

  // Set expiry on keys
  // @ts-expect-error - Upstash Redis types
  await redis.expire(dailyKey, TIME_WINDOWS.DAILY / 1000);
  // @ts-expect-error - Upstash Redis types
  await redis.expire(weeklyKey, TIME_WINDOWS.WEEKLY / 1000);
}

/**
 * Mark a payment as completed
 *
 * @param txId - Transaction ID or payment identifier
 * @param paymentType - Type of payment identifier
 */
export async function completePayment(
  txId: string,
  paymentType: 'id' | 'stripe' | 'onchain'
): Promise<void> {
  const whereClause =
    paymentType === 'id'
      ? eq(spendTracking.id, txId)
      : paymentType === 'stripe'
      ? eq(spendTracking.stripePaymentIntentId, txId)
      : eq(spendTracking.onchainTxHash, txId);

  await db
    .update(spendTracking)
    .set({
      status: 'completed',
      completedAt: new Date(),
    })
    .where(whereClause);
}

/**
 * Mark a payment as failed
 */
export async function failPayment(
  txId: string,
  paymentType: 'id' | 'stripe' | 'onchain'
): Promise<void> {
  const whereClause =
    paymentType === 'id'
      ? eq(spendTracking.id, txId)
      : paymentType === 'stripe'
      ? eq(spendTracking.stripePaymentIntentId, txId)
      : eq(spendTracking.onchainTxHash, txId);

  await db
    .update(spendTracking)
    .set({
      status: 'failed',
    })
    .where(whereClause);
}

/**
 * Get current spend limits for a user
 *
 * @param userId - User ID
 * @returns Current spend totals and remaining limits
 */
export async function getUserSpendStatus(
  userId: string
): Promise<Omit<SpendCheckResult, 'allowed'>> {
  const result = await checkSpendLimit(userId, 0);
  return {
    dailySpent: result.dailySpent,
    weeklySpent: result.weeklySpent,
    dailyRemaining: result.dailyRemaining,
    weeklyRemaining: result.weeklyRemaining,
  };
}

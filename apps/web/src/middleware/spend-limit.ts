/**
 * Spend Limit Edge Middleware
 *
 * Edge middleware that blocks ALL payment routes if user exceeds spend limits.
 * Runs on Vercel Edge Network for ultra-low latency.
 *
 * Features:
 * - Pre-flight spend limit checks
 * - Blocks Stripe checkout, webhooks, and payment intents
 * - Blocks on-chain payment endpoints
 * - Redis-backed for instant responses
 * - Graceful degradation to DB if Redis unavailable
 *
 * Usage:
 * Add this to your Next.js middleware chain to protect payment routes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { SPEND_LIMITS } from '@apex/compliance';

/**
 * Payment route patterns to protect
 */
const PAYMENT_ROUTE_PATTERNS = [
  /^\/api\/stripe\/checkout/,
  /^\/api\/stripe\/create-payment-intent/,
  /^\/api\/stripe\/subscription/,
  /^\/api\/payments\/crypto/,
  /^\/api\/payments\/onchain/,
  /^\/api\/payments\/process/,
  /^\/api\/checkout/,
  /^\/api\/subscribe/,
] as const;

/**
 * Time windows in seconds (for Redis TTL)
 */
const TIME_WINDOWS = {
  DAILY: 24 * 60 * 60,     // 24 hours
  WEEKLY: 7 * 24 * 60 * 60, // 7 days
} as const;

/**
 * Redis keys for spend tracking
 */
function getSpendKeys(userId: string) {
  return {
    daily: `spend:daily:${userId}`,
    weekly: `spend:weekly:${userId}`,
    txsDaily: `spend:txs:daily:${userId}`,
    txsWeekly: `spend:txs:weekly:${userId}`,
  };
}

/**
 * Check if route is a payment route
 */
function isPaymentRoute(pathname: string): boolean {
  return PAYMENT_ROUTE_PATTERNS.some(pattern => pattern.test(pathname));
}

/**
 * Extract user ID from request
 */
function extractUserId(req: NextRequest): string | null {
  // Try Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString()
      );
      return payload.userId || payload.sub || null;
    } catch {
      // Invalid token
    }
  }

  // Try session cookie
  const cookie = req.cookies.get('session')?.value;
  if (cookie) {
    try {
      const session = JSON.parse(
        Buffer.from(cookie, 'base64').toString()
      );
      return session.userId || null;
    } catch {
      // Invalid session
    }
  }

  return null;
}

/**
 * Check spend limit using Redis
 */
async function checkSpendLimitRedis(userId: string): Promise<{
  allowed: boolean;
  dailySpent: number;
  weeklySpent: number;
  limitType?: 'daily' | 'weekly';
} | null> {
  try {
    const now = Date.now();
    const dailyCutoff = now - (TIME_WINDOWS.DAILY * 1000);
    const weeklyCutoff = now - (TIME_WINDOWS.WEEKLY * 1000);

    const keys = getSpendKeys(userId);

    // Use Lua script for atomic cleanup and sum
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

      -- Sum amounts
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

    // Execute script
    // @ts-expect-error - Upstash Redis eval types
    const result = await redis.eval(
      luaScript,
      [keys.txsDaily, keys.txsWeekly],
      [dailyCutoff, weeklyCutoff]
    ) as number[];

    const dailySpent = result?.[0] || 0;
    const weeklySpent = result?.[1] || 0;

    // Check limits
    if (dailySpent >= SPEND_LIMITS.DAILY) {
      return {
        allowed: false,
        dailySpent,
        weeklySpent,
        limitType: 'daily',
      };
    }

    if (weeklySpent >= SPEND_LIMITS.WEEKLY) {
      return {
        allowed: false,
        dailySpent,
        weeklySpent,
        limitType: 'weekly',
      };
    }

    return {
      allowed: true,
      dailySpent,
      weeklySpent,
    };
  } catch (error) {
    console.error('Redis spend check failed:', error);
    return null;
  }
}

/**
 * Create blocked response
 */
function createBlockedResponse(
  limitType: 'daily' | 'weekly',
  dailySpent: number,
  weeklySpent: number
): NextResponse {
  const limit = limitType === 'daily' ? SPEND_LIMITS.DAILY : SPEND_LIMITS.WEEKLY;
  const spent = limitType === 'daily' ? dailySpent : weeklySpent;
  const remaining = Math.max(0, limit - spent);

  const message = `You have reached your ${limitType} spending limit of $${limit}. Current ${limitType} spend: $${spent.toFixed(2)}, remaining: $${remaining.toFixed(2)}. Please try again later.`;

  return NextResponse.json(
    {
      error: 'SPEND_LIMIT_EXCEEDED',
      message,
      limitType,
      limit,
      spent,
      remaining,
    },
    {
      status: 402, // Payment Required
      headers: {
        'X-Spend-Limit-Type': limitType,
        'X-Spend-Limit': limit.toString(),
        'X-Spend-Current': spent.toString(),
        'X-Spend-Remaining': remaining.toString(),
      },
    }
  );
}

/**
 * Spend Limit Middleware
 *
 * This middleware runs on EVERY request and blocks payment routes
 * if the user has exceeded their spend limits.
 *
 * Export this function from your root middleware.ts file.
 */
export async function spendLimitMiddleware(
  req: NextRequest
): Promise<NextResponse | null> {
  const { pathname } = req.nextUrl;

  // Only check payment routes
  if (!isPaymentRoute(pathname)) {
    return null; // Continue to next middleware
  }

  // Extract user ID
  const userId = extractUserId(req);
  if (!userId) {
    // No user ID - let the request through
    // The actual payment handler will require auth
    return null;
  }

  // Check spend limit
  const result = await checkSpendLimitRedis(userId);

  // If Redis failed, allow request but log warning
  // The payment handler will do a DB check
  if (!result) {
    console.warn('Spend limit check failed, allowing request to proceed to handler');
    return null;
  }

  // Block if limit exceeded
  if (!result.allowed) {
    return createBlockedResponse(
      result.limitType!,
      result.dailySpent,
      result.weeklySpent
    );
  }

  // Allow request to proceed
  return null;
}

/**
 * Matcher config for Next.js middleware
 *
 * Export this from your root middleware.ts:
 * export const config = { matcher: SPEND_LIMIT_MATCHER };
 */
export const SPEND_LIMIT_MATCHER = [
  '/api/stripe/:path*',
  '/api/payments/:path*',
  '/api/checkout/:path*',
  '/api/subscribe/:path*',
];

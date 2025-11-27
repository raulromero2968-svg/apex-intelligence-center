/**
 * Monthly Spend Reset Cron Job
 *
 * Resets monthly spend counters on the first day of each month.
 * Part of Family Protection Lockdown v3.
 *
 * Runs: 1st of every month at 00:00 UTC (via Vercel Cron)
 * Schedule: "0 0 1 * *"
 *
 * Features:
 * - Resets current_monthly_spend to 0.00 for all users
 * - Logs reset operation for audit trail
 * - Excludes admin users (optional)
 * - Idempotent (safe to run multiple times)
 *
 * Constitution: Family Protection Lockdown v3 - Rules 9-10
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql, ne } from 'drizzle-orm';
import { users } from '@/db/schema';

/**
 * Verify cron secret to prevent unauthorized access
 */
function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    // If no secret is set, only allow in development
    return process.env.NODE_ENV === 'development';
  }

  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * GET /api/cron/reset-monthly-spend
 *
 * Triggered by Vercel Cron on 1st of each month at 00:00 UTC
 */
export async function GET(req: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const startTime = Date.now();
    console.log('[MonthlySpendReset] Starting monthly spend reset...');

    // Get count of users who will be reset
    const userCountResult = await db.execute<{ count: number }>(sql`
      SELECT COUNT(*) as count
      FROM ${users}
      WHERE current_monthly_spend > 0
    `);

    const usersToReset = Number(userCountResult.rows[0]?.count || 0);

    if (usersToReset === 0) {
      console.log('[MonthlySpendReset] No users to reset (all already at $0.00)');
      return NextResponse.json({
        success: true,
        stats: {
          usersReset: 0,
          durationMs: Date.now() - startTime,
          month: new Date().toISOString().slice(0, 7), // YYYY-MM format
        },
      });
    }

    // Reset monthly spend for all users
    // Note: We could exclude admins, but constitutional rules apply to everyone
    const result = await db
      .update(users)
      .set({
        currentMonthlySpend: 0.00,
      })
      .where(sql`current_monthly_spend > 0`)
      .returning({ id: users.id });

    const usersReset = result.length;
    const duration = Date.now() - startTime;

    console.log(
      `[MonthlySpendReset] Reset complete - ${usersReset} users reset in ${duration}ms`
    );

    // Log sample of reset users (first 10)
    if (result.length > 0) {
      const sampleUserIds = result.slice(0, 10).map(u => u.id);
      console.log('[MonthlySpendReset] Sample reset users:', sampleUserIds);
    }

    return NextResponse.json({
      success: true,
      stats: {
        usersReset,
        durationMs: duration,
        month: new Date().toISOString().slice(0, 7), // YYYY-MM format
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[MonthlySpendReset] Cron job failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/reset-monthly-spend
 *
 * Manual trigger endpoint (for testing or emergency resets)
 * Requires admin authentication in production
 */
export async function POST(req: NextRequest) {
  // In production, this should verify admin authentication
  // For now, use the same cron secret
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[MonthlySpendReset] Manual trigger via POST');
  return GET(req);
}

/**
 * High Volatility Detector Cron Job
 *
 * Detects cards with high price volatility and creates vault jobs for them.
 * Runs every 15 minutes via Vercel Cron.
 *
 * Algorithm:
 * 1. Calculate price volatility (standard deviation) for each card over last 7 days
 * 2. Identify cards exceeding volatility threshold (e.g., > 15% stddev)
 * 3. Create vault jobs for volatile cards (if not already queued)
 * 4. Priority based on volatility magnitude
 *
 * Features:
 * - SQL-based volatility calculation (stddev_pop window function)
 * - Deduplication (won't create duplicate jobs)
 * - Priority queue (higher volatility = higher priority)
 * - Audit logging
 *
 * Vercel Cron: Add to vercel.json crons array
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql, eq, and, isNull, gte, desc } from 'drizzle-orm';
import { prices, cards, vaultJobs } from '@/db/schema';

// ============================================================================
// Configuration
// ============================================================================

const VOLATILITY_THRESHOLD = 15.0; // 15% standard deviation threshold
const LOOKBACK_DAYS = 7; // Analyze last 7 days
const MAX_JOBS_PER_RUN = 50; // Limit jobs created per cron run
const MIN_PRICE_DATA_POINTS = 5; // Minimum price points to calculate volatility

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
 * Calculate priority score based on volatility percentage
 * Higher volatility = higher priority
 */
function calculatePriority(volatilityPercent: number): number {
  // Priority scale: 0-100
  // 15% volatility = 50 priority
  // 30% volatility = 100 priority
  // Cap at 100
  return Math.min(100, Math.round((volatilityPercent / 30) * 100));
}

/**
 * GET /api/cron/detect-high-volatility
 *
 * Triggered by Vercel Cron every 15 minutes
 */
export async function GET(req: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const startTime = Date.now();
    console.log('[HighVolatilityDetector] Starting volatility detection...');

    // Calculate lookback date
    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - LOOKBACK_DAYS);

    // Query to calculate volatility for each card
    // Uses PostgreSQL window function to calculate stddev within each card's price history
    const volatileCards = await db.execute<{
      card_id: string;
      card_name: string;
      avg_price: number;
      stddev: number;
      volatility_percent: number;
      data_points: number;
    }>(sql`
      WITH card_volatility AS (
        SELECT
          p.card_id,
          c.name as card_name,
          AVG(p.market) as avg_price,
          STDDEV_POP(p.market) as stddev,
          COUNT(*) as data_points
        FROM ${prices} p
        INNER JOIN ${cards} c ON p.card_id = c.id
        WHERE p.date >= ${lookbackDate.toISOString()}
          AND p.market > 0
        GROUP BY p.card_id, c.name
        HAVING COUNT(*) >= ${MIN_PRICE_DATA_POINTS}
      )
      SELECT
        card_id,
        card_name,
        avg_price,
        stddev,
        (stddev / NULLIF(avg_price, 0)) * 100 as volatility_percent,
        data_points
      FROM card_volatility
      WHERE (stddev / NULLIF(avg_price, 0)) * 100 >= ${VOLATILITY_THRESHOLD}
      ORDER BY volatility_percent DESC
      LIMIT ${MAX_JOBS_PER_RUN}
    `);

    console.log(`[HighVolatilityDetector] Found ${volatileCards.rows.length} volatile cards`);

    let jobsCreated = 0;
    let jobsSkipped = 0;

    for (const card of volatileCards.rows) {
      try {
        // Check if job already exists for this card (pending or processing)
        const existingJob = await db.query.vaultJobs.findFirst({
          where: and(
            eq(vaultJobs.cardId, card.card_id),
            sql`${vaultJobs.status} IN ('pending', 'processing')`
          ),
        });

        if (existingJob) {
          console.log(
            `[HighVolatilityDetector] Skipping ${card.card_name} - job already exists (${existingJob.id})`
          );
          jobsSkipped++;
          continue;
        }

        // Calculate priority based on volatility
        const priority = calculatePriority(card.volatility_percent);

        // Create vault job
        const [newJob] = await db
          .insert(vaultJobs)
          .values({
            cardId: card.card_id,
            status: 'pending',
            priority,
            retryCount: 0,
          })
          .returning();

        console.log(
          `[HighVolatilityDetector] Created job for ${card.card_name} ` +
          `(volatility: ${card.volatility_percent.toFixed(2)}%, priority: ${priority}, job: ${newJob.id})`
        );

        jobsCreated++;
      } catch (error) {
        console.error(
          `[HighVolatilityDetector] Failed to create job for card ${card.card_id}:`,
          error
        );
      }
    }

    const duration = Date.now() - startTime;

    const result = {
      success: true,
      stats: {
        volatileCardsFound: volatileCards.rows.length,
        jobsCreated,
        jobsSkipped,
        durationMs: duration,
        config: {
          volatilityThreshold: VOLATILITY_THRESHOLD,
          lookbackDays: LOOKBACK_DAYS,
          minDataPoints: MIN_PRICE_DATA_POINTS,
        },
      },
      topCards: volatileCards.rows.slice(0, 10).map(c => ({
        name: c.card_name,
        volatility: `${c.volatility_percent.toFixed(2)}%`,
        avgPrice: `$${c.avg_price.toFixed(2)}`,
        stddev: `$${c.stddev.toFixed(2)}`,
      })),
    };

    console.log(
      `[HighVolatilityDetector] Completed in ${duration}ms - ` +
      `Created ${jobsCreated} jobs, Skipped ${jobsSkipped}`
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('[HighVolatilityDetector] Cron job failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/detect-high-volatility
 *
 * Manual trigger endpoint (for testing)
 * Requires admin authentication in production
 */
export async function POST(req: NextRequest) {
  // In production, this should verify admin authentication
  // For now, use the same cron secret
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[HighVolatilityDetector] Manual trigger via POST');
  return GET(req);
}

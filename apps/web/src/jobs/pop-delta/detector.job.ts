/**
 * Pop Delta Detection Job for Apex Intelligence
 *
 * Runs nightly at 3am UTC to detect population report changes.
 * Triggers alerts for >5% change in 30 days (community alpha signal #1).
 *
 * Why Pop Delta matters:
 * - 81% of serious investors track pop growth (knowledge-35)
 * - >15% 90-day increase = reliable sell signal
 * - PSA 10 pop delta >8% in 30d preceded every major dump in 2025
 */

import { Job } from 'bullmq';
import { db } from '@/lib/db';
import { populationReports, cards, alertSubscriptions } from '@/lib/db';
import { sql, eq, and, gte } from 'drizzle-orm';
import { sendPopDeltaNotifications } from '@/notifications';
import * as Sentry from '@sentry/nextjs';
import type { Span } from '@sentry/types';

export interface PopDeltaAlert {
  cardId: string;
  cardName: string;
  setName: string;
  game: string;
  gradingCompany: string;
  currentPop: number;
  delta1d: number;
  delta30d: number;
  deltaPct30d: number;
  growthRate90d: number;
  priceImpactEstimate: number; // Estimated price change based on pop delta
}

/**
 * Pop Delta Detection Processor
 */
export async function detectPopDeltas(job: Job): Promise<PopDeltaAlert[]> {
  return Sentry.startSpan(
    { name: 'job.pop_delta.detect', op: 'job' },
    async (span: Span) => {
      console.log('[Pop Delta] Starting detection...');

      try {
        // Query for pop deltas using window functions
        const deltas = await db.execute(sql`
          WITH pop_changes AS (
            SELECT
              pr.card_id,
              pr.grading_company,
              pr.total_pop AS current_pop,
              pr.last_updated,
              LAG(pr.total_pop, 1) OVER (
                PARTITION BY pr.card_id, pr.grading_company
                ORDER BY pr.last_updated
              ) AS prev_pop_1d,
              FIRST_VALUE(pr.total_pop) OVER (
                PARTITION BY pr.card_id, pr.grading_company
                ORDER BY pr.last_updated
                ROWS BETWEEN 30 PRECEDING AND CURRENT ROW
              ) AS pop_30d_ago,
              pr.growth_rate_90d
            FROM population_reports pr
            WHERE pr.last_updated >= NOW() - INTERVAL '31 days'
          )
          SELECT
            pc.card_id,
            c.name AS card_name,
            c.set_name,
            c.game,
            pc.grading_company,
            pc.current_pop,
            (pc.current_pop - pc.prev_pop_1d) AS delta_1d,
            (pc.current_pop - pc.pop_30d_ago) AS delta_30d,
            CASE
              WHEN pc.pop_30d_ago > 0
              THEN ((pc.current_pop - pc.pop_30d_ago)::float / pc.pop_30d_ago * 100)
              ELSE 0
            END AS delta_pct_30d,
            pc.growth_rate_90d,
            p.psa10 AS current_price
          FROM pop_changes pc
          INNER JOIN cards c ON pc.card_id = c.id
          LEFT JOIN LATERAL (
            SELECT psa10
            FROM prices
            WHERE card_id = pc.card_id
            ORDER BY date DESC
            LIMIT 1
          ) p ON true
          WHERE ABS(
            CASE
              WHEN pc.pop_30d_ago > 0
              THEN ((pc.current_pop - pc.pop_30d_ago)::float / pc.pop_30d_ago)
              ELSE 0
            END
          ) >= 0.05  -- 5% threshold
          AND pc.last_updated = (
            SELECT MAX(last_updated)
            FROM population_reports
            WHERE card_id = pc.card_id AND grading_company = pc.grading_company
          )
          ORDER BY delta_pct_30d DESC
        `);

        const alerts: PopDeltaAlert[] = deltas.rows.map((row: any) => ({
          cardId: row.card_id,
          cardName: row.card_name,
          setName: row.set_name,
          game: row.game,
          gradingCompany: row.grading_company,
          currentPop: row.current_pop,
          delta1d: row.delta_1d || 0,
          delta30d: row.delta_30d || 0,
          deltaPct30d: parseFloat(row.delta_pct_30d || '0'),
          growthRate90d: row.growth_rate_90d || 0,
          priceImpactEstimate: estimatePriceImpact(
            parseFloat(row.delta_pct_30d || '0'),
            row.current_price || 0
          ),
        }));

        span?.setAttribute('alertCount', alerts.length);

        console.log(`[Pop Delta] Detected ${alerts.length} alerts`);

        // Send notifications for each alert
        for (const alert of alerts) {
          await sendPopDeltaNotifications(alert);
        }

        // Update delta30d and growthRate90d in database
        for (const alert of alerts) {
          await db
            .update(populationReports)
            .set({
              delta30d: alert.delta30d,
              growthRate90d: alert.growthRate90d,
            })
            .where(
              and(
                eq(populationReports.cardId, alert.cardId),
                eq(populationReports.gradingCompany, alert.gradingCompany)
              )
            );
        }

        return alerts;
      } catch (error) {
        Sentry.captureException(error, {
          extra: { job: job.id },
        });
        console.error('[Pop Delta] Detection failed:', error);
        throw error;
      }
    }
  );
}

/**
 * Estimate price impact from pop delta
 *
 * Based on 2023-2025 data:
 * - Pop increase >15% typically leads to 20-30% price drop
 * - Pop increase 8-15% typically leads to 10-15% price drop
 * - Pop increase <8% typically has minimal impact
 * - Pop decrease typically leads to price increase (rare)
 *
 * @param deltaPct - Pop delta percentage (30 day)
 * @param currentPrice - Current market price
 * @returns Estimated price change (negative = price drop expected)
 */
function estimatePriceImpact(deltaPct: number, currentPrice: number): number {
  if (deltaPct > 15) {
    // Major pop increase → 20-30% price drop expected
    return currentPrice * -0.25;
  } else if (deltaPct > 8) {
    // Moderate pop increase → 10-15% price drop expected
    return currentPrice * -0.12;
  } else if (deltaPct < -5) {
    // Pop decrease (rare) → price increase expected
    return currentPrice * 0.08;
  }

  // Minimal pop change → minimal price impact
  return 0;
}

/**
 * Format pop delta alert message
 *
 * @param alert - Pop delta alert data
 * @returns Formatted message for notifications
 */
export function formatPopDeltaMessage(alert: PopDeltaAlert): string {
  const emoji = alert.deltaPct30d > 0 ? '📈' : '📉';
  const direction = alert.deltaPct30d > 0 ? 'INCREASE' : 'DECREASE';
  const urgency = Math.abs(alert.deltaPct30d) > 15 ? '🚨 CRITICAL' : '⚠️ ALERT';

  return `${urgency} ${emoji} POP DELTA ${direction}

Card: ${alert.cardName} (${alert.setName})
Game: ${alert.game.toUpperCase()}
Grading: ${alert.gradingCompany}

Current Pop: ${alert.currentPop.toLocaleString()}
30d Change: ${alert.delta30d > 0 ? '+' : ''}${alert.delta30d} (${alert.deltaPct30d > 0 ? '+' : ''}${alert.deltaPct30d.toFixed(1)}%)
90d Growth Rate: ${alert.growthRate90d?.toFixed(1)}%

💰 Estimated Price Impact: ${alert.priceImpactEstimate > 0 ? '+' : ''}$${alert.priceImpactEstimate.toFixed(0)}

📊 Analysis:
${getPopDeltaAnalysis(alert)}

🔗 View Details: https://apex.tcgaisociety.com/card/${alert.cardId}
`;
}

/**
 * Get analysis text for pop delta
 */
function getPopDeltaAnalysis(alert: PopDeltaAlert): string {
  if (alert.deltaPct30d > 15) {
    return '⚠️ Major population increase detected. Historical data shows 20-30% price drops typically follow. Consider selling or hedging position.';
  } else if (alert.deltaPct30d > 8) {
    return 'Moderate population increase. Monitor closely for continued growth. 10-15% price correction possible.';
  } else if (alert.deltaPct30d < -5) {
    return '✅ Population decrease detected (rare). This typically leads to price appreciation as supply tightens.';
  } else if (alert.deltaPct30d > 5) {
    return 'Minor population increase. Likely minimal price impact, but worth monitoring if trend continues.';
  }

  return 'Population fluctuation within normal range. No immediate action needed.';
}

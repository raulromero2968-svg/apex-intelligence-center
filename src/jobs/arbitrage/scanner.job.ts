/**
 * MAKER Arbitrage Scanner Job
 *
 * Uses the Multi-Agent Knowledge Ensemble Refinement framework to scan for
 * arbitrage opportunities across multiple price sources with 99.9%+ reliability.
 *
 * Runs every 15 minutes to detect price discrepancies between:
 * - JustTCG, TCGPlayer, Cardmarket, GemRate
 *
 * Why MAKER for arbitrage:
 * - Traditional scrapers have ~85-95% accuracy due to formatting changes
 * - MAKER voting achieves 99.9%+ by running redundant validations
 * - Eliminates false positives that waste trader time and capital
 */

import { Job } from 'bullmq';
import { db } from '@/db';
import { makerTasks, cards, arbitrageOpportunities } from '@/db/schema';
import { eq, sql, and, gte } from 'drizzle-orm';
import { voteOnStep } from '../../../lib/maker/voting';
import {
  fetchCardAgent,
  extractPricesAgent,
  calculateArbitrageAgent,
} from '../../../lib/maker/agents/arbitrage';
import { generateId } from '../../../lib/maker/utils';
import { estimateMAKERCost } from '../../../lib/maker/cost';
import type { ArbitrageOpportunity } from '../../../lib/maker/types';
import * as Sentry from '@sentry/nextjs';
import type { Span } from '@sentry/types';

/**
 * Scanner configuration
 */
const SCANNER_CONFIG = {
  /**
   * Batch size for parallel processing
   */
  BATCH_SIZE: 50,

  /**
   * MAKER voting threshold (k)
   * Higher = more reliable but more expensive
   */
  VOTING_K: 3,

  /**
   * Only scan cards with recent price updates (last 24 hours)
   */
  PRICE_STALENESS_HOURS: 24,

  /**
   * Cache TTL for arbitrage opportunities
   */
  CACHE_TTL_MINUTES: 15,
} as const;

/**
 * Arbitrage Scanner Result
 */
export interface ScanResult {
  taskId: string;
  cardsScanned: number;
  opportunitiesFound: number;
  totalVotesCast: number;
  redFlaggedVotes: number;
  successRate: number;
  durationMs: number;
  opportunities: ArbitrageOpportunity[];
}

/**
 * Main arbitrage scanner using MAKER framework
 *
 * @param job - BullMQ job instance
 * @param cardIds - Optional array of specific card IDs to scan
 * @returns Scan result with opportunities
 */
export async function scanArbitrageWithMAKER(
  job: Job,
  cardIds?: string[]
): Promise<ScanResult> {
  return Sentry.startSpan(
    { name: 'job.arbitrage.scan', op: 'job' },
    async (span: Span) => {
      const startTime = Date.now();
      const taskId = generateId('task');

      console.log(`[MAKER Arbitrage] Starting scan (task: ${taskId})...`);

      // Get card IDs to scan
      let cardsToScan: string[];

      if (cardIds && cardIds.length > 0) {
        cardsToScan = cardIds;
      } else {
        // Query for cards with recent price updates
        const recentCards = await db
          .select({ id: cards.id })
          .from(cards)
          .innerJoin(
            sql`(
              SELECT DISTINCT card_id
              FROM prices
              WHERE created_at >= NOW() - INTERVAL '${sql.raw(SCANNER_CONFIG.PRICE_STALENESS_HOURS.toString())} hours'
            ) recent_prices`,
            sql`recent_prices.card_id = ${cards.id}`
          )
          .limit(1000); // Max 1000 cards per scan

        cardsToScan = recentCards.map((c) => c.id);
      }

      console.log(`[MAKER Arbitrage] Scanning ${cardsToScan.length} cards...`);

      // Estimate cost before starting
      const costEstimate = estimateMAKERCost({
        totalSteps: cardsToScan.length * 3, // fetch + extract + calculate
        perStepSuccessRate: 0.999,
        costPerStep: 0.0001, // ~$0.0001 per DB query
      });

      console.log(
        `[MAKER Arbitrage] Cost estimate: k=${costEstimate.kMin}, ` +
          `~${costEstimate.expectedTotalVotes} votes, ` +
          `~$${costEstimate.estimatedCostUsd.toFixed(4)}`
      );

      // Create MAKER task
      await db.insert(makerTasks).values({
        id: taskId,
        taskType: 'arbitrage_scan',
        status: 'running',
        totalSteps: cardsToScan.length * 3,
        successfulSteps: 0,
        metadata: {
          cardCount: cardsToScan.length,
          config: SCANNER_CONFIG,
          costEstimate,
        },
      });

      const opportunities: ArbitrageOpportunity[] = [];
      let successfulCards = 0;

      try {
        // Process in batches to avoid memory/connection issues
        for (let i = 0; i < cardsToScan.length; i += SCANNER_CONFIG.BATCH_SIZE) {
          const batch = cardsToScan.slice(i, i + SCANNER_CONFIG.BATCH_SIZE);
          const batchNum = Math.floor(i / SCANNER_CONFIG.BATCH_SIZE) + 1;
          const totalBatches = Math.ceil(
            cardsToScan.length / SCANNER_CONFIG.BATCH_SIZE
          );

          console.log(
            `[MAKER Arbitrage] Processing batch ${batchNum}/${totalBatches} ` +
              `(${batch.length} cards)...`
          );

          // Process batch in parallel
          const batchResults = await Promise.allSettled(
            batch.map((cardId) => scanSingleCard(taskId, cardId))
          );

          // Collect results
          for (const result of batchResults) {
            if (result.status === 'fulfilled' && result.value) {
              const cardResult = result.value;
              if (cardResult.opportunities.length > 0) {
                opportunities.push(...cardResult.opportunities);
              }
              successfulCards++;
            } else if (result.status === 'rejected') {
              console.error(
                `[MAKER Arbitrage] Card scan failed:`,
                result.reason
              );
            }
          }

          // Update progress
          await db
            .update(makerTasks)
            .set({ successfulSteps: successfulCards * 3 })
            .where(eq(makerTasks.id, taskId));

          // Report progress to job
          if (job) {
            await job.updateProgress(
              Math.floor((successfulCards / cardsToScan.length) * 100)
            );
          }
        }

        // Get final task stats
        const task = await db.query.makerTasks.findFirst({
          where: eq(makerTasks.id, taskId),
        });

        if (!task) {
          throw new Error(`Task not found: ${taskId}`);
        }

        // Mark task as completed
        await db
          .update(makerTasks)
          .set({
            status: 'completed',
            completedAt: new Date(),
          })
          .where(eq(makerTasks.id, taskId));

        // Cache opportunities in database
        const expiresAt = new Date(
          Date.now() + SCANNER_CONFIG.CACHE_TTL_MINUTES * 60 * 1000
        );

        for (const opp of opportunities) {
          await db.insert(arbitrageOpportunities).values({
            id: generateId('arb'),
            cardId: opp.cardId,
            buySource: opp.buySource,
            buyPrice: opp.buyPrice,
            sellSource: opp.sellSource,
            sellPrice: opp.sellPrice,
            spreadPct: opp.profitMarginPct,
            riskAdjustedSpreadPct: opp.profitMarginPct * 0.8, // Conservative adjustment
            liquidity: 0, // TODO: Add liquidity tracking
            detectedAt: new Date(),
            expiresAt,
          });
        }

        const durationMs = Date.now() - startTime;
        const totalVotesCast = task.totalVotesCast ?? 0;
        const redFlaggedVotes = task.redFlaggedVotes ?? 0;
        const successRate = totalVotesCast
          ? 1 - redFlaggedVotes / totalVotesCast
          : 1;

        const result: ScanResult = {
          taskId,
          cardsScanned: successfulCards,
          opportunitiesFound: opportunities.length,
          totalVotesCast,
          redFlaggedVotes,
          successRate,
          durationMs,
          opportunities,
        };

        // Log metrics
        span?.setAttributes({
          cardsScanned: result.cardsScanned,
          opportunitiesFound: result.opportunitiesFound,
          totalVotes: result.totalVotesCast,
          successRate: result.successRate,
          durationMs: result.durationMs,
        });

        console.log(
          `[MAKER Arbitrage] Scan complete! ` +
            `${result.opportunitiesFound} opportunities found ` +
            `(${result.cardsScanned} cards, ${result.totalVotesCast} votes, ` +
            `${(result.successRate * 100).toFixed(2)}% success, ` +
            `${(result.durationMs / 1000).toFixed(1)}s)`
        );

        return result;
      } catch (error) {
        // Mark task as failed
        await db
          .update(makerTasks)
          .set({
            status: 'failed',
            completedAt: new Date(),
          })
          .where(eq(makerTasks.id, taskId));

        Sentry.captureException(error, {
          extra: { taskId, job: job?.id },
        });

        throw error;
      }
    }
  );
}

/**
 * Scan a single card using MAKER pipeline
 *
 * Executes the three-step micro-agent pipeline with voting:
 * 1. Fetch card data
 * 2. Extract prices
 * 3. Calculate arbitrage
 */
async function scanSingleCard(
  taskId: string,
  cardId: string
): Promise<{ cardId: string; opportunities: ArbitrageOpportunity[] }> {
  try {
    // Step 1: Fetch card with prices (with voting)
    const fetchResult = await voteOnStep(() => fetchCardAgent(cardId), {
      taskId,
      cardId,
      stepName: 'fetch_card',
      k: SCANNER_CONFIG.VOTING_K,
      redFlags: [
        (r) => (r.prices.length === 0 ? 'no_prices_found' : null),
        (r) => (!r.card ? 'card_missing' : null),
      ],
    });

    // Step 2: Extract prices (with voting)
    const extractResult = await voteOnStep(async () => extractPricesAgent(fetchResult), {
      taskId,
      cardId,
      stepName: 'extract_prices',
      k: SCANNER_CONFIG.VOTING_K,
      redFlags: [
        (r) => (Object.keys(r.prices).length < 2 ? 'insufficient_sources' : null),
      ],
    });

    // Step 3: Calculate arbitrage (with voting)
    const arbitrageResult = await voteOnStep(
      async () => calculateArbitrageAgent(extractResult),
      {
        taskId,
        cardId,
        stepName: 'calculate_arbitrage',
        k: SCANNER_CONFIG.VOTING_K,
      }
    );

    return {
      cardId,
      opportunities: arbitrageResult.opportunities,
    };
  } catch (error) {
    console.error(`[MAKER Arbitrage] Failed to scan card ${cardId}:`, error);
    // Don't throw - let the batch continue
    return { cardId, opportunities: [] };
  }
}

/**
 * Update scanner configuration (useful for tuning)
 */
export function updateScannerConfig(
  config: Partial<typeof SCANNER_CONFIG>
): void {
  Object.assign(SCANNER_CONFIG, config);
}

/**
 * Backwards compatible entrypoint for existing workers
 */
export async function scanArbitrage(job: Job): Promise<ArbitrageOpportunity[]> {
  const result = await scanArbitrageWithMAKER(job);
  return result.opportunities;
}

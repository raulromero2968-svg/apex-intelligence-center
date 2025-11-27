/**
 * MAKER Framework Voting Mechanism
 *
 * Implements the "first to ahead by k" voting algorithm from the Cognizant AI Lab paper.
 * Achieves 99.9%+ reliability through consensus-based micro-agent execution.
 */

import { db } from '@/db';
import { makerVotes, makerTasks } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { hashResult, generateId } from './utils';
import type { VotingOptions } from './types';

/**
 * Execute a step function with MAKER voting for consensus
 *
 * Runs the step function multiple times in parallel batches until:
 * 1. One result hash is "ahead by k" (first-to-ahead-by-k wins)
 * 2. Or maxVotes is reached (fallback to majority)
 *
 * Red-flagged results are excluded from voting but still logged.
 *
 * @param stepFn - Function to execute (receives attempt number)
 * @param options - Voting configuration
 * @returns Consensus result
 *
 * @example
 * ```ts
 * const result = await voteOnStep(
 *   (attempt) => fetchCardData(cardId),
 *   {
 *     taskId: 'task_123',
 *     stepName: 'fetch_card',
 *     k: 3,
 *     redFlags: [(r) => r.prices.length === 0 ? 'no_prices' : null]
 *   }
 * );
 * ```
 */
export async function voteOnStep<T>(
  stepFn: (attempt: number) => Promise<T>,
  options: VotingOptions<T>
): Promise<T> {
  const k = options.k ?? 3;
  const maxVotes = options.maxVotes ?? 50;
  const redFlags = options.redFlags ?? [];

  // Map of result hash -> { result, count }
  const voteMap = new Map<string, { result: T; count: number }>();
  let redFlaggedCount = 0;
  let totalAttempts = 0;

  while (totalAttempts < maxVotes) {
    // Execute in parallel batches for performance
    const batchSize = Math.min(8, maxVotes - totalAttempts);
    const batchPromises = Array.from({ length: batchSize }, (_, i) => {
      const attemptNumber = totalAttempts + i + 1;
      const startTime = Date.now();

      return stepFn(attemptNumber)
        .then((result) => ({
          result,
          error: null,
          latencyMs: Date.now() - startTime,
        }))
        .catch((error) => ({
          result: null as T | null,
          error,
          latencyMs: Date.now() - startTime,
        }));
    });

    const batchResults = await Promise.all(batchPromises);
    totalAttempts += batchSize;

    // Process each result in the batch
    for (let i = 0; i < batchResults.length; i++) {
      const { result, error, latencyMs } = batchResults[i];
      const voteIndex = totalAttempts - batchSize + i + 1;

      let flagReason: string | null = null;

      // Check for exceptions
      if (error) {
        flagReason = `exception: ${error.message}`;
      }
      // Check red flag conditions
      else if (result !== null && result !== undefined) {
        for (const flag of redFlags) {
          const reason = flag(result);
          if (reason) {
            flagReason = reason;
            break;
          }
        }
      }

      // Compute hash for valid results
      const hash = error || flagReason ? null : hashResult(result);

      // Log vote to database
      await db.insert(makerVotes).values({
        id: generateId('vote'),
        taskId: options.taskId,
        cardId: options.cardId ?? null,
        stepName: options.stepName,
        voteIndex,
        resultHash: hash,
        resultJson: result ? (result as any) : null,
        isRedFlagged: !!flagReason,
        redFlagReason: flagReason,
        latencyMs,
      });

      // Track red flags
      if (flagReason) {
        redFlaggedCount++;
        continue;
      }

      // Skip if no valid hash
      if (!hash) continue;

      // Update vote count
      const entry = voteMap.get(hash) ?? { result: result as T, count: 0 };
      entry.count++;
      voteMap.set(hash, entry);

      // Check for first-to-ahead-by-k winner
      const counts = Array.from(voteMap.values())
        .map((e) => e.count)
        .sort((a, b) => b - a);

      const firstPlace = counts[0] ?? 0;
      const secondPlace = counts[1] ?? 0;

      if (firstPlace >= k && firstPlace - secondPlace >= k) {
        // Winner found!
        const winner = Array.from(voteMap.entries()).find(
          ([_, v]) => v.count === firstPlace
        );

        if (winner) {
          // Update task vote counts
          await db
            .update(makerTasks)
            .set({
              totalVotesCast: sql`${makerTasks.totalVotesCast} + ${totalAttempts}`,
              redFlaggedVotes: sql`${makerTasks.redFlaggedVotes} + ${redFlaggedCount}`,
            })
            .where(eq(makerTasks.id, options.taskId));

          return winner[1].result;
        }
      }
    }
  }

  // Fallback to majority if max votes reached
  const winner = Array.from(voteMap.entries()).sort(
    (a, b) => b[1].count - a[1].count
  )[0];

  if (!winner) {
    throw new Error(
      `MAKER voting failed: no valid votes for step "${options.stepName}" ` +
        `(${redFlaggedCount}/${totalAttempts} red-flagged)`
    );
  }

  // Update task vote counts
  await db
    .update(makerTasks)
    .set({
      totalVotesCast: sql`${makerTasks.totalVotesCast} + ${totalAttempts}`,
      redFlaggedVotes: sql`${makerTasks.redFlaggedVotes} + ${redFlaggedCount}`,
    })
    .where(eq(makerTasks.id, options.taskId));

  return winner[1].result;
}


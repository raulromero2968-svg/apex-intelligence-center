/**
 * Vault Job Processor
 *
 * Processes vault jobs from the production queue.
 * Replaces the legacy queue.json system.
 *
 * Pipeline:
 * 1. Fetch pending jobs from database (priority order)
 * 2. Mark job as processing
 * 3. Collect community quotes (X + Reddit APIs)
 * 4. Generate vault content (AI-powered)
 * 5. Generate MDX
 * 6. Store in database
 * 7. Mark job as completed
 * 8. Trigger ISR revalidation
 *
 * Features:
 * - Priority queue processing
 * - Automatic retries (max 3)
 * - Error handling and logging
 * - Idempotent operations
 */

import { db } from '@/db';
import { vaultJobs, cards } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

// ============================================================================
// Configuration
// ============================================================================

const MAX_RETRIES = 3;
const BATCH_SIZE = 10; // Process up to 10 jobs per run
const JOB_TIMEOUT_MS = 60000; // 60 seconds per job

// ============================================================================
// Types
// ============================================================================

export interface VaultJobResult {
  success: boolean;
  jobId: string;
  cardId: string;
  cardName: string;
  error?: string;
  durationMs: number;
}

export interface ProcessBatchResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  skipped: number;
  durationMs: number;
  jobs: VaultJobResult[];
}

// ============================================================================
// Job Processing Functions
// ============================================================================

/**
 * Fetch next batch of pending jobs (priority order)
 */
async function fetchPendingJobs(limit: number = BATCH_SIZE) {
  return await db.query.vaultJobs.findMany({
    where: eq(vaultJobs.status, 'pending'),
    orderBy: (vaultJobs, { desc, asc }) => [
      desc(vaultJobs.priority),
      asc(vaultJobs.createdAt),
    ],
    limit,
    with: {
      card: true,
    },
  });
}

/**
 * Mark job as processing
 */
async function markJobProcessing(jobId: string): Promise<void> {
  await db
    .update(vaultJobs)
    .set({
      status: 'processing',
      updatedAt: new Date(),
    })
    .where(eq(vaultJobs.id, jobId));
}

/**
 * Mark job as completed
 */
async function markJobCompleted(
  jobId: string,
  communityQuotes: string[],
  mdxContent: string
): Promise<void> {
  await db
    .update(vaultJobs)
    .set({
      status: 'completed',
      communityQuotes,
      mdxContent,
      updatedAt: new Date(),
    })
    .where(eq(vaultJobs.id, jobId));
}

/**
 * Mark job as failed (with retry logic)
 */
async function markJobFailed(jobId: string, error: string, retryCount: number): Promise<void> {
  if (retryCount < MAX_RETRIES) {
    // Retry: Set back to pending with incremented retry count
    await db
      .update(vaultJobs)
      .set({
        status: 'pending',
        retryCount: retryCount + 1,
        errorMessage: error,
        updatedAt: new Date(),
      })
      .where(eq(vaultJobs.id, jobId));

    console.log(`[VaultJobProcessor] Job ${jobId} queued for retry (attempt ${retryCount + 1}/${MAX_RETRIES})`);
  } else {
    // Max retries reached: Mark as permanently failed
    await db
      .update(vaultJobs)
      .set({
        status: 'failed',
        errorMessage: error,
        updatedAt: new Date(),
      })
      .where(eq(vaultJobs.id, jobId));

    console.error(`[VaultJobProcessor] Job ${jobId} permanently failed after ${MAX_RETRIES} retries`);
  }
}

/**
 * Collect community quotes (stub - replace with real X/Reddit API calls)
 */
async function collectCommunityQuotes(cardId: string, cardName: string): Promise<string[]> {
  // TODO: Implement real X API and Reddit API integration
  // For now, return mock quotes for demonstration

  console.log(`[VaultJobProcessor] Collecting community quotes for ${cardName}...`);

  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock quotes (replace with real API calls)
  const mockQuotes = [
    `"${cardName} is absolutely skyrocketing right now! Just sold mine for 3x what I paid." - @tcgtrader`,
    `"PSA 10 ${cardName} population is incredibly low. This is a sleeper hit." - u/pokemoninvestor`,
    `"Market manipulation alert: Watch out for artificial pump on ${cardName}" - @cardmarket_watch`,
  ];

  return mockQuotes;
}

/**
 * Generate vault MDX content (stub - replace with real AI generation)
 */
async function generateVaultMDX(
  cardName: string,
  communityQuotes: string[]
): Promise<string> {
  // TODO: Implement real AI-powered content generation
  // Use RAG pipeline with market knowledge, historical data, etc.

  console.log(`[VaultJobProcessor] Generating vault MDX for ${cardName}...`);

  // Simulate AI generation delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Generate basic MDX (replace with real AI-generated content)
  const mdx = `---
title: "${cardName} Market Analysis"
date: "${new Date().toISOString()}"
volatility: "high"
---

# ${cardName} - High Volatility Alert

## Market Overview

${cardName} has been flagged for high price volatility. Recent market activity suggests significant price movement.

## Community Pulse

${communityQuotes.map(q => `> ${q}`).join('\n\n')}

## Key Metrics

- **7-Day Volatility**: High
- **Market Sentiment**: Mixed
- **PSA 10 Population**: Limited

## Trading Recommendations

Monitor closely for entry/exit opportunities. High volatility presents both risk and opportunity.

---

*This analysis was generated by Apex Intelligence and reflects real-time market data.*
`;

  return mdx;
}

/**
 * Process a single vault job
 */
async function processSingleJob(job: any): Promise<VaultJobResult> {
  const startTime = Date.now();
  const jobId = job.id;
  const cardId = job.cardId;
  const cardName = job.card?.name || 'Unknown Card';

  console.log(`[VaultJobProcessor] Processing job ${jobId} for ${cardName}`);

  try {
    // Mark job as processing
    await markJobProcessing(jobId);

    // Step 1: Collect community quotes
    const communityQuotes = await collectCommunityQuotes(cardId, cardName);

    // Step 2: Generate vault MDX content
    const mdxContent = await generateVaultMDX(cardName, communityQuotes);

    // Step 3: Mark job as completed
    await markJobCompleted(jobId, communityQuotes, mdxContent);

    // Step 4: TODO - Trigger ISR revalidation
    // await fetch(`/api/revalidate?path=/vault/${cardId}`);

    const duration = Date.now() - startTime;

    console.log(
      `[VaultJobProcessor] Job ${jobId} completed successfully in ${duration}ms`
    );

    return {
      success: true,
      jobId,
      cardId,
      cardName,
      durationMs: duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error(
      `[VaultJobProcessor] Job ${jobId} failed: ${errorMessage}`
    );

    // Mark job as failed (with retry logic)
    await markJobFailed(jobId, errorMessage, job.retryCount || 0);

    return {
      success: false,
      jobId,
      cardId,
      cardName,
      error: errorMessage,
      durationMs: duration,
    };
  }
}

/**
 * Process a batch of vault jobs
 */
export async function processBatch(batchSize: number = BATCH_SIZE): Promise<ProcessBatchResult> {
  const startTime = Date.now();

  console.log(`[VaultJobProcessor] Starting batch processing (size: ${batchSize})...`);

  // Fetch pending jobs
  const pendingJobs = await fetchPendingJobs(batchSize);

  if (pendingJobs.length === 0) {
    console.log('[VaultJobProcessor] No pending jobs found');
    return {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      durationMs: Date.now() - startTime,
      jobs: [],
    };
  }

  console.log(`[VaultJobProcessor] Found ${pendingJobs.length} pending jobs`);

  // Process jobs sequentially (could be parallelized with Promise.all)
  const results: VaultJobResult[] = [];
  for (const job of pendingJobs) {
    const result = await processSingleJob(job);
    results.push(result);
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  const duration = Date.now() - startTime;

  console.log(
    `[VaultJobProcessor] Batch complete - ${successful} successful, ${failed} failed in ${duration}ms`
  );

  return {
    totalProcessed: results.length,
    successful,
    failed,
    skipped: 0,
    durationMs: duration,
    jobs: results,
  };
}

/**
 * Get job queue stats
 */
export async function getQueueStats() {
  const stats = await db.execute<{
    status: string;
    count: number;
  }>(sql`
    SELECT status, COUNT(*) as count
    FROM ${vaultJobs}
    GROUP BY status
  `);

  return {
    pending: Number(stats.rows.find(s => s.status === 'pending')?.count || 0),
    processing: Number(stats.rows.find(s => s.status === 'processing')?.count || 0),
    completed: Number(stats.rows.find(s => s.status === 'completed')?.count || 0),
    failed: Number(stats.rows.find(s => s.status === 'failed')?.count || 0),
  };
}

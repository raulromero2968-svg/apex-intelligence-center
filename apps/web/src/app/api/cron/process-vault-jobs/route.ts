/**
 * Vault Jobs Processor Cron
 *
 * Processes pending vault jobs from the production queue.
 * Runs every 5 minutes via Vercel Cron.
 *
 * Features:
 * - Batch processing (up to 10 jobs per run)
 * - Priority queue processing
 * - Automatic retries on failure
 * - Queue statistics reporting
 *
 * Pipeline:
 * 1. Fetch pending jobs (priority order)
 * 2. Process each job (community quotes → AI generation → MDX)
 * 3. Update job status
 * 4. Return processing stats
 *
 * Vercel Cron: Add to vercel.json crons array
 * Schedule: every 5 minutes (cron: 0/5 * * * *)
 */

import { NextRequest, NextResponse } from 'next/server';
import { processBatch, getQueueStats } from '@/lib/vault/job-processor';

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
 * GET /api/cron/process-vault-jobs
 *
 * Triggered by Vercel Cron every 5 minutes
 */
export async function GET(req: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const startTime = Date.now();
    console.log('[ProcessVaultJobs] Starting vault job processing...');

    // Get queue stats before processing
    const statsBefore = await getQueueStats();
    console.log('[ProcessVaultJobs] Queue stats before:', statsBefore);

    // Process batch of jobs
    const batchResult = await processBatch();

    // Get queue stats after processing
    const statsAfter = await getQueueStats();

    const duration = Date.now() - startTime;

    const result = {
      success: true,
      stats: {
        batch: {
          totalProcessed: batchResult.totalProcessed,
          successful: batchResult.successful,
          failed: batchResult.failed,
          durationMs: batchResult.durationMs,
        },
        queueBefore: statsBefore,
        queueAfter: statsAfter,
        totalDurationMs: duration,
      },
      jobs: batchResult.jobs.map(job => ({
        jobId: job.jobId,
        cardName: job.cardName,
        success: job.success,
        durationMs: job.durationMs,
        error: job.error,
      })),
    };

    console.log(
      `[ProcessVaultJobs] Completed - ` +
      `${batchResult.successful} successful, ${batchResult.failed} failed in ${duration}ms`
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('[ProcessVaultJobs] Cron job failed:', error);

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
 * POST /api/cron/process-vault-jobs
 *
 * Manual trigger endpoint (for testing)
 * Can specify custom batch size via query parameter
 */
export async function POST(req: NextRequest) {
  // In production, this should verify admin authentication
  // For now, use the same cron secret
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Allow custom batch size via query parameter
  const batchSize = parseInt(req.nextUrl.searchParams.get('batchSize') || '10', 10);

  console.log(`[ProcessVaultJobs] Manual trigger via POST (batchSize: ${batchSize})`);

  try {
    const batchResult = await processBatch(batchSize);
    const statsAfter = await getQueueStats();

    return NextResponse.json({
      success: true,
      stats: {
        batch: {
          totalProcessed: batchResult.totalProcessed,
          successful: batchResult.successful,
          failed: batchResult.failed,
          durationMs: batchResult.durationMs,
        },
        queueAfter: statsAfter,
      },
      jobs: batchResult.jobs,
    });
  } catch (error) {
    console.error('[ProcessVaultJobs] Manual trigger failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

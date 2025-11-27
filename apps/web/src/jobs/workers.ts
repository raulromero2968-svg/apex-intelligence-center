/**
 * BullMQ Workers Initialization for Apex Intelligence
 *
 * Starts all background job processors:
 * - Pop Delta Detection
 * - Arbitrage Scanning
 * - Data Ingestion
 * - Notifications
 *
 * Run with: tsx src/jobs/workers.ts
 */

import { createWorker, initializeScheduledJobs, shutdownQueues } from './queue.config';
import { detectPopDeltas } from './pop-delta/detector.job';
import { scanArbitrage } from './arbitrage/scanner.job';
import * as Sentry from '@sentry/nextjs';

/**
 * Initialize all workers
 */
async function initializeWorkers() {
  console.log('🚀 Starting Apex Intelligence Workers...');

  // Pop Delta Detection Worker
  const popDeltaWorker = createWorker('pop-delta-detection', async (job) => {
    console.log(`[Worker] Processing pop-delta job: ${job.id}`);
    try {
      const alerts = await detectPopDeltas(job);
      console.log(`[Worker] Pop delta detection complete: ${alerts.length} alerts`);
      return { success: true, alertCount: alerts.length };
    } catch (error) {
      Sentry.captureException(error, {
        extra: { jobId: job.id, jobName: job.name },
      });
      throw error;
    }
  });

  // Arbitrage Scanning Worker
  const arbitrageWorker = createWorker('arbitrage-scanning', async (job) => {
    console.log(`[Worker] Processing arbitrage job: ${job.id}`);
    try {
      const opportunities = await scanArbitrage(job);
      console.log(`[Worker] Arbitrage scan complete: ${opportunities.length} opportunities`);
      return { success: true, opportunityCount: opportunities.length };
    } catch (error) {
      Sentry.captureException(error, {
        extra: { jobId: job.id, jobName: job.name },
      });
      throw error;
    }
  });

  // Data Ingestion Worker (placeholder)
  const ingestionWorker = createWorker('data-ingestion', async (job) => {
    console.log(`[Worker] Processing ingestion job: ${job.id} - ${job.data.source}`);
    // TODO: Implement actual ingestion based on job.data.source
    // - justtcg: Fetch from JustTCG API
    // - ebay: Scrape recent sales
    // - psa: Fetch population reports
    return { success: true, source: job.data.source };
  });

  // Notifications Worker (placeholder)
  const notificationsWorker = createWorker('notifications', async (job) => {
    console.log(`[Worker] Processing notification job: ${job.id}`);
    // Notifications are sent inline from other jobs
    // This worker handles retries for failed notifications
    return { success: true };
  });

  // Worker event handlers
  const workers = [popDeltaWorker, arbitrageWorker, ingestionWorker, notificationsWorker];

  workers.forEach((worker) => {
    worker.on('completed', (job) => {
      console.log(`✅ Job ${job.id} completed successfully`);
    });

    worker.on('failed', (job, error) => {
      console.error(`❌ Job ${job?.id} failed:`, error);
    });

    worker.on('error', (error) => {
      console.error(`Worker error:`, error);
    });
  });

  // Initialize scheduled jobs
  await initializeScheduledJobs();

  console.log('✅ All workers initialized and running');
  console.log('📊 Workers active:');
  console.log('  - Pop Delta Detection (nightly 3am UTC)');
  console.log('  - Arbitrage Scanning (every 15min)');
  console.log('  - JustTCG Ingestion (every 30min)');
  console.log('  - eBay Ingestion (hourly)');
  console.log('  - PSA Pop Reports (every 6h)');

  return workers;
}

// Start workers if run directly
if (require.main === module) {
  initializeWorkers()
    .then(() => {
      console.log('🎉 Workers started successfully');
    })
    .catch((error) => {
      console.error('Failed to start workers:', error);
      process.exit(1);
    });
}

export { initializeWorkers };


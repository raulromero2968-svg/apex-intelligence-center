/**
 * BullMQ Queue Configuration for Apex Intelligence
 *
 * Manages all background jobs:
 * - Pop delta detection (nightly 3am UTC)
 * - Arbitrage scanning (every 15min)
 * - Price ingestion (every 30min - 6h depending on source)
 * - Portfolio rebalancing (monthly)
 * - Tax lot calculations (on acquisition)
 */

import { Queue, QueueOptions, Worker, WorkerOptions } from 'bullmq';
import IORedis from 'ioredis';

// Redis connection (Upstash compatible)
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Default queue options
const defaultQueueOptions: QueueOptions = {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // 2s, 4s, 8s
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed
      age: 24 * 3600, // 24 hours
    },
    removeOnFail: {
      count: 500, // Keep last 500 failed for debugging
    },
  },
};

/**
 * Queue Registry
 */
export const queues = {
  popDelta: new Queue('pop-delta-detection', defaultQueueOptions),
  arbitrage: new Queue('arbitrage-scanning', defaultQueueOptions),
  ingestion: new Queue('data-ingestion', defaultQueueOptions),
  portfolio: new Queue('portfolio-rebalancing', defaultQueueOptions),
  notifications: new Queue('notifications', defaultQueueOptions),
  taxLot: new Queue('tax-lot-calculation', defaultQueueOptions),
} as const;

/**
 * Job Schedulers - Add recurring jobs
 */
export async function initializeScheduledJobs() {
  // Pop Delta Detection - Nightly at 3am UTC
  await queues.popDelta.add(
    'detect-pop-deltas',
    {},
    {
      repeat: {
        pattern: '0 3 * * *', // 3am UTC daily
      },
      jobId: 'pop-delta-nightly',
    }
  );

  // Arbitrage Scanning - Every 15 minutes
  await queues.arbitrage.add(
    'scan-arbitrage',
    {},
    {
      repeat: {
        every: 15 * 60 * 1000, // 15 minutes
      },
      jobId: 'arbitrage-15min',
    }
  );

  // JustTCG Ingestion - Every 30 minutes
  await queues.ingestion.add(
    'ingest-justtcg',
    { source: 'justtcg' },
    {
      repeat: {
        every: 30 * 60 * 1000,
      },
      jobId: 'justtcg-30min',
    }
  );

  // eBay Sales Ingestion - Every hour
  await queues.ingestion.add(
    'ingest-ebay',
    { source: 'ebay', daysBack: 1 },
    {
      repeat: {
        every: 60 * 60 * 1000,
      },
      jobId: 'ebay-hourly',
    }
  );

  // PSA Pop Reports - Every 6 hours
  await queues.ingestion.add(
    'ingest-psa-pop',
    { source: 'psa' },
    {
      repeat: {
        pattern: '0 */6 * * *',
      },
      jobId: 'psa-6hourly',
    }
  );

  console.log('✅ Scheduled jobs initialized');
}

/**
 * Worker factory with common options
 */
export function createWorker(
  queueName: string,
  processor: WorkerOptions['processor'],
  options?: Partial<WorkerOptions>
): Worker {
  return new Worker(queueName, processor, {
    connection,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000, // 10 jobs per second max
    },
    ...options,
  });
}

/**
 * Graceful shutdown
 */
export async function shutdownQueues() {
  console.log('Shutting down BullMQ queues...');

  await Promise.all([
    queues.popDelta.close(),
    queues.arbitrage.close(),
    queues.ingestion.close(),
    queues.portfolio.close(),
    queues.notifications.close(),
    queues.taxLot.close(),
  ]);

  await connection.quit();

  console.log('✅ All queues shut down');
}

// Handle process termination
process.on('SIGTERM', shutdownQueues);
process.on('SIGINT', shutdownQueues);

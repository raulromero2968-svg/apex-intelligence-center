/**
 * Redis Intelligence Bus - BullMQ Queue Configuration
 *
 * Manages intelligent market analysis queues:
 * - varcQueue: Value-at-Risk Calculations for portfolio optimization
 * - lampQueue: Liquidity Analysis & Market Positioning
 * - contrarianQueue: Contrarian signal detection and sentiment analysis
 *
 * Production-ready with connection pooling, retry logic, and graceful shutdown.
 */

import { Queue, QueueOptions, Worker, WorkerOptions, Processor, Job } from 'bullmq';
import IORedis, { RedisOptions } from 'ioredis';

/**
 * Environment Configuration
 */
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

/**
 * Redis Connection Pool Configuration
 * Optimized for both Upstash (production) and local development
 */
const redisConfig: RedisOptions = {
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false, // Upstash compatibility

  // Connection pooling
  lazyConnect: true,
  keepAlive: 30000, // 30s keepalive

  // Retry strategy with exponential backoff
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    console.log(`Redis reconnecting... attempt ${times}, delay ${delay}ms`);
    return delay;
  },

  // Connection timeout
  connectTimeout: 10000,

  // Upstash production settings
  ...(IS_PRODUCTION && {
    tls: {
      rejectUnauthorized: true,
    },
    enableAutoPipelining: true,
    maxRetriesPerRequest: 3,
  }),
};

/**
 * Shared Redis connection for all queues
 * Reuses single connection to reduce overhead
 */
let sharedConnection: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (!sharedConnection) {
    sharedConnection = new IORedis(REDIS_URL, redisConfig);

    // Connection event handlers
    sharedConnection.on('connect', () => {
      console.log('✅ Redis Intelligence Bus connected');
    });

    sharedConnection.on('error', (err) => {
      console.error('❌ Redis connection error:', err.message);
    });

    sharedConnection.on('close', () => {
      console.log('🔌 Redis connection closed');
    });
  }

  return sharedConnection;
}

/**
 * Default Queue Options
 * Consistent configuration across all intelligence queues
 */
const defaultQueueOptions: Omit<QueueOptions, 'connection'> = {
  defaultJobOptions: {
    // Retry configuration
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // 2s → 4s → 8s
    },

    // Job retention
    removeOnComplete: {
      count: 100, // Keep last 100 successful jobs
      age: 24 * 3600, // Remove after 24 hours
    },
    removeOnFail: {
      count: 500, // Keep last 500 failed jobs for debugging
      age: 7 * 24 * 3600, // Remove after 7 days
    },
  },
};

/**
 * Queue Type Definitions
 */
export interface VaRCJobData {
  portfolioId: string;
  holdings: Array<{
    cardId: string;
    quantity: number;
    costBasis: number;
  }>;
  confidenceLevel?: number; // Default: 0.95 (95%)
  timeHorizon?: number; // Days, default: 30
}

export interface LAMPJobData {
  cardId: string;
  marketDepth?: boolean; // Analyze order book depth
  spreadAnalysis?: boolean; // Bid-ask spread analysis
  volumeProfile?: boolean; // Intraday volume patterns
}

export interface ContrarianJobData {
  game: string; // 'pokemon' | 'yugioh' | 'mtg' | etc
  signalType: 'sentiment' | 'technical' | 'fundamental';
  threshold?: number; // Contrarian threshold (default: 0.7)
  lookbackDays?: number; // Historical analysis window
}

/**
 * VARC Queue - Value-at-Risk Calculations
 * Processes portfolio risk metrics, stress testing, and downside protection analysis
 */
export const varcQueue = new Queue<VaRCJobData>('intelligence:varc', {
  ...defaultQueueOptions,
  connection: getRedisConnection(),
});

/**
 * LAMP Queue - Liquidity Analysis & Market Positioning
 * Analyzes market depth, order flow, and optimal entry/exit timing
 */
export const lampQueue = new Queue<LAMPJobData>('intelligence:lamp', {
  ...defaultQueueOptions,
  connection: getRedisConnection(),
});

/**
 * Contrarian Queue - Sentiment & Counter-Trend Analysis
 * Detects overcrowded trades, market euphoria/panic, and contrarian opportunities
 */
export const contrarianQueue = new Queue<ContrarianJobData>('intelligence:contrarian', {
  ...defaultQueueOptions,
  connection: getRedisConnection(),
});

/**
 * Queue Registry for easy access
 */
export const intelligenceQueues = {
  varc: varcQueue,
  lamp: lampQueue,
  contrarian: contrarianQueue,
} as const;

/**
 * Worker Factory
 * Creates workers with standardized configuration
 */
export function createIntelligenceWorker<T = any, R = any>(
  queueName: string,
  processor: Processor<T, R, string>,
  options?: Partial<WorkerOptions>
): Worker<T, R, string> {
  const worker = new Worker<T, R, string>(queueName, processor, {
    connection: getRedisConnection(),

    // Concurrency
    concurrency: options?.concurrency || 5,

    // Rate limiting (prevent API overload)
    limiter: {
      max: 10,
      duration: 1000, // 10 jobs per second max
    },

    // Timeouts
    lockDuration: 30000, // 30s job lock
    lockRenewTime: 15000, // Renew lock every 15s

    ...options,
  });

  // Worker event handlers
  worker.on('completed', (job: Job<T, R, string>) => {
    console.log(`✅ [${queueName}] Job ${job.id} completed`);
  });

  worker.on('failed', (job: Job<T, R, string> | undefined, err: Error) => {
    console.error(`❌ [${queueName}] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err: Error) => {
    console.error(`❌ [${queueName}] Worker error:`, err.message);
  });

  return worker;
}

/**
 * Add VARC Job
 * Convenience method for queueing VaR calculations
 */
export async function queueVaRCalculation(data: VaRCJobData, priority?: number) {
  return varcQueue.add('calculate-var', data, {
    priority: priority || 5,
    jobId: `varc:${data.portfolioId}:${Date.now()}`,
  });
}

/**
 * Add LAMP Job
 * Convenience method for queueing liquidity analysis
 */
export async function queueLiquidityAnalysis(data: LAMPJobData, priority?: number) {
  return lampQueue.add('analyze-liquidity', data, {
    priority: priority || 5,
    jobId: `lamp:${data.cardId}:${Date.now()}`,
  });
}

/**
 * Add Contrarian Job
 * Convenience method for queueing contrarian signal detection
 */
export async function queueContrarianAnalysis(data: ContrarianJobData, priority?: number) {
  return contrarianQueue.add('detect-contrarian', data, {
    priority: priority || 5,
    jobId: `contrarian:${data.game}:${Date.now()}`,
  });
}

/**
 * Health Check
 * Verify queue connectivity and status
 */
export async function checkIntelligenceBusHealth(): Promise<{
  healthy: boolean;
  queues: Record<string, Record<string, number>>;
}> {
  try {
    const [varcCounts, lampCounts, contrarianCounts] = await Promise.all([
      varcQueue.getJobCounts(),
      lampQueue.getJobCounts(),
      contrarianQueue.getJobCounts(),
    ]);

    return {
      healthy: true,
      queues: {
        varc: varcCounts,
        lamp: lampCounts,
        contrarian: contrarianCounts,
      },
    };
  } catch (error) {
    console.error('Health check failed:', error);
    return {
      healthy: false,
      queues: {
        varc: { waiting: 0, active: 0, completed: 0, failed: 0 },
        lamp: { waiting: 0, active: 0, completed: 0, failed: 0 },
        contrarian: { waiting: 0, active: 0, completed: 0, failed: 0 },
      },
    };
  }
}

/**
 * Graceful Shutdown
 * Properly close all queues and connections
 */
export async function shutdownIntelligenceBus(): Promise<void> {
  console.log('🔄 Shutting down Intelligence Bus...');

  try {
    // Close all queues
    await Promise.all([
      varcQueue.close(),
      lampQueue.close(),
      contrarianQueue.close(),
    ]);

    // Close shared Redis connection
    if (sharedConnection) {
      await sharedConnection.quit();
      sharedConnection = null;
    }

    console.log('✅ Intelligence Bus shutdown complete');
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    throw error;
  }
}

// Process signal handlers for graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM signal');
    shutdownIntelligenceBus().then(() => process.exit(0));
  });

  process.on('SIGINT', () => {
    console.log('Received SIGINT signal');
    shutdownIntelligenceBus().then(() => process.exit(0));
  });
}

/**
 * Initialize Intelligence Bus
 * Call this on application startup
 */
export async function initializeIntelligenceBus(): Promise<void> {
  console.log('🚀 Initializing Redis Intelligence Bus...');

  try {
    // Connect to Redis
    await getRedisConnection().connect();

    // Verify queues are accessible
    const health = await checkIntelligenceBusHealth();

    if (health.healthy) {
      console.log('✅ Intelligence Bus initialized successfully');
      console.log('📊 Queue status:', health.queues);
    } else {
      throw new Error('Health check failed');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Intelligence Bus:', error);
    throw error;
  }
}

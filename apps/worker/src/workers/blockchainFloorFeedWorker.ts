import Redis from 'ioredis';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { FloorPriceService } from '@apex/blockchain';
import { blockchainFloorPrices } from '@apex/db/src/schema';
import {
  blockchainFloorChannel,
  type FloorFeedEvent,
  type FloorPriceRecord,
} from '@apex/shared/src/contracts/blockchainFeeds';
import { createLogger } from '@apex/shared/src/logger';
import { eq, and, desc } from 'drizzle-orm';

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL environment variable is required');
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const logger = createLogger('worker');
const subsystem = 'blockchain_floor_feeds';

const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const db = drizzle(pool);

const redisPubSub = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const floorPriceService = new FloorPriceService();

// Configuration
const FLOOR_REFRESH_SECONDS = parseInt(
  process.env.BLOCKCHAIN_FLOOR_REFRESH_SECONDS || '5',
  10
);
const MAX_BLOCK_LAG = parseInt(
  process.env.BLOCKCHAIN_MAX_BLOCK_LAG || '3',
  10
);

// Track last processed block per collection to ensure at-most-once semantics
const lastProcessedBlocks = new Map<string, number>();

// Track seen records to prevent duplicates
const seenRecords = new Set<string>();

/**
 * Load latest known floor from DB to warm cache
 */
async function warmCache(): Promise<void> {
  try {
    const latestRecords = await db
      .select()
      .from(blockchainFloorPrices)
      .orderBy(desc(blockchainFloorPrices.observedAt))
      .limit(100);

    for (const record of latestRecords) {
      const key = `${record.chain}:${record.collection}:${record.blockNumber}`;
      lastProcessedBlocks.set(key, record.blockNumber);
      seenRecords.add(key);
    }

    logger.info('Cache warmed', {
      subsystem,
      recordsLoaded: latestRecords.length,
    });
  } catch (error) {
    logger.error('Failed to warm cache', {
      subsystem,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Upsert floor price record to database
 */
async function upsertFloorPrice(record: FloorPriceRecord): Promise<void> {
  const key = `${record.chain}:${record.collection}:${record.blockNumber}`;
  
  // At-most-once semantics: skip if already processed
  if (seenRecords.has(key)) {
    logger.debug('Skipping duplicate record', {
      subsystem,
      chain: record.chain,
      collection: record.collection,
      blockNumber: record.blockNumber,
    });
    return;
  }

  // Check block lag
  const lastBlock = lastProcessedBlocks.get(`${record.chain}:${record.collection}`);
  if (lastBlock && record.blockNumber < lastBlock - MAX_BLOCK_LAG) {
    logger.warn('Skipping stale block', {
      subsystem,
      chain: record.chain,
      collection: record.collection,
      blockNumber: record.blockNumber,
      lastBlock,
    });
    return;
  }

  try {
    await db
      .insert(blockchainFloorPrices)
      .values({
        id: record.id,
        chain: record.chain,
        collection: record.collection,
        tokenContract: record.tokenContract,
        currency: record.currency,
        floorPrice: record.floorPrice,
        floorPriceUsd: record.floorPriceUsd.toString(),
        blockNumber: record.blockNumber,
        txHash: record.txHash,
        liquidityVenue: record.liquidityVenue,
        observedAt: new Date(record.observedAt),
      })
      .onConflictDoUpdate({
        target: blockchainFloorPrices.id,
        set: {
          floorPrice: record.floorPrice,
          floorPriceUsd: record.floorPriceUsd.toString(),
          blockNumber: record.blockNumber,
          txHash: record.txHash,
          observedAt: new Date(record.observedAt),
        },
      });

    // Mark as seen
    seenRecords.add(key);
    lastProcessedBlocks.set(`${record.chain}:${record.collection}`, record.blockNumber);

    // Cleanup old seen records (keep last 1000)
    if (seenRecords.size > 1000) {
      const entries = Array.from(seenRecords);
      seenRecords.clear();
      entries.slice(-500).forEach((k) => seenRecords.add(k));
    }

    logger.debug('Floor price upserted', {
      subsystem,
      chain: record.chain,
      collection: record.collection,
      blockNumber: record.blockNumber,
      floorPrice: record.floorPrice,
      floorPriceUsd: record.floorPriceUsd,
    });
  } catch (error) {
    logger.error('Failed to upsert floor price', {
      subsystem,
      chain: record.chain,
      collection: record.collection,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Publish floor price event to Redis Pub/Sub
 */
async function publishFloorEvent(record: FloorPriceRecord): Promise<void> {
  try {
    const channel = blockchainFloorChannel(record.chain, record.collection);
    const event: FloorFeedEvent = {
      kind: 'floor_update',
      chain: record.chain,
      collection: record.collection,
      record,
    };

    await redisPubSub.publish(channel, JSON.stringify(event));

    logger.debug('Floor event published', {
      subsystem,
      channel,
      chain: record.chain,
      collection: record.collection,
    });
  } catch (error) {
    logger.error('Failed to publish floor event', {
      subsystem,
      chain: record.chain,
      collection: record.collection,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Polling loop: fetch floor prices and write to DB
 */
async function pollingLoop(): Promise<void> {
  let consecutiveErrors = 0;
  const maxConsecutiveErrors = 5;

  while (true) {
    try {
      const records = await floorPriceService.pollAndComputeFloors();

      for (const record of records) {
        try {
          await upsertFloorPrice(record);
          await publishFloorEvent(record);
        } catch (error) {
          logger.error('Error processing floor record', {
            subsystem,
            chain: record.chain,
            collection: record.collection,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      consecutiveErrors = 0;
      logger.debug('Polling cycle completed', {
        subsystem,
        recordsProcessed: records.length,
      });
    } catch (error) {
      consecutiveErrors++;
      logger.error('Polling cycle failed', {
        subsystem,
        consecutiveErrors,
        error: error instanceof Error ? error.message : String(error),
      });

      if (consecutiveErrors >= maxConsecutiveErrors) {
        logger.error('Too many consecutive errors, backing off', {
          subsystem,
          consecutiveErrors,
        });
        await new Promise((resolve) => setTimeout(resolve, 30000)); // 30s backoff
        consecutiveErrors = 0;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, FLOOR_REFRESH_SECONDS * 1000));
  }
}

/**
 * WebSocket subscription handler for real-time updates
 */
async function setupWebSocketSubscriptions(): Promise<void> {
  try {
    await floorPriceService.subscribeFloorStreams(async (record: FloorPriceRecord) => {
      try {
        await upsertFloorPrice(record);
        await publishFloorEvent(record);
      } catch (error) {
        logger.error('Error handling WebSocket floor update', {
          subsystem,
          chain: record.chain,
          collection: record.collection,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    logger.info('WebSocket subscriptions established', { subsystem });
  } catch (error) {
    logger.error('Failed to setup WebSocket subscriptions', {
      subsystem,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Main worker initialization
 */
async function startWorker(): Promise<void> {
  logger.info('Starting blockchain floor feed worker', {
    subsystem,
    refreshSeconds: FLOOR_REFRESH_SECONDS,
    maxBlockLag: MAX_BLOCK_LAG,
  });

  // Warm cache
  await warmCache();

  // Setup WebSocket subscriptions for real-time updates
  await setupWebSocketSubscriptions();

  // Start polling loop
  pollingLoop().catch((error) => {
    logger.error('Polling loop crashed', {
      subsystem,
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  });
}

/**
 * Cleanup function
 */
export async function closeBlockchainFloorFeedWorker(): Promise<void> {
  logger.info('Shutting down blockchain floor feed worker', { subsystem });
  
  await floorPriceService.close();
  await redisPubSub.quit();
  await connection.quit();
  await pool.end();
}

// Start worker
startWorker().catch((error) => {
  logger.error('Failed to start blockchain floor feed worker', {
    subsystem,
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});

export const blockchainFloorFeedWorker = {
  name: 'blockchain-floor-feed-worker',
  close: closeBlockchainFloorFeedWorker,
};


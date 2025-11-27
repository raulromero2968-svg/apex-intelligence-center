import Redis from 'ioredis';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@apex/db/src/schema';
import {
  loadRecentFloors,
  computeArbitrageEdges,
  dedupeAndPersistOpportunities,
  getArbitrageConfig,
} from '@apex/arbitrage';
import {
  arbitrageOpportunityChannel,
  type ArbitrageEvent,
} from '@apex/shared/src/contracts/arbitrage';

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL environment variable is required');
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const db = drizzle(pool, { schema });

const redisPubSub = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;

async function runArbitrageScan() {
  if (isRunning) {
    console.log('[arbitrage] Scan already in progress, skipping...');
    return;
  }

  isRunning = true;
  const startTime = Date.now();

  try {
    console.log('[arbitrage] Starting arbitrage scan...');

    // Load recent floor prices
    const floors = await loadRecentFloors(db, 100);
    console.log(`[arbitrage] Loaded ${floors.length} floor price records`);

    if (floors.length < 2) {
      console.log('[arbitrage] Insufficient floor data for arbitrage computation');
      return;
    }

    // Compute arbitrage opportunities
    const opportunities = computeArbitrageEdges(floors);
    console.log(`[arbitrage] Computed ${opportunities.length} opportunities`);

    // Dedupe and persist
    const newOpportunities = await dedupeAndPersistOpportunities(db, opportunities);
    console.log(`[arbitrage] Persisted ${newOpportunities.length} new opportunities`);

    // Publish events for new opportunities
    for (const opp of newOpportunities) {
      const event: ArbitrageEvent = {
        kind: 'arbitrage_opportunity',
        opportunity: opp,
      };

      await redisPubSub.publish(
        arbitrageOpportunityChannel(),
        JSON.stringify(event)
      );

      console.log(`[arbitrage] Published opportunity ${opp.id} (edge: ${opp.edgeBps.toFixed(2)} bps, profit: $${opp.estimatedProfitUsd.toFixed(2)})`);
    }

    const duration = Date.now() - startTime;
    console.log(`[arbitrage] Scan completed in ${duration}ms`);
  } catch (error) {
    console.error('[arbitrage] Error during scan:', error);
    if (error instanceof Error) {
      console.error('[arbitrage] Error stack:', error.stack);
    }
  } finally {
    isRunning = false;
  }
}

export function startArbitrageWorker() {
  const config = getArbitrageConfig();
  const intervalMs = config.scanIntervalSeconds * 1000;

  console.log(`[arbitrage] Starting arbitrage worker (interval: ${config.scanIntervalSeconds}s)`);

  // Run immediately
  runArbitrageScan().catch((err) => {
    console.error('[arbitrage] Initial scan failed:', err);
  });

  // Then run on interval
  intervalId = setInterval(() => {
    runArbitrageScan().catch((err) => {
      console.error('[arbitrage] Scheduled scan failed:', err);
    });
  }, intervalMs);
}

export function stopArbitrageWorker() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  console.log('[arbitrage] Worker stopped');
}

export const arbitrageWorker = {
  name: 'arbitrage',
  start: startArbitrageWorker,
  stop: stopArbitrageWorker,
  close: async () => {
    stopArbitrageWorker();
    await redisPubSub.quit();
    await pool.end();
  },
};


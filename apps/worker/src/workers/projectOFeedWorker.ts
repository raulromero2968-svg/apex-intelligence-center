import Redis from 'ioredis';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { projectOotcOrders, projectOwhitelistPrices, projectOdiscordMessages } from '@apex/db/src/schema/projectO';
import { desc, sql } from 'drizzle-orm';
import {
  scrapeAndUpsertOtcOrders,
  updateWhitelistPriceFeed,
  ingestDiscordMessages,
  closeDiscordClient,
} from '@apex/project-o';
import { createLogger } from '@apex/shared/logger';

const logger = createLogger('worker', 'project-o-feed');

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL environment variable is required');
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const redisPubSub = new Redis(process.env.REDIS_URL, {
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

// Configuration: run every 30 seconds (configurable)
const FEED_INTERVAL_MS = parseInt(process.env.PROJECT_O_FEED_INTERVAL_MS || '30000', 10);

let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;

/**
 * Get aggregated OTC order book stats
 */
async function getOtcSnapshot() {
  try {
    const orders = await db
      .select({
        cardId: projectOotcOrders.cardId,
        side: projectOotcOrders.side,
        price: projectOotcOrders.price,
        size: projectOotcOrders.size,
      })
      .from(projectOotcOrders)
      .orderBy(desc(projectOotcOrders.createdAt))
      .limit(1000);

    // Aggregate by card and side
    const byCard: Record<string, { buy: number[]; sell: number[] }> = {};

    for (const order of orders) {
      if (!byCard[order.cardId]) {
        byCard[order.cardId] = { buy: [], sell: [] };
      }

      const price = parseFloat(order.price);
      if (order.side === 'buy') {
        byCard[order.cardId].buy.push(price);
      } else {
        byCard[order.cardId].sell.push(price);
      }
    }

    const aggregates = Object.entries(byCard).map(([cardId, orders]) => {
      const buyPrices = orders.buy.sort((a, b) => b - a); // Descending
      const sellPrices = orders.sell.sort((a, b) => a - b); // Ascending

      return {
        cardId,
        bestBid: buyPrices[0] || null,
        bestAsk: sellPrices[0] || null,
        buyCount: buyPrices.length,
        sellCount: sellPrices.length,
        totalBuySize: orders.buy.length,
        totalSellSize: orders.sell.length,
      };
    });

    return {
      totalOrders: orders.length,
      uniqueCards: Object.keys(byCard).length,
      aggregates,
    };
  } catch (error) {
    logger.error('Failed to get OTC snapshot', { error });
    return {
      totalOrders: 0,
      uniqueCards: 0,
      aggregates: [],
    };
  }
}

/**
 * Get latest whitelist price
 */
async function getLatestWhitelistPrice() {
  try {
    const result = await db
      .select()
      .from(projectOwhitelistPrices)
      .orderBy(desc(projectOwhitelistPrices.observedAt))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const price = result[0];
    return {
      chain: price.chain,
      tokenAddress: price.tokenAddress,
      price: parseFloat(price.price),
      priceUsd: parseFloat(price.priceUsd),
      blockNumber: price.blockNumber,
      observedAt: price.observedAt.toISOString(),
    };
  } catch (error) {
    logger.error('Failed to get latest whitelist price', { error });
    return null;
  }
}

/**
 * Get sentiment summary
 */
async function getSentimentSummary() {
  try {
    const messages = await db
      .select()
      .from(projectOdiscordMessages)
      .orderBy(desc(projectOdiscordMessages.createdAt))
      .limit(100);

    if (messages.length === 0) {
      return {
        avgScore: 0,
        messageCount: 0,
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0,
        latestMessages: [],
      };
    }

    const scores = messages
      .map((m) => m.sentimentScore)
      .filter((s): s is number => s !== null);

    const avgScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;

    const positiveCount = scores.filter((s) => s > 0.1).length;
    const negativeCount = scores.filter((s) => s < -0.1).length;
    const neutralCount = scores.length - positiveCount - negativeCount;

    return {
      avgScore,
      messageCount: messages.length,
      positiveCount,
      negativeCount,
      neutralCount,
      latestMessages: messages.slice(0, 10).map((m) => ({
        messageId: m.messageId,
        author: m.author,
        content: m.content.substring(0, 200), // Truncate for summary
        sentimentScore: m.sentimentScore,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    logger.error('Failed to get sentiment summary', { error });
    return {
      avgScore: 0,
      messageCount: 0,
      positiveCount: 0,
      negativeCount: 0,
      neutralCount: 0,
      latestMessages: [],
    };
  }
}

/**
 * Run one feed cycle
 */
async function runFeedCycle() {
  if (isRunning) {
    logger.warn('Feed cycle already running, skipping');
    return;
  }

  isRunning = true;
  const startTime = Date.now();

  try {
    logger.info('Starting Project O feed cycle');

    // Run all feeds in parallel
    const [otcCount, priceCount, discordCount] = await Promise.allSettled([
      scrapeAndUpsertOtcOrders(),
      updateWhitelistPriceFeed(),
      ingestDiscordMessages(),
    ]);

    const otcResult = otcCount.status === 'fulfilled' ? otcCount.value : 0;
    const priceResult = priceCount.status === 'fulfilled' ? priceCount.value : 0;
    const discordResult = discordCount.status === 'fulfilled' ? discordCount.value : 0;

    if (otcCount.status === 'rejected') {
      logger.error('OTC scraper failed', { error: otcCount.reason });
    }
    if (priceCount.status === 'rejected') {
      logger.error('Whitelist price feed failed', { error: priceCount.reason });
    }
    if (discordCount.status === 'rejected') {
      logger.error('Discord sentiment failed', { error: discordCount.reason });
    }

    // Get aggregated data
    const [otcSnapshot, latestPrice, sentimentSummary] = await Promise.all([
      getOtcSnapshot(),
      getLatestWhitelistPrice(),
      getSentimentSummary(),
    ]);

    // Publish update event
    const updateEvent = {
      kind: 'project_o_update',
      timestamp: new Date().toISOString(),
      latestOtcSnapshot: otcSnapshot,
      latestWhitelistPrice: latestPrice,
      sentimentSummary,
    };

    await redisPubSub.publish(
      'events.project_o.update',
      JSON.stringify(updateEvent)
    );

    const duration = Date.now() - startTime;
    logger.info('Project O feed cycle completed', {
      duration: `${duration}ms`,
      otcOrders: otcResult,
      priceUpdates: priceResult,
      discordMessages: discordResult,
    });
  } catch (error) {
    logger.error('Project O feed cycle failed', { error });
  } finally {
    isRunning = false;
  }
}

/**
 * Start the feed worker
 */
export function startProjectOFeedWorker() {
  logger.info(`Starting Project O feed worker (interval: ${FEED_INTERVAL_MS}ms)`);

  // Run immediately
  runFeedCycle().catch((error) => {
    logger.error('Initial feed cycle failed', { error });
  });

  // Then run on interval
  intervalId = setInterval(() => {
    runFeedCycle().catch((error) => {
      logger.error('Scheduled feed cycle failed', { error });
    });
  }, FEED_INTERVAL_MS);

  return {
    name: 'projectOFeedWorker',
    close: async () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      await closeDiscordClient();
      await redisPubSub.quit();
      await pool.end();
      logger.info('Project O feed worker closed');
    },
  };
}

export const projectOFeedWorker = startProjectOFeedWorker();

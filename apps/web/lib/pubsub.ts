/**
 * Redis Pub/Sub for Real-Time Intelligence Streaming
 *
 * Provides real-time streaming of:
 * - Simulation results (backtesting, portfolio optimization)
 * - Market alerts (price movements, arbitrage opportunities)
 * - Analysis progress (VARC, LAMP, Contrarian calculations)
 *
 * Uses dedicated IORedis connections for pub/sub to avoid blocking
 * the main Redis connection used by BullMQ queues.
 */

import IORedis, { Redis, RedisOptions } from 'ioredis';

/**
 * Environment Configuration
 */
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

/**
 * Redis Pub/Sub Configuration
 * Separate from BullMQ connection to prevent blocking
 */
const pubsubConfig: RedisOptions = {
  enableReadyCheck: false,
  lazyConnect: false, // Auto-connect for pub/sub
  keepAlive: 30000,

  // Retry strategy
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    console.log(`PubSub reconnecting... attempt ${times}, delay ${delay}ms`);
    return delay;
  },

  connectTimeout: 10000,

  // Production settings
  ...(IS_PRODUCTION && {
    tls: {
      rejectUnauthorized: true,
    },
  }),
};

/**
 * Pub/Sub Connection Pool
 * Maintains separate connections for publishing and subscribing
 */
class PubSubPool {
  private publisher: Redis | null = null;
  private subscriber: Redis | null = null;
  private subscriptions: Map<string, Set<SubscriptionHandler>> = new Map();

  /**
   * Get or create publisher connection
   */
  getPublisher(): Redis {
    if (!this.publisher) {
      this.publisher = new IORedis(REDIS_URL, {
        ...pubsubConfig,
        lazyConnect: false,
      });

      this.publisher.on('connect', () => {
        console.log('✅ Redis Publisher connected');
      });

      this.publisher.on('error', (err) => {
        console.error('❌ Redis Publisher error:', err.message);
      });
    }

    return this.publisher;
  }

  /**
   * Get or create subscriber connection
   */
  getSubscriber(): Redis {
    if (!this.subscriber) {
      this.subscriber = new IORedis(REDIS_URL, {
        ...pubsubConfig,
        lazyConnect: false,
      });

      this.subscriber.on('connect', () => {
        console.log('✅ Redis Subscriber connected');
      });

      this.subscriber.on('error', (err) => {
        console.error('❌ Redis Subscriber error:', err.message);
      });

      // Handle incoming messages
      this.subscriber.on('message', (channel: string, message: string) => {
        this.handleMessage(channel, message);
      });

      // Handle pattern messages
      this.subscriber.on('pmessage', (pattern: string, channel: string, message: string) => {
        this.handleMessage(channel, message, pattern);
      });
    }

    return this.subscriber;
  }

  /**
   * Handle incoming pub/sub messages
   */
  private handleMessage(channel: string, message: string, pattern?: string) {
    const handlers = this.subscriptions.get(pattern || channel);

    if (handlers) {
      let parsed: any;
      try {
        parsed = JSON.parse(message);
      } catch {
        parsed = message;
      }

      handlers.forEach((handler) => {
        try {
          handler(channel, parsed);
        } catch (err) {
          console.error(`Error in subscription handler for ${channel}:`, err);
        }
      });
    }
  }

  /**
   * Add subscription handler
   */
  addHandler(channelOrPattern: string, handler: SubscriptionHandler) {
    if (!this.subscriptions.has(channelOrPattern)) {
      this.subscriptions.set(channelOrPattern, new Set());
    }
    this.subscriptions.get(channelOrPattern)!.add(handler);
  }

  /**
   * Remove subscription handler
   */
  removeHandler(channelOrPattern: string, handler: SubscriptionHandler) {
    const handlers = this.subscriptions.get(channelOrPattern);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.subscriptions.delete(channelOrPattern);
      }
    }
  }

  /**
   * Close all connections
   */
  async close() {
    const promises: Promise<void>[] = [];

    if (this.publisher) {
      promises.push(this.publisher.quit().then(() => {}));
      this.publisher = null;
    }

    if (this.subscriber) {
      promises.push(this.subscriber.quit().then(() => {}));
      this.subscriber = null;
    }

    await Promise.all(promises);
    this.subscriptions.clear();
  }
}

// Global pub/sub pool
const pubsubPool = new PubSubPool();

/**
 * Channel Naming Conventions
 */
export const PubSubChannels = {
  // Simulation streaming
  simulation: (simulationId: string) => `simulation:${simulationId}`,
  simulationProgress: (simulationId: string) => `simulation:${simulationId}:progress`,

  // VARC results
  varcResult: (portfolioId: string) => `varc:result:${portfolioId}`,
  varcProgress: (jobId: string) => `varc:progress:${jobId}`,

  // LAMP results
  lampResult: (cardId: string) => `lamp:result:${cardId}`,
  lampProgress: (jobId: string) => `lamp:progress:${jobId}`,

  // Contrarian signals
  contrarianSignal: (game: string) => `contrarian:signal:${game}`,
  contrarianProgress: (jobId: string) => `contrarian:progress:${jobId}`,

  // Market alerts
  priceAlert: (cardId: string) => `alert:price:${cardId}`,
  arbitrageAlert: () => `alert:arbitrage`,
  liquidityAlert: (cardId: string) => `alert:liquidity:${cardId}`,

  // Wildcard patterns
  allSimulations: () => `simulation:*`,
  allVarcResults: () => `varc:result:*`,
  allLampResults: () => `lamp:result:*`,
  allAlerts: () => `alert:*`,
} as const;

/**
 * Message Type Definitions
 */
export interface SimulationProgressMessage {
  simulationId: string;
  progress: number; // 0-100
  currentStep: string;
  totalSteps: number;
  elapsed: number; // milliseconds
  estimatedRemaining: number; // milliseconds
}

export interface SimulationResultMessage {
  simulationId: string;
  status: 'completed' | 'failed';
  results?: any;
  error?: string;
  duration: number;
}

export interface VaRCResultMessage {
  portfolioId: string;
  var95: number;
  var99: number;
  expectedShortfall: number;
  confidenceLevel: number;
  timeHorizon: number;
  timestamp: string;
}

export interface LAMPResultMessage {
  cardId: string;
  liquidityScore: number; // 0-100
  bidAskSpread: number;
  marketDepth: {
    bid: number;
    ask: number;
  };
  volumeProfile: number[];
  recommendation: 'high_liquidity' | 'medium_liquidity' | 'low_liquidity';
  timestamp: string;
}

export interface ContrarianSignalMessage {
  game: string;
  signal: 'bullish' | 'bearish' | 'neutral';
  strength: number; // 0-1
  reason: string;
  cards: Array<{
    cardId: string;
    name: string;
    score: number;
  }>;
  timestamp: string;
}

export interface PriceAlertMessage {
  cardId: string;
  name: string;
  price: number;
  previousPrice: number;
  changePercent: number;
  threshold: number;
  timestamp: string;
}

/**
 * Subscription Handler Type
 */
export type SubscriptionHandler = (channel: string, message: any) => void;

/**
 * Publish Message
 * Send a message to a Redis channel
 */
export async function publish(channel: string, message: any): Promise<number> {
  try {
    const publisher = pubsubPool.getPublisher();
    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    const subscribers = await publisher.publish(channel, payload);
    return subscribers;
  } catch (error) {
    console.error(`Failed to publish to ${channel}:`, error);
    return 0;
  }
}

/**
 * Subscribe to Channel
 * Listen for messages on a specific channel
 */
export async function subscribe(
  channel: string,
  handler: SubscriptionHandler
): Promise<() => Promise<void>> {
  const subscriber = pubsubPool.getSubscriber();

  // Subscribe to channel
  await subscriber.subscribe(channel);

  // Register handler
  pubsubPool.addHandler(channel, handler);

  // Return unsubscribe function
  return async () => {
    pubsubPool.removeHandler(channel, handler);
    const handlers = pubsubPool['subscriptions'].get(channel);
    if (!handlers || handlers.size === 0) {
      await subscriber.unsubscribe(channel);
    }
  };
}

/**
 * Pattern Subscribe
 * Listen for messages matching a pattern (e.g., "simulation:*")
 */
export async function psubscribe(
  pattern: string,
  handler: SubscriptionHandler
): Promise<() => Promise<void>> {
  const subscriber = pubsubPool.getSubscriber();

  // Subscribe to pattern
  await subscriber.psubscribe(pattern);

  // Register handler
  pubsubPool.addHandler(pattern, handler);

  // Return unsubscribe function
  return async () => {
    pubsubPool.removeHandler(pattern, handler);
    const handlers = pubsubPool['subscriptions'].get(pattern);
    if (!handlers || handlers.size === 0) {
      await subscriber.punsubscribe(pattern);
    }
  };
}

/**
 * Publish Simulation Progress
 */
export async function publishSimulationProgress(
  simulationId: string,
  progress: Omit<SimulationProgressMessage, 'simulationId'>
): Promise<number> {
  return publish(PubSubChannels.simulationProgress(simulationId), {
    simulationId,
    ...progress,
  });
}

/**
 * Publish Simulation Result
 */
export async function publishSimulationResult(
  simulationId: string,
  result: Omit<SimulationResultMessage, 'simulationId'>
): Promise<number> {
  return publish(PubSubChannels.simulation(simulationId), {
    simulationId,
    ...result,
  });
}

/**
 * Publish VARC Result
 */
export async function publishVaRCResult(
  portfolioId: string,
  result: Omit<VaRCResultMessage, 'portfolioId' | 'timestamp'>
): Promise<number> {
  return publish(PubSubChannels.varcResult(portfolioId), {
    portfolioId,
    ...result,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Publish LAMP Result
 */
export async function publishLAMPResult(
  cardId: string,
  result: Omit<LAMPResultMessage, 'cardId' | 'timestamp'>
): Promise<number> {
  return publish(PubSubChannels.lampResult(cardId), {
    cardId,
    ...result,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Publish Contrarian Signal
 */
export async function publishContrarianSignal(
  game: string,
  signal: Omit<ContrarianSignalMessage, 'game' | 'timestamp'>
): Promise<number> {
  return publish(PubSubChannels.contrarianSignal(game), {
    game,
    ...signal,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Publish Price Alert
 */
export async function publishPriceAlert(
  cardId: string,
  alert: Omit<PriceAlertMessage, 'cardId' | 'timestamp'>
): Promise<number> {
  return publish(PubSubChannels.priceAlert(cardId), {
    cardId,
    ...alert,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Subscribe to Simulation Updates
 */
export async function subscribeToSimulation(
  simulationId: string,
  onProgress: (progress: SimulationProgressMessage) => void,
  onResult: (result: SimulationResultMessage) => void
): Promise<() => Promise<void>> {
  const unsubProgress = await subscribe(
    PubSubChannels.simulationProgress(simulationId),
    (_, message) => onProgress(message)
  );

  const unsubResult = await subscribe(
    PubSubChannels.simulation(simulationId),
    (_, message) => onResult(message)
  );

  // Return combined unsubscribe function
  return async () => {
    await unsubProgress();
    await unsubResult();
  };
}

/**
 * Subscribe to All Alerts
 */
export async function subscribeToAlerts(
  handler: (channel: string, alert: any) => void
): Promise<() => Promise<void>> {
  return psubscribe(PubSubChannels.allAlerts(), handler);
}

/**
 * Stream Async Iterator
 * Convert pub/sub into async iterable for use with for-await-of
 */
export async function* streamMessages<T = any>(
  channelOrPattern: string,
  isPattern = false
): AsyncGenerator<{ channel: string; message: T }, void, unknown> {
  const messages: Array<{ channel: string; message: T }> = [];
  let resolver: ((value: { channel: string; message: T }) => void) | null = null;
  let done = false;

  const handler: SubscriptionHandler = (channel, message) => {
    if (resolver) {
      resolver({ channel, message });
      resolver = null;
    } else {
      messages.push({ channel, message });
    }
  };

  const unsubscribe = isPattern
    ? await psubscribe(channelOrPattern, handler)
    : await subscribe(channelOrPattern, handler);

  try {
    while (!done) {
      if (messages.length > 0) {
        yield messages.shift()!;
      } else {
        yield await new Promise<{ channel: string; message: T }>((resolve) => {
          resolver = resolve;
        });
      }
    }
  } finally {
    done = true;
    await unsubscribe();
  }
}

/**
 * Graceful Shutdown
 */
export async function shutdownPubSub(): Promise<void> {
  console.log('🔄 Shutting down Pub/Sub...');

  try {
    await pubsubPool.close();
    console.log('✅ Pub/Sub shutdown complete');
  } catch (error) {
    console.error('❌ Error during Pub/Sub shutdown:', error);
    throw error;
  }
}

// Process signal handlers
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => {
    shutdownPubSub().then(() => process.exit(0));
  });

  process.on('SIGINT', () => {
    shutdownPubSub().then(() => process.exit(0));
  });
}

/**
 * Health Check
 */
export async function checkPubSubHealth(): Promise<{
  healthy: boolean;
  publisherConnected: boolean;
  subscriberConnected: boolean;
  activeSubscriptions: number;
}> {
  try {
    const publisher = pubsubPool.getPublisher();
    const subscriber = pubsubPool.getSubscriber();

    const [publisherStatus, subscriberStatus] = await Promise.all([
      publisher.ping(),
      subscriber.ping(),
    ]);

    const activeSubscriptions = pubsubPool['subscriptions'].size;

    return {
      healthy: publisherStatus === 'PONG' && subscriberStatus === 'PONG',
      publisherConnected: publisherStatus === 'PONG',
      subscriberConnected: subscriberStatus === 'PONG',
      activeSubscriptions,
    };
  } catch (error) {
    console.error('Pub/Sub health check failed:', error);
    return {
      healthy: false,
      publisherConnected: false,
      subscriberConnected: false,
      activeSubscriptions: 0,
    };
  }
}

/**
 * Initialize Pub/Sub
 */
export async function initializePubSub(): Promise<void> {
  console.log('🚀 Initializing Redis Pub/Sub...');

  try {
    const health = await checkPubSubHealth();

    if (health.healthy) {
      console.log('✅ Pub/Sub initialized successfully');
      console.log('📊 Active subscriptions:', health.activeSubscriptions);
    } else {
      throw new Error('Pub/Sub health check failed');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Pub/Sub:', error);
    throw error;
  }
}

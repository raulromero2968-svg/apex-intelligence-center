import Redis from 'ioredis';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import { varcCompletedChannel, VarcResultPayloadSchema, type VarcResultPayload } from '@apex/shared/src/contracts/queues';
import { cardForensics } from '@apex/db/src/schema/cardForensics';
import { MintService } from '@apex/digital-twin';

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL environment variable is required');
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const redisSubscriber = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const db = drizzle(pool, { schema: { cardForensics } });
const mintService = new MintService();

/**
 * Check if a card forensics record meets criteria for digital twin minting
 * Criteria: minimum grade, user opt-in, etc.
 */
async function shouldMintDigitalTwin(cardForensics: typeof cardForensics.$inferSelect): Promise<boolean> {
  // Minimum grade threshold (e.g., PSA 8 or higher)
  const MIN_GRADE = 8.0;
  
  if (!cardForensics.grade || cardForensics.grade < MIN_GRADE) {
    console.log(
      `[digital-twin-worker] Skipping mint for cardForensicsId ${cardForensics.id}: grade ${cardForensics.grade} below minimum ${MIN_GRADE}`
    );
    return false;
  }

  // Check if counterfeit score is too high
  if (cardForensics.counterfeitScore !== null && cardForensics.counterfeitScore > 0.3) {
    console.log(
      `[digital-twin-worker] Skipping mint for cardForensicsId ${cardForensics.id}: counterfeit score ${cardForensics.counterfeitScore} too high`
    );
    return false;
  }

  // Additional criteria can be added here (user opt-in, card value, etc.)

  return true;
}

/**
 * Handle VARC completion event
 */
async function handleVarcCompletion(payload: VarcResultPayload): Promise<void> {
  const { jobId, status } = payload;

  if (status !== 'completed') {
    console.log(`[digital-twin-worker] Skipping non-completed VARC job ${jobId}`);
    return;
  }

  try {
    // Look up card forensics record by jobId
    const forensicsRecords = await db
      .select()
      .from(cardForensics)
      .where(eq(cardForensics.jobId, jobId))
      .limit(1);

    if (forensicsRecords.length === 0) {
      console.warn(`[digital-twin-worker] No card forensics record found for jobId ${jobId}`);
      return;
    }

    const forensicsRecord = forensicsRecords[0]!;

    // Check if digital twin should be minted
    if (!(await shouldMintDigitalTwin(forensicsRecord))) {
      return;
    }

    // Mint digital twin (idempotent - will return existing if already minted)
    await mintService.mintFromCardForensics(forensicsRecord);

    console.log(`[digital-twin-worker] Successfully processed digital twin for jobId ${jobId}`);
  } catch (error) {
    console.error(`[digital-twin-worker] Error processing VARC completion for jobId ${jobId}:`, error);
    
    // Log to Sentry if available
    if (process.env.SENTRY_DSN) {
      const Sentry = await import('@sentry/nextjs');
      Sentry.captureException(error, {
        tags: {
          service: 'digital-twin-worker',
          jobId,
        },
      });
    }
  }
}

/**
 * Start the digital twin worker
 * Subscribes to Redis pub/sub channels for VARC completion events
 */
export function startDigitalTwinWorker(): () => Promise<void> {
  console.log('[digital-twin-worker] Starting digital twin worker...');

  // Subscribe to pattern: events.varc.completed.*
  // Redis PSUBSCRIBE supports pattern matching
  redisSubscriber.psubscribe('events.varc.completed.*');

  redisSubscriber.on('pmessage', async (pattern: string, channel: string, message: string) => {
    try {
      const payload = JSON.parse(message) as unknown;
      const validatedPayload = VarcResultPayloadSchema.parse(payload);
      
      console.log(`[digital-twin-worker] Received VARC completion event on channel ${channel}`);
      
      await handleVarcCompletion(validatedPayload);
    } catch (error) {
      console.error(`[digital-twin-worker] Error processing message from channel ${channel}:`, error);
      
      if (process.env.SENTRY_DSN) {
        const Sentry = await import('@sentry/nextjs');
        Sentry.captureException(error, {
          tags: {
            service: 'digital-twin-worker',
            channel,
          },
        });
      }
    }
  });

  redisSubscriber.on('psubscribe', (pattern: string, count: number) => {
    console.log(`[digital-twin-worker] Subscribed to pattern ${pattern} (${count} total subscriptions)`);
  });

  redisSubscriber.on('error', (error: Error) => {
    console.error('[digital-twin-worker] Redis subscriber error:', error);
    
    if (process.env.SENTRY_DSN) {
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.captureException(error, {
          tags: {
            service: 'digital-twin-worker',
            component: 'redis-subscriber',
          },
        });
      });
    }
  });

  // Return cleanup function
  return async () => {
    console.log('[digital-twin-worker] Shutting down...');
    await redisSubscriber.punsubscribe('events.varc.completed.*');
    await redisSubscriber.quit();
    await pool.end();
  };
}


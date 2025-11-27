import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import {
  VARC_QUEUE_NAME,
  QueuedJobEnvelope,
  VarcJobPayload,
  VarcResultPayload,
  VarcJobPayloadSchema,
  varcCompletedChannel,
} from '@apex/shared/src/contracts/queues';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../../../../web/src/db/schema';

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL environment variable is required');
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

if (!process.env.VARC_SERVICE_URL) {
  throw new Error('VARC_SERVICE_URL environment variable is required');
}

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

const db = drizzle(pool, { schema });

const redisPubSub = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

async function logError(service: string, traceId: string, error: Error, context: Record<string, unknown>): Promise<void> {
  console.error(`[${service}] [${traceId}] Error:`, error.message, context);
}

export const varcWorker = new Worker<VarcJobPayload, void>(
  VARC_QUEUE_NAME,
  async (job: Job<QueuedJobEnvelope<VarcJobPayload>>) => {
    const envelope = job.data;
    const { jobId, traceId, payload } = envelope;

    try {
      const validatedPayload = VarcJobPayloadSchema.parse(payload);

      const response = await fetch(`${process.env.VARC_SERVICE_URL}/infer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(envelope),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`VARC service error: ${response.status} ${errorText}`);
      }

      const result = await response.json();

      await db.insert(schema.cardForensics).values({
        jobId,
        cardId: validatedPayload.cardId ?? null,
        imageUrl: validatedPayload.imageUrl,
        reasoningTrace: result,
        metadata: validatedPayload.extraMetadata ?? {},
        completedAt: new Date(),
      }).onConflictDoUpdate({
        target: schema.cardForensics.jobId,
        set: {
          reasoningTrace: result,
          completedAt: new Date(),
        },
      });

      const resultPayload: VarcResultPayload = {
        jobId,
        status: 'completed',
        result,
        completedAt: new Date().toISOString(),
      };

      await redisPubSub.publish(
        varcCompletedChannel(jobId),
        JSON.stringify(resultPayload)
      );

      if (process.env.SHADOW_MODE_PERCENT && parseInt(process.env.SHADOW_MODE_PERCENT, 10) > 0) {
        const { runVarcShadow } = await import('../../../infra/shadow/shadow_harness');
        runVarcShadow(envelope, resultPayload).catch((err) => {
          console.error('[varc] Shadow execution failed:', err);
        });
      }
    } catch (error) {
      const errorPayload: VarcResultPayload = {
        jobId,
        status: 'error',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'VARC_SERVICE_ERROR',
        },
        completedAt: new Date().toISOString(),
      };

      await logError('varc', traceId, error instanceof Error ? error : new Error(String(error)), {
        jobId,
        payload,
      });

      await redisPubSub.publish(
        varcCompletedChannel(jobId),
        JSON.stringify(errorPayload)
      );

      throw error;
    }
  },
  {
    connection,
    concurrency: 5,
  }
);

varcWorker.on('completed', (job) => {
  console.log(`[varc] Job ${job.id} completed`);
});

varcWorker.on('failed', (job, err) => {
  console.error(`[varc] Job ${job?.id} failed:`, err.message);
});


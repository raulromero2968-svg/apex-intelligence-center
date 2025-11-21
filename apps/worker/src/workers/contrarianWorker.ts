import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import {
  CONTRARIAN_QUEUE_NAME,
  QueuedJobEnvelope,
  ContrarianJobPayload,
  ContrarianResultPayload,
  ContrarianJobPayloadSchema,
  contrarianCompletedChannel,
} from '@apex/shared/src/contracts/queues';
import { createLogger } from '@apex/shared/src/logger';

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL environment variable is required');
}

const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const redisPubSub = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const logger = createLogger('worker');

async function logError(service: string, traceId: string, error: Error, context: Record<string, unknown>): Promise<void> {
  logger.error(`[${service}] [${traceId}] Error`, { error: error.message, ...context });
}

export const contrarianWorker = new Worker<ContrarianJobPayload, void>(
  CONTRARIAN_QUEUE_NAME,
  async (job: Job<QueuedJobEnvelope<ContrarianJobPayload>>) => {
    const envelope = job.data;
    const { jobId, traceId, payload } = envelope;

    try {
      const validatedPayload = ContrarianJobPayloadSchema.parse(payload);

      const { runContrarianJob } = await import('../../../../web/src/server/rag/contrarian');

      const ragResult = await runContrarianJob(envelope);

      if (ragResult.status === 'error') {
        await logError('contrarian', traceId, new Error(ragResult.error || 'Unknown error'), {
          jobId,
          payload,
        });

        const errorPayload = {
          ...ragResult,
          completedAt: new Date().toISOString(),
        };

        await redisPubSub.publish(
          contrarianCompletedChannel(jobId),
          JSON.stringify(errorPayload)
        );

        return;
      }

      // Publish the raw result structure that matches ContrarianResultPayload
      // The frontend expects the structure from runContrarianJob directly
      const resultPayload = {
        ...ragResult,
        completedAt: new Date().toISOString(),
      };

      await redisPubSub.publish(
        contrarianCompletedChannel(jobId),
        JSON.stringify(resultPayload)
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await logError('contrarian', traceId, error instanceof Error ? error : new Error(String(error)), {
        jobId,
        payload,
      });

      const errorPayload = {
        jobId,
        traceId,
        status: 'error' as const,
        mainstreamAnswer: null,
        contrarianAnswer: null,
        diagnostics: {
          falseCorrectionLoopScore: 0.0,
          resilienceScore: 0.0,
          usedLowPrestigeSources: false,
          sentimentClusterSummary: {},
        },
        error: errorMessage,
        completedAt: new Date().toISOString(),
      };

      await redisPubSub.publish(
        contrarianCompletedChannel(jobId),
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

contrarianWorker.on('completed', (job) => {
  console.log(`[contrarian] Job ${job.id} completed`);
});

contrarianWorker.on('failed', (job, err) => {
  console.error(`[contrarian] Job ${job?.id} failed:`, err.message);
});


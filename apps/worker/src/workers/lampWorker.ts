import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import {
  LAMP_QUEUE_NAME,
  QueuedJobEnvelope,
  LampJobPayload,
  LampSimulationUpdatePayload,
  LampJobPayloadSchema,
  lampUpdateChannel,
} from '@apex/shared/src/contracts/queues';

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL environment variable is required');
}

if (!process.env.LAMP_SERVICE_URL) {
  throw new Error('LAMP_SERVICE_URL environment variable is required');
}

const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const redisPubSub = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

async function logError(service: string, traceId: string, error: Error, context: Record<string, unknown>): Promise<void> {
  console.error(`[${service}] [${traceId}] Error:`, error.message, context);
}

export const lampWorker = new Worker<LampJobPayload, void>(
  LAMP_QUEUE_NAME,
  async (job: Job<QueuedJobEnvelope<LampJobPayload>>) => {
    const envelope = job.data;
    const { jobId, traceId, payload } = envelope;

    try {
      const validatedPayload = LampJobPayloadSchema.parse(payload);
      const simulationId = validatedPayload.scenarioId;

      const response = await fetch(`${process.env.LAMP_SERVICE_URL}/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(envelope),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LAMP service error: ${response.status} ${errorText}`);
      }

      if (!response.body) {
        throw new Error('LAMP service returned no response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const primaryUpdates: LampSimulationUpdatePayload[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((line) => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const updatePayload: LampSimulationUpdatePayload = {
                simulationId,
                status: data.status || 'running',
                progress: data.progress,
                result: data.result,
                updatedAt: new Date().toISOString(),
              };

              primaryUpdates.push(updatePayload);

              await redisPubSub.publish(
                lampUpdateChannel(simulationId),
                JSON.stringify(updatePayload)
              );
            } catch (parseError) {
              console.error('[lamp] Failed to parse SSE chunk:', parseError);
            }
          }
        }
      }

      const finalUpdate: LampSimulationUpdatePayload = {
        simulationId,
        status: 'completed',
        progress: 100,
        updatedAt: new Date().toISOString(),
      };

      primaryUpdates.push(finalUpdate);

      await redisPubSub.publish(
        lampUpdateChannel(simulationId),
        JSON.stringify(finalUpdate)
      );

      if (process.env.SHADOW_MODE_PERCENT && parseInt(process.env.SHADOW_MODE_PERCENT, 10) > 0) {
        const { runLampShadow } = await import('../../../infra/shadow/shadow_harness');
        runLampShadow(envelope, primaryUpdates).catch((err) => {
          console.error('[lamp] Shadow execution failed:', err);
        });
      }
    } catch (error) {
      const validatedPayload = LampJobPayloadSchema.parse(payload);
      const simulationId = validatedPayload.scenarioId;

      const errorPayload: LampSimulationUpdatePayload = {
        simulationId,
        status: 'error',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'LAMP_SERVICE_ERROR',
        },
        updatedAt: new Date().toISOString(),
      };

      await logError('lamp', traceId, error instanceof Error ? error : new Error(String(error)), {
        jobId,
        payload,
      });

      await redisPubSub.publish(
        lampUpdateChannel(simulationId),
        JSON.stringify(errorPayload)
      );

      throw error;
    }
  },
  {
    connection,
    concurrency: 3,
  }
);

lampWorker.on('completed', (job) => {
  console.log(`[lamp] Job ${job.id} completed`);
});

lampWorker.on('failed', (job, err) => {
  console.error(`[lamp] Job ${job?.id} failed:`, err.message);
});


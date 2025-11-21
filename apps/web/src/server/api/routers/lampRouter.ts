import { z } from 'zod';
import { randomUUID } from 'crypto';
import { enqueueLampJob } from '@/server/queues/producers';
import { LampJobPayloadSchema } from '@apex/shared/src/contracts/queues';

const StartSimulationSchema = z.object({
  scenarioId: z.string(),
  portfolioId: z.string().nullable().optional(),
  parameters: z.record(z.unknown()),
  horizonDays: z.number().int().positive().default(30),
  userId: z.string().uuid().nullable().optional(),
});

export async function startSimulation(input: z.infer<typeof StartSimulationSchema>) {
  const validated = StartSimulationSchema.parse(input);
  const traceId = randomUUID();

  const payload = LampJobPayloadSchema.parse({
    scenarioId: validated.scenarioId,
    portfolioId: validated.portfolioId ?? null,
    parameters: validated.parameters,
    horizonDays: validated.horizonDays,
  });

  const jobId = await enqueueLampJob(payload, validated.userId ?? null, traceId);

  return {
    jobId,
    traceId,
    simulationId: validated.scenarioId,
  };
}


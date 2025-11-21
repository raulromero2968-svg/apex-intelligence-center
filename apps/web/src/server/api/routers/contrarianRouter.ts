import { z } from 'zod';
import { randomUUID } from 'crypto';
import { enqueueContrarianJob } from '@/server/queues/producers';
import { ContrarianJobPayloadSchema } from '@apex/shared/src/contracts/queues';

const RunContrarianQuerySchema = z.object({
  query: z.string().min(1),
  mode: z.enum(['mainstream', 'contrarian', 'both']).default('both'),
  constraints: z.record(z.unknown()).optional(),
  language: z.string().default('en'),
  userId: z.string().uuid().nullable().optional(),
});

export async function runContrarianQuery(input: z.infer<typeof RunContrarianQuerySchema>) {
  const validated = RunContrarianQuerySchema.parse(input);
  const traceId = randomUUID();

  const payload = ContrarianJobPayloadSchema.parse({
    query: validated.query,
    mode: validated.mode,
    constraints: validated.constraints,
    language: validated.language,
  });

  const jobId = await enqueueContrarianJob(payload, validated.userId ?? null, traceId);

  return {
    jobId,
    traceId,
  };
}


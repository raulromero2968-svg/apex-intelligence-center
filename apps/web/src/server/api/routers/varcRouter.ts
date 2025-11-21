import { z } from 'zod';
import { randomUUID } from 'crypto';
import { enqueueVarcJob } from '@/server/queues/producers';
import { VarcJobPayloadSchema } from '@apex/shared/src/contracts/queues';

const RequestVarcForensicsSchema = z.object({
  cardId: z.string().nullable().optional(),
  imageUrl: z.string().url(),
  extraMetadata: z.record(z.unknown()).optional(),
  userId: z.string().uuid().nullable().optional(),
});

export async function requestVarcForensics(input: z.infer<typeof RequestVarcForensicsSchema>) {
  const validated = RequestVarcForensicsSchema.parse(input);
  const traceId = randomUUID();

  const payload = VarcJobPayloadSchema.parse({
    cardId: validated.cardId ?? null,
    imageUrl: validated.imageUrl,
    extraMetadata: validated.extraMetadata,
  });

  const jobId = await enqueueVarcJob(payload, validated.userId ?? null, traceId);

  return {
    jobId,
    traceId,
  };
}


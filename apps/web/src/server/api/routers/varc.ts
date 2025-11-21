import { z } from 'zod';
import { router, publicProcedure } from '../init';
import { enqueueVarcJob } from '@/server/queues/producers';
import { VarcJobPayloadSchema } from '@apex/shared';
import { varcQueue } from '@/server/queues/bullmqClient';

export const varcRouter = router({
  requestForensics: publicProcedure
    .input(
      z.object({
        cardId: z.string().nullable().optional(),
        imageUrl: z.string().url(),
        extraMetadata: z.record(z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const traceId = ctx.traceId;
      const userId = ctx.userId;

      const payload: z.infer<typeof VarcJobPayloadSchema> = {
        cardId: input.cardId ?? null,
        imageUrl: input.imageUrl,
        extraMetadata: input.extraMetadata,
      };

      const jobId = await enqueueVarcJob(payload, userId, traceId);

      return {
        jobId,
        traceId,
      };
    }),
});



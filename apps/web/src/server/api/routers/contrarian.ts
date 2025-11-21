import { z } from 'zod';
import { router, publicProcedure } from '../init';
import { enqueueContrarianJob } from '@/server/queues/producers';
import { ContrarianJobPayloadSchema } from '@apex/shared/src/contracts/queues';

export const contrarianRouter = router({
  runContrarianQuery: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        mode: z.enum(['mainstream', 'contrarian', 'both']).optional(),
        constraints: z.record(z.unknown()).optional(),
        language: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const traceId = ctx.traceId;
      const userId = ctx.userId;

      const payload: z.infer<typeof ContrarianJobPayloadSchema> = {
        query: input.query,
        mode: input.mode ?? 'both',
        constraints: input.constraints,
        language: input.language ?? 'en',
      };

      const jobId = await enqueueContrarianJob(payload, userId, traceId);

      return {
        jobId,
        traceId,
      };
    }),
});


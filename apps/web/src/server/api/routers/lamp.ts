import { z } from 'zod';
import { router, publicProcedure } from '../init';
import { enqueueLampJob } from '@/server/queues/producers';
import { LampJobPayloadSchema } from '@apex/shared/src/contracts/queues';

export const lampRouter = router({
  startSimulation: publicProcedure
    .input(
      z.object({
        scenarioId: z.string(),
        portfolioId: z.string().optional(),
        parameters: z.record(z.unknown()).optional(),
        horizonDays: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const traceId = ctx.traceId;
      const userId = ctx.userId;

      const payload: z.infer<typeof LampJobPayloadSchema> = {
        scenarioId: input.scenarioId,
        portfolioId: input.portfolioId ?? null,
        parameters: input.parameters ?? {},
        horizonDays: input.horizonDays ?? 30,
      };

      const jobId = await enqueueLampJob(payload, userId, traceId);

      return {
        jobId,
        traceId,
        simulationId: input.scenarioId,
      };
    }),
});


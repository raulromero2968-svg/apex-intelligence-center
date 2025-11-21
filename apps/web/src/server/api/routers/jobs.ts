import { z } from 'zod';
import { router, publicProcedure } from '../init';
import { varcQueue, lampQueue, contrarianQueue } from '@/server/queues/bullmqClient';

export const jobsRouter = router({
  getRunning: publicProcedure
    .input(
      z.object({
        limit: z.number().int().positive().max(100).optional().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;

      const [varcJobs, lampJobs, contrarianJobs] = await Promise.all([
        varcQueue.getJobs(['active', 'waiting', 'delayed'], 0, input.limit),
        lampQueue.getJobs(['active', 'waiting', 'delayed'], 0, input.limit),
        contrarianQueue.getJobs(['active', 'waiting', 'delayed'], 0, input.limit),
      ]);

      const allJobs = await Promise.all([
        ...varcJobs.map(async (job) => {
          const state = await job.getState();
          return {
            id: job.id!,
            type: 'varc' as const,
            status: (state === 'active' ? 'running' : state === 'failed' ? 'error' : 'running') as 'running' | 'completed' | 'error',
            createdAt: new Date(job.timestamp || Date.now()).toISOString(),
            jobId: job.id!,
          };
        }),
        ...lampJobs.map(async (job) => {
          const state = await job.getState();
          return {
            id: job.id!,
            type: 'lamp' as const,
            status: (state === 'active' ? 'running' : state === 'failed' ? 'error' : 'running') as 'running' | 'completed' | 'error',
            createdAt: new Date(job.timestamp || Date.now()).toISOString(),
            jobId: job.id!,
          };
        }),
        ...contrarianJobs.map(async (job) => {
          const state = await job.getState();
          return {
            id: job.id!,
            type: 'contrarian' as const,
            status: (state === 'active' ? 'running' : state === 'failed' ? 'error' : 'running') as 'running' | 'completed' | 'error',
            createdAt: new Date(job.timestamp || Date.now()).toISOString(),
            jobId: job.id!,
          };
        }),
      ]);

      const filteredJobs = userId
        ? allJobs.filter((job) => {
            const jobData = job.type === 'varc'
              ? varcJobs.find((j) => j.id === job.id)?.data
              : job.type === 'lamp'
                ? lampJobs.find((j) => j.id === job.id)?.data
                : contrarianJobs.find((j) => j.id === job.id)?.data;
            return (jobData as { userId?: string | null })?.userId === userId;
          })
        : allJobs;

      return filteredJobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }),
});


import { z } from 'zod';
import { router, publicProcedure } from '../init';
import { db } from '@/lib/db';
import { cardForensics } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const forensicsRouter = router({
  getByJobId: publicProcedure
    .input(
      z.object({
        jobId: z.string().uuid(),
      })
    )
    .query(async ({ input }) => {
      const result = await db
        .select()
        .from(cardForensics)
        .where(eq(cardForensics.jobId, input.jobId))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      return result[0];
    }),
});


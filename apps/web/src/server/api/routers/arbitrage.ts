import { z } from 'zod';
import { router, publicProcedure } from '../init';
import { db } from '@/lib/db';
import { arbitrageOpportunities } from '@apex/db';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { ArbitrageOpportunitySchema } from '@apex/shared';

export const arbitrageRouter = router({
  listOpportunities: publicProcedure
    .input(
      z.object({
        collection: z.string().optional(),
        status: z.enum(['open', 'stale', 'executed', 'ignored']).optional(),
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
        limit: z.number().int().positive().max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const conditions = [];

      if (input.collection) {
        conditions.push(eq(arbitrageOpportunities.baseCollection, input.collection));
      }

      if (input.status) {
        conditions.push(eq(arbitrageOpportunities.status, input.status));
      }

      if (input.from) {
        conditions.push(gte(arbitrageOpportunities.createdAt, new Date(input.from)));
      }

      if (input.to) {
        conditions.push(lte(arbitrageOpportunities.createdAt, new Date(input.to)));
      }

      const records = await db
        .select()
        .from(arbitrageOpportunities)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(arbitrageOpportunities.createdAt))
        .limit(input.limit);

      return records.map((record) => {
        const opportunity = {
          id: record.id,
          createdAt: record.createdAt.toISOString(),
          baseCollection: record.baseCollection,
          edgeBps: record.edgeBps,
          estimatedProfitUsd: parseFloat(record.estimatedProfitUsd),
          riskScore: record.riskScore,
          status: record.status as 'open' | 'stale' | 'executed' | 'ignored',
          legs: record.legs as any,
        };
        return ArbitrageOpportunitySchema.parse(opportunity);
      });
    }),

  getOpportunity: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .query(async ({ input }) => {
      const record = await db
        .select()
        .from(arbitrageOpportunities)
        .where(eq(arbitrageOpportunities.id, input.id))
        .limit(1)
        .then((rows) => rows[0] ?? null);

      if (!record) {
        return null;
      }

      const opportunity = {
        id: record.id,
        createdAt: record.createdAt.toISOString(),
        baseCollection: record.baseCollection,
        edgeBps: record.edgeBps,
        estimatedProfitUsd: parseFloat(record.estimatedProfitUsd),
        riskScore: record.riskScore,
        status: record.status as 'open' | 'stale' | 'executed' | 'ignored',
        legs: record.legs as any,
      };

      return ArbitrageOpportunitySchema.parse(opportunity);
    }),
});



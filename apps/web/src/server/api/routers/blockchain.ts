import { z } from 'zod';
import { router, publicProcedure } from '../init';
import { db } from '@/db';
import { blockchainFloorPrices } from '@apex/db';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import {
  SupportedChainSchema,
  SupportedCollectionSchema,
  FloorPriceRecordSchema,
} from '@apex/shared';

export const blockchainRouter = router({
  getLatestFloor: publicProcedure
    .input(
      z.object({
        chain: SupportedChainSchema,
        collection: SupportedCollectionSchema,
      })
    )
    .query(async ({ input }) => {
      const record = await db
        .select()
        .from(blockchainFloorPrices)
        .where(
          and(
            eq(blockchainFloorPrices.chain, input.chain),
            eq(blockchainFloorPrices.collection, input.collection)
          )
        )
        .orderBy(desc(blockchainFloorPrices.observedAt))
        .limit(1)
        .then((rows) => rows[0] ?? null);

      if (!record) {
        return null;
      }

      // Convert to FloorPriceRecord format
      const floorRecord = {
        id: record.id,
        chain: record.chain as z.infer<typeof SupportedChainSchema>,
        collection: record.collection as z.infer<typeof SupportedCollectionSchema>,
        tokenContract: record.tokenContract,
        currency: record.currency,
        floorPrice: record.floorPrice,
        floorPriceUsd: parseFloat(record.floorPriceUsd),
        blockNumber: record.blockNumber,
        txHash: record.txHash,
        observedAt: record.observedAt.toISOString(),
        liquidityVenue: record.liquidityVenue,
      };

      return FloorPriceRecordSchema.parse(floorRecord);
    }),

  getFloorHistory: publicProcedure
    .input(
      z.object({
        chain: SupportedChainSchema,
        collection: SupportedCollectionSchema,
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
      })
    )
    .query(async ({ input }) => {
      const conditions = [
        eq(blockchainFloorPrices.chain, input.chain),
        eq(blockchainFloorPrices.collection, input.collection),
      ];

      if (input.from) {
        conditions.push(gte(blockchainFloorPrices.observedAt, new Date(input.from)));
      }

      if (input.to) {
        conditions.push(lte(blockchainFloorPrices.observedAt, new Date(input.to)));
      }

      const records = await db
        .select()
        .from(blockchainFloorPrices)
        .where(and(...conditions))
        .orderBy(desc(blockchainFloorPrices.observedAt))
        .limit(1000);

      return records.map((record) => ({
        id: record.id,
        chain: record.chain as z.infer<typeof SupportedChainSchema>,
        collection: record.collection as z.infer<typeof SupportedCollectionSchema>,
        tokenContract: record.tokenContract,
        currency: record.currency,
        floorPrice: record.floorPrice,
        floorPriceUsd: parseFloat(record.floorPriceUsd),
        blockNumber: record.blockNumber,
        txHash: record.txHash,
        observedAt: record.observedAt.toISOString(),
        liquidityVenue: record.liquidityVenue,
      }));
    }),
});



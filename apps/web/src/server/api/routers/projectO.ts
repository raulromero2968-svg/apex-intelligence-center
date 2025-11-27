import { z } from 'zod';
import { router, publicProcedure } from '../init';
import { db } from '@/lib/db';
import {
  projectOotcOrders,
  projectOwhitelistPrices,
  projectOdiscordMessages,
} from '@apex/db';
import { eq, and, gte, desc } from 'drizzle-orm';

export const projectORouter = router({
  getOtcOrderBook: publicProcedure
    .input(
      z.object({
        cardId: z.string().optional(),
        side: z.enum(['buy', 'sell']).optional(),
      })
    )
    .query(async ({ input }) => {
      const conditions = [];

      if (input.cardId) {
        conditions.push(eq(projectOotcOrders.cardId, input.cardId));
      }

      if (input.side) {
        conditions.push(eq(projectOotcOrders.side, input.side));
      }

      const orders = await db
        .select()
        .from(projectOotcOrders)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(projectOotcOrders.createdAt))
        .limit(1000);

      // Aggregate by cardId and side
      const aggregated: Record<string, { buy: any[]; sell: any[] }> = {};

      for (const order of orders) {
        if (!aggregated[order.cardId]) {
          aggregated[order.cardId] = { buy: [], sell: [] };
        }

        if (order.side === 'buy') {
          aggregated[order.cardId].buy.push({
            orderId: order.orderId,
            price: parseFloat(order.price),
            priceCurrency: order.priceCurrency,
            size: order.size,
            traderHandle: order.traderHandle,
            source: order.source,
            createdAt: order.createdAt.toISOString(),
          });
        } else {
          aggregated[order.cardId].sell.push({
            orderId: order.orderId,
            price: parseFloat(order.price),
            priceCurrency: order.priceCurrency,
            size: order.size,
            traderHandle: order.traderHandle,
            source: order.source,
            createdAt: order.createdAt.toISOString(),
          });
        }
      }

      // Compute best bid/ask per card
      const result = Object.entries(aggregated).map(([cardId, orders]) => {
        const bestBid = orders.buy
          .sort((a, b) => b.price - a.price)[0] ?? null;
        const bestAsk = orders.sell
          .sort((a, b) => a.price - b.price)[0] ?? null;

        return {
          cardId,
          bestBid,
          bestAsk,
          buyDepth: orders.buy.length,
          sellDepth: orders.sell.length,
          totalBuySize: orders.buy.reduce((sum, o) => sum + o.size, 0),
          totalSellSize: orders.sell.reduce((sum, o) => sum + o.size, 0),
        };
      });

      return {
        aggregated: result,
        summary: {
          totalCards: result.length,
          totalOrders: orders.length,
        },
      };
    }),

  getWhitelistPriceHistory: publicProcedure
    .input(
      z.object({
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
        limit: z.number().int().positive().max(1000).default(100),
      })
    )
    .query(async ({ input }) => {
      const conditions = [];

      if (input.from) {
        conditions.push(gte(projectOwhitelistPrices.observedAt, new Date(input.from)));
      }

      if (input.to) {
        conditions.push(lte(projectOwhitelistPrices.observedAt, new Date(input.to)));
      }

      const prices = await db
        .select()
        .from(projectOwhitelistPrices)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(projectOwhitelistPrices.observedAt))
        .limit(input.limit);

      return prices.map((price) => ({
        id: price.id,
        chain: price.chain,
        tokenAddress: price.tokenAddress,
        price: parseFloat(price.price),
        priceUsd: parseFloat(price.priceUsd),
        blockNumber: price.blockNumber,
        txHash: price.txHash,
        observedAt: price.observedAt.toISOString(),
      }));
    }),

  getDiscordSentiment: publicProcedure
    .input(
      z.object({
        limit: z.number().int().positive().max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const messages = await db
        .select()
        .from(projectOdiscordMessages)
        .orderBy(desc(projectOdiscordMessages.createdAt))
        .limit(input.limit);

      // Compute sentiment summary
      const scores = messages
        .map((m) => m.sentimentScore)
        .filter((s): s is number => s !== null);

      const avgScore = scores.length > 0
        ? scores.reduce((sum, s) => sum + s, 0) / scores.length
        : 0;

      return {
        messages: messages.map((m) => ({
          id: m.id,
          messageId: m.messageId,
          author: m.author,
          content: m.content,
          sentimentScore: m.sentimentScore,
          channelId: m.channelId,
          createdAt: m.createdAt.toISOString(),
        })),
        summary: {
          avgScore,
          messageCount: messages.length,
          positiveCount: scores.filter((s) => s > 0).length,
          negativeCount: scores.filter((s) => s < 0).length,
          neutralCount: scores.filter((s) => s === 0).length,
        },
      };
    }),
});


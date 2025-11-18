/**
 * Type-safe card queries for Apex Intelligence
 *
 * All queries use Drizzle's relational API for proper type inference
 */

import { db } from '@/db';
import { cards, prices } from '@/db/schema';
import { desc, gte, and } from 'drizzle-orm';
import * as Sentry from '@sentry/nextjs';
import type { Span } from '@sentry/types';

/**
 * Get high-value cards with current prices from all sources
 *
 * This query uses the relational API with `with: { prices: ... }`
 * to ensure TypeScript correctly infers `card.prices` as Price[]
 * instead of never[].
 *
 * @param minApexScore - Minimum apex score threshold (default: 85)
 * @param limit - Maximum number of cards to fetch (default: 500)
 * @returns Cards with related prices, properly typed
 */
export async function getHighValueCardsWithPrices(
  minApexScore: number = 85,
  limit: number = 500
) {
  return Sentry.startSpan(
    { name: 'cards.getHighValueWithPrices', op: 'db' },
    async (span: Span) => {
      const result = await db.query.cards.findMany({
        where: and(
          gte(cards.apexScore, minApexScore)
        ),
        columns: {
          id: true,
          name: true,
          setName: true,
          cardNumber: true,
          game: true,
          artist: true,
          rarity: true,
          apexScore: true,
          tcgplayerId: true,
          scryfallId: true,
          justTcgId: true,
        },
        with: {
          prices: {
            columns: {
              id: true,
              source: true,
              date: true,
              market: true,
              low: true,
              high: true,
              psa10: true,
              psa9: true,
              cgcBlackLabel: true,
              bgs95: true,
            },
            orderBy: [desc(prices.date)],
            limit: 10, // Last 10 price points per card
          },
        },
        orderBy: [desc(cards.apexScore)],
        limit,
      });

      span?.setAttribute('cardCount', result.length);
      span?.setAttribute('minApexScore', minApexScore);

      return result;
    }
  );
}

/**
 * Get cards with latest price per source (for arbitrage scanning)
 *
 * This query is optimized for arbitrage detection by fetching
 * only the most recent price from each source.
 *
 * @param minApexScore - Minimum apex score threshold
 * @param limit - Maximum number of cards to fetch
 * @returns Cards with latest price per source
 */
export async function getCardsWithLatestPricesBySource(
  minApexScore: number = 85,
  limit: number = 500
) {
  return Sentry.startSpan(
    { name: 'cards.getWithLatestPrices', op: 'db' },
    async (span: Span) => {
      // First, get cards with all prices
      const cardsWithPrices = await getHighValueCardsWithPrices(minApexScore, limit);

      // Group prices by source and keep only the latest per source
      const result = cardsWithPrices.map((card) => {
        const pricesBySource = new Map<string, typeof card.prices[0]>();

        // Sort prices by date and keep the latest per source
        for (const price of card.prices) {
          const existing = pricesBySource.get(price.source);
          if (!existing || new Date(price.date) > new Date(existing.date)) {
            pricesBySource.set(price.source, price);
          }
        }

        return {
          ...card,
          prices: Array.from(pricesBySource.values()),
        };
      });

      span?.setAttribute('cardCount', result.length);

      return result;
    }
  );
}

/**
 * Get single card by ID with all related data
 *
 * @param cardId - Card ID
 * @returns Card with prices, sales, population reports, etc.
 */
export async function getCardById(cardId: string) {
  return Sentry.startSpan(
    { name: 'cards.getById', op: 'db' },
    async (span: Span) => {
      const result = await db.query.cards.findFirst({
        where: (cards, { eq }) => eq(cards.id, cardId),
        with: {
          prices: {
            orderBy: [desc(prices.date)],
            limit: 30, // Last 30 price points
          },
          sales: {
            orderBy: (sales, { desc }) => [desc(sales.saleDate)],
            limit: 20,
          },
          populationReports: {
            orderBy: (reports, { desc }) => [desc(reports.lastUpdated)],
          },
        },
      });

      span?.setAttribute('found', !!result);

      return result;
    }
  );
}

/**
 * Type exports for better DX
 *
 * These types are automatically inferred from the queries above
 * and will correctly show card.prices as Price[] (not never[])
 */
export type CardWithPrices = Awaited<ReturnType<typeof getHighValueCardsWithPrices>>[0];
export type CardWithLatestPrices = Awaited<ReturnType<typeof getCardsWithLatestPricesBySource>>[0];
export type CardWithAllRelations = Awaited<ReturnType<typeof getCardById>>;

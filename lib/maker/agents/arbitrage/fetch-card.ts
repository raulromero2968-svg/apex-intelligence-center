/**
 * Fetch Card Micro-Agent
 *
 * Retrieves card data with all associated prices from the database.
 * First step in the arbitrage scanning pipeline.
 */

import { db } from '@/db';
import { cards } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { CardWithPrices } from '../../types';

/**
 * Fetch a card with all its prices
 *
 * @param cardId - Card ID to fetch
 * @returns Card with associated prices
 * @throws Error if card not found or has no prices
 */
export async function fetchCardAgent(cardId: string): Promise<CardWithPrices> {
  const card = await db.query.cards.findFirst({
    where: eq(cards.id, cardId),
    with: {
      prices: {
        orderBy: (prices, { desc }) => [desc(prices.date)],
        limit: 10, // Get latest 10 price points per source
      },
    },
  });

  if (!card) {
    throw new Error(`Card not found: ${cardId}`);
  }

  if (!card.prices || card.prices.length === 0) {
    throw new Error(`No prices found for card: ${cardId}`);
  }

  return {
    cardId,
    card,
    prices: card.prices,
  };
}

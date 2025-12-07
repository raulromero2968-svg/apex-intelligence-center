/**
 * Portfolio Batch Add API Route
 *
 * Handles bulk portfolio item creation for authenticated users.
 * Primary endpoint for Guest Wallet → Authenticated User data migration.
 *
 * POST /api/portfolio/batch-add - Add multiple cards in one transaction
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { portfolios, holdings, cards } from '@/db/schema';
import { getUserFromRequest } from '@/lib/auth';
import { eq, and, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { z } from 'zod';

/**
 * Single item schema (matches MigrationPayload)
 */
const itemSchema = z.object({
  cardId: z.string().min(1, 'Card ID is required'),
  cardName: z.string().min(1, 'Card name is required'),
  set: z.string().min(1, 'Set is required'),
  quantity: z.number().int().positive().default(1),
  condition: z.enum(['mint', 'near-mint', 'excellent', 'good', 'light-play', 'played', 'poor']).default('near-mint'),
  purchasePrice: z.number().nonnegative().optional(),
  imageUrl: z.string().url().optional(),
});

/**
 * Batch request schema
 */
const batchAddSchema = z.object({
  items: z.array(itemSchema).min(1, 'At least one item is required').max(100, 'Maximum 100 items per batch'),
});

type BatchItem = z.infer<typeof itemSchema>;

/**
 * Get or create the user's default portfolio
 */
async function getOrCreateDefaultPortfolio(userId: string): Promise<string> {
  const existing = await db.query.portfolios.findFirst({
    where: and(
      eq(portfolios.userId, userId),
      eq(portfolios.name, 'Main')
    ),
  });

  if (existing) {
    return existing.id;
  }

  const portfolioId = randomUUID();
  await db.insert(portfolios).values({
    id: portfolioId,
    userId,
    name: 'Main',
  });

  return portfolioId;
}

/**
 * Ensure all cards exist in the database
 * Creates placeholder entries for any missing cards
 */
async function ensureCardsExist(items: BatchItem[]): Promise<void> {
  const cardIds = [...new Set(items.map((item) => item.cardId))];

  // Find existing cards
  const existingCards = await db.query.cards.findMany({
    where: inArray(cards.id, cardIds),
  });

  const existingCardIds = new Set(existingCards.map((c) => c.id));

  // Create missing cards
  const missingItems = items.filter((item) => !existingCardIds.has(item.cardId));
  const uniqueMissingCards = new Map<string, BatchItem>();

  for (const item of missingItems) {
    if (!uniqueMissingCards.has(item.cardId)) {
      uniqueMissingCards.set(item.cardId, item);
    }
  }

  if (uniqueMissingCards.size > 0) {
    const newCards = Array.from(uniqueMissingCards.values()).map((item) => ({
      id: item.cardId,
      name: item.cardName,
      setName: item.set,
      cardNumber: '',
      game: 'pokemon' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.insert(cards).values(newCards).onConflictDoNothing();
  }
}

/**
 * POST /api/portfolio/batch-add
 *
 * Batch add cards to the authenticated user's portfolio.
 * This is the primary endpoint for guest wallet migration.
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = batchAddSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: validation.error.errors[0].message,
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { items } = validation.data;

    // Get or create user's portfolio
    const portfolioId = await getOrCreateDefaultPortfolio(user.id);

    // Ensure all cards exist in database
    await ensureCardsExist(items);

    // Get existing holdings for this portfolio
    const cardIds = items.map((item) => item.cardId);
    const existingHoldings = await db.query.holdings.findMany({
      where: and(
        eq(holdings.portfolioId, portfolioId),
        inArray(holdings.cardId, cardIds)
      ),
    });

    const existingHoldingsMap = new Map(
      existingHoldings.map((h) => [h.cardId, h])
    );

    // Separate items into updates and inserts
    const updates: Array<{
      holdingId: string;
      quantity: number;
      costBasisUsd: number;
    }> = [];

    const inserts: Array<{
      id: string;
      portfolioId: string;
      cardId: string;
      quantity: number;
      costBasisUsd: number;
      acquiredDate: Date;
      notes: string | null;
    }> = [];

    const results: Array<{
      cardId: string;
      cardName: string;
      action: 'created' | 'updated';
      holdingId: string;
      quantity: number;
    }> = [];

    for (const item of items) {
      const existing = existingHoldingsMap.get(item.cardId);

      if (existing) {
        // Update existing holding
        const newQuantity = existing.quantity + item.quantity;
        const newCostBasis = item.purchasePrice
          ? (existing.costBasisUsd * existing.quantity + item.purchasePrice * item.quantity) / newQuantity
          : existing.costBasisUsd;

        updates.push({
          holdingId: existing.id,
          quantity: newQuantity,
          costBasisUsd: newCostBasis,
        });

        results.push({
          cardId: item.cardId,
          cardName: item.cardName,
          action: 'updated',
          holdingId: existing.id,
          quantity: newQuantity,
        });

        // Update the map for potential duplicate items in batch
        existingHoldingsMap.set(item.cardId, {
          ...existing,
          quantity: newQuantity,
          costBasisUsd: newCostBasis,
        });
      } else {
        // Create new holding
        const holdingId = randomUUID();

        inserts.push({
          id: holdingId,
          portfolioId,
          cardId: item.cardId,
          quantity: item.quantity,
          costBasisUsd: item.purchasePrice || 0,
          acquiredDate: new Date(),
          notes: item.condition ? `Condition: ${item.condition}` : null,
        });

        results.push({
          cardId: item.cardId,
          cardName: item.cardName,
          action: 'created',
          holdingId,
          quantity: item.quantity,
        });

        // Add to map for potential duplicate items in batch
        existingHoldingsMap.set(item.cardId, {
          id: holdingId,
          portfolioId,
          cardId: item.cardId,
          quantity: item.quantity,
          costBasisUsd: item.purchasePrice || 0,
          acquiredDate: new Date(),
          grade: null,
          gradingCompany: null,
          certNumber: null,
          notes: item.condition ? `Condition: ${item.condition}` : null,
          createdAt: new Date(),
        });
      }
    }

    // Execute batch updates
    for (const update of updates) {
      await db
        .update(holdings)
        .set({
          quantity: update.quantity,
          costBasisUsd: update.costBasisUsd,
        })
        .where(eq(holdings.id, update.holdingId));
    }

    // Execute batch inserts
    if (inserts.length > 0) {
      await db.insert(holdings).values(inserts);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${items.length} items`,
      summary: {
        total: items.length,
        created: inserts.length,
        updated: updates.length,
      },
      results,
    });
  } catch (error) {
    console.error('Portfolio batch add error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to batch add items',
      },
      { status: 500 }
    );
  }
}

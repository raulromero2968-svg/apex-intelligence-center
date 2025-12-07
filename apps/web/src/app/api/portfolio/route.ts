/**
 * Portfolio API Route
 *
 * Handles individual portfolio item creation for authenticated users.
 * Part of the Guest Wallet → Authenticated User data migration flow.
 *
 * POST /api/portfolio - Add a single card to user's portfolio
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { portfolios, holdings, cards } from '@/db/schema';
import { getUserFromRequest } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { z } from 'zod';

/**
 * Validation schema for portfolio item creation
 * Maps from MigrationPayload in guest-portfolio.ts
 */
const addItemSchema = z.object({
  cardId: z.string().min(1, 'Card ID is required'),
  cardName: z.string().min(1, 'Card name is required'),
  set: z.string().min(1, 'Set is required'),
  quantity: z.number().int().positive('Quantity must be positive').default(1),
  condition: z.enum(['mint', 'near-mint', 'excellent', 'good', 'light-play', 'played', 'poor']).default('near-mint'),
  purchasePrice: z.number().nonnegative().optional(),
  imageUrl: z.string().url().optional(),
});

type AddItemInput = z.infer<typeof addItemSchema>;

/**
 * Get or create the user's default portfolio
 */
async function getOrCreateDefaultPortfolio(userId: string): Promise<string> {
  // Check for existing default portfolio
  const existing = await db.query.portfolios.findFirst({
    where: and(
      eq(portfolios.userId, userId),
      eq(portfolios.name, 'Main')
    ),
  });

  if (existing) {
    return existing.id;
  }

  // Create new default portfolio
  const portfolioId = randomUUID();
  await db.insert(portfolios).values({
    id: portfolioId,
    userId,
    name: 'Main',
  });

  return portfolioId;
}

/**
 * Find or create card in the cards table
 * Returns the card ID for the holding reference
 */
async function ensureCardExists(input: AddItemInput): Promise<string> {
  // Check if card already exists by tcgPlayerId
  const existing = await db.query.cards.findFirst({
    where: eq(cards.id, input.cardId),
  });

  if (existing) {
    return existing.id;
  }

  // Create placeholder card entry
  // In production, you'd fetch full card data from TCGPlayer API
  const cardId = input.cardId;
  await db.insert(cards).values({
    id: cardId,
    name: input.cardName,
    setName: input.set,
    cardNumber: '', // Would be populated from API
    game: 'pokemon', // Default, would be detected from API
    createdAt: new Date(),
    updatedAt: new Date(),
  }).onConflictDoNothing();

  return cardId;
}

/**
 * POST /api/portfolio
 *
 * Add a single card to the authenticated user's portfolio
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
    const validation = addItemSchema.safeParse(body);

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

    const input = validation.data;

    // Get or create user's portfolio
    const portfolioId = await getOrCreateDefaultPortfolio(user.id);

    // Ensure card exists in database
    const cardId = await ensureCardExists(input);

    // Check if holding already exists for this card
    const existingHolding = await db.query.holdings.findFirst({
      where: and(
        eq(holdings.portfolioId, portfolioId),
        eq(holdings.cardId, cardId)
      ),
    });

    if (existingHolding) {
      // Update existing holding quantity
      const newQuantity = existingHolding.quantity + input.quantity;
      await db
        .update(holdings)
        .set({
          quantity: newQuantity,
          // Update cost basis as weighted average if purchase price provided
          costBasisUsd: input.purchasePrice
            ? (existingHolding.costBasisUsd * existingHolding.quantity + input.purchasePrice * input.quantity) / newQuantity
            : existingHolding.costBasisUsd,
        })
        .where(eq(holdings.id, existingHolding.id));

      return NextResponse.json({
        success: true,
        holdingId: existingHolding.id,
        action: 'updated',
        quantity: newQuantity,
      });
    }

    // Create new holding
    const holdingId = randomUUID();
    await db.insert(holdings).values({
      id: holdingId,
      portfolioId,
      cardId,
      quantity: input.quantity,
      costBasisUsd: input.purchasePrice || 0,
      acquiredDate: new Date(),
      notes: input.condition ? `Condition: ${input.condition}` : null,
    });

    return NextResponse.json(
      {
        success: true,
        holdingId,
        action: 'created',
        quantity: input.quantity,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Portfolio add error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to add item to portfolio',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/portfolio
 *
 * Get the authenticated user's portfolio holdings
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's portfolios with holdings
    const userPortfolios = await db.query.portfolios.findMany({
      where: eq(portfolios.userId, user.id),
      with: {
        holdings: {
          with: {
            card: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      portfolios: userPortfolios,
    });
  } catch (error) {
    console.error('Portfolio fetch error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch portfolio',
      },
      { status: 500 }
    );
  }
}

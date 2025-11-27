/**
 * Watchlist API Routes
 *
 * Manages user watchlist items with tiered limits:
 * - Free: 10 items
 * - Pro: 100 items
 * - Enterprise: Unlimited
 *
 * All limits enforced server-side with zero trust.
 */

import { NextRequest } from 'next/server';
import { db } from '@/db';
import { watchlistItems, users, cards } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getUserFromRequest } from '@/lib/auth';
import { getTierLimits } from '@/lib/stripe';
import {
  AuthenticationError,
  ValidationError,
  TierLimitError,
  NotFoundError,
  handleApiError,
} from '@/lib/errors';
import { z } from 'zod';


// Force dynamic rendering - do not attempt static analysis during build
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const createWatchlistSchema = z.object({
  cardId: z.string().min(1, 'Card ID is required'),
  targetPrice: z.number().positive('Target price must be positive'),
  direction: z.enum(['above', 'below']),
});

/**
 * GET /api/watchlist
 * Get all watchlist items for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    const items = await db.query.watchlistItems.findMany({
      where: eq(watchlistItems.userId, user.id),
      with: {
        card: true,
      },
      orderBy: (watchlistItems, { desc }) => [desc(watchlistItems.createdAt)],
    });

    return Response.json({
      items,
      count: items.length,
      tier: user.subscriptionTier,
      limit: getTierLimits(user.subscriptionTier).watchlistLimit,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/watchlist
 * Create a new watchlist item (tier-limited)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    // Validate request body
    const body = await req.json();
    const { cardId, targetPrice, direction } = createWatchlistSchema.parse(body);

    // Check tier limit
    const tierLimits = getTierLimits(user.subscriptionTier);
    const currentCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(watchlistItems)
      .where(eq(watchlistItems.userId, user.id));

    const count = currentCount[0]?.count || 0;

    if (count >= tierLimits.watchlistLimit) {
      throw new TierLimitError(
        `Watchlist limit reached (${tierLimits.watchlistLimit} items). Upgrade to add more.`,
        tierLimits.watchlistLimit,
        user.subscriptionTier
      );
    }

    // Verify card exists
    const card = await db.query.cards.findFirst({
      where: eq(cards.id, cardId),
    });

    if (!card) {
      throw new NotFoundError('Card not found');
    }

    // Check if watchlist item already exists for this user and card
    const existingItem = await db.query.watchlistItems.findFirst({
      where: and(
        eq(watchlistItems.userId, user.id),
        eq(watchlistItems.cardId, cardId)
      ),
    });

    if (existingItem) {
      // Update existing item
      const updated = await db
        .update(watchlistItems)
        .set({
          targetPrice,
          direction,
          isTriggered: false,
          triggeredAt: null,
        })
        .where(eq(watchlistItems.id, existingItem.id))
        .returning();

      return Response.json({
        item: updated[0],
        updated: true,
      });
    }

    // Create new watchlist item
    const newItem = await db
      .insert(watchlistItems)
      .values({
        id: crypto.randomUUID(),
        userId: user.id,
        cardId,
        targetPrice,
        direction,
        isTriggered: false,
      })
      .returning();

    return Response.json({
      item: newItem[0],
      created: true,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleApiError(new ValidationError(error.errors[0].message));
    }
    return handleApiError(error);
  }
}

/**
 * DELETE /api/watchlist
 * Delete a watchlist item
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('id');

    if (!itemId) {
      throw new ValidationError('Item ID is required');
    }

    // Verify item belongs to user
    const item = await db.query.watchlistItems.findFirst({
      where: and(
        eq(watchlistItems.id, itemId),
        eq(watchlistItems.userId, user.id)
      ),
    });

    if (!item) {
      throw new NotFoundError('Watchlist item not found');
    }

    await db
      .delete(watchlistItems)
      .where(eq(watchlistItems.id, itemId));

    return Response.json({
      deleted: true,
      id: itemId,
    });
  } catch (error) {
    return handleApiError(error);
  }
}


/**
 * Watchlist API - CRUD Operations for Price Alerts
 *
 * Features:
 * - Add/update/remove watchlist items
 * - Get user's watchlist with card details
 * - Redis caching for fast lookups
 * - JWT authentication required
 * - Upsert semantics (one card per user)
 *
 * Production patterns from knowledge-10-api-realtime.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/jwt';
import { db } from '@/db';
import { watchlistItems, cards } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { invalidateUserWatchlistCache, cacheUserWatchlist } from '@/lib/redis';
import { WatchlistConfig } from '@/lib/edge-config';
import { randomUUID } from 'crypto';

/**
 * GET /api/watchlist - Get user's watchlist
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - please log in' },
        { status: 401 }
      );
    }

    // Fetch watchlist with card details (using Drizzle relations)
    const items = await db.query.watchlistItems.findMany({
      where: eq(watchlistItems.userId, user.id),
      with: {
        card: true,
      },
      orderBy: (items, { desc }) => [desc(items.createdAt)],
    });

    return NextResponse.json({
      items,
      count: items.length,
    });
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watchlist' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/watchlist - Add or update watchlist item
 *
 * Body: { cardId, targetPrice?, direction?: 'above' | 'below' }
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - please log in' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { cardId, targetPrice, direction } = body;

    if (!cardId) {
      return NextResponse.json(
        { error: 'Missing required field: cardId' },
        { status: 400 }
      );
    }

    // Validate target price and direction together
    if (targetPrice && !direction) {
      return NextResponse.json(
        { error: 'direction is required when targetPrice is set' },
        { status: 400 }
      );
    }

    if (direction && !['above', 'below'].includes(direction)) {
      return NextResponse.json(
        { error: 'direction must be "above" or "below"' },
        { status: 400 }
      );
    }

    // Check if card exists
    const card = await db.query.cards.findFirst({
      where: eq(cards.id, cardId),
    });

    if (!card) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      );
    }

    // Check user's watchlist limit
    const maxItems = await WatchlistConfig.getMaxItemsPerUser();
    const existingCount = await db
      .select({ count: watchlistItems.id })
      .from(watchlistItems)
      .where(eq(watchlistItems.userId, user.id));

    const currentCount = existingCount.length;

    // Check if this is an update (item already exists)
    const existingItem = await db.query.watchlistItems.findFirst({
      where: and(
        eq(watchlistItems.userId, user.id),
        eq(watchlistItems.cardId, cardId)
      ),
    });

    if (!existingItem && currentCount >= maxItems) {
      return NextResponse.json(
        {
          error: `Watchlist limit reached (${maxItems} items). Remove an item to add more.`,
          limit: maxItems,
          current: currentCount,
        },
        { status: 429 }
      );
    }

    // Upsert watchlist item (insert or update if exists)
    const [item] = await db
      .insert(watchlistItems)
      .values({
        id: randomUUID(),
        userId: user.id,
        cardId,
        targetPrice: targetPrice ?? null,
        direction: direction ?? null,
        notified: false,
      })
      .onConflictDoUpdate({
        target: [watchlistItems.userId, watchlistItems.cardId],
        set: {
          targetPrice: targetPrice ?? null,
          direction: direction ?? null,
          notified: false,
          updatedAt: new Date(),
        },
      })
      .returning();

    // Invalidate cache
    await invalidateUserWatchlistCache(user.id);

    return NextResponse.json({
      item,
      message: existingItem ? 'Watchlist item updated' : 'Added to watchlist',
    });
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to add to watchlist' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/watchlist?cardId=... - Remove item from watchlist
 */
export async function DELETE(req: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - please log in' },
        { status: 401 }
      );
    }

    // Get cardId from query params
    const { searchParams } = new URL(req.url);
    const cardId = searchParams.get('cardId');

    if (!cardId) {
      return NextResponse.json(
        { error: 'Missing required parameter: cardId' },
        { status: 400 }
      );
    }

    // Delete watchlist item
    const deleted = await db
      .delete(watchlistItems)
      .where(
        and(
          eq(watchlistItems.userId, user.id),
          eq(watchlistItems.cardId, cardId)
        )
      )
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Watchlist item not found' },
        { status: 404 }
      );
    }

    // Invalidate cache
    await invalidateUserWatchlistCache(user.id);

    return NextResponse.json({
      message: 'Removed from watchlist',
      cardId,
    });
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to remove from watchlist' },
      { status: 500 }
    );
  }
}

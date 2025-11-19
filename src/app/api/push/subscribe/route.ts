/**
 * Web Push Subscription API
 *
 * Manages browser push notification subscriptions
 *
 * POST /api/push/subscribe - Register new push subscription
 * DELETE /api/push/subscribe - Unregister push subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/jwt';
import { db } from '@/db';
import { pushSubscriptions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { isValidPushSubscription } from '@/lib/webpush';
import { randomUUID } from 'crypto';

/**
 * POST /api/push/subscribe - Register push subscription
 *
 * Body: {
 *   subscription: {
 *     endpoint: string,
 *     keys: { p256dh: string, auth: string }
 *   },
 *   cardId?: string // Optional: subscribe to specific card
 * }
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
    const { subscription, cardId } = body;

    // Validate subscription
    if (!isValidPushSubscription(subscription)) {
      return NextResponse.json(
        { error: 'Invalid push subscription format' },
        { status: 400 }
      );
    }

    // Check if subscription already exists
    const existing = await db.query.pushSubscriptions.findFirst({
      where: eq(pushSubscriptions.endpoint, subscription.endpoint),
    });

    if (existing) {
      return NextResponse.json({
        message: 'Subscription already registered',
        subscription: existing,
      });
    }

    // Insert new subscription
    const [newSub] = await db
      .insert(pushSubscriptions)
      .values({
        id: randomUUID(),
        userId: user.id,
        cardId: cardId || null,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      })
      .returning();

    return NextResponse.json({
      message: 'Push subscription registered',
      subscription: newSub,
    });
  } catch (error) {
    console.error('Error registering push subscription:', error);
    return NextResponse.json(
      { error: 'Failed to register push subscription' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/push/subscribe - Unregister push subscription
 *
 * Query params: endpoint (URL-encoded)
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

    // Get endpoint from query params
    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Missing required parameter: endpoint' },
        { status: 400 }
      );
    }

    // Delete subscription
    const deleted = await db
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, user.id),
          eq(pushSubscriptions.endpoint, endpoint)
        )
      )
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Push subscription removed',
    });
  } catch (error) {
    console.error('Error removing push subscription:', error);
    return NextResponse.json(
      { error: 'Failed to remove push subscription' },
      { status: 500 }
    );
  }
}

/**
 * Push Notification Subscription API
 *
 * Endpoint: POST /api/push/subscribe
 * Purpose: Register a device's Expo push token for receiving notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { isValidExpoPushToken } from '@/lib/push-server';

// Request validation schema
const SubscribeSchema = z.object({
  token: z.string().min(1),
  userId: z.string().min(1),
  platform: z.enum(['ios', 'android']),
  deviceId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const transaction = Sentry.startTransaction({
    name: 'POST /api/push/subscribe',
    op: 'http.server',
  });

  try {
    // Parse request body
    const body = await request.json();
    const validation = SubscribeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { token, userId, platform, deviceId } = validation.data;

    // Validate Expo push token format
    if (!isValidExpoPushToken(token)) {
      return NextResponse.json({ error: 'Invalid Expo push token' }, { status: 400 });
    }

    // TODO: Store token in database
    // Example implementation:
    // await db.insert(pushTokens).values({
    //   userId,
    //   token,
    //   platform,
    //   deviceId,
    //   createdAt: new Date(),
    //   updatedAt: new Date(),
    // }).onConflictDoUpdate({
    //   target: pushTokens.token,
    //   set: {
    //     userId,
    //     platform,
    //     deviceId,
    //     updatedAt: new Date(),
    //   },
    // });

    console.log(`Registered push token for user ${userId} on ${platform}`);

    Sentry.addBreadcrumb({
      category: 'push',
      message: 'Push token registered',
      level: 'info',
      data: { userId, platform },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Push token registered successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    Sentry.captureException(error);
    console.error('Push subscription error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    transaction.finish();
  }
}

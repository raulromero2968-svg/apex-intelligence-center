/**
 * POST /api/push/register
 * Register a mobile push token (FCM or Expo)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/db';
import { mobilePushTokens } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { token, type, deviceId, platform } = body;

    if (!token || !type) {
      return NextResponse.json(
        { error: 'Token and type are required' },
        { status: 400 }
      );
    }

    if (type !== 'fcm' && type !== 'expo') {
      return NextResponse.json(
        { error: 'Type must be either "fcm" or "expo"' },
        { status: 400 }
      );
    }

    // Check if token already exists
    const existingToken = await db.query.mobilePushTokens.findFirst({
      where: eq(mobilePushTokens.token, token),
    });

    if (existingToken) {
      // Update existing token
      await db
        .update(mobilePushTokens)
        .set({
          active: true,
          lastUsedAt: new Date(),
          updatedAt: new Date(),
          deviceId: deviceId || existingToken.deviceId,
          platform: platform || existingToken.platform,
        })
        .where(eq(mobilePushTokens.token, token));

      return NextResponse.json({
        success: true,
        message: 'Token updated',
        tokenId: existingToken.id,
      });
    }

    // Insert new token
    const [newToken] = await db
      .insert(mobilePushTokens)
      .values({
        userId: session.user.id,
        token,
        type,
        deviceId,
        platform,
        active: true,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Token registered',
      tokenId: newToken.id,
    });
  } catch (error) {
    console.error('Error registering push token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

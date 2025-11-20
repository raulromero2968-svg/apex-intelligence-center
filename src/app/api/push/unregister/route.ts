/**
 * POST /api/push/unregister
 * Unregister a mobile push token
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { mobilePushTokens } from '@/lib/db';
import { eq } from 'drizzle-orm';
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
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Mark token as inactive
    await db
      .update(mobilePushTokens)
      .set({
        active: false,
        updatedAt: new Date(),
      })
      .where(eq(mobilePushTokens.token, token));

    return NextResponse.json({
      success: true,
      message: 'Token unregistered',
    });
  } catch (error) {
    console.error('Error unregistering push token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

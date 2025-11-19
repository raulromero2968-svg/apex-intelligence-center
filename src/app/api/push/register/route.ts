import { NextRequest, NextResponse } from 'next/server';
import { Expo } from 'expo-server-sdk';

import { getUserFromRequest, UserWithTier } from '@/lib/auth/jwt';

function isExpoPushToken(token: string): boolean {
  return Expo.isExpoPushToken(token);
}

export async function POST(request: NextRequest) {
  try {
    const user: UserWithTier | null = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { expoPushToken } = await request.json();

    if (typeof expoPushToken !== 'string' || !isExpoPushToken(expoPushToken)) {
      return NextResponse.json({ error: 'Invalid Expo push token' }, { status: 400 });
    }

    // TODO: Persist the Expo push token for this user once the mobile tokens table is available.
    // await db
    //   .insert(mobilePushTokens)
    //   .values({ userId: user.id, token: expoPushToken })
    //   .onConflictDoUpdate({ ... });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PUSH_REGISTER_ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';


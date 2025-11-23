/**
 * Session Heartbeat API
 *
 * Receives heartbeat from client and updates Redis with session activity.
 * Used to track active session time across multiple tabs/devices.
 */

import { NextRequest, NextResponse } from 'next/server';
import { redis, RedisKeys, CacheTTL } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, totalActiveTime, lastHeartbeat } = body;

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Store session activity in Redis with short TTL
    // This allows us to see which users are currently active
    const sessionKey = RedisKeys.sessionActivity(userId);

    const sessionData = {
      totalActiveTime,
      lastHeartbeat,
      timestamp: Date.now(),
    };

    // @ts-ignore - Redis type resolution issue
    await redis.set(sessionKey, JSON.stringify(sessionData), {
      ex: CacheTTL.SESSION_ACTIVITY,
    });

    return NextResponse.json({
      ok: true,
      synced: true,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Session heartbeat error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to sync heartbeat' },
      { status: 500 }
    );
  }
}

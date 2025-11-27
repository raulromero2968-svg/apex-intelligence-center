/**
 * Reality Check Force Trigger API
 *
 * Admin endpoint to force trigger reality check for all active users.
 * Sets a global flag in Redis that clients will pick up via SSE.
 */

import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - do not attempt static analysis during build
export const dynamic = 'force-dynamic';
import { redis, RedisKeys, CacheTTL } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    // In production, add authentication check here
    // For now, allow any POST to trigger (for demo purposes)

    // Generate unique trigger ID
    const triggerId = `trigger-${Date.now()}`;

    // Set global trigger flag with TTL
    // @ts-ignore - Redis type resolution issue
    await redis.set(
      RedisKeys.realityCheckTrigger(),
      triggerId,
      { ex: CacheTTL.REALITY_CHECK_TRIGGER }
    );

    // Publish to pub/sub channel (if available)
    // This would notify all connected SSE clients immediately
    try {
      // @ts-ignore - publish may not be available in Upstash REST API
    // @ts-ignore - Redis type resolution issue
      await redis.publish(RedisKeys.realityCheckChannel(), triggerId);
    } catch {
      // Pub/sub not available, clients will pick up via SSE polling
    }

    return NextResponse.json({
      ok: true,
      triggerId,
      message: 'Reality check triggered for all users',
    });
  } catch (error) {
    console.error('Reality check trigger error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to trigger reality check' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Clear global trigger
    // @ts-ignore - Redis type resolution issue
    await redis.del(RedisKeys.realityCheckTrigger());

    return NextResponse.json({
      ok: true,
      message: 'Reality check trigger cleared',
    });
  } catch (error) {
    console.error('Reality check clear error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to clear trigger' },
      { status: 500 }
    );
  }
}

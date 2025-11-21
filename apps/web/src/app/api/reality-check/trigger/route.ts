/**
 * Reality Check Force Trigger API
 *
 * Admin endpoint to force trigger reality check for all active users.
 * Sets a global flag in Redis that clients will pick up.
 */

import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

const REDIS_KEY = 'reality-check:global-trigger';
const TRIGGER_TTL = 60 * 60; // 1 hour TTL for trigger

export async function POST(request: NextRequest) {
  try {
    // In production, add authentication check here
    // For now, allow any POST to trigger (for demo purposes)

    // Generate unique trigger ID
    const triggerId = `trigger-${Date.now()}`;

    // Set global trigger flag with TTL
    await redis.set(REDIS_KEY, triggerId, { ex: TRIGGER_TTL });

    // Publish to pub/sub channel (if available)
    // This would notify all connected clients immediately
    try {
      // @ts-expect-error - publish may not be available in Upstash REST API
      await redis.publish('reality-check:trigger', triggerId);
    } catch {
      // Pub/sub not available, clients will pick up via polling
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
    await redis.del(REDIS_KEY);

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

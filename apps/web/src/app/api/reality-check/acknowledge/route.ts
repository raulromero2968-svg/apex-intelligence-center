/**
 * Reality Check Acknowledge API
 *
 * Marks that the user has seen the reality check modal.
 */

import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

const REDIS_KEY = 'reality-check:global-trigger';
const REDIS_USER_ACK_KEY = (userId: string) => `reality-check:ack:${userId}`;
const ACK_TTL = 60 * 60 * 24; // 24 hours

export async function POST(request: NextRequest) {
  try {
    // Get user ID from session/cookie or use a temporary client ID
    const userId = request.cookies.get('apex_client_id')?.value || 'anonymous';

    // Get current global trigger ID
    const globalTrigger = await redis.get(REDIS_KEY);

    if (globalTrigger) {
      // Store acknowledgment with TTL
      await redis.set(
        REDIS_USER_ACK_KEY(userId),
        globalTrigger as string,
        { ex: ACK_TTL }
      );
    }

    return NextResponse.json({
      ok: true,
      acknowledged: true,
    });
  } catch (error) {
    console.error('Reality check acknowledge error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to acknowledge' },
      { status: 500 }
    );
  }
}

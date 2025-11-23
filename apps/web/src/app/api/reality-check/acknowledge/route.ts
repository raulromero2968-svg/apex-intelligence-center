/**
 * Reality Check Acknowledge API
 *
 * Marks that the user has seen the reality check modal.
 */

import { NextRequest, NextResponse } from 'next/server';
import { redis, RedisKeys, CacheTTL } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    // Get user ID from session/cookie or use a temporary client ID
    const userId = request.cookies.get('apex_client_id')?.value || 'anonymous';

    // Get current global trigger ID
    // @ts-ignore - Redis type resolution issue with ioredis conflict
    const globalTrigger = await redis.get(RedisKeys.realityCheckTrigger());

    if (globalTrigger) {
      // Store acknowledgment with TTL
    // @ts-ignore - Redis type resolution issue
      await redis.set(
        RedisKeys.realityCheckAck(userId),
        globalTrigger as string,
        { ex: CacheTTL.REALITY_CHECK_ACK }
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

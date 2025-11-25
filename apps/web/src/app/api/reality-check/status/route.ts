/**
 * Reality Check Status API
 *
 * Checks if a reality check should be triggered for the current user.
 * Uses Redis to coordinate global force triggers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { redisGet, RedisKeys } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from session/cookie or use a temporary client ID
    const userId = request.cookies.get('apex_client_id')?.value || 'anonymous';

    // Check if there's a global trigger active
    const globalTrigger = await redisGet(RedisKeys.realityCheckTrigger());

    if (globalTrigger) {
      // Check if user has already acknowledged this trigger
      const userAck = await redisGet(RedisKeys.realityCheckAck(userId));

      if (!userAck || userAck !== globalTrigger) {
        // User hasn't seen this trigger yet
        return NextResponse.json({
          shouldTrigger: true,
          triggerId: globalTrigger,
        });
      }
    }

    return NextResponse.json({
      shouldTrigger: false,
      triggerId: null,
    });
  } catch (error) {
    console.error('Reality check status error:', error);
    return NextResponse.json(
      { shouldTrigger: false, error: 'Failed to check status' },
      { status: 500 }
    );
  }
}

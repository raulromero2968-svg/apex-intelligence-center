/**
 * Reality Check Status API
 *
 * Checks if a reality check should be triggered for the current user.
 * Uses Redis to coordinate global force triggers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

const REDIS_KEY = 'reality-check:global-trigger';
const REDIS_USER_ACK_KEY = (userId: string) => `reality-check:ack:${userId}`;

export async function GET(request: NextRequest) {
  try {
    // Get user ID from session/cookie or use a temporary client ID
    const userId = request.cookies.get('apex_client_id')?.value || 'anonymous';

    // Check if there's a global trigger active
    const globalTrigger = await redis.get(REDIS_KEY);

    if (globalTrigger) {
      // Check if user has already acknowledged this trigger
      const userAck = await redis.get(REDIS_USER_ACK_KEY(userId));

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

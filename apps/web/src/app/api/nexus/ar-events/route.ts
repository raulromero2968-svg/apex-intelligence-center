/**
 * Nexus AR Events API
 *
 * Endpoint for managing location-based AR events.
 * Integrates with weather data and user preferences.
 *
 * @see knowledge-09-database-architecture for pgvector
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getLimitForTier, ratelimit } from '@/lib/rate-limit';
import { getActiveAREvents } from '@/lib/customer-ux';
import { db } from '@/db';
import { arEvents } from '@/db/schema/customer-ux';
import { eq, and } from 'drizzle-orm';

// ============================================================================
// GET: Fetch active AR events
// ============================================================================

/**
 * GET /api/nexus/ar-events
 *
 * Fetches active AR events for the authenticated user.
 *
 * Returns:
 * - events: Array of active AR events
 * - count: Total count
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authentication
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Rate limiting
    const limit = getLimitForTier(user.subscriptionTier);
    const { success } = await ratelimit(limit, `nexus:ar:${user.id}`, 60);

    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // 3. Fetch active events
    const events = await getActiveAREvents(user.id);

    // 4. Return events
    return NextResponse.json({
      success: true,
      data: {
        events,
        count: events.length,
      },
      meta: {
        userId: user.id,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[API] nexus/ar-events GET error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch AR events',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST: Participate in AR event
// ============================================================================

/**
 * POST /api/nexus/ar-events
 *
 * Mark participation in an AR event.
 *
 * Body:
 * - eventId: ID of the AR event
 * - action: 'participate' | 'collect_rewards'
 *
 * Returns:
 * - success: boolean
 * - rewards: (if action is collect_rewards)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const { eventId, action } = body;

    if (!eventId || !action) {
      return NextResponse.json(
        { error: 'Missing eventId or action' },
        { status: 400 }
      );
    }

    // 3. Handle action
    switch (action) {
      case 'participate': {
        await db
          .update(arEvents)
          .set({
            participated: true,
          })
          .where(and(eq(arEvents.id, eventId), eq(arEvents.userId, user.id)));

        return NextResponse.json({
          success: true,
          message: 'Participation recorded',
        });
      }

      case 'collect_rewards': {
        // Check if participated
        const event = await db.query.arEvents.findFirst({
          where: and(eq(arEvents.id, eventId), eq(arEvents.userId, user.id)),
        });

        if (!event) {
          return NextResponse.json(
            { error: 'Event not found' },
            { status: 404 }
          );
        }

        if (!event.participated) {
          return NextResponse.json(
            { error: 'Must participate first' },
            { status: 400 }
          );
        }

        if (event.rewardsCollected) {
          return NextResponse.json(
            { error: 'Rewards already collected' },
            { status: 400 }
          );
        }

        // Generate rewards based on weather multiplier
        const baseReward = 100;
        const multiplier = event.weatherMultiplier || 1.0;
        const rewards = {
          apexPoints: Math.floor(baseReward * multiplier),
          xpBonus: Math.floor(50 * multiplier),
          weatherBonus: event.weatherBoost,
        };

        await db
          .update(arEvents)
          .set({
            rewardsCollected: true,
            completedAt: new Date(),
            status: 'completed',
          })
          .where(eq(arEvents.id, eventId));

        return NextResponse.json({
          success: true,
          message: 'Rewards collected!',
          rewards,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[API] nexus/ar-events POST error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process AR event action',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Required Next.js config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Nexus Delight API
 *
 * Endpoint for triggering and managing delight moments.
 * Integrates with the Delight Engine for personalized surprises.
 *
 * @see lib/customer-ux/delight-engine.ts
 * @see pack-ai-defense-001 for resilience
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getLimitForTier, ratelimit } from '@/lib/rate-limit';
import {
  triggerDelight,
  getDelightRecommendations,
  getDelightMetrics,
} from '@/lib/customer-ux';

// ============================================================================
// POST: Trigger a delight
// ============================================================================

/**
 * POST /api/nexus/delight
 *
 * Triggers a delight for the authenticated user.
 *
 * Body:
 * - trigger: 'login' | 'achievement' | 'weather' | 'streak' | 'milestone' | 'community' | 'market_win'
 * - context?: Additional context (e.g., { days: 7 } for streak)
 *
 * Returns:
 * - type: Delight type
 * - title: Display title
 * - description: Display description
 * - reward?: Reward details
 * - animation?: Animation identifier
 * - error?: Error message if failed
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

    // 2. Rate limiting
    const limit = getLimitForTier(user.subscriptionTier);
    const { success } = await ratelimit(limit, `nexus:delight:${user.id}`, 60);

    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const { trigger, context } = body;

    if (!trigger) {
      return NextResponse.json(
        { error: 'Missing trigger parameter' },
        { status: 400 }
      );
    }

    // 4. Validate trigger type
    const validTriggers = [
      'login',
      'achievement',
      'weather',
      'streak',
      'milestone',
      'community',
      'market_win',
    ];

    if (!validTriggers.includes(trigger)) {
      return NextResponse.json(
        { error: `Invalid trigger: ${trigger}. Valid: ${validTriggers.join(', ')}` },
        { status: 400 }
      );
    }

    // 5. Trigger delight
    const delight = await triggerDelight(user.id, trigger, context);

    // 6. Return result
    return NextResponse.json({
      ...delight,
      meta: {
        userId: user.id,
        trigger,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[API] nexus/delight POST error:', error);
    return NextResponse.json(
      {
        error: 'Failed to trigger delight',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET: Get delight recommendations and metrics
// ============================================================================

/**
 * GET /api/nexus/delight
 *
 * Fetches delight recommendations and metrics for the user.
 *
 * Query params:
 * - type: 'recommendations' | 'metrics' (default: 'recommendations')
 * - days: Number of days for metrics (default: 30)
 *
 * Returns:
 * - recommendations: Array of recommended delights
 * - OR metrics: Delight effectiveness metrics
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

    // 2. Parse query params
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'recommendations';
    const days = parseInt(searchParams.get('days') || '30', 10);

    // 3. Fetch data based on type
    if (type === 'metrics') {
      const metrics = await getDelightMetrics(user.id, days);
      return NextResponse.json({
        success: true,
        data: metrics,
        meta: {
          userId: user.id,
          type: 'metrics',
          days,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Default: recommendations
    const recommendations = await getDelightRecommendations(user.id);
    return NextResponse.json({
      success: true,
      data: recommendations,
      meta: {
        userId: user.id,
        type: 'recommendations',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[API] nexus/delight GET error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch delight data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Required Next.js config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

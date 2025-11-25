/**
 * Nexus Personalization API
 *
 * Endpoint for the Apex TCG Nexus personalized dashboard.
 * Provides hyper-personalized content with:
 * - RAG-powered recommendations
 * - pgvector preference similarity
 * - AR event integration
 * - Ethics-aware processing
 *
 * @see knowledge-02-ai-rag-architecture-v2 for RAG patterns
 * @see knowledge-09-database-architecture for pgvector
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getLimitForTier, ratelimit } from '@/lib/rate-limit';
import {
  personalizeNexusDashboard,
  updateUserPreferences,
  getActiveAREvents,
  markDelightMomentViewed,
} from '@/lib/customer-ux';

// ============================================================================
// GET: Fetch personalized dashboard
// ============================================================================

/**
 * GET /api/nexus/personalize
 *
 * Fetches personalized dashboard content for the authenticated user.
 *
 * Query params:
 * - location: optional location string for AR events
 *
 * Returns:
 * - prefs: User preferences
 * - arEvent: Active AR event (if location provided)
 * - content: Personalized dashboard content
 * - delightMoment: Special engagement moment (if available)
 * - cxScore: Customer experience score
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
    const { success } = await ratelimit(limit, `nexus:${user.id}`, 60);

    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // 3. Parse query params
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location') || undefined;

    // 4. Fetch personalized dashboard
    const result = await personalizeNexusDashboard(user.id, location);

    // 5. Return personalized content
    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        userId: user.id,
        tier: user.subscriptionTier,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[API] nexus/personalize GET error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch personalized content',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST: Update user preferences
// ============================================================================

/**
 * POST /api/nexus/personalize
 *
 * Updates user preferences for personalization.
 *
 * Body:
 * - preferences: Partial TCG interests to update
 *
 * Returns:
 * - success: boolean
 * - message: status message
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
    const { success: rateLimitSuccess } = await ratelimit(limit, `nexus:update:${user.id}`, 60);

    if (!rateLimitSuccess) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const { preferences } = body;

    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        { error: 'Invalid preferences format' },
        { status: 400 }
      );
    }

    // 4. Validate preference fields
    const validFields = [
      'themes',
      'playStyle',
      'favoriteGames',
      'priceRange',
      'rarity',
      'gradingPreference',
    ];

    const invalidFields = Object.keys(preferences).filter(
      (key) => !validFields.includes(key)
    );

    if (invalidFields.length > 0) {
      return NextResponse.json(
        { error: `Invalid preference fields: ${invalidFields.join(', ')}` },
        { status: 400 }
      );
    }

    // 5. Update preferences
    const success = await updateUserPreferences(user.id, preferences);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    // 6. Return success
    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      meta: {
        userId: user.id,
        updatedFields: Object.keys(preferences),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[API] nexus/personalize POST error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update preferences',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH: Mark delight moment as viewed
// ============================================================================

/**
 * PATCH /api/nexus/personalize
 *
 * Updates interaction state for personalization elements.
 *
 * Body:
 * - action: 'view_delight' | 'dismiss_delight'
 * - momentId: ID of the delight moment
 *
 * Returns:
 * - success: boolean
 */
export async function PATCH(request: NextRequest) {
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
    const { action, momentId } = body;

    if (!action || !momentId) {
      return NextResponse.json(
        { error: 'Missing action or momentId' },
        { status: 400 }
      );
    }

    // 3. Handle action
    switch (action) {
      case 'view_delight':
      case 'dismiss_delight': {
        const success = await markDelightMomentViewed(momentId);
        return NextResponse.json({ success });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[API] nexus/personalize PATCH error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update interaction',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Required Next.js config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Child Activity Monitoring API
 *
 * Provides real-time and historical activity data for parent dashboard.
 * Only parents can access their linked children's activity.
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest } from 'next/server';
import { db } from '@/db';
import { childActivityHistory, familyLinks, watchlistItems, portfolios, holdings, cards } from '@/db/schema';
import { eq, and, desc, gte } from 'drizzle-orm';
import { getUserFromRequest } from '@/lib/auth';
import {
  AuthenticationError,
  ValidationError,
  AuthorizationError,
  handleApiError,
} from '@/lib/errors';

/**
 * GET /api/family/activity
 * Get child's activity history and current state
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    const { searchParams } = new URL(req.url);
    const childId = searchParams.get('childId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!childId) {
      throw new ValidationError('Child ID is required');
    }

    // Verify user is parent of this child
    const link = await db.query.familyLinks.findFirst({
      where: and(
        eq(familyLinks.parentId, user.id),
        eq(familyLinks.childId, childId),
        eq(familyLinks.status, 'active')
      ),
      with: {
        parentalControls: true,
      },
    });

    if (!link) {
      throw new AuthorizationError('You do not have permission to view this child\'s activity');
    }

    // Get child activity history
    const activities = await db.query.childActivityHistory.findMany({
      where: eq(childActivityHistory.childId, childId),
      orderBy: desc(childActivityHistory.timestamp),
      limit,
    });

    // Get child's watchlist
    const watchlist = await db.query.watchlistItems.findMany({
      where: eq(watchlistItems.userId, childId),
      with: {
        card: true,
      },
    });

    // Get child's portfolios
    const childPortfolios = await db.query.portfolios.findMany({
      where: eq(portfolios.userId, childId),
      with: {
        holdings: {
          with: {
            card: true,
          },
        },
      },
    });

    // Calculate total portfolio value (simplified - in production would use latest prices)
    let totalPortfolioValue = 0;
    for (const portfolio of childPortfolios) {
      for (const holding of portfolio.holdings) {
        totalPortfolioValue += holding.costBasisUsd * holding.quantity;
      }
    }

    return Response.json({
      childId,
      activities,
      watchlist,
      portfolios: childPortfolios,
      totalPortfolioValue,
      parentalControls: link.parentalControls,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/family/activity
 * Log a new activity for a child (internal use, or for tracking)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    const body = await req.json();
    const { activityType, activityData, ipAddress, userAgent, deviceInfo } = body;

    // Log the activity
    const activity = await db
      .insert(childActivityHistory)
      .values({
        id: crypto.randomUUID(),
        childId: user.id,
        activityType,
        activityData,
        ipAddress,
        userAgent,
        deviceInfo,
      })
      .returning();

    return Response.json({
      activity: activity[0],
      logged: true,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

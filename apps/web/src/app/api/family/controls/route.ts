/**
 * Parental Controls API Routes
 *
 * Manages parental control settings for linked child accounts.
 * Only parents can modify these settings.
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest } from 'next/server';
import { db } from '@/db';
import { parentalControls, familyLinks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserFromRequest } from '@/lib/auth';
import {
  AuthenticationError,
  ValidationError,
  NotFoundError,
  AuthorizationError,
  handleApiError,
} from '@/lib/errors';
import { z } from 'zod';

const updateControlsSchema = z.object({
  childId: z.string().min(1, 'Child ID is required'),
  bedtimeEnabled: z.boolean().optional(),
  bedtimeStart: z.string().optional(),
  bedtimeEnd: z.string().optional(),
  bedtimeTimezone: z.string().optional(),
  coolDownEnabled: z.boolean().optional(),
  coolDownMinutes: z.number().int().positive().optional(),
  notificationsDisabled: z.boolean().optional(),
  disabledChannels: z.array(z.string()).optional(),
  dailyTradingLimit: z.number().int().positive().optional(),
  maxPortfolioValue: z.number().positive().optional(),
});

/**
 * GET /api/family/controls
 * Get parental controls for a specific child
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    const { searchParams } = new URL(req.url);
    const childId = searchParams.get('childId');

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
    });

    if (!link) {
      throw new AuthorizationError('You do not have permission to view this child\'s controls');
    }

    // Get parental controls
    const controls = await db.query.parentalControls.findFirst({
      where: eq(parentalControls.childId, childId),
    });

    if (!controls) {
      throw new NotFoundError('Parental controls not found');
    }

    return Response.json({ controls });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/family/controls
 * Update parental controls for a child
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    // Validate request body
    const body = await req.json();
    const data = updateControlsSchema.parse(body);
    const { childId, ...updates } = data;

    // Verify user is parent of this child
    const link = await db.query.familyLinks.findFirst({
      where: and(
        eq(familyLinks.parentId, user.id),
        eq(familyLinks.childId, childId),
        eq(familyLinks.status, 'active')
      ),
    });

    if (!link) {
      throw new AuthorizationError('You do not have permission to modify this child\'s controls');
    }

    // Update parental controls
    const updated = await db
      .update(parentalControls)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(parentalControls.childId, childId))
      .returning();

    return Response.json({
      controls: updated[0],
      updated: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleApiError(new ValidationError(error.errors[0].message));
    }
    return handleApiError(error);
  }
}

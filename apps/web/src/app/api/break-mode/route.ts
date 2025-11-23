/**
 * Break Mode API Routes
 *
 * Allows users (child or parent) to pause all notifications for 24 hours.
 * Once activated, cannot be undone until the 24-hour period expires.
 */

import { NextRequest } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserFromRequest } from '@/lib/auth';
import {
  AuthenticationError,
  ValidationError,
  handleApiError,
} from '@/lib/errors';
import { z } from 'zod';


// Force dynamic rendering - do not attempt static analysis during build
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const activateBreakModeSchema = z.object({
  activatedBy: z.enum(['child', 'parent']),
});

interface BreakModeResponse {
  isActive: boolean;
  expiresAt: string | null;
  activatedBy: 'child' | 'parent' | null;
}

/**
 * GET /api/break-mode
 * Get current break mode status for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    // Check if break mode is active
    const now = new Date();
    const isActive = user.breakModeUntil ? new Date(user.breakModeUntil) > now : false;

    const response: BreakModeResponse = {
      isActive,
      expiresAt: isActive ? (user.breakModeUntil ?? null) : null,
      activatedBy: isActive ? (user.breakModeActivatedBy as 'child' | 'parent') : null,
    };

    return Response.json(response);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/break-mode
 * Activate break mode for 24 hours (cannot be undone)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    // Validate request body
    const body = await req.json();
    const { activatedBy } = activateBreakModeSchema.parse(body);

    // Check if break mode is already active
    const now = new Date();
    if (user.breakModeUntil && new Date(user.breakModeUntil) > now) {
      throw new ValidationError('Break mode is already active and cannot be undone');
    }

    // Calculate expiry time (24 hours from now)
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Update user with break mode settings
    const updated = await db
      .update(users)
      .set({
        breakModeUntil: expiresAt,
        breakModeActivatedBy: activatedBy,
      })
      .where(eq(users.id, user.id))
      .returning();

    const response: BreakModeResponse = {
      isActive: true,
      expiresAt: expiresAt.toISOString(),
      activatedBy,
    };

    return Response.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleApiError(new ValidationError(error.errors[0].message));
    }
    return handleApiError(error);
  }
}

/**
 * DELETE /api/break-mode
 * Cancel break mode early (admin/emergency override only)
 * Note: This is intentionally not exposed in the UI per requirements
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    // Emergency override - deactivate break mode
    await db
      .update(users)
      .set({
        breakModeUntil: null,
        breakModeActivatedBy: null,
      })
      .where(eq(users.id, user.id));

    const response: BreakModeResponse = {
      isActive: false,
      expiresAt: null,
      activatedBy: null,
    };

    return Response.json(response);
  } catch (error) {
    return handleApiError(error);
  }
}

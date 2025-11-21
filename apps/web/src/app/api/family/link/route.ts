/**
 * Family Link API Routes
 *
 * Manages OAuth-based family links between parent and child accounts.
 * Children cannot revoke these links - only parents can.
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest } from 'next/server';
import { db } from '@/db';
import { familyLinks, parentalControls, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserFromRequest } from '@/lib/auth';
import {
  AuthenticationError,
  ValidationError,
  NotFoundError,
  handleApiError,
} from '@/lib/errors';
import { z } from 'zod';

const createFamilyLinkSchema = z.object({
  childEmail: z.string().email('Valid email is required'),
});

/**
 * GET /api/family/link
 * Get all family links for the authenticated user (both as parent and child)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    // Get links where user is parent
    const asParent = await db.query.familyLinks.findMany({
      where: eq(familyLinks.parentId, user.id),
      with: {
        child: {
          columns: {
            id: true,
            email: true,
            name: true,
          },
        },
        parentalControls: true,
      },
    });

    // Get links where user is child
    const asChild = await db.query.familyLinks.findMany({
      where: eq(familyLinks.childId, user.id),
      with: {
        parent: {
          columns: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return Response.json({
      asParent,
      asChild,
      canManage: asParent.length > 0,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/family/link
 * Create a new family link (parent adds child account)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    // Validate request body
    const body = await req.json();
    const { childEmail } = createFamilyLinkSchema.parse(body);

    // Find child user by email
    const childUser = await db.query.users.findFirst({
      where: eq(users.email, childEmail),
    });

    if (!childUser) {
      throw new NotFoundError('Child account not found. The user must have an account first.');
    }

    // Prevent self-linking
    if (childUser.id === user.id) {
      throw new ValidationError('Cannot link to your own account');
    }

    // Check if link already exists
    const existingLink = await db.query.familyLinks.findFirst({
      where: and(
        eq(familyLinks.parentId, user.id),
        eq(familyLinks.childId, childUser.id)
      ),
    });

    if (existingLink) {
      throw new ValidationError('Family link already exists');
    }

    // Create family link
    const newLink = await db
      .insert(familyLinks)
      .values({
        id: crypto.randomUUID(),
        parentId: user.id,
        childId: childUser.id,
        status: 'active', // Auto-approve for now
        childCannotRevoke: true,
      })
      .returning();

    // Create default parental controls
    const controls = await db
      .insert(parentalControls)
      .values({
        id: crypto.randomUUID(),
        familyLinkId: newLink[0].id,
        childId: childUser.id,
        bedtimeEnabled: false,
        coolDownEnabled: false,
        notificationsDisabled: false,
        disabledChannels: [],
      })
      .returning();

    return Response.json({
      link: newLink[0],
      controls: controls[0],
      created: true,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleApiError(new ValidationError(error.errors[0].message));
    }
    return handleApiError(error);
  }
}

/**
 * DELETE /api/family/link
 * Remove a family link (parent only)
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    const { searchParams } = new URL(req.url);
    const linkId = searchParams.get('id');

    if (!linkId) {
      throw new ValidationError('Link ID is required');
    }

    // Verify link belongs to user as parent
    const link = await db.query.familyLinks.findFirst({
      where: and(
        eq(familyLinks.id, linkId),
        eq(familyLinks.parentId, user.id)
      ),
    });

    if (!link) {
      throw new NotFoundError('Family link not found');
    }

    // Delete link (parental controls will cascade)
    await db
      .delete(familyLinks)
      .where(eq(familyLinks.id, linkId));

    return Response.json({
      deleted: true,
      id: linkId,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

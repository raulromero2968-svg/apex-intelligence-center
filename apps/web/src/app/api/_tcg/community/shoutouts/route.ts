/**
 * Community Shoutouts API Routes
 *
 * Public recognition for community members, vendors, and collectors.
 * Supports recognizing fair pricing, excellent service, and generosity.
 *
 * @see knowledge-09-database-architecture
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest } from 'next/server';
import { db } from '@/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getUserFromRequest } from '@/lib/auth';
import {
  AuthenticationError,
  ValidationError,
  NotFoundError,
  AuthorizationError,
  handleApiError,
} from '@/lib/errors';
import { z } from 'zod';
import {
  communityShoutouts,
  vendors,
  tcgEvents,
  communityDonations,
  type NewCommunityShoutout,
} from '@/db/schema/tcg-community';
import { users } from '@/db/schema';

const createShoutoutSchema = z.object({
  recipientId: z.string().optional(),
  recipientVendorId: z.string().uuid().optional(),
  recipientName: z.string().max(200).optional(),
  shoutoutType: z.enum([
    'great_deal',
    'fair_pricing',
    'excellent_service',
    'kid_friendly',
    'generous_donation',
    'helpful_advice',
    'community_builder',
    'other',
  ]),
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000),
  eventId: z.string().uuid().optional(),
  donationId: z.string().uuid().optional(),
}).refine(
  (data) => data.recipientId || data.recipientVendorId || data.recipientName,
  { message: 'At least one recipient identifier is required' }
);

/**
 * GET /api/tcg/community/shoutouts
 * Get community shoutouts
 *
 * Query params:
 * - mine: Get shoutouts authored by user
 * - received: Get shoutouts received by user
 * - recipientId: Get shoutouts for specific user
 * - vendorId: Get shoutouts for specific vendor
 * - eventId: Get shoutouts from specific event
 * - type: Filter by shoutout type
 * - limit/offset: Pagination
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mine = searchParams.get('mine');
    const received = searchParams.get('received');
    const recipientId = searchParams.get('recipientId');
    const vendorId = searchParams.get('vendorId');
    const eventId = searchParams.get('eventId');
    const shoutoutType = searchParams.get('type');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const conditions = [eq(communityShoutouts.isApproved, true)];

    // Filter by author
    if (mine === 'true') {
      const user = await getUserFromRequest(req);
      if (!user) {
        throw new AuthenticationError();
      }
      conditions.push(eq(communityShoutouts.authorId, user.id));
    }

    // Filter by received
    if (received === 'true') {
      const user = await getUserFromRequest(req);
      if (!user) {
        throw new AuthenticationError();
      }

      // Get user's vendor profile
      const vendor = await db.query.vendors.findFirst({
        where: eq(vendors.userId, user.id),
      });

      if (vendor) {
        conditions.push(
          sql`(${communityShoutouts.recipientId} = ${user.id} OR ${communityShoutouts.recipientVendorId} = ${vendor.id})`
        );
      } else {
        conditions.push(eq(communityShoutouts.recipientId, user.id));
      }
    }

    // Other filters
    if (recipientId) {
      conditions.push(eq(communityShoutouts.recipientId, recipientId));
    }

    if (vendorId) {
      conditions.push(eq(communityShoutouts.recipientVendorId, vendorId));
    }

    if (eventId) {
      conditions.push(eq(communityShoutouts.eventId, eventId));
    }

    if (shoutoutType) {
      conditions.push(
        eq(communityShoutouts.shoutoutType, shoutoutType as NewCommunityShoutout['shoutoutType'])
      );
    }

    // Execute query
    const shoutouts = await db.query.communityShoutouts.findMany({
      where: and(...conditions),
      orderBy: [desc(communityShoutouts.createdAt)],
      limit,
      offset,
      with: {
        author: {
          columns: { id: true, name: true },
        },
        recipient: {
          columns: { id: true, name: true },
        },
        recipientVendor: {
          columns: { id: true, name: true },
        },
        event: {
          columns: { id: true, name: true },
        },
        donation: true,
      },
    });

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(communityShoutouts)
      .where(and(...conditions));

    return Response.json({
      shoutouts,
      count: shoutouts.length,
      total: countResult[0]?.count || 0,
      limit,
      offset,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/tcg/community/shoutouts
 * Create a shoutout
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    // Validate request body
    const body = await req.json();
    const validated = createShoutoutSchema.parse(body);

    // Verify recipient user exists if provided
    if (validated.recipientId) {
      const recipient = await db.query.users.findFirst({
        where: eq(users.id, validated.recipientId),
      });
      if (!recipient) {
        throw new NotFoundError('Recipient user not found');
      }
    }

    // Verify recipient vendor exists if provided
    if (validated.recipientVendorId) {
      const vendor = await db.query.vendors.findFirst({
        where: eq(vendors.id, validated.recipientVendorId),
      });
      if (!vendor) {
        throw new NotFoundError('Recipient vendor not found');
      }
    }

    // Verify event exists if provided
    if (validated.eventId) {
      const event = await db.query.tcgEvents.findFirst({
        where: eq(tcgEvents.id, validated.eventId),
      });
      if (!event) {
        throw new NotFoundError('Event not found');
      }
    }

    // Verify donation exists if provided
    if (validated.donationId) {
      const donation = await db.query.communityDonations.findFirst({
        where: eq(communityDonations.id, validated.donationId),
      });
      if (!donation) {
        throw new NotFoundError('Donation not found');
      }
    }

    // Prevent self-shoutouts
    if (validated.recipientId === user.id) {
      throw new ValidationError('You cannot give yourself a shoutout');
    }

    // Create shoutout
    const [newShoutout] = await db
      .insert(communityShoutouts)
      .values({
        authorId: user.id,
        ...validated,
      } as NewCommunityShoutout)
      .returning();

    return Response.json(
      {
        shoutout: newShoutout,
        created: true,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleApiError(new ValidationError(error.errors[0].message));
    }
    return handleApiError(error);
  }
}

/**
 * PATCH /api/tcg/community/shoutouts
 * Like or report a shoutout
 *
 * Query params:
 * - id: Shoutout ID
 * - action: 'like' or 'report'
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    const { searchParams } = new URL(req.url);
    const shoutoutId = searchParams.get('id');
    const action = searchParams.get('action');

    if (!shoutoutId) {
      throw new ValidationError('Shoutout ID is required');
    }

    if (!action || !['like', 'report'].includes(action)) {
      throw new ValidationError('Action must be "like" or "report"');
    }

    // Get shoutout
    const shoutout = await db.query.communityShoutouts.findFirst({
      where: eq(communityShoutouts.id, shoutoutId),
    });

    if (!shoutout) {
      throw new NotFoundError('Shoutout not found');
    }

    if (action === 'like') {
      // Increment like count
      const [updated] = await db
        .update(communityShoutouts)
        .set({ likesCount: shoutout.likesCount + 1 })
        .where(eq(communityShoutouts.id, shoutoutId))
        .returning();

      return Response.json({
        shoutout: updated,
        liked: true,
      });
    }

    if (action === 'report') {
      // Increment report count
      const [updated] = await db
        .update(communityShoutouts)
        .set({
          reportCount: shoutout.reportCount + 1,
          // Auto-hide if too many reports
          isApproved: shoutout.reportCount + 1 >= 5 ? false : shoutout.isApproved,
        })
        .where(eq(communityShoutouts.id, shoutoutId))
        .returning();

      return Response.json({
        reported: true,
        hidden: !updated.isApproved,
      });
    }

    throw new ValidationError('Invalid action');
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/tcg/community/shoutouts
 * Delete a shoutout (author only)
 *
 * Query params:
 * - id: Shoutout ID to delete
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    const { searchParams } = new URL(req.url);
    const shoutoutId = searchParams.get('id');

    if (!shoutoutId) {
      throw new ValidationError('Shoutout ID is required');
    }

    // Get shoutout
    const shoutout = await db.query.communityShoutouts.findFirst({
      where: eq(communityShoutouts.id, shoutoutId),
    });

    if (!shoutout) {
      throw new NotFoundError('Shoutout not found');
    }

    if (shoutout.authorId !== user.id) {
      throw new AuthorizationError('You can only delete your own shoutouts');
    }

    await db.delete(communityShoutouts).where(eq(communityShoutouts.id, shoutoutId));

    return Response.json({
      deleted: true,
      id: shoutoutId,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

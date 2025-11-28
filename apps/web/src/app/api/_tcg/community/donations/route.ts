/**
 * Community Donations API Routes
 *
 * Tracks card donations and giveaways for community building.
 * Supports kindness-driven mechanics like free cards for new collectors.
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
  communityDonations,
  vendors,
  tcgEvents,
  type NewCommunityDonation,
} from '@/db/schema/tcg-community';
import { cards } from '@/db/schema';

const createDonationSchema = z.object({
  recipientId: z.string().optional(),
  recipientName: z.string().max(200).optional(),
  donationType: z.enum([
    'card_giveaway',
    'pack_opening',
    'prize_support',
    'charity',
    'new_collector',
    'kid_special',
    'community_event',
  ]),
  cardId: z.string().optional(),
  customDescription: z.string().max(500).optional(),
  estimatedValue: z.string().or(z.number()).transform((val) => String(val)).optional(),
  quantity: z.number().int().min(1).default(1),
  eventId: z.string().uuid().optional(),
  reason: z.string().max(500).optional(),
  story: z.string().max(2000).optional(),
  proofUrl: z.string().url().optional(),
  isPublic: z.boolean().default(true),
  allowShoutout: z.boolean().default(true),
});

/**
 * GET /api/tcg/community/donations
 * Get community donations
 *
 * Query params:
 * - mine: Get donations by authenticated user
 * - donorId: Get donations by specific donor
 * - recipientId: Get donations to specific recipient
 * - vendorId: Get donations by vendor
 * - eventId: Get donations at specific event
 * - type: Filter by donation type
 * - publicOnly: Only public donations (default true)
 * - limit/offset: Pagination
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mine = searchParams.get('mine');
    const donorId = searchParams.get('donorId');
    const recipientId = searchParams.get('recipientId');
    const vendorId = searchParams.get('vendorId');
    const eventId = searchParams.get('eventId');
    const donationType = searchParams.get('type');
    const publicOnly = searchParams.get('publicOnly') !== 'false';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const conditions = [];

    // Filter by donor
    if (mine === 'true') {
      const user = await getUserFromRequest(req);
      if (!user) {
        throw new AuthenticationError();
      }
      conditions.push(eq(communityDonations.donorId, user.id));
    } else if (donorId) {
      conditions.push(eq(communityDonations.donorId, donorId));
    }

    // Other filters
    if (recipientId) {
      conditions.push(eq(communityDonations.recipientId, recipientId));
    }

    if (vendorId) {
      conditions.push(eq(communityDonations.vendorId, vendorId));
    }

    if (eventId) {
      conditions.push(eq(communityDonations.eventId, eventId));
    }

    if (donationType) {
      conditions.push(
        eq(communityDonations.donationType, donationType as NewCommunityDonation['donationType'])
      );
    }

    if (publicOnly && mine !== 'true') {
      conditions.push(eq(communityDonations.isPublic, true));
    }

    // Execute query
    const donations = await db.query.communityDonations.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(communityDonations.donatedAt)],
      limit,
      offset,
      with: {
        donor: {
          columns: { id: true, name: true },
        },
        recipient: {
          columns: { id: true, name: true },
        },
        vendor: {
          columns: { id: true, name: true },
        },
        card: true,
        event: {
          columns: { id: true, name: true },
        },
      },
    });

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(communityDonations)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Get total value donated
    const valueResult = await db
      .select({ total: sql<string>`sum(estimated_value::numeric)` })
      .from(communityDonations)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return Response.json({
      donations,
      count: donations.length,
      total: countResult[0]?.count || 0,
      totalValue: valueResult[0]?.total || '0',
      limit,
      offset,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/tcg/community/donations
 * Record a donation
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    // Validate request body
    const body = await req.json();
    const validated = createDonationSchema.parse(body);

    // Get vendor profile if exists
    const vendor = await db.query.vendors.findFirst({
      where: eq(vendors.userId, user.id),
    });

    // Verify card exists if provided
    if (validated.cardId) {
      const card = await db.query.cards.findFirst({
        where: eq(cards.id, validated.cardId),
      });
      if (!card) {
        throw new NotFoundError('Card not found');
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

    // Create donation record
    const [newDonation] = await db
      .insert(communityDonations)
      .values({
        donorId: user.id,
        vendorId: vendor?.id,
        ...validated,
      } as NewCommunityDonation)
      .returning();

    return Response.json(
      {
        donation: newDonation,
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
 * PATCH /api/tcg/community/donations
 * Update a donation (donor only)
 *
 * Query params:
 * - id: Donation ID to update
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    const { searchParams } = new URL(req.url);
    const donationId = searchParams.get('id');

    if (!donationId) {
      throw new ValidationError('Donation ID is required');
    }

    // Get donation
    const donation = await db.query.communityDonations.findFirst({
      where: eq(communityDonations.id, donationId),
    });

    if (!donation) {
      throw new NotFoundError('Donation not found');
    }

    if (donation.donorId !== user.id) {
      throw new AuthorizationError('You can only update your own donations');
    }

    const body = await req.json();
    const validated = createDonationSchema.partial().parse(body);

    const [updatedDonation] = await db
      .update(communityDonations)
      .set(validated)
      .where(eq(communityDonations.id, donationId))
      .returning();

    return Response.json({
      donation: updatedDonation,
      updated: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleApiError(new ValidationError(error.errors[0].message));
    }
    return handleApiError(error);
  }
}

/**
 * DELETE /api/tcg/community/donations
 * Delete a donation (donor only)
 *
 * Query params:
 * - id: Donation ID to delete
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    const { searchParams } = new URL(req.url);
    const donationId = searchParams.get('id');

    if (!donationId) {
      throw new ValidationError('Donation ID is required');
    }

    // Get donation
    const donation = await db.query.communityDonations.findFirst({
      where: eq(communityDonations.id, donationId),
    });

    if (!donation) {
      throw new NotFoundError('Donation not found');
    }

    if (donation.donorId !== user.id) {
      throw new AuthorizationError('You can only delete your own donations');
    }

    await db.delete(communityDonations).where(eq(communityDonations.id, donationId));

    return Response.json({
      deleted: true,
      id: donationId,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

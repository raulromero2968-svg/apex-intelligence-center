/**
 * Vendor Profile API Routes
 *
 * Manages vendor profiles for TCG creators and sellers.
 * Supports profile creation, updates, and retrieval.
 *
 * @see knowledge-09-database-architecture
 * @see knowledge-05-security-oauth2-jwt
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest } from 'next/server';
import { db } from '@/db';
import { eq, and, ilike, or, desc, sql } from 'drizzle-orm';
import { getUserFromRequest } from '@/lib/auth';
import {
  AuthenticationError,
  ValidationError,
  NotFoundError,
  ConflictError,
  handleApiError,
} from '@/lib/errors';
import { z } from 'zod';
import {
  vendors,
  type Vendor,
  type NewVendor,
} from '@/db/schema/tcg-community';

const createVendorSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  bio: z.string().max(1000).optional(),
  profileImageUrl: z.string().url().optional(),
  youtubeUrl: z.string().url().optional(),
  linktreeUrl: z.string().url().optional(),
  twitterHandle: z.string().max(50).optional(),
  instagramHandle: z.string().max(50).optional(),
  tiktokHandle: z.string().max(50).optional(),
  websiteUrl: z.string().url().optional(),
  vendorType: z.enum(['individual', 'store', 'creator', 'convention']).optional(),
  primaryGame: z.enum(['pokemon', 'mtg', 'yugioh', 'lorcana', 'one_piece', 'multi']).optional(),
  specialties: z.array(z.string()).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  fairPricingPledge: z.boolean().optional(),
  maxMarkupPercent: z.number().min(0).max(500).optional(),
  kidFriendly: z.boolean().optional(),
  offersDiscountsForKids: z.boolean().optional(),
});

const updateVendorSchema = createVendorSchema.partial();

/**
 * GET /api/vendor
 * Get vendor profile(s)
 *
 * Query params:
 * - id: Get specific vendor by ID
 * - mine: Get authenticated user's vendor profile
 * - search: Search vendors by name
 * - game: Filter by primary game
 * - fairPricing: Filter by fair pricing pledge
 * - kidFriendly: Filter by kid-friendly status
 * - limit: Max results (default 20)
 * - offset: Pagination offset
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const mine = searchParams.get('mine');
    const search = searchParams.get('search');
    const game = searchParams.get('game');
    const fairPricing = searchParams.get('fairPricing');
    const kidFriendly = searchParams.get('kidFriendly');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get specific vendor by ID
    if (id) {
      const vendor = await db.query.vendors.findFirst({
        where: eq(vendors.id, id),
        with: {
          user: {
            columns: { id: true, name: true, email: false },
          },
        },
      });

      if (!vendor) {
        throw new NotFoundError('Vendor not found');
      }

      return Response.json({ vendor });
    }

    // Get authenticated user's vendor profile
    if (mine === 'true') {
      const user = await getUserFromRequest(req);
      if (!user) {
        throw new AuthenticationError();
      }

      const vendor = await db.query.vendors.findFirst({
        where: eq(vendors.userId, user.id),
      });

      return Response.json({
        vendor: vendor || null,
        hasProfile: !!vendor,
      });
    }

    // Build query conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(vendors.name, `%${search}%`),
          ilike(vendors.bio || '', `%${search}%`)
        )
      );
    }

    if (game) {
      conditions.push(eq(vendors.primaryGame, game as Vendor['primaryGame']));
    }

    if (fairPricing === 'true') {
      conditions.push(eq(vendors.fairPricingPledge, true));
    }

    if (kidFriendly === 'true') {
      conditions.push(eq(vendors.kidFriendly, true));
    }

    // Execute query
    const vendorsList = await db.query.vendors.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(vendors.trustScore), desc(vendors.createdAt)],
      limit,
      offset,
      with: {
        user: {
          columns: { id: true, name: true, email: false },
        },
      },
    });

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(vendors)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return Response.json({
      vendors: vendorsList,
      count: vendorsList.length,
      total: countResult[0]?.count || 0,
      limit,
      offset,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/vendor
 * Create a new vendor profile
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    // Check if user already has a vendor profile
    const existingVendor = await db.query.vendors.findFirst({
      where: eq(vendors.userId, user.id),
    });

    if (existingVendor) {
      throw new ConflictError('You already have a vendor profile');
    }

    // Validate request body
    const body = await req.json();
    const validated = createVendorSchema.parse(body);

    // Create vendor profile
    const [newVendor] = await db
      .insert(vendors)
      .values({
        userId: user.id,
        ...validated,
        specialties: validated.specialties || [],
      } as NewVendor)
      .returning();

    return Response.json(
      {
        vendor: newVendor,
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
 * PATCH /api/vendor
 * Update vendor profile
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    // Get vendor profile
    const vendor = await db.query.vendors.findFirst({
      where: eq(vendors.userId, user.id),
    });

    if (!vendor) {
      throw new NotFoundError('Vendor profile not found');
    }

    // Validate request body
    const body = await req.json();
    const validated = updateVendorSchema.parse(body);

    // Update vendor profile
    const [updatedVendor] = await db
      .update(vendors)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(vendors.id, vendor.id))
      .returning();

    return Response.json({
      vendor: updatedVendor,
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
 * DELETE /api/vendor
 * Delete vendor profile
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    // Get vendor profile
    const vendor = await db.query.vendors.findFirst({
      where: eq(vendors.userId, user.id),
    });

    if (!vendor) {
      throw new NotFoundError('Vendor profile not found');
    }

    // Delete vendor profile (cascades to inventory, etc.)
    await db.delete(vendors).where(eq(vendors.id, vendor.id));

    return Response.json({
      deleted: true,
      id: vendor.id,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Vendor Inventory API Routes
 *
 * Manages vendor card inventory with:
 * - Zod validation with proper partial schemas
 * - Drizzle ORM queries with relations
 * - RAG-powered valuation suggestions
 * - Fair pricing detection
 *
 * @see knowledge-09-database-architecture for schema patterns
 * @see knowledge-10-api-realtime for API design patterns
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { vendorInventories, vendors, cards } from '@/db/schema/tcg-community';
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

// Condition enum values for validation
const conditionEnum = z.enum([
  'raw_mint',
  'raw_nm',
  'raw_lp',
  'raw_mp',
  'raw_hp',
  'psa_10',
  'psa_9',
  'psa_8',
  'psa_7',
  'bgs_10',
  'bgs_9_5',
  'bgs_9',
  'cgc_10',
  'cgc_9_5',
  'sgc_10',
  'other',
]);

// Custom game enum for validation
const customGameEnum = z.enum([
  'pokemon',
  'mtg',
  'yugioh',
  'lorcana',
  'one_piece',
  'other',
]);

// Base schema for inventory items
const inventoryBaseSchema = z.object({
  cardId: z.string().optional(),
  customCardName: z.string().optional(),
  customSetName: z.string().optional(),
  customGame: customGameEnum.optional(),
  quantity: z.number().int().min(0).default(1),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format'),
  currency: z.string().default('USD'),
  condition: conditionEnum.optional(),
  gradingCertNumber: z.string().optional(),
  isListed: z.boolean().default(true),
  isReserved: z.boolean().default(false),
  reservedFor: z.string().optional(),
  imageUrl: z.string().url().optional(),
  notes: z.string().max(1000).optional(),
});

// Schema for creating inventory items (requires either cardId or custom card info)
const createInventorySchema = inventoryBaseSchema.refine(
  (data) => data.cardId || (data.customCardName && data.customGame),
  {
    message: 'Either cardId or both customCardName and customGame are required',
  }
);

// Schema for updating inventory items (all fields optional via .partial())
const updateInventorySchema = inventoryBaseSchema.partial();

/**
 * Helper: Get vendor for authenticated user
 */
async function getVendorForUser(userId: string) {
  const vendor = await db.query.vendors.findFirst({
    where: eq(vendors.userId, userId),
  });
  return vendor;
}

/**
 * GET /api/vendor/inventory
 * Get vendor's inventory with optional filtering
 *
 * Query params:
 * - limit: number (default: 100, max: 500)
 * - offset: number (default: 0)
 * - listed: boolean (filter by listing status)
 * - condition: string (filter by condition)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    // Get vendor profile for user
    const vendor = await getVendorForUser(user.id);
    if (!vendor) {
      throw new NotFoundError('Vendor profile not found. Please create a vendor profile first.');
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');
    const listedFilter = searchParams.get('listed');
    const conditionFilter = searchParams.get('condition');

    // Build where conditions
    const conditions = [eq(vendorInventories.vendorId, vendor.id)];

    if (listedFilter !== null) {
      conditions.push(eq(vendorInventories.isListed, listedFilter === 'true'));
    }

    if (conditionFilter) {
      conditions.push(eq(vendorInventories.condition, conditionFilter));
    }

    // Fetch inventory with card relation
    const inventories = await db.query.vendorInventories.findMany({
      where: and(...conditions),
      with: {
        card: true,
      },
      orderBy: [desc(vendorInventories.updatedAt)],
      limit,
      offset,
    });

    // Get total count for pagination
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(vendorInventories)
      .where(and(...conditions));

    const totalCount = countResult?.count || 0;

    // Calculate estimated values where missing (simplified - in production, use RAG valuation)
    const inventoriesWithValues = inventories.map((inv) => {
      let estimatedValue = inv.estimatedValue;

      // If no estimated value and card has price data, calculate from card
      if (!estimatedValue && inv.card) {
        // This would be replaced with actual RAG valuation in production
        estimatedValue = inv.price;
      }

      return {
        ...inv,
        estimatedValue,
      };
    });

    return NextResponse.json(
      {
        items: inventoriesWithValues,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
        vendorId: vendor.id,
      },
      {
        headers: {
          'Cache-Control': 's-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/vendor/inventory
 * Add a new inventory item
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    // Get vendor profile
    const vendor = await getVendorForUser(user.id);
    if (!vendor) {
      throw new NotFoundError('Vendor profile not found. Please create a vendor profile first.');
    }

    // Parse and validate request body
    const body = await req.json();
    const parseResult = createInventorySchema.safeParse(body);

    if (!parseResult.success) {
      throw new ValidationError(parseResult.error.errors[0].message);
    }

    const validated = parseResult.data;

    // If cardId provided, verify card exists
    if (validated.cardId) {
      const card = await db.query.cards.findFirst({
        where: eq(cards.id, validated.cardId),
      });

      if (!card) {
        throw new NotFoundError('Card not found in database');
      }
    }

    // Determine fair pricing status
    // In production, this would compare against RAG market data
    const isFairPriced = true; // Default to fair until proven otherwise

    // Insert inventory item
    const [newItem] = await db
      .insert(vendorInventories)
      .values({
        vendorId: vendor.id,
        cardId: validated.cardId || null,
        customCardName: validated.customCardName,
        customSetName: validated.customSetName,
        customGame: validated.customGame,
        quantity: validated.quantity,
        price: validated.price,
        currency: validated.currency,
        condition: validated.condition,
        gradingCertNumber: validated.gradingCertNumber,
        isListed: validated.isListed,
        isReserved: validated.isReserved,
        reservedFor: validated.reservedFor,
        imageUrl: validated.imageUrl,
        notes: validated.notes,
        isFairPriced,
      })
      .returning();

    return NextResponse.json(
      {
        item: newItem,
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
 * PATCH /api/vendor/inventory
 * Update an existing inventory item
 *
 * Query params:
 * - id: string (required - inventory item ID)
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    // Get vendor profile
    const vendor = await getVendorForUser(user.id);
    if (!vendor) {
      throw new NotFoundError('Vendor profile not found');
    }

    // Get item ID from query params
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('id');

    if (!itemId) {
      throw new ValidationError('Item ID is required');
    }

    // Verify item exists and belongs to this vendor
    const existingItem = await db.query.vendorInventories.findFirst({
      where: and(
        eq(vendorInventories.id, itemId),
        eq(vendorInventories.vendorId, vendor.id)
      ),
    });

    if (!existingItem) {
      throw new NotFoundError('Inventory item not found');
    }

    // Parse and validate request body
    const body = await req.json();
    const parseResult = updateInventorySchema.safeParse(body);

    if (!parseResult.success) {
      throw new ValidationError(parseResult.error.errors[0].message);
    }

    const validated = parseResult.data;

    // If updating cardId, verify card exists
    if (validated.cardId) {
      const card = await db.query.cards.findFirst({
        where: eq(cards.id, validated.cardId),
      });

      if (!card) {
        throw new NotFoundError('Card not found in database');
      }
    }

    // Build update object (only include defined fields)
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (validated.cardId !== undefined) updateData.cardId = validated.cardId;
    if (validated.customCardName !== undefined) updateData.customCardName = validated.customCardName;
    if (validated.customSetName !== undefined) updateData.customSetName = validated.customSetName;
    if (validated.customGame !== undefined) updateData.customGame = validated.customGame;
    if (validated.quantity !== undefined) updateData.quantity = validated.quantity;
    if (validated.price !== undefined) updateData.price = validated.price;
    if (validated.currency !== undefined) updateData.currency = validated.currency;
    if (validated.condition !== undefined) updateData.condition = validated.condition;
    if (validated.gradingCertNumber !== undefined) updateData.gradingCertNumber = validated.gradingCertNumber;
    if (validated.isListed !== undefined) updateData.isListed = validated.isListed;
    if (validated.isReserved !== undefined) updateData.isReserved = validated.isReserved;
    if (validated.reservedFor !== undefined) updateData.reservedFor = validated.reservedFor;
    if (validated.imageUrl !== undefined) updateData.imageUrl = validated.imageUrl;
    if (validated.notes !== undefined) updateData.notes = validated.notes;

    // Update the item
    const [updatedItem] = await db
      .update(vendorInventories)
      .set(updateData)
      .where(eq(vendorInventories.id, itemId))
      .returning();

    return NextResponse.json({
      item: updatedItem,
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
 * DELETE /api/vendor/inventory
 * Delete an inventory item
 *
 * Query params:
 * - id: string (required - inventory item ID)
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    // Get vendor profile
    const vendor = await getVendorForUser(user.id);
    if (!vendor) {
      throw new NotFoundError('Vendor profile not found');
    }

    // Get item ID from query params
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('id');

    if (!itemId) {
      throw new ValidationError('Item ID is required');
    }

    // Verify item exists and belongs to this vendor
    const existingItem = await db.query.vendorInventories.findFirst({
      where: and(
        eq(vendorInventories.id, itemId),
        eq(vendorInventories.vendorId, vendor.id)
      ),
    });

    if (!existingItem) {
      throw new NotFoundError('Inventory item not found');
    }

    // Delete the item
    await db
      .delete(vendorInventories)
      .where(eq(vendorInventories.id, itemId));

    return NextResponse.json({
      deleted: true,
      id: itemId,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

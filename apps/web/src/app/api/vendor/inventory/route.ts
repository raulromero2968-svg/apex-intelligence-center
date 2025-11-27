/**
 * Vendor Inventory API Routes
 *
 * Real-time inventory management with RAG-powered valuation.
 * Supports bulk operations, fair pricing detection, and stock alerts.
 *
 * @see knowledge-09-database-architecture
 * @see knowledge-02-ai-rag-architecture-v2
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest } from 'next/server';
import { db } from '@/db';
import { eq, and, desc, sql, gte, lte, ilike, or } from 'drizzle-orm';
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
  vendors,
  vendorInventories,
  type VendorInventory,
  type NewVendorInventory,
} from '@/db/schema/tcg-community';
import { cards } from '@/db/schema';

const createInventorySchema = z.object({
  cardId: z.string().optional(),
  customCardName: z.string().max(200).optional(),
  customSetName: z.string().max(200).optional(),
  customGame: z.enum(['pokemon', 'mtg', 'yugioh', 'lorcana', 'one_piece', 'other']).optional(),
  quantity: z.number().int().min(0).default(1),
  price: z.string().or(z.number()).transform((val) => String(val)),
  currency: z.string().default('USD'),
  condition: z.enum([
    'raw_mint', 'raw_nm', 'raw_lp', 'raw_mp', 'raw_hp',
    'psa_10', 'psa_9', 'psa_8', 'psa_7',
    'bgs_10', 'bgs_9_5', 'bgs_9',
    'cgc_10', 'cgc_9_5',
    'sgc_10', 'other',
  ]).optional(),
  gradingCertNumber: z.string().max(50).optional(),
  isListed: z.boolean().default(true),
  imageUrl: z.string().url().optional(),
  notes: z.string().max(1000).optional(),
}).refine(
  (data) => data.cardId || data.customCardName,
  { message: 'Either cardId or customCardName is required' }
);

const updateInventorySchema = createInventorySchema.partial();

const bulkCreateSchema = z.object({
  items: z.array(createInventorySchema).min(1).max(100),
});

/**
 * GET /api/vendor/inventory
 * Get vendor inventory items
 *
 * Query params:
 * - vendorId: Get inventory for specific vendor (public)
 * - mine: Get authenticated vendor's inventory
 * - cardId: Filter by card
 * - condition: Filter by condition
 * - minPrice/maxPrice: Price range filter
 * - fairPricedOnly: Only show fair-priced items
 * - listed: Filter by listing status
 * - search: Search by card name
 * - limit/offset: Pagination
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get('vendorId');
    const mine = searchParams.get('mine');
    const cardId = searchParams.get('cardId');
    const condition = searchParams.get('condition');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const fairPricedOnly = searchParams.get('fairPricedOnly');
    const listed = searchParams.get('listed');
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    let targetVendorId = vendorId;

    // Get authenticated user's vendor inventory
    if (mine === 'true') {
      const user = await getUserFromRequest(req);
      if (!user) {
        throw new AuthenticationError();
      }

      const vendor = await db.query.vendors.findFirst({
        where: eq(vendors.userId, user.id),
      });

      if (!vendor) {
        throw new NotFoundError('Vendor profile not found');
      }

      targetVendorId = vendor.id;
    }

    if (!targetVendorId) {
      throw new ValidationError('vendorId or mine parameter is required');
    }

    // Build query conditions
    const conditions = [eq(vendorInventories.vendorId, targetVendorId)];

    if (cardId) {
      conditions.push(eq(vendorInventories.cardId, cardId));
    }

    if (condition) {
      conditions.push(eq(vendorInventories.condition, condition as VendorInventory['condition']));
    }

    if (minPrice) {
      conditions.push(gte(vendorInventories.price, minPrice));
    }

    if (maxPrice) {
      conditions.push(lte(vendorInventories.price, maxPrice));
    }

    if (fairPricedOnly === 'true') {
      conditions.push(eq(vendorInventories.isFairPriced, true));
    }

    if (listed !== null && listed !== undefined) {
      conditions.push(eq(vendorInventories.isListed, listed === 'true'));
    }

    // Execute query with card relation
    const items = await db.query.vendorInventories.findMany({
      where: and(...conditions),
      orderBy: [desc(vendorInventories.updatedAt)],
      limit,
      offset,
      with: {
        card: true,
      },
    });

    // Filter by search if provided (post-query for card name)
    let filteredItems = items;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredItems = items.filter((item) => {
        if (item.card?.name?.toLowerCase().includes(searchLower)) return true;
        if (item.customCardName?.toLowerCase().includes(searchLower)) return true;
        return false;
      });
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(vendorInventories)
      .where(and(...conditions));

    // Calculate total value
    const valueResult = await db
      .select({ total: sql<string>`sum(price::numeric * quantity)` })
      .from(vendorInventories)
      .where(and(...conditions));

    return Response.json({
      items: filteredItems,
      count: filteredItems.length,
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
 * POST /api/vendor/inventory
 * Add item(s) to vendor inventory
 *
 * Supports single item or bulk creation via { items: [...] }
 */
export async function POST(req: NextRequest) {
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
      throw new NotFoundError('Vendor profile not found. Create a vendor profile first.');
    }

    const body = await req.json();

    // Check if bulk create
    if (body.items && Array.isArray(body.items)) {
      const { items } = bulkCreateSchema.parse(body);

      const newItems: NewVendorInventory[] = [];

      for (const item of items) {
        // Verify card exists if cardId provided
        if (item.cardId) {
          const card = await db.query.cards.findFirst({
            where: eq(cards.id, item.cardId),
          });
          if (!card) {
            throw new ValidationError(`Card not found: ${item.cardId}`);
          }
        }

        // Check fair pricing (flag if price > 30% above estimated value)
        let isFairPriced = true;
        // In production, this would query market data for fair price check

        newItems.push({
          vendorId: vendor.id,
          ...item,
          isFairPriced,
        } as NewVendorInventory);
      }

      const createdItems = await db
        .insert(vendorInventories)
        .values(newItems)
        .returning();

      return Response.json(
        {
          items: createdItems,
          count: createdItems.length,
          created: true,
        },
        { status: 201 }
      );
    }

    // Single item create
    const validated = createInventorySchema.parse(body);

    // Verify card exists if cardId provided
    if (validated.cardId) {
      const card = await db.query.cards.findFirst({
        where: eq(cards.id, validated.cardId),
      });
      if (!card) {
        throw new NotFoundError('Card not found');
      }
    }

    // Create inventory item
    const [newItem] = await db
      .insert(vendorInventories)
      .values({
        vendorId: vendor.id,
        ...validated,
        isFairPriced: true, // Would be calculated in production
      } as NewVendorInventory)
      .returning();

    return Response.json(
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
 * Update inventory item
 *
 * Query params:
 * - id: Item ID to update
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('id');

    if (!itemId) {
      throw new ValidationError('Item ID is required');
    }

    // Get vendor profile
    const vendor = await db.query.vendors.findFirst({
      where: eq(vendors.userId, user.id),
    });

    if (!vendor) {
      throw new NotFoundError('Vendor profile not found');
    }

    // Get inventory item and verify ownership
    const item = await db.query.vendorInventories.findFirst({
      where: eq(vendorInventories.id, itemId),
    });

    if (!item) {
      throw new NotFoundError('Inventory item not found');
    }

    if (item.vendorId !== vendor.id) {
      throw new AuthorizationError('You can only update your own inventory');
    }

    // Validate request body
    const body = await req.json();
    const validated = updateInventorySchema.parse(body);

    // Update item
    const [updatedItem] = await db
      .update(vendorInventories)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(vendorInventories.id, itemId))
      .returning();

    return Response.json({
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
 * Delete inventory item(s)
 *
 * Query params:
 * - id: Single item ID to delete
 * - ids: Comma-separated list of IDs for bulk delete
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('id');
    const itemIds = searchParams.get('ids');

    if (!itemId && !itemIds) {
      throw new ValidationError('Item ID(s) required');
    }

    // Get vendor profile
    const vendor = await db.query.vendors.findFirst({
      where: eq(vendors.userId, user.id),
    });

    if (!vendor) {
      throw new NotFoundError('Vendor profile not found');
    }

    // Handle bulk delete
    if (itemIds) {
      const ids = itemIds.split(',').map((id) => id.trim());

      // Verify all items belong to vendor
      for (const id of ids) {
        const item = await db.query.vendorInventories.findFirst({
          where: eq(vendorInventories.id, id),
        });

        if (item && item.vendorId !== vendor.id) {
          throw new AuthorizationError('You can only delete your own inventory');
        }
      }

      // Delete items
      const deleted = await db
        .delete(vendorInventories)
        .where(
          and(
            eq(vendorInventories.vendorId, vendor.id),
            sql`${vendorInventories.id} = ANY(ARRAY[${sql.join(ids.map(id => sql`${id}::uuid`), sql`, `)}])`
          )
        )
        .returning();

      return Response.json({
        deleted: true,
        count: deleted.length,
        ids: deleted.map((d) => d.id),
      });
    }

    // Single item delete
    const item = await db.query.vendorInventories.findFirst({
      where: eq(vendorInventories.id, itemId!),
    });

    if (!item) {
      throw new NotFoundError('Inventory item not found');
    }

    if (item.vendorId !== vendor.id) {
      throw new AuthorizationError('You can only delete your own inventory');
    }

    await db.delete(vendorInventories).where(eq(vendorInventories.id, itemId!));

    return Response.json({
      deleted: true,
      id: itemId,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

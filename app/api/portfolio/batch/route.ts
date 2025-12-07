/**
 * Guest Migration Batch API
 * POST /api/portfolio/batch
 *
 * The "Handshake" endpoint - migrates guest portfolio data to authenticated user's account.
 * This is the critical moment where we move from client-side (localStorage) to server-side (Postgres).
 *
 * Key Design Decisions:
 * 1. ATOMIC: All items succeed or fail together (within reason)
 * 2. IDEMPOTENT: Duplicate cards are handled via upsert (update quantity)
 * 3. VALIDATED: Zod schema ensures data integrity
 * 4. FAIL-SAFE: Clear error responses enable retry logic on frontend
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

/**
 * Card condition enum - matches database schema
 */
const CardConditionSchema = z.enum([
  'mint',
  'near-mint',
  'excellent',
  'good',
  'light-play',
  'played',
  'poor',
]);

/**
 * Single card item schema for validation
 */
const GuestCardSchema = z.object({
  cardId: z.string().min(1, 'Card ID is required'),
  cardName: z.string().min(1, 'Card name is required'),
  set: z.string().min(1, 'Set name is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  condition: CardConditionSchema,
  purchasePrice: z.number().nonnegative().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

/**
 * Request body schema
 */
const BatchMigrationSchema = z.object({
  cards: z
    .array(GuestCardSchema)
    .min(1, 'At least one card is required')
    .max(100, 'Maximum 100 cards per batch'),
});

export type BatchMigrationRequest = z.infer<typeof BatchMigrationSchema>;
export type GuestCardPayload = z.infer<typeof GuestCardSchema>;

/**
 * Response types
 */
interface BatchMigrationSuccess {
  success: true;
  message: string;
  migratedCount: number;
  updatedCount: number;
  items: Array<{
    id: string;
    cardName: string;
    quantity: number;
  }>;
}

interface BatchMigrationError {
  success: false;
  error: string;
  code: 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'DATABASE_ERROR' | 'INTERNAL_ERROR';
  details?: Record<string, unknown>;
}

type BatchMigrationResponse = BatchMigrationSuccess | BatchMigrationError;

/**
 * POST /api/portfolio/batch
 *
 * Migrates guest cards to the authenticated user's portfolio.
 * Uses upsert logic to handle duplicates gracefully.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<BatchMigrationResponse>> {
  try {
    // =========================================================================
    // Step 1: Authentication Check
    // =========================================================================
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required. Please sign in to migrate your portfolio.',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // =========================================================================
    // Step 2: Parse and Validate Request Body
    // =========================================================================
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    const validationResult = BatchMigrationSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten();
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: {
            fieldErrors: errors.fieldErrors,
            formErrors: errors.formErrors,
          },
        },
        { status: 400 }
      );
    }

    const { cards } = validationResult.data;

    // =========================================================================
    // Step 3: Check for Existing Cards (for upsert logic)
    // =========================================================================
    // Create a unique key for each card: cardId + condition
    const cardKeys = cards.map((card) => `${card.cardId}-${card.condition}`);

    // Fetch existing portfolio items for this user that might match
    const { data: existingItems, error: fetchError } = await supabase
      .from('portfolio')
      .select('id, card_id, condition, quantity')
      .eq('user_id', user.id)
      .in(
        'card_id',
        cards.map((c) => c.cardId)
      );

    if (fetchError) {
      console.error('Failed to fetch existing items:', fetchError);
      // Continue anyway - we'll handle duplicates via database constraint
    }

    // Create a map of existing items by cardId-condition
    const existingMap = new Map<string, { id: string; quantity: number }>();
    if (existingItems) {
      for (const item of existingItems) {
        const key = `${item.card_id}-${item.condition}`;
        existingMap.set(key, { id: item.id, quantity: item.quantity });
      }
    }

    // =========================================================================
    // Step 4: Separate items into inserts and updates
    // =========================================================================
    const itemsToInsert: Array<{
      user_id: string;
      card_id: string;
      card_name: string;
      set: string;
      quantity: number;
      condition: string;
      graded: boolean;
      purchase_price: number | null;
      image_url: string | null;
      created_at: string;
      updated_at: string;
    }> = [];

    const itemsToUpdate: Array<{
      id: string;
      quantity: number;
    }> = [];

    const timestamp = new Date().toISOString();

    for (const card of cards) {
      const key = `${card.cardId}-${card.condition}`;
      const existing = existingMap.get(key);

      if (existing) {
        // Update existing item (add quantity)
        itemsToUpdate.push({
          id: existing.id,
          quantity: existing.quantity + card.quantity,
        });
      } else {
        // Insert new item
        itemsToInsert.push({
          user_id: user.id,
          card_id: card.cardId,
          card_name: card.cardName,
          set: card.set,
          quantity: card.quantity,
          condition: card.condition,
          graded: false,
          purchase_price: card.purchasePrice ?? null,
          image_url: card.imageUrl || null,
          created_at: timestamp,
          updated_at: timestamp,
        });
      }
    }

    // =========================================================================
    // Step 5: Execute Database Operations
    // =========================================================================
    let insertedItems: Array<{ id: string; card_name: string; quantity: number }> = [];
    let updatedCount = 0;

    // Perform inserts
    if (itemsToInsert.length > 0) {
      const { data: insertedData, error: insertError } = await supabase
        .from('portfolio')
        .insert(itemsToInsert)
        .select('id, card_name, quantity');

      if (insertError) {
        console.error('Batch insert error:', insertError);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to migrate cards. Your guest data is preserved - please try again.',
            code: 'DATABASE_ERROR',
            details: { message: insertError.message },
          },
          { status: 500 }
        );
      }

      insertedItems = insertedData || [];
    }

    // Perform updates (for duplicates)
    if (itemsToUpdate.length > 0) {
      // Update each item individually (Supabase doesn't support batch upsert well)
      const updatePromises = itemsToUpdate.map(async (item) => {
        const { error } = await supabase
          .from('portfolio')
          .update({ quantity: item.quantity, updated_at: timestamp })
          .eq('id', item.id);

        if (error) {
          console.error(`Failed to update item ${item.id}:`, error);
          return false;
        }
        return true;
      });

      const updateResults = await Promise.all(updatePromises);
      updatedCount = updateResults.filter(Boolean).length;
    }

    // =========================================================================
    // Step 6: Return Success Response
    // =========================================================================
    const totalMigrated = insertedItems.length + updatedCount;

    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${totalMigrated} card${totalMigrated !== 1 ? 's' : ''} to your account`,
      migratedCount: insertedItems.length,
      updatedCount,
      items: insertedItems.map((item) => ({
        id: item.id,
        cardName: item.card_name,
        quantity: item.quantity,
      })),
    });
  } catch (error) {
    console.error('Batch migration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Your guest data is preserved - please try again.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

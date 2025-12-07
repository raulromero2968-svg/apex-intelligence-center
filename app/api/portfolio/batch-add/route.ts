/**
 * Batch Add Portfolio Items API
 * POST /api/portfolio/batch-add
 *
 * Used by the guest migration flow to add multiple cards at once
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

interface BatchAddItem {
  cardId: string;
  cardName: string;
  set: string;
  quantity: number;
  condition: 'mint' | 'near-mint' | 'excellent' | 'good' | 'light-play' | 'played' | 'poor';
  purchasePrice?: number;
  imageUrl?: string;
}

interface BatchAddRequest {
  items: BatchAddItem[];
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: BatchAddRequest = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'No items provided' },
        { status: 400 }
      );
    }

    // Validate items limit (prevent abuse)
    if (items.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 items per batch' },
        { status: 400 }
      );
    }

    // Prepare items for insertion
    const portfolioItems = items.map((item) => ({
      user_id: user.id,
      card_id: item.cardId,
      card_name: item.cardName,
      set: item.set,
      quantity: item.quantity,
      condition: item.condition,
      graded: false,
      purchase_price: item.purchasePrice || null,
      image_url: item.imageUrl || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // Insert all items in a single transaction
    const { data, error } = await supabase
      .from('portfolio')
      .insert(portfolioItems)
      .select();

    if (error) {
      console.error('Batch insert error:', error);
      return NextResponse.json(
        { error: 'Failed to add items', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added ${data.length} items`,
      count: data.length,
      items: data,
    });
  } catch (error) {
    console.error('Batch add error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

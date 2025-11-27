import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/client';
import { portfolioService } from '@/lib/api/portfolio';

/**
 * Portfolio API Route
 *
 * Full database integration with Supabase
 * Handles authentication, validation, and CRUD operations
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // If no user, return mock data for development
    if (authError || !user) {
      const mockPortfolio = portfolioService.getMockPortfolio();
      return NextResponse.json({
        success: true,
        data: mockPortfolio,
        mock: true,
      });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const set = searchParams.get('set');
    const graded = searchParams.get('graded');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    let query = supabase
      .from('portfolio_items')
      .select('*')
      .eq('user_id', user.id);

    // Apply filters
    if (set) {
      query = query.eq('set_name', set);
    }
    if (graded !== null) {
      query = query.eq('graded', graded === 'true');
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('Portfolio API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch portfolio',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.card_id || !body.card_name || !body.set_name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: card_id, card_name, set_name',
        },
        { status: 400 }
      );
    }

    // Insert into database
    const { data, error } = await supabase
      .from('portfolio_items')
      .insert({
        user_id: user.id,
        card_id: body.card_id,
        card_name: body.card_name,
        set_name: body.set_name,
        card_number: body.card_number || null,
        rarity: body.rarity || null,
        quantity: body.quantity || 1,
        condition: body.condition || null,
        graded: body.graded || false,
        grading_company: body.grading_company || null,
        grade: body.grade || null,
        purchase_price: body.purchase_price || null,
        purchase_date: body.purchase_date || null,
        notes: body.notes || null,
        image_url: body.image_url || null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Portfolio create error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create portfolio item',
      },
      { status: 500 }
    );
  }
}

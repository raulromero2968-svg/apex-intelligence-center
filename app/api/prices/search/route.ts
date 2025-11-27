import { NextRequest, NextResponse } from 'next/server';
import { priceService } from '@/lib/api/prices';

/**
 * Price Search API Route (Example Implementation)
 *
 * This endpoint searches for card prices across multiple sources.
 *
 * In production, this would:
 * 1. Query TCGPlayer API
 * 2. Query eBay API
 * 3. Aggregate and normalize results
 * 4. Cache results in Redis
 *
 * Current implementation returns mock data for development.
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    if (!query || query.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: 'Search query must be at least 2 characters',
        },
        { status: 400 }
      );
    }

    // Search for cards (currently uses mock data)
    const results = await priceService.searchCards(query, {
      page,
      pageSize,
    });

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Price search error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search prices',
      },
      { status: 500 }
    );
  }
}

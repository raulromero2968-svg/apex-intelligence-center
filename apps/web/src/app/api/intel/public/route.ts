import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/client';

/**
 * Public Intel Reports API Route
 *
 * GET: Fetch publicly available intel reports (Commons or RC Market)
 * No authentication required for viewing, but auth status affects response
 */

// Mock data for development when database is not available
const getMockCommonsReports = () => [
  {
    id: '1',
    user_id: 'mock-user-1',
    x_post_url: 'https://x.com/pokemon/status/123456789',
    x_author: 'pokemon',
    title: 'Prismatic Evolutions Pre-Order Alert',
    content: 'Major restock incoming for Prismatic Evolutions at major retailers.',
    summary: 'Prismatic Evolutions restock alert with pricing analysis.',
    report_type: 'price_alert',
    tags: ['Pokemon', 'Prismatic Evolutions', 'Pre-Order'],
    posted_to: ['commons'],
    price: '0.00',
    quality_score: null,
    views: '2345',
    created_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
  },
  {
    id: '2',
    user_id: 'mock-user-2',
    x_post_url: 'https://x.com/tcgmarket/status/987654321',
    x_author: 'tcgmarket',
    title: 'Surging Sparks Singles Spike',
    content: 'Key chase cards from Surging Sparks showing significant price movement.',
    summary: 'Market analysis of Surging Sparks singles market.',
    report_type: 'market_intel',
    tags: ['Pokemon', 'Surging Sparks', 'Price Spike'],
    posted_to: ['commons'],
    price: '0.00',
    quality_score: null,
    views: '1567',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    published_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

const getMockRCMarketReports = () => [
  {
    id: '3',
    user_id: 'mock-user-1',
    x_post_url: 'https://x.com/insider/status/111222333',
    x_author: 'insider',
    title: 'Upcoming Pokemon Collaboration Set Details',
    content: 'Exclusive details about the upcoming collaboration set.',
    summary: 'Insider information about upcoming Pokemon TCG collaboration.',
    report_type: 'insider_tip',
    tags: ['Insider', 'Upcoming Sets', 'Collaboration'],
    posted_to: ['rc_market'],
    price: '25.00',
    quality_score: '0.95',
    views: '342',
    created_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
  },
  {
    id: '4',
    user_id: 'mock-user-3',
    x_post_url: 'https://x.com/analyst/status/444555666',
    x_author: 'analyst',
    title: 'Deep Dive: Vintage WOTC Investment Analysis',
    content: 'Comprehensive analysis of vintage WOTC market with PSA population data.',
    summary: 'Complete vintage WOTC market analysis with recommendations.',
    report_type: 'trend_analysis',
    tags: ['Vintage', 'WOTC', 'Investment'],
    posted_to: ['rc_market'],
    price: '15.00',
    quality_score: '0.88',
    views: '567',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    published_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

// Transform database row to API response format
function transformReport(row: Record<string, unknown>, purchasedIds: string[] = []) {
  return {
    id: row.id,
    xPostUrl: row.x_post_url,
    xAuthor: row.x_author,
    title: row.title,
    content: row.content,
    summary: row.summary,
    reportType: row.report_type,
    tags: row.tags || [],
    price: row.price,
    qualityScore: row.quality_score,
    views: row.views,
    createdAt: row.created_at,
    publishedAt: row.published_at,
    contributorId: (row.user_id as string)?.slice(0, 8) || 'unknown',
    isPurchased: purchasedIds.includes(row.id as string),
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const source = searchParams.get('source') || 'commons'; // 'commons' or 'rc_market'
    const search = searchParams.get('search');
    const reportType = searchParams.get('reportType');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const offset = (page - 1) * limit;

    // Check if user is authenticated (optional)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isAuthenticated = !!user;
    let isPremiumUser = false;
    let purchasedIds: string[] = [];

    // Check premium status if authenticated
    if (user) {
      // In production, check user's subscription tier
      // For now, we'll use a mock check
      isPremiumUser = false; // Would check subscription table

      // Get purchased report IDs
      const { data: purchases } = await supabase
        .from('intel_report_purchases')
        .select('report_id')
        .eq('buyer_id', user.id);

      purchasedIds = (purchases || []).map((p: { report_id: string }) => p.report_id);
    }

    // Build query for public reports
    let query = supabase
      .from('intel_reports')
      .select('*', { count: 'exact' })
      .eq('status', 'published');

    // Filter by source
    if (source === 'commons') {
      query = query.contains('posted_to', ['commons']);
    } else if (source === 'rc_market') {
      query = query.contains('posted_to', ['rc_market']);
      query = query.gt('price', 0);
    }

    // Apply report type filter
    if (reportType && reportType !== 'all') {
      query = query.eq('report_type', reportType);
    }

    // Apply search
    if (search) {
      query = query.or(
        `title.ilike.%${search}%,content.ilike.%${search}%,summary.ilike.%${search}%`
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'price_low':
        query = query.order('price', { ascending: true });
        break;
      case 'price_high':
        query = query.order('price', { ascending: false });
        break;
      case 'quality':
        query = query.order('quality_score', { ascending: false, nullsFirst: false });
        break;
      case 'popular':
        query = query.order('views', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      success: true,
      data: (data || []).map((row) => transformReport(row, purchasedIds)),
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
      },
      isAuthenticated,
      isPremiumUser,
    });
  } catch (error) {
    console.error('Public Intel GET error:', error);

    // Parse query parameters for mock response
    const searchParams = request.nextUrl.searchParams;
    const source = searchParams.get('source') || 'commons';

    // Return mock data on error for development
    const mockReports =
      source === 'rc_market' ? getMockRCMarketReports() : getMockCommonsReports();

    return NextResponse.json({
      success: true,
      data: mockReports.map((row) => transformReport(row)),
      pagination: {
        page: 1,
        limit: 20,
        total: mockReports.length,
        totalPages: 1,
      },
      isAuthenticated: false,
      isPremiumUser: false,
      mock: true,
      error: 'Database unavailable, returning mock data',
    });
  }
}

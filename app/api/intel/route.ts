import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/client';

/**
 * Intel Reports API Route
 *
 * GET: Fetch user's intel reports with pagination and filtering
 * POST: Create a new intel report
 *
 * Uses Supabase for authentication and database operations
 */

// Mock data for development when database is not available
const getMockReports = () => [
  {
    id: '1',
    user_id: 'mock-user-id',
    x_post_url: 'https://x.com/pokemon/status/123456789',
    x_post_id: '123456789',
    x_author: 'pokemon',
    title: 'Prismatic Evolutions Pre-Order Alert',
    content:
      'Major restock incoming for Prismatic Evolutions at major retailers. Expected price point $5.99 per pack.',
    summary:
      'Prismatic Evolutions restock alert with pricing analysis and investment recommendations.',
    report_type: 'price_alert',
    tags: ['Pokemon', 'Prismatic Evolutions', 'Pre-Order'],
    posted_to: ['commons'],
    is_public: true,
    price: '0.00',
    quality_score: null,
    views: '1234',
    status: 'published',
    metadata: {},
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    user_id: 'mock-user-id',
    x_post_url: 'https://x.com/tcgplayer/status/987654321',
    x_post_id: '987654321',
    x_author: 'tcgplayer',
    title: 'Surging Sparks Market Movement',
    content:
      'Significant price movement detected in Surging Sparks singles. Key chase cards showing 15-20% increase.',
    summary:
      'Market analysis of Surging Sparks price movements with top gainers.',
    report_type: 'market_intel',
    tags: ['Pokemon', 'Surging Sparks', 'Market Analysis'],
    posted_to: ['commons', 'rc_market'],
    is_public: true,
    price: '5.00',
    quality_score: '0.85',
    views: '856',
    status: 'published',
    metadata: { aiTransformed: true },
    published_at: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

// Transform database row to API response format
function transformReport(row: Record<string, unknown>) {
  return {
    id: row.id,
    xPostUrl: row.x_post_url,
    xPostId: row.x_post_id,
    xAuthor: row.x_author,
    title: row.title,
    content: row.content,
    summary: row.summary,
    reportType: row.report_type,
    tags: row.tags || [],
    postedTo: row.posted_to || [],
    isPublic: row.is_public,
    price: row.price,
    qualityScore: row.quality_score,
    views: row.views,
    status: row.status,
    metadata: row.metadata,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const reportType = searchParams.get('reportType');
    const offset = (page - 1) * limit;

    // If no user, return mock data for development
    if (authError || !user) {
      const mockReports = getMockReports();
      return NextResponse.json({
        success: true,
        data: mockReports.map(transformReport),
        pagination: {
          page: 1,
          limit: 20,
          total: mockReports.length,
          totalPages: 1,
        },
        mock: true,
      });
    }

    // Build query
    let query = supabase
      .from('intel_reports')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (reportType) {
      query = query.eq('report_type', reportType);
    }

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,content.ilike.%${search}%,summary.ilike.%${search}%`
      );
    }

    // Apply sorting and pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      success: true,
      data: (data || []).map(transformReport),
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Intel GET error:', error);

    // Return mock data on error for development
    const mockReports = getMockReports();
    return NextResponse.json({
      success: true,
      data: mockReports.map(transformReport),
      pagination: {
        page: 1,
        limit: 20,
        total: mockReports.length,
        totalPages: 1,
      },
      mock: true,
      error: 'Database unavailable, returning mock data',
    });
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
    if (!body.xPostUrl || !body.content) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: xPostUrl, content',
        },
        { status: 400 }
      );
    }

    // Extract X post ID from URL
    const xPostIdMatch = body.xPostUrl.match(/status\/(\d+)/);
    const xPostId = xPostIdMatch ? xPostIdMatch[1] : null;

    // Determine posted_to array
    const postedTo: string[] = [];
    if (body.postToCommons) postedTo.push('commons');
    if (body.postToRC) postedTo.push('rc_market');

    // Insert into database
    const { data, error } = await supabase
      .from('intel_reports')
      .insert({
        user_id: user.id,
        x_post_url: body.xPostUrl,
        x_post_id: xPostId,
        x_author: body.xAuthor || null,
        title: body.title || null,
        content: body.content,
        summary: body.summary || null,
        report_type: body.reportType || 'other',
        tags: body.tags || [],
        posted_to: postedTo,
        is_public: postedTo.includes('commons'),
        price: body.price || '0.00',
        status: postedTo.length > 0 ? 'published' : 'draft',
        published_at: postedTo.length > 0 ? new Date().toISOString() : null,
        metadata: body.metadata || {},
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        success: true,
        data: transformReport(data),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Intel POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create intel report',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: id',
        },
        { status: 400 }
      );
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.title !== undefined) updates.title = body.title;
    if (body.content !== undefined) updates.content = body.content;
    if (body.summary !== undefined) updates.summary = body.summary;
    if (body.reportType !== undefined) updates.report_type = body.reportType;
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.price !== undefined) updates.price = body.price;
    if (body.status !== undefined) {
      updates.status = body.status;
      if (body.status === 'published' && !body.publishedAt) {
        updates.published_at = new Date().toISOString();
      }
    }

    // Handle posted_to updates
    if (body.postToCommons !== undefined || body.postToRC !== undefined) {
      const postedTo: string[] = [];
      if (body.postToCommons) postedTo.push('commons');
      if (body.postToRC) postedTo.push('rc_market');
      updates.posted_to = postedTo;
      updates.is_public = postedTo.includes('commons');
    }

    // Update in database (only if user owns the report)
    const { data, error } = await supabase
      .from('intel_reports')
      .update(updates)
      .eq('id', body.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: 'Report not found or unauthorized',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: transformReport(data),
    });
  } catch (error) {
    console.error('Intel PUT error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update intel report',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameter: id',
        },
        { status: 400 }
      );
    }

    // Delete from database (only if user owns the report)
    const { error } = await supabase
      .from('intel_reports')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    console.error('Intel DELETE error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete intel report',
      },
      { status: 500 }
    );
  }
}

/**
 * Analytics Conversions API - Dashboard metrics for buy conversions
 *
 * GET: Retrieve daily conversion metrics for reports
 *
 * Provides aggregated metrics for:
 * - Daily conversion counts
 * - Average transaction price
 * - Revenue trends
 *
 * Trade-offs:
 * - GOOD: Real-time dashboards
 * - GOOD: Enables A/B testing and optimization
 * - BAD: Requires admin access (role-based protection)
 *
 * Reference: knowledge-07-seo-performance.md
 *
 * @module api/analytics/conversions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/client';
import { Pool } from 'pg';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

const querySchema = z.object({
  days: z.coerce.number().min(1).max(365).default(30),
  eventType: z.string().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
});

// =============================================================================
// DATABASE CONNECTION
// =============================================================================

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// =============================================================================
// GET - CONVERSION METRICS
// =============================================================================

export async function GET(request: NextRequest) {
  const client = await pool.connect();

  try {
    const supabase = createSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin/analyst role (via commons profile)
    const roleResult = await client.query(
      `SELECT role FROM commons_user_profiles WHERE user_id = $1`,
      [user.id]
    );

    const userRole = roleResult.rows[0]?.role;
    if (!['admin', 'moderator'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const params = querySchema.parse(searchParams);

    // Build date grouping SQL
    let dateGrouping: string;
    let dateFormat: string;
    switch (params.groupBy) {
      case 'week':
        dateGrouping = `DATE_TRUNC('week', created_at)`;
        dateFormat = 'YYYY-WW';
        break;
      case 'month':
        dateGrouping = `DATE_TRUNC('month', created_at)`;
        dateFormat = 'YYYY-MM';
        break;
      default:
        dateGrouping = `DATE(created_at)`;
        dateFormat = 'YYYY-MM-DD';
    }

    // Build event type filter
    const eventTypeFilter = params.eventType
      ? `AND event_type = $2`
      : `AND event_type IN ('buy_report', 'buy_listing', 'buy_subscription')`;

    const queryParams: (number | string)[] = [params.days];
    if (params.eventType) {
      queryParams.push(params.eventType);
    }

    // Query conversion metrics
    const conversionsResult = await client.query(
      `SELECT
        TO_CHAR(${dateGrouping}, '${dateFormat}') AS period,
        event_type,
        COUNT(*) AS count,
        COALESCE(SUM(price_amount), 0) AS total_revenue,
        COALESCE(AVG(price_amount), 0) AS avg_price,
        COUNT(DISTINCT user_id) AS unique_users
       FROM analytics_events
       WHERE created_at >= NOW() - INTERVAL '1 day' * $1
       ${eventTypeFilter}
       GROUP BY ${dateGrouping}, event_type
       ORDER BY ${dateGrouping} DESC, event_type`,
      queryParams
    );

    // Query summary totals
    const summaryResult = await client.query(
      `SELECT
        event_type,
        COUNT(*) AS total_count,
        COALESCE(SUM(price_amount), 0) AS total_revenue,
        COALESCE(AVG(price_amount), 0) AS avg_price,
        COUNT(DISTINCT user_id) AS unique_users,
        COUNT(DISTINCT DATE(created_at)) AS active_days
       FROM analytics_events
       WHERE created_at >= NOW() - INTERVAL '1 day' * $1
       ${eventTypeFilter}
       GROUP BY event_type`,
      queryParams
    );

    // Format response
    const conversions = conversionsResult.rows.map((row) => ({
      period: row.period,
      eventType: row.event_type,
      count: parseInt(row.count, 10),
      totalRevenue: parseFloat(row.total_revenue),
      avgPrice: parseFloat(row.avg_price),
      uniqueUsers: parseInt(row.unique_users, 10),
    }));

    const summary = summaryResult.rows.map((row) => ({
      eventType: row.event_type,
      totalCount: parseInt(row.total_count, 10),
      totalRevenue: parseFloat(row.total_revenue),
      avgPrice: parseFloat(row.avg_price),
      uniqueUsers: parseInt(row.unique_users, 10),
      activeDays: parseInt(row.active_days, 10),
      // Calculate daily average
      dailyAvgCount:
        parseInt(row.active_days, 10) > 0
          ? parseInt(row.total_count, 10) / parseInt(row.active_days, 10)
          : 0,
      dailyAvgRevenue:
        parseInt(row.active_days, 10) > 0
          ? parseFloat(row.total_revenue) / parseInt(row.active_days, 10)
          : 0,
    }));

    Sentry.addBreadcrumb({
      category: 'analytics',
      message: 'Conversion metrics retrieved',
      level: 'info',
      data: { days: params.days, groupBy: params.groupBy, resultCount: conversions.length },
    });

    return NextResponse.json({
      success: true,
      conversions,
      summary,
      metadata: {
        days: params.days,
        groupBy: params.groupBy,
        eventType: params.eventType || 'all_purchases',
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Analytics conversions failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    Sentry.captureException(error);

    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversion metrics' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

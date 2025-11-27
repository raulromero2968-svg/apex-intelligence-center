/**
 * Visualization Metrics API Endpoint
 *
 * Tracks and reports engagement metrics for quantum visualizations.
 * Used to measure effectiveness of Twitter sharing strategy and optimize
 * visualization types based on user engagement.
 *
 * Features:
 * - Track visualization views and interactions
 * - Aggregate engagement metrics by type/time
 * - Report trending visualization patterns
 * - Integration-ready for X/Twitter analytics
 *
 * References:
 * - Phase 4: Scaling and Monitoring
 * - Daily cycle: Research TCG trend, generate viz, share with insight
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { getUserFromRequest } from '@/lib/auth';
import { redis, RedisKeys } from '@/lib/redis';

// ============================================================================
// SCHEMAS
// ============================================================================

const trackEventSchema = z.object({
  vizId: z.string(),
  vizType: z.enum(['quantum', 'spiral', 'entanglement']),
  event: z.enum(['view', 'expand', 'share', 'screenshot', 'interact']),
  metadata: z.object({
    platform: z.string().optional(), // twitter, discord, website
    cardIds: z.array(z.string()).optional(),
    duration: z.number().optional(), // seconds spent viewing
    interactions: z.number().optional(), // node clicks, etc.
  }).optional(),
});

const metricsQuerySchema = z.object({
  vizType: z.enum(['quantum', 'spiral', 'entanglement', 'all']).optional(),
  timeframe: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
  platform: z.string().optional(),
});

// ============================================================================
// TYPES
// ============================================================================

interface VizMetric {
  vizId: string;
  vizType: string;
  views: number;
  expands: number;
  shares: number;
  screenshots: number;
  interactions: number;
  avgDuration: number;
  engagementRate: number; // (expands + shares + interactions) / views
  createdAt: string;
}

interface MetricsSummary {
  totalViews: number;
  totalShares: number;
  totalInteractions: number;
  avgEngagementRate: number;
  topVizTypes: Array<{ type: string; count: number }>;
  topCards: Array<{ cardId: string; views: number }>;
  hourlyTrend: Array<{ hour: string; views: number; engagement: number }>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get Redis key for viz metrics
 */
function getMetricsKey(vizId: string): string {
  return `viz:metrics:${vizId}`;
}

/**
 * Get Redis key for daily aggregates
 */
function getDailyAggregateKey(date: string): string {
  return `viz:daily:${date}`;
}

/**
 * Calculate timeframe in seconds
 */
function getTimeframeSeconds(timeframe: string): number {
  const timeframes: Record<string, number> = {
    '1h': 3600,
    '24h': 86400,
    '7d': 604800,
    '30d': 2592000,
  };
  return timeframes[timeframe] || 86400;
}

/**
 * Aggregate metrics from Redis
 */
async function aggregateMetrics(
  vizType?: string,
  timeframe: string = '24h',
  platform?: string
): Promise<MetricsSummary> {
  const now = Date.now();
  const cutoffTime = now - getTimeframeSeconds(timeframe) * 1000;

  // In production, fetch from Redis sorted sets
  // For now, return mock data structure
  const summary: MetricsSummary = {
    totalViews: 0,
    totalShares: 0,
    totalInteractions: 0,
    avgEngagementRate: 0,
    topVizTypes: [],
    topCards: [],
    hourlyTrend: [],
  };

  try {
    // Fetch daily aggregates from Redis
    const dailyKey = getDailyAggregateKey(new Date().toISOString().split('T')[0]);

    // Get aggregate counts
    const viewsKey = `${dailyKey}:views`;
    const sharesKey = `${dailyKey}:shares`;
    const interactionsKey = `${dailyKey}:interactions`;

    const [views, shares, interactions] = await Promise.all([
      redis.get(viewsKey).catch(() => '0'),
      redis.get(sharesKey).catch(() => '0'),
      redis.get(interactionsKey).catch(() => '0'),
    ]);

    summary.totalViews = parseInt(views as string) || 0;
    summary.totalShares = parseInt(shares as string) || 0;
    summary.totalInteractions = parseInt(interactions as string) || 0;

    // Calculate engagement rate
    if (summary.totalViews > 0) {
      summary.avgEngagementRate =
        (summary.totalShares + summary.totalInteractions) / summary.totalViews;
    }

    // Get top viz types
    const vizTypeCounts = await redis.hgetall(`${dailyKey}:types`).catch(() => ({}));
    summary.topVizTypes = Object.entries(vizTypeCounts || {})
      .map(([type, count]) => ({ type, count: parseInt(count as string) || 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get top cards
    const cardViewCounts = await redis.hgetall(`${dailyKey}:cards`).catch(() => ({}));
    summary.topCards = Object.entries(cardViewCounts || {})
      .map(([cardId, views]) => ({ cardId, views: parseInt(views as string) || 0 }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Generate hourly trend (last 24 hours)
    const hours = [];
    for (let i = 23; i >= 0; i--) {
      const hourDate = new Date(now - i * 3600000);
      const hourKey = `viz:hourly:${hourDate.toISOString().slice(0, 13)}`;
      hours.push(hourKey);
    }

    // Fetch hourly data (in production, use MGET for efficiency)
    summary.hourlyTrend = hours.map((key, idx) => ({
      hour: new Date(now - (23 - idx) * 3600000).toISOString().slice(0, 13),
      views: 0,
      engagement: 0,
    }));

  } catch (error) {
    console.error('[VIZ_METRICS_AGGREGATE_ERROR]', error);
  }

  return summary;
}

/**
 * Track a visualization event
 */
async function trackEvent(
  vizId: string,
  vizType: string,
  event: string,
  metadata?: Record<string, unknown>
): Promise<boolean> {
  try {
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0];
    const hourKey = now.toISOString().slice(0, 13);

    // Update daily aggregates
    const dailyKey = getDailyAggregateKey(dateKey);

    // Increment event counter
    await redis.hincrby(`${dailyKey}:${event}s`, vizId, 1);

    // Increment type counter
    await redis.hincrby(`${dailyKey}:types`, vizType, 1);

    // Track card views if provided
    if (metadata?.cardIds && Array.isArray(metadata.cardIds)) {
      for (const cardId of metadata.cardIds) {
        await redis.hincrby(`${dailyKey}:cards`, cardId, 1);
      }
    }

    // Increment global counters
    await redis.incr(`${dailyKey}:${event}s`);

    // Update hourly trend
    await redis.incr(`viz:hourly:${hourKey}:${event}s`);
    await redis.expire(`viz:hourly:${hourKey}:${event}s`, 86400); // 24h TTL

    // Set expiry on daily keys (keep 30 days)
    await redis.expire(dailyKey, 2592000);

    // Log event for detailed analysis
    const eventLog = {
      vizId,
      vizType,
      event,
      metadata,
      timestamp: now.toISOString(),
    };

    // Push to event stream (for real-time dashboards)
    await redis.lpush('viz:events:stream', JSON.stringify(eventLog));
    await redis.ltrim('viz:events:stream', 0, 9999); // Keep last 10k events

    return true;
  } catch (error) {
    console.error('[VIZ_TRACK_EVENT_ERROR]', error);
    return false;
  }
}

// ============================================================================
// POST - Track visualization event
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vizId, vizType, event, metadata } = trackEventSchema.parse(body);

    const success = await trackEvent(vizId, vizType, event, metadata);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to track event' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Event tracked successfully',
      vizId,
      event,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('[VIZ_METRICS_POST_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Fetch aggregated metrics
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Authentication (optional for public metrics)
    const user = await getUserFromRequest(request);

    // Parse query params
    const { searchParams } = new URL(request.url);
    const params = metricsQuerySchema.parse({
      vizType: searchParams.get('vizType') || 'all',
      timeframe: searchParams.get('timeframe') || '24h',
      platform: searchParams.get('platform') || undefined,
    });

    // Aggregate metrics
    const summary = await aggregateMetrics(
      params.vizType === 'all' ? undefined : params.vizType,
      params.timeframe,
      params.platform
    );

    // Calculate engagement insights
    const insights = {
      isPerformingWell: summary.avgEngagementRate > 0.1,
      recommendedVizType: summary.topVizTypes[0]?.type || 'quantum',
      peakHour: summary.hourlyTrend.reduce(
        (max, curr) => curr.views > max.views ? curr : max,
        { hour: '', views: 0, engagement: 0 }
      ).hour,
      growthTrend: calculateGrowthTrend(summary.hourlyTrend),
    };

    return NextResponse.json({
      success: true,
      metrics: summary,
      insights,
      params,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('[VIZ_METRICS_GET_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER: Calculate growth trend
// ============================================================================

function calculateGrowthTrend(
  hourlyTrend: Array<{ hour: string; views: number; engagement: number }>
): 'up' | 'down' | 'stable' {
  if (hourlyTrend.length < 2) return 'stable';

  const recent = hourlyTrend.slice(-6).reduce((sum, h) => sum + h.views, 0);
  const previous = hourlyTrend.slice(-12, -6).reduce((sum, h) => sum + h.views, 0);

  if (recent > previous * 1.2) return 'up';
  if (recent < previous * 0.8) return 'down';
  return 'stable';
}

// ============================================================================
// EXPORTS
// ============================================================================

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

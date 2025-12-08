/**
 * Blog Engagement Tracking API
 *
 * POST /api/blog/[slug]/engage
 *
 * Tracks user engagement events for blog posts:
 * - Views
 * - Scroll depth
 * - Read completion
 * - Citation clicks
 * - Shares
 * - Bookmarks
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { blogPosts, blogEngagements } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import * as Sentry from '@sentry/nextjs';

// ============================================================================
// VALIDATION
// ============================================================================

const engagementSchema = z.object({
  eventType: z.enum([
    'view',
    'scroll',
    'read_complete',
    'citation_click',
    'share',
    'bookmark',
    'follow_up_ask',
  ]),
  // User identification (optional)
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  // Event-specific data
  scrollDepth: z.number().min(0).max(100).optional(), // For scroll events
  readPercent: z.number().min(0).max(100).optional(), // For read tracking
  citationIndex: z.number().optional(), // For citation clicks
  shareChannel: z.string().optional(), // For shares (twitter, linkedin, etc.)
  // Context
  referrer: z.string().optional(),
  userAgent: z.string().optional(),
  deviceType: z.enum(['mobile', 'tablet', 'desktop']).optional(),
  timeOnPage: z.number().optional(), // Seconds
});

// ============================================================================
// HANDLER
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
    }

    const body = await request.json();
    const validation = engagementSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Find the post by slug
    const post = await db.query.blogPosts?.findFirst({
      where: eq(blogPosts.slug, slug),
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Get client info from headers if not provided
    const userAgent = data.userAgent || request.headers.get('user-agent') || undefined;
    const referrer = data.referrer || request.headers.get('referer') || undefined;

    // Detect device type if not provided
    let deviceType = data.deviceType;
    if (!deviceType && userAgent) {
      if (/mobile/i.test(userAgent)) {
        deviceType = 'mobile';
      } else if (/tablet|ipad/i.test(userAgent)) {
        deviceType = 'tablet';
      } else {
        deviceType = 'desktop';
      }
    }

    // Insert engagement event
    const [engagement] = await db
      .insert(blogEngagements)
      .values({
        postId: post.id,
        userId: data.userId || null,
        sessionId: data.sessionId || null,
        eventType: data.eventType,
        scrollDepth: data.scrollDepth,
        readPercent: data.readPercent,
        citationIndex: data.citationIndex,
        shareChannel: data.shareChannel,
        referrer,
        userAgent,
        deviceType,
        timeOnPage: data.timeOnPage,
      })
      .returning();

    // Update denormalized counters on post for view events
    if (data.eventType === 'view') {
      await db
        .update(blogPosts)
        .set({
          viewCount: sql`${blogPosts.viewCount} + 1`,
          // Increment unique views only if this is a new session
          // (simplified - production would use proper session tracking)
          uniqueViewCount: data.sessionId
            ? sql`${blogPosts.uniqueViewCount} + 1`
            : blogPosts.uniqueViewCount,
          updatedAt: new Date(),
        })
        .where(eq(blogPosts.id, post.id));
    }

    // Update share count
    if (data.eventType === 'share') {
      await db
        .update(blogPosts)
        .set({
          shareCount: sql`${blogPosts.shareCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(blogPosts.id, post.id));
    }

    // Update average read percent on read_complete events
    if (data.eventType === 'read_complete' && data.readPercent) {
      // This is a simplified update - production would calculate proper moving average
      await db
        .update(blogPosts)
        .set({
          avgReadPercent: sql`(COALESCE(${blogPosts.avgReadPercent}, 0) + ${data.readPercent}) / 2`,
          updatedAt: new Date(),
        })
        .where(eq(blogPosts.id, post.id));
    }

    return NextResponse.json({
      success: true,
      engagementId: engagement.id,
      eventType: data.eventType,
    });
  } catch (error) {
    Sentry.captureException(error, { tags: { endpoint: '/api/blog/[slug]/engage' } });
    console.error('Engagement tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track engagement' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Retrieve engagement stats for a post
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
    }

    // Find the post
    const post = await db.query.blogPosts?.findFirst({
      where: eq(blogPosts.slug, slug),
      columns: {
        id: true,
        slug: true,
        title: true,
        viewCount: true,
        uniqueViewCount: true,
        avgReadPercent: true,
        shareCount: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Get engagement breakdown by type
    const engagementCounts = await db
      .select({
        eventType: blogEngagements.eventType,
        count: sql<number>`count(*)`,
      })
      .from(blogEngagements)
      .where(eq(blogEngagements.postId, post.id))
      .groupBy(blogEngagements.eventType);

    // Get device breakdown
    const deviceBreakdown = await db
      .select({
        deviceType: blogEngagements.deviceType,
        count: sql<number>`count(*)`,
      })
      .from(blogEngagements)
      .where(eq(blogEngagements.postId, post.id))
      .groupBy(blogEngagements.deviceType);

    // Get top referrers
    const topReferrers = await db
      .select({
        referrer: blogEngagements.referrer,
        count: sql<number>`count(*)`,
      })
      .from(blogEngagements)
      .where(eq(blogEngagements.postId, post.id))
      .groupBy(blogEngagements.referrer)
      .orderBy(sql`count(*) DESC`)
      .limit(10);

    return NextResponse.json({
      post: {
        slug: post.slug,
        title: post.title,
      },
      stats: {
        totalViews: post.viewCount,
        uniqueViews: post.uniqueViewCount,
        avgReadPercent: post.avgReadPercent,
        shareCount: post.shareCount,
      },
      breakdown: {
        byEventType: engagementCounts.reduce(
          (acc, e) => ({ ...acc, [e.eventType]: Number(e.count) }),
          {} as Record<string, number>
        ),
        byDevice: deviceBreakdown.reduce(
          (acc, d) => ({ ...acc, [d.deviceType || 'unknown']: Number(d.count) }),
          {} as Record<string, number>
        ),
        topReferrers: topReferrers
          .filter((r) => r.referrer)
          .map((r) => ({
            referrer: r.referrer,
            count: Number(r.count),
          })),
      },
    });
  } catch (error) {
    Sentry.captureException(error, { tags: { endpoint: '/api/blog/[slug]/engage GET' } });
    return NextResponse.json(
      { error: 'Failed to fetch engagement stats' },
      { status: 500 }
    );
  }
}

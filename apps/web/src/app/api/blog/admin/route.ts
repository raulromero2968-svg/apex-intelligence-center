/**
 * Blog Admin API
 *
 * POST /api/blog/admin - Create or update blog posts
 * GET /api/blog/admin - List blog posts with filtering
 * DELETE /api/blog/admin?id={id} - Delete a blog post
 *
 * Admin endpoints for managing dynamic blog posts.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import {
  blogPosts,
  blogCitations,
  blogEngagements,
  blogFollowUps,
  blogTopicClusters,
} from '@/db/schema';
import { eq, desc, and, like, sql } from 'drizzle-orm';
import * as Sentry from '@sentry/nextjs';
import { generateSlug, countWords, calculateReadingTime } from '@/lib/ai/blog-generator';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createPostSchema = z.object({
  action: z.literal('create'),
  slug: z.string().min(3).max(200).optional(), // Auto-generated if not provided
  title: z.string().min(5).max(300),
  subtitle: z.string().max(500).optional(),
  excerpt: z.string().min(50).max(500),
  content: z.string().min(100),
  contentHtml: z.string().optional(),
  contentType: z.enum(['pillar', 'cluster', 'insight', 'analysis']).default('cluster'),
  authorId: z.string().optional(),
  authorName: z.string().default('Apex Intelligence'),
  isAiGenerated: z.boolean().default(false),
  generationModel: z.string().optional(),
  heroImage: z.string().url().optional(),
  tags: z.array(z.string()).max(10).default([]),
  category: z.string().max(100).optional(),
  pillarPostId: z.string().uuid().optional(),
  topicClusterId: z.string().uuid().optional(),
  status: z.enum(['draft', 'review', 'scheduled', 'published', 'archived']).default('draft'),
  accessLevel: z.enum(['public', 'free_user', 'pro', 'enterprise']).default('public'),
  scheduledFor: z.string().datetime().optional(),
  // Citations to add
  citations: z.array(z.object({
    citationIndex: z.number(),
    sourceUrl: z.string().url(),
    sourceTitle: z.string(),
    sourceDomain: z.string().optional(),
    sourceAuthor: z.string().optional(),
    excerptText: z.string().optional(),
    confidence: z.number().min(0).max(1).default(0.8),
  })).optional(),
});

const updatePostSchema = z.object({
  action: z.literal('update'),
  id: z.string().uuid(),
  slug: z.string().min(3).max(200).optional(),
  title: z.string().min(5).max(300).optional(),
  subtitle: z.string().max(500).optional().nullable(),
  excerpt: z.string().min(50).max(500).optional(),
  content: z.string().min(100).optional(),
  contentHtml: z.string().optional().nullable(),
  contentType: z.enum(['pillar', 'cluster', 'insight', 'analysis']).optional(),
  authorId: z.string().optional().nullable(),
  authorName: z.string().optional(),
  heroImage: z.string().url().optional().nullable(),
  tags: z.array(z.string()).max(10).optional(),
  category: z.string().max(100).optional().nullable(),
  pillarPostId: z.string().uuid().optional().nullable(),
  topicClusterId: z.string().uuid().optional().nullable(),
  status: z.enum(['draft', 'review', 'scheduled', 'published', 'archived']).optional(),
  accessLevel: z.enum(['public', 'free_user', 'pro', 'enterprise']).optional(),
  scheduledFor: z.string().datetime().optional().nullable(),
});

const publishPostSchema = z.object({
  action: z.literal('publish'),
  id: z.string().uuid(),
});

const listPostsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['draft', 'review', 'scheduled', 'published', 'archived', 'all']).default('all'),
  contentType: z.enum(['pillar', 'cluster', 'insight', 'analysis', 'all']).default('all'),
  category: z.string().optional(),
  search: z.string().optional(),
  orderBy: z.enum(['createdAt', 'updatedAt', 'publishedAt', 'viewCount']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// POST HANDLER - Create/Update/Publish
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Determine action type
    const action = body.action;

    if (action === 'create') {
      return handleCreate(body);
    } else if (action === 'update') {
      return handleUpdate(body);
    } else if (action === 'publish') {
      return handlePublish(body);
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "create", "update", or "publish".' },
        { status: 400 }
      );
    }
  } catch (error) {
    Sentry.captureException(error, { tags: { endpoint: '/api/blog/admin' } });
    console.error('Blog admin error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

async function handleCreate(body: unknown) {
  const validation = createPostSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const data = validation.data;

  // Generate slug if not provided
  const slug = data.slug || generateSlug(data.title);

  // Check for duplicate slug
  const existing = await db.query.blogPosts?.findFirst({
    where: eq(blogPosts.slug, slug),
  });

  if (existing) {
    return NextResponse.json(
      { error: 'A post with this slug already exists' },
      { status: 409 }
    );
  }

  // Calculate word count and reading time
  const wordCount = countWords(data.content);
  const readingTimeMinutes = calculateReadingTime(wordCount);

  // Insert post
  const [post] = await db
    .insert(blogPosts)
    .values({
      slug,
      title: data.title,
      subtitle: data.subtitle,
      excerpt: data.excerpt,
      content: data.content,
      contentHtml: data.contentHtml,
      contentType: data.contentType,
      wordCount,
      readingTimeMinutes,
      authorId: data.authorId,
      authorName: data.authorName,
      isAiGenerated: data.isAiGenerated,
      generationModel: data.generationModel,
      heroImage: data.heroImage,
      tags: data.tags,
      category: data.category,
      pillarPostId: data.pillarPostId,
      topicClusterId: data.topicClusterId,
      status: data.status,
      accessLevel: data.accessLevel,
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
    })
    .returning();

  // Insert citations if provided
  if (data.citations && data.citations.length > 0) {
    const citationValues = data.citations.map((c) => ({
      postId: post.id,
      citationIndex: c.citationIndex,
      sourceUrl: c.sourceUrl,
      sourceTitle: c.sourceTitle,
      sourceDomain: c.sourceDomain || new URL(c.sourceUrl).hostname.replace('www.', ''),
      sourceAuthor: c.sourceAuthor,
      excerptText: c.excerptText,
      confidence: c.confidence,
      isVerified: false,
      isActive: true,
    }));

    await db.insert(blogCitations).values(citationValues);
  }

  return NextResponse.json({
    success: true,
    post: {
      id: post.id,
      slug: post.slug,
      title: post.title,
      status: post.status,
    },
  });
}

async function handleUpdate(body: unknown) {
  const validation = updatePostSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const data = validation.data;

  // Check post exists
  const existing = await db.query.blogPosts?.findFirst({
    where: eq(blogPosts.id, data.id),
  });

  if (!existing) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  // Check slug uniqueness if changed
  if (data.slug && data.slug !== existing.slug) {
    const slugConflict = await db.query.blogPosts?.findFirst({
      where: eq(blogPosts.slug, data.slug),
    });
    if (slugConflict) {
      return NextResponse.json(
        { error: 'A post with this slug already exists' },
        { status: 409 }
      );
    }
  }

  // Build update object
  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.slug) updates.slug = data.slug;
  if (data.title) updates.title = data.title;
  if (data.subtitle !== undefined) updates.subtitle = data.subtitle;
  if (data.excerpt) updates.excerpt = data.excerpt;
  if (data.content) {
    updates.content = data.content;
    updates.wordCount = countWords(data.content);
    updates.readingTimeMinutes = calculateReadingTime(updates.wordCount as number);
  }
  if (data.contentHtml !== undefined) updates.contentHtml = data.contentHtml;
  if (data.contentType) updates.contentType = data.contentType;
  if (data.authorId !== undefined) updates.authorId = data.authorId;
  if (data.authorName) updates.authorName = data.authorName;
  if (data.heroImage !== undefined) updates.heroImage = data.heroImage;
  if (data.tags) updates.tags = data.tags;
  if (data.category !== undefined) updates.category = data.category;
  if (data.pillarPostId !== undefined) updates.pillarPostId = data.pillarPostId;
  if (data.topicClusterId !== undefined) updates.topicClusterId = data.topicClusterId;
  if (data.status) updates.status = data.status;
  if (data.accessLevel) updates.accessLevel = data.accessLevel;
  if (data.scheduledFor !== undefined) {
    updates.scheduledFor = data.scheduledFor ? new Date(data.scheduledFor) : null;
  }

  const [updated] = await db
    .update(blogPosts)
    .set(updates)
    .where(eq(blogPosts.id, data.id))
    .returning();

  return NextResponse.json({
    success: true,
    post: {
      id: updated.id,
      slug: updated.slug,
      title: updated.title,
      status: updated.status,
      updatedAt: updated.updatedAt,
    },
  });
}

async function handlePublish(body: unknown) {
  const validation = publishPostSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const { id } = validation.data;

  // Check post exists
  const existing = await db.query.blogPosts?.findFirst({
    where: eq(blogPosts.id, id),
  });

  if (!existing) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  if (existing.status === 'published') {
    return NextResponse.json({ error: 'Post is already published' }, { status: 400 });
  }

  const [published] = await db
    .update(blogPosts)
    .set({
      status: 'published',
      publishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(blogPosts.id, id))
    .returning();

  return NextResponse.json({
    success: true,
    post: {
      id: published.id,
      slug: published.slug,
      title: published.title,
      status: published.status,
      publishedAt: published.publishedAt,
    },
  });
}

// ============================================================================
// GET HANDLER - List posts
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const validation = listPostsSchema.safeParse(params);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { page, limit, status, contentType, category, search, orderBy, order } = validation.data;

    // Build where conditions
    const conditions = [];

    if (status !== 'all') {
      conditions.push(eq(blogPosts.status, status));
    }

    if (contentType !== 'all') {
      conditions.push(eq(blogPosts.contentType, contentType));
    }

    if (category) {
      conditions.push(eq(blogPosts.category, category));
    }

    if (search) {
      conditions.push(like(blogPosts.title, `%${search}%`));
    }

    // Query posts
    const offset = (page - 1) * limit;

    const posts = await db.query.blogPosts?.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [order === 'desc' ? desc(blogPosts[orderBy]) : blogPosts[orderBy]],
      limit,
      offset,
      with: {
        topicCluster: true,
      },
    });

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(blogPosts)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const totalCount = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      posts: posts?.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        contentType: p.contentType,
        status: p.status,
        accessLevel: p.accessLevel,
        wordCount: p.wordCount,
        readingTimeMinutes: p.readingTimeMinutes,
        viewCount: p.viewCount,
        category: p.category,
        tags: p.tags,
        topicCluster: p.topicCluster
          ? { id: p.topicCluster.id, name: p.topicCluster.name, slug: p.topicCluster.slug }
          : null,
        publishedAt: p.publishedAt,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })) || [],
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    Sentry.captureException(error, { tags: { endpoint: '/api/blog/admin GET' } });
    console.error('Blog admin list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE HANDLER
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing post ID' }, { status: 400 });
    }

    // Check post exists
    const existing = await db.query.blogPosts?.findFirst({
      where: eq(blogPosts.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Delete related records first (cascades should handle this, but being explicit)
    await db.delete(blogCitations).where(eq(blogCitations.postId, id));
    await db.delete(blogEngagements).where(eq(blogEngagements.postId, id));
    await db.delete(blogFollowUps).where(eq(blogFollowUps.postId, id));

    // Delete the post
    await db.delete(blogPosts).where(eq(blogPosts.id, id));

    return NextResponse.json({
      success: true,
      deletedId: id,
    });
  } catch (error) {
    Sentry.captureException(error, { tags: { endpoint: '/api/blog/admin DELETE' } });
    console.error('Blog admin delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// OPTIONS (CORS)
// ============================================================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

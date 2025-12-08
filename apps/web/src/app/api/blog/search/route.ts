/**
 * Blog Search API
 *
 * GET /api/blog/search
 *
 * Full-text and semantic search for blog posts.
 * Supports filtering by category, tags, content type, and access level.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { blogPosts } from '@/db/schema';
import { eq, and, or, like, desc, sql } from 'drizzle-orm';
import * as Sentry from '@sentry/nextjs';

// ============================================================================
// VALIDATION
// ============================================================================

const searchSchema = z.object({
  q: z.string().min(1).max(200), // Search query
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  contentType: z.enum(['pillar', 'cluster', 'insight', 'analysis', 'all']).default('all'),
  category: z.string().optional(),
  tag: z.string().optional(),
  accessLevel: z.enum(['public', 'free_user', 'pro', 'enterprise', 'all']).default('all'),
  // Only return published posts by default
  includeUnpublished: z.coerce.boolean().default(false),
});

// ============================================================================
// HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const validation = searchSchema.safeParse(params);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { q, page, limit, contentType, category, tag, accessLevel, includeUnpublished } =
      validation.data;

    // Build search conditions
    const conditions = [];

    // Text search across title, excerpt, and content
    const searchTerms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (searchTerms.length > 0) {
      const searchConditions = searchTerms.map((term) =>
        or(
          like(sql`LOWER(${blogPosts.title})`, `%${term}%`),
          like(sql`LOWER(${blogPosts.excerpt})`, `%${term}%`),
          like(sql`LOWER(${blogPosts.content})`, `%${term}%`)
        )
      );
      // All terms must match
      conditions.push(and(...searchConditions));
    }

    // Status filter
    if (!includeUnpublished) {
      conditions.push(eq(blogPosts.status, 'published'));
    }

    // Content type filter
    if (contentType !== 'all') {
      conditions.push(eq(blogPosts.contentType, contentType));
    }

    // Category filter
    if (category) {
      conditions.push(eq(blogPosts.category, category));
    }

    // Tag filter (check if tag is in tags array)
    // Note: This uses JSONB containment - tags column must be JSONB
    if (tag) {
      conditions.push(sql`${blogPosts.tags}::jsonb @> ${JSON.stringify([tag])}::jsonb`);
    }

    // Access level filter
    if (accessLevel !== 'all') {
      conditions.push(eq(blogPosts.accessLevel, accessLevel));
    }

    const offset = (page - 1) * limit;

    // Execute search query
    const posts = await db.query.blogPosts?.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(blogPosts.viewCount), desc(blogPosts.publishedAt)],
      limit,
      offset,
      columns: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        excerpt: true,
        contentType: true,
        heroImage: true,
        tags: true,
        category: true,
        accessLevel: true,
        wordCount: true,
        readingTimeMinutes: true,
        viewCount: true,
        authorName: true,
        publishedAt: true,
        createdAt: true,
      },
      with: {
        topicCluster: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(blogPosts)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const totalCount = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalCount / limit);

    // Generate search highlights (basic - would use full-text search in production)
    const results = (posts || []).map((post) => {
      // Find matching excerpt snippet
      let snippet = post.excerpt;
      for (const term of searchTerms) {
        const idx = post.excerpt.toLowerCase().indexOf(term);
        if (idx !== -1) {
          const start = Math.max(0, idx - 50);
          const end = Math.min(post.excerpt.length, idx + term.length + 50);
          snippet =
            (start > 0 ? '...' : '') +
            post.excerpt.slice(start, end) +
            (end < post.excerpt.length ? '...' : '');
          break;
        }
      }

      return {
        ...post,
        snippet,
        highlights: {
          title: highlightTerms(post.title, searchTerms),
          excerpt: highlightTerms(snippet, searchTerms),
        },
      };
    });

    return NextResponse.json({
      query: q,
      results,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      facets: await getSearchFacets(conditions),
    });
  } catch (error) {
    Sentry.captureException(error, { tags: { endpoint: '/api/blog/search' } });
    console.error('Blog search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Highlight search terms in text (returns HTML with <mark> tags)
 */
function highlightTerms(text: string, terms: string[]): string {
  let highlighted = text;
  for (const term of terms) {
    const regex = new RegExp(`(${escapeRegex(term)})`, 'gi');
    highlighted = highlighted.replace(regex, '<mark>$1</mark>');
  }
  return highlighted;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get facet counts for search refinement
 */
async function getSearchFacets(baseConditions: unknown[]) {
  try {
    // Get category counts
    const categoryCounts = await db
      .select({
        category: blogPosts.category,
        count: sql<number>`count(*)`,
      })
      .from(blogPosts)
      .where(baseConditions.length > 0 ? and(...(baseConditions as any[])) : undefined)
      .groupBy(blogPosts.category);

    // Get content type counts
    const contentTypeCounts = await db
      .select({
        contentType: blogPosts.contentType,
        count: sql<number>`count(*)`,
      })
      .from(blogPosts)
      .where(baseConditions.length > 0 ? and(...(baseConditions as any[])) : undefined)
      .groupBy(blogPosts.contentType);

    return {
      categories: categoryCounts
        .filter((c) => c.category)
        .map((c) => ({ name: c.category, count: Number(c.count) })),
      contentTypes: contentTypeCounts.map((c) => ({
        name: c.contentType,
        count: Number(c.count),
      })),
    };
  } catch {
    return { categories: [], contentTypes: [] };
  }
}

// ============================================================================
// AUTOCOMPLETE ENDPOINT
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prefix } = z.object({ prefix: z.string().min(2).max(50) }).parse(body);

    // Get title suggestions
    const suggestions = await db.query.blogPosts?.findMany({
      where: and(
        eq(blogPosts.status, 'published'),
        like(sql`LOWER(${blogPosts.title})`, `%${prefix.toLowerCase()}%`)
      ),
      orderBy: [desc(blogPosts.viewCount)],
      limit: 5,
      columns: {
        title: true,
        slug: true,
      },
    });

    return NextResponse.json({
      suggestions: (suggestions || []).map((s) => ({
        text: s.title,
        slug: s.slug,
      })),
    });
  } catch (error) {
    return NextResponse.json({ suggestions: [] });
  }
}

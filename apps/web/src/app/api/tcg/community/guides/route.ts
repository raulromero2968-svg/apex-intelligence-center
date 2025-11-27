/**
 * Collector Guides API Routes
 *
 * Educational content for new collectors, especially kids.
 * Supports budget-friendly guides and getting-started content.
 *
 * @see knowledge-09-database-architecture
 * @see knowledge-02-ai-rag-architecture-v2
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest } from 'next/server';
import { db } from '@/db';
import { eq, and, desc, sql, ilike, or } from 'drizzle-orm';
import { getUserFromRequest } from '@/lib/auth';
import {
  AuthenticationError,
  ValidationError,
  NotFoundError,
  AuthorizationError,
  ConflictError,
  handleApiError,
} from '@/lib/errors';
import { z } from 'zod';
import {
  collectorGuides,
  vendors,
  type NewCollectorGuide,
} from '@/db/schema/tcg-community';

const createGuideSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  summary: z.string().max(500).optional(),
  content: z.string().min(100, 'Content must be at least 100 characters'),
  guideType: z.enum([
    'getting_started',
    'budget_collecting',
    'grading_101',
    'spotting_fakes',
    'storage_tips',
    'trading_etiquette',
    'event_guide',
    'parent_guide',
  ]),
  targetGame: z.enum(['pokemon', 'mtg', 'yugioh', 'lorcana', 'one_piece', 'general']).optional(),
  targetAudience: z.enum(['kids', 'teens', 'adults', 'parents', 'all']).default('all'),
  difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  budgetFriendly: z.boolean().default(false),
  maxBudgetSuggestion: z.string().or(z.number()).transform((val) => String(val)).optional(),
  coverImageUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  ragTags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});

const updateGuideSchema = createGuideSchema.partial();

/**
 * GET /api/tcg/community/guides
 * Get collector guides
 *
 * Query params:
 * - slug: Get guide by slug
 * - id: Get guide by ID
 * - mine: Get guides authored by user
 * - type: Filter by guide type
 * - game: Filter by target game
 * - audience: Filter by target audience
 * - budgetFriendly: Filter for budget-friendly guides
 * - search: Search by title/content
 * - limit/offset: Pagination
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const id = searchParams.get('id');
    const mine = searchParams.get('mine');
    const guideType = searchParams.get('type');
    const game = searchParams.get('game');
    const audience = searchParams.get('audience');
    const budgetFriendly = searchParams.get('budgetFriendly');
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get by slug
    if (slug) {
      const guide = await db.query.collectorGuides.findFirst({
        where: and(
          eq(collectorGuides.slug, slug),
          eq(collectorGuides.status, 'published')
        ),
        with: {
          author: {
            columns: { id: true, name: true },
          },
          vendor: {
            columns: { id: true, name: true },
          },
        },
      });

      if (!guide) {
        throw new NotFoundError('Guide not found');
      }

      // Increment view count
      await db
        .update(collectorGuides)
        .set({ viewCount: guide.viewCount + 1 })
        .where(eq(collectorGuides.id, guide.id));

      return Response.json({ guide });
    }

    // Get by ID
    if (id) {
      const guide = await db.query.collectorGuides.findFirst({
        where: eq(collectorGuides.id, id),
        with: {
          author: {
            columns: { id: true, name: true },
          },
          vendor: {
            columns: { id: true, name: true },
          },
        },
      });

      if (!guide) {
        throw new NotFoundError('Guide not found');
      }

      return Response.json({ guide });
    }

    // Build query conditions
    const conditions = [];

    // Filter by author
    if (mine === 'true') {
      const user = await getUserFromRequest(req);
      if (!user) {
        throw new AuthenticationError();
      }
      conditions.push(eq(collectorGuides.authorId, user.id));
    } else {
      // Only show published guides for public queries
      conditions.push(eq(collectorGuides.status, 'published'));
    }

    if (guideType) {
      conditions.push(eq(collectorGuides.guideType, guideType as NewCollectorGuide['guideType']));
    }

    if (game) {
      conditions.push(eq(collectorGuides.targetGame, game as NewCollectorGuide['targetGame']));
    }

    if (audience) {
      conditions.push(eq(collectorGuides.targetAudience, audience as NewCollectorGuide['targetAudience']));
    }

    if (budgetFriendly === 'true') {
      conditions.push(eq(collectorGuides.budgetFriendly, true));
    }

    if (search) {
      conditions.push(
        or(
          ilike(collectorGuides.title, `%${search}%`),
          ilike(collectorGuides.summary || '', `%${search}%`)
        )
      );
    }

    // Execute query
    const guides = await db.query.collectorGuides.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(collectorGuides.viewCount), desc(collectorGuides.createdAt)],
      limit,
      offset,
      with: {
        author: {
          columns: { id: true, name: true },
        },
        vendor: {
          columns: { id: true, name: true },
        },
      },
      columns: {
        content: false, // Don't include full content in list
      },
    });

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(collectorGuides)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return Response.json({
      guides,
      count: guides.length,
      total: countResult[0]?.count || 0,
      limit,
      offset,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/tcg/community/guides
 * Create a new guide
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    // Validate request body
    const body = await req.json();
    const validated = createGuideSchema.parse(body);

    // Check if slug is unique
    const existingSlug = await db.query.collectorGuides.findFirst({
      where: eq(collectorGuides.slug, validated.slug),
    });

    if (existingSlug) {
      throw new ConflictError('A guide with this slug already exists');
    }

    // Get vendor profile if exists
    const vendor = await db.query.vendors.findFirst({
      where: eq(vendors.userId, user.id),
    });

    // Create guide
    const [newGuide] = await db
      .insert(collectorGuides)
      .values({
        authorId: user.id,
        vendorId: vendor?.id,
        ...validated,
        ragTags: validated.ragTags || [],
        publishedAt: validated.status === 'published' ? new Date() : null,
      } as NewCollectorGuide)
      .returning();

    return Response.json(
      {
        guide: newGuide,
        created: true,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleApiError(new ValidationError(error.errors[0].message));
    }
    return handleApiError(error);
  }
}

/**
 * PATCH /api/tcg/community/guides
 * Update a guide or mark as helpful
 *
 * Query params:
 * - id: Guide ID to update
 * - action: 'helpful' to increment helpful count
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    const { searchParams } = new URL(req.url);
    const guideId = searchParams.get('id');
    const action = searchParams.get('action');

    if (!guideId) {
      throw new ValidationError('Guide ID is required');
    }

    // Get guide
    const guide = await db.query.collectorGuides.findFirst({
      where: eq(collectorGuides.id, guideId),
    });

    if (!guide) {
      throw new NotFoundError('Guide not found');
    }

    // Handle helpful action
    if (action === 'helpful') {
      const [updated] = await db
        .update(collectorGuides)
        .set({ helpfulCount: guide.helpfulCount + 1 })
        .where(eq(collectorGuides.id, guideId))
        .returning();

      return Response.json({
        guide: updated,
        marked: true,
      });
    }

    // Regular update - verify ownership
    if (guide.authorId !== user.id) {
      throw new AuthorizationError('You can only update your own guides');
    }

    const body = await req.json();
    const validated = updateGuideSchema.parse(body);

    // Check slug uniqueness if updating
    if (validated.slug && validated.slug !== guide.slug) {
      const existingSlug = await db.query.collectorGuides.findFirst({
        where: eq(collectorGuides.slug, validated.slug),
      });

      if (existingSlug) {
        throw new ConflictError('A guide with this slug already exists');
      }
    }

    // Set published date if publishing
    const updates: Record<string, unknown> = {
      ...validated,
      updatedAt: new Date(),
    };

    if (validated.status === 'published' && guide.status !== 'published') {
      updates.publishedAt = new Date();
    }

    const [updatedGuide] = await db
      .update(collectorGuides)
      .set(updates)
      .where(eq(collectorGuides.id, guideId))
      .returning();

    return Response.json({
      guide: updatedGuide,
      updated: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleApiError(new ValidationError(error.errors[0].message));
    }
    return handleApiError(error);
  }
}

/**
 * DELETE /api/tcg/community/guides
 * Delete a guide (author only)
 *
 * Query params:
 * - id: Guide ID to delete
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    const { searchParams } = new URL(req.url);
    const guideId = searchParams.get('id');

    if (!guideId) {
      throw new ValidationError('Guide ID is required');
    }

    // Get guide
    const guide = await db.query.collectorGuides.findFirst({
      where: eq(collectorGuides.id, guideId),
    });

    if (!guide) {
      throw new NotFoundError('Guide not found');
    }

    if (guide.authorId !== user.id) {
      throw new AuthorizationError('You can only delete your own guides');
    }

    await db.delete(collectorGuides).where(eq(collectorGuides.id, guideId));

    return Response.json({
      deleted: true,
      id: guideId,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

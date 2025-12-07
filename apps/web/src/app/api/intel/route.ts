/**
 * Intel Reports API - Create and List User-Generated Intelligence
 *
 * POST: Create new intel report with OpenAI embedding
 * GET: List published intel reports with pagination
 *
 * Implements RAG search preparation by generating embeddings on creation.
 * Uses OpenAI text-embedding-ada-002 for semantic search compatibility.
 *
 * Reference: knowledge-02-ai-rag-architecture-v2.md
 *
 * @module api/intel
 */

import { NextRequest, NextResponse } from 'next/server';
// Auth removed - public API for now
import { Pool } from 'pg';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const createReportSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(100).max(50000),
  summary: z.string().max(280).optional(),
  category: z.enum([
    'market_analysis',
    'price_prediction',
    'set_review',
    'card_spotlight',
    'grading_guide',
    'investment_strategy',
    'breaking_news',
    'tutorial',
    'opinion',
    'research',
  ]).default('market_analysis'),
  tier: z.enum(['free', 'premium', 'exclusive']).default('free'),
  postedTo: z.enum(['commons', 'rc_market', 'both']).default('commons'),
  price: z.number().min(0).max(10000).default(0),
  game: z.string().default('pokemon'),
  setCode: z.string().optional(),
  cardIds: z.array(z.string()).default([]),
  tags: z.array(z.string()).max(10).default([]),
  publishNow: z.boolean().default(false),
});

const listReportsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  category: z.string().optional(),
  game: z.string().optional(),
  postedTo: z.enum(['commons', 'rc_market', 'both']).optional(),
  tier: z.enum(['free', 'premium', 'exclusive']).optional(),
});

// =============================================================================
// DATABASE CONNECTION
// =============================================================================

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// =============================================================================
// EMBEDDING GENERATION
// =============================================================================

/**
 * Generate embedding using OpenAI text-embedding-ada-002
 *
 * @param text - Text to embed (title + content)
 * @returns Array of 1536 floats
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  // Truncate text to fit within token limits (roughly 8000 tokens)
  const truncatedText = text.slice(0, 30000);

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: truncatedText,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`OpenAI embedding failed: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Generate URL-safe slug from title
 */
function generateSlug(title: string): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100);

  // Add timestamp suffix for uniqueness
  const timestamp = Date.now().toString(36);
  return `${baseSlug}-${timestamp}`;
}

// =============================================================================
// POST - CREATE NEW INTEL REPORT
// =============================================================================

export async function POST(request: NextRequest) {
  const client = await pool.connect();

  try {
    // Auth removed - public API for now
    // TODO: Add proper authentication
    const user = { id: 'anonymous' };

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createReportSchema.parse(body);

    // Generate slug
    const slug = generateSlug(validatedData.title);

    // Generate summary if not provided
    const summary = validatedData.summary || validatedData.content.slice(0, 277) + '...';

    // Determine status
    const status = validatedData.publishNow ? 'published' : 'draft';
    const publishedAt = validatedData.publishNow ? new Date().toISOString() : null;

    // Validate price for tier
    if (validatedData.tier === 'free' && validatedData.price > 0) {
      return NextResponse.json(
        { success: false, error: 'Free tier reports cannot have a price' },
        { status: 400 }
      );
    }

    if (validatedData.tier === 'premium' && validatedData.price === 0) {
      return NextResponse.json(
        { success: false, error: 'Premium tier reports must have a price' },
        { status: 400 }
      );
    }

    // Insert report first (without embedding)
    const insertResult = await client.query(
      `INSERT INTO intel_reports (
        user_id, title, slug, summary, content,
        category, tier, status, posted_to,
        price, game, set_code, card_ids, tags,
        published_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id, title, slug, summary, category, tier, status, posted_to,
                price, game, set_code, card_ids, tags, published_at, created_at`,
      [
        user.id,
        validatedData.title,
        slug,
        summary,
        validatedData.content,
        validatedData.category,
        validatedData.tier,
        status,
        validatedData.postedTo,
        validatedData.price,
        validatedData.game,
        validatedData.setCode || null,
        JSON.stringify(validatedData.cardIds),
        JSON.stringify(validatedData.tags),
        publishedAt,
      ]
    );

    const report = insertResult.rows[0];

    // Generate and store embedding asynchronously
    // This is done after insert to not block the response
    try {
      const textForEmbedding = `${validatedData.title}\n\n${validatedData.content}`;
      const embedding = await generateEmbedding(textForEmbedding);

      // Update report with embedding
      await client.query(
        `UPDATE intel_reports SET embedding = $1::vector WHERE id = $2`,
        [`[${embedding.join(',')}]`, report.id]
      );

      // Track embedding generation in Sentry
      Sentry.addBreadcrumb({
        category: 'intel',
        message: `Generated embedding for report ${report.id}`,
        level: 'info',
      });
    } catch (embeddingError) {
      // Log but don't fail the request - embedding can be generated later
      console.error('Failed to generate embedding:', embeddingError);
      Sentry.captureException(embeddingError, {
        extra: { reportId: report.id, action: 'embedding_generation' },
      });
    }

    // Insert card references if provided
    if (validatedData.cardIds.length > 0) {
      const cardValues = validatedData.cardIds
        .map((cardId, index) => `($1, $${index + 2}, $${validatedData.cardIds.length + 2}, ${index === 0})`)
        .join(', ');

      const cardParams = [
        report.id,
        ...validatedData.cardIds,
        validatedData.game,
      ];

      await client.query(
        `INSERT INTO report_cards (report_id, card_id, game, is_primary)
         VALUES ${validatedData.cardIds.map((_, i) =>
           `($1, $${i + 2}, $${validatedData.cardIds.length + 2}, ${i === 0})`
         ).join(', ')}
         ON CONFLICT (report_id, card_id) DO NOTHING`,
        cardParams
      );
    }

    return NextResponse.json(
      {
        success: true,
        report: {
          id: report.id,
          title: report.title,
          slug: report.slug,
          summary: report.summary,
          category: report.category,
          tier: report.tier,
          status: report.status,
          postedTo: report.posted_to,
          price: report.price,
          game: report.game,
          setCode: report.set_code,
          cardIds: report.card_ids,
          tags: report.tags,
          publishedAt: report.published_at,
          createdAt: report.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Intel report creation failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    Sentry.captureException(error);

    return NextResponse.json(
      { success: false, error: 'Failed to create intel report' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// =============================================================================
// GET - LIST INTEL REPORTS
// =============================================================================

export async function GET(request: NextRequest) {
  const client = await pool.connect();

  try {
    // Parse query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const params = listReportsSchema.parse(searchParams);

    const offset = (params.page - 1) * params.limit;

    // Build WHERE clause
    const conditions: string[] = ["status = 'published'"];
    const queryParams: (string | number)[] = [];
    let paramIndex = 1;

    if (params.category) {
      conditions.push(`category = $${paramIndex}`);
      queryParams.push(params.category);
      paramIndex++;
    }

    if (params.game) {
      conditions.push(`game = $${paramIndex}`);
      queryParams.push(params.game);
      paramIndex++;
    }

    if (params.postedTo) {
      conditions.push(`(posted_to = $${paramIndex} OR posted_to = 'both')`);
      queryParams.push(params.postedTo);
      paramIndex++;
    }

    if (params.tier) {
      conditions.push(`tier = $${paramIndex}`);
      queryParams.push(params.tier);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countResult = await client.query(
      `SELECT COUNT(*) FROM intel_reports WHERE ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Add pagination params
    queryParams.push(params.limit, offset);

    // Fetch reports
    const result = await client.query(
      `SELECT
        id, user_id, title, slug, summary, category, tier, status,
        posted_to, price, game, set_code, card_ids, tags,
        view_count, like_count, purchase_count, share_count,
        quality_score, is_verified, published_at, created_at
       FROM intel_reports
       WHERE ${whereClause}
       ORDER BY published_at DESC, created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      queryParams
    );

    const reports = result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      slug: row.slug,
      summary: row.summary,
      category: row.category,
      tier: row.tier,
      status: row.status,
      postedTo: row.posted_to,
      price: row.price,
      game: row.game,
      setCode: row.set_code,
      cardIds: row.card_ids,
      tags: row.tags,
      viewCount: row.view_count,
      likeCount: row.like_count,
      purchaseCount: row.purchase_count,
      shareCount: row.share_count,
      qualityScore: parseFloat(row.quality_score),
      isVerified: row.is_verified,
      publishedAt: row.published_at,
      createdAt: row.created_at,
    }));

    return NextResponse.json({
      success: true,
      reports,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    });
  } catch (error) {
    console.error('Intel report list failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    Sentry.captureException(error);

    return NextResponse.json(
      { success: false, error: 'Failed to fetch intel reports' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

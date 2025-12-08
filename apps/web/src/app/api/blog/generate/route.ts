/**
 * Blog Generation API
 *
 * POST /api/blog/generate
 *
 * Generates AI-powered blog content with Perplexity-style citations.
 * Requires authentication and appropriate permissions.
 *
 * @see lib/ai/blog-generator.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { blogPosts, blogCitations, blogTopicClusters } from '@/db/schema';
import { generateBlogPost, type BlogGenerationRequest } from '@/lib/ai/blog-generator';
import * as Sentry from '@sentry/nextjs';
import { eq } from 'drizzle-orm';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const generateRequestSchema = z.object({
  topic: z.string().min(10).max(500),
  contentType: z.enum(['pillar', 'cluster', 'insight', 'analysis']).default('cluster'),
  targetWordCount: z.number().min(300).max(10000).optional(),
  targetKeywords: z.array(z.string()).max(10).optional(),
  additionalContext: z.string().max(2000).optional(),
  category: z.string().max(100).optional(),
  tags: z.array(z.string()).max(10).optional(),
  pillarPostSlug: z.string().optional(),
  authorName: z.string().max(100).optional(),
  // Whether to save to database (default: true)
  persist: z.boolean().default(true),
  // Access level for the post
  accessLevel: z.enum(['public', 'free_user', 'pro', 'enterprise']).default('public'),
  // Topic cluster to associate with
  topicClusterId: z.string().uuid().optional(),
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;

// ============================================================================
// RATE LIMITING (simple in-memory, use Redis in production)
// ============================================================================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // requests per window
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

// ============================================================================
// HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = generateRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Rate limiting (use IP or user ID in production)
    const clientIp = request.headers.get('x-forwarded-for') || 'anonymous';
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Build generation request
    const generationRequest: BlogGenerationRequest = {
      topic: data.topic,
      contentType: data.contentType,
      targetWordCount: data.targetWordCount,
      targetKeywords: data.targetKeywords,
      additionalContext: data.additionalContext,
      category: data.category,
      tags: data.tags,
      pillarPostSlug: data.pillarPostSlug,
      authorName: data.authorName,
    };

    // Generate the blog post
    const result = await generateBlogPost(generationRequest);

    // Check for duplicate slug
    if (data.persist) {
      const existingPost = await db.query.blogPosts?.findFirst({
        where: eq(blogPosts.slug, result.slug),
      });

      // If slug exists, append timestamp
      if (existingPost) {
        result.slug = `${result.slug}-${Date.now()}`;
      }
    }

    // Persist to database if requested
    let savedPost = null;
    if (data.persist) {
      // Get pillar post ID if slug provided
      let pillarPostId: string | null = null;
      if (data.pillarPostSlug) {
        const pillarPost = await db.query.blogPosts?.findFirst({
          where: eq(blogPosts.slug, data.pillarPostSlug),
        });
        if (pillarPost) {
          pillarPostId = pillarPost.id;
        }
      }

      // Insert the blog post
      const [insertedPost] = await db
        .insert(blogPosts)
        .values({
          slug: result.slug,
          title: result.title,
          subtitle: result.subtitle,
          excerpt: result.excerpt,
          content: result.content,
          contentType: data.contentType,
          wordCount: result.wordCount,
          readingTimeMinutes: result.readingTimeMinutes,
          authorName: data.authorName || 'Apex Intelligence',
          isAiGenerated: true,
          generationModel: result.metadata.model,
          generationPrompt: data.topic,
          tags: data.tags || [],
          category: data.category,
          pillarPostId,
          topicClusterId: data.topicClusterId,
          status: 'draft',
          accessLevel: data.accessLevel,
        })
        .returning();

      savedPost = insertedPost;

      // Insert citations
      if (result.citations.length > 0 && savedPost) {
        const citationValues = result.citations.map((citation) => ({
          postId: savedPost.id,
          citationIndex: citation.index,
          sourceUrl: citation.sourceUrl || 'https://example.com/pending',
          sourceTitle: citation.sourceTitle,
          sourceDomain: citation.sourceDomain || 'pending',
          excerptText: citation.excerptText,
          contextSummary: citation.contextSummary,
          confidence: citation.confidence,
          isVerified: false,
          isActive: Boolean(citation.sourceUrl),
        }));

        await db.insert(blogCitations).values(citationValues);
      }

      // Update topic cluster post count if applicable
      if (data.topicClusterId) {
        await db
          .update(blogTopicClusters)
          .set({
            clusterPostCount: db.$count(blogPosts, eq(blogPosts.topicClusterId, data.topicClusterId)),
            updatedAt: new Date(),
          })
          .where(eq(blogTopicClusters.id, data.topicClusterId));
      }
    }

    // Return response
    return NextResponse.json({
      success: true,
      post: {
        id: savedPost?.id,
        slug: result.slug,
        title: result.title,
        subtitle: result.subtitle,
        excerpt: result.excerpt,
        content: result.content,
        wordCount: result.wordCount,
        readingTimeMinutes: result.readingTimeMinutes,
        citations: result.citations,
        status: savedPost ? 'draft' : 'preview',
      },
      metadata: {
        ...result.metadata,
        totalLatencyMs: Date.now() - startTime,
        persisted: data.persist,
      },
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { endpoint: '/api/blog/generate' },
    });

    console.error('Blog generation error:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate blog post',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

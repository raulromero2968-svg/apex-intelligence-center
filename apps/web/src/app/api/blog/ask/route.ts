/**
 * Blog Follow-Up Question API
 *
 * POST /api/blog/ask
 *
 * Perplexity-style follow-up question handler for blog posts.
 * Answers questions about article content using RAG + LLM.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { blogPosts, blogFollowUps, blogEngagements } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { answerFollowUp } from '@/lib/ai/blog-generator';
import * as Sentry from '@sentry/nextjs';

// ============================================================================
// VALIDATION
// ============================================================================

const askSchema = z.object({
  // Identify the post (by slug or ID)
  postSlug: z.string().optional(),
  postId: z.string().uuid().optional(),
  // The question
  question: z.string().min(5).max(500),
  // User context (optional - for personalization)
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  // Parent follow-up ID for threaded conversations
  parentFollowUpId: z.string().uuid().optional(),
}).refine(
  (data) => data.postSlug || data.postId,
  { message: 'Either postSlug or postId is required' }
);

// ============================================================================
// RATE LIMITING
// ============================================================================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // questions per window
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
    const body = await request.json();
    const validation = askSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { postSlug, postId, question, userId, sessionId, parentFollowUpId } = validation.data;

    // Rate limiting
    const identifier = userId || sessionId || request.headers.get('x-forwarded-for') || 'anonymous';
    if (!checkRateLimit(identifier)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Fetch the blog post
    let post;
    if (postId) {
      post = await db.query.blogPosts?.findFirst({
        where: eq(blogPosts.id, postId),
      });
    } else if (postSlug) {
      post = await db.query.blogPosts?.findFirst({
        where: eq(blogPosts.slug, postSlug),
      });
    }

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Get conversation history if this is a threaded follow-up
    let conversationHistory: Array<{ question: string; answer: string }> = [];
    if (parentFollowUpId) {
      // Fetch the thread up to 5 previous exchanges
      const previousFollowUps = await db.query.blogFollowUps?.findMany({
        where: eq(blogFollowUps.postId, post.id),
        orderBy: [desc(blogFollowUps.createdAt)],
        limit: 5,
      });

      conversationHistory = (previousFollowUps || [])
        .reverse()
        .map((f) => ({
          question: f.question,
          answer: f.answer,
        }));
    }

    // Generate answer using LLM
    const result = await answerFollowUp({
      postContent: post.content,
      postTitle: post.title,
      question,
      conversationHistory,
    });

    // Calculate thread depth
    let threadDepth = 0;
    if (parentFollowUpId) {
      const parent = await db.query.blogFollowUps?.findFirst({
        where: eq(blogFollowUps.id, parentFollowUpId),
      });
      if (parent) {
        threadDepth = parent.threadDepth + 1;
      }
    }

    // Save the follow-up to database
    const [savedFollowUp] = await db
      .insert(blogFollowUps)
      .values({
        postId: post.id,
        userId: userId || null,
        sessionId: sessionId || null,
        question,
        answer: result.answer,
        answerCitations: result.citations,
        generationModel: result.model,
        tokensUsed: result.tokensUsed,
        latencyMs: result.latencyMs,
        parentFollowUpId: parentFollowUpId || null,
        threadDepth,
      })
      .returning();

    // Track engagement event
    await db.insert(blogEngagements).values({
      postId: post.id,
      userId: userId || null,
      sessionId: sessionId || null,
      eventType: 'follow_up_ask',
      followUpQuestion: question,
    });

    return NextResponse.json({
      success: true,
      followUp: {
        id: savedFollowUp.id,
        question,
        answer: result.answer,
        citations: result.citations,
        threadDepth,
      },
      metadata: {
        model: result.model,
        tokensUsed: result.tokensUsed,
        latencyMs: result.latencyMs,
        totalLatencyMs: Date.now() - startTime,
      },
      // Suggested follow-up questions
      suggestions: generateSuggestions(post.title, question, result.answer),
    });
  } catch (error) {
    Sentry.captureException(error, { tags: { endpoint: '/api/blog/ask' } });
    console.error('Blog ask error:', error);
    return NextResponse.json(
      {
        error: 'Failed to answer question',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Generate suggested follow-up questions based on context
 */
function generateSuggestions(
  postTitle: string,
  question: string,
  answer: string
): string[] {
  // Simple suggestion generation - in production, use LLM
  const suggestions: string[] = [];

  // Topic-based suggestions for TCG content
  const tcgTopics = [
    'What are the key factors affecting TCG card values?',
    'How does this compare to other TCG markets?',
    'What should I consider when investing in this space?',
    'Are there any risks I should be aware of?',
    'Can you explain this in more detail?',
  ];

  // Return 3 relevant suggestions
  return tcgTopics.slice(0, 3);
}

// ============================================================================
// GET - Retrieve follow-ups for a post
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postSlug = searchParams.get('postSlug');
    const postId = searchParams.get('postId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    if (!postSlug && !postId) {
      return NextResponse.json(
        { error: 'Either postSlug or postId is required' },
        { status: 400 }
      );
    }

    // Find the post
    let post;
    if (postId) {
      post = await db.query.blogPosts?.findFirst({
        where: eq(blogPosts.id, postId),
      });
    } else if (postSlug) {
      post = await db.query.blogPosts?.findFirst({
        where: eq(blogPosts.slug, postSlug),
      });
    }

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Get follow-ups
    const followUps = await db.query.blogFollowUps?.findMany({
      where: eq(blogFollowUps.postId, post.id),
      orderBy: [desc(blogFollowUps.createdAt)],
      limit,
    });

    return NextResponse.json({
      postId: post.id,
      postSlug: post.slug,
      followUps: (followUps || []).map((f) => ({
        id: f.id,
        question: f.question,
        answer: f.answer,
        citations: f.answerCitations,
        wasHelpful: f.wasHelpful,
        threadDepth: f.threadDepth,
        createdAt: f.createdAt,
      })),
    });
  } catch (error) {
    Sentry.captureException(error, { tags: { endpoint: '/api/blog/ask GET' } });
    return NextResponse.json(
      { error: 'Failed to fetch follow-ups' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update feedback on follow-up
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { followUpId, wasHelpful, feedbackText } = z.object({
      followUpId: z.string().uuid(),
      wasHelpful: z.boolean(),
      feedbackText: z.string().max(500).optional(),
    }).parse(body);

    const [updated] = await db
      .update(blogFollowUps)
      .set({
        wasHelpful,
        feedbackText,
      })
      .where(eq(blogFollowUps.id, followUpId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Follow-up not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      followUpId: updated.id,
      wasHelpful: updated.wasHelpful,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update feedback' },
      { status: 500 }
    );
  }
}

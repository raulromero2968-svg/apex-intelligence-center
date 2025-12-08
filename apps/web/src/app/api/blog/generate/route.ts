/**
 * Blog Generation API Route
 *
 * REST endpoint for triggering AI blog post generation.
 * Useful for webhook integrations and external tooling.
 *
 * POST /api/blog/generate
 *
 * @module api/blog/generate
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { blogGenerationJobs, blogPosts, blogSources, blogPostCitations } from '@apex/db/schema';
import { generateBlogPost, generateTraceHash, type GenerationConfig } from '@/lib/blog';
import { createHash } from 'crypto';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Request validation schema
const GenerateRequestSchema = z.object({
  topic: z.string().min(3).max(500),
  clusterId: z.string().uuid().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  targetWordCount: z.number().min(500).max(10000).optional(),
  style: z.enum(['professional', 'conversational', 'technical', 'beginner-friendly']).optional(),
  researchDepth: z.enum(['quick', 'standard', 'deep']).optional(),
  targetKeywords: z.array(z.string()).optional(),
  game: z.enum(['pokemon', 'mtg', 'lorcana', 'yugioh', 'one_piece', 'flesh_and_blood']).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Authenticate request
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = GenerateRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const config = validationResult.data;
    const traceId = req.headers.get('x-trace-id') || crypto.randomUUID();

    // Create generation job record
    const [job] = await db
      .insert(blogGenerationJobs)
      .values({
        userId: user.id,
        topic: config.topic,
        clusterId: config.clusterId,
        config: config as any,
        status: 'pending',
        progress: 0,
      })
      .returning();

    // For async processing, return job ID immediately
    // Client can poll /api/blog/jobs/[jobId] for status
    const asyncMode = req.headers.get('x-async') === 'true';

    if (asyncMode) {
      // Queue for background processing (TODO: integrate with BullMQ)
      return NextResponse.json({
        jobId: job.id,
        status: 'queued',
        traceId,
        pollUrl: `/api/blog/jobs/${job.id}`,
      });
    }

    // Synchronous generation
    try {
      await db
        .update(blogGenerationJobs)
        .set({ status: 'researching', progress: 10, startedAt: new Date() })
        .where(eq(blogGenerationJobs.id, job.id));

      const result = await generateBlogPost(config as GenerationConfig, async (progress) => {
        await db
          .update(blogGenerationJobs)
          .set({
            status: progress.status,
            progress: progress.progress,
            currentStep: progress.currentStep,
          })
          .where(eq(blogGenerationJobs.id, job.id));
      });

      // Create blog post
      const traceHash = generateTraceHash(result.content);

      const [newPost] = await db
        .insert(blogPosts)
        .values({
          title: result.title,
          subtitle: result.subtitle,
          slug: result.slug,
          content: result.content,
          summary: result.summary,
          excerpt: result.excerpt,
          tableOfContents: result.tableOfContents,
          seoTitle: result.seoTitle,
          seoDescription: result.seoDescription,
          tags: result.suggestedTags,
          status: 'review',
          contentSource: 'ai_generated',
          clusterId: config.clusterId,
          authorId: user.id,
          sourceCount: result.citations.length,
          citationCount: result.citations.length,
          aiMetadata: result.aiMetadata,
          traceHash,
          game: config.game || 'pokemon',
        })
        .returning();

      // Insert citations
      for (const citation of result.citations) {
        const urlHash = createHash('sha256').update(citation.url).digest('hex');

        const [source] = await db
          .insert(blogSources)
          .values({
            url: citation.url,
            urlHash,
            title: citation.title,
            publisher: citation.publisher,
            excerpt: citation.excerpt,
            status: 'pending',
          })
          .onConflictDoNothing()
          .returning();

        const sourceId = source?.id || (
          await db.select({ id: blogSources.id }).from(blogSources).where(eq(blogSources.urlHash, urlHash))
        )[0]?.id;

        if (sourceId) {
          await db.insert(blogPostCitations).values({
            postId: newPost.id,
            sourceId,
            citationNumber: citation.number,
            claimText: citation.claimText,
            relevanceScore: String(citation.relevanceScore),
          });
        }
      }

      // Mark job as completed
      await db
        .update(blogGenerationJobs)
        .set({
          status: 'completed',
          progress: 100,
          postId: newPost.id,
          sourcesFound: result.citations.length,
          sourcesUsed: result.citations.length,
          completedAt: new Date(),
        })
        .where(eq(blogGenerationJobs.id, job.id));

      return NextResponse.json({
        success: true,
        jobId: job.id,
        postId: newPost.id,
        slug: newPost.slug,
        title: newPost.title,
        traceId,
        previewUrl: `/blog/${newPost.slug}?preview=1`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await db
        .update(blogGenerationJobs)
        .set({
          status: 'failed',
          errorMessage,
          errorDetails: { error: String(error) },
        })
        .where(eq(blogGenerationJobs.id, job.id));

      return NextResponse.json(
        { error: 'Generation failed', details: errorMessage, jobId: job.id },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[BlogGenerate] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/blog/generate
 * Returns API documentation
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/blog/generate',
    method: 'POST',
    description: 'Generate an AI-powered blog post with citations',
    authentication: 'Required (Bearer token or session)',
    headers: {
      'x-async': 'Set to "true" for async processing (returns job ID immediately)',
      'x-trace-id': 'Optional trace ID for request tracking',
    },
    body: {
      topic: 'string (required) - The topic to write about',
      clusterId: 'string (optional) - UUID of topic cluster',
      model: 'string (optional) - AI model to use',
      temperature: 'number (optional) - Generation temperature (0-2)',
      targetWordCount: 'number (optional) - Target word count (500-10000)',
      style: 'string (optional) - Writing style (professional|conversational|technical|beginner-friendly)',
      researchDepth: 'string (optional) - Research depth (quick|standard|deep)',
      targetKeywords: 'array (optional) - SEO keywords to target',
      game: 'string (optional) - TCG game (pokemon|mtg|lorcana|yugioh|one_piece|flesh_and_blood)',
    },
    response: {
      success: 'boolean',
      jobId: 'string - Generation job UUID',
      postId: 'string - Created post UUID',
      slug: 'string - URL slug',
      title: 'string - Generated title',
      previewUrl: 'string - Preview URL',
    },
  });
}

/**
 * Blog Generation Job Status API Route
 *
 * GET /api/blog/jobs/[jobId]
 * Returns the status and progress of a blog generation job.
 *
 * @module api/blog/jobs/[jobId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { blogGenerationJobs, blogPosts } from '@apex/db/schema';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: { jobId: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { jobId } = params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(jobId)) {
      return NextResponse.json(
        { error: 'Invalid job ID format' },
        { status: 400 }
      );
    }

    // Fetch job status
    const [job] = await db
      .select()
      .from(blogGenerationJobs)
      .where(eq(blogGenerationJobs.id, jobId));

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // If completed, include post details
    let post = null;
    if (job.status === 'completed' && job.postId) {
      const [postResult] = await db
        .select({
          id: blogPosts.id,
          slug: blogPosts.slug,
          title: blogPosts.title,
          status: blogPosts.status,
        })
        .from(blogPosts)
        .where(eq(blogPosts.id, job.postId));
      post = postResult;
    }

    return NextResponse.json({
      id: job.id,
      status: job.status,
      progress: job.progress,
      currentStep: job.currentStep,
      topic: job.topic,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      sourcesFound: job.sourcesFound,
      sourcesUsed: job.sourcesUsed,
      error: job.status === 'failed' ? job.errorMessage : undefined,
      post: post
        ? {
            id: post.id,
            slug: post.slug,
            title: post.title,
            status: post.status,
            previewUrl: `/blog/${post.slug}?preview=1`,
          }
        : undefined,
    });
  } catch (error) {
    console.error('[BlogJobStatus] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

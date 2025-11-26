/**
 * Video Download Endpoint
 *
 * Serves generated videos to authenticated users.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { videoGenerationRequests } from '@/db/schema';
import { getUserFromRequest } from '@/lib/auth';
import { readFile } from 'fs/promises';
import * as Sentry from '@sentry/nextjs';

/**
 * GET /api/multi-modal/video/[id]
 *
 * Download generated video.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate user
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get video request
    const [request] = await db
      .select()
      .from(videoGenerationRequests)
      .where((r) => r.id === params.id && r.userId === user.id)
      .limit(1);

    if (!request) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    if (request.status !== 'completed' || !request.outputUrl) {
      return NextResponse.json(
        { error: 'Video not ready yet' },
        { status: 404 }
      );
    }

    // 3. Read video file
    // In production, this would redirect to S3/R2 signed URL
    const videoBuffer = await readFile(request.outputUrl);

    // 4. Return video file
    return new NextResponse(videoBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="video-${params.id}.mp4"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[VIDEO_DOWNLOAD_ERROR]', error);

    Sentry.captureException(error, {
      tags: { endpoint: 'video-download' },
    });

    return NextResponse.json(
      {
        error: 'Failed to download video',
      },
      { status: 500 }
    );
  }
}

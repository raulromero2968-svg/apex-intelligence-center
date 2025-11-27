import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * API route for on-demand revalidation
 *
 * Usage:
 * POST /api/revalidate
 * Body: { type: 'path' | 'tag', target: string, secret: string }
 *
 * Examples:
 * - Revalidate specific article: { type: 'path', target: '/blog/my-article', secret: '...' }
 * - Revalidate all posts: { type: 'tag', target: 'posts', secret: '...' }
 * - Revalidate specific post: { type: 'tag', target: 'post-my-article', secret: '...' }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, target, secret } = body;

    // Validate secret (you should set REVALIDATE_SECRET in env)
    const validSecret = process.env.REVALIDATE_SECRET || 'dev-secret-change-in-prod';
    if (secret !== validSecret) {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401 }
      );
    }

    // Validate inputs
    if (!type || !target) {
      return NextResponse.json(
        { error: 'Missing type or target' },
        { status: 400 }
      );
    }

    // Perform revalidation
    if (type === 'path') {
      revalidatePath(target);
      return NextResponse.json({
        success: true,
        message: `Revalidated path: ${target}`,
        timestamp: new Date().toISOString(),
      });
    } else if (type === 'tag') {
      revalidateTag(target);
      return NextResponse.json({
        success: true,
        message: `Revalidated tag: ${target}`,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "path" or "tag"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

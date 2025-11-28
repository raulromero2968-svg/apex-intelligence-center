import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/scan/upload
 * 
 * Uploads an image (data URL or file) and returns a URL.
 * For v1, returns the data URL as-is or stores temporarily.
 * In production, upload to S3/Cloudinary/etc.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageData } = body;

    if (!imageData) {
      return NextResponse.json(
        { error: 'imageData is required' },
        { status: 400 }
      );
    }

    // For v1, if it's already a data URL, return it
    // In production, upload to storage service and return public URL
    if (typeof imageData === 'string' && imageData.startsWith('data:')) {
      // For v1, we'll use the data URL directly
      // Note: VARC service will need to handle data URLs or we'll need to convert
      return NextResponse.json({
        imageUrl: imageData,
      });
    }

    // Handle file upload (if implemented)
    return NextResponse.json(
      { error: 'File upload not yet implemented. Use data URL format.' },
      { status: 400 }
    );
  } catch (error) {
    Sentry.captureException(error);
    console.error('[upload] Error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



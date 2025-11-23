/**
 * Multi-Modal Upload Endpoint
 *
 * Secure endpoint for uploading images and audio files for multi-modal RAG.
 * Extracts embeddings using CLIP (images) and Wav2Vec2 (audio).
 *
 * Features:
 * - JWT authentication
 * - Rate limiting (5 uploads per hour per user)
 * - File validation (type, size)
 * - Embedding extraction
 * - Database storage with pgvector
 */

import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - do not attempt static analysis during build
export const dynamic = 'force-dynamic';
import { z } from 'zod';
import { db } from '@/db';
import { multiModalEmbeddings } from '@/db/schema';
import { getUserFromRequest } from '@/lib/auth';
import { multiModalRateLimiters } from '@/lib/rate-limit';
import { extractImageEmbedding, extractAudioEmbedding } from '@/lib/ml/embeddings';
import * as Sentry from '@sentry/nextjs';
import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

// File upload validation
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_AUDIO_TYPES = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * POST /api/multi-modal/upload
 *
 * Upload and process image or audio file for multi-modal RAG.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Rate limiting (5 uploads per hour)
    const rateLimitResult = await multiModalRateLimiters.multiModalUpload.limit(user.id);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        { status: 429 }
      );
    }

    // 3. Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!type || (type !== 'image' && type !== 'audio')) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "image" or "audio"' },
        { status: 400 }
      );
    }

    // 4. Validate file type and size
    const mimeType = file.type;
    const fileSize = file.size;

    if (type === 'image' && !ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: `Invalid image type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    if (type === 'audio' && !ALLOWED_AUDIO_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: `Invalid audio type. Allowed: ${ALLOWED_AUDIO_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // 5. Save file temporarily
    const uploadDir = '/tmp/uploads';
    await mkdir(uploadDir, { recursive: true });

    const fileExt = path.extname(file.name);
    const tempFileName = `${randomUUID()}${fileExt}`;
    const tempFilePath = path.join(uploadDir, tempFileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(tempFilePath, buffer);

    try {
      // 6. Extract embedding
      let embedding: number[];
      if (type === 'image') {
        embedding = await extractImageEmbedding(tempFilePath);
      } else {
        embedding = await extractAudioEmbedding(tempFilePath);
      }

      // 7. Store in database
      // Note: In production, you would upload the file to S3/R2 and store the URL
      // For now, we'll just store metadata and remove the temp file
      const fileUrl = `local://${tempFileName}`; // Placeholder

      const [result] = await db
        .insert(multiModalEmbeddings)
        .values({
          userId: user.id,
          type,
          embedding,
          fileUrl,
          metadata: {
            filename: file.name,
            fileSize,
            mimeType,
          },
        })
        .returning();

      // 8. Cleanup temp file
      await unlink(tempFilePath);

      // 9. Track success in Sentry
      Sentry.captureMessage('Multi-modal upload successful', {
        level: 'info',
        user: { id: user.id },
        tags: { type, fileSize: String(fileSize) },
      });

      return NextResponse.json({
        success: true,
        id: result.id,
        type: result.type,
        filename: file.name,
      });
    } catch (error) {
      // Cleanup on error
      try {
        await unlink(tempFilePath);
      } catch {}
      throw error;
    }
  } catch (error) {
    console.error('[MULTI_MODAL_UPLOAD_ERROR]', error);

    Sentry.captureException(error, {
      tags: { endpoint: 'multi-modal-upload' },
    });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Upload failed',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/multi-modal/upload
 *
 * List user's uploaded embeddings.
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get query parameters
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    // 3. Query database
    const results = await db.query.multiModalEmbeddings.findMany({
      where: (embeddings, { eq, and }) => {
        const conditions = [eq(embeddings.userId, user.id)];
        if (type === 'image' || type === 'audio') {
          conditions.push(eq(embeddings.type, type));
        }
        return and(...conditions);
      },
      columns: {
        id: true,
        type: true,
        fileUrl: true,
        metadata: true,
        createdAt: true,
      },
      orderBy: (embeddings, { desc }) => [desc(embeddings.createdAt)],
      limit: 50,
    });

    return NextResponse.json({
      success: true,
      count: results.length,
      embeddings: results,
    });
  } catch (error) {
    console.error('[MULTI_MODAL_LIST_ERROR]', error);

    Sentry.captureException(error, {
      tags: { endpoint: 'multi-modal-list' },
    });

    return NextResponse.json(
      {
        error: 'Failed to retrieve embeddings',
      },
      { status: 500 }
    );
  }
}

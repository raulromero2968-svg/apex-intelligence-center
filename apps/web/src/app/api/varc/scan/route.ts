/**
 * VARC Card Scan API Endpoint
 *
 * POST /api/varc/scan
 * - Accepts image upload (multipart/form-data)
 * - Validates request with Zod
 * - Authenticates user via JWT
 * - Enforces tier-based rate limiting
 * - Uploads image to S3/Upstash Blob Storage
 * - Enqueues scan job to BullMQ
 * - Returns jobId for polling
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/auth/jwt';
import { getLimitForTier, ratelimit } from '@/lib/rate-limit';
import { queues } from '@/jobs/queue.config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

// =============================================================================
// CONFIGURATION
// =============================================================================

const S3_BUCKET = process.env.S3_BUCKET || process.env.UPSTASH_BLOB_BUCKET;
const S3_REGION = process.env.S3_REGION || 'us-east-1';
const S3_ENDPOINT = process.env.S3_ENDPOINT; // Optional: for Upstash Blob or S3-compatible storage

// Supported image formats
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;

// File size limits (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Initialize S3 client
const s3Client = new S3Client({
  region: S3_REGION,
  endpoint: S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

const VarcScanFormSchema = z.object({
  image: z.custom<File>((val) => val instanceof File, {
    message: 'Image file is required',
  }).refine(
    (file) => file.size > 0 && file.size <= MAX_FILE_SIZE,
    `File size must be between 1 byte and ${MAX_FILE_SIZE / 1024 / 1024}MB`
  ).refine(
    (file) => ALLOWED_MIME_TYPES.includes(file.type as any),
    `File must be one of: ${ALLOWED_MIME_TYPES.join(', ')}`
  ),
  cardId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(), // Optional: will default to authenticated user
});

type VarcScanFormData = z.infer<typeof VarcScanFormSchema>;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Upload file to S3/Upstash Blob Storage
 */
async function uploadToS3(
  file: File,
  userId: string
): Promise<string> {
  const fileExtension = file.name.split('.').pop() || 'jpg';
  const fileName = `varc-scans/${userId}/${randomUUID()}.${fileExtension}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: fileName,
    Body: buffer,
    ContentType: file.type,
    Metadata: {
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
      userId: userId,
    },
  });

  await s3Client.send(command);

  // Construct public URL (adjust based on your S3 configuration)
  if (S3_ENDPOINT) {
    return `${S3_ENDPOINT}/${S3_BUCKET}/${fileName}`;
  }
  return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${fileName}`;
}

/**
 * Parse multipart form data
 */
async function parseFormData(request: NextRequest): Promise<VarcScanFormData> {
  const formData = await request.formData();

  const image = formData.get('image') as File | null;
  const cardId = formData.get('cardId') as string | null;
  const userId = formData.get('userId') as string | null;

  if (!image) {
    throw new Error('Image file is required');
  }

  return {
    image,
    cardId: cardId || undefined,
    userId: userId || undefined,
  };
}

/**
 * Enqueue VARC scan job
 */
async function enqueueVarcScan(data: {
  scanUrl: string;
  userId: string;
  cardId?: string;
}): Promise<string> {
  const job = await queues.varc.add('varc-scan', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });

  return job.id || '';
}

// =============================================================================
// ERROR RESPONSES
// =============================================================================

function errorResponse(message: string, status: number, details?: any) {
  return NextResponse.json(
    {
      error: message,
      details,
      timestamp: new Date().toISOString(),
    },
    {
      status,
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Content-Security-Policy': "default-src 'none'",
      },
    }
  );
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // =========================================================================
    // STEP 1: AUTHENTICATION
    // =========================================================================
    const user = await getUserFromRequest(request);

    if (!user) {
      return errorResponse('Unauthorized - Invalid or missing JWT token', 401);
    }

    // =========================================================================
    // STEP 2: RATE LIMITING (Tier-based)
    // =========================================================================
    const limit = getLimitForTier(user.tier);
    const identifier = `varc:scan:${user.id}`;

    const { success, reset, remaining, limit: rateLimit } = await ratelimit(
      limit,
      identifier,
      60 // 60 second window
    );

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          limit: rateLimit,
          remaining: 0,
          reset,
          retryAfter,
          timestamp: new Date().toISOString(),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rateLimit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(reset),
            'Retry-After': String(retryAfter),
            'X-Content-Type-Options': 'nosniff',
          },
        }
      );
    }

    // =========================================================================
    // STEP 3: VALIDATE S3 CONFIGURATION
    // =========================================================================
    if (!S3_BUCKET) {
      console.error('S3_BUCKET or UPSTASH_BLOB_BUCKET environment variable not set');
      return errorResponse('Storage service unavailable', 503);
    }

    // =========================================================================
    // STEP 4: PARSE AND VALIDATE FORM DATA
    // =========================================================================
    let formData: VarcScanFormData;

    try {
      formData = await parseFormData(request);
    } catch (err) {
      return errorResponse(
        'Invalid form data',
        400,
        err instanceof Error ? err.message : 'Unknown error'
      );
    }

    // Validate with Zod
    const validation = VarcScanFormSchema.safeParse(formData);

    if (!validation.success) {
      return errorResponse(
        'Validation failed',
        400,
        validation.error.flatten().fieldErrors
      );
    }

    const { image, cardId } = validation.data;
    const effectiveUserId = validation.data.userId || user.id;

    // Security: Ensure user can only scan for themselves (unless they're admin)
    // TODO: Add admin check if needed
    if (effectiveUserId !== user.id) {
      return errorResponse('Forbidden - Cannot scan for other users', 403);
    }

    // =========================================================================
    // STEP 5: UPLOAD IMAGE TO S3
    // =========================================================================
    let scanUrl: string;

    try {
      scanUrl = await uploadToS3(image, effectiveUserId);
    } catch (err) {
      console.error('S3 upload failed:', err);
      return errorResponse(
        'Failed to upload image',
        500,
        process.env.NODE_ENV === 'development'
          ? (err instanceof Error ? err.message : 'Unknown error')
          : undefined
      );
    }

    // =========================================================================
    // STEP 6: ENQUEUE VARC SCAN JOB
    // =========================================================================
    let jobId: string;

    try {
      jobId = await enqueueVarcScan({
        scanUrl,
        userId: effectiveUserId,
        cardId,
      });
    } catch (err) {
      console.error('Failed to enqueue VARC scan job:', err);
      return errorResponse(
        'Failed to enqueue scan job',
        500,
        process.env.NODE_ENV === 'development'
          ? (err instanceof Error ? err.message : 'Unknown error')
          : undefined
      );
    }

    // =========================================================================
    // STEP 7: SUCCESS RESPONSE
    // =========================================================================
    return NextResponse.json(
      {
        success: true,
        jobId,
        scanUrl,
        cardId: cardId || null,
        userId: effectiveUserId,
        timestamp: new Date().toISOString(),
        message: 'VARC scan job enqueued successfully',
      },
      {
        status: 202, // Accepted
        headers: {
          'X-RateLimit-Limit': String(rateLimit),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(reset),
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'Content-Security-Policy': "default-src 'none'",
        },
      }
    );

  } catch (err) {
    console.error('Unexpected error in VARC scan endpoint:', err);

    return errorResponse(
      'Internal server error',
      500,
      process.env.NODE_ENV === 'development'
        ? (err instanceof Error ? err.message : 'Unknown error')
        : undefined
    );
  }
}

// =============================================================================
// ROUTE CONFIG
// =============================================================================

export const runtime = 'nodejs'; // Required for S3 SDK and BullMQ
export const dynamic = 'force-dynamic';
export const maxDuration = 30; // 30 seconds max for file upload

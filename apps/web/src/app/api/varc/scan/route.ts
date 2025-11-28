/**
 * VARC Card Scan API Endpoint (STUB - PENDING AWS SDK INSTALLATION)
 *
 * POST /api/varc/scan
 * - Accepts image upload (multipart/form-data)
 * - Validates request with Zod
 * - Authenticates user via JWT
 * - Enforces tier-based rate limiting
 * - Uploads image to S3/Upstash Blob Storage
 * - Enqueues scan job to BullMQ
 * - Returns jobId for polling
 *
 * TODO: Restore full implementation after adding @aws-sdk/client-s3 dependency
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      ok: false,
      error: 'VARC scan endpoint temporarily disabled. AWS SDK dependency pending installation.',
      message: 'This endpoint will be restored once @aws-sdk/client-s3 is added to dependencies.',
    },
    { status: 503 }
  );
}

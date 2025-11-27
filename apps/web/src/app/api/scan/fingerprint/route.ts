import { NextRequest, NextResponse } from 'next/server';
import { db, pool } from '@/db';
import { cardFingerprints } from '@apex/db';
import { eq, sql, and } from 'drizzle-orm';
import { FingerprintScanRequestSchema, FingerprintScanResponseSchema } from '@apex/shared';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// VARC service URL (can be moved to env var later)
const VARC_SERVICE_URL = process.env.VARC_SERVICE_URL || 'http://localhost:8000';
const FINGERPRINT_HASH_VERSION = process.env.FINGERPRINT_HASH_VERSION || 'v1';
const FINGERPRINT_NEAR_DUP_THRESHOLD = parseFloat(process.env.FINGERPRINT_NEAR_DUP_THRESHOLD || '0.02');

/**
 * POST /api/scan/fingerprint
 * 
 * Scans a card image and generates a fingerprint hash.
 * Performs nearest-neighbor search to detect potential duplicates.
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json();
    const validated = FingerprintScanRequestSchema.parse(body);

    // Get user from request (optional for v1)
    const userId = request.headers.get('x-user-id') || null;

    // Generate job envelope for VARC
    const jobId = crypto.randomUUID();
    const traceId = crypto.randomUUID();
    const requestedAt = new Date().toISOString();

    const varcEnvelope = {
      jobId,
      traceId,
      userId,
      requestedAt,
      payload: {
        cardId: validated.cardId,
        imageUrl: validated.imageUrl,
        extraMetadata: {},
      },
    };

    // Handle data URL - convert to blob and upload if needed
    let finalImageUrl = validated.imageUrl;
    if (validated.imageUrl.startsWith('data:')) {
      // For v1, we'll pass data URL directly to VARC
      // In production, upload to storage service first
      finalImageUrl = validated.imageUrl;
    }

    // Call VARC service /infer endpoint
    let varcResponse;
    try {
      const varcEnvelopeWithUrl = {
        ...varcEnvelope,
        payload: {
          ...varcEnvelope.payload,
          imageUrl: finalImageUrl,
        },
      };

      const varcResponseRaw = await fetch(`${VARC_SERVICE_URL}/infer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(varcEnvelopeWithUrl),
      });

      if (!varcResponseRaw.ok) {
        const errorText = await varcResponseRaw.text();
        throw new Error(`VARC service error: ${varcResponseRaw.status} ${errorText}`);
      }

      varcResponse = await varcResponseRaw.json();
    } catch (error) {
      Sentry.captureException(error);
      console.error('[fingerprint] VARC service call failed:', error);
      return NextResponse.json(
        { error: 'Failed to process image with VARC service' },
        { status: 500 }
      );
    }

    // Extract fingerprint and grade from VARC response
    if (!varcResponse.fingerprint) {
      return NextResponse.json(
        { error: 'VARC service did not return fingerprint' },
        { status: 500 }
      );
    }

    const fingerprintData = varcResponse.fingerprint;
    const grade = varcResponse.grade || null;

    // Check for exact duplicate (same hashVersion + fingerprintHex)
    const existingExact = await db.query.cardFingerprints.findFirst({
      where: and(
        eq(cardFingerprints.hashVersion, fingerprintData.hash_version),
        eq(cardFingerprints.fingerprintHex, fingerprintData.fingerprint_hex)
      ),
    });

    if (existingExact) {
      // Exact duplicate found
      const potentialDuplicates = [existingExact];
      
      const response: typeof FingerprintScanResponseSchema._type = {
        fingerprint: {
          id: existingExact.id,
          userId: existingExact.userId,
          cardId: existingExact.cardId,
          jobId: existingExact.jobId,
          imageUrl: existingExact.imageUrl,
          grade: existingExact.grade,
          hashVersion: existingExact.hashVersion,
          fingerprintVector: existingExact.fingerprintVector as number[],
          fingerprintHex: existingExact.fingerprintHex,
          similarToExisting: true,
          nearestNeighborId: existingExact.id,
          nearestNeighborDistance: 0,
          createdAt: existingExact.createdAt.toISOString(),
        },
        potentialDuplicates: potentialDuplicates.map((fp) => ({
          id: fp.id,
          userId: fp.userId,
          cardId: fp.cardId,
          jobId: fp.jobId,
          imageUrl: fp.imageUrl,
          grade: fp.grade,
          hashVersion: fp.hashVersion,
          fingerprintVector: fp.fingerprintVector as number[],
          fingerprintHex: fp.fingerprintHex,
          similarToExisting: true,
          nearestNeighborId: fp.id,
          nearestNeighborDistance: 0,
          createdAt: fp.createdAt.toISOString(),
        })),
      };

      return NextResponse.json(response);
    }

    // Perform nearest-neighbor search using pgvector
    let nearestNeighborId: string | null = null;
    let nearestNeighborDistance: number | null = null;
    let similarToExisting = false;

    try {
      // Use pgvector distance search via raw SQL
      const vectorArray = `[${fingerprintData.fingerprint_vector.join(',')}]`;
      const query = `
        SELECT 
          id,
          fingerprint_vector <-> $1::vector(256) AS distance
        FROM card_fingerprints
        WHERE hash_version = $2
        ORDER BY fingerprint_vector <-> $1::vector(256)
        LIMIT 1
      `;

      const nearestResult = await pool.query(query, [vectorArray, fingerprintData.hash_version]);
      const nearestRow = nearestResult.rows[0] as { id: string; distance: number } | undefined;

      if (nearestRow && nearestRow.distance < FINGERPRINT_NEAR_DUP_THRESHOLD) {
        nearestNeighborId = nearestRow.id;
        nearestNeighborDistance = nearestRow.distance;
        similarToExisting = true;
      }
    } catch (error) {
      // Log but don't fail - nearest neighbor search is optional
      console.warn('[fingerprint] Nearest neighbor search failed:', error);
    }

    // Insert new fingerprint
    const newFingerprint = await db
      .insert(cardFingerprints)
      .values({
        id: crypto.randomUUID(),
        userId,
        cardId: validated.cardId,
        jobId,
        imageUrl: validated.imageUrl,
        grade,
        hashVersion: fingerprintData.hash_version,
        fingerprintVector: fingerprintData.fingerprint_vector as number[],
        fingerprintHex: fingerprintData.fingerprint_hex,
        nearestNeighborId,
        nearestNeighborDistance,
      })
      .returning();

    const inserted = newFingerprint[0];

    // Get potential duplicates (nearest neighbors within threshold)
    let potentialDuplicates: typeof inserted[] = [];
    if (similarToExisting && nearestNeighborId) {
      try {
        const vectorArray = `[${fingerprintData.fingerprint_vector.join(',')}]`;
        const duplicatesQuery = `
          SELECT *
          FROM card_fingerprints
          WHERE hash_version = $1
            AND fingerprint_vector <-> $2::vector(256) < $3
            AND id != $4
          ORDER BY fingerprint_vector <-> $2::vector(256)
          LIMIT 10
        `;
        const duplicatesResult = await pool.query(duplicatesQuery, [
          fingerprintData.hash_version,
          vectorArray,
          FINGERPRINT_NEAR_DUP_THRESHOLD,
          inserted.id,
        ]);
        potentialDuplicates = duplicatesResult.rows as typeof inserted[];
      } catch (error) {
        console.warn('[fingerprint] Failed to fetch potential duplicates:', error);
      }
    }

    const response: typeof FingerprintScanResponseSchema._type = {
      fingerprint: {
        id: inserted.id,
        userId: inserted.userId,
        cardId: inserted.cardId,
        jobId: inserted.jobId,
        imageUrl: inserted.imageUrl,
        grade: inserted.grade,
        hashVersion: inserted.hashVersion,
        fingerprintVector: inserted.fingerprintVector as number[],
        fingerprintHex: inserted.fingerprintHex,
        similarToExisting,
        nearestNeighborId,
        nearestNeighborDistance,
        createdAt: inserted.createdAt.toISOString(),
      },
      potentialDuplicates: potentialDuplicates.map((fp) => ({
        id: fp.id,
        userId: fp.userId,
        cardId: fp.cardId,
        jobId: fp.jobId,
        imageUrl: fp.imageUrl,
        grade: fp.grade,
        hashVersion: fp.hashVersion,
        fingerprintVector: fp.fingerprintVector as number[],
        fingerprintHex: fp.fingerprintHex,
        similarToExisting: true,
        nearestNeighborId: fp.id,
        nearestNeighborDistance: 0, // Would need to compute actual distance
        createdAt: fp.createdAt.toISOString(),
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    Sentry.captureException(error);
    console.error('[fingerprint] Error:', error);

    if (error instanceof Error) {
      // Handle validation errors
      if (error.message.includes('validation')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



/**
 * Document Upload API Endpoint
 *
 * Handles research document uploads for paper generation.
 * Supports text, markdown, and JSON content types.
 *
 * Features:
 * - Multi-format support (text, markdown, JSON)
 * - Intelligent chunking with embeddings
 * - Deduplication via content hashing
 * - Metadata extraction
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import type { Scope } from '@sentry/types';
import { getUserFromRequest, UserWithTier } from '@/lib/auth';
import { ratelimit, getLimitForTier, getRetryAfter } from '@/lib/rate-limit';
import { createIngestionPipeline, DocumentMetadataSchema } from '@/lib/papers';

// Input validation schema
const UploadDocumentSchema = z.object({
  content: z
    .string()
    .min(100, 'Content must be at least 100 characters')
    .max(500000, 'Content too large (max 500KB)'),
  contentType: z.enum(['text', 'markdown', 'json']).default('text'),
  metadata: DocumentMetadataSchema.optional(),
});

const UploadBatchSchema = z.object({
  documents: z
    .array(UploadDocumentSchema)
    .min(1, 'At least one document required')
    .max(10, 'Maximum 10 documents per batch'),
});

/**
 * POST /api/papers/upload
 *
 * Upload research documents for paper generation
 */
export async function POST(req: NextRequest) {
  let user: UserWithTier | null = null;

  try {
    // Authentication
    user = await getUserFromRequest(req);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting
    const limit = getLimitForTier(user.subscriptionTier);
    const { success, reset, remaining } = await ratelimit(limit, `papers-upload:${user.id}`);

    if (!success) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: getRetryAfter(reset),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(getRetryAfter(reset)),
          },
        }
      );
    }

    // Parse and validate input
    const body = await req.json();

    // Check if single document or batch
    const isBatch = Array.isArray(body.documents);
    const parsed = isBatch
      ? UploadBatchSchema.safeParse(body)
      : UploadDocumentSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request',
          details: parsed.error.issues.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create ingestion pipeline
    const pipeline = createIngestionPipeline({
      chunkSize: 1500,
      chunkOverlap: 200,
      deduplicateContent: true,
      generateEmbeddings: true,
    });

    // Process documents
    if (isBatch) {
      const { documents } = parsed.data as z.infer<typeof UploadBatchSchema>;

      const results = await pipeline.ingestBatch(
        documents.map((doc) => ({
          content: doc.content,
          contentType: doc.contentType as 'text' | 'markdown' | 'json',
          metadata: doc.metadata,
        })),
        user.id
      );

      Sentry.withScope((scope: Scope) => {
        scope.setUser({ id: user!.id, email: user!.email });
        scope.setTag('operation', 'batch_upload');
        scope.setExtra('documentCount', documents.length);
        scope.setExtra('successCount', results.length);
      });

      return new Response(
        JSON.stringify({
          documents: results.map((doc) => ({
            id: doc.id,
            title: doc.title,
            contentType: doc.contentType,
            chunkCount: doc.chunks.length,
            contentHash: doc.contentHash,
            createdAt: doc.createdAt,
          })),
          summary: {
            total: documents.length,
            success: results.length,
            failed: documents.length - results.length,
          },
        }),
        {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': String(remaining),
          },
        }
      );
    } else {
      const { content, contentType, metadata } = parsed.data as z.infer<
        typeof UploadDocumentSchema
      >;

      const document = await pipeline.ingestDocument(
        content,
        contentType as 'text' | 'markdown' | 'json',
        metadata,
        user.id
      );

      Sentry.withScope((scope: Scope) => {
        scope.setUser({ id: user!.id, email: user!.email });
        scope.setTag('operation', 'single_upload');
        scope.setExtra('contentType', contentType);
        scope.setExtra('contentLength', content.length);
      });

      return new Response(
        JSON.stringify({
          document: {
            id: document.id,
            title: document.title,
            contentType: document.contentType,
            chunkCount: document.chunks.length,
            contentHash: document.contentHash,
            metadata: document.metadata,
            createdAt: document.createdAt,
          },
        }),
        {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': String(remaining),
          },
        }
      );
    }
  } catch (error) {
    Sentry.withScope((scope: Scope) => {
      if (user) scope.setUser({ id: user.id, email: user.email });
      Sentry.captureException(error);
    });

    console.error('Document upload error:', error);

    return new Response(
      JSON.stringify({
        error: 'Upload failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';

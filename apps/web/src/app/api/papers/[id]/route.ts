/**
 * Single Paper API Endpoint
 *
 * Handles operations on a specific paper:
 * - GET: Retrieve paper details
 * - PATCH: Update paper status/content
 * - DELETE: Remove paper
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import type { Scope } from '@sentry/types';
import { getUserFromRequest, UserWithTier } from '@/lib/auth';
import { ratelimit, getLimitForTier, getRetryAfter } from '@/lib/rate-limit';
import { pool } from '@/db';

// Update schema
const UpdatePaperSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  abstract: z.string().max(5000).optional(),
  content: z.string().optional(),
  status: z.enum(['draft', 'review', 'published', 'archived']).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/papers/[id]
 *
 * Get a specific paper with full content
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  let user: UserWithTier | null = null;

  try {
    user = await getUserFromRequest(req);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { id } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return new Response(
        JSON.stringify({ error: 'Invalid paper ID format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const client = await pool.connect();
    try {
      // Get paper
      const paperResult = await client.query(
        `
        SELECT
          p.*,
          json_agg(json_build_object(
            'id', c.id,
            'citationNumber', c.citation_number,
            'citationText', c.citation_text,
            'sourceContent', c.source_content,
            'rerankScore', c.rerank_score,
            'metadata', c.metadata
          )) FILTER (WHERE c.id IS NOT NULL) as citations
        FROM papers p
        LEFT JOIN paper_citations c ON p.id = c.paper_id
        WHERE p.id = $1 AND p.user_id = $2
        GROUP BY p.id
        `,
        [id, user.id]
      );

      if (paperResult.rows.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Paper not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const paper = paperResult.rows[0];

      return new Response(
        JSON.stringify({
          paper: {
            id: paper.id,
            title: paper.title,
            abstract: paper.abstract,
            content: paper.content,
            format: paper.format,
            status: paper.status,
            researchTopic: paper.research_topic,
            citationStyle: paper.citation_style,
            citationCount: paper.citation_count,
            synthesisCount: paper.synthesis_count,
            isValid: paper.is_valid,
            validationErrors: paper.validation_errors,
            sections: paper.sections,
            citations: paper.citations || [],
            complianceReport: paper.compliance_report,
            ipfsCid: paper.ipfs_cid,
            traceHash: paper.trace_hash,
            metadata: paper.metadata,
            createdAt: paper.created_at,
            updatedAt: paper.updated_at,
            publishedAt: paper.published_at,
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    Sentry.withScope((scope: Scope) => {
      if (user) scope.setUser({ id: user.id, email: user.email });
      Sentry.captureException(error);
    });

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * PATCH /api/papers/[id]
 *
 * Update a paper
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  let user: UserWithTier | null = null;

  try {
    user = await getUserFromRequest(req);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { id } = await params;

    // Parse and validate input
    const body = await req.json();
    const parsed = UpdatePaperSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request',
          details: parsed.error.issues,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updates = parsed.data;
    if (Object.keys(updates).length === 0) {
      return new Response(
        JSON.stringify({ error: 'No updates provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const client = await pool.connect();
    try {
      // Build update query dynamically
      const setClauses: string[] = ['updated_at = NOW()'];
      const values: any[] = [id, user.id];
      let paramIndex = 3;

      if (updates.title !== undefined) {
        setClauses.push(`title = $${paramIndex++}`);
        values.push(updates.title);
      }
      if (updates.abstract !== undefined) {
        setClauses.push(`abstract = $${paramIndex++}`);
        values.push(updates.abstract);
      }
      if (updates.content !== undefined) {
        setClauses.push(`content = $${paramIndex++}`);
        values.push(updates.content);
      }
      if (updates.status !== undefined) {
        setClauses.push(`status = $${paramIndex++}`);
        values.push(updates.status);

        // Set published_at if publishing
        if (updates.status === 'published') {
          setClauses.push(`published_at = NOW()`);
        }
      }

      const result = await client.query(
        `
        UPDATE papers
        SET ${setClauses.join(', ')}
        WHERE id = $1 AND user_id = $2
        RETURNING id, title, status, updated_at
        `,
        values
      );

      if (result.rows.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Paper not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          paper: result.rows[0],
          message: 'Paper updated successfully',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    Sentry.withScope((scope: Scope) => {
      if (user) scope.setUser({ id: user.id, email: user.email });
      Sentry.captureException(error);
    });

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * DELETE /api/papers/[id]
 *
 * Delete a paper and its citations
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  let user: UserWithTier | null = null;

  try {
    user = await getUserFromRequest(req);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { id } = await params;

    const client = await pool.connect();
    try {
      // Delete paper (citations cascade)
      const result = await client.query(
        `DELETE FROM papers WHERE id = $1 AND user_id = $2 RETURNING id`,
        [id, user.id]
      );

      if (result.rows.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Paper not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ message: 'Paper deleted successfully' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    Sentry.withScope((scope: Scope) => {
      if (user) scope.setUser({ id: user.id, email: user.email });
      Sentry.captureException(error);
    });

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';

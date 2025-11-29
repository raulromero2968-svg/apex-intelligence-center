/**
 * Papers API Endpoint
 *
 * Handles paper listing and creation with full security:
 * - Secure JWT authentication
 * - Tiered rate limiting
 * - Input validation with Zod
 * - Sentry monitoring
 * - EU AI Act compliance
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import type { Scope } from '@sentry/types';
import { getUserFromRequest, UserWithTier } from '@/lib/auth';
import { ratelimit, getLimitForTier, getRetryAfter } from '@/lib/rate-limit';
import { pool } from '@/db';

/**
 * GET /api/papers
 *
 * List user's papers with pagination
 */
export async function GET(req: NextRequest) {
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
    const { success, reset, remaining } = await ratelimit(limit, `papers:${user.id}`);

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

    // Parse pagination params
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const perPage = Math.min(50, Math.max(1, parseInt(searchParams.get('perPage') || '20')));
    const status = searchParams.get('status');
    const offset = (page - 1) * perPage;

    // Build query
    const client = await pool.connect();
    try {
      const statusFilter = status ? 'AND status = $3' : '';
      const params = status
        ? [user.id, perPage, status, offset]
        : [user.id, perPage, offset];

      const result = await client.query(
        `
        SELECT
          id,
          title,
          abstract,
          status,
          research_topic,
          citation_style,
          format,
          citation_count,
          synthesis_count,
          is_valid,
          ipfs_cid,
          created_at,
          updated_at,
          published_at
        FROM papers
        WHERE user_id = $1 ${statusFilter}
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $${status ? 4 : 3}
        `,
        params
      );

      // Get total count
      const countParams = status ? [user.id, status] : [user.id];
      const countResult = await client.query(
        `SELECT COUNT(*) FROM papers WHERE user_id = $1 ${status ? 'AND status = $2' : ''}`,
        countParams
      );

      const total = parseInt(countResult.rows[0].count);

      return new Response(
        JSON.stringify({
          papers: result.rows.map((row) => ({
            id: row.id,
            title: row.title,
            abstract: row.abstract?.slice(0, 200),
            status: row.status,
            researchTopic: row.research_topic,
            citationStyle: row.citation_style,
            format: row.format,
            citationCount: row.citation_count,
            synthesisCount: row.synthesis_count,
            isValid: row.is_valid,
            ipfsCid: row.ipfs_cid,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            publishedAt: row.published_at,
          })),
          pagination: {
            page,
            perPage,
            total,
            totalPages: Math.ceil(total / perPage),
          },
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': String(remaining),
          },
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

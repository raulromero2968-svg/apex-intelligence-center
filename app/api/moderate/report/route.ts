/**
 * Report Moderation API - Admin approve/reject workflow
 *
 * PUT: Approve or reject a pending report
 * GET: List pending reports in moderation queue
 *
 * Features:
 * - RBAC: Only admin/moderator roles can moderate
 * - Audit logging for all moderation actions
 * - WebSocket broadcast on approval
 * - Batch moderation support
 *
 * Reference: knowledge-05-security-oauth2-jwt.md (RBAC, audit logging)
 *
 * @module api/moderate/report
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/client';
import { Pool } from 'pg';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { broadcastApprovedReport, sendUserNotification } from '@/app/api/ws/route';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const moderateReportSchema = z.object({
  reportId: z.string().uuid(),
  status: z.enum(['approved', 'rejected']),
  reason: z.string().min(1).max(1000).optional(),
});

const batchModerateSchema = z.object({
  reports: z.array(z.object({
    reportId: z.string().uuid(),
    status: z.enum(['approved', 'rejected']),
    reason: z.string().optional(),
  })).min(1).max(50),
});

const listQueueSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  category: z.string().optional(),
  postedTo: z.enum(['commons', 'rc_market', 'both']).optional(),
});

// =============================================================================
// DATABASE CONNECTION
// =============================================================================

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Verify user has admin/moderator role
 */
async function verifyAdminAccess(client: any, userId: string): Promise<{ isAdmin: boolean; role: string }> {
  const result = await client.query(
    `SELECT role FROM users WHERE id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return { isAdmin: false, role: 'unknown' };
  }

  const role = result.rows[0].role;
  const isAdmin = ['admin', 'moderator', 'super_admin'].includes(role);

  return { isAdmin, role };
}

/**
 * Log moderation action to audit_logs
 */
async function logModerationAction(
  client: any,
  adminId: string,
  reportId: string,
  action: 'approved' | 'rejected',
  reason: string,
  metadata: Record<string, unknown>
): Promise<void> {
  await client.query(
    `INSERT INTO audit_logs (admin_id, action, severity, target_id, target_type, reason, metadata)
     VALUES ($1, 'approve_content', $2, $3, 'intel_report', $4, $5)`,
    [
      adminId,
      action === 'rejected' ? 'warning' : 'info',
      reportId,
      reason || `Report ${action}`,
      JSON.stringify({
        ...metadata,
        moderationStatus: action,
        timestamp: new Date().toISOString(),
      }),
    ]
  );
}

// =============================================================================
// PUT - MODERATE SINGLE OR BATCH REPORTS
// =============================================================================

export async function PUT(request: NextRequest) {
  const client = await pool.connect();

  try {
    const supabase = createSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify admin/moderator role
    const { isAdmin, role } = await verifyAdminAccess(client, user.id);

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin or moderator role required' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Check if batch or single moderation
    const isBatch = 'reports' in body;

    if (isBatch) {
      // Batch moderation
      const { reports } = batchModerateSchema.parse(body);
      const results: Array<{ reportId: string; success: boolean; error?: string }> = [];

      await client.query('BEGIN');

      try {
        for (const item of reports) {
          try {
            // Validate report exists and is pending
            const reportResult = await client.query(
              `SELECT id, user_id, title, slug, summary, category, tier, posted_to, game, tags, moderation_status
               FROM intel_reports WHERE id = $1`,
              [item.reportId]
            );

            if (reportResult.rows.length === 0) {
              results.push({ reportId: item.reportId, success: false, error: 'Report not found' });
              continue;
            }

            const report = reportResult.rows[0];

            if (report.moderation_status !== 'pending') {
              results.push({
                reportId: item.reportId,
                success: false,
                error: `Report already ${report.moderation_status}`,
              });
              continue;
            }

            // Rejection requires reason
            if (item.status === 'rejected' && !item.reason) {
              results.push({
                reportId: item.reportId,
                success: false,
                error: 'Rejection requires a reason',
              });
              continue;
            }

            // Update moderation status
            await client.query(
              `UPDATE intel_reports
               SET moderation_status = $1,
                   moderated_by = $2,
                   moderated_at = NOW(),
                   moderation_reason = $3
               WHERE id = $4`,
              [item.status, user.id, item.reason || null, item.reportId]
            );

            // Log to audit
            await logModerationAction(client, user.id, item.reportId, item.status, item.reason || '', {
              moderatorRole: role,
              reportTitle: report.title,
              batch: true,
            });

            // Broadcast if approved
            if (item.status === 'approved') {
              broadcastApprovedReport({
                id: report.id,
                title: report.title,
                slug: report.slug,
                summary: report.summary,
                category: report.category,
                tier: report.tier,
                postedTo: report.posted_to,
                game: report.game,
                tags: report.tags || [],
                authorId: report.user_id,
                publishedAt: new Date().toISOString(),
              });

              // Notify author
              sendUserNotification(report.user_id, {
                type: 'report_approved',
                title: 'Report Approved',
                body: `Your report "${report.title}" has been approved and is now live!`,
                data: { reportId: report.id, slug: report.slug },
              });
            } else {
              // Notify author of rejection
              sendUserNotification(report.user_id, {
                type: 'report_rejected',
                title: 'Report Needs Revision',
                body: `Your report "${report.title}" was not approved. Reason: ${item.reason}`,
                data: { reportId: report.id, reason: item.reason },
              });
            }

            results.push({ reportId: item.reportId, success: true });
          } catch (itemError) {
            results.push({
              reportId: item.reportId,
              success: false,
              error: 'Processing failed',
            });
          }
        }

        await client.query('COMMIT');

        const successCount = results.filter((r) => r.success).length;

        return NextResponse.json({
          success: true,
          message: `Moderated ${successCount} of ${reports.length} reports`,
          results,
        });
      } catch (batchError) {
        await client.query('ROLLBACK');
        throw batchError;
      }
    } else {
      // Single report moderation
      const { reportId, status, reason } = moderateReportSchema.parse(body);

      // Rejection requires reason
      if (status === 'rejected' && !reason) {
        return NextResponse.json(
          { success: false, error: 'Rejection requires a reason' },
          { status: 400 }
        );
      }

      // Get report details
      const reportResult = await client.query(
        `SELECT id, user_id, title, slug, summary, category, tier, posted_to, game, tags, moderation_status
         FROM intel_reports WHERE id = $1`,
        [reportId]
      );

      if (reportResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Report not found' },
          { status: 404 }
        );
      }

      const report = reportResult.rows[0];

      if (report.moderation_status !== 'pending') {
        return NextResponse.json(
          { success: false, error: `Report already ${report.moderation_status}` },
          { status: 400 }
        );
      }

      // Update moderation status
      await client.query(
        `UPDATE intel_reports
         SET moderation_status = $1,
             moderated_by = $2,
             moderated_at = NOW(),
             moderation_reason = $3
         WHERE id = $4`,
        [status, user.id, reason || null, reportId]
      );

      // Log to audit
      await logModerationAction(client, user.id, reportId, status, reason || '', {
        moderatorRole: role,
        reportTitle: report.title,
        batch: false,
      });

      // Broadcast if approved
      if (status === 'approved') {
        broadcastApprovedReport({
          id: report.id,
          title: report.title,
          slug: report.slug,
          summary: report.summary,
          category: report.category,
          tier: report.tier,
          postedTo: report.posted_to,
          game: report.game,
          tags: report.tags || [],
          authorId: report.user_id,
          publishedAt: new Date().toISOString(),
        });

        // Notify author
        sendUserNotification(report.user_id, {
          type: 'report_approved',
          title: 'Report Approved',
          body: `Your report "${report.title}" has been approved and is now live!`,
          data: { reportId: report.id, slug: report.slug },
        });
      } else {
        // Notify author of rejection
        sendUserNotification(report.user_id, {
          type: 'report_rejected',
          title: 'Report Needs Revision',
          body: `Your report "${report.title}" was not approved. Reason: ${reason}`,
          data: { reportId: report.id, reason },
        });
      }

      Sentry.addBreadcrumb({
        category: 'moderation',
        message: `Report ${reportId} ${status} by ${user.id}`,
        level: 'info',
        data: { status, reason },
      });

      return NextResponse.json({
        success: true,
        message: `Report ${status}`,
        report: {
          id: report.id,
          title: report.title,
          moderationStatus: status,
          moderatedAt: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    console.error('Moderation failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    Sentry.captureException(error);

    return NextResponse.json(
      { success: false, error: 'Moderation failed' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// =============================================================================
// GET - LIST PENDING MODERATION QUEUE
// =============================================================================

export async function GET(request: NextRequest) {
  const client = await pool.connect();

  try {
    const supabase = createSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify admin/moderator role
    const { isAdmin } = await verifyAdminAccess(client, user.id);

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin or moderator role required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const params = listQueueSchema.parse(searchParams);
    const offset = (params.page - 1) * params.limit;

    // Build WHERE clause
    const conditions: string[] = ["moderation_status = 'pending'", "status = 'published'"];
    const queryParams: (string | number)[] = [];
    let paramIndex = 1;

    if (params.category) {
      conditions.push(`category = $${paramIndex}`);
      queryParams.push(params.category);
      paramIndex++;
    }

    if (params.postedTo) {
      conditions.push(`(posted_to = $${paramIndex} OR posted_to = 'both')`);
      queryParams.push(params.postedTo);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countResult = await client.query(
      `SELECT COUNT(*) FROM intel_reports WHERE ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Add pagination params
    queryParams.push(params.limit, offset);

    // Fetch pending reports
    const result = await client.query(
      `SELECT
        ir.id, ir.user_id, ir.title, ir.slug, ir.summary, ir.content,
        ir.category, ir.tier, ir.posted_to, ir.game, ir.tags,
        ir.created_at, ir.published_at,
        u.display_name as author_name, u.avatar_url as author_avatar,
        u.is_trusted_author
       FROM intel_reports ir
       LEFT JOIN users u ON ir.user_id = u.id
       WHERE ${whereClause}
       ORDER BY ir.created_at ASC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      queryParams
    );

    const reports = result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      slug: row.slug,
      summary: row.summary,
      content: row.content,
      category: row.category,
      tier: row.tier,
      postedTo: row.posted_to,
      game: row.game,
      tags: row.tags || [],
      createdAt: row.created_at,
      publishedAt: row.published_at,
      author: {
        name: row.author_name,
        avatar: row.author_avatar,
        isTrusted: row.is_trusted_author,
      },
    }));

    return NextResponse.json({
      success: true,
      reports,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    });
  } catch (error) {
    console.error('Moderation queue fetch failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    Sentry.captureException(error);

    return NextResponse.json(
      { success: false, error: 'Failed to fetch moderation queue' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

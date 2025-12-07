/**
 * Buy Intel Report API - RC Transaction for Report Purchases
 *
 * POST: Purchase a premium intel report using RC (Reputation Credits)
 *
 * Implements atomic transaction for:
 * - Balance validation
 * - RC transfer from buyer to seller
 * - Purchase record creation
 * - Transaction logging
 *
 * Reference: knowledge-01-api-stripe-integration.md (RC transactions)
 *
 * @module api/buy/report
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/client';
import { Pool } from 'pg';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

const buyReportSchema = z.object({
  reportId: z.string().uuid(),
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
// POST - PURCHASE INTEL REPORT
// =============================================================================

export async function POST(request: NextRequest) {
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

    const buyerId = user.id;

    // Parse and validate request body
    const body = await request.json();
    const { reportId } = buyReportSchema.parse(body);

    // Start transaction
    await client.query('BEGIN');

    try {
      // 1. Get report details with FOR UPDATE lock
      const reportResult = await client.query(
        `SELECT id, user_id, title, price, tier, status
         FROM intel_reports
         WHERE id = $1
         FOR UPDATE`,
        [reportId]
      );

      if (reportResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { success: false, error: 'Report not found' },
          { status: 404 }
        );
      }

      const report = reportResult.rows[0];

      // 2. Validate report can be purchased
      if (report.status !== 'published') {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { success: false, error: 'Report is not available for purchase' },
          { status: 400 }
        );
      }

      if (report.tier === 'free') {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { success: false, error: 'This is a free report, no purchase required' },
          { status: 400 }
        );
      }

      if (report.user_id === buyerId) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { success: false, error: 'Cannot purchase your own report' },
          { status: 400 }
        );
      }

      const price = report.price;

      if (!price || price <= 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { success: false, error: 'Invalid report price' },
          { status: 400 }
        );
      }

      // 3. Check if already purchased
      const existingPurchase = await client.query(
        `SELECT id FROM intel_report_purchases
         WHERE report_id = $1 AND buyer_id = $2`,
        [reportId, buyerId]
      );

      if (existingPurchase.rows.length > 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { success: false, error: 'Report already purchased' },
          { status: 400 }
        );
      }

      // 4. Get buyer's commons profile with RC balance
      const buyerProfileResult = await client.query(
        `SELECT id, reputation_credits
         FROM commons_user_profiles
         WHERE user_id = $1
         FOR UPDATE`,
        [buyerId]
      );

      if (buyerProfileResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { success: false, error: 'Buyer profile not found. Please create a Commons profile first.' },
          { status: 400 }
        );
      }

      const buyerProfile = buyerProfileResult.rows[0];
      const buyerBalance = buyerProfile.reputation_credits;

      if (buyerBalance < price) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          {
            success: false,
            error: 'Insufficient RC balance',
            details: {
              required: price,
              available: buyerBalance,
              shortfall: price - buyerBalance,
            },
          },
          { status: 400 }
        );
      }

      // 5. Get seller's commons profile
      const sellerProfileResult = await client.query(
        `SELECT id, reputation_credits
         FROM commons_user_profiles
         WHERE user_id = $1
         FOR UPDATE`,
        [report.user_id]
      );

      if (sellerProfileResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { success: false, error: 'Seller profile not found' },
          { status: 500 }
        );
      }

      const sellerProfile = sellerProfileResult.rows[0];

      // 6. Deduct RC from buyer
      await client.query(
        `UPDATE commons_user_profiles
         SET reputation_credits = reputation_credits - $1,
             updated_at = NOW()
         WHERE id = $2`,
        [price, buyerProfile.id]
      );

      // 7. Credit RC to seller
      await client.query(
        `UPDATE commons_user_profiles
         SET reputation_credits = reputation_credits + $1,
             updated_at = NOW()
         WHERE id = $2`,
        [price, sellerProfile.id]
      );

      // 8. Create purchase record
      const purchaseResult = await client.query(
        `INSERT INTO intel_report_purchases (
          report_id, buyer_id, price_paid, accessed_at, access_count
         ) VALUES ($1, $2, $3, NOW(), 1)
         RETURNING id, created_at`,
        [reportId, buyerId, price]
      );

      const purchase = purchaseResult.rows[0];

      // 9. Log buyer transaction (spend)
      await client.query(
        `INSERT INTO commons_rc_transactions (
          user_id, amount, balance, reason, reason_code,
          reference_type, reference_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          buyerProfile.id,
          -price,
          buyerBalance - price,
          `Purchased report: ${report.title}`,
          'report_purchase',
          'intel_report',
          reportId,
        ]
      );

      // 10. Log seller transaction (earn)
      await client.query(
        `INSERT INTO commons_rc_transactions (
          user_id, amount, balance, reason, reason_code,
          reference_type, reference_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          sellerProfile.id,
          price,
          sellerProfile.reputation_credits + price,
          `Sold report: ${report.title}`,
          'report_sale',
          'intel_report',
          reportId,
        ]
      );

      // 11. Update report purchase count
      await client.query(
        `UPDATE intel_reports
         SET purchase_count = purchase_count + 1
         WHERE id = $1`,
        [reportId]
      );

      // Commit transaction
      await client.query('COMMIT');

      // Track purchase in Sentry
      Sentry.addBreadcrumb({
        category: 'purchase',
        message: `Report purchased: ${reportId}`,
        level: 'info',
        data: {
          buyerId,
          sellerId: report.user_id,
          price,
        },
      });

      return NextResponse.json({
        success: true,
        purchase: {
          id: purchase.id,
          reportId,
          reportTitle: report.title,
          pricePaid: price,
          newBalance: buyerBalance - price,
          purchasedAt: purchase.created_at,
        },
      });
    } catch (txError) {
      await client.query('ROLLBACK');
      throw txError;
    }
  } catch (error) {
    console.error('Report purchase failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    Sentry.captureException(error, {
      extra: { action: 'report_purchase' },
    });

    return NextResponse.json(
      { success: false, error: 'Purchase failed' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// =============================================================================
// GET - CHECK PURCHASE STATUS
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

    const reportId = request.nextUrl.searchParams.get('reportId');

    if (!reportId) {
      return NextResponse.json(
        { success: false, error: 'reportId is required' },
        { status: 400 }
      );
    }

    // Check if user has purchased this report
    const purchaseResult = await client.query(
      `SELECT id, price_paid, accessed_at, access_count, created_at
       FROM intel_report_purchases
       WHERE report_id = $1 AND buyer_id = $2`,
      [reportId, user.id]
    );

    if (purchaseResult.rows.length === 0) {
      // Check if user is the author
      const authorResult = await client.query(
        `SELECT id FROM intel_reports WHERE id = $1 AND user_id = $2`,
        [reportId, user.id]
      );

      if (authorResult.rows.length > 0) {
        return NextResponse.json({
          success: true,
          hasAccess: true,
          isAuthor: true,
        });
      }

      return NextResponse.json({
        success: true,
        hasAccess: false,
        purchase: null,
      });
    }

    const purchase = purchaseResult.rows[0];

    // Update access tracking
    await client.query(
      `UPDATE intel_report_purchases
       SET accessed_at = NOW(), access_count = access_count + 1
       WHERE id = $1`,
      [purchase.id]
    );

    return NextResponse.json({
      success: true,
      hasAccess: true,
      isAuthor: false,
      purchase: {
        id: purchase.id,
        pricePaid: purchase.price_paid,
        accessedAt: purchase.accessed_at,
        accessCount: purchase.access_count + 1,
        purchasedAt: purchase.created_at,
      },
    });
  } catch (error) {
    console.error('Purchase status check failed:', error);

    Sentry.captureException(error);

    return NextResponse.json(
      { success: false, error: 'Failed to check purchase status' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

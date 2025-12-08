/**
 * TCG Card Marketplace API
 *
 * Provides CRUD operations for card listings with RC/USD hybrid payments.
 * Integrates with Stripe for USD and internal RC ledger for Reputation Credits.
 *
 * Endpoints:
 * - GET: List/search card listings with pagination
 * - POST: Create new listing
 * - PUT: Purchase a listing (RC or USD)
 *
 * Reference: knowledge-09-database-architecture.md, knowledge-01-api-stripe-integration.md
 *
 * @module api/marketplace/cards
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { headers } from 'next/headers';

// =============================================================================
// CONSTANTS
// =============================================================================

const PLATFORM_FEE_PERCENT = 0.10; // 10% platform fee for RC
const STRIPE_FEE_PERCENT = 0.029; // 2.9% + $0.30 for Stripe
const STRIPE_FEE_FIXED = 0.30;
const DEFAULT_LIMIT = 20;

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
// VALIDATION SCHEMAS
// =============================================================================

const listingsQuerySchema = z.object({
  cardId: z.string().optional(),
  sellerId: z.string().optional(),
  game: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  priceType: z.enum(['rc', 'usd', 'any']).default('any'),
  status: z.enum(['active', 'sold', 'expired', 'all']).default('active'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(DEFAULT_LIMIT),
  sort: z.enum(['price_asc', 'price_desc', 'newest', 'oldest']).default('newest'),
});

const createListingSchema = z.object({
  cardId: z.string().min(1),
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  priceRc: z.number().int().positive().optional(),
  priceUsd: z.number().positive().optional(),
  quantity: z.number().int().min(1).default(1),
  grade: z.string().optional(),
  gradingCompany: z.enum(['PSA', 'BGS', 'CGC', 'SGC']).optional(),
  certNumber: z.string().optional(),
  condition: z.enum(['mint', 'near_mint', 'excellent', 'good', 'fair', 'poor']).default('near_mint'),
  imageUrls: z.array(z.string().url()).default([]),
  expiresInDays: z.number().int().min(1).max(90).default(30),
}).refine((data) => data.priceRc || data.priceUsd, {
  message: 'At least one price (RC or USD) is required',
});

const purchaseSchema = z.object({
  listingId: z.string().uuid(),
  paymentType: z.enum(['rc', 'usd']),
  quantity: z.number().int().min(1).default(1),
  shippingAddress: z.object({
    name: z.string(),
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
  }).optional(),
});

// =============================================================================
// AUTH HELPER (placeholder - integrate with your auth system)
// =============================================================================

async function getUserIdFromAuth(request: NextRequest): Promise<string | null> {
  // Integrate with your auth system (NextAuth, Clerk, etc.)
  const headersList = await headers();
  const authHeader = headersList.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  // Decode/verify token and return user ID
  // For now, return null (unauthenticated)
  return null;
}

// =============================================================================
// GET - LIST/SEARCH CARD LISTINGS
// =============================================================================

export async function GET(request: NextRequest) {
  const client = await pool.connect();

  try {
    const params = listingsQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams)
    );

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build WHERE clause
    if (params.status !== 'all') {
      conditions.push(`cl.status = $${paramIndex++}`);
      values.push(params.status);
    }

    if (params.cardId) {
      conditions.push(`cl.card_id = $${paramIndex++}`);
      values.push(params.cardId);
    }

    if (params.sellerId) {
      conditions.push(`cl.seller_id = $${paramIndex++}`);
      values.push(params.sellerId);
    }

    if (params.game) {
      conditions.push(`c.game = $${paramIndex++}`);
      values.push(params.game);
    }

    if (params.priceType === 'rc') {
      conditions.push('cl.price_rc IS NOT NULL');
      if (params.minPrice) {
        conditions.push(`cl.price_rc >= $${paramIndex++}`);
        values.push(params.minPrice);
      }
      if (params.maxPrice) {
        conditions.push(`cl.price_rc <= $${paramIndex++}`);
        values.push(params.maxPrice);
      }
    } else if (params.priceType === 'usd') {
      conditions.push('cl.price_usd IS NOT NULL');
      if (params.minPrice) {
        conditions.push(`cl.price_usd >= $${paramIndex++}`);
        values.push(params.minPrice);
      }
      if (params.maxPrice) {
        conditions.push(`cl.price_usd <= $${paramIndex++}`);
        values.push(params.maxPrice);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Sort order
    const sortMap: Record<string, string> = {
      price_asc: 'COALESCE(cl.price_usd, cl.price_rc) ASC',
      price_desc: 'COALESCE(cl.price_usd, cl.price_rc) DESC',
      newest: 'cl.created_at DESC',
      oldest: 'cl.created_at ASC',
    };
    const orderBy = sortMap[params.sort];

    // Count total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM card_listings cl
      LEFT JOIN cards c ON cl.card_id = c.id
      ${whereClause}
    `;
    const countResult = await client.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Fetch listings with card info
    const offset = (params.page - 1) * params.limit;
    const listingsQuery = `
      SELECT
        cl.id, cl.card_id, cl.seller_id, cl.title, cl.description,
        cl.price_rc, cl.price_usd, cl.quantity, cl.grade, cl.grading_company,
        cl.cert_number, cl.condition, cl.image_urls, cl.status, cl.view_count,
        cl.expires_at, cl.created_at, cl.updated_at,
        c.name as card_name, c.set_name, c.card_number, c.game, c.rarity,
        u.name as seller_name, u.image as seller_image
      FROM card_listings cl
      LEFT JOIN cards c ON cl.card_id = c.id
      LEFT JOIN users u ON cl.seller_id = u.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;

    const result = await client.query(listingsQuery, [...values, params.limit, offset]);

    const listings = result.rows.map((row) => ({
      id: row.id,
      cardId: row.card_id,
      sellerId: row.seller_id,
      title: row.title,
      description: row.description,
      priceRc: row.price_rc,
      priceUsd: row.price_usd,
      quantity: row.quantity,
      grade: row.grade,
      gradingCompany: row.grading_company,
      certNumber: row.cert_number,
      condition: row.condition,
      imageUrls: row.image_urls,
      status: row.status,
      viewCount: row.view_count,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      card: {
        name: row.card_name,
        setName: row.set_name,
        cardNumber: row.card_number,
        game: row.game,
        rarity: row.rarity,
      },
      seller: {
        name: row.seller_name,
        image: row.seller_image,
      },
    }));

    return NextResponse.json({
      success: true,
      listings,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    });
  } catch (error) {
    console.error('Listing search failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    Sentry.captureException(error);
    return NextResponse.json({ success: false, error: 'Search failed' }, { status: 500 });
  } finally {
    client.release();
  }
}

// =============================================================================
// POST - CREATE NEW LISTING
// =============================================================================

export async function POST(request: NextRequest) {
  const client = await pool.connect();

  try {
    const userId = await getUserIdFromAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createListingSchema.parse(body);

    // Verify card exists
    const cardCheck = await client.query('SELECT id FROM cards WHERE id = $1', [data.cardId]);
    if (cardCheck.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Card not found' }, { status: 404 });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + data.expiresInDays);

    const insertQuery = `
      INSERT INTO card_listings (
        card_id, seller_id, title, description, price_rc, price_usd,
        quantity, grade, grading_company, cert_number, condition,
        image_urls, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const result = await client.query(insertQuery, [
      data.cardId,
      userId,
      data.title,
      data.description,
      data.priceRc || null,
      data.priceUsd || null,
      data.quantity,
      data.grade || null,
      data.gradingCompany || null,
      data.certNumber || null,
      data.condition,
      JSON.stringify(data.imageUrls),
      expiresAt,
    ]);

    const listing = result.rows[0];

    Sentry.addBreadcrumb({
      category: 'marketplace',
      message: `Listing created: ${listing.id}`,
      level: 'info',
      data: { userId, cardId: data.cardId, priceRc: data.priceRc, priceUsd: data.priceUsd },
    });

    return NextResponse.json({
      success: true,
      listing: {
        id: listing.id,
        cardId: listing.card_id,
        sellerId: listing.seller_id,
        priceRc: listing.price_rc,
        priceUsd: listing.price_usd,
        quantity: listing.quantity,
        status: listing.status,
        createdAt: listing.created_at,
      },
    });
  } catch (error) {
    console.error('Create listing failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    Sentry.captureException(error);
    return NextResponse.json({ success: false, error: 'Failed to create listing' }, { status: 500 });
  } finally {
    client.release();
  }
}

// =============================================================================
// PUT - PURCHASE A LISTING
// =============================================================================

export async function PUT(request: NextRequest) {
  const client = await pool.connect();

  try {
    const userId = await getUserIdFromAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = purchaseSchema.parse(body);

    // Start transaction
    await client.query('BEGIN');

    // Lock and fetch listing
    const listingResult = await client.query(
      `SELECT * FROM card_listings WHERE id = $1 AND status = 'active' FOR UPDATE`,
      [data.listingId]
    );

    if (listingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ success: false, error: 'Listing not available' }, { status: 404 });
    }

    const listing = listingResult.rows[0];

    // Prevent self-purchase
    if (listing.seller_id === userId) {
      await client.query('ROLLBACK');
      return NextResponse.json({ success: false, error: 'Cannot purchase own listing' }, { status: 400 });
    }

    // Check quantity
    if (listing.quantity < data.quantity) {
      await client.query('ROLLBACK');
      return NextResponse.json({ success: false, error: 'Insufficient quantity' }, { status: 400 });
    }

    // Validate price for payment type
    const price = data.paymentType === 'rc' ? listing.price_rc : listing.price_usd;
    if (!price) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: `${data.paymentType.toUpperCase()} price not set` },
        { status: 400 }
      );
    }

    const totalAmount = price * data.quantity;
    let platformFee: number;
    let sellerPayout: number;
    let stripePaymentId: string | null = null;
    let rcTransactionId: string | null = null;

    if (data.paymentType === 'rc') {
      // RC payment - check buyer balance
      const buyerResult = await client.query(
        'SELECT rc_balance FROM user_rc_profiles WHERE user_id = $1',
        [userId]
      );

      const buyerBalance = buyerResult.rows[0]?.rc_balance || 0;
      if (buyerBalance < totalAmount) {
        await client.query('ROLLBACK');
        return NextResponse.json({ success: false, error: 'Insufficient RC balance' }, { status: 400 });
      }

      platformFee = Math.floor(totalAmount * PLATFORM_FEE_PERCENT);
      sellerPayout = totalAmount - platformFee;

      // Deduct from buyer
      await client.query(
        `UPDATE user_rc_profiles SET rc_balance = rc_balance - $1 WHERE user_id = $2`,
        [totalAmount, userId]
      );

      // Credit to seller
      await client.query(
        `UPDATE user_rc_profiles SET rc_balance = rc_balance + $1 WHERE user_id = $2`,
        [sellerPayout, listing.seller_id]
      );

      // Record RC transaction for buyer
      const buyerTxResult = await client.query(
        `INSERT INTO rc_transactions (id, user_id, amount, reason, source_product, reference_type, reference_id, balance_after)
         VALUES (gen_random_uuid(), $1, $2, 'card_purchase', 'marketplace', 'card_listing', $3,
                 (SELECT rc_balance FROM user_rc_profiles WHERE user_id = $1))
         RETURNING id`,
        [userId, -totalAmount, data.listingId]
      );
      rcTransactionId = buyerTxResult.rows[0].id;

      // Record RC transaction for seller
      await client.query(
        `INSERT INTO rc_transactions (id, user_id, amount, reason, source_product, reference_type, reference_id, balance_after)
         VALUES (gen_random_uuid(), $1, $2, 'card_sale', 'marketplace', 'card_listing', $3,
                 (SELECT rc_balance FROM user_rc_profiles WHERE user_id = $1))`,
        [listing.seller_id, sellerPayout, data.listingId]
      );

    } else {
      // USD payment via Stripe
      platformFee = totalAmount * STRIPE_FEE_PERCENT + STRIPE_FEE_FIXED;
      sellerPayout = totalAmount - platformFee;

      // Create Stripe checkout session (simplified - actual implementation uses Stripe SDK)
      // In production, return a checkout URL and handle via webhook
      const stripeSecret = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecret) {
        await client.query('ROLLBACK');
        return NextResponse.json({ success: false, error: 'Payment not configured' }, { status: 500 });
      }

      // For now, we'll just record the intent - actual payment handled by Stripe webhook
      stripePaymentId = `pending_${Date.now()}`;
    }

    // Update listing quantity and status
    const newQuantity = listing.quantity - data.quantity;
    const newStatus = newQuantity === 0 ? 'sold' : 'active';

    await client.query(
      `UPDATE card_listings SET quantity = $1, status = $2, sold_at = CASE WHEN $2 = 'sold' THEN NOW() ELSE sold_at END
       WHERE id = $3`,
      [newQuantity, newStatus, data.listingId]
    );

    // Record transaction
    const txResult = await client.query(
      `INSERT INTO card_transactions (
        listing_id, buyer_id, seller_id, card_id, payment_type, amount,
        platform_fee, seller_payout, stripe_payment_id, rc_transaction_id,
        status, shipping_address, completed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING id`,
      [
        data.listingId,
        userId,
        listing.seller_id,
        listing.card_id,
        data.paymentType,
        totalAmount,
        platformFee,
        sellerPayout,
        stripePaymentId,
        rcTransactionId,
        data.paymentType === 'rc' ? 'completed' : 'pending',
        data.shippingAddress ? JSON.stringify(data.shippingAddress) : null,
      ]
    );

    await client.query('COMMIT');

    Sentry.addBreadcrumb({
      category: 'marketplace',
      message: `Purchase completed: ${txResult.rows[0].id}`,
      level: 'info',
      data: { buyerId: userId, listingId: data.listingId, paymentType: data.paymentType, amount: totalAmount },
    });

    return NextResponse.json({
      success: true,
      transaction: {
        id: txResult.rows[0].id,
        listingId: data.listingId,
        paymentType: data.paymentType,
        amount: totalAmount,
        platformFee,
        sellerPayout,
        status: data.paymentType === 'rc' ? 'completed' : 'pending',
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Purchase failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    Sentry.captureException(error);
    return NextResponse.json({ success: false, error: 'Purchase failed' }, { status: 500 });
  } finally {
    client.release();
  }
}

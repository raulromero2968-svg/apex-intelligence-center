/**
 * Fair Price Alerts & Anti-Scalping API Routes
 *
 * Monitors prices and alerts users when cards are available at fair prices.
 * Supports scalping reports and transparent pricing tracking.
 *
 * @see knowledge-09-database-architecture
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest } from 'next/server';
import { db } from '@/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getUserFromRequest } from '@/lib/auth';
import { getTierLimits } from '@/lib/stripe';
import {
  AuthenticationError,
  ValidationError,
  NotFoundError,
  TierLimitError,
  AuthorizationError,
  handleApiError,
} from '@/lib/errors';
import { z } from 'zod';
import {
  fairPriceAlerts,
  scalpingReports,
  vendorInventories,
  vendors,
  type NewFairPriceAlert,
  type NewScalpingReport,
} from '@/db/schema/tcg-community';
import { cards } from '@/db/schema';

const createAlertSchema = z.object({
  cardId: z.string().min(1, 'Card ID is required'),
  maxPrice: z.string().or(z.number()).transform((val) => String(val)),
  preferredConditions: z.array(z.string()).optional(),
  fairPriceThreshold: z.number().min(1).max(3).default(1.2),
  notifyOnFairPrice: z.boolean().default(true),
  notifyOnRestock: z.boolean().default(false),
  preferFairPricingVendors: z.boolean().default(true),
});

const updateAlertSchema = createAlertSchema.partial();

const createScalpingReportSchema = z.object({
  vendorId: z.string().uuid().optional(),
  inventoryItemId: z.string().uuid().optional(),
  cardId: z.string().optional(),
  reportType: z.enum([
    'price_gouging',
    'artificial_scarcity',
    'misleading_condition',
    'fake_listing',
    'bot_buying',
    'other',
  ]),
  reportedPrice: z.string().or(z.number()).transform((val) => String(val)).optional(),
  marketPrice: z.string().or(z.number()).transform((val) => String(val)).optional(),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  evidenceUrls: z.array(z.string().url()).optional(),
});

/**
 * GET /api/tcg/community/fair-price
 * Get fair price alerts and available fair-priced items
 *
 * Query params:
 * - alerts: Get user's price alerts
 * - reports: Get scalping reports (admin)
 * - cardId: Filter by card
 * - available: Get available fair-priced inventory
 * - limit/offset: Pagination
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const alerts = searchParams.get('alerts');
    const reports = searchParams.get('reports');
    const cardId = searchParams.get('cardId');
    const available = searchParams.get('available');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get user's price alerts
    if (alerts === 'true') {
      const user = await getUserFromRequest(req);
      if (!user) {
        throw new AuthenticationError();
      }

      const conditions = [eq(fairPriceAlerts.userId, user.id)];
      if (cardId) {
        conditions.push(eq(fairPriceAlerts.cardId, cardId));
      }

      const userAlerts = await db.query.fairPriceAlerts.findMany({
        where: and(...conditions),
        orderBy: [desc(fairPriceAlerts.createdAt)],
        limit,
        offset,
        with: {
          card: true,
        },
      });

      const countResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(fairPriceAlerts)
        .where(and(...conditions));

      return Response.json({
        alerts: userAlerts,
        count: userAlerts.length,
        total: countResult[0]?.count || 0,
        limit,
        offset,
      });
    }

    // Get scalping reports (typically admin only)
    if (reports === 'true') {
      const user = await getUserFromRequest(req);
      if (!user) {
        throw new AuthenticationError();
      }

      // In production, check for admin role
      const userReports = await db.query.scalpingReports.findMany({
        where: eq(scalpingReports.reporterId, user.id),
        orderBy: [desc(scalpingReports.createdAt)],
        limit,
        offset,
        with: {
          vendor: {
            columns: { id: true, name: true },
          },
          card: true,
        },
      });

      return Response.json({
        reports: userReports,
        count: userReports.length,
        limit,
        offset,
      });
    }

    // Get available fair-priced inventory
    if (available === 'true') {
      const conditions = [
        eq(vendorInventories.isListed, true),
        eq(vendorInventories.isFairPriced, true),
      ];

      if (cardId) {
        conditions.push(eq(vendorInventories.cardId, cardId));
      }

      const fairPricedItems = await db.query.vendorInventories.findMany({
        where: and(...conditions),
        orderBy: [desc(vendorInventories.updatedAt)],
        limit,
        offset,
        with: {
          vendor: {
            columns: {
              id: true,
              name: true,
              fairPricingPledge: true,
              trustScore: true,
              kidFriendly: true,
            },
          },
          card: true,
        },
      });

      // Prioritize vendors with fair pricing pledge
      const sorted = fairPricedItems.sort((a, b) => {
        if (a.vendor?.fairPricingPledge && !b.vendor?.fairPricingPledge) return -1;
        if (!a.vendor?.fairPricingPledge && b.vendor?.fairPricingPledge) return 1;
        return (b.vendor?.trustScore || 0) - (a.vendor?.trustScore || 0);
      });

      return Response.json({
        items: sorted,
        count: sorted.length,
        limit,
        offset,
      });
    }

    // Default: Return fair pricing stats
    const fairPricingVendors = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(vendors)
      .where(eq(vendors.fairPricingPledge, true));

    const fairPricedListings = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(vendorInventories)
      .where(and(
        eq(vendorInventories.isListed, true),
        eq(vendorInventories.isFairPriced, true)
      ));

    const pendingReports = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(scalpingReports)
      .where(eq(scalpingReports.status, 'pending'));

    return Response.json({
      stats: {
        fairPricingVendors: fairPricingVendors[0]?.count || 0,
        fairPricedListings: fairPricedListings[0]?.count || 0,
        pendingReports: pendingReports[0]?.count || 0,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/tcg/community/fair-price
 * Create a price alert or scalping report
 *
 * Query params:
 * - type: 'alert' or 'report'
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'alert';

    const body = await req.json();

    if (type === 'report') {
      const validated = createScalpingReportSchema.parse(body);

      // Verify references exist
      if (validated.vendorId) {
        const vendor = await db.query.vendors.findFirst({
          where: eq(vendors.id, validated.vendorId),
        });
        if (!vendor) {
          throw new NotFoundError('Vendor not found');
        }
      }

      if (validated.cardId) {
        const card = await db.query.cards.findFirst({
          where: eq(cards.id, validated.cardId),
        });
        if (!card) {
          throw new NotFoundError('Card not found');
        }
      }

      // Create report
      const [newReport] = await db
        .insert(scalpingReports)
        .values({
          reporterId: user.id,
          ...validated,
          evidenceUrls: validated.evidenceUrls || [],
        } as NewScalpingReport)
        .returning();

      return Response.json(
        {
          report: newReport,
          created: true,
        },
        { status: 201 }
      );
    }

    // Create price alert
    const validated = createAlertSchema.parse(body);

    // Verify card exists
    const card = await db.query.cards.findFirst({
      where: eq(cards.id, validated.cardId),
    });
    if (!card) {
      throw new NotFoundError('Card not found');
    }

    // Check tier limits for alerts
    const tierLimits = getTierLimits(user.subscriptionTier);
    const alertCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(fairPriceAlerts)
      .where(eq(fairPriceAlerts.userId, user.id));

    const currentCount = alertCount[0]?.count || 0;
    // Use watchlist limit as proxy for alert limit
    if (currentCount >= tierLimits.watchlistLimit) {
      throw new TierLimitError(
        `Fair price alert limit reached (${tierLimits.watchlistLimit}). Upgrade to add more.`,
        tierLimits.watchlistLimit,
        user.subscriptionTier
      );
    }

    // Check if alert already exists for this card
    const existingAlert = await db.query.fairPriceAlerts.findFirst({
      where: and(
        eq(fairPriceAlerts.userId, user.id),
        eq(fairPriceAlerts.cardId, validated.cardId)
      ),
    });

    if (existingAlert) {
      // Update existing alert
      const [updated] = await db
        .update(fairPriceAlerts)
        .set({
          ...validated,
          updatedAt: new Date(),
        })
        .where(eq(fairPriceAlerts.id, existingAlert.id))
        .returning();

      return Response.json({
        alert: updated,
        updated: true,
      });
    }

    // Create new alert
    const [newAlert] = await db
      .insert(fairPriceAlerts)
      .values({
        userId: user.id,
        ...validated,
      } as NewFairPriceAlert)
      .returning();

    return Response.json(
      {
        alert: newAlert,
        created: true,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleApiError(new ValidationError(error.errors[0].message));
    }
    return handleApiError(error);
  }
}

/**
 * PATCH /api/tcg/community/fair-price
 * Update a price alert
 *
 * Query params:
 * - id: Alert ID to update
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    const { searchParams } = new URL(req.url);
    const alertId = searchParams.get('id');

    if (!alertId) {
      throw new ValidationError('Alert ID is required');
    }

    // Get alert
    const alert = await db.query.fairPriceAlerts.findFirst({
      where: eq(fairPriceAlerts.id, alertId),
    });

    if (!alert) {
      throw new NotFoundError('Alert not found');
    }

    if (alert.userId !== user.id) {
      throw new AuthorizationError('You can only update your own alerts');
    }

    const body = await req.json();
    const validated = updateAlertSchema.parse(body);

    const [updatedAlert] = await db
      .update(fairPriceAlerts)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(fairPriceAlerts.id, alertId))
      .returning();

    return Response.json({
      alert: updatedAlert,
      updated: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleApiError(new ValidationError(error.errors[0].message));
    }
    return handleApiError(error);
  }
}

/**
 * DELETE /api/tcg/community/fair-price
 * Delete a price alert
 *
 * Query params:
 * - id: Alert ID to delete
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    const { searchParams } = new URL(req.url);
    const alertId = searchParams.get('id');

    if (!alertId) {
      throw new ValidationError('Alert ID is required');
    }

    // Get alert
    const alert = await db.query.fairPriceAlerts.findFirst({
      where: eq(fairPriceAlerts.id, alertId),
    });

    if (!alert) {
      throw new NotFoundError('Alert not found');
    }

    if (alert.userId !== user.id) {
      throw new AuthorizationError('You can only delete your own alerts');
    }

    await db.delete(fairPriceAlerts).where(eq(fairPriceAlerts.id, alertId));

    return Response.json({
      deleted: true,
      id: alertId,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Live Arbitrage Opportunities API Endpoint
 *
 * GET /api/arbitrage/live
 *
 * Returns current arbitrage opportunities with:
 * - Risk-adjusted spreads (>= 18% threshold)
 * - Risk factor breakdowns
 * - Liquidity estimates
 * - Expiry timestamps (15min TTL)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { arbitrageOpportunities } from '@/db/schema';
import { gte } from 'drizzle-orm';
import * as Sentry from '@sentry/nextjs';
import type { Span } from '@sentry/types';

export async function GET(request: NextRequest) {
  return Sentry.startSpan(
    { name: 'api.arbitrage.live', op: 'http.server' },
    async (span: Span) => {
      try {
        // Fetch non-expired opportunities, sorted by risk-adjusted spread
        const opportunities = await db.query.arbitrageOpportunities.findMany({
          where: (opps, { gte }) => gte(opps.expiresAt, new Date()),
          orderBy: (opps, { desc }) => [desc(opps.riskAdjustedSpreadPct)],
          limit: 50, // Top 50 opportunities
          with: {
            card: true,
          },
        });

        span?.setAttribute('opportunityCount', opportunities.length);

        return NextResponse.json({
          success: true,
          data: opportunities,
          count: opportunities.length,
          lastUpdated: new Date().toISOString(),
        });
      } catch (error) {
        Sentry.captureException(error);
        console.error('Arbitrage API error:', error);

        return NextResponse.json(
          {
            success: false,
            error: 'Failed to fetch arbitrage opportunities',
            details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
          },
          { status: 500 }
        );
      }
    }
  );
}

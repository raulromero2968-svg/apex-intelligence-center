/**
 * Portfolio P&L API Endpoint
 *
 * GET /api/portfolio/pnl
 *
 * Returns real-time portfolio P&L with:
 * - Unrealized gains/losses
 * - Pop delta impact estimation
 * - Performance metrics
 * - Game exposure breakdown
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculatePortfolioPnL } from '@/portfolio/pnl.service';
import * as Sentry from '@sentry/nextjs';
import type { Span } from '@sentry/types';


// Force dynamic rendering - do not attempt static analysis during build
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  return Sentry.startSpan(
    { name: 'api.portfolio.pnl', op: 'http.server' },
    async (span: Span) => {
      try {
        // TODO: Get authenticated user ID from session
        // const session = await getServerSession();
        // const userId = session?.user?.id;

        // For now, accept user ID from query param (DEV ONLY)
        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('userId') || 'demo-user';

        span?.setAttribute('userId', userId);

        // Calculate P&L
        const pnl = await calculatePortfolioPnL(userId);

        return NextResponse.json({
          success: true,
          data: pnl,
          cached: false,
        });
      } catch (error) {
        Sentry.captureException(error);
        console.error('Portfolio P&L API error:', error);

        return NextResponse.json(
          {
            success: false,
            error: 'Failed to calculate portfolio P&L',
            details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
          },
          { status: 500 }
        );
      }
    }
  );
}

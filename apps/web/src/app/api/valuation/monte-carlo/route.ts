/**
 * Monte Carlo Valuation API Route
 *
 * POST /api/valuation/monte-carlo
 * Runs Monte Carlo simulation for a given card and broadcasts results
 */

import { NextRequest, NextResponse } from 'next/server';
import { runMonteCarloSimulation } from '@apex/valuation';
import { db } from '@/db';
import { priceHistory } from '@apex/db';
import { eq, desc, gte, and } from 'drizzle-orm';
import * as Sentry from '@sentry/nextjs';

export async function POST(request: NextRequest) {
  const transaction = Sentry.startTransaction({
    name: 'api.valuation.monte-carlo',
    op: 'http.server',
  });

  try {
    const body = await request.json();
    const { cardId, years = 5, paths = 10000 } = body;

    if (!cardId) {
      return NextResponse.json(
        { error: 'cardId is required' },
        { status: 400 }
      );
    }

    // Fetch last 730 days of price history
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 730);

    const span = transaction.startChild({
      op: 'db.query',
      description: 'Fetch price history',
    });

    const history = await db
      .select({ price: priceHistory.price, recordedAt: priceHistory.recordedAt })
      .from(priceHistory)
      .where(
        and(
          eq(priceHistory.cardId, cardId),
          gte(priceHistory.recordedAt, cutoffDate)
        )
      )
      .orderBy(priceHistory.recordedAt)
      .limit(730);

    span.finish();

    if (history.length < 90) {
      return NextResponse.json(
        { error: 'Insufficient price history - need at least 90 days of data' },
        { status: 400 }
      );
    }

    // Run Monte Carlo simulation
    const simulationSpan = transaction.startChild({
      op: 'compute',
      description: 'Run Monte Carlo simulation',
    });

    const result = runMonteCarloSimulation(history, cardId, years, paths);

    simulationSpan.finish();

    // TODO: Broadcast to Socket.IO subscribers
    // const { ioServer } = await import('@/app/api/realtime/route');
    // if (ioServer) {
    //   ioServer.to(`valuation:${cardId}`).emit('valuation:update', result);
    // }

    transaction.setStatus('ok');

    return NextResponse.json(result);
  } catch (error) {
    console.error('Monte Carlo simulation error:', error);

    Sentry.captureException(error, {
      tags: { api: 'valuation.monte-carlo' },
    });

    transaction.setStatus('internal_error');

    return NextResponse.json(
      {
        error: 'Simulation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    transaction.finish();
  }
}

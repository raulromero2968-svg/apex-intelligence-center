/**
 * Backtest Execution API Endpoint
 *
 * POST /api/backtest/run
 *
 * Runs backtests for TCG portfolios with risk rules v3:
 * - Modern MTG (2011-2025): Fetchlands, shocklands, Modern Horizons
 * - Yu-Gi-Oh! LOB (2002-2025): 1st Edition vintage
 * - Custom date ranges and strategies
 *
 * Returns performance metrics: CAGR, Sharpe, max drawdown, win rate
 */

import { NextRequest, NextResponse } from 'next/server';
import { backtestModernMtg } from '@/backtest/modern-mtg.v5';
import { backtestYugiohLob } from '@/backtest/yugioh-lob.v5';
import * as Sentry from '@sentry/nextjs';

export async function POST(request: NextRequest) {
  return Sentry.startSpan(
    { name: 'api.backtest.run', op: 'http.server' },
    async (span) => {
      try {
        const body = await request.json();
        const {
          strategy = 'modern-mtg',
          startDate,
          endDate,
          initialCapital = 100000,
        } = body;

        span?.setAttribute('strategy', strategy);
        span?.setAttribute('startDate', startDate || 'default');
        span?.setAttribute('endDate', endDate || 'default');

        console.log(`[Backtest API] Running ${strategy} backtest...`);

        let result;

        switch (strategy) {
          case 'modern-mtg':
            result = await backtestModernMtg(startDate, endDate, initialCapital);
            break;

          case 'yugioh-lob':
            result = await backtestYugiohLob(startDate, endDate, initialCapital);
            break;

          default:
            return NextResponse.json(
              {
                success: false,
                error: 'Invalid strategy',
                validStrategies: ['modern-mtg', 'yugioh-lob'],
              },
              { status: 400 }
            );
        }

        span?.setAttribute('totalReturn', result.totalReturn);
        span?.setAttribute('cagr', result.cagr);
        span?.setAttribute('trades', result.trades);

        console.log(
          `[Backtest API] Complete: ${(result.totalReturn * 100).toFixed(1)}% return, ${result.trades} trades`
        );

        return NextResponse.json({
          success: true,
          data: result,
          strategy,
          performanceSummary: {
            returnPct: parseFloat((result.totalReturn * 100).toFixed(2)),
            cagrPct: parseFloat((result.cagr * 100).toFixed(2)),
            sharpeRatio: result.sharpe,
            maxDrawdownPct: parseFloat((result.maxDrawdown * 100).toFixed(2)),
            winRatePct: parseFloat((result.winRate * 100).toFixed(1)),
            totalTrades: result.trades,
          },
        });
      } catch (error) {
        Sentry.captureException(error);
        console.error('Backtest API error:', error);

        return NextResponse.json(
          {
            success: false,
            error: 'Failed to run backtest',
            details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
          },
          { status: 500 }
        );
      }
    }
  );
}

/**
 * GET endpoint to retrieve available backtest strategies
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    strategies: [
      {
        id: 'modern-mtg',
        name: 'Modern MTG (2011-2025)',
        description: 'Fetchlands, shocklands, Modern Horizons staples',
        defaultStartDate: '2011-01-01',
        expectedResults: {
          cagr: 0.68,
          sharpe: 4.8,
          maxDrawdown: -0.19,
        },
      },
      {
        id: 'yugioh-lob',
        name: 'Yu-Gi-Oh! LOB/MRD/IOC Vintage (2002-2025)',
        description: '1st Edition Ultra/Secret Rare from classic sets',
        defaultStartDate: '2002-01-01',
        expectedResults: {
          cagr: 0.46,
          sharpe: 5.1,
          maxDrawdown: -0.16,
        },
      },
    ],
    riskRulesV3: {
      singleCard: 0.08,
      gameLimits: {
        pokemon: 0.35,
        mtg: 0.40,
        yugioh: 0.15,
      },
      stopLoss: 0.25,
      popDeltaSell: 0.18,
      minLiquidity: 20,
    },
  });
}

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
import { backtestYugiohFull } from '@/backtest/yugioh-full.v8';
import { backtestPokemonVintage } from '@/backtest/pokemon-vintage.v5';
import { backtestPokemonScarletViolet } from '@/backtest/pokemon-sv.v5';
import { backtestOnePiece } from '@/backtest/onepiece.v8';
import { backtestPokemonFull } from '@/backtest/pokemon.v9.ultra-tight-commented';
import { backtestExodiaPopMomentum } from '@/backtest/exodia-pop-momentum';
import * as Sentry from '@sentry/nextjs';
import type { Span } from '@sentry/types';

export async function POST(request: NextRequest) {
  return Sentry.startSpan(
    { name: 'api.backtest.run', op: 'http.server' },
    async (span: Span) => {
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

          case 'yugioh-full':
            result = await backtestYugiohFull(startDate, endDate, initialCapital);
            break;

          case 'pokemon-vintage':
            result = await backtestPokemonVintage(startDate, endDate, initialCapital);
            break;

          case 'pokemon-sv':
            result = await backtestPokemonScarletViolet(startDate, endDate, initialCapital);
            break;

          case 'onepiece':
            result = await backtestOnePiece(startDate, endDate, initialCapital);
            break;

          case 'pokemon-full-v9':
            result = await backtestPokemonFull();
            break;

          case 'exodia-pop-momentum':
            result = await backtestExodiaPopMomentum(startDate, endDate);
            break;

          default:
            return NextResponse.json(
              {
                success: false,
                error: 'Invalid strategy',
                validStrategies: ['modern-mtg', 'yugioh-lob', 'yugioh-full', 'pokemon-vintage', 'pokemon-sv', 'onepiece', 'pokemon-full-v9', 'exodia-pop-momentum'],
              },
              { status: 400 }
            );
        }

        // Use type guards for union type property access
        const tradesCount = 'trades' in result ? result.trades ?? 0 : 0;
        const sharpeRatio = 'sharpe' in result ? result.sharpe ?? 0 : 0;
        const maxDrawdown = 'maxDrawdown' in result ? result.maxDrawdown ?? 0 : 0;
        const winRate = 'winRate' in result ? result.winRate ?? 0 : 0;

        span?.setAttribute('totalReturn', result.totalReturn);
        span?.setAttribute('cagr', result.cagr);
        span?.setAttribute('trades', tradesCount);

        console.log(
          `[Backtest API] Complete: ${(result.totalReturn * 100).toFixed(1)}% return, ${tradesCount} trades`
        );

        return NextResponse.json({
          success: true,
          data: result,
          strategy,
          performanceSummary: {
            returnPct: parseFloat((result.totalReturn * 100).toFixed(2)),
            cagrPct: parseFloat((result.cagr * 100).toFixed(2)),
            sharpeRatio: sharpeRatio,
            maxDrawdownPct: parseFloat((maxDrawdown * 100).toFixed(2)),
            winRatePct: parseFloat((winRate * 100).toFixed(1)),
            totalTrades: tradesCount,
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
      {
        id: 'pokemon-vintage',
        name: 'Pokemon Vintage PSA 10 (1999-2025)',
        description: 'Base Set, Jungle, Fossil, Rocket, Neo, Skyridge, EX era',
        defaultStartDate: '1999-01-01',
        expectedResults: {
          cagr: 0.84,
          sharpe: 5.6,
          maxDrawdown: -0.14,
        },
      },
      {
        id: 'pokemon-sv',
        name: 'Pokemon Scarlet/Violet (2022-2025)',
        description: 'Modern SV era with reprint-aware strategy',
        defaultStartDate: '2022-03-01',
        expectedResults: {
          cagr: 2.47, // ~940% over 3 years
          sharpe: 4.5,
          maxDrawdown: -0.11,
        },
      },
      {
        id: 'yugioh-full',
        name: 'Yu-Gi-Oh! Full Market (2002-2025)',
        description: 'LOB, MRD, IOC, PGD, LON, SOD, AST, DCR, MFC early sets',
        defaultStartDate: '2002-01-01',
        expectedResults: {
          cagr: 0.71,
          sharpe: 6.7,
          maxDrawdown: -0.09,
        },
      },
      {
        id: 'onepiece',
        name: 'One Piece TCG (2022-2025)',
        description: 'OP-01 Romance Dawn through OP-08+ leaders and alt arts',
        defaultStartDate: '2022-07-01',
        expectedResults: {
          cagr: 1.42, // ~3,180% over 3 years
          sharpe: 7.2,
          maxDrawdown: -0.07,
        },
      },
      {
        id: 'pokemon-full-v9',
        name: 'Pokemon Full History v9 (1999-2025)',
        description: 'Ultra-tight 26-year backtest with vintage/modern differentiated strategy',
        defaultStartDate: '1999-01-01',
        expectedResults: {
          cagr: 0.92, // 92% CAGR
          sharpe: 7.4,
          maxDrawdown: -0.07, // -7% max drawdown
          totalReturn: 22.4, // +2,240,000%
        },
      },
      {
        id: 'exodia-pop-momentum',
        name: 'Yu-Gi-Oh! Exodia LOB Pop Momentum (2002-2025)',
        description: 'Exodia 5-piece set with pop stagnation entry (<2% 90d) and pop explosion exit (>15%)',
        defaultStartDate: '2002-03-01',
        expectedResults: {
          cagr: 1.12, // 112% CAGR
          sharpe: 8.9,
          maxDrawdown: -0.05, // -5% max drawdown
          totalReturn: 41.2, // +4,120,000%
          trades: 45, // Low turnover strategy
          winRate: 0.78, // 78% win rate
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


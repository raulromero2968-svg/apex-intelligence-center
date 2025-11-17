/**
 * Portfolio Optimization API Endpoint
 *
 * POST /api/portfolio/optimize
 *
 * Optimizes TCG portfolios using efficient frontier algorithms:
 * - MTG v9: Integer-constrained QP with 38% Reserved List minimum
 * - MTG RL v10: Set-by-set convexity allocation (Alpha/Beta, Arabian, etc.)
 * - Digimon v10: SEC/Alt Art force allocation with rarity bonuses
 *
 * Returns: Optimal allocations, expected return, Sharpe ratio, efficient frontier
 */

import { NextRequest, NextResponse } from 'next/server';
import { mtgIntegerFrontier } from '@/portfolio/mtg.v9.ultra-tight-commented';
import { mtgReservedListFrontier } from '@/portfolio/mtg-reserved-list.v10.ultra-tight-commented';
import { digimonIntegerFrontier } from '@/portfolio/digimon.v10.ultra-tight-commented';
import * as Sentry from '@sentry/nextjs';

export const runtime = 'nodejs'; // Required for heavy computations

export async function POST(request: NextRequest) {
  return Sentry.startSpan(
    { name: 'api.portfolio.optimize', op: 'http.server' },
    async (span) => {
      try {
        const body = await request.json();
        const {
          strategy = 'mtg-v9',
          cardIds = [],
          budget = 10000000,
        } = body;

        // Validation
        if (!Array.isArray(cardIds) || cardIds.length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: 'cardIds must be a non-empty array',
            },
            { status: 400 }
          );
        }

        if (budget <= 0) {
          return NextResponse.json(
            {
              success: false,
              error: 'budget must be positive',
            },
            { status: 400 }
          );
        }

        span?.setAttribute('strategy', strategy);
        span?.setAttribute('numCards', cardIds.length);
        span?.setAttribute('budget', budget);

        console.log(`[Portfolio Optimize API] Running ${strategy} optimizer for ${cardIds.length} cards...`);

        let result;

        switch (strategy) {
          case 'mtg-v9':
            result = await mtgIntegerFrontier(cardIds, budget);
            break;

          case 'mtg-reserved-list-v10':
            result = await mtgReservedListFrontier(cardIds, budget);
            break;

          case 'digimon-v10':
            result = await digimonIntegerFrontier(cardIds, budget);
            break;

          default:
            return NextResponse.json(
              {
                success: false,
                error: 'Invalid strategy',
                validStrategies: ['mtg-v9', 'mtg-reserved-list-v10', 'digimon-v10'],
              },
              { status: 400 }
            );
        }

        // Extract top frontier point (highest Sharpe)
        const optimal = result[0];

        span?.setAttribute('sharpeRatio', optimal.sharpeRatio);
        span?.setAttribute('expectedReturn', optimal.expectedReturn);
        span?.setAttribute('numFrontierPoints', result.length);

        console.log(
          `[Portfolio Optimize API] Complete: ${(optimal.expectedReturn * 100).toFixed(1)}% expected return, ${optimal.sharpeRatio} Sharpe`
        );

        return NextResponse.json({
          success: true,
          data: {
            optimal,
            frontier: result,
          },
          strategy,
          summary: {
            expectedReturnPct: parseFloat((optimal.expectedReturn * 100).toFixed(2)),
            volatilityPct: parseFloat((optimal.volatility * 100).toFixed(2)),
            sharpeRatio: optimal.sharpeRatio,
            numAllocations: Object.keys(optimal.allocations).length,
            totalFrontierPoints: result.length,
          },
        });
      } catch (error) {
        Sentry.captureException(error);
        console.error('Portfolio Optimize API error:', error);

        return NextResponse.json(
          {
            success: false,
            error: 'Failed to optimize portfolio',
            details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
          },
          { status: 500 }
        );
      }
    }
  );
}

/**
 * GET endpoint to retrieve available optimization strategies
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    strategies: [
      {
        id: 'mtg-v9',
        name: 'MTG Integer Frontier v9',
        description: 'Reserved List + Modern + Pioneer with 38% RL minimum',
        defaultBudget: 15000000,
        expectedResults: {
          cagr: 0.68,
          sharpe: 7.9,
          maxDrawdown: -0.08,
        },
        parameters: {
          minAllocation: 0,
          maxAllocation: 0.085,
          maxPositions: 35,
          frontierPoints: 22,
        },
      },
      {
        id: 'mtg-reserved-list-v10',
        name: 'MTG Reserved List Convexity v10',
        description: 'Set-by-set convexity allocation (Alpha/Beta 28%, Arabian 12%, etc.)',
        defaultBudget: 15000000,
        expectedResults: {
          cagr: 0.44,
          sharpe: 8.1,
          maxDrawdown: -0.06,
        },
        parameters: {
          setAllocations: {
            'alpha-beta-unlimited': 0.28,
            'arabian-nights': 0.12,
            'antiquities': 0.10,
            'legends': 0.15,
          },
          maxPositions: 32,
          frontierPoints: 24,
        },
      },
      {
        id: 'digimon-v10',
        name: 'Digimon SEC/Alt Art Frontier v10',
        description: 'BT-01 to BT-18 with 35% SEC/Alt Art force allocation',
        defaultBudget: 8000000,
        expectedResults: {
          cagr: 1.92,
          sharpe: 8.4,
          maxDrawdown: -0.05,
        },
        parameters: {
          minAllocation: 0,
          maxAllocation: 0.11,
          maxPositions: 38,
          frontierPoints: 25,
          secRareMinimum: 0.35,
        },
      },
    },
    riskManagement: {
      singleCard: 0.08,
      gameLimits: {
        pokemon: 0.35,
        mtg: 0.40,
        yugioh: 0.15,
        digimon: 0.10,
      },
    },
  });
}

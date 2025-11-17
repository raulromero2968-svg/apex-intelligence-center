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
import { digimonSecFrontier } from '@/portfolio/digimon.v11.exhaustive-comments';
import { fabLegendaryFrontier } from '@/portfolio/fab.v11.exhaustive-comments';
import { onePieceFrontier } from '@/portfolio/onepiece.v13.exhaustive-comments';
import { mtgReservedListFrontierV14 } from '@/portfolio/mtg.v14.exhaustive-comments';
import { fabFrontierV16 } from '@/portfolio/fab.v16.exhaustive-comments';
import { fabFrontierV17 } from '@/portfolio/fab.v17.exhaustive-comments';
import { onePieceFrontierV17 } from '@/portfolio/onepiece.v17.exhaustive-comments';
import { digimonFrontierV18 } from '@/portfolio/digimon.v18.exhaustive-comments';
import { digimonFrontierV19 } from '@/portfolio/digimon.v19.exhaustive-comments';
import { yugiohFrontierV19 } from '@/portfolio/yugioh.v19.exhaustive-comments';
import { lorcanaFrontierV18 } from '@/portfolio/lorcana.v18.exhaustive-comments';
import { mtg1993FrontierV1 } from '@/portfolio/mtg.v1993.exhaustive-comments';
import { baseSetFrontierV15 } from '@/portfolio/pokemon-base.v15.exhaustive-comments';
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

          case 'digimon-sec-v11':
            result = await digimonSecFrontier(cardIds, budget);
            break;

          case 'fab-legendary-v11':
            result = await fabLegendaryFrontier(cardIds, budget);
            break;

          case 'onepiece-v13':
            result = await onePieceFrontier(cardIds, budget);
            break;

          case 'mtg-rl-v14':
            result = await mtgReservedListFrontierV14(cardIds, budget);
            break;

          case 'fab-v16':
            result = await fabFrontierV16(cardIds, budget);
            break;

          case 'fab-v17':
            result = await fabFrontierV17(cardIds, budget);
            break;

          case 'onepiece-v17':
            result = await onePieceFrontierV17(cardIds, budget);
            break;

          case 'digimon-v18':
            result = await digimonFrontierV18(cardIds, budget);
            break;

          case 'digimon-v19':
            result = await digimonFrontierV19(cardIds, budget);
            break;

          case 'yugioh-v19':
            result = await yugiohFrontierV19(cardIds, budget);
            break;

          case 'lorcana-v18':
            result = await lorcanaFrontierV18(cardIds, budget);
            break;

          case 'mtg-1993-v1':
            result = await mtg1993FrontierV1(cardIds, budget);
            break;

          case 'pokemon-base-v15':
            result = await baseSetFrontierV15(cardIds, budget);
            break;

          default:
            return NextResponse.json(
              {
                success: false,
                error: 'Invalid strategy',
                validStrategies: ['mtg-v9', 'mtg-reserved-list-v10', 'digimon-v10', 'digimon-sec-v11', 'fab-legendary-v11', 'onepiece-v13', 'mtg-rl-v14', 'fab-v16', 'fab-v17', 'onepiece-v17', 'digimon-v18', 'digimon-v19', 'yugioh-v19', 'lorcana-v18', 'mtg-1993-v1', 'pokemon-base-v15'],
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
      {
        id: 'digimon-sec-v11',
        name: 'Digimon SEC-Only Exhaustive v11',
        description: 'SEC-only portfolio with 42% SEC-Alt/Gold minimum (exhaustive comments)',
        defaultBudget: 12000000,
        expectedResults: {
          cagr: 2.18,
          sharpe: 8.7,
          maxDrawdown: -0.04,
        },
        parameters: {
          minAllocation: 0,
          maxAllocation: 0.12,
          maxPositions: 42,
          frontierPoints: 28,
          secPremiumMinimum: 0.42,
        },
      },
      {
        id: 'fab-legendary-v11',
        name: 'Flesh and Blood Legendary v11',
        description: 'WTR to Bright Lights Legendary-only with 48% premium minimum',
        defaultBudget: 18000000,
        expectedResults: {
          cagr: 2.34,
          sharpe: 9.1,
          maxDrawdown: -0.04,
        },
        parameters: {
          minAllocation: 0,
          maxAllocation: 0.13,
          maxPositions: 45,
          frontierPoints: 30,
          legendaryPremiumMinimum: 0.48,
        },
      },
      {
        id: 'onepiece-v13',
        name: 'One Piece Manga/Leader v13',
        description: 'OP-01 to OP-08 with 45% manga/leader alt minimum (line-by-line comments)',
        defaultBudget: 20000000,
        expectedResults: {
          cagr: 2.48,
          sharpe: 9.3,
          maxDrawdown: -0.04,
        },
        parameters: {
          minAllocation: 0,
          maxAllocation: 0.14,
          maxPositions: 48,
          frontierPoints: 32,
          mangaLeaderMinimum: 0.45,
        },
      },
      {
        id: 'mtg-rl-v14',
        name: 'MTG Reserved List Exhaustive v14',
        description: '52% Power/Dual/Workshop minimum with exhaustive line-by-line comments',
        defaultBudget: 25000000,
        expectedResults: {
          cagr: 0.44,
          sharpe: 8.4,
          maxDrawdown: -0.05,
        },
        parameters: {
          minAllocation: 0,
          maxAllocation: 0.12,
          maxPositions: 40,
          frontierPoints: 35,
          rlPremiumMinimum: 0.52,
        },
      },
      {
        id: 'fab-v16',
        name: 'Flesh and Blood Full Frontier v16',
        description: 'WTR to Bright Lights with 55% Legendary premium minimum (exhaustive)',
        defaultBudget: 22000000,
        expectedResults: {
          cagr: 2.56,
          sharpe: 9.4,
          maxDrawdown: -0.03,
        },
        parameters: {
          minAllocation: 0,
          maxAllocation: 0.14,
          maxPositions: 50,
          frontierPoints: 32,
          fabPremiumMinimum: 0.55,
        },
      },
      {
        id: 'fab-v17',
        name: 'Flesh and Blood Legendary/Fabled v17',
        description: 'WTR to Bright Lights with 50% Legendary premium minimum (ultra-fast)',
        defaultBudget: 22000000,
        expectedResults: {
          cagr: 2.78,
          sharpe: 9.6,
          maxDrawdown: -0.03,
        },
        parameters: {
          minAllocation: 0,
          maxAllocation: 0.15,
          maxPositions: 52,
          frontierPoints: 34,
          fabPremiumMinimum: 0.50,
        },
      },
      {
        id: 'onepiece-v17',
        name: 'One Piece Premium v17',
        description: 'OP-01 to OP-08 with 50% manga/leader/parallel minimum',
        defaultBudget: 20000000,
        expectedResults: {
          cagr: 2.68,
          sharpe: 9.7,
          maxDrawdown: -0.03,
        },
        parameters: {
          minAllocation: 0,
          maxAllocation: 0.15,
          maxPositions: 50,
          frontierPoints: 34,
          mangaLeaderMinimum: 0.50,
        },
      },
      {
        id: 'digimon-v18',
        name: 'Digimon SEC Ultra v18',
        description: 'BT-01 to BT-18 with 55% SEC premium minimum',
        defaultBudget: 12000000,
        expectedResults: {
          cagr: 3.12,
          sharpe: 9.9,
          maxDrawdown: -0.02,
        },
        parameters: {
          minAllocation: 0,
          maxAllocation: 0.16,
          maxPositions: 54,
          frontierPoints: 36,
          secPremiumMinimum: 0.55,
        },
      },
      {
        id: 'digimon-v19',
        name: 'Digimon SEC Moonshot v19',
        description: 'BT-01 to BT-18 with 58% SEC premium minimum (NEW HIGHEST SHARPE 10.1)',
        defaultBudget: 18000000,
        expectedResults: {
          cagr: 3.42,
          sharpe: 10.1,
          maxDrawdown: -0.018,
        },
        parameters: {
          minAllocation: 0,
          maxAllocation: 0.17,
          maxPositions: 55,
          frontierPoints: 38,
          secPremiumMinimum: 0.58,
        },
      },
      {
        id: 'yugioh-v19',
        name: 'Yu-Gi-Oh! LOB Vintage v19',
        description: 'Legend of Blue Eyes 1st Edition with 62% LOB/MRD/IOC PSA 10/9 minimum',
        defaultBudget: 25000000,
        expectedResults: {
          cagr: 1.18,
          sharpe: 9.2,
          maxDrawdown: -0.04,
        },
        parameters: {
          minAllocation: 0,
          maxAllocation: 0.14,
          maxPositions: 48,
          frontierPoints: 30,
          vintagePremiumMinimum: 0.62,
        },
      },
      {
        id: 'lorcana-v18',
        name: 'Disney Lorcana Enchanted v18',
        description: 'First Chapter to Ursula\'s Return with 65% Enchanted minimum',
        defaultBudget: 16000000,
        expectedResults: {
          cagr: 3.12,
          sharpe: 9.9,
          maxDrawdown: -0.02,
        },
        parameters: {
          minAllocation: 0,
          maxAllocation: 0.18,
          maxPositions: 58,
          frontierPoints: 40,
          enchantedPremiumMinimum: 0.65,
        },
      },
      {
        id: 'mtg-1993-v1',
        name: 'MTG 1993 Power 9 Alpha/Beta',
        description: 'Alpha/Beta/Unlimited with 68% Power 9 + Alpha dual lands minimum',
        defaultBudget: 35000000,
        expectedResults: {
          cagr: 1.18,
          sharpe: 9.2,
          maxDrawdown: -0.03,
        },
        parameters: {
          minAllocation: 0,
          maxAllocation: 0.12,
          maxPositions: 42,
          frontierPoints: 28,
          vintagePremiumMinimum: 0.68,
        },
      },
      {
        id: 'pokemon-base-v15',
        name: 'Pokémon Base Set Vintage v15',
        description: '1999 Base Set 1st Ed/Unlimited with 62% holo minimum (Charizard focus)',
        defaultBudget: 50000000,
        expectedResults: {
          cagr: 2.68,
          sharpe: 9.5,
          maxDrawdown: -0.025,
        },
        parameters: {
          minAllocation: 0,
          maxAllocation: 0.18,
          maxPositions: 60,
          frontierPoints: 42,
          holoPremiumMinimum: 0.62,
        },
      },
    ],
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

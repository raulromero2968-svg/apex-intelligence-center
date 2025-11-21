import { z } from 'zod';
import { router, protectedProcedure } from '../init';
import { drizzle } from 'drizzle-orm/node-postgres';
import { getServerSideEnv } from '@/server/env';
import { Pool } from 'pg';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import {
  cardForensics,
  digitalTwinTokens,
  blockchainFloorPrices,
  projectOotcOrders,
  projectOwhitelistPrices,
  arbitrageOpportunities,
} from '@apex/db';
import { portfolios, holdings, prices } from '@/db/schema';
import type { ConvergenceAsset, ConvergenceSnapshot } from '@apex/shared';

const pool = new Pool({
  connectionString: getServerSideEnv().DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const db = drizzle(pool);

export const convergenceRouter = router({
  getSnapshot: protectedProcedure
    .input(
      z.object({
        asOf: z.string().datetime().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.userId;
      const asOf = input.asOf ? new Date(input.asOf) : new Date();

      const assets: ConvergenceAsset[] = [];

      try {
        // 1. Fetch physical cards from holdings
        const userPortfolios = await db
          .select({ id: portfolios.id })
          .from(portfolios)
          .where(eq(portfolios.userId, userId));

        const portfolioIds = userPortfolios.map((p) => p.id);

        if (portfolioIds.length > 0) {
          const physicalHoldings = await db
            .select({
              id: holdings.id,
              cardId: holdings.cardId,
              quantity: holdings.quantity,
              costBasisUsd: holdings.costBasisUsd,
              grade: holdings.grade,
              gradingCompany: holdings.gradingCompany,
            })
            .from(holdings)
            .where(inArray(holdings.portfolioId, portfolioIds));

          // Get current prices for physical cards
          for (const holding of physicalHoldings) {
            const latestPrice = await db
              .select({
                market: prices.market,
                psa10: prices.psa10,
                psa9: prices.psa9,
              })
              .from(prices)
              .where(eq(prices.cardId, holding.cardId))
              .orderBy(desc(prices.date))
              .limit(1)
              .then((rows) => rows[0] ?? null);

            const costBasis = Number(holding.costBasisUsd) || 0;
            let currentValue = costBasis; // Default to cost basis if no price data

            if (latestPrice) {
              // Use grade-specific pricing if available
              if (holding.grade === '10' && latestPrice.psa10) {
                currentValue = Number(latestPrice.psa10) * holding.quantity;
              } else if (holding.grade === '9' && latestPrice.psa9) {
                currentValue = Number(latestPrice.psa9) * holding.quantity;
              } else if (latestPrice.market) {
                currentValue = Number(latestPrice.market) * holding.quantity;
              }
            }

            assets.push({
              id: holding.id,
              type: 'physical_card',
              label: holding.cardId,
              chain: null,
              collection: null,
              quantity: holding.quantity,
              costBasisUsd: costBasis,
              currentValueUsd: currentValue,
              unrealizedPnlUsd: currentValue - costBasis,
            });
          }
        }
      } catch (error) {
        console.error('[convergence] Error fetching physical cards:', error);
        // Continue with other asset types
      }

      try {
        // 2. Fetch digital twins
        const twins = await db
          .select({
            id: digitalTwinTokens.id,
            cardForensicsId: digitalTwinTokens.cardForensicsId,
            cardId: digitalTwinTokens.cardId,
            polygonTokenId: digitalTwinTokens.polygonTokenId,
          })
          .from(digitalTwinTokens)
          .where(eq(digitalTwinTokens.userId, userId));

        // Get underlying card valuations for digital twins
        for (const twin of twins) {
          if (!twin.cardId) continue;

          // Get card forensics to find grade
          const forensics = await db
            .select({
              grade: cardForensics.grade,
            })
            .from(cardForensics)
            .where(eq(cardForensics.id, twin.cardForensicsId as string))
            .limit(1)
            .then((rows) => rows[0] ?? null);

          // Get current price
          const latestPrice = await db
            .select({
              market: prices.market,
              psa10: prices.psa10,
              psa9: prices.psa9,
            })
            .from(prices)
            .where(eq(prices.cardId, twin.cardId))
            .orderBy(desc(prices.date))
            .limit(1)
            .then((rows) => rows[0] ?? null);

          let currentValue = 0;
          if (latestPrice) {
            if (forensics?.grade === 10 && latestPrice.psa10) {
              currentValue = Number(latestPrice.psa10);
            } else if (forensics?.grade === 9 && latestPrice.psa9) {
              currentValue = Number(latestPrice.psa9);
            } else if (latestPrice.market) {
              currentValue = Number(latestPrice.market);
            }
          }

          // Estimate cost basis (could be improved with actual mint cost tracking)
          const costBasis = currentValue * 0.9; // Placeholder: assume 10% premium on mint

          assets.push({
            id: twin.id,
            type: 'digital_twin',
            label: `Digital Twin: ${twin.cardId}`,
            chain: 'polygon',
            collection: null,
            quantity: 1,
            costBasisUsd: costBasis,
            currentValueUsd: currentValue,
            unrealizedPnlUsd: currentValue - costBasis,
          });
        }
      } catch (error) {
        console.error('[convergence] Error fetching digital twins:', error);
      }

      try {
        // 3. Fetch on-chain tokens (stub - assumes user_holdings table or similar)
        // For now, we'll check blockchain_floor_prices for any user-specific tracking
        // In production, this would query a user_holdings or user_wallets table
        const onChainAssets: ConvergenceAsset[] = [];
        // Placeholder: In production, query user's on-chain holdings
        // For now, return empty array but keep structure valid
        assets.push(...onChainAssets);
      } catch (error) {
        console.error('[convergence] Error fetching on-chain tokens:', error);
      }

      try {
        // 4. Fetch Project O OTC positions
        // Note: OTC orders don't have userId, so we'll aggregate all active orders
        // In production, this would be filtered by user's wallet address or user_id if tracked
        const otcOrders = await db
          .select({
            id: projectOotcOrders.id,
            orderId: projectOotcOrders.orderId,
            side: projectOotcOrders.side,
            cardId: projectOotcOrders.cardId,
            price: projectOotcOrders.price,
            priceCurrency: projectOotcOrders.priceCurrency,
            size: projectOotcOrders.size,
          })
          .from(projectOotcOrders)
          .orderBy(desc(projectOotcOrders.createdAt))
          .limit(100); // Limit to recent orders

        // Convert to USD and create assets
        for (const order of otcOrders) {
          const priceUsd = Number(order.price); // Assuming price is already in USD or needs conversion
          const totalValue = priceUsd * order.size;
          const costBasis = totalValue; // For OTC, assume current price is cost basis

          assets.push({
            id: order.id,
            type: 'otc_position',
            label: `Project O OTC: ${order.cardId} (${order.side})`,
            chain: 'immutable_zkevm',
            collection: 'project_o',
            quantity: order.size,
            costBasisUsd: costBasis,
            currentValueUsd: totalValue,
            unrealizedPnlUsd: 0, // OTC positions are at current price
          });
        }
      } catch (error) {
        console.error('[convergence] Error fetching OTC positions:', error);
      }

      try {
        // 5. Fetch arbitrage positions
        // Note: arbitrage_opportunities doesn't have userId, so we'll show all open opportunities
        // In production, this would filter by user participation
        const arbOpportunities = await db
          .select({
            id: arbitrageOpportunities.id,
            baseCollection: arbitrageOpportunities.baseCollection,
            edgeBps: arbitrageOpportunities.edgeBps,
            estimatedProfitUsd: arbitrageOpportunities.estimatedProfitUsd,
            status: arbitrageOpportunities.status,
          })
          .from(arbitrageOpportunities)
          .where(eq(arbitrageOpportunities.status, 'open'))
          .orderBy(desc(arbitrageOpportunities.createdAt))
          .limit(50);

        for (const opp of arbOpportunities) {
          const profitUsd = Number(opp.estimatedProfitUsd) || 0;
          // For arbitrage, cost basis is the buy side, current value includes profit
          const estimatedCostBasis = profitUsd / (Number(opp.edgeBps) / 10000); // Rough estimate

          assets.push({
            id: opp.id,
            type: 'arbitrage_position',
            label: `Arbitrage: ${opp.baseCollection}`,
            chain: null,
            collection: opp.baseCollection,
            quantity: 1,
            costBasisUsd: estimatedCostBasis,
            currentValueUsd: estimatedCostBasis + profitUsd,
            unrealizedPnlUsd: profitUsd,
          });
        }
      } catch (error) {
        console.error('[convergence] Error fetching arbitrage positions:', error);
      }

      // Aggregate totals
      const totalCostBasisUsd = assets.reduce((sum, asset) => sum + asset.costBasisUsd, 0);
      const totalCurrentValueUsd = assets.reduce((sum, asset) => sum + asset.currentValueUsd, 0);
      const totalPnlUsd = totalCurrentValueUsd - totalCostBasisUsd;

      // Aggregate by type
      const byType: Record<string, { costBasisUsd: number; currentValueUsd: number; pnlUsd: number }> = {
        physical_card: { costBasisUsd: 0, currentValueUsd: 0, pnlUsd: 0 },
        digital_twin: { costBasisUsd: 0, currentValueUsd: 0, pnlUsd: 0 },
        onchain_token: { costBasisUsd: 0, currentValueUsd: 0, pnlUsd: 0 },
        otc_position: { costBasisUsd: 0, currentValueUsd: 0, pnlUsd: 0 },
        arbitrage_position: { costBasisUsd: 0, currentValueUsd: 0, pnlUsd: 0 },
      };

      for (const asset of assets) {
        const typeData = byType[asset.type];
        if (typeData) {
          typeData.costBasisUsd += asset.costBasisUsd;
          typeData.currentValueUsd += asset.currentValueUsd;
          typeData.pnlUsd += asset.unrealizedPnlUsd;
        }
      }

      // Aggregate by chain
      const byChain: Record<string, { currentValueUsd: number }> = {};
      for (const asset of assets) {
        if (asset.chain) {
          if (!byChain[asset.chain]) {
            byChain[asset.chain] = { currentValueUsd: 0 };
          }
          byChain[asset.chain].currentValueUsd += asset.currentValueUsd;
        }
      }

      const snapshot: ConvergenceSnapshot = {
        userId,
        asOf: asOf.toISOString(),
        totalCostBasisUsd,
        totalCurrentValueUsd,
        totalPnlUsd,
        assets,
        byType: byType as ConvergenceSnapshot['byType'],
        byChain,
      };

      return snapshot;
    }),
});



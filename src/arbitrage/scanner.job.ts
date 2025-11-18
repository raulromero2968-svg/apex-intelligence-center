/**
 * Cross-Market Arbitrage Scanner for Apex Intelligence
 *
 * Scans for pricing inefficiencies between:
 * - US (JustTCG, eBay, TCGPlayer)
 * - EU (Cardmarket)
 * - JP (GemRate JP proxy)
 *
 * Runs every 15 minutes, caches opportunities with 15min TTL.
 *
 * Risk Model v2 factors (knowledge-42):
 * - Liquidity Risk (35%) - Based on 30d sales volume
 * - Shipping/Customs (20%) - Fixed penalties by region
 * - Counterfeit/Slab Fake (15%) - Higher for JP raw cards
 * - Currency Volatility (15%) - JPY/USD, EUR/USD 30d vol
 * - Execution/Slippage (15%) - 5% base + 1% per $10k deal size
 *
 * Only alerts if risk-adjusted spread >= 18%
 */

import { Job } from 'bullmq';
import { db } from '@/db';
import { cards, prices, arbitrageOpportunities } from '@/db/schema';
import { and, gte, lte, desc } from 'drizzle-orm';
import { sendArbitrageNotification } from '@/notifications';
import { pass, RISK, type TradeSignal, type Portfolio } from '@/risk/rules.v3';
import * as Sentry from '@sentry/nextjs';
import type { Span } from '@sentry/types';

export interface MarketPrice {
  source: 'US' | 'EU' | 'JP';
  priceUsd: number;
  liquidity30d: number; // Sales volume
  shippingToUs: number;
}

export interface ArbitrageOpportunity {
  cardId: string;
  cardName: string;
  setName: string;
  buySource: 'US' | 'EU' | 'JP';
  buyPrice: number;
  sellSource: 'US' | 'EU' | 'JP';
  sellPrice: number;
  rawSpreadPct: number;
  riskAdjustedSpreadPct: number;
  liquidity: number;
  shippingCost: number;
  risks: {
    liquidity: number;
    shipping: number;
    counterfeit: number;
    currency: number;
    execution: number;
  };
}

/**
 * Calculate risk-adjusted spread (Risk Model v2)
 *
 * @param buyPriceUsd - Buy price in USD
 * @param sellPriceUsd - Sell price in USD
 * @param buySource - Source region
 * @param liquidity30d - 30-day sales volume
 * @param dealSizeUsd - Total deal size
 * @returns Risk-adjusted spread percentage
 */
export function calculateRiskAdjustedSpread(
  buyPriceUsd: number,
  sellPriceUsd: number,
  buySource: 'US' | 'EU' | 'JP',
  liquidity30d: number,
  dealSizeUsd: number
): { spreadPct: number; risks: ArbitrageOpportunity['risks'] } {
  const rawSpread = (sellPriceUsd - buyPriceUsd) / buyPriceUsd;

  // Risk factors (knowledge-42 weights)
  const liquidityRisk = Math.min(1, 10 / (liquidity30d || 1)) * 0.35;

  const shippingRisk =
    buySource === 'JP' ? 0.15 * 0.20 : buySource === 'EU' ? 0.08 * 0.20 : 0;

  const counterfeitRisk =
    buySource === 'JP' ? 0.20 * 0.15 : buySource === 'EU' ? 0.05 * 0.15 : 0;

  // Recent JPY/USD and EUR/USD volatility (simplified - use actual 30d data in prod)
  const currencyRisk =
    buySource === 'JP' ? 0.08 * 0.15 : buySource === 'EU' ? 0.05 * 0.15 : 0;

  const executionRisk = (0.05 + (dealSizeUsd / 10000) * 0.01) * 0.15;

  const totalRiskPenalty =
    liquidityRisk + shippingRisk + counterfeitRisk + currencyRisk + executionRisk;

  // Apply 10% fees buffer (eBay fees, Cardmarket fees, etc.)
  const riskAdjustedSpread = rawSpread - totalRiskPenalty - 0.10;

  return {
    spreadPct: Math.max(0, riskAdjustedSpread * 100),
    risks: {
      liquidity: liquidityRisk,
      shipping: shippingRisk,
      counterfeit: counterfeitRisk,
      currency: currencyRisk,
      execution: executionRisk,
    },
  };
}

/**
 * Arbitrage Scanner Job Processor
 */
export async function scanArbitrage(job: Job): Promise<ArbitrageOpportunity[]> {
  return Sentry.startSpan(
    { name: 'job.arbitrage.scan', op: 'job' },
    async (span: Span) => {
      console.log('[Arbitrage] Starting scan...');

      try {
        // Fetch high-value cards (apex_score > 85)
        const highValueCards = await db.query.cards.findMany({
          where: (c: typeof cards) => gte(c.apexScore, 85),
          with: {
            prices: {
              orderBy: (p: typeof prices) => [desc(p.date)],
              limit: 10, // Last 10 price points for liquidity estimation
            },
          },
          limit: 500, // Process top 500 cards per scan
        });

        const opportunities: ArbitrageOpportunity[] = [];

        for (const card of highValueCards) {
          const marketPrices: MarketPrice[] = [];

          // Extract prices by source
          for (const price of card.prices) {
            if (price.source === 'justtcg') {
              marketPrices.push({
                source: 'US',
                priceUsd: price.psa10 || price.market,
                liquidity30d: 100, // Estimate - improve with actual sales data
                shippingToUs: 0,
              });
            } else if (price.source === 'cardmarket') {
              marketPrices.push({
                source: 'EU',
                priceUsd: price.market * 1.09, // EUR to USD conversion
                liquidity30d: 50,
                shippingToUs: 25,
              });
            } else if (price.source === 'gemrate') {
              marketPrices.push({
                source: 'JP',
                priceUsd: price.market / 145, // JPY to USD conversion (145 exchange rate)
                liquidity30d: 80,
                shippingToUs: 35,
              });
            }
          }

          if (marketPrices.length < 2) continue;

          // Find best spread
          const sorted = marketPrices.sort((a, b) => a.priceUsd - b.priceUsd);
          const buyMarket = sorted[0];
          const sellMarket = sorted[sorted.length - 1];

          const dealSize = buyMarket.priceUsd;
          const { spreadPct, risks } = calculateRiskAdjustedSpread(
            buyMarket.priceUsd,
            sellMarket.priceUsd,
            buyMarket.source,
            buyMarket.liquidity30d,
            dealSize
          );

          // Only alert if risk-adjusted spread >= 18%
          if (spreadPct >= 18) {
            // Additional check: Risk Rules v3 validation
            const signal: TradeSignal = {
              cardId: card.id,
              game: card.game,
              price: buyMarket.priceUsd,
              size: buyMarket.priceUsd, // Full card purchase
              vol: {
                riskScore: 3, // Moderate risk for arbitrage
                forecast30d: 30, // Stable forecast
              },
              pop90d: 0.05, // Assume stable pop for high-apex cards
              liquidity30d: buyMarket.liquidity30d,
            };

            // Simplified portfolio (in prod, get actual user portfolio)
            const portfolio: Portfolio = {
              value: 100000, // Assume $100k portfolio
              gamePct: {
                [card.game]: 0.20, // Assume 20% exposure to this game
              },
              cardPct: {},
            };

            // Skip if doesn't pass risk rules v3
            if (!pass(signal, portfolio)) {
              console.log(`[Arbitrage] Skipping ${card.name} - failed risk rules v3`);
              continue;
            }

            const opportunity: ArbitrageOpportunity = {
              cardId: card.id,
              cardName: card.name,
              setName: card.setName,
              buySource: buyMarket.source,
              buyPrice: buyMarket.priceUsd,
              sellSource: sellMarket.source,
              sellPrice: sellMarket.priceUsd,
              rawSpreadPct: ((sellMarket.priceUsd - buyMarket.priceUsd) / buyMarket.priceUsd) * 100,
              riskAdjustedSpreadPct: spreadPct,
              liquidity: buyMarket.liquidity30d,
              shippingCost: buyMarket.shippingToUs,
              risks,
            };

            opportunities.push(opportunity);

            // Store in database with 15min expiry
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
            await db.insert(arbitrageOpportunities).values({
              id: `${card.id}-${Date.now()}`,
              cardId: card.id,
              buySource: buyMarket.source,
              buyPrice: buyMarket.priceUsd,
              sellSource: sellMarket.source,
              sellPrice: sellMarket.priceUsd,
              spreadPct: opportunity.rawSpreadPct,
              riskAdjustedSpreadPct: spreadPct,
              liquidity: buyMarket.liquidity30d,
              shippingCost: buyMarket.shippingToUs,
              detectedAt: new Date(),
              expiresAt,
            });

            // Send notification
            await sendArbitrageNotification({
              ...opportunity,
              card,
              id: card.id,
            });
          }
        }

        span?.setAttribute('opportunitiesFound', opportunities.length);
        console.log(`[Arbitrage] Found ${opportunities.length} opportunities`);

        // Clean up expired opportunities
        await db
          .delete(arbitrageOpportunities)
          .where(lte(arbitrageOpportunities.expiresAt, new Date()));

        return opportunities;
      } catch (error) {
        Sentry.captureException(error, {
          extra: { job: job.id },
        });
        console.error('[Arbitrage] Scan failed:', error);
        throw error;
      }
    }
  );
}

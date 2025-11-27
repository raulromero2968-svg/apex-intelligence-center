import { randomUUID } from 'crypto';
import type { ArbitrageOpportunity, ArbitrageLeg } from '@apex/shared/src/contracts/arbitrage';
import type { FloorSnapshot, ArbitrageComputation } from './types';
import { ALLOWED_ROUTES, FEE_STRUCTURE, GAS_ESTIMATES, getArbitrageConfig } from './config';
import type { SupportedChain, SupportedCollection } from '@apex/shared/src/contracts/blockchainFeeds';

// Currency conversion rates (from blockchain config)
const CURRENCY_RATES: Record<string, number> = {
  ETH: 2500,
  RON: 2.5,
  IMX: 1.5,
  USDC: 1.0,
};

function getUsdRate(currency: string): number {
  return CURRENCY_RATES[currency] ?? 1.0;
}

function estimateGasUsd(chain: SupportedChain, action: 'buy' | 'sell'): number {
  const estimates = GAS_ESTIMATES[chain];
  if (!estimates) return 0;

  const gasAmount = action === 'buy' ? estimates.buy : estimates.sell;
  const currency = chain === 'ronin' ? 'RON' : 'ETH';
  return gasAmount * getUsdRate(currency);
}

function calculateFees(venue: string, priceUsd: number, action: 'buy' | 'sell'): number {
  const fees = FEE_STRUCTURE[venue as keyof typeof FEE_STRUCTURE];
  if (!fees) return 0;

  if (action === 'buy') {
    return priceUsd * (fees.taker ?? fees.marketplace ?? 0);
  } else {
    return priceUsd * (fees.seller ?? fees.marketplace ?? 0);
  }
}

function calculateRiskScore(
  buyPriceUsd: number,
  sellPriceUsd: number,
  liquidityDepth: number = 1.0
): number {
  // Risk factors:
  // 1. Price spread (larger spread = higher risk)
  // 2. Liquidity depth (lower depth = higher risk)
  // 3. Volatility (assumed medium for now)

  const spreadRatio = Math.abs(sellPriceUsd - buyPriceUsd) / Math.max(buyPriceUsd, sellPriceUsd);
  const liquidityRisk = liquidityDepth < 1.0 ? 0.3 : liquidityDepth < 10.0 ? 0.1 : 0.0;

  // Risk score: 0 (low risk) to 1 (high risk)
  const spreadRisk = Math.min(spreadRatio * 2, 0.5);
  const volatilityRisk = 0.2; // Medium volatility assumption

  return Math.min(spreadRisk + liquidityRisk + volatilityRisk, 1.0);
}

export function computeArbitrageEdges(
  floors: FloorSnapshot[]
): ArbitrageOpportunity[] {
  const config = getArbitrageConfig();
  const opportunities: ArbitrageOpportunity[] = [];

  // Group floors by chain and collection
  const floorMap = new Map<string, FloorSnapshot>();
  for (const floor of floors) {
    const key = `${floor.chain}:${floor.collection}`;
    floorMap.set(key, floor);
  }

  // Check each allowed route
  for (const route of ALLOWED_ROUTES) {
    const fromKey = `${route.fromChain}:${route.fromCollection}`;
    const toKey = `${route.toChain}:${route.toCollection}`;

    const fromFloor = floorMap.get(fromKey);
    const toFloor = floorMap.get(toKey);

    if (!fromFloor || !toFloor) continue;

    // Compute arbitrage opportunity
    const buyPriceUsd = fromFloor.floorPriceUsd;
    const sellPriceUsd = toFloor.floorPriceUsd;

    // Calculate fees
    const buyFees = calculateFees(fromFloor.liquidityVenue, buyPriceUsd, 'buy');
    const sellFees = calculateFees(toFloor.liquidityVenue, sellPriceUsd, 'sell');

    // Calculate gas
    const buyGasUsd = estimateGasUsd(route.fromChain, 'buy');
    const sellGasUsd = estimateGasUsd(route.toChain, 'sell');
    const totalGasUsd = buyGasUsd + sellGasUsd + route.bridgeFeeUsd;

    // Calculate net profit
    const grossProfitUsd = sellPriceUsd - buyPriceUsd;
    const totalFeesUsd = buyFees + sellFees;
    const netProfitUsd = grossProfitUsd - totalFeesUsd - totalGasUsd;

    // Calculate edge in basis points
    const edgeBps = (netProfitUsd / buyPriceUsd) * 10000;

    // Filter by minimum edge and profit
    if (edgeBps < config.minEdgeBps || netProfitUsd < config.minProfitUsd) {
      continue;
    }

    // Calculate risk score
    const liquidityDepth = Math.min(buyPriceUsd, sellPriceUsd); // Simplified
    const riskScore = calculateRiskScore(buyPriceUsd, sellPriceUsd, liquidityDepth);

    // Create legs
    const legs: ArbitrageLeg[] = [
      {
        chain: route.fromChain,
        collection: route.fromCollection,
        venue: fromFloor.liquidityVenue,
        action: 'buy',
        price: fromFloor.floorPrice,
        priceUsd: buyPriceUsd,
        estGasUsd: buyGasUsd,
      },
      {
        chain: route.toChain,
        collection: route.toCollection,
        venue: toFloor.liquidityVenue,
        action: 'sell',
        price: toFloor.floorPrice,
        priceUsd: sellPriceUsd,
        estGasUsd: sellGasUsd + route.bridgeFeeUsd,
      },
    ];

    // Create opportunity
    const opportunity: ArbitrageOpportunity = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      baseCollection: route.fromCollection,
      edgeBps,
      estimatedProfitUsd: netProfitUsd,
      legs,
      riskScore,
      status: 'open',
    };

    opportunities.push(opportunity);
  }

  return opportunities;
}

export async function loadRecentFloors(
  db: any, // Drizzle database instance
  limit: number = 100
): Promise<FloorSnapshot[]> {
  // Import schema dynamically to avoid circular dependencies
  const { blockchainFloorPrices } = await import('@apex/db/src/schema');
  const { desc } = await import('drizzle-orm');

  // Query blockchain_floor_prices table
  const results = await db
    .select()
    .from(blockchainFloorPrices)
    .orderBy(desc(blockchainFloorPrices.observedAt))
    .limit(limit);

  return results.map((row: any) => ({
    chain: row.chain as SupportedChain,
    collection: row.collection as SupportedCollection,
    floorPrice: row.floorPrice,
    floorPriceUsd: parseFloat(row.floorPriceUsd),
    blockNumber: row.blockNumber,
    observedAt: row.observedAt instanceof Date ? row.observedAt : new Date(row.observedAt),
    liquidityVenue: row.liquidityVenue,
    currency: row.currency,
  }));
}

export async function dedupeAndPersistOpportunities(
  db: any,
  opportunities: ArbitrageOpportunity[]
): Promise<ArbitrageOpportunity[]> {
  const { arbitrageOpportunities } = await import('@apex/db/src/schema');
  const { eq, and, gte } = await import('drizzle-orm');

  const newOpportunities: ArbitrageOpportunity[] = [];

  for (const opp of opportunities) {
    // Check for similar opportunities in the last 30 seconds
    const recent = await db
      .select()
      .from(arbitrageOpportunities)
      .where(
        and(
          eq(arbitrageOpportunities.baseCollection, opp.baseCollection),
          eq(arbitrageOpportunities.status, 'open'),
          gte(arbitrageOpportunities.createdAt, new Date(Date.now() - 30000))
        )
      )
      .limit(1);

    if (recent.length > 0) {
      const existing = recent[0];
      // Check if edge is similar (within 10 bps)
      if (Math.abs(existing.edgeBps - opp.edgeBps) < 10) {
        continue; // Skip duplicate
      }
    }

    // Insert new opportunity
    await db.insert(arbitrageOpportunities).values({
      id: opp.id,
      baseCollection: opp.baseCollection,
      edgeBps: opp.edgeBps,
      estimatedProfitUsd: opp.estimatedProfitUsd.toString(),
      riskScore: opp.riskScore,
      status: opp.status,
      legs: opp.legs as any,
      createdAt: new Date(opp.createdAt),
    });

    newOpportunities.push(opp);
  }

  return newOpportunities;
}


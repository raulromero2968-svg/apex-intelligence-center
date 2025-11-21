import { z } from 'zod';

// ============================================================================
// ARBITRAGE LEG
// ============================================================================

export const ArbitrageLegSchema = z.object({
  chain: z.string().min(1),
  collection: z.string().min(1),
  venue: z.string().min(1), // e.g., "immutable", "ronin_marketplace"
  action: z.enum(['buy', 'sell']),
  price: z.string().min(1), // bigint as string
  priceUsd: z.number().nonnegative(),
  estGasUsd: z.number().nonnegative(),
});

export type ArbitrageLeg = z.infer<typeof ArbitrageLegSchema>;

// ============================================================================
// ARBITRAGE OPPORTUNITY
// ============================================================================

export const ArbitrageOpportunitySchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  baseCollection: z.string().min(1),
  edgeBps: z.number(), // basis points (can be negative)
  estimatedProfitUsd: z.number(),
  legs: z.array(ArbitrageLegSchema).min(2),
  riskScore: z.number().min(0).max(1),
  status: z.enum(['open', 'stale', 'executed', 'ignored']),
});

export type ArbitrageOpportunity = z.infer<typeof ArbitrageOpportunitySchema>;

// ============================================================================
// ARBITRAGE EVENT
// ============================================================================

export const ArbitrageEventSchema = z.object({
  kind: z.literal('arbitrage_opportunity'),
  opportunity: ArbitrageOpportunitySchema,
});

export type ArbitrageEvent = z.infer<typeof ArbitrageEventSchema>;

// ============================================================================
// REDIS PUB/SUB CHANNEL HELPERS
// ============================================================================

export const arbitrageOpportunityChannel = (): string =>
  'events.arbitrage.opportunity';



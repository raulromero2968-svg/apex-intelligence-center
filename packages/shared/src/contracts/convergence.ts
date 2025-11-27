import { z } from 'zod';

/**
 * Convergence Asset Types
 * 
 * Represents the different types of assets that can be tracked in the convergence dashboard:
 * - physical_card: Graded physical trading cards
 * - digital_twin: Polygon NFTs linked to physical cards
 * - onchain_token: On-chain tokens (Immutable, Ronin, Project O)
 * - otc_position: Project O OTC positions
 * - arbitrage_position: Active arbitrage opportunities
 */
export const ConvergenceAssetTypeSchema = z.enum([
  'physical_card',
  'digital_twin',
  'onchain_token',
  'otc_position',
  'arbitrage_position',
]);

export type ConvergenceAssetType = z.infer<typeof ConvergenceAssetTypeSchema>;

/**
 * Convergence Asset
 * 
 * Represents a single asset in the user's portfolio with cost basis and current value.
 */
export const ConvergenceAssetSchema = z.object({
  id: z.string(),
  type: ConvergenceAssetTypeSchema,
  label: z.string(),
  chain: z.string().nullable(),
  collection: z.string().nullable(),
  quantity: z.number(),
  costBasisUsd: z.number(),
  currentValueUsd: z.number(),
  unrealizedPnlUsd: z.number(),
});

export type ConvergenceAsset = z.infer<typeof ConvergenceAssetSchema>;

/**
 * Convergence Snapshot
 * 
 * Complete snapshot of a user's portfolio at a specific point in time.
 * Includes aggregated totals, breakdowns by type and chain.
 */
export const ConvergenceSnapshotSchema = z.object({
  userId: z.string(),
  asOf: z.string(),
  totalCostBasisUsd: z.number(),
  totalCurrentValueUsd: z.number(),
  totalPnlUsd: z.number(),
  assets: z.array(ConvergenceAssetSchema),
  byType: z.record(
    ConvergenceAssetTypeSchema,
    z.object({
      costBasisUsd: z.number(),
      currentValueUsd: z.number(),
      pnlUsd: z.number(),
    })
  ),
  byChain: z.record(
    z.string(),
    z.object({
      currentValueUsd: z.number(),
    })
  ),
});

export type ConvergenceSnapshot = z.infer<typeof ConvergenceSnapshotSchema>;



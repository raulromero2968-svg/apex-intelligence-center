import { z } from 'zod';

// ============================================================================
// SUPPORTED CHAINS
// ============================================================================

export const SupportedChainSchema = z.enum(['immutable_zkevm', 'ronin']);
export type SupportedChain = z.infer<typeof SupportedChainSchema>;

// ============================================================================
// SUPPORTED COLLECTIONS
// ============================================================================

export const SupportedCollectionSchema = z.enum([
  'gods_unchained',
  'parallel',
  'project_o',
  'runes_tcg',
]);
export type SupportedCollection = z.infer<typeof SupportedCollectionSchema>;

// ============================================================================
// FLOOR PRICE RECORD
// ============================================================================

export const FloorPriceRecordSchema = z.object({
  id: z.string().uuid(),
  chain: SupportedChainSchema,
  collection: SupportedCollectionSchema,
  tokenContract: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  currency: z.string().min(1),
  floorPrice: z.string(), // bigint as string
  floorPriceUsd: z.number().nonnegative(),
  blockNumber: z.number().int().nonnegative(),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/).nullable(),
  observedAt: z.string().datetime(),
  liquidityVenue: z.string().min(1),
});

export type FloorPriceRecord = z.infer<typeof FloorPriceRecordSchema>;

// ============================================================================
// SSE EVENT PAYLOAD
// ============================================================================

export const FloorFeedEventSchema = z.object({
  kind: z.literal('floor_update'),
  chain: SupportedChainSchema,
  collection: SupportedCollectionSchema,
  record: FloorPriceRecordSchema,
});

export type FloorFeedEvent = z.infer<typeof FloorFeedEventSchema>;

// ============================================================================
// REDIS PUB/SUB CHANNEL HELPERS
// ============================================================================

export const blockchainFloorChannel = (
  chain: SupportedChain,
  collection: SupportedCollection
): string => `events.blockchain.floor.${chain}.${collection}`;



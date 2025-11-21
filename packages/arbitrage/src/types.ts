import type {
  ArbitrageLeg,
  ArbitrageOpportunity,
} from '@apex/shared/src/contracts/arbitrage';
import type { SupportedChain, SupportedCollection } from '@apex/shared/src/contracts/blockchainFeeds';

export type { ArbitrageLeg, ArbitrageOpportunity };

export interface FloorSnapshot {
  chain: SupportedChain;
  collection: SupportedCollection;
  floorPrice: string; // bigint as string
  floorPriceUsd: number;
  blockNumber: number;
  observedAt: Date;
  liquidityVenue: string;
  currency: string;
}

export interface ArbitrageRoute {
  fromChain: SupportedChain;
  fromCollection: SupportedCollection;
  toChain: SupportedChain;
  toCollection: SupportedCollection;
  bridgeFeeUsd: number;
  estimatedGasUsd: number;
}

export interface ArbitrageComputation {
  route: ArbitrageRoute;
  buyPrice: string; // bigint as string
  buyPriceUsd: number;
  sellPrice: string; // bigint as string
  sellPriceUsd: number;
  grossProfitUsd: number;
  feesUsd: number;
  gasUsd: number;
  bridgeFeeUsd: number;
  netProfitUsd: number;
  edgeBps: number;
  riskScore: number;
}


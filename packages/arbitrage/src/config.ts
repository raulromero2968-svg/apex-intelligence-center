import type { SupportedCollection } from '@apex/shared/src/contracts/blockchainFeeds';
import type { ArbitrageRoute } from './types';

// Collections to scan for arbitrage
export const ARBITRAGE_COLLECTIONS: SupportedCollection[] = [
  'gods_unchained',
  'parallel',
  'project_o',
  'runes_tcg',
];

// Allowed arbitrage routes
// Based on docs/11_BLOCKCHAIN/11_BLOCKCHAIN_08_arbitrage_topologies.md
export const ALLOWED_ROUTES: ArbitrageRoute[] = [
  // Immutable zkEVM ↔ Ronin
  {
    fromChain: 'immutable_zkevm',
    fromCollection: 'project_o',
    toChain: 'ronin',
    toCollection: 'runes_tcg', // Note: Different collections, but route exists
    bridgeFeeUsd: 1.25, // ~0.0005 ETH at $2500
    estimatedGasUsd: 2.5, // ~0.001 ETH
  },
  {
    fromChain: 'ronin',
    fromCollection: 'runes_tcg',
    toChain: 'immutable_zkevm',
    toCollection: 'project_o',
    bridgeFeeUsd: 1.25,
    estimatedGasUsd: 2.5,
  },
  // Same collection cross-chain (if applicable)
  {
    fromChain: 'immutable_zkevm',
    fromCollection: 'gods_unchained',
    toChain: 'immutable_zkevm',
    toCollection: 'gods_unchained',
    bridgeFeeUsd: 0, // Same chain, different venue
    estimatedGasUsd: 2.5,
  },
];

// Environment-based configuration
export function getArbitrageConfig() {
  const minEdgeBps = parseInt(process.env.ARBITRAGE_MIN_EDGE_BPS || '50', 10);
  const maxSlippageBps = parseInt(process.env.ARBITRAGE_MAX_SLIPPAGE_BPS || '300', 10);
  const scanIntervalSeconds = parseInt(process.env.ARBITRAGE_SCAN_INTERVAL_SECONDS || '5', 10);

  return {
    minEdgeBps,
    maxSlippageBps,
    scanIntervalSeconds,
    minProfitUsd: 10.0, // Minimum $10 profit
  };
}

// Fee structure (from docs)
export const FEE_STRUCTURE = {
  immutable_orderbook: {
    maker: 0.025, // 2.5%
    taker: 0.025, // 2.5%
  },
  ronin_marketplace: {
    seller: 0.025, // 2.5%
  },
  ethereum_marketplace: {
    marketplace: 0.025, // 2.5%
  },
};

// Gas estimates (from docs)
export const GAS_ESTIMATES = {
  immutable_zkevm: {
    buy: 0.001, // ETH
    sell: 0.001, // ETH
  },
  ronin: {
    buy: 0.01, // RON
    sell: 0.01, // RON
  },
  ethereum: {
    buy: 0.01, // ETH (variable, using conservative estimate)
    sell: 0.01, // ETH
  },
};


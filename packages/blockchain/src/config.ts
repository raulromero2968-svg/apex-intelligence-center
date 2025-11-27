import type {
  SupportedChain,
  SupportedCollection,
} from '@apex/shared/src/contracts/blockchainFeeds';

export interface CollectionConfig {
  chain: SupportedChain;
  tokenContract: string;
  currency: string;
  liquidityVenue: string;
  orderbookContract?: string;
  marketplaceContract?: string;
}

// Collection configuration based on docs/11_BLOCKCHAIN
export const COLLECTION_CONFIG: Record<SupportedCollection, CollectionConfig> = {
  gods_unchained: {
    chain: 'immutable_zkevm',
    tokenContract: '0xacb3c6a43d15b907e8433077b6d38ae40936fe2c',
    currency: 'ETH',
    liquidityVenue: 'immutable-orderbook',
    orderbookContract: '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506',
  },
  parallel: {
    chain: 'immutable_zkevm',
    tokenContract: '0x76be3b62873462d2142405439777e971754e8e77',
    currency: 'ETH',
    liquidityVenue: 'immutable-orderbook',
    orderbookContract: '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506',
  },
  project_o: {
    chain: 'immutable_zkevm',
    tokenContract: '0x8c9e8c3d34d3bfdb8f6e8e1d8e9f4c5d6e7f8a9b',
    currency: 'ETH',
    liquidityVenue: 'immutable-orderbook',
    orderbookContract: '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506',
  },
  runes_tcg: {
    chain: 'ronin',
    tokenContract: '0x32950db2a7164aE833121501C797D79E7B79d74C',
    currency: 'RON',
    liquidityVenue: 'ronin-marketplace',
    marketplaceContract: '0x213073989821f738a7ba3520c3d31a1f9ad31bbd',
  },
};

// RPC Configuration
export function getRpcConfig(): {
  immutableZkEvm: { rpcUrl: string; wsUrl?: string };
  ronin: { rpcUrl: string; wsUrl?: string };
} {
  const immutableRpcUrl = process.env.IMMUTABLE_ZKEVM_RPC_URL;
  const immutableWsUrl = process.env.IMMUTABLE_ZKEVM_WS_URL;
  const roninRpcUrl = process.env.RONIN_RPC_URL;
  const roninWsUrl = process.env.RONIN_WS_URL;

  if (!immutableRpcUrl) {
    throw new Error('IMMUTABLE_ZKEVM_RPC_URL environment variable is required');
  }
  if (!roninRpcUrl) {
    throw new Error('RONIN_RPC_URL environment variable is required');
  }

  return {
    immutableZkEvm: {
      rpcUrl: immutableRpcUrl,
      wsUrl: immutableWsUrl,
    },
    ronin: {
      rpcUrl: roninRpcUrl,
      wsUrl: roninWsUrl,
    },
  };
}

// Currency conversion rates (fallback if oracles unavailable)
export const FALLBACK_RATES: Record<string, number> = {
  ETH: 2500,
  RON: 2.5,
  IMX: 1.5,
  USDC: 1.0,
};

// Get USD conversion rate for a currency
export function getUsdRate(currency: string): number {
  return FALLBACK_RATES[currency] ?? 1.0;
}


import type { SupportedChain, SupportedCollection, FloorPriceRecord } from '@apex/shared/src/contracts/blockchainFeeds';

export interface RpcClientConfig {
  rpcUrl: string;
  wsUrl?: string;
  chainId: number;
  name: string;
}

export interface OrderbookEntry {
  maker: string;
  taker: string;
  tokenContract: string;
  tokenId: bigint;
  price: bigint;
  expiration: bigint;
}

export interface ListingEntry {
  seller: string;
  tokenContract: string;
  tokenId: bigint;
  price: bigint;
  expiration: bigint;
  active: boolean;
}

export interface FloorComputationContext {
  chain: SupportedChain;
  collection: SupportedCollection;
  tokenContract: string;
  currency: string;
  liquidityVenue: string;
  blockNumber: number;
  txHash: string | null;
}

export interface FloorPriceClient {
  getCurrentFloorPrice(collection: SupportedCollection): Promise<FloorPriceRecord>;
  subscribeToFloorUpdates(
    collection: SupportedCollection,
    callback: (record: FloorPriceRecord) => void
  ): Promise<() => void>; // Returns unsubscribe function
}


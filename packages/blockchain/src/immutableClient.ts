import { ethers } from 'ethers';
import type { SupportedCollection, FloorPriceRecord } from '@apex/shared/src/contracts/blockchainFeeds';
import { COLLECTION_CONFIG, getRpcConfig, getUsdRate } from './config';
import type { FloorPriceClient, OrderbookEntry } from './types';

// Orderbook ABI (simplified for getBestOffer and getOrders)
const ORDERBOOK_ABI = [
  'function getBestOffer(address tokenContract) external view returns (tuple(address maker, address taker, address tokenContract, uint256 tokenId, uint256 price, uint256 expiration))',
  'function getOrders(address tokenContract, uint256 limit) external view returns (tuple(address maker, address taker, address tokenContract, uint256 tokenId, uint256 price, uint256 expiration)[])',
  'event OrderCreated(address indexed maker, address indexed tokenContract, uint256 indexed tokenId, uint256 price)',
  'event OrderFilled(address indexed maker, address indexed tokenContract, uint256 indexed tokenId, uint256 price)',
  'event OrderCancelled(address indexed maker, address indexed tokenContract, uint256 indexed tokenId)',
] as const;

export class ImmutableClient implements FloorPriceClient {
  private provider: ethers.JsonRpcProvider;
  private wsProvider: ethers.WebSocketProvider | null = null;
  private orderbookContract: ethers.Contract;

  constructor() {
    const config = getRpcConfig();
    this.provider = new ethers.JsonRpcProvider(config.immutableZkEvm.rpcUrl);
    
    const orderbookAddress = '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506';
    this.orderbookContract = new ethers.Contract(
      orderbookAddress,
      ORDERBOOK_ABI,
      this.provider
    );

    if (config.immutableZkEvm.wsUrl) {
      this.wsProvider = new ethers.WebSocketProvider(config.immutableZkEvm.wsUrl);
    }
  }

  async getCurrentFloorPrice(collection: SupportedCollection): Promise<FloorPriceRecord> {
    const collectionConfig = COLLECTION_CONFIG[collection];
    if (collectionConfig.chain !== 'immutable_zkevm') {
      throw new Error(`Collection ${collection} is not on Immutable zkEVM`);
    }

    const tokenContract = collectionConfig.tokenContract;
    const blockNumber = await this.provider.getBlockNumber();
    
    let floorPriceWei: bigint;
    let txHash: string | null = null;

    try {
      // Try to get best offer directly
      const bestOffer = await this.orderbookContract.getBestOffer(tokenContract);
      if (bestOffer && bestOffer.price > 0n && bestOffer.expiration > BigInt(Math.floor(Date.now() / 1000))) {
        floorPriceWei = bestOffer.price;
      } else {
        // Fallback: query multiple orders and find minimum
        const orders = await this.orderbookContract.getOrders(tokenContract, 100);
        const now = BigInt(Math.floor(Date.now() / 1000));
        const activeOrders = (orders as OrderbookEntry[]).filter(
          (order) => order.price > 0n && order.expiration > now
        );
        
        if (activeOrders.length === 0) {
          throw new Error(`No active orders found for ${collection}`);
        }
        
        floorPriceWei = activeOrders.reduce((min, order) => 
          order.price < min ? order.price : min, activeOrders[0]!.price
        );
      }
    } catch (error) {
      throw new Error(`Failed to fetch floor price for ${collection}: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Convert wei to ETH
    const floorPriceEth = Number(ethers.formatEther(floorPriceWei));
    const usdRate = getUsdRate(collectionConfig.currency);
    const floorPriceUsd = floorPriceEth * usdRate;

    const record: FloorPriceRecord = {
      id: crypto.randomUUID(),
      chain: 'immutable_zkevm',
      collection,
      tokenContract,
      currency: collectionConfig.currency,
      floorPrice: floorPriceWei.toString(),
      floorPriceUsd,
      blockNumber,
      txHash,
      observedAt: new Date().toISOString(),
      liquidityVenue: collectionConfig.liquidityVenue,
    };

    return record;
  }

  async subscribeToFloorUpdates(
    collection: SupportedCollection,
    callback: (record: FloorPriceRecord) => void
  ): Promise<() => void> {
    if (!this.wsProvider) {
      throw new Error('WebSocket provider not configured for Immutable zkEVM');
    }

    const collectionConfig = COLLECTION_CONFIG[collection];
    if (collectionConfig.chain !== 'immutable_zkevm') {
      throw new Error(`Collection ${collection} is not on Immutable zkEVM`);
    }

    const tokenContract = collectionConfig.tokenContract;
    const orderbookAddress = '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506';
    const orderbookContract = new ethers.Contract(
      orderbookAddress,
      ORDERBOOK_ABI,
      this.wsProvider
    );

    let lastFloorPrice: bigint | null = null;
    let debounceTimer: NodeJS.Timeout | null = null;

    const debouncedCallback = async () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(async () => {
        try {
          const record = await this.getCurrentFloorPrice(collection);
          const currentPrice = BigInt(record.floorPrice);
          
          // Only emit if price changed
          if (lastFloorPrice === null || currentPrice !== lastFloorPrice) {
            lastFloorPrice = currentPrice;
            callback(record);
          }
        } catch (error) {
          console.error(`[immutable-client] Error in floor update callback:`, error);
        }
      }, 2000); // 2 second debounce
    };

    // Subscribe to order events
    const orderCreatedFilter = orderbookContract.filters.OrderCreated(null, tokenContract);
    const orderFilledFilter = orderbookContract.filters.OrderFilled(null, tokenContract);
    const orderCancelledFilter = orderbookContract.filters.OrderCancelled(null, tokenContract);

    const handlers: Array<{ filter: ethers.ContractEventPayload; listener: () => void }> = [];

    const onOrderCreated = () => debouncedCallback();
    const onOrderFilled = () => debouncedCallback();
    const onOrderCancelled = () => debouncedCallback();

    orderbookContract.on(orderCreatedFilter, onOrderCreated);
    orderbookContract.on(orderFilledFilter, onOrderFilled);
    orderbookContract.on(orderCancelledFilter, onOrderCancelled);

    handlers.push(
      { filter: orderCreatedFilter, listener: onOrderCreated },
      { filter: orderFilledFilter, listener: onOrderFilled },
      { filter: orderCancelledFilter, listener: onOrderCancelled }
    );

    // Return unsubscribe function
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      handlers.forEach(({ filter, listener }) => {
        orderbookContract.off(filter, listener);
      });
    };
  }

  async close(): Promise<void> {
    if (this.wsProvider) {
      await this.wsProvider.destroy();
    }
  }
}


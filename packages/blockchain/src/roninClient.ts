import { ethers } from 'ethers';
import type { SupportedCollection, FloorPriceRecord } from '@apex/shared/src/contracts/blockchainFeeds';
import { COLLECTION_CONFIG, getRpcConfig, getUsdRate } from './config';
import type { FloorPriceClient, ListingEntry } from './types';

// Marketplace ABI (simplified for getFloorPrice and getActiveListings)
const MARKETPLACE_ABI = [
  'function getFloorPrice(address tokenContract) external view returns (uint256)',
  'function getActiveListings(address tokenContract, uint256 limit) external view returns (tuple(address seller, address tokenContract, uint256 tokenId, uint256 price, uint256 expiration, bool active)[])',
  'event ListingCreated(address indexed seller, address indexed tokenContract, uint256 indexed tokenId, uint256 price)',
  'event ListingSold(address indexed seller, address indexed tokenContract, uint256 indexed tokenId, uint256 price)',
  'event ListingCancelled(address indexed seller, address indexed tokenContract, uint256 indexed tokenId)',
] as const;

export class RoninClient implements FloorPriceClient {
  private provider: ethers.JsonRpcProvider;
  private wsProvider: ethers.WebSocketProvider | null = null;
  private marketplaceContract: ethers.Contract;

  constructor() {
    const config = getRpcConfig();
    this.provider = new ethers.JsonRpcProvider(config.ronin.rpcUrl);
    
    const marketplaceAddress = '0x213073989821f738a7ba3520c3d31a1f9ad31bbd';
    this.marketplaceContract = new ethers.Contract(
      marketplaceAddress,
      MARKETPLACE_ABI,
      this.provider
    );

    if (config.ronin.wsUrl) {
      this.wsProvider = new ethers.WebSocketProvider(config.ronin.wsUrl);
    }
  }

  async getCurrentFloorPrice(collection: SupportedCollection): Promise<FloorPriceRecord> {
    const collectionConfig = COLLECTION_CONFIG[collection];
    if (collectionConfig.chain !== 'ronin') {
      throw new Error(`Collection ${collection} is not on Ronin`);
    }

    const tokenContract = collectionConfig.tokenContract;
    const blockNumber = await this.provider.getBlockNumber();
    
    let floorPriceWei: bigint;
    let txHash: string | null = null;

    try {
      // Try to get floor price directly
      const floorPrice = await this.marketplaceContract.getFloorPrice(tokenContract);
      if (floorPrice && floorPrice > 0n) {
        floorPriceWei = floorPrice;
      } else {
        // Fallback: query active listings and find minimum
        const listings = await this.marketplaceContract.getActiveListings(tokenContract, 100);
        const activeListings = (listings as ListingEntry[]).filter(
          (listing) => listing.active && listing.price > 0n && listing.expiration > BigInt(Math.floor(Date.now() / 1000))
        );
        
        if (activeListings.length === 0) {
          throw new Error(`No active listings found for ${collection}`);
        }
        
        floorPriceWei = activeListings.reduce((min, listing) => 
          listing.price < min ? listing.price : min, activeListings[0]!.price
        );
      }
    } catch (error) {
      throw new Error(`Failed to fetch floor price for ${collection}: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Convert wei to RON
    const floorPriceRon = Number(ethers.formatEther(floorPriceWei));
    const usdRate = getUsdRate(collectionConfig.currency);
    const floorPriceUsd = floorPriceRon * usdRate;

    const record: FloorPriceRecord = {
      id: crypto.randomUUID(),
      chain: 'ronin',
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
      throw new Error('WebSocket provider not configured for Ronin');
    }

    const collectionConfig = COLLECTION_CONFIG[collection];
    if (collectionConfig.chain !== 'ronin') {
      throw new Error(`Collection ${collection} is not on Ronin`);
    }

    const tokenContract = collectionConfig.tokenContract;
    const marketplaceAddress = '0x213073989821f738a7ba3520c3d31a1f9ad31bbd';
    const marketplaceContract = new ethers.Contract(
      marketplaceAddress,
      MARKETPLACE_ABI,
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
          console.error(`[ronin-client] Error in floor update callback:`, error);
        }
      }, 2000); // 2 second debounce
    };

    // Subscribe to listing events
    const listingCreatedFilter = marketplaceContract.filters.ListingCreated(null, tokenContract);
    const listingSoldFilter = marketplaceContract.filters.ListingSold(null, tokenContract);
    const listingCancelledFilter = marketplaceContract.filters.ListingCancelled(null, tokenContract);

    const handlers: Array<{ filter: ethers.ContractEventPayload; listener: () => void }> = [];

    const onListingCreated = () => debouncedCallback();
    const onListingSold = () => debouncedCallback();
    const onListingCancelled = () => debouncedCallback();

    marketplaceContract.on(listingCreatedFilter, onListingCreated);
    marketplaceContract.on(listingSoldFilter, onListingSold);
    marketplaceContract.on(listingCancelledFilter, onListingCancelled);

    handlers.push(
      { filter: listingCreatedFilter, listener: onListingCreated },
      { filter: listingSoldFilter, listener: onListingSold },
      { filter: listingCancelledFilter, listener: onListingCancelled }
    );

    // Return unsubscribe function
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      handlers.forEach(({ filter, listener }) => {
        marketplaceContract.off(filter, listener);
      });
    };
  }

  async close(): Promise<void> {
    if (this.wsProvider) {
      await this.wsProvider.destroy();
    }
  }
}


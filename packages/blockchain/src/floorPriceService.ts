import type {
  SupportedCollection,
  FloorPriceRecord,
} from '@apex/shared/src/contracts/blockchainFeeds';
import { COLLECTION_CONFIG } from './config';
import { ImmutableClient } from './immutableClient';
import { RoninClient } from './roninClient';
import type { FloorPriceClient } from './types';

export class FloorPriceService {
  private immutableClient: ImmutableClient;
  private roninClient: RoninClient;
  private clients: Map<SupportedCollection, FloorPriceClient> = new Map();
  private subscriptions: Map<SupportedCollection, () => void> = new Map();

  constructor() {
    this.immutableClient = new ImmutableClient();
    this.roninClient = new RoninClient();

    // Map collections to their respective clients
    for (const [collection, config] of Object.entries(COLLECTION_CONFIG)) {
      if (config.chain === 'immutable_zkevm') {
        this.clients.set(collection as SupportedCollection, this.immutableClient);
      } else if (config.chain === 'ronin') {
        this.clients.set(collection as SupportedCollection, this.roninClient);
      }
    }
  }

  /**
   * Poll all collections and compute floor prices
   */
  async pollAndComputeFloors(): Promise<FloorPriceRecord[]> {
    const results: FloorPriceRecord[] = [];

    for (const collection of Object.keys(COLLECTION_CONFIG) as SupportedCollection[]) {
      try {
        const client = this.clients.get(collection);
        if (!client) {
          console.warn(`[floor-price-service] No client found for collection: ${collection}`);
          continue;
        }

        const record = await client.getCurrentFloorPrice(collection);
        results.push(record);
      } catch (error) {
        console.error(`[floor-price-service] Failed to get floor price for ${collection}:`, error);
      }
    }

    return results;
  }

  /**
   * Subscribe to floor price streams for all collections
   */
  async subscribeFloorStreams(
    onFloorUpdate: (record: FloorPriceRecord) => void
  ): Promise<() => void> {
    const unsubscribers: Array<() => void> = [];

    for (const collection of Object.keys(COLLECTION_CONFIG) as SupportedCollection[]) {
      try {
        const client = this.clients.get(collection);
        if (!client) {
          console.warn(`[floor-price-service] No client found for collection: ${collection}`);
          continue;
        }

        const unsubscribe = await client.subscribeToFloorUpdates(collection, onFloorUpdate);
        unsubscribers.push(unsubscribe);
        this.subscriptions.set(collection, unsubscribe);
      } catch (error) {
        console.error(`[floor-price-service] Failed to subscribe to ${collection}:`, error);
      }
    }

    // Return function to unsubscribe from all
    return () => {
      unsubscribers.forEach((unsub) => unsub());
      this.subscriptions.clear();
    };
  }

  /**
   * Get floor price for a specific collection
   */
  async getFloorPrice(collection: SupportedCollection): Promise<FloorPriceRecord> {
    const client = this.clients.get(collection);
    if (!client) {
      throw new Error(`No client found for collection: ${collection}`);
    }
    return client.getCurrentFloorPrice(collection);
  }

  /**
   * Cleanup all subscriptions and connections
   */
  async close(): Promise<void> {
    // Unsubscribe from all
    this.subscriptions.forEach((unsub) => unsub());
    this.subscriptions.clear();

    // Close clients
    await Promise.all([
      this.immutableClient.close(),
      this.roninClient.close(),
    ]);
  }
}


/**
 * Report Emitter - Broadcast new reports to subscribers via SSE
 *
 * Uses EventEmitter for local deployment, can be swapped for Redis pub/sub at scale.
 * Provides type-safe event emission for intel reports.
 *
 * Usage:
 * - Emit new report: reportEmitter.emit('new_report', report)
 * - Subscribe: reportEmitter.on('new_report', handler)
 *
 * For scaling: Replace EventEmitter with Redis pub/sub or external queue.
 *
 * Reference: knowledge-10-api-realtime.md
 *
 * @module lib/events/report-emitter
 */

import { EventEmitter } from 'events';

// =============================================================================
// TYPES
// =============================================================================

export interface ReportEvent {
  id: string;
  userId: string;
  title: string;
  slug: string;
  summary: string;
  category: string;
  tier: string;
  postedTo: string;
  game: string;
  tags: string[];
  publishedAt: string;
}

export interface ListingEvent {
  id: string;
  cardId: string;
  sellerId: string;
  priceRc: number | null;
  priceUsd: number | null;
  cardName: string;
  game: string;
  createdAt: string;
}

export type EventType =
  | 'new_report'
  | 'report_updated'
  | 'report_liked'
  | 'new_listing'
  | 'listing_sold'
  | 'price_alert';

export interface EventPayload {
  new_report: ReportEvent;
  report_updated: ReportEvent;
  report_liked: { reportId: string; likeCount: number };
  new_listing: ListingEvent;
  listing_sold: { listingId: string; buyerId: string };
  price_alert: { cardId: string; cardName: string; price: number; threshold: number };
}

// =============================================================================
// EMITTER SINGLETON
// =============================================================================

class ReportEventEmitter extends EventEmitter {
  private static instance: ReportEventEmitter;

  private constructor() {
    super();
    this.setMaxListeners(1000); // Support many concurrent connections
  }

  static getInstance(): ReportEventEmitter {
    if (!ReportEventEmitter.instance) {
      ReportEventEmitter.instance = new ReportEventEmitter();
    }
    return ReportEventEmitter.instance;
  }

  /**
   * Emit a typed event
   */
  emitEvent<T extends EventType>(event: T, data: EventPayload[T]): void {
    this.emit(event, data);
  }

  /**
   * Subscribe to a typed event
   */
  onEvent<T extends EventType>(
    event: T,
    handler: (data: EventPayload[T]) => void
  ): void {
    this.on(event, handler);
  }

  /**
   * Unsubscribe from an event
   */
  offEvent<T extends EventType>(
    event: T,
    handler: (data: EventPayload[T]) => void
  ): void {
    this.off(event, handler);
  }

  /**
   * Get count of listeners for an event
   */
  getListenerCount(event: EventType): number {
    return this.listenerCount(event);
  }
}

// Export singleton instance
export const reportEmitter = ReportEventEmitter.getInstance();

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Broadcast a new report to all subscribers
 */
export function broadcastNewReport(report: ReportEvent): void {
  reportEmitter.emitEvent('new_report', report);
}

/**
 * Broadcast a report update
 */
export function broadcastReportUpdate(report: ReportEvent): void {
  reportEmitter.emitEvent('report_updated', report);
}

/**
 * Broadcast a new listing
 */
export function broadcastNewListing(listing: ListingEvent): void {
  reportEmitter.emitEvent('new_listing', listing);
}

/**
 * Broadcast a price alert
 */
export function broadcastPriceAlert(alert: EventPayload['price_alert']): void {
  reportEmitter.emitEvent('price_alert', alert);
}

// =============================================================================
// REDIS PUB/SUB ADAPTER (for scaling)
// =============================================================================

let redisSubscriber: any = null;
let redisPublisher: any = null;

/**
 * Initialize Redis pub/sub for multi-instance deployment
 * Call this in your app initialization if using Redis
 */
export async function initRedisRelay(): Promise<boolean> {
  try {
    const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;
    if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
      return false;
    }

    const { Redis } = await import('@upstash/redis');
    redisPublisher = new Redis({ url: UPSTASH_REDIS_REST_URL, token: UPSTASH_REDIS_REST_TOKEN });

    // Note: Upstash doesn't support traditional pub/sub, so we use a polling approach
    // For true pub/sub, use ioredis with a standard Redis instance
    console.log('Redis relay initialized (publish only, Upstash mode)');
    return true;
  } catch (error) {
    console.warn('Redis relay init failed:', error);
    return false;
  }
}

/**
 * Publish event to Redis for cross-instance broadcasting
 */
export async function publishToRedis<T extends EventType>(
  event: T,
  data: EventPayload[T]
): Promise<void> {
  if (!redisPublisher) return;

  try {
    await redisPublisher.lpush(`events:${event}`, JSON.stringify({
      event,
      data,
      timestamp: Date.now(),
    }));
    // Trim to last 100 events
    await redisPublisher.ltrim(`events:${event}`, 0, 99);
  } catch (error) {
    console.warn('Redis publish failed:', error);
  }
}

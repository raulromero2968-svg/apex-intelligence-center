/**
 * Analytics Events Schema - Transaction and Engagement Tracking
 *
 * Tracks buy conversions and user engagement for metrics dashboards.
 * Extends Web Vitals tracking (KB-07) to e-commerce events.
 *
 * Trade-offs:
 * - GOOD: Enables optimization (e.g., A/B test buttons)
 * - GOOD: Real-time dashboards
 * - GOOD: Low overhead with async logging
 * - BAD: Privacy concerns; anonymize data per GDPR (KB-05 compliance)
 * - BAD: DB bloat; archive old logs (KB-09 archival strategy)
 *
 * Reference: knowledge-07-seo-performance.md
 *
 * @module analyticsEvents
 */

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
  integer,
  decimal,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { users } from '../schema';

// =============================================================================
// ENUMS
// =============================================================================

/**
 * Analytics event types for categorization and filtering
 */
export const analyticsEventTypeEnum = pgEnum('analytics_event_type', [
  // Purchase events
  'buy_report',
  'buy_listing',
  'buy_subscription',
  // Engagement events
  'view_report',
  'like_report',
  'share_report',
  'download_resource',
  // Search events
  'search_reports',
  'search_marketplace',
  // Conversion funnel events
  'page_view',
  'signup_started',
  'signup_completed',
  'checkout_started',
  'checkout_completed',
  // RC economy events
  'rc_earned',
  'rc_spent',
  'rc_purchased',
]);

// =============================================================================
// ANALYTICS EVENTS TABLE
// =============================================================================

/**
 * Analytics Events table - Tracks user actions for metrics and optimization
 *
 * Designed for high-volume inserts with minimal overhead.
 * Uses JSONB metadata for flexible event properties.
 *
 * Query patterns:
 * - Daily conversions: GROUP BY DATE(created_at), event_type
 * - User funnel: event_type sequence per session
 * - Revenue metrics: SUM(metadata->>'price') WHERE event_type = 'buy_report'
 */
export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Event classification
    eventType: text('event_type').notNull(),

    // User reference (nullable for anonymous events)
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),

    // Session tracking (for funnel analysis)
    sessionId: text('session_id'),

    // Flexible metadata for event-specific properties
    metadata: jsonb('metadata').$type<{
      // Purchase events
      reportId?: string;
      listingId?: string;
      price?: number;
      paymentType?: 'rc' | 'usd' | 'stripe';
      sellerId?: string;

      // Search events
      query?: string;
      resultsCount?: number;
      filters?: Record<string, string>;
      latencyMs?: number;

      // Engagement events
      resourceId?: string;
      resourceType?: string;
      referrer?: string;

      // Page view events
      path?: string;
      utm_source?: string;
      utm_medium?: string;
      utm_campaign?: string;

      // Generic properties
      [key: string]: unknown;
    }>(),

    // Denormalized price for fast aggregation queries
    priceAmount: decimal('price_amount', { precision: 10, scale: 2 }),

    // Event count for batched events (default: 1)
    eventCount: integer('event_count').default(1).notNull(),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // Event type filtering (most common query pattern)
    typeIdx: index('analytics_events_type_idx').on(table.eventType),

    // Time-based queries (daily/weekly/monthly aggregations)
    timeIdx: index('analytics_events_time_idx').on(table.createdAt),

    // User-specific analytics
    userIdx: index('analytics_events_user_idx').on(table.userId),

    // Composite index for conversion queries: type + time
    conversionIdx: index('analytics_events_conversion_idx').on(
      table.eventType,
      table.createdAt
    ),

    // Session tracking for funnel analysis
    sessionIdx: index('analytics_events_session_idx').on(table.sessionId),

    // Price aggregation for revenue queries
    priceIdx: index('analytics_events_price_idx').on(table.priceAmount),
  })
);

// =============================================================================
// RELATIONS
// =============================================================================

export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
  user: one(users, {
    fields: [analyticsEvents.userId],
    references: [users.id],
  }),
}));

// =============================================================================
// TYPES
// =============================================================================

export type AnalyticsEvent = InferSelectModel<typeof analyticsEvents>;
export type NewAnalyticsEvent = InferInsertModel<typeof analyticsEvents>;

// Event type exports
export type AnalyticsEventType =
  | 'buy_report'
  | 'buy_listing'
  | 'buy_subscription'
  | 'view_report'
  | 'like_report'
  | 'share_report'
  | 'download_resource'
  | 'search_reports'
  | 'search_marketplace'
  | 'page_view'
  | 'signup_started'
  | 'signup_completed'
  | 'checkout_started'
  | 'checkout_completed'
  | 'rc_earned'
  | 'rc_spent'
  | 'rc_purchased';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create analytics event insert values
 * Helper to ensure consistent event creation
 */
export function createAnalyticsEvent(
  eventType: AnalyticsEventType,
  options: {
    userId?: string;
    sessionId?: string;
    metadata?: Record<string, unknown>;
    priceAmount?: number;
  } = {}
): NewAnalyticsEvent {
  return {
    eventType,
    userId: options.userId,
    sessionId: options.sessionId,
    metadata: options.metadata,
    priceAmount: options.priceAmount?.toString(),
  };
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Analytics data retention period (in days)
 * Events older than this should be archived or deleted
 */
export const ANALYTICS_RETENTION_DAYS = 365;

/**
 * Event types that should be anonymized for GDPR compliance
 */
export const ANONYMIZABLE_EVENTS: AnalyticsEventType[] = [
  'page_view',
  'search_reports',
  'search_marketplace',
];

/**
 * Event types that represent revenue
 */
export const REVENUE_EVENTS: AnalyticsEventType[] = [
  'buy_report',
  'buy_listing',
  'buy_subscription',
  'rc_purchased',
];

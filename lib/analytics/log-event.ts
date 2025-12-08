/**
 * Analytics Event Logger - Async logging for conversion tracking
 *
 * Provides low-overhead async logging of analytics events.
 * Designed to not block the main request flow.
 *
 * Trade-offs:
 * - GOOD: Low overhead with async logging
 * - GOOD: Consistent event structure
 * - BAD: Events may be lost on server crash (acceptable trade-off)
 *
 * Reference: knowledge-07-seo-performance.md
 *
 * @module lib/analytics/log-event
 */

import { Pool } from 'pg';
import * as Sentry from '@sentry/nextjs';
import type { AnalyticsEventType } from '@apex/db/schema';

// =============================================================================
// DATABASE CONNECTION (shared pool)
// =============================================================================

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  max: 5, // Smaller pool for analytics (less critical)
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// =============================================================================
// EVENT LOGGING
// =============================================================================

export interface LogEventOptions {
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
  priceAmount?: number;
}

/**
 * Log an analytics event to the database
 *
 * This is designed to be fire-and-forget (non-blocking).
 * Errors are logged but don't affect the caller.
 *
 * @param eventType - Type of event (e.g., 'buy_report', 'view_report')
 * @param options - Event options including userId, metadata, etc.
 */
export async function logAnalyticsEvent(
  eventType: AnalyticsEventType | string,
  options: LogEventOptions = {}
): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query(
      `INSERT INTO analytics_events (
        event_type, user_id, session_id, metadata, price_amount
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        eventType,
        options.userId || null,
        options.sessionId || null,
        options.metadata ? JSON.stringify(options.metadata) : null,
        options.priceAmount || null,
      ]
    );

    Sentry.addBreadcrumb({
      category: 'analytics',
      message: `Logged event: ${eventType}`,
      level: 'debug',
      data: { userId: options.userId, priceAmount: options.priceAmount },
    });
  } catch (error) {
    // Log but don't throw - analytics should never break the main flow
    console.error('Analytics event logging failed:', error);
    Sentry.captureException(error, {
      extra: { eventType, options },
      tags: { component: 'analytics' },
    });
  } finally {
    client.release();
  }
}

/**
 * Log multiple analytics events in a batch
 * More efficient for high-volume event logging
 *
 * @param events - Array of events to log
 */
export async function logAnalyticsEventsBatch(
  events: Array<{ eventType: AnalyticsEventType | string } & LogEventOptions>
): Promise<void> {
  if (events.length === 0) return;

  const client = await pool.connect();

  try {
    // Build batch insert
    const values: (string | null | number)[] = [];
    const placeholders: string[] = [];
    let paramIndex = 1;

    for (const event of events) {
      placeholders.push(
        `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4})`
      );
      values.push(
        event.eventType,
        event.userId || null,
        event.sessionId || null,
        event.metadata ? JSON.stringify(event.metadata) : null,
        event.priceAmount || null
      );
      paramIndex += 5;
    }

    await client.query(
      `INSERT INTO analytics_events (
        event_type, user_id, session_id, metadata, price_amount
      ) VALUES ${placeholders.join(', ')}`,
      values
    );

    Sentry.addBreadcrumb({
      category: 'analytics',
      message: `Batch logged ${events.length} events`,
      level: 'debug',
    });
  } catch (error) {
    console.error('Analytics batch logging failed:', error);
    Sentry.captureException(error, {
      extra: { eventCount: events.length },
      tags: { component: 'analytics' },
    });
  } finally {
    client.release();
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Log a report view event
 */
export function logReportView(reportId: string, userId?: string, sessionId?: string): Promise<void> {
  return logAnalyticsEvent('view_report', {
    userId,
    sessionId,
    metadata: { reportId },
  });
}

/**
 * Log a report purchase event
 */
export function logReportPurchase(
  reportId: string,
  userId: string,
  price: number,
  sellerId: string
): Promise<void> {
  return logAnalyticsEvent('buy_report', {
    userId,
    metadata: { reportId, price, paymentType: 'rc', sellerId },
    priceAmount: price,
  });
}

/**
 * Log a search event
 */
export function logSearchEvent(
  query: string,
  resultsCount: number,
  latencyMs: number,
  userId?: string,
  sessionId?: string
): Promise<void> {
  return logAnalyticsEvent('search_reports', {
    userId,
    sessionId,
    metadata: { query, resultsCount, latencyMs },
  });
}

/**
 * Log a page view event
 */
export function logPageView(
  path: string,
  userId?: string,
  sessionId?: string,
  utmParams?: { source?: string; medium?: string; campaign?: string }
): Promise<void> {
  return logAnalyticsEvent('page_view', {
    userId,
    sessionId,
    metadata: {
      path,
      utm_source: utmParams?.source,
      utm_medium: utmParams?.medium,
      utm_campaign: utmParams?.campaign,
    },
  });
}

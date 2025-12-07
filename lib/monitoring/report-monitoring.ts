/**
 * Report Monitoring Utilities
 *
 * Provides consistent monitoring, logging, and performance tracking
 * for intel report operations (create, search, purchase).
 *
 * Features:
 * - Sentry integration for error tracking
 * - Performance monitoring with spans
 * - Structured logging with context
 * - Rate limiting alerts
 *
 * Reference: knowledge-04-devops-vercel-advanced.md
 *
 * @module lib/monitoring/report-monitoring
 */

import * as Sentry from '@sentry/nextjs';

// =============================================================================
// TYPES
// =============================================================================

export interface ReportEvent {
  action: 'create' | 'view' | 'search' | 'purchase' | 'like' | 'share';
  reportId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  latencyMs?: number;
  success: boolean;
  error?: Error | string;
}

export interface SearchMetrics {
  query: string;
  vectorResultCount: number;
  keywordResultCount: number;
  fusedResultCount: number;
  rerankingApplied: boolean;
  latencyMs: number;
  filters: Record<string, string | undefined>;
}

export interface EmbeddingMetrics {
  reportId: string;
  textLength: number;
  embeddingDimensions: number;
  latencyMs: number;
  success: boolean;
}

// =============================================================================
// SENTRY HELPERS
// =============================================================================

/**
 * Track a report-related event in Sentry
 */
export function trackReportEvent(event: ReportEvent): void {
  Sentry.addBreadcrumb({
    category: 'intel_reports',
    message: `Report ${event.action}: ${event.reportId || 'N/A'}`,
    level: event.success ? 'info' : 'error',
    data: {
      action: event.action,
      reportId: event.reportId,
      userId: event.userId,
      latencyMs: event.latencyMs,
      ...event.metadata,
    },
  });

  // Set user context if available
  if (event.userId) {
    Sentry.setUser({ id: event.userId });
  }

  // Capture error if present
  if (!event.success && event.error) {
    const error = event.error instanceof Error ? event.error : new Error(String(event.error));
    Sentry.captureException(error, {
      extra: {
        action: event.action,
        reportId: event.reportId,
      },
    });
  }
}

/**
 * Track search performance metrics
 */
export function trackSearchMetrics(metrics: SearchMetrics): void {
  Sentry.addBreadcrumb({
    category: 'search',
    message: `Report search: "${metrics.query.slice(0, 50)}..."`,
    level: 'info',
    data: {
      vectorResults: metrics.vectorResultCount,
      keywordResults: metrics.keywordResultCount,
      fusedResults: metrics.fusedResultCount,
      rerankingApplied: metrics.rerankingApplied,
      latencyMs: metrics.latencyMs,
      filters: metrics.filters,
    },
  });

  // Alert if search is slow (> 2 seconds)
  if (metrics.latencyMs > 2000) {
    Sentry.captureMessage('Slow report search detected', {
      level: 'warning',
      extra: metrics,
    });
  }
}

/**
 * Track embedding generation metrics
 */
export function trackEmbeddingMetrics(metrics: EmbeddingMetrics): void {
  Sentry.addBreadcrumb({
    category: 'embedding',
    message: `Embedding generated for report: ${metrics.reportId}`,
    level: metrics.success ? 'info' : 'error',
    data: {
      textLength: metrics.textLength,
      embeddingDimensions: metrics.embeddingDimensions,
      latencyMs: metrics.latencyMs,
    },
  });

  // Alert if embedding is slow (> 5 seconds)
  if (metrics.latencyMs > 5000) {
    Sentry.captureMessage('Slow embedding generation detected', {
      level: 'warning',
      extra: metrics,
    });
  }
}

// =============================================================================
// PERFORMANCE TRACING
// =============================================================================

/**
 * Start a performance span for report operations
 */
export function startReportSpan(
  operation: string,
  description: string
): ReturnType<typeof Sentry.startInactiveSpan> {
  return Sentry.startInactiveSpan({
    name: `report.${operation}`,
    op: 'report',
    attributes: {
      description,
    },
  });
}

/**
 * Wrap an async operation with performance tracing
 */
export async function withReportSpan<T>(
  operation: string,
  description: string,
  fn: () => Promise<T>
): Promise<T> {
  return Sentry.startSpan(
    {
      name: `report.${operation}`,
      op: 'report',
      attributes: { description },
    },
    async () => {
      return fn();
    }
  );
}

// =============================================================================
// RATE LIMITING ALERTS
// =============================================================================

const rateLimitCounters = new Map<string, { count: number; windowStart: number }>();

/**
 * Track rate limit hits and alert if threshold exceeded
 */
export function trackRateLimitHit(
  endpoint: string,
  userId: string,
  limit: number,
  windowMs: number
): boolean {
  const key = `${endpoint}:${userId}`;
  const now = Date.now();
  const counter = rateLimitCounters.get(key);

  if (!counter || now - counter.windowStart > windowMs) {
    // Start new window
    rateLimitCounters.set(key, { count: 1, windowStart: now });
    return true; // Not rate limited
  }

  counter.count++;

  if (counter.count > limit) {
    Sentry.captureMessage('Rate limit exceeded', {
      level: 'warning',
      extra: {
        endpoint,
        userId,
        count: counter.count,
        limit,
        windowMs,
      },
    });
    return false; // Rate limited
  }

  return true;
}

// =============================================================================
// ERROR CLASSIFICATION
// =============================================================================

export enum ErrorType {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  INSUFFICIENT_BALANCE = 'insufficient_balance',
  EMBEDDING_FAILED = 'embedding_failed',
  SEARCH_FAILED = 'search_failed',
  DATABASE_ERROR = 'database_error',
  EXTERNAL_API_ERROR = 'external_api_error',
  UNKNOWN = 'unknown',
}

/**
 * Classify an error for better Sentry grouping
 */
export function classifyError(error: unknown): ErrorType {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('validation') || message.includes('zod')) {
      return ErrorType.VALIDATION;
    }
    if (message.includes('unauthorized') || message.includes('authentication')) {
      return ErrorType.AUTHENTICATION;
    }
    if (message.includes('forbidden') || message.includes('permission')) {
      return ErrorType.AUTHORIZATION;
    }
    if (message.includes('not found')) {
      return ErrorType.NOT_FOUND;
    }
    if (message.includes('insufficient') || message.includes('balance')) {
      return ErrorType.INSUFFICIENT_BALANCE;
    }
    if (message.includes('embedding') || message.includes('openai')) {
      return ErrorType.EMBEDDING_FAILED;
    }
    if (message.includes('search') || message.includes('vector')) {
      return ErrorType.SEARCH_FAILED;
    }
    if (message.includes('database') || message.includes('postgres') || message.includes('connection')) {
      return ErrorType.DATABASE_ERROR;
    }
    if (message.includes('api') || message.includes('fetch') || message.includes('cohere')) {
      return ErrorType.EXTERNAL_API_ERROR;
    }
  }

  return ErrorType.UNKNOWN;
}

/**
 * Capture error with classification
 */
export function captureReportError(
  error: unknown,
  context: Record<string, unknown> = {}
): void {
  const errorType = classifyError(error);

  Sentry.captureException(error, {
    tags: {
      'error.type': errorType,
      'feature': 'intel_reports',
    },
    extra: {
      ...context,
      errorType,
    },
  });
}

// =============================================================================
// STRUCTURED LOGGING
// =============================================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Structured logger for report operations
 */
export const reportLogger = {
  debug(message: string, context?: Record<string, unknown>): void {
    log('debug', message, context);
  },

  info(message: string, context?: Record<string, unknown>): void {
    log('info', message, context);
  },

  warn(message: string, context?: Record<string, unknown>): void {
    log('warn', message, context);
  },

  error(message: string, error?: unknown, context?: Record<string, unknown>): void {
    log('error', message, { ...context, error });
    if (error) {
      captureReportError(error, context);
    }
  },
};

function log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    feature: 'intel_reports',
    ...context,
  };

  switch (level) {
    case 'debug':
      console.debug(JSON.stringify(logEntry));
      break;
    case 'info':
      console.info(JSON.stringify(logEntry));
      break;
    case 'warn':
      console.warn(JSON.stringify(logEntry));
      break;
    case 'error':
      console.error(JSON.stringify(logEntry));
      break;
  }
}

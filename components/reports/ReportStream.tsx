'use client';

/**
 * ReportStream - Real-time report subscription component
 *
 * Connects to SSE endpoint and receives new reports in real-time.
 * Provides hooks for integrating with UI state management.
 *
 * Usage:
 * ```tsx
 * <ReportStream
 *   market="commons"
 *   onNewReport={(report) => addToFeed(report)}
 *   onError={(err) => toast.error(err.message)}
 * />
 * ```
 *
 * Reference: knowledge-10-api-realtime.md
 *
 * @module components/reports/ReportStream
 */

import { useEffect, useRef, useCallback, useState } from 'react';

// =============================================================================
// TYPES
// =============================================================================

export interface StreamReport {
  id: string;
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

export interface ReportStreamEvent {
  type: 'connected' | 'new_report' | 'report_updated' | 'report_liked';
  market?: string;
  report?: StreamReport;
  reportId?: string;
  likeCount?: number;
}

export interface ReportStreamProps {
  /** Filter by market: 'commons' | 'rc_market' | undefined (all) */
  market?: 'commons' | 'rc_market';
  /** Callback when a new report is received */
  onNewReport?: (report: StreamReport) => void;
  /** Callback when a report is updated */
  onReportUpdated?: (report: Partial<StreamReport> & { id: string }) => void;
  /** Callback when a report is liked */
  onReportLiked?: (reportId: string, likeCount: number) => void;
  /** Callback on connection status change */
  onConnectionChange?: (connected: boolean) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Auto-reconnect on disconnect (default: true) */
  autoReconnect?: boolean;
  /** Reconnect delay in ms (default: 3000) */
  reconnectDelay?: number;
  /** Maximum reconnect attempts (default: 5) */
  maxReconnectAttempts?: number;
  /** Render nothing by default (headless) */
  children?: React.ReactNode;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ReportStream({
  market,
  onNewReport,
  onReportUpdated,
  onReportLiked,
  onConnectionChange,
  onError,
  autoReconnect = true,
  reconnectDelay = 3000,
  maxReconnectAttempts = 5,
  children,
}: ReportStreamProps) {
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    // Build URL with market filter
    const url = market
      ? `/api/reports/stream?market=${market}`
      : '/api/reports/stream';

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      reconnectAttemptsRef.current = 0;
      setConnected(true);
      onConnectionChange?.(true);
    };

    es.onmessage = (event) => {
      try {
        const data: ReportStreamEvent = JSON.parse(event.data);

        switch (data.type) {
          case 'connected':
            // Already handled by onopen
            break;

          case 'new_report':
            if (data.report) {
              onNewReport?.(data.report);
            }
            break;

          case 'report_updated':
            if (data.report) {
              onReportUpdated?.(data.report as Partial<StreamReport> & { id: string });
            }
            break;

          case 'report_liked':
            if (data.reportId && data.likeCount !== undefined) {
              onReportLiked?.(data.reportId, data.likeCount);
            }
            break;
        }
      } catch (error) {
        console.warn('Failed to parse SSE message:', error);
      }
    };

    es.onerror = () => {
      setConnected(false);
      onConnectionChange?.(false);
      es.close();
      eventSourceRef.current = null;

      // Auto-reconnect
      if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++;
        const delay = reconnectDelay * Math.pow(1.5, reconnectAttemptsRef.current - 1);

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        onError?.(new Error('Max reconnect attempts reached'));
      }
    };
  }, [
    market,
    onNewReport,
    onReportUpdated,
    onReportLiked,
    onConnectionChange,
    onError,
    autoReconnect,
    reconnectDelay,
    maxReconnectAttempts,
  ]);

  useEffect(() => {
    connect();

    return () => {
      eventSourceRef.current?.close();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  // Headless by default
  return children ? <>{children}</> : null;
}

// =============================================================================
// HOOK - useReportStream
// =============================================================================

export interface UseReportStreamOptions {
  market?: 'commons' | 'rc_market';
  autoReconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

export interface UseReportStreamResult {
  connected: boolean;
  reports: StreamReport[];
  clearReports: () => void;
  disconnect: () => void;
  reconnect: () => void;
}

export function useReportStream(
  options: UseReportStreamOptions = {}
): UseReportStreamResult {
  const {
    market,
    autoReconnect = true,
    reconnectDelay = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const [connected, setConnected] = useState(false);
  const [reports, setReports] = useState<StreamReport[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    const url = market
      ? `/api/reports/stream?market=${market}`
      : '/api/reports/stream';

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      reconnectAttemptsRef.current = 0;
      setConnected(true);
    };

    es.onmessage = (event) => {
      try {
        const data: ReportStreamEvent = JSON.parse(event.data);
        if (data.type === 'new_report' && data.report) {
          setReports((prev) => [data.report!, ...prev.slice(0, 99)]);
        }
      } catch {
        // Ignore parse errors
      }
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
      eventSourceRef.current = null;

      if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++;
        const delay = reconnectDelay * Math.pow(1.5, reconnectAttemptsRef.current - 1);
        setTimeout(connect, delay);
      }
    };
  }, [market, autoReconnect, reconnectDelay, maxReconnectAttempts]);

  useEffect(() => {
    connect();
    return () => eventSourceRef.current?.close();
  }, [connect]);

  const clearReports = useCallback(() => setReports([]), []);

  const disconnect = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    setConnected(false);
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    connect();
  }, [disconnect, connect]);

  return { connected, reports, clearReports, disconnect, reconnect };
}

// =============================================================================
// STATUS INDICATOR COMPONENT
// =============================================================================

export interface StreamStatusProps {
  connected: boolean;
  className?: string;
}

export function StreamStatus({ connected, className = '' }: StreamStatusProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span
        className={`h-2 w-2 rounded-full ${
          connected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
        }`}
      />
      <span className="text-sm text-gray-600">
        {connected ? 'Live' : 'Offline'}
      </span>
    </div>
  );
}

export default ReportStream;

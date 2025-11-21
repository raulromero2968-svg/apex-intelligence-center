/**
 * WebSocket Client Hook for Live Price Deltas
 *
 * Features:
 * - Feature-flagged behind FEATURE_LIVE_PRICES
 * - Auto-reconnect with exponential backoff (max 5s)
 * - Heartbeat ping every 20s
 * - Clean close on unmount
 * - SSE-based connection (text/event-stream)
 */

import { useEffect, useState, useRef, useCallback } from 'react';

export interface PriceDelta {
  symbol: string;
  priceChange: number;
  percentChange: number;
  timestamp: number;
}

interface UseLivePricesOptions {
  sessionId: string;
  enabled?: boolean;
  onDelta?: (delta: PriceDelta) => void;
}

export function useLivePrices({ sessionId, enabled = true, onDelta }: UseLivePricesOptions) {
  const [deltas, setDeltas] = useState<Map<string, PriceDelta>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectDelayRef = useRef(1000); // Start with 1s delay
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const connectRef = useRef<() => void>(() => {});

  const connect = useCallback(() => {
    // Check feature flag (client-side)
    const featureEnabled = process.env.NEXT_PUBLIC_FEATURE_LIVE_PRICES === '1';
    if (!featureEnabled || !enabled) {
      return;
    }

    cleanup();

    try {
      const url = `/api/research/ws?sessionId=${encodeURIComponent(sessionId)}`;
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectDelayRef.current = 1000; // Reset delay on successful connection
      };

      eventSource.addEventListener('price-delta', (event) => {
        try {
          const delta: PriceDelta = JSON.parse(event.data);
          setDeltas((prev) => {
            const next = new Map(prev);
            next.set(delta.symbol, delta);
            return next;
          });
          onDelta?.(delta);
        } catch (err) {
          console.error('Failed to parse price delta:', err);
        }
      });

      eventSource.addEventListener('ping', () => {
        // Reset heartbeat timeout on ping
        if (heartbeatTimeoutRef.current) {
          clearTimeout(heartbeatTimeoutRef.current);
        }
        heartbeatTimeoutRef.current = setTimeout(() => {
          console.warn('Heartbeat timeout, reconnecting...');
          connectRef.current?.();
        }, 25000); // 25s timeout (server sends every 20s)
      });

      eventSource.addEventListener('error', (event) => {
        try {
          const errorData = JSON.parse((event as any).data);
          setError(errorData.error || 'Connection error');
        } catch {
          setError('Connection error');
        }
      });

      eventSource.onerror = () => {
        setIsConnected(false);
        cleanup();
        connectRef.current?.();
      };
    } catch (err) {
      console.error('Failed to create EventSource:', err);
      setError('Failed to connect');
      connectRef.current?.();
    }
  }, [sessionId, enabled, cleanup, onDelta]);

  const reconnect = useCallback(() => {
    // Exponential backoff with max 5s
    const delay = Math.min(reconnectDelayRef.current, 5000);
    reconnectTimeoutRef.current = setTimeout(() => {
      connectRef.current?.();
    }, delay);
    reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, 5000);
  }, []);

  // Update the ref when connect changes
  connectRef.current = connect;

  useEffect(() => {
    connect();
    return cleanup;
  }, [connect, cleanup]);

  return {
    deltas,
    isConnected,
    error,
  };
}


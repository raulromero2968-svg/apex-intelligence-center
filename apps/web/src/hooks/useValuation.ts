/**
 * Real-Time Valuation Hooks
 *
 * React hooks for consuming Monte Carlo valuations with Socket.IO updates
 */

import { useState, useEffect } from 'react';
import type { ValuationResult } from '@apex/valuation';

/**
 * Fetch valuation from API
 */
async function fetchValuation(
  cardId: string,
  years: number = 5,
  paths: number = 10000
): Promise<ValuationResult> {
  const response = await fetch('/api/valuation/monte-carlo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardId, years, paths }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch valuation');
  }

  return response.json();
}

/**
 * Hook for static valuation (no real-time updates)
 */
export function useValuation(cardId: string | null, years: number = 5) {
  const [valuation, setValuation] = useState<ValuationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cardId) return;

    let cancelled = false;
    const currentCardId = cardId; // Capture for type narrowing

    async function loadValuation() {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchValuation(currentCardId, years);
        if (!cancelled) {
          setValuation(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load valuation');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadValuation();

    return () => {
      cancelled = true;
    };
  }, [cardId, years]);

  return { valuation, loading, error };
}

/**
 * Hook for live valuation with Socket.IO real-time updates
 * Requires socket.io-client to be installed
 */
export function useLiveValuation(cardId: string | null, years: number = 5) {
  const [valuation, setValuation] = useState<ValuationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!cardId) return;

    let socket: any = null;
    let cancelled = false;
    const currentCardId = cardId; // Capture for type narrowing

    async function setupRealtimeValuation() {
      setLoading(true);
      setError(null);

      try {
        // Dynamic import to avoid bundling socket.io-client if not used
        const { io } = await import('socket.io-client');

        // Connect to Socket.IO server
        socket = io({
          path: '/api/realtime',
          transports: ['websocket', 'polling'],
        });

        socket.on('connect', () => {
          console.log('✓ Connected to valuation stream');
          setIsConnected(true);

          // Subscribe to card-specific valuation updates
          socket.emit('join', `valuation:${currentCardId}`);
        });

        socket.on('disconnect', () => {
          console.log('✗ Disconnected from valuation stream');
          setIsConnected(false);
        });

        socket.on('valuation:update', (data: ValuationResult) => {
          if (!cancelled && data.cardId === currentCardId) {
            console.log('📊 Received valuation update', data);
            setValuation(data);
          }
        });

        socket.on('error', (err: Error) => {
          console.error('Socket error:', err);
          setError(err.message);
        });

        // Fetch initial valuation
        const initial = await fetchValuation(currentCardId, years);
        if (!cancelled) {
          setValuation(initial);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to setup live valuation');
          setLoading(false);
        }
      }
    }

    setupRealtimeValuation();

    return () => {
      cancelled = true;
      if (socket) {
        socket.emit('leave', `valuation:${cardId}`);
        socket.disconnect();
      }
    };
  }, [cardId, years]);

  return { valuation, loading, error, isConnected };
}

/**
 * Format percentile for display
 */
export function formatPercentile(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Get risk category based on volatility
 */
export function getRiskCategory(volatility: number): {
  category: 'Low' | 'Medium' | 'High' | 'Extreme';
  color: string;
} {
  if (volatility < 30) return { category: 'Low', color: 'text-green-500' };
  if (volatility < 50) return { category: 'Medium', color: 'text-yellow-500' };
  if (volatility < 80) return { category: 'High', color: 'text-orange-500' };
  return { category: 'Extreme', color: 'text-red-500' };
}


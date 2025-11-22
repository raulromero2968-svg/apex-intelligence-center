/**
 * Real-time WebSocket Client for Expo Mobile App
 *
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Auth token injection
 * - Type-safe event handling
 * - Connection state management
 * - React hooks for easy integration
 */

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import * as Sentry from '@sentry/react-native';
import { AppState } from 'react-native';

interface PriceUpdate {
  cardId: string;
  price: number;
  changePercent: number;
  timestamp: string;
}

interface PortfolioUpdate {
  totalValue: number;
  changePercent: number;
  topGainers: Array<{ cardId: string; gain: number }>;
  topLosers: Array<{ cardId: string; loss: number }>;
}

interface ServerToClientEvents {
  connected: (data: { id: string; tier: string }) => void;
  'price:update': (data: PriceUpdate) => void;
  'portfolio:update': (data: PortfolioUpdate) => void;
  error: (error: { message: string }) => void;
}

interface ClientToServerEvents {
  'subscribe:card': (cardId: string) => void;
  'unsubscribe:card': (cardId: string) => void;
  'subscribe:portfolio': () => void;
  'unsubscribe:portfolio': () => void;
}

let socketInstance: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

/**
 * Get or create singleton socket instance
 */
export function getSocket(authToken: string): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (!socketInstance) {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

    socketInstance = io(apiUrl, {
      auth: { token: authToken },
      transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log('✓ WebSocket connected:', socketInstance!.id);
      Sentry.addBreadcrumb({
        category: 'websocket',
        message: 'Connected to real-time server',
        level: 'info',
      });
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('✗ WebSocket disconnected:', reason);
      Sentry.addBreadcrumb({
        category: 'websocket',
        message: `Disconnected: ${reason}`,
        level: 'warning',
      });
    });

    socketInstance.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      Sentry.captureException(error, {
        tags: { component: 'websocket' },
      });
    });

    socketInstance.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  return socketInstance;
}

/**
 * Disconnect and cleanup socket
 */
export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

/**
 * React hook for real-time price updates
 */
export function usePriceUpdates(
  cardId: string | null,
  onUpdate: (update: PriceUpdate) => void
) {
  const [isConnected, setIsConnected] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    // Get auth token (from SecureStore or context)
    // For now, use a mock token
    setAuthToken('mock-token-123');
  }, []);

  useEffect(() => {
    if (!authToken || !cardId) return;

    const socket = getSocket(authToken);

    // Subscribe to connection events
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Subscribe to card updates
    socket.emit('subscribe:card', cardId);

    const handlePriceUpdate = (update: PriceUpdate) => {
      if (update.cardId === cardId) {
        onUpdate(update);
      }
    };

    socket.on('price:update', handlePriceUpdate);

    // Cleanup
    return () => {
      socket.emit('unsubscribe:card', cardId);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('price:update', handlePriceUpdate);
    };
  }, [authToken, cardId, onUpdate]);

  return { isConnected };
}

/**
 * React hook for portfolio updates
 */
export function usePortfolioUpdates(onUpdate: (update: PortfolioUpdate) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    // Get auth token
    setAuthToken('mock-token-123');
  }, []);

  useEffect(() => {
    if (!authToken) return;

    const socket = getSocket(authToken);

    // Subscribe to connection events
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Subscribe to portfolio updates
    socket.emit('subscribe:portfolio');

    socket.on('portfolio:update', onUpdate);

    // Cleanup
    return () => {
      socket.emit('unsubscribe:portfolio');
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('portfolio:update', onUpdate);
    };
  }, [authToken, onUpdate]);

  return { isConnected };
}

/**
 * React hook for managing socket lifecycle based on app state
 * Disconnects when app is backgrounded to save battery
 */
export function useSocketLifecycle(authToken: string | null) {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!authToken) return;

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - reconnect
        console.log('App foregrounded - connecting WebSocket');
        const socket = getSocket(authToken);
        if (!socket.connected) {
          socket.connect();
        }
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background - disconnect to save battery
        console.log('App backgrounded - disconnecting WebSocket');
        disconnectSocket();
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [authToken]);
}

export type { PriceUpdate, PortfolioUpdate };

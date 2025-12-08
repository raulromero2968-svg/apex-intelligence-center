/**
 * Real-Time Reports Hook - Subscribe to live report updates via WebSocket
 *
 * Provides reactive connection to Socket.IO server for:
 * - New report notifications in subscribed rooms
 * - Report approval updates
 * - Connection state management
 * - Automatic reconnection with exponential backoff
 *
 * Usage:
 * ```tsx
 * const { reports, isConnected, error } = useRealTimeReports('commons');
 * ```
 *
 * Trade-offs:
 * - Low-latency updates (<100ms)
 * - Reconnection logic handles network issues
 * - Memory usage scales with report history (capped at 100)
 *
 * Reference: knowledge-10-api-realtime.md
 *
 * @module hooks/useRealTimeReports
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// =============================================================================
// TYPES
// =============================================================================

export interface ReportBroadcast {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: string;
  tier: string;
  postedTo: string;
  game: string;
  tags: string[];
  authorId: string;
  authorName?: string;
  publishedAt: string;
}

export interface Notification {
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  receivedAt: Date;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface UseRealTimeReportsOptions {
  /** Room to subscribe to (commons, rc_market) */
  room: string;
  /** Maximum number of reports to keep in memory */
  maxReports?: number;
  /** Enable debug logging */
  debug?: boolean;
  /** Callback when new report arrives */
  onNewReport?: (report: ReportBroadcast) => void;
  /** Callback when report is approved */
  onReportApproved?: (report: ReportBroadcast) => void;
  /** Callback when notification arrives */
  onNotification?: (notification: Notification) => void;
  /** Callback on connection status change */
  onConnectionChange?: (status: ConnectionStatus) => void;
}

export interface UseRealTimeReportsReturn {
  /** List of received reports (newest first) */
  reports: ReportBroadcast[];
  /** List of received notifications */
  notifications: Notification[];
  /** Current connection status */
  status: ConnectionStatus;
  /** Whether connected to server */
  isConnected: boolean;
  /** Connection error if any */
  error: string | null;
  /** Currently subscribed rooms */
  subscribedRooms: string[];
  /** Manually subscribe to additional room */
  subscribe: (room: string) => void;
  /** Manually unsubscribe from room */
  unsubscribe: (room: string) => void;
  /** Clear all received reports */
  clearReports: () => void;
  /** Clear all notifications */
  clearNotifications: () => void;
  /** Manually reconnect */
  reconnect: () => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_MAX_REPORTS = 100;
const MAX_RECONNECTION_ATTEMPTS = 5;
const RECONNECTION_DELAY_MS = 1000;
const RECONNECTION_DELAY_MAX_MS = 30000;

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useRealTimeReports(
  options: UseRealTimeReportsOptions | string
): UseRealTimeReportsReturn {
  // Normalize options
  const opts: UseRealTimeReportsOptions = typeof options === 'string'
    ? { room: options }
    : options;

  const {
    room,
    maxReports = DEFAULT_MAX_REPORTS,
    debug = false,
    onNewReport,
    onReportApproved,
    onNotification,
    onConnectionChange,
  } = opts;

  // State
  const [reports, setReports] = useState<ReportBroadcast[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [subscribedRooms, setSubscribedRooms] = useState<string[]>([]);

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptsRef = useRef(0);

  // Debug logger
  const log = useCallback((...args: unknown[]) => {
    if (debug) {
      console.log('[useRealTimeReports]', ...args);
    }
  }, [debug]);

  // Update status and notify
  const updateStatus = useCallback((newStatus: ConnectionStatus) => {
    setStatus(newStatus);
    onConnectionChange?.(newStatus);
  }, [onConnectionChange]);

  // Get auth token from storage/context
  const getAuthToken = useCallback((): string | null => {
    // Try localStorage first (Supabase pattern)
    if (typeof window !== 'undefined') {
      // Check for Supabase auth token
      const supabaseAuth = localStorage.getItem('supabase.auth.token');
      if (supabaseAuth) {
        try {
          const parsed = JSON.parse(supabaseAuth);
          return parsed.access_token || parsed.currentSession?.access_token || null;
        } catch {
          // Not JSON, might be direct token
        }
      }

      // Check for custom auth token
      const customToken = localStorage.getItem('auth_token');
      if (customToken) return customToken;

      // Check session storage
      const sessionToken = sessionStorage.getItem('auth_token');
      if (sessionToken) return sessionToken;
    }
    return null;
  }, []);

  // Subscribe to room
  const subscribe = useCallback((roomName: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe', roomName);
      log('Subscribing to room:', roomName);
    }
  }, [log]);

  // Unsubscribe from room
  const unsubscribe = useCallback((roomName: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('unsubscribe', roomName);
      setSubscribedRooms((prev) => prev.filter((r) => r !== roomName));
      log('Unsubscribing from room:', roomName);
    }
  }, [log]);

  // Clear reports
  const clearReports = useCallback(() => {
    setReports([]);
  }, []);

  // Clear notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Reconnect
  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current.connect();
    }
  }, []);

  // Initialize socket connection
  useEffect(() => {
    const token = getAuthToken();

    if (!token) {
      log('No auth token available, skipping connection');
      setError('Authentication required');
      updateStatus('error');
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || '';

    log('Initializing WebSocket connection to:', wsUrl);
    updateStatus('connecting');

    const socket = io(wsUrl, {
      path: '/api/ws',
      auth: { token },
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECTION_ATTEMPTS,
      reconnectionDelay: RECONNECTION_DELAY_MS,
      reconnectionDelayMax: RECONNECTION_DELAY_MAX_MS,
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    socketRef.current = socket;

    // -------------------------------------------------------------------------
    // CONNECTION EVENTS
    // -------------------------------------------------------------------------

    socket.on('connect', () => {
      log('Connected to WebSocket server');
      setError(null);
      updateStatus('connected');
      reconnectAttemptsRef.current = 0;

      // Subscribe to initial room
      if (room) {
        socket.emit('subscribe', room);
      }
    });

    socket.on('connected', (data) => {
      log('Connection confirmed:', data);
      setSubscribedRooms(data.rooms.filter((r: string) => !r.startsWith('user:')));
    });

    socket.on('subscribed', (roomName) => {
      log('Subscribed to room:', roomName);
      setSubscribedRooms((prev) => {
        if (prev.includes(roomName)) return prev;
        return [...prev, roomName];
      });
    });

    socket.on('unsubscribed', (roomName) => {
      log('Unsubscribed from room:', roomName);
      setSubscribedRooms((prev) => prev.filter((r) => r !== roomName));
    });

    socket.on('disconnect', (reason) => {
      log('Disconnected:', reason);
      updateStatus('disconnected');

      if (reason === 'io server disconnect') {
        // Server initiated disconnect, need manual reconnect
        setError('Server disconnected');
      }
    });

    socket.on('connect_error', (err) => {
      log('Connection error:', err.message);
      reconnectAttemptsRef.current++;

      if (reconnectAttemptsRef.current >= MAX_RECONNECTION_ATTEMPTS) {
        setError(`Connection failed: ${err.message}`);
        updateStatus('error');
      }
    });

    // -------------------------------------------------------------------------
    // REPORT EVENTS
    // -------------------------------------------------------------------------

    socket.on('new_report', (report: ReportBroadcast) => {
      log('New report received:', report.id);
      setReports((prev) => [report, ...prev].slice(0, maxReports));
      onNewReport?.(report);
    });

    socket.on('report_approved', (report: ReportBroadcast) => {
      log('Report approved:', report.id);
      setReports((prev) => [report, ...prev].slice(0, maxReports));
      onReportApproved?.(report);
    });

    socket.on('report_updated', (report: ReportBroadcast) => {
      log('Report updated:', report.id);
      setReports((prev) => {
        const index = prev.findIndex((r) => r.id === report.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = report;
          return updated;
        }
        return prev;
      });
    });

    // -------------------------------------------------------------------------
    // NOTIFICATION EVENTS
    // -------------------------------------------------------------------------

    socket.on('notification', (notif) => {
      log('Notification received:', notif.type);
      const notification: Notification = {
        ...notif,
        receivedAt: new Date(),
      };
      setNotifications((prev) => [notification, ...prev].slice(0, 50));
      onNotification?.(notification);
    });

    // -------------------------------------------------------------------------
    // ERROR EVENTS
    // -------------------------------------------------------------------------

    socket.on('error', (err) => {
      log('Server error:', err);
      setError(err.message);
    });

    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------

    return () => {
      log('Cleaning up WebSocket connection');
      if (room) {
        socket.emit('unsubscribe', room);
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [room, getAuthToken, log, maxReports, onNewReport, onReportApproved, onNotification, updateStatus]);

  return {
    reports,
    notifications,
    status,
    isConnected: status === 'connected',
    error,
    subscribedRooms,
    subscribe,
    unsubscribe,
    clearReports,
    clearNotifications,
    reconnect,
  };
}

// =============================================================================
// MODERATION HOOK (for admin panel)
// =============================================================================

export interface UseModerationQueueOptions {
  /** Enable debug logging */
  debug?: boolean;
  /** Callback when new pending report arrives */
  onNewPending?: (report: ReportBroadcast) => void;
}

export function useModerationQueue(options: UseModerationQueueOptions = {}) {
  const { debug = false, onNewPending } = options;

  const {
    reports: pendingReports,
    notifications,
    status,
    isConnected,
    error,
    clearReports,
    clearNotifications,
    reconnect,
  } = useRealTimeReports({
    room: 'moderation',
    debug,
    onNewReport: onNewPending,
  });

  return {
    pendingReports,
    notifications,
    status,
    isConnected,
    error,
    clearReports,
    clearNotifications,
    reconnect,
  };
}

export default useRealTimeReports;

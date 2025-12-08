/**
 * WebSocket API Route - Real-Time Report Updates via Socket.IO
 *
 * Provides bidirectional WebSocket communication for:
 * - New report notifications (commons, rc_market rooms)
 * - Report moderation status updates
 * - User-specific notifications
 *
 * Features:
 * - JWT authentication middleware
 * - Room-based subscriptions (commons, rc_market, user:<id>)
 * - Connection state recovery (2 min window)
 * - Heartbeat ping/pong (10s interval, 5s timeout)
 * - Connection limits per user (max 5)
 *
 * Trade-offs:
 * - Stateful connections increase server memory (limit to 10k concurrent)
 * - For Vercel Edge: Use serverless functions; for Phase 3 self-host
 * - Fallback to SSE (/api/reports/stream) for one-way updates
 *
 * Reference: knowledge-10-api-realtime.md
 *
 * @module api/ws
 */

import { NextRequest, NextResponse } from 'next/server';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { jwtVerify } from 'jose';
import * as Sentry from '@sentry/nextjs';

// =============================================================================
// TYPES
// =============================================================================

interface SocketData {
  userId: string;
  email: string;
  role: 'user' | 'admin' | 'moderator';
  authenticated: boolean;
  connectedAt: Date;
}

interface ServerToClientEvents {
  connected: (data: { socketId: string; userId: string; rooms: string[] }) => void;
  new_report: (report: ReportBroadcast) => void;
  report_approved: (report: ReportBroadcast) => void;
  report_updated: (report: ReportBroadcast) => void;
  subscribed: (room: string) => void;
  unsubscribed: (room: string) => void;
  error: (error: { code: string; message: string }) => void;
  notification: (data: { type: string; title: string; body: string; data?: Record<string, unknown> }) => void;
}

interface ClientToServerEvents {
  subscribe: (room: string) => void;
  unsubscribe: (room: string) => void;
  ping: () => void;
}

interface ReportBroadcast {
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

// =============================================================================
// CONSTANTS
// =============================================================================

const ALLOWED_ROOMS = ['commons', 'rc_market', 'notifications', 'moderation'];
const MAX_CONNECTIONS_PER_USER = 5;
const CONNECTION_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes for recovery
const PING_INTERVAL_MS = 10000;
const PING_TIMEOUT_MS = 5000;

// =============================================================================
// GLOBAL SOCKET.IO INSTANCE
// =============================================================================

// Singleton Socket.IO server
let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, {}, SocketData> | null = null;

// Connection tracking per user
const userConnections = new Map<string, Set<string>>();

// =============================================================================
// JWT VERIFICATION
// =============================================================================

async function verifyToken(token: string): Promise<{ userId: string; email: string; role: string } | null> {
  try {
    const jwtSecret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT secret not configured');
      return null;
    }

    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secret);

    return {
      userId: payload.sub as string,
      email: (payload.email as string) || '',
      role: (payload.role as string) || 'user',
    };
  } catch (error) {
    console.warn('JWT verification failed:', error);
    return null;
  }
}

// =============================================================================
// SOCKET.IO SERVER INITIALIZATION
// =============================================================================

function initializeSocketIO(): SocketIOServer<ClientToServerEvents, ServerToClientEvents, {}, SocketData> {
  if (io) return io;

  io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, {}, SocketData>({
    path: '/api/ws',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? [
            'https://apex-intelligence.vercel.app',
            'https://www.apex-intelligence.com',
            process.env.NEXT_PUBLIC_APP_URL || '',
          ].filter(Boolean)
        : '*',
      credentials: true,
    },
    // Connection state recovery for network interruptions
    connectionStateRecovery: {
      maxDisconnectionDuration: CONNECTION_TIMEOUT_MS,
      skipMiddlewares: true,
    },
    // Heartbeat configuration
    pingInterval: PING_INTERVAL_MS,
    pingTimeout: PING_TIMEOUT_MS,
    // Transport configuration
    transports: ['websocket', 'polling'],
  });

  // Setup Redis adapter for horizontal scaling
  const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;
  if (redisUrl) {
    try {
      const pubClient = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        retryStrategy: (times) => Math.min(times * 100, 3000),
      });

      const subClient = pubClient.duplicate();

      io.adapter(createAdapter(pubClient, subClient));
      console.log('[WS] Redis adapter initialized for horizontal scaling');
    } catch (error) {
      console.warn('[WS] Redis adapter failed, running in single-instance mode:', error);
    }
  } else {
    console.warn('[WS] No Redis URL configured - running in single-instance mode');
  }

  // =============================================================================
  // AUTHENTICATION MIDDLEWARE
  // =============================================================================

  io.use(async (socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>, next) => {
    try {
      const token = socket.handshake.auth.token as string | undefined;

      if (!token) {
        return next(new Error('AUTH_REQUIRED: Authentication token required'));
      }

      const user = await verifyToken(token);

      if (!user) {
        return next(new Error('AUTH_INVALID: Invalid or expired token'));
      }

      // Check connection limit per user
      const existingConnections = userConnections.get(user.userId) || new Set();
      if (existingConnections.size >= MAX_CONNECTIONS_PER_USER) {
        return next(new Error('CONNECTION_LIMIT: Maximum connections per user exceeded'));
      }

      // Attach user data to socket
      socket.data.userId = user.userId;
      socket.data.email = user.email;
      socket.data.role = user.role as 'user' | 'admin' | 'moderator';
      socket.data.authenticated = true;
      socket.data.connectedAt = new Date();

      next();
    } catch (error) {
      Sentry.captureException(error, { extra: { context: 'ws_auth_middleware' } });
      next(new Error('AUTH_ERROR: Authentication failed'));
    }
  });

  // =============================================================================
  // CONNECTION HANDLER
  // =============================================================================

  io.on('connection', (socket) => {
    const { userId, role } = socket.data;

    console.log(`[WS] User ${userId} connected (${role}) - socket ${socket.id}`);

    // Track connection
    if (!userConnections.has(userId)) {
      userConnections.set(userId, new Set());
    }
    userConnections.get(userId)!.add(socket.id);

    // Join user-specific room for targeted notifications
    socket.join(`user:${userId}`);

    // Auto-join moderation room for admins
    if (role === 'admin' || role === 'moderator') {
      socket.join('moderation');
    }

    // Send connection confirmation
    socket.emit('connected', {
      socketId: socket.id,
      userId,
      rooms: Array.from(socket.rooms),
    });

    // -------------------------------------------------------------------------
    // ROOM SUBSCRIPTION HANDLERS
    // -------------------------------------------------------------------------

    socket.on('subscribe', (room: string) => {
      // Validate room name
      if (!ALLOWED_ROOMS.includes(room) && !room.startsWith('card:') && !room.startsWith('market:')) {
        socket.emit('error', { code: 'INVALID_ROOM', message: `Room "${room}" is not allowed` });
        return;
      }

      // Moderation room requires admin/moderator role
      if (room === 'moderation' && !['admin', 'moderator'].includes(role)) {
        socket.emit('error', { code: 'UNAUTHORIZED', message: 'Moderation room requires admin access' });
        return;
      }

      socket.join(room);
      socket.emit('subscribed', room);
      console.log(`[WS] User ${userId} subscribed to room: ${room}`);
    });

    socket.on('unsubscribe', (room: string) => {
      socket.leave(room);
      socket.emit('unsubscribed', room);
      console.log(`[WS] User ${userId} unsubscribed from room: ${room}`);
    });

    // -------------------------------------------------------------------------
    // HEARTBEAT HANDLER
    // -------------------------------------------------------------------------

    socket.on('ping', () => {
      // Client-initiated ping for connection health check
      // Response is automatic via Socket.IO's built-in pong
    });

    // -------------------------------------------------------------------------
    // DISCONNECTION HANDLER
    // -------------------------------------------------------------------------

    socket.on('disconnect', (reason) => {
      console.log(`[WS] User ${userId} disconnected: ${reason}`);

      // Clean up connection tracking
      const connections = userConnections.get(userId);
      if (connections) {
        connections.delete(socket.id);
        if (connections.size === 0) {
          userConnections.delete(userId);
        }
      }

      // Log for analytics
      Sentry.addBreadcrumb({
        category: 'websocket',
        message: `User disconnected: ${userId}`,
        level: 'info',
        data: { reason, socketId: socket.id },
      });
    });

    // -------------------------------------------------------------------------
    // ERROR HANDLER
    // -------------------------------------------------------------------------

    socket.on('error', (error) => {
      console.error(`[WS] Socket error for user ${userId}:`, error);
      Sentry.captureException(error, {
        extra: { userId, socketId: socket.id },
      });
    });
  });

  // Store io instance globally for use in other routes
  (global as any).__socketIO = io;

  return io;
}

// =============================================================================
// BROADCAST FUNCTIONS (Export for use in other routes)
// =============================================================================

/**
 * Broadcast new report to relevant rooms
 */
export function broadcastNewReport(report: ReportBroadcast): void {
  const ioInstance = (global as any).__socketIO as SocketIOServer<ClientToServerEvents, ServerToClientEvents, {}, SocketData> | undefined;
  if (!ioInstance) return;

  // Determine target rooms based on postedTo
  const rooms: string[] = [];
  if (report.postedTo === 'commons' || report.postedTo === 'both') {
    rooms.push('commons');
  }
  if (report.postedTo === 'rc_market' || report.postedTo === 'both') {
    rooms.push('rc_market');
  }

  rooms.forEach((room) => {
    ioInstance.to(room).emit('new_report', report);
  });

  console.log(`[WS] Broadcasted new report ${report.id} to rooms: ${rooms.join(', ')}`);
}

/**
 * Broadcast approved report to relevant rooms
 */
export function broadcastApprovedReport(report: ReportBroadcast): void {
  const ioInstance = (global as any).__socketIO as SocketIOServer<ClientToServerEvents, ServerToClientEvents, {}, SocketData> | undefined;
  if (!ioInstance) return;

  // Determine target rooms based on postedTo
  const rooms: string[] = [];
  if (report.postedTo === 'commons' || report.postedTo === 'both') {
    rooms.push('commons');
  }
  if (report.postedTo === 'rc_market' || report.postedTo === 'both') {
    rooms.push('rc_market');
  }

  rooms.forEach((room) => {
    ioInstance.to(room).emit('report_approved', report);
  });

  // Notify moderators
  ioInstance.to('moderation').emit('notification', {
    type: 'report_approved',
    title: 'Report Approved',
    body: `Report "${report.title}" has been approved`,
    data: { reportId: report.id },
  });

  console.log(`[WS] Broadcasted approved report ${report.id} to rooms: ${rooms.join(', ')}`);
}

/**
 * Send notification to specific user
 */
export function sendUserNotification(
  userId: string,
  notification: { type: string; title: string; body: string; data?: Record<string, unknown> }
): void {
  const ioInstance = (global as any).__socketIO as SocketIOServer<ClientToServerEvents, ServerToClientEvents, {}, SocketData> | undefined;
  if (!ioInstance) return;

  ioInstance.to(`user:${userId}`).emit('notification', notification);
  console.log(`[WS] Sent notification to user ${userId}: ${notification.type}`);
}

/**
 * Broadcast to moderation room
 */
export function broadcastToModeration(
  eventType: 'new_report' | 'report_updated',
  report: ReportBroadcast
): void {
  const ioInstance = (global as any).__socketIO as SocketIOServer<ClientToServerEvents, ServerToClientEvents, {}, SocketData> | undefined;
  if (!ioInstance) return;

  if (eventType === 'new_report') {
    ioInstance.to('moderation').emit('new_report', report);
  } else {
    ioInstance.to('moderation').emit('report_updated', report);
  }

  console.log(`[WS] Broadcasted ${eventType} to moderation room: ${report.id}`);
}

/**
 * Get connection statistics
 */
export function getConnectionStats(): { totalConnections: number; uniqueUsers: number; roomCounts: Record<string, number> } {
  const ioInstance = (global as any).__socketIO as SocketIOServer<ClientToServerEvents, ServerToClientEvents, {}, SocketData> | undefined;

  if (!ioInstance) {
    return { totalConnections: 0, uniqueUsers: 0, roomCounts: {} };
  }

  const sockets = ioInstance.sockets.sockets;
  const roomCounts: Record<string, number> = {};

  for (const [, socket] of sockets) {
    for (const room of socket.rooms) {
      roomCounts[room] = (roomCounts[room] || 0) + 1;
    }
  }

  return {
    totalConnections: sockets.size,
    uniqueUsers: userConnections.size,
    roomCounts,
  };
}

// =============================================================================
// HTTP HANDLER (for health check and stats)
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    // Initialize Socket.IO server if not already done
    initializeSocketIO();

    const stats = getConnectionStats();

    return NextResponse.json({
      success: true,
      status: 'running',
      stats,
      config: {
        maxConnectionsPerUser: MAX_CONNECTIONS_PER_USER,
        connectionTimeoutMs: CONNECTION_TIMEOUT_MS,
        pingIntervalMs: PING_INTERVAL_MS,
        allowedRooms: ALLOWED_ROOMS,
      },
    });
  } catch (error) {
    console.error('[WS] Initialization error:', error);
    Sentry.captureException(error);

    return NextResponse.json(
      { success: false, error: 'WebSocket server initialization failed' },
      { status: 500 }
    );
  }
}

// =============================================================================
// RUNTIME CONFIGURATION
// =============================================================================

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

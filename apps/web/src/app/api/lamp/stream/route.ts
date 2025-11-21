/**
 * LAMP Simulation Streaming API - Server-Sent Events (SSE)
 *
 * Real-time LAMP simulation updates via Redis pub/sub
 *
 * Features:
 * - Enterprise tier only authentication
 * - SSE connection for real-time simulation events
 * - Subscribes to Redis pub/sub channel "lamp:simulation"
 * - Rate limiting with configurable timeouts
 * - Auto-cleanup on disconnect
 * - Heartbeat to keep connection alive
 * - Production-ready error handling
 *
 * Client usage:
 * const eventSource = new EventSource('/api/lamp/stream', {
 *   headers: { Authorization: 'Bearer <token>' }
 * });
 * eventSource.onmessage = (e) => {
 *   const event = JSON.parse(e.data);
 *   console.log('LAMP event:', event);
 * };
 *
 * Production patterns from knowledge-10-api-realtime.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/jwt';
import { ratelimit, getLimitForTier, getRetryAfter } from '@/lib/rate-limit';
import Redis from 'ioredis';

// Configuration
const STREAM_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const HEARTBEAT_INTERVAL_MS = 15 * 1000; // 15 seconds
const REDIS_CHANNEL = 'lamp:simulation';
const MAX_RECONNECT_ATTEMPTS = 3;

// Rate limiting configuration for streaming
const STREAM_RATE_LIMIT = {
  requests: 10, // 10 connections per window
  window: 60, // 60 seconds
};

/**
 * LAMP simulation event types
 */
interface LAMPSimulationEvent {
  type: 'simulation_update' | 'particle_state' | 'phase_transition' | 'error';
  timestamp: string;
  data: Record<string, any>;
  metadata?: {
    simulationId?: string;
    iteration?: number;
    phase?: string;
  };
}

/**
 * GET /api/lamp/stream - SSE endpoint for LAMP simulation events
 *
 * @returns SSE stream with LAMP simulation updates
 */
export async function GET(req: NextRequest) {
  // 1. Authenticate user
  const user = await getUserFromRequest(req);
  if (!user) {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized', message: 'Authentication required' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // 2. Enforce enterprise tier requirement
  if (user.subscriptionTier !== 'enterprise') {
    return new NextResponse(
      JSON.stringify({
        error: 'Forbidden',
        message: 'LAMP simulation streaming requires Enterprise tier',
        tier: user.subscriptionTier,
        upgradeUrl: '/pricing',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // 3. Rate limiting (per user, per endpoint)
  const rateLimitKey = `lamp:stream:${user.id}`;
  const { success, limit, remaining, reset } = await ratelimit(
    STREAM_RATE_LIMIT.requests,
    rateLimitKey,
    STREAM_RATE_LIMIT.window
  );

  if (!success) {
    const retryAfter = getRetryAfter(reset);
    return new NextResponse(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: `Too many stream connections. Try again in ${retryAfter} seconds.`,
        limit,
        remaining,
        resetAt: new Date(reset).toISOString(),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': Math.floor(reset / 1000).toString(),
        },
      }
    );
  }

  // 4. Create SSE stream
  const encoder = new TextEncoder();
  let subscriber: Redis | null = null;
  let heartbeatInterval: NodeJS.Timeout | null = null;
  let timeoutTimer: NodeJS.Timeout | null = null;
  let reconnectAttempts = 0;

  const stream = new ReadableStream({
    async start(controller) {
      /**
       * Helper to send SSE events
       */
      const sendEvent = (event: string, data: any) => {
        try {
          const payload = JSON.stringify(data);
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${payload}\n\n`));
        } catch (error) {
          console.error('[LAMP Stream] Error encoding event:', error);
        }
      };

      /**
       * Helper to send error and close stream
       */
      const handleError = (error: Error, fatal: boolean = false) => {
        console.error('[LAMP Stream] Error:', error);
        sendEvent('error', {
          type: 'error',
          message: error.message,
          fatal,
          timestamp: new Date().toISOString(),
        });

        if (fatal) {
          cleanup();
          try {
            controller.close();
          } catch (e) {
            // Already closed
          }
        }
      };

      /**
       * Cleanup function
       */
      const cleanup = () => {
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }

        if (timeoutTimer) {
          clearTimeout(timeoutTimer);
          timeoutTimer = null;
        }

        if (subscriber) {
          subscriber.unsubscribe(REDIS_CHANNEL);
          subscriber.quit();
          subscriber = null;
        }
      };

      /**
       * Setup Redis subscriber with reconnection logic
       */
      const setupRedisSubscriber = async () => {
        try {
          // Check if REDIS_URL is configured
          if (!process.env.REDIS_URL) {
            handleError(
              new Error('Redis not configured. Set REDIS_URL environment variable.'),
              true
            );
            return;
          }

          // Create Redis subscriber client
          subscriber = new Redis(process.env.REDIS_URL, {
            retryStrategy: (times) => {
              if (times > MAX_RECONNECT_ATTEMPTS) {
                handleError(new Error('Redis connection failed after max retries'), true);
                return null;
              }
              reconnectAttempts = times;
              return Math.min(times * 1000, 3000); // Exponential backoff, max 3s
            },
            enableReadyCheck: true,
            maxRetriesPerRequest: 3,
          });

          // Subscribe to LAMP simulation channel
          await subscriber.subscribe(REDIS_CHANNEL);

          // Send connection confirmation
          sendEvent('connected', {
            type: 'connected',
            message: 'LAMP simulation stream connected',
            userId: user.id,
            tier: user.subscriptionTier,
            channel: REDIS_CHANNEL,
            timestamp: new Date().toISOString(),
            config: {
              timeout: STREAM_TIMEOUT_MS,
              heartbeat: HEARTBEAT_INTERVAL_MS,
            },
          });

          // Handle incoming messages from Redis
          subscriber.on('message', (channel, message) => {
            if (channel !== REDIS_CHANNEL) return;

            try {
              const event: LAMPSimulationEvent = JSON.parse(message);
              sendEvent('lamp_event', event);
            } catch (error) {
              console.error('[LAMP Stream] Error parsing Redis message:', error);
              sendEvent('parse_error', {
                type: 'error',
                message: 'Failed to parse simulation event',
                timestamp: new Date().toISOString(),
              });
            }
          });

          // Handle Redis errors
          subscriber.on('error', (error) => {
            console.error('[LAMP Stream] Redis error:', error);
            handleError(error, false);
          });

          // Handle Redis reconnection
          subscriber.on('reconnecting', () => {
            sendEvent('reconnecting', {
              type: 'reconnecting',
              message: 'Reconnecting to simulation stream',
              attempt: reconnectAttempts,
              timestamp: new Date().toISOString(),
            });
          });

          // Handle successful reconnection
          subscriber.on('ready', () => {
            if (reconnectAttempts > 0) {
              sendEvent('reconnected', {
                type: 'reconnected',
                message: 'Reconnected to simulation stream',
                timestamp: new Date().toISOString(),
              });
              reconnectAttempts = 0;
            }
          });
        } catch (error) {
          handleError(error as Error, true);
        }
      };

      // Initialize Redis subscriber
      await setupRedisSubscriber();

      // Setup heartbeat to keep connection alive
      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch (error) {
          cleanup();
        }
      }, HEARTBEAT_INTERVAL_MS);

      // Setup timeout to prevent indefinite connections
      timeoutTimer = setTimeout(() => {
        sendEvent('timeout', {
          type: 'timeout',
          message: `Stream timeout after ${STREAM_TIMEOUT_MS / 1000} seconds`,
          timestamp: new Date().toISOString(),
        });
        cleanup();
        try {
          controller.close();
        } catch (error) {
          // Already closed
        }
      }, STREAM_TIMEOUT_MS);

      // Cleanup on client disconnect
      req.signal.addEventListener('abort', () => {
        console.log('[LAMP Stream] Client disconnected');
        cleanup();
        try {
          controller.close();
        } catch (error) {
          // Already closed
        }
      });
    },

    cancel() {
      // Called when stream is cancelled by client
      console.log('[LAMP Stream] Stream cancelled by client');
    },
  });

  // 5. Return SSE response with proper headers
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Content-Encoding': 'none',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': Math.floor(reset / 1000).toString(),
    },
  });
}

// Required Next.js config exports
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Required for Redis pub/sub connections
export const maxDuration = 300; // 5 minutes max (Vercel limit)

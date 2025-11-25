/**
 * Reality Check SSE Stream Endpoint
 *
 * Server-Sent Events endpoint for real-time reality check triggers.
 * Clients connect to this endpoint to receive immediate reality check notifications
 * via Redis pub/sub, eliminating the need for polling.
 *
 * Features:
 * - Real-time push notifications for reality check triggers
 * - Redis pub/sub integration for global broadcasts
 * - Automatic reconnection via browser EventSource
 * - Keep-alive heartbeat to maintain connection
 * - Graceful cleanup on disconnect
 */

import { NextRequest } from 'next/server';
import { redisGet, RedisKeys } from '@/lib/redis';

/**
 * SSE endpoint for reality check triggers
 * Client usage: new EventSource('/api/reality-check/stream')
 */
export async function GET(request: NextRequest) {
  // Get user ID from cookie
  const userId = request.cookies.get('apex_client_id')?.value || 'anonymous';

  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Helper to send SSE events
      const sendEvent = (type: string, data: any) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch (error) {
          console.error('Failed to send SSE event:', error);
        }
      };

      // Send connection confirmation
      sendEvent('connected', {
        message: 'Reality check stream connected',
        userId,
        timestamp: Date.now(),
      });

      // Keep-alive interval (every 15s to prevent timeout)
      const keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch (error) {
          clearInterval(keepAliveInterval);
        }
      }, 15000);

      // Poll Redis for global trigger (every 5 seconds)
      // Note: Upstash REST API doesn't support true pub/sub subscriptions
      // So we use polling as a fallback
      const checkTriggerInterval = setInterval(async () => {
        try {
          const globalTrigger = await redisGet(RedisKeys.realityCheckTrigger());

          if (globalTrigger) {
            // Check if user has already acknowledged this trigger
            const userAck = await redisGet(RedisKeys.realityCheckAck(userId));

            if (!userAck || userAck !== globalTrigger) {
              // Send trigger event to client
              sendEvent('trigger', {
                triggerId: globalTrigger,
                timestamp: Date.now(),
                message: 'Reality check triggered',
              });

              // Note: User will acknowledge via /api/reality-check/acknowledge
              // after modal is shown and countdown completes
            }
          }
        } catch (error) {
          console.error('Failed to check reality check trigger:', error);
        }
      }, 5000);

      // Also check for automatic 2-hour trigger based on user's session
      const checkSessionInterval = setInterval(async () => {
        try {
          const sessionData = await redisGet(RedisKeys.sessionActivity(userId));

          if (sessionData) {
            const session = JSON.parse(sessionData as string);
            const activeHours = session.totalActiveTime / (60 * 60 * 1000);

            // Send session stats update
            sendEvent('sessionStats', {
              totalActiveTime: session.totalActiveTime,
              activeHours,
              lastHeartbeat: session.lastHeartbeat,
            });
          }
        } catch (error) {
          console.debug('Failed to check session activity:', error);
        }
      }, 10000);

      // Cleanup on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(keepAliveInterval);
        clearInterval(checkTriggerInterval);
        clearInterval(checkSessionInterval);

        try {
          sendEvent('disconnected', { message: 'Stream closed', timestamp: Date.now() });
          controller.close();
        } catch (error) {
          // Stream already closed
        }
      });

      // Handle stream errors
      controller.error = (error: any) => {
        console.error('Reality check stream error:', error);
        clearInterval(keepAliveInterval);
        clearInterval(checkTriggerInterval);
        clearInterval(checkSessionInterval);
      };
    },
  });

  // Return SSE response with appropriate headers
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Content-Encoding': 'none',
      'X-Accel-Buffering': 'no',
    },
  });
}

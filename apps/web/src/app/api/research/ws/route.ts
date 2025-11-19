/**
 * WebSocket Live Price Deltas for Research
 *
 * - Node runtime required for WebSocket support
 * - Uses Upstash Redis Pub/Sub for real-time price updates
 * - Channel: research:${sessionId}
 * - Feature-flagged behind FEATURE_LIVE_PRICES=1
 */

import { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Lazy getter for Redis client
let redisInstance: Redis | null = null;

function getRedis(): Redis | null {
  if (redisInstance) return redisInstance;

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      redisInstance = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      return redisInstance;
    } catch (error) {
      console.warn('Failed to initialize Upstash Redis:', error);
      return null;
    }
  }

  return null;
}

interface PriceDelta {
  symbol: string;
  priceChange: number;
  percentChange: number;
  timestamp: number;
}

export async function GET(req: NextRequest) {
  // Check feature flag
  if (process.env.FEATURE_LIVE_PRICES !== '1') {
    return new Response('Feature not enabled', { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return new Response('Missing sessionId parameter', { status: 400 });
  }

  const redis = getRedis();
  if (!redis) {
    return new Response('Redis not configured', { status: 503 });
  }

  // Create a readable stream for WebSocket-like SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const channel = `research:${sessionId}`;

      let heartbeatInterval: NodeJS.Timeout | null = null;
      let isActive = true;

      // Heartbeat to keep connection alive
      const sendHeartbeat = () => {
        if (!isActive) return;
        try {
          controller.enqueue(encoder.encode('event: ping\ndata: {}\n\n'));
        } catch (error) {
          console.error('Failed to send heartbeat:', error);
          cleanup();
        }
      };

      // Start heartbeat every 20 seconds
      heartbeatInterval = setInterval(sendHeartbeat, 20000);

      // Track last seen timestamp to avoid duplicate messages
      let lastSeenTimestamp = Date.now();

      // Subscribe to Redis channel
      const pollMessages = async () => {
        try {
          while (isActive) {
            try {
              // Scan for keys matching our channel pattern
              const pattern = `${channel}:*`;
              const keys = await (redis as any).keys(pattern) as string[];

              if (keys && keys.length > 0) {
                // Sort keys by timestamp (newest first)
                const sortedKeys = keys.sort().reverse();

                for (const key of sortedKeys) {
                  // Extract timestamp from key
                  const timestamp = parseInt(key.split(':').pop() || '0', 10);

                  // Only process messages newer than last seen
                  if (timestamp > lastSeenTimestamp) {
                    const message = await (redis as any).get(key);

                    if (message && isActive) {
                      const data = typeof message === 'string' ? message : JSON.stringify(message);
                      controller.enqueue(
                        encoder.encode(`event: price-delta\ndata: ${data}\n\n`)
                      );

                      lastSeenTimestamp = timestamp;

                      // Delete processed key to avoid reprocessing
                      await (redis as any).del(key);
                    }
                  }
                }
              }
            } catch (pollError) {
              console.error('Error in poll iteration:', pollError);
              // Continue polling despite errors
            }

            // Wait 1 second before next poll to avoid hammering Redis
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error('Error polling messages:', error);
          if (isActive) {
            controller.enqueue(
              encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'Connection error' })}\n\n`)
            );
          }
        } finally {
          cleanup();
        }
      };

      const cleanup = () => {
        isActive = false;
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }
        try {
          controller.close();
        } catch (error) {
          // Controller already closed
        }
      };

      // Handle client disconnect
      req.signal.addEventListener('abort', cleanup);

      // Start polling
      pollMessages();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

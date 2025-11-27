/**
 * Real-Time Price Updates API
 *
 * SSE endpoint for streaming real-time price deltas for cards mentioned in RAG responses
 * Uses Upstash Redis Pub/Sub pattern (Coinbase-style)
 *
 * Flow:
 * 1. RAG endpoint adds mentioned cards to Redis set: rag:prices:{sessionId}
 * 2. Client connects to this endpoint with sessionId
 * 3. Server subscribes to price updates for those cards
 * 4. Server streams price deltas via SSE
 *
 * Note: For production WebSocket, consider using Socket.IO or a dedicated WebSocket server
 * This SSE implementation works well with Vercel/serverless deployments
 */

import { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';
import * as Sentry from '@sentry/nextjs';

type SpanLike = {
  setAttribute: (key: string, value: unknown) => void;
  end?: () => void;
  setStatus?: (status: string) => void;
} | undefined;

let redis: Redis | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch (error) {
  console.warn('Failed to initialize Upstash Redis for price updates:', error);
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/rag/prices?sessionId=xxx
 *
 * SSE endpoint for real-time price updates
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return new Response(
      JSON.stringify({ error: 'Missing sessionId parameter' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  if (!redis) {
    return new Response(
      JSON.stringify({
        error: 'Redis not configured. Price updates unavailable.',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return Sentry.startSpan(
    { name: 'api.rag.prices', op: 'sse' },
    async (span: SpanLike) => {
      span?.setAttribute('sessionId', sessionId);

      // Create SSE stream
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();

          // Helper to send SSE message
          const sendEvent = (event: string, data: any) => {
            const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(message));
          };

          try {
            // Get watched cards for this session
            const watchedCards = (await (redis as any)!.smembers(`rag:prices:${sessionId}`)) as string[];

            if (!watchedCards || watchedCards.length === 0) {
              sendEvent('info', {
                message: 'No cards being monitored for this session',
                sessionId,
              });
              controller.close();
              return;
            }

            span?.setAttribute('watchedCardCount', watchedCards.length);

            // Send initial connection message
            sendEvent('connected', {
              sessionId,
              watchedCards,
              timestamp: new Date().toISOString(),
            });

            // Polling interval (every 30 seconds)
            // In a real WebSocket implementation, this would use Redis Pub/Sub
            const pollInterval = 30000;
            const maxDuration = 300000; // 5 minutes max connection
            const startTime = Date.now();

            const poll = async () => {
              try {
                // Check if connection should close
                if (Date.now() - startTime > maxDuration) {
                  sendEvent('timeout', {
                    message: 'Max connection duration reached',
                  });
                  controller.close();
                  return;
                }

                // Simulate price updates (replace with actual price API calls)
                for (const card of watchedCards) {
                  // In production, fetch from your price data source
                  // For now, send mock updates
                  const mockPriceUpdate = {
                    card: card as string,
                    price: Math.random() * 1000,
                    change: (Math.random() - 0.5) * 100,
                    timestamp: new Date().toISOString(),
                  };

                  sendEvent('price-update', mockPriceUpdate);

                  // Store last update in Redis (optional, for debugging)
                  await (redis as any)!.hset(
                    `rag:price-updates:${sessionId}`,
                    card as string,
                    JSON.stringify(mockPriceUpdate)
                  );
                }

                // Send heartbeat
                sendEvent('heartbeat', {
                  timestamp: new Date().toISOString(),
                  watchedCards: watchedCards.length,
                });

                // Schedule next poll
                setTimeout(poll, pollInterval);
              } catch (pollError) {
                console.error('Price polling error:', pollError);
                Sentry.captureException(pollError, {
                  extra: { sessionId, watchedCards },
                });

                sendEvent('error', {
                  message: 'Error fetching price updates',
                });
              }
            };

            // Start polling
            await poll();

          } catch (error) {
            console.error('Price stream error:', error);
            Sentry.captureException(error, {
              extra: { sessionId },
            });

            sendEvent('error', {
              message: error instanceof Error ? error.message : 'Unknown error',
            });
            controller.close();
          }
        },

        cancel() {
          // Cleanup when client disconnects
          console.log(`Price stream cancelled for session: ${sessionId}`);
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
  );
}

/**
 * POST /api/rag/prices
 *
 * Add/remove cards from price watch list for a session
 */
export async function POST(request: NextRequest) {
  if (!redis) {
    return new Response(
      JSON.stringify({ error: 'Redis not configured' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const body = await request.json();
    const { sessionId, action, cards } = body;

    if (!sessionId || !action || !cards || !Array.isArray(cards)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request. Required: sessionId, action, cards[]',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const key = `rag:prices:${sessionId}`;

    if (action === 'add') {
      await (redis as any).sadd(key, ...cards);
      await (redis as any).expire(key, 3600); // 1 hour TTL
    } else if (action === 'remove') {
      await (redis as any).srem(key, ...cards);
    } else if (action === 'clear') {
      await (redis as any).del(key);
    } else {
      return new Response(
        JSON.stringify({
          error: 'Invalid action. Must be: add, remove, or clear',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const watchedCards = (await (redis as any).smembers(key)) as string[];

    return new Response(
      JSON.stringify({
        success: true,
        sessionId,
        action,
        watchedCards,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    Sentry.captureException(error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}


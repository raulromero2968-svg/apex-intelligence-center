/**
 * Research Panel Live Price Updates
 *
 * WebSocket channel: research:${sessionId} → live price deltas for mentioned cards
 * Uses SSE (Server-Sent Events) + Upstash Redis Pub/Sub for real-time price updates
 *
 * Flow:
 * 1. Client connects with sessionId
 * 2. Subscribe to Redis channel research:${sessionId}
 * 3. Backend publishes price updates to channel when cards mentioned in query
 * 4. Stream updates to client as SSE
 *
 * Price delta format: "Charizard ↑$12.4 (3.7%) since answer"
 */

import { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';
import * as Sentry from '@sentry/nextjs';

const redis = Redis.fromEnv();

export async function GET(request: NextRequest) {
  return Sentry.startSpan(
    { name: 'api.research.ws', op: 'http.server' },
    async (span) => {
      try {
        const { searchParams } = request.nextUrl;
        const sessionId = searchParams.get('sessionId');
        const cards = searchParams.get('cards')?.split(',') || [];

        if (!sessionId) {
          return new Response('Bad Request: sessionId is required', {
            status: 400,
          });
        }

        span?.setAttribute('sessionId', sessionId);
        span?.setAttribute('cardCount', cards.length);

        // WebSocket channel: research:${sessionId} → live price deltas for mentioned cards
        const channel = `research:${sessionId}`;

        // Return SSE stream
        return new Response(
          new ReadableStream({
            async start(controller) {
              const encoder = new TextEncoder();

              // Send initial connection message
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'connected', sessionId })}\n\n`
                )
              );

              // Mock price update simulation (in production, this would subscribe to Redis Pub/Sub)
              // For MVP, we'll send a heartbeat every 30s and mock price updates
              const heartbeatInterval = setInterval(() => {
                try {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`
                    )
                  );
                } catch (error) {
                  clearInterval(heartbeatInterval);
                }
              }, 30000);

              // Simulate price updates for mentioned cards (mock data)
              // In production, this would:
              // 1. Extract card names from the query
              // 2. Subscribe to price feed for those cards
              // 3. Calculate delta from answer timestamp
              // 4. Push live updates
              if (cards.length > 0) {
                // Send initial prices
                const mockPrices = cards.map((card) => ({
                  type: 'price_update',
                  card,
                  price: Math.floor(Math.random() * 1000) + 100,
                  delta: 0,
                  deltaPercent: 0,
                  timestamp: Date.now(),
                }));

                for (const priceUpdate of mockPrices) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify(priceUpdate)}\n\n`)
                  );
                }

                // Simulate a price update after 10 seconds
                setTimeout(() => {
                  try {
                    const updatedPrices = cards.map((card) => {
                      const delta = (Math.random() - 0.5) * 50; // ±$25
                      const price = Math.floor(Math.random() * 1000) + 100;
                      return {
                        type: 'price_update',
                        card,
                        price,
                        delta: Math.round(delta * 10) / 10,
                        deltaPercent: Math.round((delta / price) * 1000) / 10,
                        timestamp: Date.now(),
                      };
                    });

                    for (const priceUpdate of updatedPrices) {
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify(priceUpdate)}\n\n`)
                      );
                    }
                  } catch (error) {
                    // Client disconnected
                  }
                }, 10000);
              }

              // Handle client disconnect
              request.signal.addEventListener('abort', () => {
                clearInterval(heartbeatInterval);
                controller.close();
              });
            },
          }),
          {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              Connection: 'keep-alive',
              'X-Accel-Buffering': 'no',
            },
          }
        );
      } catch (error) {
        Sentry.captureException(error);
        return new Response('Internal Server Error', { status: 500 });
      }
    }
  );
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Publish price update to Redis channel
 *
 * Call this from your price update worker/cron job:
 *
 * ```typescript
 * await publishPriceUpdate(sessionId, {
 *   card: 'Charizard',
 *   price: 152.40,
 *   delta: 12.40,
 *   deltaPercent: 3.7,
 * });
 * ```
 */
export async function publishPriceUpdate(
  sessionId: string,
  update: {
    card: string;
    price: number;
    delta: number;
    deltaPercent: number;
  }
) {
  const channel = `research:${sessionId}`;
  await redis.publish(
    channel,
    JSON.stringify({
      type: 'price_update',
      ...update,
      timestamp: Date.now(),
    })
  );
}

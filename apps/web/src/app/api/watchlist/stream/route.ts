/**
 * Watchlist Streaming API - Server-Sent Events (SSE)
 *
 * Real-time price updates for cards in user's watchlist via Redis pub/sub
 *
 * Features:
 * - SSE connection for real-time updates
 * - Subscribes to Redis pub/sub for all watched cards
 * - Auto-cleanup on disconnect
 * - Heartbeat to keep connection alive
 *
 * Client usage:
 * const eventSource = new EventSource('/api/watchlist/stream');
 * eventSource.onmessage = (e) => {
 *   const update = JSON.parse(e.data);
 *   console.log('Price update:', update);
 * };
 *
 * Production patterns from knowledge-10-api-realtime.md
 */

import { NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/db';
import { watchlistItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Redis from 'ioredis';

// Note: We use ioredis for pub/sub because @upstash/redis doesn't support
// long-lived subscriptions in serverless environments.
// For production, consider using a dedicated Redis instance or Upstash with WebSockets.

/**
 * GET /api/watchlist/stream - SSE endpoint for real-time price updates
 */
export async function GET(req: NextRequest) {
  // Authenticate user
  const user = await getUserFromRequest(req);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Fetch user's watchlist
  const watchedCards = await db
    .select({ cardId: watchlistItems.cardId })
    .from(watchlistItems)
    .where(eq(watchlistItems.userId, user.id));

  if (watchedCards.length === 0) {
    return new Response('No cards in watchlist', { status: 400 });
  }

  // Create readable stream for SSE
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected', count: watchedCards.length })}\n\n`)
      );

      // Create Redis subscriber client
      // Note: This requires REDIS_URL env var (different from UPSTASH_REDIS_REST_URL)
      // For serverless, consider using Upstash Redis with WebSockets or polling instead
      let subscriber: Redis | null = null;

      try {
        // Only use pub/sub if REDIS_URL is available (not in all environments)
        if (process.env.REDIS_URL) {
          subscriber = new Redis(process.env.REDIS_URL);

          // Subscribe to price update channels for all watched cards
          const channels = watchedCards.map(({ cardId }) => `price:update:${cardId}`);
          await subscriber.subscribe(...channels);

          // Handle incoming messages
          subscriber.on('message', (channel, message) => {
            try {
              const data = JSON.parse(message);
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'price_update', ...data })}\n\n`)
              );
            } catch (error) {
              console.error('Error parsing Redis message:', error);
            }
          });

          subscriber.on('error', (error) => {
            console.error('Redis subscriber error:', error);
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Connection error' })}\n\n`)
            );
          });
        } else {
          // Fallback: Send a message indicating polling should be used instead
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'info',
                message: 'Real-time updates not available. Use polling instead.',
              })}\n\n`
            )
          );
        }

        // Send heartbeat every 30 seconds to keep connection alive
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(': heartbeat\n\n'));
          } catch (error) {
            clearInterval(heartbeat);
          }
        }, 30000);

        // Clean up on abort
        req.signal.addEventListener('abort', async () => {
          clearInterval(heartbeat);
          if (subscriber) {
            await subscriber.quit();
          }
          try {
            controller.close();
          } catch (error) {
            // Already closed
          }
        });
      } catch (error) {
        console.error('Error setting up stream:', error);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Setup failed' })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}

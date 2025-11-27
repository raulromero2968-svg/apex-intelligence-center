import { NextRequest } from 'next/server';
import Redis from 'ioredis';
import { arbitrageOpportunityChannel, type ArbitrageEvent } from '@apex/shared';

// Force dynamic to prevent static generation during build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getRedisClient() {
  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL environment variable is required');
  }
  return new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: ArbitrageEvent) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      const sendError = (error: Error) => {
        const message = `event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Subscribe to Redis channel
      const subscriber = redis.duplicate();
      await subscriber.connect();

      subscriber.subscribe(arbitrageOpportunityChannel(), (err) => {
        if (err) {
          console.error('[arbitrage-stream] Subscription error:', err);
          sendError(err);
        } else {
          console.log('[arbitrage-stream] Subscribed to', arbitrageOpportunityChannel());
        }
      });

      subscriber.on('message', (channel, message) => {
        try {
          const event: ArbitrageEvent = JSON.parse(message);
          sendEvent(event);
        } catch (error) {
          console.error('[arbitrage-stream] Failed to parse message:', error);
          sendError(error instanceof Error ? error : new Error(String(error)));
        }
      });

      // Send initial connection message
      sendEvent({
        kind: 'arbitrage_opportunity',
        opportunity: {
          id: 'connection',
          createdAt: new Date().toISOString(),
          baseCollection: 'system',
          edgeBps: 0,
          estimatedProfitUsd: 0,
          legs: [],
          riskScore: 0,
          status: 'open',
        },
      } as ArbitrageEvent);

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        console.log('[arbitrage-stream] Client disconnected');
        subscriber.unsubscribe();
        subscriber.quit();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}



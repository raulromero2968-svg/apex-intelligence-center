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

      const channel = arbitrageOpportunityChannel();
      const subscriber = getRedisClient();

      let closed = false;

      const unsubscribe = () => {
        if (!closed) {
          closed = true;
          subscriber.unsubscribe(channel);
          subscriber.quit().catch(() => {
            // Ignore errors on quit
          });
        }
      };

      const timeout = setTimeout(() => {
        controller.enqueue(encoder.encode(`event: timeout\n`));
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ status: 'timeout', message: 'Connection timeout' })}\n\n`
          )
        );
        unsubscribe();
        controller.close();
      }, 300000); // 5 minute timeout

      const messageHandler = (ch: string, message: string) => {
        if (ch === channel && !closed) {
          try {
            const event: ArbitrageEvent = JSON.parse(message);
            sendEvent(event);
          } catch (error) {
            console.error('[arbitrage-stream] Failed to parse message:', error);
            sendError(error instanceof Error ? error : new Error(String(error)));
          }
        }
      };

      await subscriber.subscribe(channel, messageHandler);

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        unsubscribe();
        controller.close();
      });

      // Send initial connection message
      controller.enqueue(encoder.encode(`event: connected\n`));
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ channel })}\n\n`
        )
      );
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



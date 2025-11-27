import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';
import { lampUpdateChannel, type LampSimulationUpdatePayload } from '@apex/shared';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ simulationId: string }> }
) {
  const { simulationId } = await params;
  const channel = lampUpdateChannel(simulationId);

  const stream = new ReadableStream({
    async start(controller) {
      const subscriber = new Redis(process.env.REDIS_URL!, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      });

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
        controller.enqueue(new TextEncoder().encode(`event: timeout\n`));
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ status: 'timeout', message: 'Connection timeout' })}\n\n`));
        unsubscribe();
        controller.close();
      }, 600000); // 10 minute timeout for longer simulations

      const messageHandler = (ch: string, message: string) => {
        if (ch === channel && !closed) {
          try {
            const update: LampSimulationUpdatePayload = JSON.parse(message);
            controller.enqueue(new TextEncoder().encode(`event: update\n`));
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(update)}\n\n`));

            if (update.status === 'completed' || update.status === 'error') {
              clearTimeout(timeout);
              unsubscribe();
              controller.close();
            }
          } catch (error) {
            console.error('[lamp-sse] Failed to parse message:', error);
          }
        }
      };

      await subscriber.subscribe(channel, messageHandler);

      request.signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        unsubscribe();
        controller.close();
      });

      controller.enqueue(new TextEncoder().encode(`event: connected\n`));
      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ simulationId, channel })}\n\n`));
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

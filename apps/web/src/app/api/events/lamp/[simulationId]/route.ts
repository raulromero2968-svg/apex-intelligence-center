import { NextRequest } from 'next/server';
import Redis from 'ioredis';
import { lampUpdateChannel } from '@apex/shared';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ simulationId: string }> }
) {
  const { simulationId } = await params;
  const channel = lampUpdateChannel(simulationId);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const subscriber = new Redis(process.env.REDIS_URL!, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      });

      const messageHandler = (ch: string, msg: string) => {
        if (ch === channel) {
          try {
            const data = JSON.parse(msg);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            
            if (data.status === 'completed' || data.status === 'error') {
              subscriber.unsubscribe(channel);
              subscriber.quit();
              controller.close();
            }
          } catch (error) {
            console.error('[lamp-sse] Error parsing message:', error);
            controller.error(error);
          }
        }
      };

      await subscriber.subscribe(channel);
      subscriber.on('message', messageHandler);

      const cleanup = () => {
        subscriber.unsubscribe(channel);
        subscriber.quit();
        controller.close();
      };

      request.signal.addEventListener('abort', cleanup);

      const timeout = setTimeout(cleanup, 600000);

      request.signal.addEventListener('abort', () => {
        clearTimeout(timeout);
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

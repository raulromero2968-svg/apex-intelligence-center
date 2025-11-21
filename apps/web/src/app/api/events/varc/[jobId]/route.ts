import { NextRequest } from 'next/server';
import Redis from 'ioredis';
import { varcCompletedChannel } from '@apex/shared/src/contracts/queues';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL environment variable is required');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const channel = varcCompletedChannel(jobId);

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
            subscriber.unsubscribe(channel);
            subscriber.quit();
            controller.close();
          } catch (error) {
            console.error('[varc-sse] Error parsing message:', error);
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

      const timeout = setTimeout(cleanup, 300000);

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


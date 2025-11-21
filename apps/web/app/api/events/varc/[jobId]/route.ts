import { NextRequest } from 'next/server';
import Redis from 'ioredis';
import { varcCompletedChannel, VarcResultPayload } from '@apex/shared/src/contracts/queues';

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL environment variable is required');
}

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const channel = varcCompletedChannel(jobId);

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
      }, 300000); // 5 minute timeout

      const messageHandler = (ch: string, message: string) => {
        if (ch === channel && !closed) {
          try {
            const result: VarcResultPayload = JSON.parse(message);
            controller.enqueue(new TextEncoder().encode(`event: result\n`));
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(result)}\n\n`));

            if (result.status === 'completed' || result.status === 'error') {
              clearTimeout(timeout);
              unsubscribe();
              controller.close();
            }
          } catch (error) {
            console.error('[varc-sse] Failed to parse message:', error);
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
      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ jobId, channel })}\n\n`));
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

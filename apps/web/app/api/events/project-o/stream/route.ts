import { NextRequest } from 'next/server';
import Redis from 'ioredis';

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL environment variable is required');
}

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
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

      subscriber.subscribe('events.project_o.update', (err) => {
        if (err) {
          console.error('[project-o-stream] Subscription error:', err);
          sendError(err);
        } else {
          console.log('[project-o-stream] Subscribed to events.project_o.update');
        }
      });

      subscriber.on('message', (channel, message) => {
        try {
          const event = JSON.parse(message);
          sendEvent(event);
        } catch (error) {
          console.error('[project-o-stream] Failed to parse message:', error);
          sendError(error instanceof Error ? error : new Error(String(error)));
        }
      });

      // Send initial connection message
      sendEvent({
        kind: 'project_o_update',
        status: 'connected',
        timestamp: new Date().toISOString(),
      });

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        console.log('[project-o-stream] Client disconnected');
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


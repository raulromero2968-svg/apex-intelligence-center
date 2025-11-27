import { NextRequest } from 'next/server';
import Redis from 'ioredis';
import {
  blockchainFloorChannel,
  type FloorFeedEvent,
  SupportedCollectionSchema,
  SupportedChainSchema,
} from '@apex/shared';

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL environment variable is required');
}

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Collection to chain mapping
const COLLECTION_TO_CHAIN: Record<string, 'immutable_zkevm' | 'ronin'> = {
  gods_unchained: 'immutable_zkevm',
  parallel: 'immutable_zkevm',
  project_o: 'immutable_zkevm',
  runes_tcg: 'ronin',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ collection: string }> }
) {
  const { collection } = await params;
  const searchParams = request.nextUrl.searchParams;
  const chainParam = searchParams.get('chain');

  // Validate collection
  const collectionResult = SupportedCollectionSchema.safeParse(collection);
  if (!collectionResult.success) {
    return new Response(
      JSON.stringify({ error: `Invalid collection: ${collection}` }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const validCollection = collectionResult.data;

  // Determine chain (use query param or default to canonical chain)
  let chain: 'immutable_zkevm' | 'ronin';
  if (chainParam) {
    const chainResult = SupportedChainSchema.safeParse(chainParam);
    if (!chainResult.success) {
      return new Response(
        JSON.stringify({ error: `Invalid chain: ${chainParam}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    chain = chainResult.data;
  } else {
    chain = COLLECTION_TO_CHAIN[validCollection] ?? 'immutable_zkevm';
  }

  const channel = blockchainFloorChannel(chain, validCollection);

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
        controller.enqueue(
          new TextEncoder().encode(
            `data: ${JSON.stringify({ status: 'timeout', message: 'Connection timeout' })}\n\n`
          )
        );
        unsubscribe();
        controller.close();
      }, 300000); // 5 minute timeout

      const messageHandler = (ch: string, message: string) => {
        if (ch === channel && !closed) {
          try {
            const event: FloorFeedEvent = JSON.parse(message);
            controller.enqueue(new TextEncoder().encode(`event: ${event.kind}\n`));
            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`)
            );
          } catch (error) {
            console.error('[blockchain-sse] Failed to parse message:', error);
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
      controller.enqueue(
        new TextEncoder().encode(
          `data: ${JSON.stringify({ chain, collection: validCollection, channel })}\n\n`
        )
      );
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


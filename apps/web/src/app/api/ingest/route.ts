import { ingestBatch, type Provider } from '@/jobs/ingest';
import * as Sentry from '@sentry/nextjs';

/**
 * Ingest API endpoint
 * Accepts batch updates from data providers
 * Body: { provider: 'tcgplayer' | 'ebay' | ..., items: [...] }
 */
export async function POST(req: Request) {
  return Sentry.startSpan(
    { name: 'POST /api/ingest', op: 'http.server' },
    async () => {
      const body = await req.json();
      const provider = (body.provider as Provider) ?? 'tcgplayer';
      const items = body.items ?? [];

      const result = await ingestBatch(provider, items);

      return Response.json(result);
    }
  );
}

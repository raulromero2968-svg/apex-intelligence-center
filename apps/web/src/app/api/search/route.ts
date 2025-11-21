import * as Sentry from '@sentry/nextjs';
import { cachedSearchWithMeta } from '@/lib/search';
import { readProviderMetrics } from '@/lib/ingest-metrics';

// Edge runtime for optimal performance on read-only search
export const runtime = 'edge';

/**
 * Search API endpoint with cache headers and provider metrics
 * Supports query params: q, sources, tags, from, to
 * Returns x-cache and server-timing headers for observability
 */
export async function GET(req: Request) {
  return Sentry.startSpan(
    { name: 'GET /api/search', op: 'http.server' },
    async () => {
      const url = new URL(req.url);
      const sources = (url.searchParams.get('sources') || '')
        .split(',')
        .filter(Boolean);

      const { value: results, meta } = await cachedSearchWithMeta(
        url.searchParams
      );

      // Build cache header
      const xCache =
        meta.redis === 'HIT'
          ? 'HIT,redis'
          : meta.redis === 'MISS'
          ? 'MISS,origin'
          : 'MISS,origin(no-redis)';

      // Build server-timing header with cache + provider metrics
      const parts: string[] = [`cache;desc="redis:${meta.redis}"`];

      for (const s of sources) {
        const m = await readProviderMetrics(s);
        if (m.lag_ms != null) {
          // dur expects a number; we put lag_ms there and add rate in desc
          parts.push(
            `src-${s};dur=${m.lag_ms};desc="rate=${
              m.rate_per_min?.toFixed(1) ?? 'n/a'
            }/min"`
          );
        }
      }

      const headers = new Headers({
        'x-cache': xCache,
        'server-timing': parts.join(', '),
        'content-type': 'application/json',
      });

      return Response.json({ results }, { headers });
    }
  );
}


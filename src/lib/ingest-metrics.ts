import { Redis } from '@upstash/redis';

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

/**
 * Record ingest batch metrics
 * Tracks lag (time since observation) and rolling rate (items/min)
 */
export async function recordIngestBatch(
  provider: string,
  items: { observed_at?: string | number | Date }[]
) {
  if (!redis) return;

  const now = Date.now();
  let maxObserved = 0;

  for (const it of items) {
    const ts = it.observed_at ? new Date(it.observed_at).getTime() : now;
    if (ts > maxObserved) maxObserved = ts;
  }

  // 1) Update lag metric
  const lagMs = Math.max(0, now - maxObserved);
  await redis.set(`metrics:provider:${provider}:lag_ms`, lagMs, { ex: 600 });

  // 2) Rolling rate: add count to per-minute bucket for last 5m
  const minute = Math.floor(now / 60000);
  const key = `metrics:provider:${provider}:rate:${minute}`;
  await redis.incrby(key, items.length || 0);
  await redis.expire(key, 600); // keep ~10 mins
}

/**
 * Read provider metrics for observability
 * Returns lag_ms and rolling rate_per_min
 */
export async function readProviderMetrics(provider: string) {
  if (!redis)
    return { lag_ms: null, rate_per_min: null };

  const now = Date.now();
  const minute = Math.floor(now / 60000);
  const keys = [0, 1, 2, 3, 4].map(
    (off) => `metrics:provider:${provider}:rate:${minute - off}`
  );

  const counts = await redis.mget<number[]>(...keys);
  const total = counts.reduce((a, c) => a + (Number(c) || 0), 0);
  const rate = total / 5; // average items/min over last 5 mins

  const lag = await redis.get<number>(`metrics:provider:${provider}:lag_ms`);

  return {
    lag_ms: typeof lag === 'number' ? lag : null,
    rate_per_min: rate,
  };
}

import { unstable_cache as nextCache } from 'next/cache';
import { Redis } from '@upstash/redis';

// Optional Redis: enabled only if envs exist
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

const TTL_SECONDS = 3600; // 1 hour for minute buckets
const now = () => new Date();

/** Minute bucket like 20251117T0645 (UTC) */
function minuteBucket(d = now()): string {
  const y = d.getUTCFullYear();
  const M = String(d.getUTCMonth() + 1).padStart(2, '0');
  const D = String(d.getUTCDate()).padStart(2, '0');
  const h = String(d.getUTCHours()).padStart(2, '0');
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  return `${y}${M}${D}T${h}${m}`;
}

function keyFor(kind: 'hits' | 'misses', k: string, bucket: string) {
  return `key:${kind}:${k}:${bucket}`;
}

/** Internal: increment a per-minute counter with 1h retention */
async function bump(kind: 'hits' | 'misses', k: string, by = 1) {
  if (!redis) return;
  const bucket = minuteBucket();
  const rk = keyFor(kind, k, bucket);
  try {
    const r: any = redis as any;
    if (typeof r.incrby === 'function') {
      await r.incrby(rk, by);
    } else if (typeof r.incr === 'function') {
      for (let i = 0; i < by; i++) await r.incr(rk);
    } else {
      const v = await redis.get<number>(rk);
      await redis.set(rk, (Number(v) || 0) + by);
    }
    await redis.expire(rk, TTL_SECONDS);
  } catch {
    // ignore metrics failures
  }
}

/** Call when a cache HIT occurs for a specific logical key */
export async function recordKeyHit(key: string, by = 1) {
  await bump('hits', key, by);
}

/** Call when a cache MISS occurs for a specific logical key */
export async function recordKeyMiss(key: string, by = 1) {
  await bump('misses', key, by);
}

/** Build an array of oldest→newest minute buckets */
function lastNBuckets(n: number, d = now()): string[] {
  const buckets: string[] = [];
  const base = new Date(d);
  base.setUTCSeconds(0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const t = new Date(base);
    t.setUTCMinutes(base.getUTCMinutes() - i);
    buckets.push(minuteBucket(t));
  }
  return buckets;
}

async function mgetSafe(keys: string[]): Promise<(string | null)[]> {
  if (!redis || keys.length === 0) return Array(keys.length).fill(null);
  const client: any = redis as any;
  if (typeof client.mget === 'function') {
    return (await client.mget(...keys)) as (string | null)[];
  }
  const out: (string | null)[] = [];
  for (const k of keys) {
    out.push(await redis.get(k));
  }
  return out;
}

/**
 * Read per-minute series for a key.
 * Returns arrays sized exactly `minutes`, oldest → newest.
 * Works even when Redis is disabled (all zeros).
 */
export async function readKeySeries(
  key: string,
  minutes = 30
): Promise<{ hits: number[]; misses: number[] }> {
  const buckets = lastNBuckets(minutes);
  const hitKeys = buckets.map((b) => keyFor('hits', key, b));
  const missKeys = buckets.map((b) => keyFor('misses', key, b));

  const [hitVals, missVals] = await Promise.all([mgetSafe(hitKeys), mgetSafe(missKeys)]);

  const toNums = (arr: (string | number | null)[]) =>
    arr.map((v) => (v == null ? 0 : Number(v) || 0));

  return { hits: toNums(hitVals), misses: toNums(missVals) };
}

export function stableKey(ns: string, input: unknown) {
  const jsonStr = JSON.stringify(input);
  const buffer = Buffer.from(jsonStr);
  const base64 = buffer.toString('base64url');
  return ns + ':' + base64;
}

// Re-export so callers import from this module only
export { revalidateTag } from 'next/cache';

type Fn<T> = () => Promise<T>;

/**
 * getCached: Tiered cache (Redis -> Next Data Cache) with tag awareness.
 * - key: deterministic, from stableKey(ns, input)
 * - tags: Next cache tags used for precise invalidation
 * - ttlSeconds: Redis TTL; Next cache is tag-controlled
 * Now with hit/miss metrics tracking
 */
export function getCached<T>(key: string, tags: string[], fn: Fn<T>, ttlSeconds = 60) {
  return nextCache(async () => {
    if (redis) {
      const hit = await redis.get<string>(key);
      if (hit) {
        recordKeyHit(key).catch(() => {});
        return JSON.parse(hit) as T;
      }
    }
    recordKeyMiss(key).catch(() => {});
    const val = await fn();
    if (redis) await redis.set(key, JSON.stringify(val), { ex: ttlSeconds });
    return val;
  }, [key], { tags })();
}

export type CacheMeta = { redis: 'HIT' | 'MISS' | 'DISABLED' };

/**
 * getCachedWithMeta: Same as getCached but returns cache metadata
 * Useful for exposing cache headers in API responses
 * Now with hit/miss metrics tracking
 */
export async function getCachedWithMeta<T>(
  key: string,
  tags: string[],
  fn: Fn<T>,
  ttlSeconds = 60
): Promise<{ value: T; meta: CacheMeta }> {
  let meta: CacheMeta = { redis: redis ? 'MISS' : 'DISABLED' };
  const value = await nextCache(
    async () => {
      if (redis) {
        const hit = await redis.get<string>(key);
        if (hit) {
          meta.redis = 'HIT';
          recordKeyHit(key).catch(() => {});
          return JSON.parse(hit) as T;
        }
      }
      recordKeyMiss(key).catch(() => {});
      const val = await fn();
      if (redis) await redis.set(key, JSON.stringify(val), { ex: ttlSeconds });
      return val;
    },
    [key],
    { tags }
  )();
  return { value, meta };
}

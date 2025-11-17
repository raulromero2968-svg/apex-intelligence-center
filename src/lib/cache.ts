import { unstable_cache as nextCache } from 'next/cache';
import { createClient } from '@upstash/redis';

// Optional Redis: enabled only if envs exist
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? createClient({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

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
 */
export function getCached<T>(key: string, tags: string[], fn: Fn<T>, ttlSeconds = 60) {
  return nextCache(async () => {
    if (redis) {
      const hit = await redis.get<string>(key);
      if (hit) return JSON.parse(hit) as T;
    }
    const val = await fn();
    if (redis) await redis.set(key, JSON.stringify(val), { ex: ttlSeconds });
    return val;
  }, { tags })(key);
}

export type CacheMeta = { redis: 'HIT' | 'MISS' | 'DISABLED' };

/**
 * getCachedWithMeta: Same as getCached but returns cache metadata
 * Useful for exposing cache headers in API responses
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
          return JSON.parse(hit) as T;
        }
      }
      const val = await fn();
      if (redis) await redis.set(key, JSON.stringify(val), { ex: ttlSeconds });
      return val;
    },
    { tags }
  )(key);
  return { value, meta };
}

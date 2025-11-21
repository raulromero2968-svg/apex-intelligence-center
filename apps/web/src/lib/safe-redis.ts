let cached: any | undefined;

export async function getRedis() {
  if (cached) return cached;

  try {
    const maybe: any = await import('@/lib/redis');
    cached = maybe.redis ?? maybe.default ?? undefined;
    if (cached) return cached;
  } catch {
    // ignore
  }

  try {
    const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env as Record<
      string,
      string | undefined
    >;

    if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
      const { Redis } = await import('@upstash/redis');
      cached = new Redis({ url: UPSTASH_REDIS_REST_URL, token: UPSTASH_REDIS_REST_TOKEN });
      return cached;
    }
  } catch {
    // ignore
  }

  return undefined;
}



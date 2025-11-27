import { Redis } from '@upstash/redis';

// Lazy initialization to prevent build-time errors
let _redis: Redis | null = null;

function getRedis(): Redis {
  if (!_redis) {
    if (!process.env.REDIS_URL) {
      throw new Error('REDIS_URL environment variable is required');
    }
    if (!process.env.REDIS_TOKEN) {
      throw new Error('REDIS_TOKEN environment variable is required');
    }
    _redis = new Redis({
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN,
    });
  }
  return _redis;
}

// Export getter for lazy access
export const redis = new Proxy({} as Redis, {
  get(_, prop) {
    return (getRedis() as any)[prop];
  }
});

export async function ping(): Promise<boolean> {
  try {
    await getRedis().ping();
    return true;
  } catch (error) {
    return false;
  }
}



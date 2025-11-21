/**
 * Mock Price Publisher for Development/Preview
 *
 * - Publishes random price deltas for testing
 * - Usage: GET /api/research/mock-prices?symbols=CHARIZARD,UMBREON&sessionId=xyz
 * - Runs for 20 seconds at 1-second intervals
 * - Only available in development/preview environments
 * - Uses Upstash Redis to publish to research:${sessionId} channel
 */

import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Only allow in dev/preview
const isDevelopment = process.env.NODE_ENV === 'development' ||
                      process.env.VERCEL_ENV === 'preview';

// Lazy getter for Redis client
let redisInstance: Redis | null = null;

function getRedis(): Redis | null {
  if (redisInstance) return redisInstance;

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      redisInstance = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      return redisInstance;
    } catch (error) {
      console.warn('Failed to initialize Upstash Redis:', error);
      return null;
    }
  }

  return null;
}

interface PriceDelta {
  symbol: string;
  priceChange: number;
  percentChange: number;
  timestamp: number;
}

function generateRandomDelta(symbol: string): PriceDelta {
  // Random price change between -50 and +50
  const priceChange = (Math.random() - 0.5) * 100;

  // Random percent change between -10% and +10%
  const percentChange = (Math.random() - 0.5) * 20;

  // Round to 3 significant digits
  const roundedPrice = Number(priceChange.toPrecision(3));
  const roundedPercent = Number(percentChange.toPrecision(3));

  return {
    symbol,
    priceChange: roundedPrice,
    percentChange: roundedPercent,
    timestamp: Date.now(),
  };
}

export async function GET(req: NextRequest) {
  // Check environment
  if (!isDevelopment) {
    return NextResponse.json(
      { error: 'Mock prices only available in development/preview' },
      { status: 403 }
    );
  }

  // Check feature flag
  if (process.env.FEATURE_LIVE_PRICES !== '1') {
    return NextResponse.json(
      { error: 'FEATURE_LIVE_PRICES not enabled' },
      { status: 404 }
    );
  }

  const { searchParams } = new URL(req.url);
  const symbolsParam = searchParams.get('symbols');
  const sessionId = searchParams.get('sessionId');

  if (!symbolsParam) {
    return NextResponse.json(
      { error: 'Missing symbols parameter. Usage: ?symbols=CHARIZARD,UMBREON' },
      { status: 400 }
    );
  }

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Missing sessionId parameter' },
      { status: 400 }
    );
  }

  const redis = getRedis();
  if (!redis) {
    return NextResponse.json(
      { error: 'Redis not configured' },
      { status: 503 }
    );
  }

  const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);

  if (symbols.length === 0) {
    return NextResponse.json(
      { error: 'No valid symbols provided' },
      { status: 400 }
    );
  }

  const channel = `research:${sessionId}`;

  // Start publishing in background (don't await)
  (async () => {
    const iterations = 20; // Run for 20 seconds
    const intervalMs = 1000; // 1 second intervals

    for (let i = 0; i < iterations; i++) {
      try {
        // Pick a random symbol and generate delta
        const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
        const delta = generateRandomDelta(randomSymbol);

        // Store delta with timestamp-based key and 30s TTL
        const key = `${channel}:${Date.now()}`;
        await (redis as any).set(key, JSON.stringify(delta), { ex: 30 });

        console.log(`[MockPrices] Published delta for ${randomSymbol} to ${key}:`, delta);
      } catch (error) {
        console.error('[MockPrices] Failed to publish delta:', error);
      }

      // Wait for next interval
      if (i < iterations - 1) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }

    console.log(`[MockPrices] Completed 20 iterations for session ${sessionId}`);
  })();

  return NextResponse.json({
    ok: true,
    message: `Publishing price deltas for ${symbols.length} symbols over 20 seconds`,
    symbols,
    sessionId,
    channel,
  });
}


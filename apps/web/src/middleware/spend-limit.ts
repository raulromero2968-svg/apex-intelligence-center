/**
 * Spend Limit Middleware
 *
 * Edge middleware that blocks ALL payment routes when spend limits are exceeded.
 *
 * Architecture:
 * - Runs at edge (before API routes execute)
 * - Uses Redis for fast limit checks (< 5ms)
 * - Blocks Stripe + on-chain payment routes
 * - Returns 402 Payment Required with spend limit details
 *
 * Protected Routes:
 * - /api/stripe/* - Stripe payment intents, subscriptions
 * - /api/payments/* - Generic payment endpoints
 * - /api/web3/* - On-chain payment processing
 * - /api/checkout/* - Checkout flows
 *
 * Usage:
 * Import this middleware in your Next.js middleware.ts:
 *
 * ```ts
 * import { spendLimitMiddleware } from './src/middleware/spend-limit';
 *
 * export async function middleware(request: NextRequest) {
 *   // Run spend limit checks
 *   const spendLimitResponse = await spendLimitMiddleware(request);
 *   if (spendLimitResponse) return spendLimitResponse;
 *
 *   // Continue with other middleware...
 * }
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// ============================================================================
// Configuration
// ============================================================================

const SPEND_LIMITS = {
  DAILY: 50.0, // $50/day
  WEEKLY: 200.0, // $200/week
} as const;

const PROTECTED_ROUTE_PATTERNS = [
  '/api/stripe',
  '/api/payments',
  '/api/web3',
  '/api/checkout',
  '/api/mint', // NFT minting
  '/api/subscription', // Subscription changes
];

const REDIS_KEY_PREFIX = {
  DAILY: 'spend:daily:',
  WEEKLY: 'spend:weekly:',
} as const;

// ============================================================================
// Redis Client (Edge Runtime Compatible)
// ============================================================================

let redis: Redis | null = null;

function getRedisClient(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      console.error('[SpendLimitMiddleware] Redis credentials not configured');
      throw new Error('Redis not configured');
    }

    redis = new Redis({
      url,
      token,
    });
  }

  return redis;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if route is a payment route that should be protected
 */
function isPaymentRoute(pathname: string): boolean {
  return PROTECTED_ROUTE_PATTERNS.some(pattern =>
    pathname.startsWith(pattern)
  );
}

/**
 * Extract user ID from request (supports multiple auth methods)
 *
 * Priority order:
 * 1. Authorization header (Bearer token with JWT)
 * 2. Cookie-based session
 * 3. Query parameter (for testing only)
 *
 * @returns User ID or null if not authenticated
 */
function extractUserId(request: NextRequest): string | null {
  // Method 1: Authorization header (JWT)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      // Simple JWT decode (edge runtime compatible)
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString()
      );
      return payload.sub || payload.userId || payload.id || null;
    } catch {
      // Invalid JWT, continue to other methods
    }
  }

  // Method 2: Cookie-based session (NextAuth, Clerk, etc.)
  const sessionCookie = request.cookies.get('next-auth.session-token') ||
                       request.cookies.get('__session') ||
                       request.cookies.get('session');

  if (sessionCookie) {
    // For production, decode session cookie properly
    // For now, we'll need to pass userId via another method
    // This is a placeholder - implement based on your auth system
  }

  // Method 3: Query parameter (TESTING ONLY - remove in production)
  if (process.env.NODE_ENV === 'development') {
    const userId = request.nextUrl.searchParams.get('userId');
    if (userId) return userId;
  }

  // Method 4: Custom header (for server-to-server calls)
  const userIdHeader = request.headers.get('x-user-id');
  if (userIdHeader) return userIdHeader;

  return null;
}

/**
 * Get current spend from Redis
 */
async function getCurrentSpend(userId: string): Promise<{
  daily: number;
  weekly: number;
}> {
  try {
    const redisClient = getRedisClient();

    const dailyKey = `${REDIS_KEY_PREFIX.DAILY}${userId}`;
    const weeklyKey = `${REDIS_KEY_PREFIX.WEEKLY}${userId}`;

    const [dailySpend, weeklySpend] = await Promise.all([
      redisClient.get<string>(dailyKey),
      redisClient.get<string>(weeklyKey),
    ]);

    return {
      daily: parseFloat(dailySpend || '0'),
      weekly: parseFloat(weeklySpend || '0'),
    };
  } catch (error) {
    console.error('[SpendLimitMiddleware] Failed to get spend:', error);
    // Fail-closed: if Redis unavailable, block payment
    return {
      daily: SPEND_LIMITS.DAILY + 1, // Force block
      weekly: SPEND_LIMITS.WEEKLY + 1,
    };
  }
}

/**
 * Create 402 Payment Required response
 */
function createBlockedResponse(
  daily: number,
  weekly: number,
  reason: string
): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: 'SPEND_LIMIT_EXCEEDED',
        message: reason,
        details: {
          currentDailySpend: daily,
          currentWeeklySpend: weekly,
          dailyLimit: SPEND_LIMITS.DAILY,
          weeklyLimit: SPEND_LIMITS.WEEKLY,
          remainingDaily: Math.max(0, SPEND_LIMITS.DAILY - daily),
          remainingWeekly: Math.max(0, SPEND_LIMITS.WEEKLY - weekly),
        },
      },
    },
    {
      status: 402, // Payment Required
      headers: {
        'Content-Type': 'application/json',
        'X-Spend-Limit-Exceeded': 'true',
        'X-Daily-Spend': daily.toFixed(2),
        'X-Weekly-Spend': weekly.toFixed(2),
        'X-Daily-Limit': SPEND_LIMITS.DAILY.toFixed(2),
        'X-Weekly-Limit': SPEND_LIMITS.WEEKLY.toFixed(2),
        'Retry-After': '86400', // 24 hours in seconds
      },
    }
  );
}

/**
 * Create 401 Unauthorized response
 */
function createUnauthorizedResponse(): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required for payment operations',
      },
    },
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Bearer',
      },
    }
  );
}

/**
 * Create 503 Service Unavailable response (Redis down)
 */
function createServiceUnavailableResponse(): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Payment system temporarily unavailable. Please try again later.',
      },
    },
    {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60', // 1 minute
      },
    }
  );
}

// ============================================================================
// Main Middleware Function
// ============================================================================

/**
 * Spend Limit Middleware
 *
 * Checks spend limits for payment routes at the edge.
 * Returns null if request should proceed, or NextResponse to block.
 *
 * @param request - Next.js request object
 * @returns NextResponse to block request, or null to continue
 */
export async function spendLimitMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;

  // Skip non-payment routes
  if (!isPaymentRoute(pathname)) {
    return null;
  }

  try {
    // Extract user ID from auth
    const userId = extractUserId(request);

    if (!userId) {
      // No user ID - block payment (authentication required)
      console.warn('[SpendLimitMiddleware] Blocked unauthenticated payment attempt');
      return createUnauthorizedResponse();
    }

    // Get current spend from Redis (fast edge query)
    const spend = await getCurrentSpend(userId);

    // Check limits
    const dailyExceeded = spend.daily >= SPEND_LIMITS.DAILY;
    const weeklyExceeded = spend.weekly >= SPEND_LIMITS.WEEKLY;

    if (dailyExceeded || weeklyExceeded) {
      let reason: string;
      if (dailyExceeded && weeklyExceeded) {
        reason = `Both daily ($${SPEND_LIMITS.DAILY}) and weekly ($${SPEND_LIMITS.WEEKLY}) spend limits exceeded`;
      } else if (dailyExceeded) {
        reason = `Daily spend limit of $${SPEND_LIMITS.DAILY} exceeded`;
      } else {
        reason = `Weekly spend limit of $${SPEND_LIMITS.WEEKLY} exceeded`;
      }

      console.warn(
        `[SpendLimitMiddleware] Blocked payment for user ${userId}: ${reason}`,
        { daily: spend.daily, weekly: spend.weekly }
      );

      return createBlockedResponse(spend.daily, spend.weekly, reason);
    }

    // Limits OK - allow request to proceed
    console.log(
      `[SpendLimitMiddleware] Allowed payment for user ${userId}`,
      { daily: spend.daily, weekly: spend.weekly, path: pathname }
    );

    // Add spend info to request headers (for logging in API routes)
    const response = NextResponse.next();
    response.headers.set('X-User-Daily-Spend', spend.daily.toFixed(2));
    response.headers.set('X-User-Weekly-Spend', spend.weekly.toFixed(2));
    response.headers.set('X-User-Id', userId);

    return response;
  } catch (error) {
    console.error('[SpendLimitMiddleware] Error checking spend limits:', error);

    // Fail-closed: if we can't check limits, block the payment for security
    return createServiceUnavailableResponse();
  }
}

/**
 * Export default middleware function for Next.js
 *
 * Usage in apps/web/middleware.ts:
 * ```ts
 * export { spendLimitMiddleware as middleware } from './src/middleware/spend-limit';
 * export const config = {
 *   matcher: ['/api/stripe/:path*', '/api/payments/:path*', '/api/web3/:path*'],
 * };
 * ```
 */
export default spendLimitMiddleware;

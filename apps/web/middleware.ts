/**
 * Next.js Edge Middleware
 *
 * Runs at the edge before requests reach API routes.
 * Implements spend limit enforcement for all payment routes.
 *
 * Configuration:
 * - Matcher: Only runs on payment-related routes
 * - Runtime: Edge runtime for low latency
 * - Redis: Upstash Redis for fast spend checks
 */

import { NextRequest, NextResponse } from 'next/server';
import { spendLimitMiddleware } from './src/middleware/spend-limit';

/**
 * Main middleware function
 *
 * Checks spend limits for payment routes.
 * Can be extended with additional middleware (auth, rate limiting, etc.)
 */
export async function middleware(request: NextRequest) {
  // Run spend limit enforcement
  const spendLimitResponse = await spendLimitMiddleware(request);

  // If spend limit middleware returned a response, return it (blocked)
  if (spendLimitResponse) {
    return spendLimitResponse;
  }

  // Continue to API route
  return NextResponse.next();
}

/**
 * Middleware configuration
 *
 * Matcher: Only run middleware on payment-related routes
 * This improves performance by skipping middleware for non-payment routes.
 */
export const config = {
  matcher: [
    '/api/stripe/:path*',
    '/api/payments/:path*',
    '/api/web3/:path*',
    '/api/checkout/:path*',
    '/api/mint/:path*',
    '/api/subscription/:path*',
  ],
};

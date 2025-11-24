/**
 * Next.js Edge Middleware
 *
 * Runs on Vercel Edge Network for ultra-low latency.
 * Chains multiple middleware together.
 */

import { NextRequest, NextResponse } from 'next/server';
import { spendLimitMiddleware, SPEND_LIMIT_MATCHER } from './middleware/spend-limit';

/**
 * Main middleware function
 *
 * Chains together all middleware in order of execution.
 */
export async function middleware(req: NextRequest): Promise<NextResponse> {
  // 1. Spend limit enforcement (blocks payment routes if over limit)
  const spendLimitResult = await spendLimitMiddleware(req);
  if (spendLimitResult) {
    return spendLimitResult;
  }

  // 2. Add more middleware here as needed
  // Example: Rate limiting, auth checks, etc.

  // Continue to route handler
  return NextResponse.next();
}

/**
 * Matcher configuration
 *
 * Specifies which routes this middleware applies to.
 * Currently only matches payment routes for spend limit enforcement.
 */
export const config = {
  matcher: SPEND_LIMIT_MATCHER,
};

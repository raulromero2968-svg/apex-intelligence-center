/**
 * Next.js Edge Middleware
 *
 * Runs at the edge before requests reach API routes.
 * Implements:
 * 1. Family Protection Lockdown v3 (age gating, bedtime, cooldown, monthly spend)
 * 2. Spend limit enforcement (daily/weekly limits)
 *
 * Configuration:
 * - Matcher: Runs on payment, premium, and dashboard routes
 * - Runtime: Edge runtime for low latency
 * - Database: Neon Serverless for user profile checks
 * - Redis: Upstash Redis for fast spend checks
 */

import { NextRequest, NextResponse } from 'next/server';
import { familyProtectionMiddleware } from './src/middleware/family-protection';
import { spendLimitMiddleware } from './src/middleware/spend-limit';

/**
 * Main middleware function
 *
 * Chains multiple middleware checks in order:
 * 1. Family Protection (age, bedtime, cooldown, monthly spend)
 * 2. Spend Limits (daily/weekly spend)
 *
 * Each middleware returns null to continue or NextResponse to block.
 */
export async function middleware(request: NextRequest) {
  // Step 1: Family Protection Lockdown v3 enforcement
  const familyProtectionResponse = await familyProtectionMiddleware(request);
  if (familyProtectionResponse) {
    return familyProtectionResponse;
  }

  // Step 2: Daily/Weekly spend limit enforcement
  const spendLimitResponse = await spendLimitMiddleware(request);
  if (spendLimitResponse) {
    return spendLimitResponse;
  }

  // All checks passed - continue to API route
  return NextResponse.next();
}

/**
 * Middleware configuration
 *
 * Matcher: Run middleware on:
 * - Payment routes (spend limits + family protection)
 * - Premium content routes (family protection)
 * - Dashboard routes (family protection)
 */
export const config = {
  matcher: [
    // Payment routes
    '/api/stripe/:path*',
    '/api/payments/:path*',
    '/api/web3/:path*',
    '/api/checkout/:path*',
    '/api/mint/:path*',
    '/api/subscription/:path*',
    // Premium content routes
    '/vault/:path*',
    '/premium/:path*',
    // Dashboard routes
    '/dashboard/:path*',
  ],
};

/**
 * Minor Protection Middleware
 *
 * Enforces child protection policies by blocking minors (under 18) from:
 * - All payment processing routes
 * - Wallet connection features
 * - Token-gated content
 * - Subscription upgrades
 *
 * COPPA Compliance: Minors are permanently restricted to free tier
 * until they turn 18 or parental consent is provided.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserFromRequest } from '@/lib/auth';

/**
 * Routes that are blocked for minor accounts
 * Pattern matching supports wildcards (*)
 */
const BLOCKED_ROUTES_FOR_MINORS = [
  // Payment processing
  '/api/stripe/checkout',
  '/api/stripe/billing-portal',
  '/api/payment/*',
  '/api/billing/*',
  '/api/subscription/*',

  // Wallet connections (if implemented)
  '/api/wallet/connect',
  '/api/wallet/sign',
  '/api/web3/*',

  // Token-gated features
  '/api/token-gate/*',
  '/api/premium/*',

  // Admin and high-risk features
  '/api/admin/*',
];

/**
 * Check if a route path matches any blocked pattern
 */
function isBlockedRoute(path: string, blockedPatterns: string[]): boolean {
  return blockedPatterns.some((pattern) => {
    // Convert wildcard pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\//g, '\\/');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  });
}

/**
 * Minor protection error response
 */
function minorBlockedResponse(route: string): NextResponse {
  return NextResponse.json(
    {
      error: 'Forbidden',
      message:
        'This feature is not available for accounts under 18 years old. ' +
        'You have a permanent free tier with full access to core features. ' +
        'Parental approval is required for any upgrades or payment features.',
      code: 'MINOR_PROTECTION_BLOCK',
      route,
      restrictions: {
        reason: 'Age restriction (under 18)',
        blockedFeatures: [
          'Payment processing',
          'Subscription upgrades',
          'Wallet connections',
          'Token-gated content',
        ],
        availableFeatures: 'Full free tier access',
      },
      parentalConsent: {
        required: true,
        message:
          'A parent or legal guardian can request feature unlocks by contacting support.',
      },
    },
    { status: 403 }
  );
}

/**
 * Middleware to protect minors from accessing restricted features
 *
 * Usage in API routes:
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   const protectionCheck = await enforceMinorProtection(req);
 *   if (protectionCheck) return protectionCheck;
 *   // ... rest of route handler
 * }
 * ```
 *
 * @param req - NextRequest object
 * @returns NextResponse if blocked, null if allowed
 */
export async function enforceMinorProtection(
  req: NextRequest
): Promise<NextResponse | null> {
  try {
    // Get current route path
    const url = new URL(req.url);
    const path = url.pathname;

    // Check if this route is subject to minor protection
    if (!isBlockedRoute(path, BLOCKED_ROUTES_FOR_MINORS)) {
      return null; // Route not restricted, allow access
    }

    // Authenticate user
    const user = await getUserFromRequest(req);
    if (!user) {
      // No user authenticated - let the route's own auth handle it
      return null;
    }

    // Fetch user from database to check minor status
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: {
        id: true,
        isMinor: true,
        parentalConsentGiven: true,
      },
    });

    if (!dbUser) {
      // User not found - let the route handle it
      return null;
    }

    // Block access if user is a minor without parental consent
    if (dbUser.isMinor && !dbUser.parentalConsentGiven) {
      console.warn(
        `[MinorProtection] Blocked minor user ${dbUser.id} from accessing ${path}`
      );
      return minorBlockedResponse(path);
    }

    // User is not a minor or has parental consent
    return null;
  } catch (error) {
    console.error('[MinorProtection] Error checking minor status:', error);
    // On error, fail open to avoid breaking legitimate requests
    // But log the error for investigation
    return null;
  }
}

/**
 * Check if a user is a minor (for use in route handlers)
 * @param userId - User ID to check
 * @returns True if user is a minor, false otherwise
 */
export async function isUserMinor(userId: string): Promise<boolean> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        isMinor: true,
      },
    });

    return user?.isMinor ?? false;
  } catch (error) {
    console.error('[MinorProtection] Error checking minor status:', error);
    return false;
  }
}

/**
 * Validate that a user can access payment features
 * More granular than enforceMinorProtection, for use in business logic
 *
 * @param userId - User ID to check
 * @returns Object with allowed status and reason if blocked
 */
export async function canAccessPaymentFeatures(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        isMinor: true,
        parentalConsentGiven: true,
      },
    });

    if (!user) {
      return { allowed: false, reason: 'User not found' };
    }

    if (user.isMinor && !user.parentalConsentGiven) {
      return {
        allowed: false,
        reason: 'Minor without parental consent',
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error(
      '[MinorProtection] Error checking payment feature access:',
      error
    );
    return { allowed: false, reason: 'System error' };
  }
}

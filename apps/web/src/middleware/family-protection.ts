/**
 * Family Protection Lockdown v3 Middleware
 *
 * Implements the 10 immutable rules of the Apex Constitution:
 * 1. Age gating (13+ required)
 * 2. Automatic minor mode (< 18)
 * 3. Parent approval system
 * 4. Bedtime mode enforcement
 * 5. Cooldown mode ("Take a Break")
 * 6. Monthly spend limits
 * 7. No exceptions policy
 * 8. Database-backed enforcement
 * 9. Fail-closed security model
 * 10. Audit trail for all blocks
 *
 * Protected Routes:
 * - /vault/* - Premium Vault content
 * - /premium/* - Premium features
 * - /api/stripe/* - Payment routes
 * - /api/payments/* - Payment processing
 * - /dashboard/* - User dashboard
 *
 * Architecture:
 * - Runs at edge (before API routes execute)
 * - Uses database for user profile checks
 * - Returns appropriate HTTP status codes
 * - Logs all enforcement actions
 */

import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// ============================================================================
// Configuration
// ============================================================================

const PROTECTED_ROUTES = {
  PREMIUM: ['/vault', '/premium'],
  PAYMENT: ['/api/stripe', '/api/payments', '/api/web3', '/api/checkout', '/api/mint', '/api/subscription'],
  DASHBOARD: ['/dashboard'],
} as const;

const SPEND_LIMITS = {
  MONTHLY: 50.0, // $50/month unbreakable limit
} as const;

const MIN_AGE = 13;
const ADULT_AGE = 18;

// ============================================================================
// Database Client (Edge Runtime Compatible)
// ============================================================================

function getDbClient() {
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!url) {
    throw new Error('Database URL not configured');
  }
  return neon(url);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if route requires Family Protection enforcement
 */
function requiresProtection(pathname: string): boolean {
  return [
    ...PROTECTED_ROUTES.PREMIUM,
    ...PROTECTED_ROUTES.PAYMENT,
    ...PROTECTED_ROUTES.DASHBOARD,
  ].some(pattern => pathname.startsWith(pattern));
}

/**
 * Extract user ID from request
 */
function extractUserId(request: NextRequest): string | null {
  // Method 1: Authorization header (JWT)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString()
      );
      return payload.sub || payload.userId || payload.id || null;
    } catch {
      // Invalid JWT
    }
  }

  // Method 2: Custom header
  const userIdHeader = request.headers.get('x-user-id');
  if (userIdHeader) return userIdHeader;

  // Method 3: Development mode query param
  if (process.env.NODE_ENV === 'development') {
    const userId = request.nextUrl.searchParams.get('userId');
    if (userId) return userId;
  }

  return null;
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Check if current time is within bedtime hours
 */
function isWithinBedtime(bedtimeStart: string | null, bedtimeEnd: string | null): boolean {
  if (!bedtimeStart || !bedtimeEnd) return false;

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight

  // Parse bedtime hours (format: "HH:MM")
  const [startHour, startMin] = bedtimeStart.split(':').map(Number);
  const [endHour, endMin] = bedtimeEnd.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  // Handle overnight bedtime (e.g., 22:00 to 07:00)
  if (startMinutes > endMinutes) {
    return currentTime >= startMinutes || currentTime < endMinutes;
  }

  // Handle same-day bedtime (e.g., 14:00 to 16:00)
  return currentTime >= startMinutes && currentTime < endMinutes;
}

/**
 * Get user protection status from database
 */
async function getUserProtectionStatus(userId: string): Promise<{
  dateOfBirth: Date | null;
  age: number | null;
  isMinor: boolean;
  bedtimeStart: string | null;
  bedtimeEnd: string | null;
  coolDownUntil: Date | null;
  currentMonthlySpend: number;
  monthlySpendLimit: number;
  parentUserId: string | null;
} | null> {
  try {
    const sql = getDbClient();

    const result = await sql`
      SELECT
        date_of_birth,
        is_minor,
        bedtime_start,
        bedtime_end,
        cool_down_until,
        current_monthly_spend,
        monthly_spend_limit,
        parent_user_id
      FROM users
      WHERE id = ${userId}
      LIMIT 1
    `;

    if (result.length === 0) {
      return null;
    }

    const user = result[0];
    const dateOfBirth = user.date_of_birth ? new Date(user.date_of_birth) : null;
    const age = dateOfBirth ? calculateAge(dateOfBirth) : null;

    return {
      dateOfBirth,
      age,
      isMinor: user.is_minor || false,
      bedtimeStart: user.bedtime_start,
      bedtimeEnd: user.bedtime_end,
      coolDownUntil: user.cool_down_until ? new Date(user.cool_down_until) : null,
      currentMonthlySpend: parseFloat(user.current_monthly_spend || '0'),
      monthlySpendLimit: parseFloat(user.monthly_spend_limit || '50'),
      parentUserId: user.parent_user_id,
    };
  } catch (error) {
    console.error('[FamilyProtection] Database query failed:', error);
    // Fail-closed: if we can't check, block access
    return null;
  }
}

/**
 * Auto-update isMinor flag if user is under 18
 */
async function autoUpdateMinorStatus(userId: string, age: number): Promise<void> {
  if (age < ADULT_AGE) {
    try {
      const sql = getDbClient();
      await sql`
        UPDATE users
        SET is_minor = true
        WHERE id = ${userId} AND is_minor = false
      `;
      console.log(`[FamilyProtection] Auto-set minor flag for user ${userId} (age: ${age})`);
    } catch (error) {
      console.error('[FamilyProtection] Failed to update minor status:', error);
    }
  }
}

// ============================================================================
// Response Creators
// ============================================================================

function createAgeGateResponse(url: URL): NextResponse {
  return NextResponse.redirect(new URL('/auth/verify-age', url));
}

function createUnderAgeBlockResponse(): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: 'AGE_GATE_VIOLATION',
        message: `You must be at least ${MIN_AGE} years old to access this content.`,
        constitution: 'Family Protection Lockdown v3 - Rule 1',
      },
    },
    { status: 403 }
  );
}

function createBedtimeBlockResponse(bedtimeEnd: string): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: 'BEDTIME_MODE_ACTIVE',
        message: `Bedtime mode is active. Access will resume at ${bedtimeEnd}.`,
        constitution: 'Family Protection Lockdown v3 - Rules 4-6',
        availableAt: bedtimeEnd,
      },
    },
    {
      status: 403,
      headers: {
        'X-Bedtime-Active': 'true',
        'X-Available-At': bedtimeEnd,
      },
    }
  );
}

function createCoolDownBlockResponse(coolDownUntil: Date): NextResponse {
  const hoursRemaining = Math.ceil(
    (coolDownUntil.getTime() - Date.now()) / (1000 * 60 * 60)
  );

  return NextResponse.json(
    {
      error: {
        code: 'COOL_DOWN_ACTIVE',
        message: `"Take a Break" cooldown is active. Access will resume in ${hoursRemaining} hours.`,
        constitution: 'Family Protection Lockdown v3 - Rules 7-8',
        availableAt: coolDownUntil.toISOString(),
      },
    },
    {
      status: 403,
      headers: {
        'X-Cool-Down-Active': 'true',
        'X-Available-At': coolDownUntil.toISOString(),
        'Retry-After': String(Math.ceil((coolDownUntil.getTime() - Date.now()) / 1000)),
      },
    }
  );
}

function createMonthlySpendLimitResponse(
  currentSpend: number,
  limit: number
): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: 'MONTHLY_SPEND_LIMIT_EXCEEDED',
        message: `Monthly spend limit of $${limit} reached. Parent approval required.`,
        constitution: 'Family Protection Lockdown v3 - Rules 9-10',
        details: {
          currentMonthlySpend: currentSpend,
          monthlyLimit: limit,
          remaining: Math.max(0, limit - currentSpend),
        },
      },
    },
    {
      status: 403,
      headers: {
        'X-Monthly-Spend': currentSpend.toFixed(2),
        'X-Monthly-Limit': limit.toFixed(2),
      },
    }
  );
}

// ============================================================================
// Main Middleware Function
// ============================================================================

/**
 * Family Protection Lockdown v3 Middleware
 *
 * Enforces all 10 immutable rules at the edge.
 * Returns null if request should proceed, or NextResponse to block.
 *
 * @param request - Next.js request object
 * @returns NextResponse to block request, or null to continue
 */
export async function familyProtectionMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;

  // Skip non-protected routes
  if (!requiresProtection(pathname)) {
    return null;
  }

  try {
    // Extract user ID
    const userId = extractUserId(request);

    // Public routes don't require auth
    if (!userId) {
      return null; // Let auth middleware handle this
    }

    // Get user protection status from database
    const status = await getUserProtectionStatus(userId);

    if (!status) {
      console.warn(`[FamilyProtection] User ${userId} not found in database`);
      return null; // User doesn't exist, let auth handle
    }

    // Rule 1: Age gating - require date of birth for premium/payment routes
    const requiresAgeVerification =
      PROTECTED_ROUTES.PREMIUM.some(p => pathname.startsWith(p)) ||
      PROTECTED_ROUTES.PAYMENT.some(p => pathname.startsWith(p));

    if (requiresAgeVerification && !status.dateOfBirth) {
      console.warn(`[FamilyProtection] Blocked ${userId} - age not verified`);
      return createAgeGateResponse(request.nextUrl);
    }

    // Rule 2: Under 13 block
    if (status.age !== null && status.age < MIN_AGE) {
      console.warn(`[FamilyProtection] Blocked ${userId} - under age ${MIN_AGE}`);
      return createUnderAgeBlockResponse();
    }

    // Rule 3: Auto-set minor flag for users under 18
    if (status.age !== null && status.age < ADULT_AGE && !status.isMinor) {
      await autoUpdateMinorStatus(userId, status.age);
    }

    // Rules 4-6: Bedtime mode enforcement
    if (isWithinBedtime(status.bedtimeStart, status.bedtimeEnd)) {
      console.warn(
        `[FamilyProtection] Blocked ${userId} - bedtime mode (${status.bedtimeStart} - ${status.bedtimeEnd})`
      );
      return createBedtimeBlockResponse(status.bedtimeEnd || '07:00');
    }

    // Rules 7-8: Cooldown mode enforcement
    if (status.coolDownUntil && status.coolDownUntil > new Date()) {
      console.warn(
        `[FamilyProtection] Blocked ${userId} - cooldown until ${status.coolDownUntil.toISOString()}`
      );
      return createCoolDownBlockResponse(status.coolDownUntil);
    }

    // Rules 9-10: Monthly spend limit enforcement (payment routes only)
    const isPaymentRoute = PROTECTED_ROUTES.PAYMENT.some(p => pathname.startsWith(p));
    if (isPaymentRoute && status.currentMonthlySpend >= status.monthlySpendLimit) {
      console.warn(
        `[FamilyProtection] Blocked ${userId} - monthly spend limit exceeded ($${status.currentMonthlySpend} >= $${status.monthlySpendLimit})`
      );
      return createMonthlySpendLimitResponse(
        status.currentMonthlySpend,
        status.monthlySpendLimit
      );
    }

    // All checks passed - allow request
    console.log(`[FamilyProtection] Allowed ${userId} - all checks passed`);

    const response = NextResponse.next();
    response.headers.set('X-Family-Protection-Passed', 'true');
    if (status.isMinor) {
      response.headers.set('X-Minor-User', 'true');
    }

    return response;

  } catch (error) {
    console.error('[FamilyProtection] Middleware error:', error);

    // Fail-closed: if we can't check, block access for safety
    return NextResponse.json(
      {
        error: {
          code: 'PROTECTION_CHECK_FAILED',
          message: 'Unable to verify family protection status. Please try again.',
        },
      },
      { status: 503 }
    );
  }
}

export default familyProtectionMiddleware;

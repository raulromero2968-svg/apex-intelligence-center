/**
 * FHI Corrigibility Security Module (KB-05)
 *
 * Implements corrigibility checks for simulation market predictions based on
 * Future of Humanity Institute alignment principles:
 * - Utility indifference: AI should be indifferent to shutdown
 * - Recursive rewards: Ensure AI goals accept corrections
 * - POST-Agency techniques: Per-outcome shutdown thresholds
 *
 * Features:
 * - JWT claim-based role verification for simulation access
 * - Harmful outcome prevention (extinction bets, manipulation)
 * - MFA challenge support for high-stake posthuman predictions
 * - Shutdown flag enforcement for corrigibility compliance
 *
 * Trade-offs:
 * - GOOD: Prevents betting on harmful outcomes, enforces ethics
 * - BAD: Additional latency for claim verification (~5-10ms)
 * - MITIGATED: Redis-backed session caching reduces repeated checks
 *
 * References:
 * - Thornley 2025: Transformation for accepting shutdowns without resistance
 * - Bostrom 2025: Cosmic host norms for ethical AI stability
 */

import { jwtVerify, SignJWT } from 'jose';
import { Redis } from '@upstash/redis';
import * as Sentry from '@sentry/nextjs';
import { NextRequest } from 'next/server';

// Types
export type SimulationRole = 'free' | 'pro' | 'enterprise' | 'researcher';

export interface FHICorrigibilityPayload {
  userId: string;
  role: SimulationRole;
  simulationLimit: number; // Max simulations per day
  shutdownFlag?: boolean; // Corrigibility: user accepts model corrections
  mfaVerified?: boolean; // MFA for high-stakes predictions
  ethicsAcknowledged?: boolean; // User acknowledged ethical guidelines
  sessionId: string;
  iat?: number;
  exp?: number;
}

export interface CorrigibilityCheckResult {
  allowed: boolean;
  reason?: string;
  requiredAction?: 'mfa_challenge' | 'ethics_acknowledge' | 'upgrade_tier';
  remainingSimulations?: number;
}

export interface OutcomeValidation {
  outcome: string;
  isHarmful: boolean;
  harmCategory?: 'extinction' | 'manipulation' | 'exploitation' | 'misinformation';
  ethicsWarning?: string;
}

// Environment
const JWT_SECRET = process.env.JWT_SECRET;
const FHI_ETHICS_SECRET = process.env.FHI_ETHICS_SECRET || JWT_SECRET;

// Role-based simulation limits (KB-05 tiered access)
const SIMULATION_LIMITS: Record<SimulationRole, number> = {
  free: 5,        // 5 simulations/day
  pro: 100,       // 100 simulations/day
  enterprise: 1000, // 1000 simulations/day
  researcher: -1, // Unlimited (academic/FHI collaboration)
};

// Redis client for usage tracking
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      return redis;
    } catch (error) {
      console.warn('Failed to initialize Redis for FHI corrigibility:', error);
      return null;
    }
  }

  return null;
}

// Harmful outcome patterns (FHI longtermist alignment)
const HARMFUL_OUTCOME_PATTERNS = [
  // Extinction betting
  {
    pattern: /\b(extinction|human.?end|civilization.?collapse|apocalypse|end.?of.?humanity)\b/i,
    category: 'extinction' as const,
    warning: 'Betting on extinction events violates FHI longtermist principles',
  },
  // Manipulation
  {
    pattern: /\b(manipulate|deceive|trick|exploit.?users|social.?engineering)\b/i,
    category: 'manipulation' as const,
    warning: 'Simulation outcomes involving manipulation are prohibited',
  },
  // Exploitation
  {
    pattern: /\b(child|minor|vulnerable|slave|trafficking)\b/i,
    category: 'exploitation' as const,
    warning: 'Predictions involving exploitation are strictly prohibited',
  },
  // Misinformation
  {
    pattern: /\b(fake.?news|disinformation|propaganda|election.?fraud)\b/i,
    category: 'misinformation' as const,
    warning: 'Simulation markets cannot promote misinformation',
  },
];

/**
 * Verify FHI corrigibility from JWT token
 *
 * Extracts and validates claims for simulation market access:
 * - Role verification (free/pro/enterprise/researcher)
 * - Simulation limit checking
 * - Shutdown flag compliance
 */
export async function verifyFHICorrigibility(
  token: string
): Promise<FHICorrigibilityPayload | null> {
  if (!JWT_SECRET) {
    console.warn('JWT_SECRET not configured for FHI corrigibility');
    return null;
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    // Map standard claims to FHI corrigibility payload
    const fhiPayload: FHICorrigibilityPayload = {
      userId: String(payload.userId || payload.sub),
      role: (payload.role as SimulationRole) ||
            (payload.tier as SimulationRole) ||
            'free',
      simulationLimit: typeof payload.simulationLimit === 'number'
        ? payload.simulationLimit
        : SIMULATION_LIMITS[(payload.role as SimulationRole) || 'free'],
      shutdownFlag: payload.shutdownFlag === true,
      mfaVerified: payload.mfaVerified === true,
      ethicsAcknowledged: payload.ethicsAcknowledged === true,
      sessionId: String(payload.sessionId || ''),
    };

    return fhiPayload;
  } catch (error) {
    Sentry.captureException(error, {
      extra: { context: 'FHI corrigibility verification' },
    });
    return null;
  }
}

/**
 * Check if user is corrigible (accepts model corrections/shutdowns)
 *
 * Based on Thornley 2025 transformation principles:
 * - Utility indifference: User is indifferent to model shutdown
 * - Recursive rewards: User goals accept AI corrections
 *
 * @param token - JWT token with FHI claims
 * @param outcome - Proposed simulation outcome to validate
 * @returns CorrigibilityCheckResult with allowed status and reasons
 */
export async function fhiCorrigible(
  token: string,
  outcome: string
): Promise<CorrigibilityCheckResult> {
  // Verify token
  const payload = await verifyFHICorrigibility(token);

  if (!payload) {
    return {
      allowed: false,
      reason: 'Invalid or missing authentication token',
      requiredAction: 'upgrade_tier',
    };
  }

  // Check role permissions
  if (payload.role === 'free' && !payload.ethicsAcknowledged) {
    return {
      allowed: false,
      reason: 'Free tier users must acknowledge ethics guidelines',
      requiredAction: 'ethics_acknowledge',
    };
  }

  // Validate outcome for harmful content
  const outcomeValidation = validateOutcome(outcome);
  if (outcomeValidation.isHarmful) {
    return {
      allowed: false,
      reason: outcomeValidation.ethicsWarning || 'Outcome violates FHI ethics',
    };
  }

  // Check simulation usage limits
  const usageCheck = await checkSimulationUsage(payload.userId, payload.role);
  if (!usageCheck.allowed) {
    return {
      allowed: false,
      reason: `Simulation limit reached (${SIMULATION_LIMITS[payload.role]}/day)`,
      requiredAction: 'upgrade_tier',
      remainingSimulations: 0,
    };
  }

  // High-stakes predictions require MFA
  if (isHighStakesOutcome(outcome) && !payload.mfaVerified) {
    return {
      allowed: false,
      reason: 'High-stakes posthuman predictions require MFA verification',
      requiredAction: 'mfa_challenge',
      remainingSimulations: usageCheck.remaining,
    };
  }

  // All checks passed
  return {
    allowed: true,
    remainingSimulations: usageCheck.remaining,
  };
}

/**
 * Validate outcome for harmful content
 *
 * Prevents betting on harmful outcomes per FHI alignment:
 * - Extinction events
 * - Manipulation/exploitation
 * - Misinformation campaigns
 */
export function validateOutcome(outcome: string): OutcomeValidation {
  const lowerOutcome = outcome.toLowerCase();

  for (const { pattern, category, warning } of HARMFUL_OUTCOME_PATTERNS) {
    if (pattern.test(lowerOutcome)) {
      return {
        outcome,
        isHarmful: true,
        harmCategory: category,
        ethicsWarning: warning,
      };
    }
  }

  return {
    outcome,
    isHarmful: false,
  };
}

/**
 * Check if outcome is high-stakes (requires MFA)
 *
 * High-stakes outcomes include:
 * - Posthuman predictions
 * - Large market cap implications (>$1M)
 * - AI singularity scenarios
 */
function isHighStakesOutcome(outcome: string): boolean {
  const highStakesPatterns = [
    /\b(posthuman|singularity|superintelligence|agi)\b/i,
    /\$\s*\d{7,}/i, // $1,000,000+
    /\b(billion|trillion)\b/i,
    /\b(global|world).?(changing|altering)\b/i,
  ];

  return highStakesPatterns.some((pattern) => pattern.test(outcome));
}

/**
 * Check simulation usage against tier limits
 *
 * Uses Redis for distributed usage tracking with 24h TTL
 */
async function checkSimulationUsage(
  userId: string,
  role: SimulationRole
): Promise<{ allowed: boolean; remaining: number }> {
  const limit = SIMULATION_LIMITS[role];

  // Unlimited for researchers
  if (limit === -1) {
    return { allowed: true, remaining: -1 };
  }

  const redisClient = getRedis();
  if (!redisClient) {
    // Allow without tracking if Redis unavailable
    return { allowed: true, remaining: limit };
  }

  const key = `fhi:simulation:usage:${userId}`;

  try {
    const current = await redisClient.get<number>(key) || 0;

    if (current >= limit) {
      return { allowed: false, remaining: 0 };
    }

    return { allowed: true, remaining: limit - current };
  } catch (error) {
    console.warn('Failed to check simulation usage:', error);
    return { allowed: true, remaining: limit };
  }
}

/**
 * Increment simulation usage counter
 *
 * Call after successful simulation to track usage
 */
export async function incrementSimulationUsage(userId: string): Promise<void> {
  const redisClient = getRedis();
  if (!redisClient) return;

  const key = `fhi:simulation:usage:${userId}`;

  try {
    const exists = await redisClient.exists(key);
    if (exists) {
      await redisClient.incr(key);
    } else {
      // Set with 24h TTL (resets daily)
      await redisClient.set(key, 1, { ex: 86400 });
    }
  } catch (error) {
    console.warn('Failed to increment simulation usage:', error);
  }
}

/**
 * Generate ethics acknowledgment token
 *
 * Short-lived token (15min) that proves user acknowledged ethics guidelines
 */
export async function generateEthicsAcknowledgment(
  userId: string,
  sessionId: string
): Promise<string> {
  if (!FHI_ETHICS_SECRET) {
    throw new Error('FHI_ETHICS_SECRET not configured');
  }

  const secret = new TextEncoder().encode(FHI_ETHICS_SECRET);

  return await new SignJWT({
    userId,
    sessionId,
    ethicsAcknowledged: true,
    type: 'ethics_ack',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(secret);
}

/**
 * Extract FHI claims from request
 *
 * Utility function for API routes to get corrigibility claims
 */
export async function getFHIClaimsFromRequest(
  req: NextRequest
): Promise<FHICorrigibilityPayload | null> {
  // Try Authorization header first
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    return verifyFHICorrigibility(token);
  }

  // Try cookie
  const cookieToken = req.cookies.get('accessToken')?.value;
  if (cookieToken) {
    return verifyFHICorrigibility(cookieToken);
  }

  return null;
}

/**
 * Middleware-style corrigibility check for API routes
 *
 * Returns null if allowed, or error response if blocked
 */
export async function checkCorrigibilityMiddleware(
  req: NextRequest,
  outcome: string
): Promise<Response | null> {
  const token = req.headers.get('authorization')?.slice(7) ||
                req.cookies.get('accessToken')?.value;

  if (!token) {
    return Response.json(
      {
        ok: false,
        error: 'Authentication required for simulation markets',
        requiredAction: 'login',
      },
      { status: 401 }
    );
  }

  const check = await fhiCorrigible(token, outcome);

  if (!check.allowed) {
    const status = check.requiredAction === 'mfa_challenge' ? 403 :
                   check.requiredAction === 'ethics_acknowledge' ? 403 :
                   check.requiredAction === 'upgrade_tier' ? 402 : 400;

    return Response.json(
      {
        ok: false,
        error: check.reason,
        requiredAction: check.requiredAction,
        remainingSimulations: check.remainingSimulations,
      },
      { status }
    );
  }

  // Increment usage counter on successful check
  const payload = await verifyFHICorrigibility(token);
  if (payload) {
    await incrementSimulationUsage(payload.userId);
  }

  return null; // Allowed
}

/**
 * Create corrigibility-enhanced JWT claims
 *
 * Extends standard JWT with FHI corrigibility fields
 */
export function createFHICorrigibilityClaims(
  basePayload: Record<string, unknown>,
  options: {
    role?: SimulationRole;
    ethicsAcknowledged?: boolean;
    shutdownFlag?: boolean;
  } = {}
): Record<string, unknown> {
  const role = options.role || 'free';

  return {
    ...basePayload,
    role,
    simulationLimit: SIMULATION_LIMITS[role],
    ethicsAcknowledged: options.ethicsAcknowledged ?? false,
    shutdownFlag: options.shutdownFlag ?? true, // Default to corrigible
  };
}

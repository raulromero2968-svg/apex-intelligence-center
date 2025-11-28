/**
 * Secure JWT Authentication Library (knowledge-05 patterns)
 *
 * Features:
 * - JWT + Refresh Token Rotation (double-submit cookies)
 * - HttpOnly, Secure, SameSite=Strict cookies
 * - Redis-backed session revocation
 * - Per-request authentication
 * - Subscription tier support for rate limiting
 * - Simulation claims with corrigibility metadata (KB-05 + POST-Agency)
 * - MFA challenges for high-stake bets on posthuman outcomes
 */

import { NextRequest } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { Redis } from '@upstash/redis';

// Types
export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface UserWithTier {
  id: string;
  email: string;
  name?: string;
  subscriptionTier: SubscriptionTier;
  accountType?: string | null;
  breakModeUntil?: string | null;
  breakModeActivatedBy?: string | null;
}

interface JWTPayload {
  userId: string;
  email: string;
  name?: string;
  tier: SubscriptionTier;
  type: 'access' | 'refresh';
  sessionId: string;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

// Environment validation
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  console.warn(
    'JWT_SECRET and JWT_REFRESH_SECRET must be set in environment variables. ' +
    'Authentication will be disabled.'
  );
}

// Redis client for session revocation
let redis: Redis | null = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch (error) {
  console.warn('Failed to initialize Redis for session management:', error);
}

/**
 * Generate access token (15min expiry)
 */
export async function generateAccessToken(user: UserWithTier, sessionId: string): Promise<string> {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  const secret = new TextEncoder().encode(JWT_SECRET);

  return await new SignJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
    tier: user.subscriptionTier,
    type: 'access',
    sessionId,
  } as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(secret);
}

/**
 * Generate refresh token (7 days expiry)
 */
export async function generateRefreshToken(user: UserWithTier, sessionId: string): Promise<string> {
  if (!JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET not configured');
  }

  const secret = new TextEncoder().encode(JWT_REFRESH_SECRET);

  return await new SignJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
    tier: user.subscriptionTier,
    type: 'refresh',
    sessionId,
  } as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

/**
 * Verify access token
 */
export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  if (!JWT_SECRET) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    // Check if session is revoked
    if (redis && payload.sessionId) {
      const isRevoked = await (redis as any).get(`session:revoked:${payload.sessionId}`);
      if (isRevoked) {
        return null;
      }
    }

    return payload as JWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Verify refresh token
 */
export async function verifyRefreshToken(token: string): Promise<JWTPayload | null> {
  if (!JWT_REFRESH_SECRET) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(JWT_REFRESH_SECRET);
    const { payload } = await jwtVerify(token, secret);

    // Check if session is revoked
    if (redis && payload.sessionId) {
      const isRevoked = await (redis as any).get(`session:revoked:${payload.sessionId}`);
      if (isRevoked) {
        return null;
      }
    }

    return payload as JWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Revoke session (logout, security breach, etc.)
 */
export async function revokeSession(sessionId: string): Promise<void> {
  if (!redis) {
    console.warn('Redis not available - session revocation disabled');
    return;
  }

  // Store revocation for 7 days (max refresh token lifetime)
  await (redis as any).set(`session:revoked:${sessionId}`, '1', { ex: 7 * 24 * 60 * 60 });
}

/**
 * Extract user from request (zero-trust per-request auth)
 *
 * Checks for:
 * 1. Authorization: Bearer <token> header
 * 2. Cookie: accessToken
 *
 * Returns null if authentication fails
 */
export async function getUserFromRequest(req: NextRequest): Promise<UserWithTier | null> {
  // Try Authorization header first (for API clients)
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = await verifyAccessToken(token);

    if (payload) {
      return {
        id: payload.userId,
        email: payload.email,
        name: payload.name,
        subscriptionTier: payload.tier || 'free',
      };
    }
  }

  // Try HttpOnly cookie (for browser clients)
  const cookieToken = req.cookies.get('accessToken')?.value;
  if (cookieToken) {
    const payload = await verifyAccessToken(cookieToken);

    if (payload) {
      return {
        id: payload.userId,
        email: payload.email,
        name: payload.name,
        subscriptionTier: payload.tier || 'free',
      };
    }
  }

  return null;
}

/**
 * Rotate refresh token (use after successful refresh)
 *
 * This implements refresh token rotation to prevent replay attacks.
 * Old refresh token is implicitly invalidated by sessionId change.
 */
export async function rotateRefreshToken(
  oldRefreshToken: string
): Promise<{ user: UserWithTier; accessToken: string; refreshToken: string } | null> {
  const payload = await verifyRefreshToken(oldRefreshToken);

  if (!payload) {
    return null;
  }

  const user: UserWithTier = {
    id: payload.userId,
    email: payload.email,
    name: payload.name,
    subscriptionTier: payload.tier || 'free',
  };

  // Generate new session ID for rotation
  const newSessionId = crypto.randomUUID();

  // Revoke old session
  await revokeSession(payload.sessionId);

  // Generate new tokens
  const accessToken = await generateAccessToken(user, newSessionId);
  const refreshToken = await generateRefreshToken(user, newSessionId);

  return { user, accessToken, refreshToken };
}

/**
 * Helper: Set auth cookies in response
 *
 * Use this when setting tokens after login/refresh
 */
export function setAuthCookies(
  headers: Headers,
  accessToken: string,
  refreshToken: string
): void {
  const isProduction = process.env.NODE_ENV === 'production';

  // Access token (15min)
  headers.append(
    'Set-Cookie',
    `accessToken=${accessToken}; HttpOnly; Secure=${isProduction}; SameSite=Strict; Path=/; Max-Age=${15 * 60}`
  );

  // Refresh token (7 days)
  headers.append(
    'Set-Cookie',
    `refreshToken=${refreshToken}; HttpOnly; Secure=${isProduction}; SameSite=Strict; Path=/api/auth/refresh; Max-Age=${7 * 24 * 60 * 60}`
  );
}

/**
 * Helper: Clear auth cookies (logout)
 */
export function clearAuthCookies(headers: Headers): void {
  headers.append(
    'Set-Cookie',
    'accessToken=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
  );
  headers.append(
    'Set-Cookie',
    'refreshToken=; HttpOnly; Secure; SameSite=Strict; Path=/api/auth/refresh; Max-Age=0'
  );
}

// ============================================================================
// SIMULATION CLAIMS (KB-05 + POST-Agency)
// ============================================================================

/**
 * Simulation claims for JWT tokens
 *
 * Extends standard JWT with simulation-specific claims:
 * - simulationLimit: Max simulations per day (tier-based)
 * - corrigible: Whether agent accepts shutdown/corrections
 * - postAgencyEnabled: Runtime goal shift capability
 * - mfaVerified: For high-stake posthuman predictions
 */
export interface SimulationClaims {
  simulationLimit: number;        // Max simulations per day (e.g., 100 for pro)
  corrigible: boolean;            // Shutdown-safe agent flag
  postAgencyEnabled: boolean;     // Runtime goal shift capability
  utopiaFraming: boolean;         // Deep utopia abundance focus
  mfaVerified?: boolean;          // MFA verified for high-stake bets
  lastMfaAt?: number;             // Unix timestamp of last MFA
  highStakeAccess?: boolean;      // Access to >$1000 stake predictions
}

/**
 * Extended user with simulation claims
 */
export interface UserWithSimulationClaims extends UserWithTier {
  simulationClaims?: SimulationClaims;
}

/**
 * Extended JWT payload with simulation claims
 */
interface SimulationJWTPayload extends JWTPayload {
  simulation?: SimulationClaims;
}

/**
 * Get default simulation claims based on tier
 *
 * @param tier - Subscription tier
 * @returns Default simulation claims for tier
 */
export function getDefaultSimulationClaims(tier: SubscriptionTier): SimulationClaims {
  switch (tier) {
    case 'enterprise':
      return {
        simulationLimit: Infinity,
        corrigible: true,
        postAgencyEnabled: true,
        utopiaFraming: true,
        highStakeAccess: true,
      };
    case 'pro':
      return {
        simulationLimit: 100,
        corrigible: true,
        postAgencyEnabled: true,
        utopiaFraming: true,
        highStakeAccess: false,
      };
    case 'free':
    default:
      return {
        simulationLimit: 10,
        corrigible: true,
        postAgencyEnabled: false,
        utopiaFraming: true,
        highStakeAccess: false,
      };
  }
}

/**
 * Generate access token with simulation claims
 *
 * @param user - User with tier
 * @param sessionId - Session identifier
 * @param simulationClaims - Optional custom simulation claims
 * @returns JWT access token with simulation claims
 */
export async function generateSimulationAccessToken(
  user: UserWithTier,
  sessionId: string,
  simulationClaims?: Partial<SimulationClaims>
): Promise<string> {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  const defaultClaims = getDefaultSimulationClaims(user.subscriptionTier);
  const mergedClaims: SimulationClaims = { ...defaultClaims, ...simulationClaims };

  const secret = new TextEncoder().encode(JWT_SECRET);

  return await new SignJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
    tier: user.subscriptionTier,
    type: 'access',
    sessionId,
    simulation: mergedClaims,
  } as SimulationJWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(secret);
}

/**
 * Extract simulation claims from request
 *
 * @param req - Next.js request
 * @returns User with simulation claims or null
 */
export async function getUserWithSimulationClaims(
  req: NextRequest
): Promise<UserWithSimulationClaims | null> {
  const user = await getUserFromRequest(req);

  if (!user) {
    return null;
  }

  // Try to get simulation claims from token
  const authHeader = req.headers.get('authorization');
  const cookieToken = req.cookies.get('accessToken')?.value;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : cookieToken;

  if (!token || !JWT_SECRET) {
    // Return user with default claims
    return {
      ...user,
      simulationClaims: getDefaultSimulationClaims(user.subscriptionTier),
    };
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const simPayload = payload as SimulationJWTPayload;

    return {
      ...user,
      simulationClaims: simPayload.simulation ?? getDefaultSimulationClaims(user.subscriptionTier),
    };
  } catch (error) {
    // Return user with default claims on verification failure
    return {
      ...user,
      simulationClaims: getDefaultSimulationClaims(user.subscriptionTier),
    };
  }
}

/**
 * Check if user requires MFA for high-stake predictions
 *
 * @param user - User with simulation claims
 * @param stakeAmount - Proposed stake amount in USD
 * @returns Whether MFA is required
 */
export function requiresMfaForStake(
  user: UserWithSimulationClaims,
  stakeAmount: number
): boolean {
  // Threshold for requiring MFA
  const MFA_THRESHOLD_USD = 1000;
  // MFA validity period (1 hour)
  const MFA_VALIDITY_MS = 60 * 60 * 1000;

  if (stakeAmount < MFA_THRESHOLD_USD) {
    return false;
  }

  const claims = user.simulationClaims;
  if (!claims) {
    return true;
  }

  // Check if MFA was recently verified
  if (claims.mfaVerified && claims.lastMfaAt) {
    const mfaAge = Date.now() - claims.lastMfaAt;
    if (mfaAge < MFA_VALIDITY_MS) {
      return false;
    }
  }

  return true;
}

/**
 * Check corrigibility status for agent operations
 *
 * @param user - User with simulation claims
 * @returns Whether agent is corrigible (accepts shutdown/corrections)
 */
export function isCorrigible(user: UserWithSimulationClaims): boolean {
  return user.simulationClaims?.corrigible ?? true;
}


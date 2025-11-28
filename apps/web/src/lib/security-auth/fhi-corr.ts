/**
 * FHI Corrigibility Module (KB-05 Security Integration)
 *
 * Implements corrigibility checks for simulation agents following:
 * - Thornley's POST-Agency framework (recursive rewards for AI shutdown acceptance)
 * - FHI longtermism principles (prevent bets on harmful outcomes)
 * - Utility indifference for goal correction acceptance
 *
 * Security features:
 * - JWT claims for simulation access (role-based, pro tier limits)
 * - Harmful outcome blocking (extinction predictions disallowed)
 * - Corrigibility flags for shutdown-safe agents
 *
 * Trade-offs:
 * - GOOD: Prevents speculation on catastrophic outcomes
 * - BAD: May limit legitimate research - use research tier for exceptions
 */

import { jwtVerify, SignJWT, type JWTPayload as JoseJWTPayload } from 'jose';
import * as Sentry from '@sentry/nextjs';
import type { SubscriptionTier } from '../auth/jwt';

/**
 * Simulation-specific JWT claims
 */
export interface SimulationClaims extends JoseJWTPayload {
  userId: string;
  email: string;
  role: SubscriptionTier;
  /** Maximum simulations per day for this user */
  simulationLimit: number;
  /** Whether agent is corrigible (accepts corrections/shutdown) */
  corrigible: boolean;
  /** Research exemption for academic study of harmful scenarios */
  researchExemption?: boolean;
  /** Session timestamp for freshness checks */
  sessionStart: number;
}

/**
 * Corrigibility check result
 */
export interface CorrigibilityResult {
  allowed: boolean;
  reason: string;
  requiresMfa: boolean;
  requiresDisclaimer: boolean;
}

/**
 * Harmful outcome patterns (Bostrom-derived)
 * These outcomes cannot be speculated on for ethical reasons
 */
const HARMFUL_OUTCOMES = [
  'extinction',
  'existential risk',
  'civilizational collapse',
  'mass casualty',
  'catastrophic',
  'apocalyptic',
  'annihilation',
  'human extinction',
] as const;

/**
 * High-stake outcome patterns requiring MFA
 */
const HIGH_STAKE_OUTCOMES = [
  'posthuman',
  'superintelligence',
  'singularity',
  'transcendence',
  'consciousness upload',
  'digital immortality',
] as const;

/**
 * Simulation limits by tier
 */
export const SIMULATION_LIMITS: Record<SubscriptionTier, number> = {
  free: 5,
  pro: 100,
  enterprise: 1000,
};

/**
 * Verify JWT and extract simulation claims
 *
 * @param token - JWT access token
 * @returns Decoded simulation claims or null if invalid
 */
export async function verifySimulationToken(
  token: string
): Promise<SimulationClaims | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET not configured for simulation verification');
    return null;
  }

  try {
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey);

    // Extract and validate simulation claims
    const claims: SimulationClaims = {
      userId: payload.userId as string,
      email: payload.email as string,
      role: (payload.tier as SubscriptionTier) || 'free',
      simulationLimit: SIMULATION_LIMITS[(payload.tier as SubscriptionTier) || 'free'],
      corrigible: payload.corrigible !== false, // Default to true
      researchExemption: payload.researchExemption === true,
      sessionStart: payload.iat || Date.now() / 1000,
    };

    return claims;
  } catch (error) {
    Sentry.captureException(error, {
      extra: { context: 'simulation_token_verification' },
    });
    return null;
  }
}

/**
 * Check if outcome contains harmful patterns
 *
 * @param outcome - Simulation outcome description
 * @returns true if outcome matches harmful patterns
 */
export function isHarmfulOutcome(outcome: string): boolean {
  const normalized = outcome.toLowerCase();
  return HARMFUL_OUTCOMES.some((pattern) => normalized.includes(pattern));
}

/**
 * Check if outcome requires MFA verification
 *
 * @param outcome - Simulation outcome description
 * @returns true if outcome is high-stakes requiring additional verification
 */
export function isHighStakeOutcome(outcome: string): boolean {
  const normalized = outcome.toLowerCase();
  return HIGH_STAKE_OUTCOMES.some((pattern) => normalized.includes(pattern));
}

/**
 * FHI Corrigibility Check
 *
 * Validates whether a simulation prediction is allowed based on:
 * 1. User role and tier limits
 * 2. Harmful outcome blocking (unless research exemption)
 * 3. High-stake MFA requirements
 * 4. Corrigibility flags
 *
 * @param token - JWT access token
 * @param outcome - Proposed simulation outcome
 * @returns Corrigibility result with allowed status and requirements
 *
 * @example
 * ```typescript
 * const result = await fhiCorrigible(token, "extinction probability analysis");
 * if (!result.allowed) {
 *   return Response.json({ error: result.reason }, { status: 403 });
 * }
 * ```
 */
export async function fhiCorrigible(
  token: string,
  outcome: string
): Promise<CorrigibilityResult> {
  return Sentry.startSpan(
    { name: 'security.fhi.corrigibility', op: 'auth.check' },
    async (span) => {
      span?.setAttribute('outcome', outcome.slice(0, 100));

      // Verify token and extract claims
      const claims = await verifySimulationToken(token);

      if (!claims) {
        span?.setAttribute('result', 'invalid_token');
        return {
          allowed: false,
          reason: 'Invalid or expired authentication token',
          requiresMfa: false,
          requiresDisclaimer: false,
        };
      }

      span?.setAttribute('user.role', claims.role);
      span?.setAttribute('user.corrigible', claims.corrigible);

      // Check corrigibility flag (agent must accept corrections)
      if (!claims.corrigible) {
        span?.setAttribute('result', 'not_corrigible');
        return {
          allowed: false,
          reason: 'Agent corrigibility flag not set. Enable shutdown acceptance.',
          requiresMfa: true,
          requiresDisclaimer: true,
        };
      }

      // Check for harmful outcomes (blocked unless research exemption)
      if (isHarmfulOutcome(outcome)) {
        if (claims.researchExemption && claims.role === 'enterprise') {
          span?.setAttribute('result', 'research_exemption');
          return {
            allowed: true,
            reason: 'Research exemption granted for academic study',
            requiresMfa: true,
            requiresDisclaimer: true,
          };
        }

        span?.setAttribute('result', 'harmful_blocked');
        return {
          allowed: false,
          reason:
            'Harmful outcome speculation blocked. FHI ethics: Simulations for flourishing, not extinction.',
          requiresMfa: false,
          requiresDisclaimer: false,
        };
      }

      // Check for high-stake outcomes (require MFA and disclaimer)
      if (isHighStakeOutcome(outcome)) {
        span?.setAttribute('result', 'high_stake');
        return {
          allowed: true,
          reason: 'High-stake simulation allowed with additional verification',
          requiresMfa: claims.role !== 'enterprise', // Enterprise users bypass MFA
          requiresDisclaimer: true,
        };
      }

      // Default: allowed with standard disclaimer
      span?.setAttribute('result', 'allowed');
      return {
        allowed: true,
        reason: 'Simulation permitted within ethical guidelines',
        requiresMfa: false,
        requiresDisclaimer: claims.role === 'free', // Free users see disclaimer
      };
    }
  );
}

/**
 * Generate simulation-enabled JWT with corrigibility claims
 *
 * @param userId - User identifier
 * @param email - User email
 * @param tier - Subscription tier
 * @param options - Additional claim options
 * @returns Signed JWT with simulation claims
 */
export async function generateSimulationToken(
  userId: string,
  email: string,
  tier: SubscriptionTier,
  options: {
    corrigible?: boolean;
    researchExemption?: boolean;
    sessionId: string;
  }
): Promise<string> {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }

  const secretKey = new TextEncoder().encode(secret);

  const claims: Partial<SimulationClaims> = {
    userId,
    email,
    role: tier,
    simulationLimit: SIMULATION_LIMITS[tier],
    corrigible: options.corrigible !== false,
    researchExemption: options.researchExemption === true,
    sessionStart: Date.now() / 1000,
  };

  return await new SignJWT({ ...claims, sessionId: options.sessionId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(secretKey);
}

/**
 * Validate session freshness for sensitive operations
 * Sessions older than 30 minutes require re-authentication
 *
 * @param claims - Simulation claims from JWT
 * @returns true if session is fresh enough for sensitive operations
 */
export function isSessionFresh(claims: SimulationClaims): boolean {
  const maxAge = 30 * 60; // 30 minutes in seconds
  const now = Date.now() / 1000;
  return now - claims.sessionStart < maxAge;
}

/**
 * Get ethical disclaimer text for simulation outputs
 *
 * @param highStake - Whether this is a high-stake simulation
 * @returns Disclaimer text for UI display
 */
export function getEthicalDisclaimer(highStake: boolean): string {
  if (highStake) {
    return (
      'Simulations for flourishing, not speculation. ' +
      'This analysis explores posthuman scenarios for educational purposes only. ' +
      'FHI alignment: Long-term human flourishing is the goal.'
    );
  }

  return (
    'Simulation analysis is for educational and research purposes. ' +
    'Market predictions are probabilistic estimates, not financial advice.'
  );
}

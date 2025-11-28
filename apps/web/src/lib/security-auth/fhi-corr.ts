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

// ============================================================================
// LITERATURE-ENHANCED CORRIGIBILITY (KB-05 + KB-02 Integration)
// ============================================================================
// Extended claims for foundational literature integration with simulation markets.
// Adds deep utopia framing and ethical score requirements.

/**
 * Literature-enhanced simulation claims
 */
export interface LiteratureSimulationClaims extends SimulationClaims {
  /** Minimum ethics score requirement for literature sources */
  minEthicsScore: number;
  /** Whether deep utopia framing is enabled (abundance-focused posthuman scenarios) */
  deepUtopiaEnabled: boolean;
  /** Categories of literature allowed for this user */
  allowedLitCategories: Array<'religion' | 'philosophy' | 'literature' | 'history' | 'science'>;
}

/**
 * Deep utopia configuration
 * From Bostrom's "Deep Utopia" - framing posthuman futures as abundance, not dystopia
 */
export interface DeepUtopiaConfig {
  /** Focus on meaningful posthuman scenarios */
  meaningfulWork: boolean;
  /** Emphasis on dignity in simulated futures */
  preserveDignity: boolean;
  /** Avoid dystopian biases in predictions */
  avoidDystopianBias: boolean;
  /** Value loading for beneficial AI outcomes */
  valueLoadingEnabled: boolean;
}

/**
 * Default deep utopia configuration
 */
export const DEFAULT_DEEP_UTOPIA_CONFIG: DeepUtopiaConfig = {
  meaningfulWork: true,
  preserveDignity: true,
  avoidDystopianBias: true,
  valueLoadingEnabled: true,
};

/**
 * Generate literature-enabled simulation token
 *
 * @param userId - User identifier
 * @param email - User email
 * @param tier - Subscription tier
 * @param options - Extended options including literature preferences
 * @returns Signed JWT with literature simulation claims
 */
export async function generateLiteratureSimulationToken(
  userId: string,
  email: string,
  tier: SubscriptionTier,
  options: {
    corrigible?: boolean;
    researchExemption?: boolean;
    sessionId: string;
    minEthicsScore?: number;
    deepUtopiaEnabled?: boolean;
    allowedLitCategories?: LiteratureSimulationClaims['allowedLitCategories'];
  }
): Promise<string> {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }

  const secretKey = new TextEncoder().encode(secret);

  // Determine min ethics score by tier
  const tierEthicsScores: Record<SubscriptionTier, number> = {
    free: 0.7, // Higher threshold for free tier (more filtering)
    pro: 0.5, // Standard threshold
    enterprise: 0.3, // Research tier can access lower-scored sources
  };

  const claims: Partial<LiteratureSimulationClaims> = {
    userId,
    email,
    role: tier,
    simulationLimit: SIMULATION_LIMITS[tier],
    corrigible: options.corrigible !== false,
    researchExemption: options.researchExemption === true,
    sessionStart: Date.now() / 1000,
    // Literature-specific claims
    minEthicsScore: options.minEthicsScore ?? tierEthicsScores[tier],
    deepUtopiaEnabled: options.deepUtopiaEnabled ?? true,
    allowedLitCategories: options.allowedLitCategories ?? [
      'religion',
      'philosophy',
      'literature',
      'history',
      'science',
    ],
  };

  return await new SignJWT({ ...claims, sessionId: options.sessionId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(secretKey);
}

/**
 * Literature corrigibility check
 *
 * Validates whether a literature-enhanced simulation is allowed based on:
 * 1. Base simulation corrigibility checks
 * 2. Literature category restrictions
 * 3. Ethics score requirements
 * 4. Deep utopia framing compliance
 *
 * @param token - JWT access token
 * @param outcome - Proposed simulation outcome
 * @param litCategory - Category of literature being used
 * @param litEthicsScore - Ethics score of literature source
 * @returns Corrigibility result
 */
export async function literatureCorrigible(
  token: string,
  outcome: string,
  litCategory: 'religion' | 'philosophy' | 'literature' | 'history' | 'science',
  litEthicsScore: number
): Promise<CorrigibilityResult & { deepUtopiaRequired: boolean }> {
  return Sentry.startSpan(
    { name: 'security.fhi.literature_corrigibility', op: 'auth.check' },
    async (span) => {
      span?.setAttribute('outcome', outcome.slice(0, 100));
      span?.setAttribute('litCategory', litCategory);
      span?.setAttribute('litEthicsScore', litEthicsScore);

      // First, check base corrigibility
      const baseResult = await fhiCorrigible(token, outcome);

      if (!baseResult.allowed) {
        return { ...baseResult, deepUtopiaRequired: false };
      }

      // Verify literature-specific claims
      const claims = await verifySimulationToken(token);
      if (!claims) {
        return {
          allowed: false,
          reason: 'Invalid authentication for literature access',
          requiresMfa: false,
          requiresDisclaimer: false,
          deepUtopiaRequired: false,
        };
      }

      // Check literature category access
      const litClaims = claims as unknown as LiteratureSimulationClaims;
      const allowedCategories = litClaims.allowedLitCategories || [
        'religion',
        'philosophy',
        'literature',
        'history',
        'science',
      ];

      if (!allowedCategories.includes(litCategory)) {
        span?.setAttribute('result', 'category_blocked');
        return {
          allowed: false,
          reason: `Access to ${litCategory} literature not permitted for this user`,
          requiresMfa: false,
          requiresDisclaimer: false,
          deepUtopiaRequired: false,
        };
      }

      // Check ethics score requirement
      const minEthicsScore = litClaims.minEthicsScore ?? 0.5;
      if (litEthicsScore < minEthicsScore) {
        span?.setAttribute('result', 'low_ethics_score');
        return {
          allowed: false,
          reason: `Literature source ethics score (${litEthicsScore}) below minimum (${minEthicsScore})`,
          requiresMfa: false,
          requiresDisclaimer: true,
          deepUtopiaRequired: false,
        };
      }

      // Deep utopia check for posthuman outcomes
      const deepUtopiaEnabled = litClaims.deepUtopiaEnabled ?? true;
      const requiresDeepUtopia = isHighStakeOutcome(outcome) && deepUtopiaEnabled;

      span?.setAttribute('result', 'allowed');
      span?.setAttribute('deepUtopiaRequired', requiresDeepUtopia);

      return {
        ...baseResult,
        deepUtopiaRequired: requiresDeepUtopia,
      };
    }
  );
}

/**
 * Get deep utopia disclaimer for posthuman scenarios
 *
 * @param config - Deep utopia configuration
 * @returns Disclaimer text emphasizing abundance and dignity
 */
export function getDeepUtopiaDisclaimer(config: Partial<DeepUtopiaConfig> = {}): string {
  const fullConfig = { ...DEFAULT_DEEP_UTOPIA_CONFIG, ...config };

  const parts: string[] = [];

  if (fullConfig.meaningfulWork) {
    parts.push('Posthuman scenarios should emphasize meaningful existence, not mere optimization.');
  }

  if (fullConfig.preserveDignity) {
    parts.push('All simulations must preserve dignity of potentially sentient digital minds.');
  }

  if (fullConfig.avoidDystopianBias) {
    parts.push('Analysis framed for flourishing, avoiding dystopian speculation biases.');
  }

  if (fullConfig.valueLoadingEnabled) {
    parts.push('Value loading enabled for beneficial AI outcomes per superintelligence strategies.');
  }

  return parts.join(' ');
}

/**
 * Corrigibility disclaimer combining FHI ethics and literature grounding
 *
 * @param litSourceCount - Number of literature sources used
 * @param avgEthicsScore - Average ethics score of sources
 * @param deepUtopia - Whether deep utopia framing is active
 * @returns Combined disclaimer
 */
export function getLiteratureCorrigibilityDisclaimer(
  litSourceCount: number,
  avgEthicsScore: number,
  deepUtopia: boolean
): string {
  const base = `Analysis grounded in ${litSourceCount} foundational texts (avg ethics: ${avgEthicsScore.toFixed(2)}/1.0). `;
  const fhi = 'FHI longtermism: Simulations for flourishing, not speculation. ';
  const utopia = deepUtopia
    ? getDeepUtopiaDisclaimer({ meaningfulWork: true, preserveDignity: true })
    : '';

  return base + fhi + utopia;
}

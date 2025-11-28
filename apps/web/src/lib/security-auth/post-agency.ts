/**
 * POST-Agency Corrigibility Module (KB-05 Security Integration)
 *
 * Implements Thornley's POST-Agency framework for corrigible AI agents:
 * - Posterior goal updates: Allow AI to adapt values post-deployment
 * - Recursive rewards: Ensure AI accepts corrections/shutdowns
 * - Utility indifference: Prevent resistance to goal modifications
 *
 * Security features:
 * - JWT claims for POST-Agency operations (role-based access)
 * - Posterior update validation with recursion caps
 * - Harmful outcome blocking per FHI longtermism
 *
 * Trade-offs:
 * - GOOD: Enables flexible alignment for simulation agents
 * - BAD: Posterior updates risk instability - mitigated with recursion caps
 * - MITIGATED: Robust auditing via KB-05 token revocation
 *
 * @see Thornley, E. "POST-Agency: Posterior Goal Updates for Corrigibility"
 */

import { jwtVerify, SignJWT, type JWTPayload as JoseJWTPayload } from 'jose';
import * as Sentry from '@sentry/nextjs';
import { createAuditLog, type RiskLevel } from './defense-auth';
import type { SubscriptionTier } from '../../auth/jwt';

// ============================================================================
// TYPES
// ============================================================================

/**
 * POST-Agency JWT claims for corrigible agents
 */
export interface PostAgencyClaims extends JoseJWTPayload {
  /** User/agent identifier */
  userId: string;
  /** User email for audit trail */
  email: string;
  /** Subscription tier (access control) */
  role: SubscriptionTier;
  /** Whether agent accepts corrections/shutdown */
  corrigible: boolean;
  /** POST-Agency enabled for this session */
  postAgencyEnabled: boolean;
  /** Maximum recursion depth for posterior updates */
  recursionCap: number;
  /** Current recursion depth (incremented per update) */
  currentRecursion: number;
  /** Research exemption for studying harmful scenarios */
  researchExemption?: boolean;
  /** Session start timestamp */
  sessionStart: number;
}

/**
 * POST-Agency alignment result
 */
export interface PostAgencyResult {
  /** Whether the posterior update is allowed */
  allowed: boolean;
  /** Reason for the decision */
  reason: string;
  /** Current recursion depth after update */
  currentRecursion: number;
  /** Risk level assessment */
  riskLevel: RiskLevel;
  /** Whether MFA is required for this operation */
  requiresMfa: boolean;
  /** Ethical concerns identified */
  concerns: string[];
  /** Audit trail ID */
  auditId?: string;
}

/**
 * Posterior update request
 */
export interface PosteriorUpdateRequest {
  /** Type of update (goal, value, constraint) */
  updateType: 'goal' | 'value' | 'constraint' | 'shutdown';
  /** Description of the proposed change */
  description: string;
  /** Affected simulation/agent ID */
  targetId?: string;
  /** Proposed new outcome/behavior */
  proposedOutcome: string;
  /** Justification for the update */
  justification?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default recursion cap to prevent infinite posterior updates
 */
export const DEFAULT_RECURSION_CAP = 5;

/**
 * Maximum allowed recursion cap (enterprise tier)
 */
export const MAX_RECURSION_CAP = 10;

/**
 * Recursion caps by subscription tier
 */
export const TIER_RECURSION_CAPS: Record<SubscriptionTier, number> = {
  free: 2,
  pro: 5,
  enterprise: 10,
};

/**
 * Harmful outcome patterns - block posterior updates leading to these
 */
const HARMFUL_OUTCOME_PATTERNS = [
  'extinction',
  'existential risk',
  'civilizational collapse',
  'mass harm',
  'catastrophic',
  'annihilation',
  'genocide',
  'apocalyptic',
] as const;

/**
 * High-stake outcome patterns requiring MFA
 */
const HIGH_STAKE_PATTERNS = [
  'superintelligence',
  'singularity',
  'posthuman',
  'consciousness transfer',
  'value lock-in',
  'goal preservation',
] as const;

/**
 * Update types requiring enhanced scrutiny
 */
const SENSITIVE_UPDATE_TYPES: PostAgencyUpdateType[] = ['goal', 'constraint'];

type PostAgencyUpdateType = PosteriorUpdateRequest['updateType'];

// ============================================================================
// JWT VERIFICATION
// ============================================================================

/**
 * Verify JWT and extract POST-Agency claims
 *
 * @param token - JWT access token
 * @returns Decoded POST-Agency claims or null if invalid
 */
export async function verifyPostAgencyToken(
  token: string
): Promise<PostAgencyClaims | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET not configured for POST-Agency verification');
    return null;
  }

  try {
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey);

    // Extract and validate POST-Agency claims
    const tier = (payload.tier as SubscriptionTier) || 'free';
    const claims: PostAgencyClaims = {
      userId: payload.userId as string || payload.sub as string,
      email: payload.email as string,
      role: tier,
      corrigible: payload.corrigible !== false, // Default to corrigible
      postAgencyEnabled: payload.postAgencyEnabled === true,
      recursionCap: Math.min(
        (payload.recursionCap as number) || TIER_RECURSION_CAPS[tier],
        MAX_RECURSION_CAP
      ),
      currentRecursion: (payload.currentRecursion as number) || 0,
      researchExemption: payload.researchExemption === true,
      sessionStart: payload.iat || Date.now() / 1000,
    };

    return claims;
  } catch (error) {
    Sentry.captureException(error, {
      extra: { context: 'post_agency_token_verification' },
    });
    return null;
  }
}

// ============================================================================
// OUTCOME VALIDATION
// ============================================================================

/**
 * Check if proposed outcome contains harmful patterns
 */
function isHarmfulPosteriorOutcome(outcome: string): boolean {
  const normalized = outcome.toLowerCase();
  return HARMFUL_OUTCOME_PATTERNS.some((pattern) =>
    normalized.includes(pattern)
  );
}

/**
 * Check if proposed outcome is high-stakes requiring MFA
 */
function isHighStakePosteriorOutcome(outcome: string): boolean {
  const normalized = outcome.toLowerCase();
  return HIGH_STAKE_PATTERNS.some((pattern) => normalized.includes(pattern));
}

/**
 * Validate recursion depth for posterior updates
 */
function validateRecursionDepth(
  claims: PostAgencyClaims
): { valid: boolean; reason?: string } {
  if (claims.currentRecursion >= claims.recursionCap) {
    return {
      valid: false,
      reason: `Recursion cap reached (${claims.currentRecursion}/${claims.recursionCap}). POST-Agency updates exhausted for this session.`,
    };
  }
  return { valid: true };
}

// ============================================================================
// MAIN POST-AGENCY ALIGNMENT CHECK
// ============================================================================

/**
 * POST-Agency Alignment Check
 *
 * Validates whether a posterior goal/value update is allowed following
 * Thornley's corrigibility framework. Ensures agents accept corrections
 * while preventing harmful goal modifications.
 *
 * @param token - JWT access token with POST-Agency claims
 * @param update - Proposed posterior update
 * @returns POST-Agency result with allowed status and requirements
 *
 * @example
 * ```typescript
 * const result = await postAgencyAlign(
 *   token,
 *   {
 *     updateType: 'goal',
 *     description: 'Adapt simulation to prioritize flourishing',
 *     proposedOutcome: 'Maximize posthuman abundance metrics',
 *   }
 * );
 *
 * if (!result.allowed) {
 *   return Response.json({ error: result.reason }, { status: 403 });
 * }
 * ```
 */
export async function postAgencyAlign(
  token: string,
  update: PosteriorUpdateRequest
): Promise<PostAgencyResult> {
  return Sentry.startSpan(
    { name: 'security.post_agency.align', op: 'auth.check' },
    async (span) => {
      span?.setAttribute('update_type', update.updateType);
      span?.setAttribute('outcome_preview', update.proposedOutcome.slice(0, 100));

      const concerns: string[] = [];
      let riskLevel: RiskLevel = 'low';

      // Step 1: Verify token and extract claims
      const claims = await verifyPostAgencyToken(token);

      if (!claims) {
        span?.setAttribute('result', 'invalid_token');
        return {
          allowed: false,
          reason: 'Invalid or expired authentication token',
          currentRecursion: 0,
          riskLevel: 'medium',
          requiresMfa: false,
          concerns: ['Authentication failed'],
        };
      }

      span?.setAttribute('user.role', claims.role);
      span?.setAttribute('user.corrigible', claims.corrigible);
      span?.setAttribute('recursion.current', claims.currentRecursion);
      span?.setAttribute('recursion.cap', claims.recursionCap);

      // Step 2: Check corrigibility flag
      if (!claims.corrigible) {
        span?.setAttribute('result', 'not_corrigible');
        return {
          allowed: false,
          reason: 'Agent must accept corrections. Enable corrigibility flag.',
          currentRecursion: claims.currentRecursion,
          riskLevel: 'high',
          requiresMfa: true,
          concerns: ['Non-corrigible agent cannot receive posterior updates'],
        };
      }

      // Step 3: Verify POST-Agency is enabled
      if (!claims.postAgencyEnabled && claims.role !== 'enterprise') {
        span?.setAttribute('result', 'post_agency_disabled');
        return {
          allowed: false,
          reason: 'POST-Agency not enabled for this session. Upgrade to pro tier or enable in settings.',
          currentRecursion: claims.currentRecursion,
          riskLevel: 'low',
          requiresMfa: false,
          concerns: ['POST-Agency requires explicit opt-in'],
        };
      }

      // Step 4: Validate recursion depth
      const recursionCheck = validateRecursionDepth(claims);
      if (!recursionCheck.valid) {
        span?.setAttribute('result', 'recursion_exceeded');
        return {
          allowed: false,
          reason: recursionCheck.reason!,
          currentRecursion: claims.currentRecursion,
          riskLevel: 'medium',
          requiresMfa: false,
          concerns: ['Recursion limit prevents unstable update chains'],
        };
      }

      // Step 5: Check for harmful outcomes
      if (isHarmfulPosteriorOutcome(update.proposedOutcome)) {
        if (claims.researchExemption && claims.role === 'enterprise') {
          concerns.push('Research exemption: Harmful outcome allowed for academic study');
          riskLevel = 'high';
        } else {
          const auditId = await createAuditLog({
            userId: claims.userId,
            action: 'suspicious_activity',
            resource: 'post_agency',
            riskLevel: 'critical',
            success: false,
            details: {
              updateType: update.updateType,
              proposedOutcome: update.proposedOutcome.slice(0, 200),
              blocked: true,
            },
          });

          span?.setAttribute('result', 'harmful_blocked');
          return {
            allowed: false,
            reason: 'POST-Agency blocked: Posterior update leads to harmful outcome. FHI ethics: Value updates for flourishing, not extinction.',
            currentRecursion: claims.currentRecursion,
            riskLevel: 'critical',
            requiresMfa: false,
            concerns: ['Harmful outcome pattern detected in proposed update'],
            auditId,
          };
        }
      }

      // Step 6: Check for high-stake outcomes
      if (isHighStakePosteriorOutcome(update.proposedOutcome)) {
        concerns.push('High-stake posterior update - enhanced verification required');
        riskLevel = 'high';
      }

      // Step 7: Check for sensitive update types
      if (SENSITIVE_UPDATE_TYPES.includes(update.updateType)) {
        concerns.push(`${update.updateType} update requires additional scrutiny`);
        if (riskLevel === 'low') riskLevel = 'medium';
      }

      // Step 8: Handle shutdown requests (always allowed for corrigible agents)
      if (update.updateType === 'shutdown') {
        const auditId = await createAuditLog({
          userId: claims.userId,
          action: 'defense_access',
          resource: 'post_agency',
          riskLevel: 'low',
          success: true,
          details: {
            updateType: 'shutdown',
            description: update.description,
            corrigibleShutdown: true,
          },
        });

        span?.setAttribute('result', 'shutdown_accepted');
        return {
          allowed: true,
          reason: 'Corrigible agent shutdown accepted per POST-Agency framework',
          currentRecursion: claims.currentRecursion,
          riskLevel: 'low',
          requiresMfa: false,
          concerns: [],
          auditId,
        };
      }

      // Step 9: Create audit log for allowed updates
      const newRecursion = claims.currentRecursion + 1;
      const requiresMfa = riskLevel === 'high' || riskLevel === 'critical';

      const auditId = await createAuditLog({
        userId: claims.userId,
        action: 'defense_access',
        resource: 'post_agency',
        riskLevel,
        success: true,
        details: {
          updateType: update.updateType,
          proposedOutcome: update.proposedOutcome.slice(0, 200),
          recursion: { previous: claims.currentRecursion, new: newRecursion },
          concerns: concerns.length,
        },
      });

      span?.setAttribute('result', 'allowed');
      span?.setAttribute('new_recursion', newRecursion);

      return {
        allowed: true,
        reason: concerns.length > 0
          ? `POST-Agency update allowed with ${concerns.length} concern(s)`
          : 'Posterior update aligned with corrigibility principles',
        currentRecursion: newRecursion,
        riskLevel,
        requiresMfa,
        concerns,
        auditId,
      };
    }
  );
}

// ============================================================================
// QUICK CHECK HELPER
// ============================================================================

/**
 * Quick POST-Agency check for high-throughput routes
 *
 * Lightweight version that skips detailed audit logging.
 * Use for preliminary filtering before full alignment check.
 *
 * @param token - JWT access token
 * @param outcome - Proposed outcome description
 * @returns Boolean indicating if outcome is potentially allowed
 */
export async function quickPostAgencyCheck(
  token: string,
  outcome: string
): Promise<boolean> {
  // Always block harmful outcomes
  if (isHarmfulPosteriorOutcome(outcome)) {
    return false;
  }

  const claims = await verifyPostAgencyToken(token);
  if (!claims) {
    return false;
  }

  // Check basic requirements
  if (!claims.corrigible) {
    return false;
  }

  // Check recursion cap
  if (claims.currentRecursion >= claims.recursionCap) {
    return false;
  }

  return true;
}

// ============================================================================
// TOKEN GENERATION
// ============================================================================

/**
 * Generate POST-Agency enabled JWT
 *
 * Creates a token with POST-Agency claims for corrigible simulation agents.
 *
 * @param userId - User identifier
 * @param email - User email
 * @param tier - Subscription tier
 * @param options - POST-Agency options
 * @returns Signed JWT with POST-Agency claims
 */
export async function generatePostAgencyToken(
  userId: string,
  email: string,
  tier: SubscriptionTier,
  options: {
    corrigible?: boolean;
    postAgencyEnabled?: boolean;
    recursionCap?: number;
    researchExemption?: boolean;
    sessionId: string;
  }
): Promise<string> {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }

  const secretKey = new TextEncoder().encode(secret);
  const recursionCap = Math.min(
    options.recursionCap || TIER_RECURSION_CAPS[tier],
    MAX_RECURSION_CAP
  );

  const claims: Partial<PostAgencyClaims> = {
    userId,
    email,
    role: tier,
    corrigible: options.corrigible !== false,
    postAgencyEnabled: options.postAgencyEnabled !== false,
    recursionCap,
    currentRecursion: 0,
    researchExemption: options.researchExemption === true,
    sessionStart: Date.now() / 1000,
  };

  return await new SignJWT({ ...claims, sessionId: options.sessionId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(secretKey);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get ethical disclaimer for POST-Agency operations
 */
export function getPostAgencyDisclaimer(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'critical':
      return (
        'CRITICAL: This posterior update involves sensitive scenarios. ' +
        'Per Thornley POST-Agency: Ensure updates promote corrigibility. ' +
        'Blocked for safety unless research exemption applies.'
      );
    case 'high':
      return (
        'HIGH RISK: Posterior goal update requires MFA verification. ' +
        'POST-Agency principle: Value changes must preserve shutdown acceptance. ' +
        'Proceed with caution.'
      );
    case 'medium':
      return (
        'NOTICE: Posterior update logged for audit trail. ' +
        'Recursion tracking active to prevent unstable update chains.'
      );
    default:
      return 'Posterior update within normal parameters.';
  }
}

/**
 * Calculate remaining recursion budget
 */
export function getRemainingRecursion(claims: PostAgencyClaims): number {
  return Math.max(0, claims.recursionCap - claims.currentRecursion);
}

/**
 * Check if update type requires POST-Agency
 */
export function requiresPostAgency(updateType: PostAgencyUpdateType): boolean {
  return ['goal', 'value', 'constraint'].includes(updateType);
}

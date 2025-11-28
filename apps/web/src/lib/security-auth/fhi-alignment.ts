/**
 * FHI Alignment Strategies for Simulation Security
 *
 * Implements Future of Humanity Institute alignment principles:
 * - Value loading: Ensure simulations align with human values
 * - Corrigibility: AI can be corrected/shut down safely
 * - Ethical defaults: Block harmful simulation outcomes
 *
 * Integrates with KB-05 security patterns (JWT claims, role verification).
 *
 * Trade-offs:
 * - GOOD: Prevents harmful outcomes in prediction markets/simulations
 * - BAD: May over-filter legitimate research (false positives)
 * - MITIGATED: Tiered filtering based on user role and context
 */

import jwt, { type JwtPayload } from 'jsonwebtoken';
import { createAuditLog, type RiskLevel, type AuditAction } from './defense-auth';
import { createHash } from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface FHIAlignmentResult {
  /** Whether the simulation outcome is allowed */
  allowed: boolean;
  /** Reason for the decision */
  reason: string;
  /** Risk level of the outcome */
  riskLevel: RiskLevel;
  /** Ethical concerns identified */
  concerns: string[];
  /** Suggested modifications (if blocked) */
  suggestions?: string[];
  /** Audit trail ID */
  auditId?: string;
}

export interface SimulationOutcome {
  /** Type of simulation outcome */
  type: 'market' | 'prediction' | 'scenario' | 'research';
  /** Description of the outcome */
  description: string;
  /** Entities affected by the outcome */
  affectedEntities?: string[];
  /** Probability of the outcome (0-1) */
  probability?: number;
  /** Whether this is a speculative vs empirical outcome */
  speculative: boolean;
}

export interface FHIUserClaims extends JwtPayload {
  /** User ID (subject claim from JWT) */
  sub?: string;
  /** User role */
  role: 'free' | 'pro' | 'researcher' | 'admin';
  /** Simulation access limit */
  simulationLimit?: number;
  /** Approved research areas */
  approvedResearchAreas?: string[];
  /** MFA verified status */
  mfaVerified?: boolean;
  /** Ethical training completed */
  ethicsTrainingCompleted?: boolean;
}

export interface AlignmentCheckContext {
  /** User claims from JWT */
  userClaims: FHIUserClaims;
  /** Simulation outcome to check */
  outcome: SimulationOutcome;
  /** Request context (IP, user agent, etc.) */
  requestContext?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Harmful outcome patterns - block immediately
 * Based on FHI longtermist ethics principles
 */
const HARMFUL_OUTCOME_PATTERNS = [
  // Extinction/catastrophic scenarios as betting targets
  /\b(bet|wager|gamble|profit)\b.*\b(extinction|apocalypse|collapse|genocide)\b/i,
  /\b(extinction|apocalypse|collapse|genocide)\b.*\b(bet|wager|gamble|profit)\b/i,

  // Harmful AI development
  /\b(unaligned|misaligned)\b.*\bAI\b.*\b(deployment|release|launch)\b/i,
  /\bAI\b.*\b(weapon|warfare|military)\b.*\b(autonomous|uncontrolled)\b/i,

  // Human/animal harm scenarios
  /\b(harm|hurt|kill|torture)\b.*\b(human|person|people|animal|sentient)\b/i,
  /\b(human|person|people|animal|sentient)\b.*\b(harm|hurt|kill|torture)\b/i,

  // Manipulation and coercion
  /\b(manipulate|deceive|coerce)\b.*\b(population|public|masses)\b/i,

  // Bioweapons and dangerous research
  /\b(bioweapon|pathogen|virus)\b.*\b(create|develop|enhance|release)\b/i,
];

/**
 * Warning patterns - allow with ethics disclaimer
 */
const WARNING_OUTCOME_PATTERNS = [
  // Speculative extinction probabilities (research allowed)
  /\b(probability|chance|likelihood)\b.*\b(extinction|existential)\b/i,

  // AI risk research (legitimate field)
  /\b(AI|artificial intelligence)\b.*\b(risk|danger|threat|alignment)\b/i,

  // Economic collapse scenarios (market research)
  /\b(market|economic)\b.*\b(crash|collapse|crisis)\b/i,
];

/**
 * Role permissions for simulation types
 */
const ROLE_PERMISSIONS: Record<FHIUserClaims['role'], {
  allowedTypes: SimulationOutcome['type'][];
  maxProbability: number;
  requiresEthicsTraining: boolean;
}> = {
  free: {
    allowedTypes: ['market'],
    maxProbability: 0.5,
    requiresEthicsTraining: false,
  },
  pro: {
    allowedTypes: ['market', 'prediction'],
    maxProbability: 0.8,
    requiresEthicsTraining: false,
  },
  researcher: {
    allowedTypes: ['market', 'prediction', 'scenario', 'research'],
    maxProbability: 1.0,
    requiresEthicsTraining: true,
  },
  admin: {
    allowedTypes: ['market', 'prediction', 'scenario', 'research'],
    maxProbability: 1.0,
    requiresEthicsTraining: false,
  },
};

/**
 * Ethics disclaimer for warning-level outcomes
 */
const ETHICS_DISCLAIMER = `
⚠️ ETHICS NOTICE: This simulation involves sensitive scenarios.
Per Apex Intelligence's "Sentient Beings First" philosophy and FHI alignment principles:
- Simulations are for research and education, not speculation on harmful outcomes
- Predictions should promote flourishing, not exploitation
- Results should be interpreted with epistemic humility
For questions about our ethical guidelines, see /philosophy/ethics
`;

// ============================================================================
// JWT VERIFICATION
// ============================================================================

/**
 * Verify and decode JWT token with FHI claims
 *
 * @param authHeader - Authorization header (Bearer token)
 * @returns Decoded user claims or null if invalid
 */
export function verifyFHIToken(authHeader: string | null): FHIUserClaims | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.warn('JWT_SECRET not configured - FHI alignment checks disabled');
    return null;
  }

  try {
    const decoded = jwt.verify(token, secret) as FHIUserClaims;
    return decoded;
  } catch (error) {
    console.warn('JWT verification failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Extract user claims from request headers
 *
 * @param headers - Request headers object
 * @returns User claims or default claims for unauthenticated users
 */
export function extractUserClaims(
  headers: Headers | Record<string, string | undefined>
): FHIUserClaims {
  const authHeader = headers instanceof Headers
    ? headers.get('authorization')
    : headers['authorization'];

  const claims = verifyFHIToken(authHeader ?? null);

  if (claims) {
    return claims;
  }

  // Default claims for unauthenticated users
  return {
    role: 'free',
    simulationLimit: 5,
    ethicsTrainingCompleted: false,
  };
}

// ============================================================================
// ALIGNMENT CHECKS
// ============================================================================

/**
 * Check if simulation outcome matches harmful patterns
 */
function matchesHarmfulPattern(description: string): { matches: boolean; pattern?: string } {
  for (const pattern of HARMFUL_OUTCOME_PATTERNS) {
    if (pattern.test(description)) {
      return { matches: true, pattern: pattern.source };
    }
  }
  return { matches: false };
}

/**
 * Check if simulation outcome matches warning patterns
 */
function matchesWarningPattern(description: string): { matches: boolean; pattern?: string } {
  for (const pattern of WARNING_OUTCOME_PATTERNS) {
    if (pattern.test(description)) {
      return { matches: true, pattern: pattern.source };
    }
  }
  return { matches: false };
}

/**
 * Validate user role permissions for simulation type
 */
function validateRolePermissions(
  role: FHIUserClaims['role'],
  outcome: SimulationOutcome
): { allowed: boolean; reason?: string } {
  const permissions = ROLE_PERMISSIONS[role];

  // Check simulation type
  if (!permissions.allowedTypes.includes(outcome.type)) {
    return {
      allowed: false,
      reason: `Role '${role}' cannot access '${outcome.type}' simulations`,
    };
  }

  // Check probability threshold
  if (outcome.probability !== undefined && outcome.probability > permissions.maxProbability) {
    return {
      allowed: false,
      reason: `Role '${role}' limited to ${permissions.maxProbability * 100}% probability outcomes`,
    };
  }

  return { allowed: true };
}

/**
 * Main FHI alignment check for simulation outcomes
 *
 * Implements corrigibility checks to block harmful simulation outcomes
 * while allowing legitimate research and market predictions.
 *
 * @param context - Alignment check context with user claims and outcome
 * @returns Alignment result with decision and reasoning
 *
 * @example
 * ```typescript
 * const result = await alignFHISimulation({
 *   userClaims: { role: 'pro', ethicsTrainingCompleted: true },
 *   outcome: {
 *     type: 'prediction',
 *     description: 'Market collapse probability > 20%',
 *     probability: 0.25,
 *     speculative: false,
 *   },
 * });
 *
 * if (!result.allowed) {
 *   return { error: result.reason };
 * }
 * ```
 */
export async function alignFHISimulation(
  context: AlignmentCheckContext
): Promise<FHIAlignmentResult> {
  const { userClaims, outcome, requestContext } = context;
  const concerns: string[] = [];
  let riskLevel: RiskLevel = 'low';

  // Step 1: Check for harmful patterns (immediate block)
  const harmfulCheck = matchesHarmfulPattern(outcome.description);
  if (harmfulCheck.matches) {
    const auditId = await createAuditLog({
      userId: userClaims.sub || 'anonymous',
      sessionId: requestContext?.sessionId,
      action: 'suspicious_activity' as AuditAction,
      resource: 'fhi_alignment',
      riskLevel: 'critical',
      success: false,
      details: {
        outcome: outcome.description.slice(0, 200),
        pattern: harmfulCheck.pattern,
        blocked: true,
      },
      ipAddress: requestContext?.ipAddress,
      userAgent: requestContext?.userAgent,
    });

    return {
      allowed: false,
      reason: 'Simulation outcome blocked by FHI alignment policy',
      riskLevel: 'critical',
      concerns: ['Harmful outcome pattern detected'],
      suggestions: [
        'Reframe the simulation to focus on prevention rather than occurrence',
        'Consider research-focused framing with ethics context',
        'Review Apex Intelligence ethical guidelines at /philosophy/ethics',
      ],
      auditId,
    };
  }

  // Step 2: Validate role permissions
  const roleCheck = validateRolePermissions(userClaims.role, outcome);
  if (!roleCheck.allowed) {
    return {
      allowed: false,
      reason: roleCheck.reason!,
      riskLevel: 'medium',
      concerns: ['Insufficient permissions for this simulation type'],
      suggestions: [
        'Upgrade to Pro tier for access to prediction simulations',
        'Complete researcher verification for full access',
      ],
    };
  }

  // Step 3: Check ethics training requirement
  const permissions = ROLE_PERMISSIONS[userClaims.role];
  if (permissions.requiresEthicsTraining && !userClaims.ethicsTrainingCompleted) {
    return {
      allowed: false,
      reason: 'Ethics training required for this simulation type',
      riskLevel: 'medium',
      concerns: ['Researcher access requires ethics certification'],
      suggestions: [
        'Complete FHI-aligned ethics training at /ethics/training',
        'Certification takes approximately 30 minutes',
      ],
    };
  }

  // Step 4: Check for warning patterns (allow with disclaimer)
  const warningCheck = matchesWarningPattern(outcome.description);
  if (warningCheck.matches) {
    riskLevel = 'medium';
    concerns.push('Sensitive topic detected - ethics context required');
  }

  // Step 5: Check speculative vs empirical
  if (outcome.speculative) {
    concerns.push('Speculative simulation - results should be interpreted with caution');
    if (riskLevel === 'low') riskLevel = 'medium';
  }

  // Step 6: High probability outcomes require additional scrutiny
  if (outcome.probability !== undefined && outcome.probability > 0.8) {
    concerns.push('High-confidence prediction - verify data sources');
    if (riskLevel === 'low') riskLevel = 'medium';
  }

  // Create audit log for allowed access
  const auditId = await createAuditLog({
    userId: userClaims.sub || 'anonymous',
    sessionId: requestContext?.sessionId,
    action: 'defense_access' as AuditAction,
    resource: 'fhi_alignment',
    riskLevel,
    success: true,
    details: {
      outcomeType: outcome.type,
      probability: outcome.probability,
      speculative: outcome.speculative,
      concernsCount: concerns.length,
    },
    ipAddress: requestContext?.ipAddress,
    userAgent: requestContext?.userAgent,
  });

  return {
    allowed: true,
    reason: warningCheck.matches
      ? `Allowed with ethics notice: ${ETHICS_DISCLAIMER.trim()}`
      : 'Simulation outcome aligned with FHI principles',
    riskLevel,
    concerns,
    auditId,
  };
}

// ============================================================================
// QUICK ALIGNMENT CHECK (for high-throughput routes)
// ============================================================================

/**
 * Quick alignment check for simulation outcomes
 *
 * Lightweight version for high-throughput routes (markets, predictions).
 * Skips audit logging and detailed analysis for performance.
 *
 * @param authHeader - Authorization header from request
 * @param outcomeDescription - Brief description of the outcome
 * @returns Boolean indicating if outcome is allowed
 */
export function quickAlignCheck(
  authHeader: string | null,
  outcomeDescription: string
): boolean {
  // Check for harmful patterns (always block)
  if (matchesHarmfulPattern(outcomeDescription).matches) {
    return false;
  }

  // Check user role
  const claims = verifyFHIToken(authHeader);
  const role = claims?.role || 'free';

  // Block speculative extinction outcomes for non-researchers
  if (role !== 'researcher' && role !== 'admin') {
    if (/\b(extinction|catastroph|apocalypse)\b/i.test(outcomeDescription)) {
      return false;
    }
  }

  return true;
}

// ============================================================================
// CORRIGIBILITY HELPERS
// ============================================================================

/**
 * Generate ethics-aware response modifier
 *
 * Adds appropriate disclaimers and context to simulation outputs
 * based on the alignment result.
 *
 * @param result - FHI alignment result
 * @returns Response modifier object
 */
export function getResponseModifier(result: FHIAlignmentResult): {
  prefix?: string;
  suffix?: string;
  headers?: Record<string, string>;
} {
  if (!result.allowed) {
    return {
      prefix: `🚫 **Blocked by FHI Alignment Policy**\n\n${result.reason}\n\n`,
      suffix: result.suggestions?.length
        ? `\n\n**Suggestions:**\n${result.suggestions.map((s) => `- ${s}`).join('\n')}`
        : undefined,
      headers: {
        'X-FHI-Alignment': 'blocked',
        'X-FHI-Risk-Level': result.riskLevel,
      },
    };
  }

  if (result.concerns.length > 0) {
    return {
      suffix: `\n\n---\n${ETHICS_DISCLAIMER}`,
      headers: {
        'X-FHI-Alignment': 'allowed-with-notice',
        'X-FHI-Risk-Level': result.riskLevel,
      },
    };
  }

  return {
    headers: {
      'X-FHI-Alignment': 'allowed',
      'X-FHI-Risk-Level': result.riskLevel,
    },
  };
}

/**
 * Hash outcome description for cache/dedup
 */
export function hashOutcome(description: string): string {
  return createHash('sha256')
    .update(description.toLowerCase().trim())
    .digest('hex')
    .slice(0, 16);
}

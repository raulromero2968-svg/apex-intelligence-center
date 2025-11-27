/**
 * Policy Compliance Checker for Auth Routes
 *
 * Implements Phase 3 of AI Livelihood Analysis master plan:
 * - EU AI Act compliance awareness
 * - US Executive Order 14110 compliance
 * - Regional policy enforcement
 * - Risk classification for AI features
 *
 * References:
 * - AI Policy Podcast insights (global regulations, cyber risks)
 * - knowledge-05-security-oauth2-jwt (auth patterns)
 *
 * Trade-offs:
 * - GOOD: Proactive safeguards, builds user trust
 * - BAD: Risk of over-restriction (mitigated with user opt-in)
 *
 * @see master-plan-ai-livelihood-analysis Phase 3
 */

import { db } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { users } from '@/db/schema';
import {
  policyComplianceFlags,
  type PolicyComplianceFlag,
} from '@/db/schema/spatial-livelihood';
import * as Sentry from '@sentry/nextjs';

// ============================================================================
// TYPES
// ============================================================================

export type ComplianceFramework =
  | 'eu_ai_act'
  | 'us_eo_14110'
  | 'india_ai_guidelines'
  | 'uk_ai_framework'
  | 'global_default';

export type RiskLevel = 'minimal' | 'limited' | 'high' | 'unacceptable';

export interface PolicyCheckResult {
  isAllowed: boolean;
  framework: ComplianceFramework;
  riskLevel: RiskLevel;
  requiresConsent: boolean;
  requiresHumanReview: boolean;
  restrictions: string[];
  auditRequired: boolean;
  message?: string;
}

export interface FeatureRiskClassification {
  feature: string;
  euRiskLevel: RiskLevel;
  usRiskLevel: RiskLevel;
  requiresTransparency: boolean;
  requiresHumanOversight: boolean;
  description: string;
}

// ============================================================================
// FEATURE RISK CLASSIFICATIONS
// ============================================================================

/**
 * Risk classifications for AI features based on regulatory frameworks
 */
export const FEATURE_RISK_MAP: Record<string, FeatureRiskClassification> = {
  // Livelihood Analysis Features
  job_impact_analysis: {
    feature: 'job_impact_analysis',
    euRiskLevel: 'limited',
    usRiskLevel: 'minimal',
    requiresTransparency: true,
    requiresHumanOversight: false,
    description: 'AI-powered analysis of job market impacts',
  },
  upskilling_recommendations: {
    feature: 'upskilling_recommendations',
    euRiskLevel: 'limited',
    usRiskLevel: 'minimal',
    requiresTransparency: true,
    requiresHumanOversight: false,
    description: 'Personalized skill development recommendations',
  },
  opportunity_discovery: {
    feature: 'opportunity_discovery',
    euRiskLevel: 'minimal',
    usRiskLevel: 'minimal',
    requiresTransparency: false,
    requiresHumanOversight: false,
    description: 'AI-assisted discovery of new opportunities',
  },

  // Market Intelligence Features
  spatial_rag: {
    feature: 'spatial_rag',
    euRiskLevel: 'minimal',
    usRiskLevel: 'minimal',
    requiresTransparency: true,
    requiresHumanOversight: false,
    description: '3D market visualization and semantic search',
  },
  market_prediction: {
    feature: 'market_prediction',
    euRiskLevel: 'limited',
    usRiskLevel: 'minimal',
    requiresTransparency: true,
    requiresHumanOversight: false,
    description: 'AI-generated market trend predictions',
  },
  price_alerts: {
    feature: 'price_alerts',
    euRiskLevel: 'minimal',
    usRiskLevel: 'minimal',
    requiresTransparency: false,
    requiresHumanOversight: false,
    description: 'Automated price monitoring and alerts',
  },

  // High-Risk Features (require extra safeguards)
  automated_trading: {
    feature: 'automated_trading',
    euRiskLevel: 'high',
    usRiskLevel: 'limited',
    requiresTransparency: true,
    requiresHumanOversight: true,
    description: 'Fully automated trading execution',
  },
  credit_assessment: {
    feature: 'credit_assessment',
    euRiskLevel: 'high',
    usRiskLevel: 'high',
    requiresTransparency: true,
    requiresHumanOversight: true,
    description: 'AI-based credit or trust scoring',
  },
  biometric_identification: {
    feature: 'biometric_identification',
    euRiskLevel: 'unacceptable',
    usRiskLevel: 'high',
    requiresTransparency: true,
    requiresHumanOversight: true,
    description: 'Biometric identification systems',
  },
};

// ============================================================================
// REGION DETECTION
// ============================================================================

/**
 * Detect user region from various sources
 */
export function detectRegion(options: {
  headers?: Headers;
  userProfile?: { region?: string };
  ipAddress?: string;
}): string {
  const { headers, userProfile, ipAddress } = options;

  // Priority 1: User profile setting
  if (userProfile?.region) {
    return userProfile.region.toUpperCase();
  }

  // Priority 2: Cloudflare/Vercel headers
  if (headers) {
    const cfCountry = headers.get('cf-ipcountry');
    if (cfCountry) return cfCountry.toUpperCase();

    const vercelCountry = headers.get('x-vercel-ip-country');
    if (vercelCountry) return vercelCountry.toUpperCase();
  }

  // Priority 3: Default to US
  return 'US';
}

/**
 * Get compliance framework for region
 */
export function getFrameworkForRegion(region: string): ComplianceFramework {
  const euCountries = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'EU',
  ];

  const upperRegion = region.toUpperCase();

  if (euCountries.includes(upperRegion)) {
    return 'eu_ai_act';
  }
  if (upperRegion === 'US') {
    return 'us_eo_14110';
  }
  if (upperRegion === 'IN') {
    return 'india_ai_guidelines';
  }
  if (upperRegion === 'UK' || upperRegion === 'GB') {
    return 'uk_ai_framework';
  }

  return 'global_default';
}

// ============================================================================
// POLICY CHECKING
// ============================================================================

/**
 * Check if a feature is allowed for a user based on their region and compliance status
 */
export async function checkFeaturePolicy(
  userId: string,
  feature: string,
  region?: string
): Promise<PolicyCheckResult> {
  try {
    // Get user data
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return {
        isAllowed: false,
        framework: 'global_default',
        riskLevel: 'high',
        requiresConsent: true,
        requiresHumanReview: true,
        restrictions: ['User not found'],
        auditRequired: true,
        message: 'User authentication required',
      };
    }

    // Determine region
    const userRegion = region || 'US';
    const framework = getFrameworkForRegion(userRegion);

    // Get feature risk classification
    const featureRisk = FEATURE_RISK_MAP[feature];
    if (!featureRisk) {
      // Unknown feature - apply default restrictions
      return {
        isAllowed: true,
        framework,
        riskLevel: 'limited',
        requiresConsent: false,
        requiresHumanReview: false,
        restrictions: [],
        auditRequired: false,
      };
    }

    // Get risk level based on framework
    const riskLevel = framework === 'eu_ai_act'
      ? featureRisk.euRiskLevel
      : featureRisk.usRiskLevel;

    // Check if feature is blocked
    if (riskLevel === 'unacceptable') {
      return {
        isAllowed: false,
        framework,
        riskLevel,
        requiresConsent: true,
        requiresHumanReview: true,
        restrictions: ['Feature not available in your region due to regulatory requirements'],
        auditRequired: true,
        message: `${feature} is classified as unacceptable risk under ${framework}`,
      };
    }

    // Check for high-risk requirements
    if (riskLevel === 'high') {
      return {
        isAllowed: true,
        framework,
        riskLevel,
        requiresConsent: true,
        requiresHumanReview: featureRisk.requiresHumanOversight,
        restrictions: ['Human oversight required', 'Additional consent needed'],
        auditRequired: true,
        message: 'This feature requires additional consent and human oversight',
      };
    }

    // Check for existing compliance flags
    const existingFlags = await db.query.policyComplianceFlags.findFirst({
      where: and(
        eq(policyComplianceFlags.userId, userId),
        eq(policyComplianceFlags.framework, framework),
        eq(policyComplianceFlags.isActive, true)
      ),
    });

    if (existingFlags?.riskLevel === 'unacceptable') {
      return {
        isAllowed: false,
        framework,
        riskLevel: 'unacceptable',
        requiresConsent: true,
        requiresHumanReview: true,
        restrictions: existingFlags.restrictions?.blockedFeatures || [],
        auditRequired: true,
        message: 'Account has compliance restrictions',
      };
    }

    // Default: Allow with appropriate flags
    return {
      isAllowed: true,
      framework,
      riskLevel,
      requiresConsent: framework === 'eu_ai_act' && riskLevel !== 'minimal',
      requiresHumanReview: featureRisk.requiresHumanOversight,
      restrictions: [],
      auditRequired: riskLevel === 'limited' || riskLevel === 'high',
      message: featureRisk.requiresTransparency
        ? 'AI-generated content - verify important decisions'
        : undefined,
    };
  } catch (error) {
    console.error('[POLICY_CHECK_ERROR]', error);
    Sentry.captureException(error, {
      tags: { component: 'policy-checker', operation: 'checkFeaturePolicy' },
      extra: { userId, feature, region },
    });

    // Fail open with audit
    return {
      isAllowed: true,
      framework: 'global_default',
      riskLevel: 'limited',
      requiresConsent: false,
      requiresHumanReview: false,
      restrictions: [],
      auditRequired: true,
      message: 'Policy check encountered an error - defaulting to permissive mode',
    };
  }
}

/**
 * Check if grant type is allowed based on policy
 */
export async function checkGrantTypePolicy(
  userId: string,
  grantType: string,
  region: string
): Promise<{ allowed: boolean; reason?: string }> {
  // High-risk grant types
  const highRiskGrants = ['automated_trading', 'bulk_operations', 'admin_access'];

  if (!highRiskGrants.includes(grantType)) {
    return { allowed: true };
  }

  const framework = getFrameworkForRegion(region);

  // EU AI Act restrictions
  if (framework === 'eu_ai_act') {
    if (grantType === 'automated_trading') {
      return {
        allowed: false,
        reason: 'Automated trading requires human oversight per EU AI Act. Please use supervised mode.',
      };
    }
  }

  // Check user compliance status
  const compliance = await db.query.policyComplianceFlags.findFirst({
    where: and(
      eq(policyComplianceFlags.userId, userId),
      eq(policyComplianceFlags.isActive, true)
    ),
  });

  if (compliance?.riskLevel === 'high' || compliance?.riskLevel === 'unacceptable') {
    return {
      allowed: false,
      reason: `High-risk operations are restricted for your account. Contact support for review.`,
    };
  }

  return { allowed: true };
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

/**
 * Log policy check for audit trail
 */
export async function logPolicyAudit(
  userId: string,
  action: string,
  result: PolicyCheckResult,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    // Find or create compliance flag record
    const existingFlag = await db.query.policyComplianceFlags.findFirst({
      where: and(
        eq(policyComplianceFlags.userId, userId),
        eq(policyComplianceFlags.framework, result.framework)
      ),
    });

    const auditEntry = {
      action,
      timestamp: new Date().toISOString(),
      reason: result.message || `Policy check: ${result.isAllowed ? 'allowed' : 'blocked'}`,
      performedBy: 'system',
      ...metadata,
    };

    if (existingFlag) {
      const currentLog = (existingFlag.auditLog as any[]) || [];
      const updatedLog = [...currentLog.slice(-99), auditEntry]; // Keep last 100 entries

      await db
        .update(policyComplianceFlags)
        .set({
          auditLog: updatedLog,
          lastCheckedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(policyComplianceFlags.id, existingFlag.id));
    }

    // Also log to Sentry for high-risk actions
    if (result.auditRequired) {
      Sentry.addBreadcrumb({
        category: 'policy',
        message: `Policy audit: ${action}`,
        level: result.isAllowed ? 'info' : 'warning',
        data: {
          userId,
          framework: result.framework,
          riskLevel: result.riskLevel,
          isAllowed: result.isAllowed,
        },
      });
    }
  } catch (error) {
    console.error('[POLICY_AUDIT_ERROR]', error);
    Sentry.captureException(error, {
      tags: { component: 'policy-checker', operation: 'logPolicyAudit' },
    });
  }
}

// ============================================================================
// MIDDLEWARE HELPER
// ============================================================================

/**
 * Express-style middleware for policy enforcement
 * Use in API routes to check feature access
 */
export async function enforcePolicyMiddleware(options: {
  userId: string;
  feature: string;
  region?: string;
  headers?: Headers;
}): Promise<{
  allowed: boolean;
  response?: {
    status: number;
    body: Record<string, unknown>;
    headers: Record<string, string>;
  };
}> {
  const { userId, feature, headers } = options;
  const region = options.region || detectRegion({ headers });

  const result = await checkFeaturePolicy(userId, feature, region);

  // Log the check
  await logPolicyAudit(userId, `access_${feature}`, result);

  if (!result.isAllowed) {
    return {
      allowed: false,
      response: {
        status: 403,
        body: {
          error: 'Policy violation',
          message: result.message || 'Access denied due to regulatory requirements',
          framework: result.framework,
          restrictions: result.restrictions,
        },
        headers: {
          'X-Policy-Framework': result.framework,
          'X-Policy-Risk-Level': result.riskLevel,
        },
      },
    };
  }

  if (result.requiresConsent || result.requiresHumanReview) {
    return {
      allowed: true,
      response: {
        status: 200,
        body: {},
        headers: {
          'X-Policy-Framework': result.framework,
          'X-Policy-Risk-Level': result.riskLevel,
          'X-Policy-Requires-Consent': String(result.requiresConsent),
          'X-Policy-Requires-Review': String(result.requiresHumanReview),
          ...(result.message && { 'X-Policy-Message': result.message }),
        },
      },
    };
  }

  return { allowed: true };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  FEATURE_RISK_MAP as featureRiskMap,
};

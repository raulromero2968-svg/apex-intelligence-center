/**
 * @apex/core/ethics
 *
 * Ethical AI primitives for job protection, impact assessment, and governance.
 * Aligned with NIST RMF 2.0, EU AI Act, and OECD AI Principles.
 */

// ============================================================================
// TYPES
// ============================================================================

export type RiskCategory = 'minimal' | 'low' | 'medium' | 'high' | 'critical';
export type AutomationLevel = 'assist' | 'partial' | 'substantial' | 'full';
export type ImpactLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'escalated';

export interface EthicsContext {
  teamSize: number;
  automationLevel: AutomationLevel;
  department?: string;
  currentRoles?: string[];
  taskComplexity: 'routine' | 'mixed' | 'complex' | 'creative';
  humanInteractionRequired: boolean;
  decisionAutonomy: 'suggestions' | 'semi-autonomous' | 'fully-autonomous';
}

export interface GuardResult {
  allowed: boolean;
  impactLevel: ImpactLevel;
  riskCategory: RiskCategory;
  requiredApprovals: string[];
  mitigations: string[];
  auditId: string;
}

export interface FrameworkCompliance {
  nistRmf: {
    riskLevel: 'low' | 'moderate' | 'high';
    governanceRequired: boolean;
  };
  euAiAct: {
    riskClassification: 'minimal' | 'limited' | 'high' | 'unacceptable';
    humanOversightRequired: boolean;
  };
  oecdPrinciples: {
    inclusiveGrowthAligned: boolean;
    justTransitionRequired: boolean;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const RISK_THRESHOLDS = {
  minimal: { min: 0, max: 15 },
  low: { min: 16, max: 35 },
  medium: { min: 36, max: 55 },
  high: { min: 56, max: 80 },
  critical: { min: 81, max: 100 },
};

export const AUTOMATION_WEIGHTS: Record<AutomationLevel, number> = {
  assist: 0.15,
  partial: 0.35,
  substantial: 0.65,
  full: 0.90,
};

export const APPROVAL_MATRIX: Record<RiskCategory, string[]> = {
  minimal: [],
  low: ['team_lead'],
  medium: ['department_head', 'hr_representative'],
  high: ['executive', 'ethics_committee', 'hr_director'],
  critical: ['ceo', 'board', 'ethics_committee', 'legal'],
};

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Calculate risk score from context
 */
export function calculateRiskScore(context: EthicsContext): number {
  const automationScore = AUTOMATION_WEIGHTS[context.automationLevel] * 40;

  const complexityModifiers: Record<string, number> = {
    routine: 1.3,
    mixed: 1.0,
    complex: 0.7,
    creative: 0.4,
  };
  const complexityScore = 25 * (complexityModifiers[context.taskComplexity] || 1);

  const autonomyWeights: Record<string, number> = {
    suggestions: 0.2,
    'semi-autonomous': 0.5,
    'fully-autonomous': 0.9,
  };
  const autonomyScore = (autonomyWeights[context.decisionAutonomy] || 0.5) * 20;

  const teamScale = Math.min(context.teamSize / 100, 1);
  const teamScore = teamScale * 10;

  const interactionScore = context.humanInteractionRequired ? 0 : 5;

  return Math.round(Math.min(100, Math.max(0, automationScore + complexityScore + autonomyScore + teamScore + interactionScore)));
}

/**
 * Get risk category from score
 */
export function getRiskCategory(score: number): RiskCategory {
  for (const [category, range] of Object.entries(RISK_THRESHOLDS)) {
    if (score >= range.min && score <= range.max) {
      return category as RiskCategory;
    }
  }
  return 'medium';
}

/**
 * Main ethics guard function
 */
export function ethicsGuard(
  actionType: string,
  context: EthicsContext
): GuardResult {
  const score = calculateRiskScore(context);
  const category = getRiskCategory(score);

  const impactLevel: ImpactLevel =
    score < 15 ? 'none' :
    score < 35 ? 'low' :
    score < 55 ? 'medium' :
    score < 80 ? 'high' : 'critical';

  const requiredApprovals = APPROVAL_MATRIX[category];

  const mitigations: string[] = [];
  if (score >= 35) mitigations.push('Implement phased rollout');
  if (score >= 55) mitigations.push('Establish oversight committee');
  if (score >= 75) mitigations.push('Mandatory human review for all decisions');

  return {
    allowed: category !== 'critical',
    impactLevel,
    riskCategory: category,
    requiredApprovals,
    mitigations,
    auditId: `ethics-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  };
}

/**
 * Assess framework compliance
 */
export function assessCompliance(score: number, context: EthicsContext): FrameworkCompliance {
  return {
    nistRmf: {
      riskLevel: score < 35 ? 'low' : score < 65 ? 'moderate' : 'high',
      governanceRequired: score >= 50,
    },
    euAiAct: {
      riskClassification:
        score < 15 ? 'minimal' :
        score < 50 ? 'limited' :
        score < 85 ? 'high' : 'unacceptable',
      humanOversightRequired: score >= 50 || context.decisionAutonomy === 'fully-autonomous',
    },
    oecdPrinciples: {
      inclusiveGrowthAligned: score < 50,
      justTransitionRequired: score >= 40,
    },
  };
}

/**
 * Check if action has required approvals
 */
export function hasRequiredApprovals(
  result: GuardResult,
  approvals: Array<{ role: string; approved: boolean }>
): boolean {
  return result.requiredApprovals.every((required) =>
    approvals.some((a) => a.role === required && a.approved)
  );
}

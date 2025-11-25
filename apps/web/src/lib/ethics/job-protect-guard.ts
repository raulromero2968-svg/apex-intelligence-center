/**
 * Job Protection Guard
 *
 * Ethical safeguards for AI automation with human-in-loop controls.
 * Addresses AI job displacement concerns with proactive mitigation.
 *
 * Features:
 * - Impact assessment for automation actions
 * - Human override requirements for high-impact operations
 * - Reskilling recommendations integration
 * - Audit trail for ethics compliance
 */

// ============================================================================
// TYPES
// ============================================================================

export type ImpactLevel = 'minimal' | 'low' | 'medium' | 'high' | 'critical';
export type AutomationType = 'task_assist' | 'role_augment' | 'process_automate' | 'function_replace' | 'team_replace';
export type ApprovalStatus = 'approved' | 'pending' | 'rejected' | 'requires_review' | 'escalated';

export interface AgentAction {
  type: string;
  description?: string;
  automationType: AutomationType;
  targetRoles?: string[];
  estimatedJobsAffected?: number;
  metadata?: Record<string, unknown>;
}

export interface ImpactAssessment {
  level: ImpactLevel;
  score: number; // 0-100
  factors: {
    skillObsolescence: number;
    roleRedundancy: number;
    taskAutomation: number;
    decisionAutonomy: number;
    humanInteraction: number;
  };
  recommendation: string;
}

export interface GuardResult {
  approved: boolean;
  status: ApprovalStatus;
  impact: ImpactAssessment;
  requiresHumanApproval: boolean;
  mitigations: MitigationSuggestion[];
  reskillingSuggestions: ReskillingSuggestion[];
  auditId?: string;
  message: string;
}

export interface MitigationSuggestion {
  type: 'hybrid_workflow' | 'gradual_rollout' | 'human_oversight' | 'role_transition';
  title: string;
  description: string;
  priority: 'required' | 'recommended' | 'optional';
}

export interface ReskillingSuggestion {
  skill: string;
  relevance: 'direct' | 'adjacent' | 'future';
  resources: Array<{
    title: string;
    type: 'course' | 'certification' | 'workshop';
    url?: string;
  }>;
}

export interface EthicsContext {
  userId: string;
  userRole: string;
  projectId: string;
  department?: string;
  isAdmin?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const IMPACT_THRESHOLDS = {
  minimal: { max: 10, requiresApproval: false },
  low: { max: 30, requiresApproval: false },
  medium: { max: 50, requiresApproval: true },
  high: { max: 75, requiresApproval: true },
  critical: { max: 100, requiresApproval: true },
};

export const AUTOMATION_TYPE_WEIGHTS: Record<AutomationType, number> = {
  task_assist: 0.1,
  role_augment: 0.3,
  process_automate: 0.5,
  function_replace: 0.8,
  team_replace: 1.0,
};

export const HIGH_IMPACT_ACTIONS = [
  'replace_team',
  'automate_department',
  'eliminate_role',
  'full_automation',
  'autonomous_decision',
];

// ============================================================================
// IMPACT ASSESSMENT
// ============================================================================

/**
 * Calculate impact score for an action
 */
export function calculateImpactScore(action: AgentAction): ImpactAssessment {
  const baseWeight = AUTOMATION_TYPE_WEIGHTS[action.automationType] || 0.5;

  // Calculate factor scores (0-1)
  const factors = {
    skillObsolescence: action.automationType === 'team_replace' ? 0.9 : baseWeight * 0.8,
    roleRedundancy: action.estimatedJobsAffected ? Math.min(action.estimatedJobsAffected / 100, 1) : baseWeight,
    taskAutomation: baseWeight,
    decisionAutonomy: action.type.includes('autonomous') ? 0.9 : baseWeight * 0.5,
    humanInteraction: action.targetRoles?.length ? 1 - (1 / action.targetRoles.length) : 0.5,
  };

  // Weighted average
  const weights = { skillObsolescence: 0.25, roleRedundancy: 0.25, taskAutomation: 0.2, decisionAutonomy: 0.15, humanInteraction: 0.15 };
  const score = Math.round(
    Object.entries(factors).reduce((sum, [key, value]) => sum + value * weights[key as keyof typeof weights], 0) * 100
  );

  // Determine level
  let level: ImpactLevel = 'minimal';
  if (score > IMPACT_THRESHOLDS.critical.max * 0.75) level = 'critical';
  else if (score > IMPACT_THRESHOLDS.high.max * 0.75) level = 'high';
  else if (score > IMPACT_THRESHOLDS.medium.max * 0.75) level = 'medium';
  else if (score > IMPACT_THRESHOLDS.low.max * 0.75) level = 'low';

  // Generate recommendation
  const recommendations: Record<ImpactLevel, string> = {
    minimal: 'Proceed with standard monitoring.',
    low: 'Consider documenting efficiency gains for affected teams.',
    medium: 'Implement gradual rollout with human oversight checkpoints.',
    high: 'Requires management approval. Develop mitigation and reskilling plans.',
    critical: 'Executive approval required. Full impact assessment and transition plan mandatory.',
  };

  return {
    level,
    score,
    factors,
    recommendation: recommendations[level],
  };
}

/**
 * Check if action is high-impact
 */
export function isHighImpact(action: AgentAction): boolean {
  return (
    HIGH_IMPACT_ACTIONS.some((a) => action.type.toLowerCase().includes(a.toLowerCase())) ||
    action.automationType === 'team_replace' ||
    action.automationType === 'function_replace' ||
    (action.estimatedJobsAffected && action.estimatedJobsAffected > 10)
  );
}

// ============================================================================
// MITIGATION SUGGESTIONS
// ============================================================================

/**
 * Generate mitigation suggestions based on impact
 */
export function generateMitigations(
  action: AgentAction,
  impact: ImpactAssessment
): MitigationSuggestion[] {
  const mitigations: MitigationSuggestion[] = [];

  // Always suggest human oversight for medium+ impact
  if (impact.score >= IMPACT_THRESHOLDS.medium.max * 0.5) {
    mitigations.push({
      type: 'human_oversight',
      title: 'Implement Human-in-the-Loop',
      description: 'Require human review and approval for critical decisions made by AI.',
      priority: impact.level === 'critical' ? 'required' : 'recommended',
    });
  }

  // Gradual rollout for high impact
  if (impact.level === 'high' || impact.level === 'critical') {
    mitigations.push({
      type: 'gradual_rollout',
      title: 'Phased Implementation',
      description: 'Roll out automation in phases, starting with pilot teams and expanding based on feedback.',
      priority: 'required',
    });
  }

  // Hybrid workflow for role-affecting automation
  if (action.automationType === 'function_replace' || action.automationType === 'role_augment') {
    mitigations.push({
      type: 'hybrid_workflow',
      title: 'Human-AI Collaboration Model',
      description: 'Design workflows where AI handles routine tasks while humans focus on complex decisions.',
      priority: 'recommended',
    });
  }

  // Role transition for team-level changes
  if (action.targetRoles?.length) {
    mitigations.push({
      type: 'role_transition',
      title: 'Role Evolution Planning',
      description: `Plan transition paths for ${action.targetRoles.length} affected roles to AI-augmented positions.`,
      priority: impact.level === 'critical' ? 'required' : 'recommended',
    });
  }

  return mitigations;
}

// ============================================================================
// RESKILLING SUGGESTIONS
// ============================================================================

/**
 * Generate reskilling suggestions
 */
export function generateReskillingSuggestions(
  action: AgentAction,
  impact: ImpactAssessment
): ReskillingSuggestion[] {
  const suggestions: ReskillingSuggestion[] = [];

  // AI collaboration skills (always relevant)
  suggestions.push({
    skill: 'AI Tool Proficiency',
    relevance: 'direct',
    resources: [
      { title: 'Working with AI Assistants', type: 'course' },
      { title: 'Prompt Engineering Fundamentals', type: 'workshop' },
      { title: 'AI Ethics in the Workplace', type: 'course' },
    ],
  });

  // Human-centric skills (high value in AI era)
  if (impact.factors.humanInteraction > 0.5) {
    suggestions.push({
      skill: 'Strategic Thinking & Complex Problem Solving',
      relevance: 'direct',
      resources: [
        { title: 'Critical Thinking in the AI Age', type: 'course' },
        { title: 'Strategic Decision Making', type: 'certification' },
      ],
    });
  }

  // Technical oversight skills
  if (action.automationType === 'process_automate' || action.automationType === 'function_replace') {
    suggestions.push({
      skill: 'AI System Oversight & Quality Assurance',
      relevance: 'direct',
      resources: [
        { title: 'AI Output Validation', type: 'workshop' },
        { title: 'Automation QA Best Practices', type: 'course' },
      ],
    });
  }

  // Leadership/management for high impact
  if (impact.level === 'high' || impact.level === 'critical') {
    suggestions.push({
      skill: 'AI-Era Leadership',
      relevance: 'adjacent',
      resources: [
        { title: 'Leading Teams in AI Transformation', type: 'certification' },
        { title: 'Change Management for Automation', type: 'workshop' },
      ],
    });
  }

  // Future skills
  suggestions.push({
    skill: 'Creative & Emotional Intelligence',
    relevance: 'future',
    resources: [
      { title: 'Creativity in Human-AI Collaboration', type: 'course' },
      { title: 'Emotional Intelligence for Tech Leaders', type: 'workshop' },
    ],
  });

  return suggestions;
}

// ============================================================================
// MAIN GUARD FUNCTION
// ============================================================================

/**
 * Ethics guard for AI actions
 */
export async function ethicsGuard(
  action: AgentAction,
  context: EthicsContext
): Promise<GuardResult> {
  // Calculate impact
  const impact = calculateImpactScore(action);

  // Check if requires human approval
  const requiresHumanApproval =
    IMPACT_THRESHOLDS[impact.level].requiresApproval &&
    !context.isAdmin;

  // Generate mitigations and reskilling
  const mitigations = generateMitigations(action, impact);
  const reskillingSuggestions = generateReskillingSuggestions(action, impact);

  // Determine approval status
  let status: ApprovalStatus = 'approved';
  let approved = true;
  let message = 'Action approved with standard monitoring.';

  if (impact.level === 'critical') {
    if (!context.isAdmin) {
      status = 'escalated';
      approved = false;
      message = 'Critical impact: Executive approval required. Action blocked pending review.';
    } else {
      status = 'requires_review';
      approved = true;
      message = 'Critical impact: Approved by admin. Full mitigation plan required.';
    }
  } else if (impact.level === 'high') {
    if (!context.isAdmin) {
      status = 'pending';
      approved = false;
      message = 'High impact: Management approval required before proceeding.';
    } else {
      status = 'approved';
      approved = true;
      message = 'High impact: Approved by admin. Implement recommended mitigations.';
    }
  } else if (impact.level === 'medium') {
    status = 'approved';
    approved = true;
    message = 'Medium impact: Proceed with human oversight checkpoints.';
  }

  // Log to audit
  const auditId = await logEthicsEvent({
    projectId: context.projectId,
    userId: context.userId,
    eventType: 'ethics_guard_evaluation',
    action,
    impact,
    status,
    approved,
  });

  return {
    approved,
    status,
    impact,
    requiresHumanApproval,
    mitigations,
    reskillingSuggestions,
    auditId,
    message,
  };
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

interface AuditEvent {
  projectId: string;
  userId: string;
  eventType: string;
  action: AgentAction;
  impact: ImpactAssessment;
  status: ApprovalStatus;
  approved: boolean;
}

/**
 * Log ethics event for audit trail
 */
async function logEthicsEvent(event: AuditEvent): Promise<string> {
  const auditId = `audit-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // In production, insert into database
  console.log('Ethics Audit:', {
    id: auditId,
    ...event,
    timestamp: new Date().toISOString(),
  });

  return auditId;
}

// ============================================================================
// HUMAN OVERRIDE
// ============================================================================

export interface OverrideRequest {
  actionId: string;
  action: AgentAction;
  originalResult: GuardResult;
  overrideType: 'approve' | 'reject' | 'modify';
  rationale: string;
  modifications?: Partial<AgentAction>;
}

/**
 * Process human override for blocked action
 */
export async function processHumanOverride(
  request: OverrideRequest,
  context: EthicsContext
): Promise<GuardResult> {
  // Only admins can override high/critical impact
  if (
    request.originalResult.impact.level === 'critical' ||
    request.originalResult.impact.level === 'high'
  ) {
    if (!context.isAdmin) {
      return {
        ...request.originalResult,
        approved: false,
        status: 'rejected',
        message: 'Only administrators can override high/critical impact actions.',
      };
    }
  }

  // Process override
  let result: GuardResult;

  switch (request.overrideType) {
    case 'approve':
      result = {
        ...request.originalResult,
        approved: true,
        status: 'approved',
        message: `Manually approved by ${context.userId}: ${request.rationale}`,
      };
      break;

    case 'reject':
      result = {
        ...request.originalResult,
        approved: false,
        status: 'rejected',
        message: `Rejected by ${context.userId}: ${request.rationale}`,
      };
      break;

    case 'modify':
      // Re-evaluate with modifications
      const modifiedAction = { ...request.action, ...request.modifications };
      result = await ethicsGuard(modifiedAction, context);
      result.message = `Modified and re-evaluated: ${request.rationale}`;
      break;

    default:
      result = request.originalResult;
  }

  // Log override
  await logEthicsEvent({
    projectId: context.projectId,
    userId: context.userId,
    eventType: 'human_override',
    action: request.action,
    impact: result.impact,
    status: result.status,
    approved: result.approved,
  });

  return result;
}

// ============================================================================
// BATCH ASSESSMENT
// ============================================================================

/**
 * Assess multiple actions for batch automation
 */
export async function batchAssessment(
  actions: AgentAction[],
  context: EthicsContext
): Promise<{
  overallRisk: ImpactLevel;
  totalJobsAffected: number;
  results: GuardResult[];
  summary: string;
}> {
  const results = await Promise.all(actions.map((action) => ethicsGuard(action, context)));

  // Calculate aggregate metrics
  const totalJobsAffected = actions.reduce((sum, a) => sum + (a.estimatedJobsAffected || 0), 0);
  const avgScore = results.reduce((sum, r) => sum + r.impact.score, 0) / results.length;

  // Determine overall risk (highest of all)
  const riskLevels: ImpactLevel[] = ['minimal', 'low', 'medium', 'high', 'critical'];
  const overallRisk = results.reduce((highest, r) => {
    return riskLevels.indexOf(r.impact.level) > riskLevels.indexOf(highest)
      ? r.impact.level
      : highest;
  }, 'minimal' as ImpactLevel);

  const approvedCount = results.filter((r) => r.approved).length;

  return {
    overallRisk,
    totalJobsAffected,
    results,
    summary: `${approvedCount}/${results.length} actions approved. Overall risk: ${overallRisk}. Estimated ${totalJobsAffected} jobs affected.`,
  };
}

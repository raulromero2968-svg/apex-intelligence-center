/**
 * Job Impact Assessor
 *
 * NIST RMF 2.0 and OECD-aligned impact assessment for AI automation.
 * Quantifies job displacement risk and generates reskilling recommendations.
 *
 * Frameworks Integrated:
 * - NIST AI RMF (risk categorization, governance)
 * - EU AI Act (high-risk classification, human oversight)
 * - OECD AI Principles (inclusive growth, just transition)
 * - UNESCO Ethics (transparency, job transition support)
 */

// ============================================================================
// TYPES
// ============================================================================

export type RiskCategory = 'minimal' | 'low' | 'medium' | 'high' | 'critical';
export type AutomationLevel = 'assist' | 'partial' | 'substantial' | 'full';
export type WorkforceImpact = 'enhancement' | 'transformation' | 'reduction' | 'displacement';

export interface AssessmentContext {
  teamSize: number;
  automationLevel: AutomationLevel;
  department?: string;
  currentRoles?: string[];
  taskComplexity: 'routine' | 'mixed' | 'complex' | 'creative';
  humanInteractionRequired: boolean;
  decisionAutonomy: 'suggestions' | 'semi-autonomous' | 'fully-autonomous';
}

export interface ImpactAssessment {
  score: number; // 0-100
  category: RiskCategory;
  workforceImpact: WorkforceImpact;
  framework: FrameworkCompliance;
  recommendations: ReskillingRecommendation[];
  mitigations: MitigationAction[];
  requiredApprovals: string[];
  auditId: string;
}

export interface FrameworkCompliance {
  nistRmf: {
    riskLevel: 'low' | 'moderate' | 'high';
    governanceRequired: boolean;
    mapPhaseComplete: boolean;
  };
  euAiAct: {
    riskClassification: 'minimal' | 'limited' | 'high' | 'unacceptable';
    humanOversightRequired: boolean;
    fundamentalRightsImpact: boolean;
  };
  oecdPrinciples: {
    inclusiveGrowthAligned: boolean;
    justTransitionRequired: boolean;
    transparencyMet: boolean;
  };
}

export interface ReskillingRecommendation {
  skill: string;
  priority: 'essential' | 'recommended' | 'optional';
  rationale: string;
  resources: Array<{
    title: string;
    type: 'course' | 'certification' | 'mentorship' | 'workshop';
    duration: string;
    provider?: string;
  }>;
  targetRoles: string[];
  timeframe: string;
}

export interface MitigationAction {
  action: string;
  type: 'process' | 'technical' | 'organizational' | 'communication';
  priority: 'immediate' | 'short-term' | 'long-term';
  owner: string;
  status: 'pending' | 'in-progress' | 'completed';
}

export interface AuditRecord {
  id: string;
  timestamp: Date;
  actionType: string;
  context: AssessmentContext;
  assessment: ImpactAssessment;
  assessedBy: string;
  approvals: Array<{ role: string; approved: boolean; date?: Date }>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const AUTOMATION_LEVEL_WEIGHTS: Record<AutomationLevel, number> = {
  assist: 0.15,
  partial: 0.35,
  substantial: 0.65,
  full: 0.90,
};

export const TASK_COMPLEXITY_MODIFIERS: Record<AssessmentContext['taskComplexity'], number> = {
  routine: 1.3, // Higher risk for routine tasks
  mixed: 1.0,
  complex: 0.7,
  creative: 0.4, // Lower risk for creative tasks
};

export const DECISION_AUTONOMY_WEIGHTS: Record<AssessmentContext['decisionAutonomy'], number> = {
  suggestions: 0.2,
  'semi-autonomous': 0.5,
  'fully-autonomous': 0.9,
};

export const RISK_THRESHOLDS = {
  minimal: { min: 0, max: 15 },
  low: { min: 16, max: 35 },
  medium: { min: 36, max: 55 },
  high: { min: 56, max: 80 },
  critical: { min: 81, max: 100 },
};

export const APPROVAL_REQUIREMENTS: Record<RiskCategory, string[]> = {
  minimal: [],
  low: ['team_lead'],
  medium: ['department_head', 'hr_representative'],
  high: ['executive', 'ethics_committee', 'hr_director'],
  critical: ['ceo', 'board', 'ethics_committee', 'legal'],
};

// ============================================================================
// CORE ASSESSMENT FUNCTIONS
// ============================================================================

/**
 * Calculate base impact score
 */
export function calculateBaseScore(context: AssessmentContext): number {
  // Automation level contribution (40%)
  const automationScore = AUTOMATION_LEVEL_WEIGHTS[context.automationLevel] * 40;

  // Task complexity contribution (25%)
  const complexityModifier = TASK_COMPLEXITY_MODIFIERS[context.taskComplexity];
  const complexityScore = 25 * complexityModifier;

  // Decision autonomy contribution (20%)
  const autonomyScore = DECISION_AUTONOMY_WEIGHTS[context.decisionAutonomy] * 20;

  // Team size scaling (10%)
  const teamScale = Math.min(context.teamSize / 100, 1);
  const teamScore = teamScale * 10;

  // Human interaction modifier (5%)
  const interactionScore = context.humanInteractionRequired ? 0 : 5;

  const totalScore = automationScore + complexityScore + autonomyScore + teamScore + interactionScore;

  return Math.round(Math.min(100, Math.max(0, totalScore)));
}

/**
 * Determine risk category from score
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
 * Determine workforce impact type
 */
export function getWorkforceImpact(score: number, context: AssessmentContext): WorkforceImpact {
  if (score < 25 && context.automationLevel === 'assist') return 'enhancement';
  if (score < 50) return 'transformation';
  if (score < 75) return 'reduction';
  return 'displacement';
}

/**
 * Assess framework compliance
 */
export function assessFrameworkCompliance(
  score: number,
  context: AssessmentContext
): FrameworkCompliance {
  return {
    nistRmf: {
      riskLevel: score < 35 ? 'low' : score < 65 ? 'moderate' : 'high',
      governanceRequired: score >= 50,
      mapPhaseComplete: true, // Assume completed by running this assessment
    },
    euAiAct: {
      riskClassification:
        score < 15 ? 'minimal' :
        score < 50 ? 'limited' :
        score < 85 ? 'high' : 'unacceptable',
      humanOversightRequired: score >= 50 || context.decisionAutonomy === 'fully-autonomous',
      fundamentalRightsImpact: score >= 65,
    },
    oecdPrinciples: {
      inclusiveGrowthAligned: score < 50,
      justTransitionRequired: score >= 40,
      transparencyMet: true, // Met by running transparent assessment
    },
  };
}

// ============================================================================
// RECOMMENDATION GENERATION
// ============================================================================

/**
 * Generate reskilling recommendations based on assessment
 */
export function generateReskillingRecommendations(
  score: number,
  context: AssessmentContext
): ReskillingRecommendation[] {
  const recommendations: ReskillingRecommendation[] = [];

  // AI Literacy (always recommended)
  recommendations.push({
    skill: 'AI Collaboration & Tool Proficiency',
    priority: score >= 50 ? 'essential' : 'recommended',
    rationale: 'Foundation skill for working effectively alongside AI systems',
    resources: [
      { title: 'AI Fundamentals for Professionals', type: 'course', duration: '20 hours', provider: 'Internal' },
      { title: 'Prompt Engineering Workshop', type: 'workshop', duration: '4 hours' },
      { title: 'AI Ethics Certification', type: 'certification', duration: '40 hours', provider: 'IEEE' },
    ],
    targetRoles: context.currentRoles || ['all'],
    timeframe: '3 months',
  });

  // High-impact specific skills
  if (score >= 50) {
    recommendations.push({
      skill: 'AI System Oversight & Quality Assurance',
      priority: 'essential',
      rationale: 'Critical for maintaining human oversight of AI operations',
      resources: [
        { title: 'AI Output Validation Techniques', type: 'course', duration: '16 hours' },
        { title: 'Quality Assurance for AI Systems', type: 'certification', duration: '30 hours' },
      ],
      targetRoles: context.currentRoles?.filter((r) => r.includes('senior') || r.includes('lead')) || ['senior_staff'],
      timeframe: '6 months',
    });
  }

  // Transformation roles
  if (context.automationLevel === 'substantial' || context.automationLevel === 'full') {
    recommendations.push({
      skill: 'Human-AI Workflow Design',
      priority: 'essential',
      rationale: 'Design optimal collaboration between humans and AI',
      resources: [
        { title: 'Workflow Automation Architecture', type: 'course', duration: '24 hours' },
        { title: 'Human-Centered AI Design', type: 'workshop', duration: '8 hours' },
      ],
      targetRoles: ['process_owner', 'team_lead', 'operations'],
      timeframe: '4 months',
    });

    recommendations.push({
      skill: 'Strategic Decision Making',
      priority: 'recommended',
      rationale: 'Focus on high-value decisions AI cannot make',
      resources: [
        { title: 'Strategic Thinking in the AI Era', type: 'course', duration: '16 hours' },
        { title: 'Executive Decision Frameworks', type: 'mentorship', duration: '3 months' },
      ],
      targetRoles: context.currentRoles || ['management'],
      timeframe: '6 months',
    });
  }

  // Emotional/creative skills (always valuable)
  if (context.taskComplexity === 'routine' || context.taskComplexity === 'mixed') {
    recommendations.push({
      skill: 'Creative Problem Solving & Innovation',
      priority: score >= 60 ? 'essential' : 'recommended',
      rationale: 'Uniquely human capabilities that complement AI',
      resources: [
        { title: 'Design Thinking Workshop', type: 'workshop', duration: '16 hours' },
        { title: 'Innovation Leadership', type: 'course', duration: '20 hours' },
      ],
      targetRoles: context.currentRoles || ['all'],
      timeframe: '4 months',
    });
  }

  // Leadership for high-impact
  if (score >= 65) {
    recommendations.push({
      skill: 'AI Transformation Leadership',
      priority: 'essential',
      rationale: 'Lead teams through AI-driven organizational change',
      resources: [
        { title: 'Leading Digital Transformation', type: 'certification', duration: '40 hours' },
        { title: 'Change Management for AI', type: 'course', duration: '24 hours' },
        { title: 'Executive Coaching', type: 'mentorship', duration: '6 months' },
      ],
      targetRoles: ['manager', 'director', 'executive'],
      timeframe: '9 months',
    });
  }

  return recommendations;
}

/**
 * Generate mitigation actions
 */
export function generateMitigations(
  score: number,
  category: RiskCategory,
  context: AssessmentContext
): MitigationAction[] {
  const mitigations: MitigationAction[] = [];

  // Always: Communication
  mitigations.push({
    action: 'Communicate automation plans to affected teams transparently',
    type: 'communication',
    priority: 'immediate',
    owner: 'HR + Department Head',
    status: 'pending',
  });

  // Medium+: Process redesign
  if (score >= 35) {
    mitigations.push({
      action: 'Design hybrid human-AI workflows with clear handoff points',
      type: 'process',
      priority: 'short-term',
      owner: 'Operations',
      status: 'pending',
    });
  }

  // High: Organizational changes
  if (score >= 55) {
    mitigations.push({
      action: 'Establish AI oversight committee with workforce representatives',
      type: 'organizational',
      priority: 'short-term',
      owner: 'Executive Team',
      status: 'pending',
    });

    mitigations.push({
      action: 'Create internal mobility program for role transitions',
      type: 'organizational',
      priority: 'short-term',
      owner: 'HR',
      status: 'pending',
    });
  }

  // Critical: Technical safeguards
  if (score >= 75) {
    mitigations.push({
      action: 'Implement mandatory human review for all AI decisions',
      type: 'technical',
      priority: 'immediate',
      owner: 'Engineering',
      status: 'pending',
    });

    mitigations.push({
      action: 'Develop rollback plan for automation reversal if needed',
      type: 'technical',
      priority: 'immediate',
      owner: 'Engineering + Operations',
      status: 'pending',
    });

    mitigations.push({
      action: 'Allocate just-transition fund (min 10% of automation savings)',
      type: 'organizational',
      priority: 'immediate',
      owner: 'Finance + HR',
      status: 'pending',
    });
  }

  // Gradual rollout for substantial automation
  if (context.automationLevel === 'substantial' || context.automationLevel === 'full') {
    mitigations.push({
      action: 'Phase automation rollout over 6-12 months with checkpoints',
      type: 'process',
      priority: 'short-term',
      owner: 'Project Management',
      status: 'pending',
    });
  }

  return mitigations;
}

// ============================================================================
// MAIN ASSESSMENT FUNCTION
// ============================================================================

/**
 * Perform comprehensive job impact assessment
 */
export async function assessJobImpact(
  actionType: string,
  context: AssessmentContext,
  assessedBy: string = 'system'
): Promise<ImpactAssessment> {
  // Calculate base score
  const score = calculateBaseScore(context);
  const category = getRiskCategory(score);
  const workforceImpact = getWorkforceImpact(score, context);

  // Assess framework compliance
  const framework = assessFrameworkCompliance(score, context);

  // Generate recommendations and mitigations
  const recommendations = generateReskillingRecommendations(score, context);
  const mitigations = generateMitigations(score, category, context);

  // Determine required approvals
  const requiredApprovals = APPROVAL_REQUIREMENTS[category];

  // Generate audit ID
  const auditId = `impact-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // Log audit record
  await logAuditRecord({
    id: auditId,
    timestamp: new Date(),
    actionType,
    context,
    assessment: {
      score,
      category,
      workforceImpact,
      framework,
      recommendations,
      mitigations,
      requiredApprovals,
      auditId,
    },
    assessedBy,
    approvals: requiredApprovals.map((role) => ({ role, approved: false })),
  });

  return {
    score,
    category,
    workforceImpact,
    framework,
    recommendations,
    mitigations,
    requiredApprovals,
    auditId,
  };
}

/**
 * Log audit record (in production, persist to database)
 */
async function logAuditRecord(record: AuditRecord): Promise<void> {
  console.log('Job Impact Audit:', JSON.stringify({
    id: record.id,
    timestamp: record.timestamp.toISOString(),
    actionType: record.actionType,
    score: record.assessment.score,
    category: record.assessment.category,
    workforceImpact: record.assessment.workforceImpact,
    requiredApprovals: record.assessment.requiredApprovals,
  }, null, 2));
}

// ============================================================================
// BATCH ASSESSMENT
// ============================================================================

/**
 * Assess multiple automation initiatives
 */
export async function batchAssessment(
  initiatives: Array<{ actionType: string; context: AssessmentContext }>,
  assessedBy: string = 'system'
): Promise<{
  assessments: ImpactAssessment[];
  summary: {
    totalScore: number;
    avgScore: number;
    highRiskCount: number;
    totalAffected: number;
    overallCategory: RiskCategory;
    priorityMitigations: MitigationAction[];
  };
}> {
  const assessments = await Promise.all(
    initiatives.map((i) => assessJobImpact(i.actionType, i.context, assessedBy))
  );

  const totalScore = assessments.reduce((sum, a) => sum + a.score, 0);
  const avgScore = Math.round(totalScore / assessments.length);
  const highRiskCount = assessments.filter((a) => a.category === 'high' || a.category === 'critical').length;
  const totalAffected = initiatives.reduce((sum, i) => sum + i.context.teamSize, 0);

  // Priority mitigations from all high-risk assessments
  const priorityMitigations = assessments
    .filter((a) => a.category === 'high' || a.category === 'critical')
    .flatMap((a) => a.mitigations.filter((m) => m.priority === 'immediate'));

  return {
    assessments,
    summary: {
      totalScore,
      avgScore,
      highRiskCount,
      totalAffected,
      overallCategory: getRiskCategory(avgScore),
      priorityMitigations: [...new Map(priorityMitigations.map((m) => [m.action, m])).values()],
    },
  };
}

// ============================================================================
// APPROVAL WORKFLOW
// ============================================================================

/**
 * Check if assessment has required approvals
 */
export function hasRequiredApprovals(
  assessment: ImpactAssessment,
  approvals: Array<{ role: string; approved: boolean }>
): boolean {
  return assessment.requiredApprovals.every((required) =>
    approvals.some((a) => a.role === required && a.approved)
  );
}

/**
 * Get pending approvals for assessment
 */
export function getPendingApprovals(
  assessment: ImpactAssessment,
  approvals: Array<{ role: string; approved: boolean }>
): string[] {
  return assessment.requiredApprovals.filter(
    (required) => !approvals.some((a) => a.role === required && a.approved)
  );
}

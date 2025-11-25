/**
 * Job Impact Assessment Panel
 *
 * Displays real-time ethics assessment for automation actions.
 * Integrates NIST RMF, EU AI Act, and OECD framework compliance.
 *
 * @example
 * ```tsx
 * <JobImpactPanel
 *   actionType="deploy-ai-agent"
 *   context={{ teamSize: 10, automationLevel: 'substantial', ... }}
 *   onApprovalRequired={(assessment) => openApprovalDialog(assessment)}
 * />
 * ```
 */

import React, { useState, useEffect, useCallback } from 'react';

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

export interface ReskillingRecommendation {
  skill: string;
  priority: 'essential' | 'recommended' | 'optional';
  rationale: string;
  timeframe: string;
}

export interface MitigationAction {
  action: string;
  type: 'process' | 'technical' | 'organizational' | 'communication';
  priority: 'immediate' | 'short-term' | 'long-term';
  owner: string;
}

export interface ImpactAssessment {
  score: number;
  category: RiskCategory;
  workforceImpact: WorkforceImpact;
  framework: FrameworkCompliance;
  recommendations: ReskillingRecommendation[];
  mitigations: MitigationAction[];
  requiredApprovals: string[];
  auditId: string;
}

export interface JobImpactPanelProps {
  actionType: string;
  context: AssessmentContext;
  onApprovalRequired?: (assessment: ImpactAssessment) => void;
  onAssessmentComplete?: (assessment: ImpactAssessment) => void;
  assessmentEndpoint?: string;
  className?: string;
  compact?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const RISK_COLORS: Record<RiskCategory, string> = {
  minimal: '#22c55e',
  low: '#84cc16',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
};

const IMPACT_ICONS: Record<WorkforceImpact, string> = {
  enhancement: '+',
  transformation: '~',
  reduction: '-',
  displacement: '!',
};

function formatApprover(role: string): string {
  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Local assessment calculation (mirrors server-side logic)
function calculateLocalAssessment(context: AssessmentContext): Partial<ImpactAssessment> {
  const automationWeights: Record<AutomationLevel, number> = {
    assist: 0.15,
    partial: 0.35,
    substantial: 0.65,
    full: 0.90,
  };

  const complexityModifiers: Record<string, number> = {
    routine: 1.3,
    mixed: 1.0,
    complex: 0.7,
    creative: 0.4,
  };

  const autonomyWeights: Record<string, number> = {
    suggestions: 0.2,
    'semi-autonomous': 0.5,
    'fully-autonomous': 0.9,
  };

  const automationScore = automationWeights[context.automationLevel] * 40;
  const complexityScore = 25 * (complexityModifiers[context.taskComplexity] || 1);
  const autonomyScore = (autonomyWeights[context.decisionAutonomy] || 0.5) * 20;
  const teamScale = Math.min(context.teamSize / 100, 1);
  const teamScore = teamScale * 10;
  const interactionScore = context.humanInteractionRequired ? 0 : 5;

  const score = Math.round(Math.min(100, Math.max(0, automationScore + complexityScore + autonomyScore + teamScore + interactionScore)));

  let category: RiskCategory;
  if (score <= 15) category = 'minimal';
  else if (score <= 35) category = 'low';
  else if (score <= 55) category = 'medium';
  else if (score <= 80) category = 'high';
  else category = 'critical';

  let workforceImpact: WorkforceImpact;
  if (score < 25 && context.automationLevel === 'assist') workforceImpact = 'enhancement';
  else if (score < 50) workforceImpact = 'transformation';
  else if (score < 75) workforceImpact = 'reduction';
  else workforceImpact = 'displacement';

  return { score, category, workforceImpact };
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ScoreGaugeProps {
  score: number;
  category: RiskCategory;
}

function ScoreGauge({ score, category }: ScoreGaugeProps) {
  const color = RISK_COLORS[category];
  const percentage = score;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          border: `4px solid ${color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: 700,
          color,
        }}
      >
        {score}
      </div>
      <div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', textTransform: 'capitalize' }}>
          {category} Risk
        </div>
        <div
          style={{
            width: '100px',
            height: '6px',
            backgroundColor: '#2d2d44',
            borderRadius: '3px',
            marginTop: '4px',
          }}
        >
          <div
            style={{
              width: `${percentage}%`,
              height: '100%',
              backgroundColor: color,
              borderRadius: '3px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>
    </div>
  );
}

interface ComplianceBadgesProps {
  framework: FrameworkCompliance;
}

function ComplianceBadges({ framework }: ComplianceBadgesProps) {
  const badges = [
    {
      label: 'NIST RMF',
      status: framework.nistRmf.riskLevel === 'low',
      detail: framework.nistRmf.riskLevel,
    },
    {
      label: 'EU AI Act',
      status: framework.euAiAct.riskClassification !== 'high' && framework.euAiAct.riskClassification !== 'unacceptable',
      detail: framework.euAiAct.riskClassification,
    },
    {
      label: 'OECD',
      status: framework.oecdPrinciples.inclusiveGrowthAligned,
      detail: framework.oecdPrinciples.justTransitionRequired ? 'Transition Req' : 'Aligned',
    },
  ];

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {badges.map((badge) => (
        <div
          key={badge.label}
          style={{
            padding: '4px 10px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 500,
            backgroundColor: badge.status ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: badge.status ? '#22c55e' : '#ef4444',
            border: `1px solid ${badge.status ? '#22c55e33' : '#ef444433'}`,
          }}
        >
          {badge.label}: {badge.detail}
        </div>
      ))}
    </div>
  );
}

interface ApprovalListProps {
  approvers: string[];
  onRequestApproval?: () => void;
}

function ApprovalList({ approvers, onRequestApproval }: ApprovalListProps) {
  if (approvers.length === 0) {
    return (
      <div style={{ color: '#22c55e', fontSize: '13px' }}>
        No approval required - proceed with caution
      </div>
    );
  }

  return (
    <div>
      <div style={{ color: '#f97316', fontSize: '13px', marginBottom: '8px' }}>
        Approval required from:
      </div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {approvers.map((approver) => (
          <span
            key={approver}
            style={{
              padding: '3px 8px',
              backgroundColor: '#2d2d44',
              borderRadius: '4px',
              fontSize: '11px',
              color: '#fff',
            }}
          >
            {formatApprover(approver)}
          </span>
        ))}
      </div>
      {onRequestApproval && (
        <button
          onClick={onRequestApproval}
          style={{
            marginTop: '12px',
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          Request Approval
        </button>
      )}
    </div>
  );
}

interface RecommendationListProps {
  recommendations: ReskillingRecommendation[];
  expanded?: boolean;
}

function RecommendationList({ recommendations, expanded = false }: RecommendationListProps) {
  const [showAll, setShowAll] = useState(expanded);
  const displayRecs = showAll ? recommendations : recommendations.slice(0, 2);

  return (
    <div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>
        Reskilling Recommendations
      </div>
      {displayRecs.map((rec, idx) => (
        <div
          key={idx}
          style={{
            padding: '8px 12px',
            backgroundColor: '#1a1a2e',
            borderRadius: '4px',
            marginBottom: '6px',
            borderLeft: `3px solid ${rec.priority === 'essential' ? '#ef4444' : rec.priority === 'recommended' ? '#eab308' : '#22c55e'}`,
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>{rec.skill}</div>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{rec.rationale}</div>
          <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
            Timeframe: {rec.timeframe}
          </div>
        </div>
      ))}
      {recommendations.length > 2 && (
        <button
          onClick={() => setShowAll(!showAll)}
          style={{
            background: 'none',
            border: 'none',
            color: '#3b82f6',
            cursor: 'pointer',
            fontSize: '12px',
            padding: 0,
          }}
        >
          {showAll ? 'Show less' : `Show ${recommendations.length - 2} more`}
        </button>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function JobImpactPanel({
  actionType,
  context,
  onApprovalRequired,
  onAssessmentComplete,
  assessmentEndpoint = '/api/ethics/impact',
  className,
  compact = false,
}: JobImpactPanelProps) {
  const [assessment, setAssessment] = useState<ImpactAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<Partial<ImpactAssessment> | null>(null);

  // Immediate local preview
  useEffect(() => {
    setLocalPreview(calculateLocalAssessment(context));
  }, [context]);

  // Fetch full assessment from API
  const fetchAssessment = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(assessmentEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assess',
          actionType,
          context,
        }),
      });

      if (!response.ok) {
        throw new Error('Assessment failed');
      }

      const data = await response.json();
      setAssessment(data.assessment);

      if (data.assessment.requiredApprovals.length > 0 && onApprovalRequired) {
        onApprovalRequired(data.assessment);
      }

      if (onAssessmentComplete) {
        onAssessmentComplete(data.assessment);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assessment failed');
      // Use local preview as fallback
      if (localPreview) {
        setAssessment({
          ...localPreview,
          framework: {
            nistRmf: { riskLevel: 'moderate', governanceRequired: true },
            euAiAct: { riskClassification: 'limited', humanOversightRequired: true },
            oecdPrinciples: { inclusiveGrowthAligned: true, justTransitionRequired: true },
          },
          recommendations: [],
          mitigations: [],
          requiredApprovals: [],
          auditId: 'local-preview',
        } as ImpactAssessment);
      }
    } finally {
      setIsLoading(false);
    }
  }, [actionType, context, assessmentEndpoint, onApprovalRequired, onAssessmentComplete, localPreview]);

  useEffect(() => {
    fetchAssessment();
  }, [fetchAssessment]);

  const displayData = assessment || localPreview;

  if (!displayData) {
    return (
      <div className={className} style={{ padding: '16px', color: '#666' }}>
        Calculating impact assessment...
      </div>
    );
  }

  if (compact) {
    return (
      <div
        className={className}
        style={{
          padding: '12px',
          backgroundColor: '#0f0f1a',
          borderRadius: '8px',
          border: '1px solid #2d2d44',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: RISK_COLORS[displayData.category!],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000',
            fontWeight: 700,
            fontSize: '12px',
          }}
        >
          {displayData.score}
        </div>
        <div>
          <div style={{ fontSize: '13px', color: '#fff', textTransform: 'capitalize' }}>
            {displayData.category} Risk
          </div>
          <div style={{ fontSize: '11px', color: '#888' }}>
            {IMPACT_ICONS[displayData.workforceImpact!]} {displayData.workforceImpact}
          </div>
        </div>
        {isLoading && (
          <span style={{ fontSize: '10px', color: '#666', marginLeft: 'auto' }}>Updating...</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        backgroundColor: '#0f0f1a',
        borderRadius: '12px',
        border: '1px solid #2d2d44',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #2d2d44',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: 600 }}>
          Job Impact Assessment
        </h3>
        <div style={{ fontSize: '11px', color: '#666' }}>
          {assessment?.auditId || 'Preview'}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          style={{
            padding: '8px 16px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            fontSize: '12px',
          }}
        >
          {error} - showing local estimate
        </div>
      )}

      {/* Score Section */}
      <div style={{ padding: '16px', borderBottom: '1px solid #2d2d44' }}>
        <ScoreGauge score={displayData.score!} category={displayData.category!} />
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#888' }}>
          Workforce Impact: <span style={{ color: '#fff' }}>{displayData.workforceImpact}</span>
        </div>
      </div>

      {/* Framework Compliance */}
      {assessment?.framework && (
        <div style={{ padding: '16px', borderBottom: '1px solid #2d2d44' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>
            Framework Compliance
          </div>
          <ComplianceBadges framework={assessment.framework} />
        </div>
      )}

      {/* Approvals */}
      {assessment && (
        <div style={{ padding: '16px', borderBottom: '1px solid #2d2d44' }}>
          <ApprovalList
            approvers={assessment.requiredApprovals}
            onRequestApproval={
              assessment.requiredApprovals.length > 0 && onApprovalRequired
                ? () => onApprovalRequired(assessment)
                : undefined
            }
          />
        </div>
      )}

      {/* Recommendations */}
      {assessment?.recommendations && assessment.recommendations.length > 0 && (
        <div style={{ padding: '16px' }}>
          <RecommendationList recommendations={assessment.recommendations} />
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: '#1a1a2e',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: '#666',
        }}
      >
        <span>Action: {actionType}</span>
        <button
          onClick={fetchAssessment}
          disabled={isLoading}
          style={{
            background: 'none',
            border: 'none',
            color: '#3b82f6',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '11px',
          }}
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    </div>
  );
}

export default JobImpactPanel;

/**
 * Job Impact Assessment API Routes
 *
 * NIST RMF 2.0, EU AI Act, and OECD-aligned impact assessment endpoints.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  assessJobImpact,
  batchAssessment,
  calculateBaseScore,
  getRiskCategory,
  getWorkforceImpact,
  assessFrameworkCompliance,
  generateReskillingRecommendations,
  generateMitigations,
  hasRequiredApprovals,
  getPendingApprovals,
  RISK_THRESHOLDS,
  APPROVAL_REQUIREMENTS,
  AUTOMATION_LEVEL_WEIGHTS,
  type AssessmentContext,
  type ImpactAssessment,
} from '@/lib/ethics';

// In-memory assessment storage (use database in production)
const assessments = new Map<string, { assessment: ImpactAssessment; context: AssessmentContext; actionType: string }>();

/**
 * POST /api/ethics/impact
 * Impact assessment operations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'assess': {
        const { actionType, context, assessedBy } = body as {
          actionType: string;
          context: AssessmentContext;
          assessedBy?: string;
        };

        if (!actionType || !context) {
          return NextResponse.json(
            { error: 'actionType and context required' },
            { status: 400 }
          );
        }

        // Validate context
        if (!context.automationLevel || !context.taskComplexity || !context.decisionAutonomy) {
          return NextResponse.json(
            { error: 'context must include automationLevel, taskComplexity, and decisionAutonomy' },
            { status: 400 }
          );
        }

        const assessment = await assessJobImpact(actionType, context, assessedBy);
        assessments.set(assessment.auditId, { assessment, context, actionType });

        return NextResponse.json({
          success: true,
          assessment,
          summary: {
            score: assessment.score,
            category: assessment.category,
            workforceImpact: assessment.workforceImpact,
            requiresApproval: assessment.requiredApprovals.length > 0,
            approvers: assessment.requiredApprovals,
            mitigationCount: assessment.mitigations.length,
            recommendationCount: assessment.recommendations.length,
          },
        });
      }

      case 'batch-assess': {
        const { initiatives, assessedBy } = body as {
          initiatives: Array<{ actionType: string; context: AssessmentContext }>;
          assessedBy?: string;
        };

        if (!initiatives?.length) {
          return NextResponse.json(
            { error: 'initiatives array required' },
            { status: 400 }
          );
        }

        const result = await batchAssessment(initiatives, assessedBy);

        // Store all assessments
        result.assessments.forEach((a, i) => {
          assessments.set(a.auditId, {
            assessment: a,
            context: initiatives[i].context,
            actionType: initiatives[i].actionType,
          });
        });

        return NextResponse.json({
          success: true,
          summary: result.summary,
          assessments: result.assessments.map((a) => ({
            auditId: a.auditId,
            score: a.score,
            category: a.category,
            workforceImpact: a.workforceImpact,
          })),
        });
      }

      case 'preview': {
        const { context } = body as { context: AssessmentContext };

        if (!context) {
          return NextResponse.json({ error: 'context required' }, { status: 400 });
        }

        const score = calculateBaseScore(context);
        const category = getRiskCategory(score);
        const workforceImpact = getWorkforceImpact(score, context);
        const framework = assessFrameworkCompliance(score, context);

        return NextResponse.json({
          success: true,
          preview: {
            score,
            category,
            workforceImpact,
            framework,
            wouldRequireApprovals: APPROVAL_REQUIREMENTS[category],
          },
        });
      }

      case 'approve': {
        const { auditId, approverRole, approved, comment } = body;

        if (!auditId || !approverRole || approved === undefined) {
          return NextResponse.json(
            { error: 'auditId, approverRole, and approved required' },
            { status: 400 }
          );
        }

        const record = assessments.get(auditId);
        if (!record) {
          return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
        }

        // Check if this role is required
        if (!record.assessment.requiredApprovals.includes(approverRole)) {
          return NextResponse.json(
            { error: `Role ${approverRole} is not a required approver` },
            { status: 400 }
          );
        }

        // In production, store approval in database
        return NextResponse.json({
          success: true,
          approval: {
            auditId,
            approverRole,
            approved,
            comment,
            timestamp: new Date(),
          },
        });
      }

      case 'get-recommendations': {
        const { context } = body as { context: AssessmentContext };

        if (!context) {
          return NextResponse.json({ error: 'context required' }, { status: 400 });
        }

        const score = calculateBaseScore(context);
        const recommendations = generateReskillingRecommendations(score, context);

        return NextResponse.json({
          success: true,
          recommendations,
        });
      }

      case 'get-mitigations': {
        const { context } = body as { context: AssessmentContext };

        if (!context) {
          return NextResponse.json({ error: 'context required' }, { status: 400 });
        }

        const score = calculateBaseScore(context);
        const category = getRiskCategory(score);
        const mitigations = generateMitigations(score, category, context);

        return NextResponse.json({
          success: true,
          mitigations,
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing impact assessment request:', error);
    return NextResponse.json(
      { error: 'Failed to process impact assessment request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ethics/impact
 * Get impact assessment info
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const auditId = searchParams.get('auditId');

    switch (type) {
      case 'assessment':
        if (!auditId) {
          return NextResponse.json({ error: 'auditId required' }, { status: 400 });
        }

        const record = assessments.get(auditId);
        if (!record) {
          return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          assessment: record.assessment,
          context: record.context,
          actionType: record.actionType,
        });

      case 'thresholds':
        return NextResponse.json({
          success: true,
          thresholds: RISK_THRESHOLDS,
        });

      case 'approval-matrix':
        return NextResponse.json({
          success: true,
          approvalMatrix: APPROVAL_REQUIREMENTS,
        });

      case 'automation-weights':
        return NextResponse.json({
          success: true,
          automationWeights: AUTOMATION_LEVEL_WEIGHTS,
        });

      case 'recent':
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        const recentAssessments = Array.from(assessments.entries())
          .slice(-limit)
          .reverse()
          .map(([id, record]) => ({
            auditId: id,
            actionType: record.actionType,
            score: record.assessment.score,
            category: record.assessment.category,
            workforceImpact: record.assessment.workforceImpact,
            requiredApprovals: record.assessment.requiredApprovals,
          }));

        return NextResponse.json({
          success: true,
          assessments: recentAssessments,
        });

      case 'frameworks':
        return NextResponse.json({
          success: true,
          frameworks: {
            nistRmf: {
              name: 'NIST AI Risk Management Framework 2.0',
              categories: ['low', 'moderate', 'high'],
              description: 'Risk categorization and governance requirements',
            },
            euAiAct: {
              name: 'EU AI Act',
              categories: ['minimal', 'limited', 'high', 'unacceptable'],
              description: 'Risk classification and human oversight requirements',
            },
            oecdPrinciples: {
              name: 'OECD AI Principles',
              aspects: ['inclusiveGrowthAligned', 'justTransitionRequired', 'transparencyMet'],
              description: 'Inclusive growth and just transition principles',
            },
          },
        });

      default:
        return NextResponse.json(
          { error: 'Invalid type. Use: assessment, thresholds, approval-matrix, automation-weights, recent, or frameworks' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching impact assessment info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch impact assessment info' },
      { status: 500 }
    );
  }
}

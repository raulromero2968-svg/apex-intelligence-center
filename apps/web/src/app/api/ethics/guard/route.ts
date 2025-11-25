/**
 * Ethics Guard API Routes
 *
 * Job protection and ethical AI safeguards.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  ethicsGuard,
  processHumanOverride,
  batchAssessment,
  calculateImpactScore,
  generateMitigations,
  generateReskillingSuggestions,
  type AgentAction,
  type EthicsContext,
  type OverrideRequest,
} from '@/lib/ethics';

/**
 * POST /api/ethics/guard
 * Evaluate action for ethical compliance
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action: apiAction } = body;

    switch (apiAction) {
      case 'evaluate': {
        const { agentAction, context } = body as {
          agentAction: AgentAction;
          context: EthicsContext;
        };

        if (!agentAction || !context) {
          return NextResponse.json(
            { error: 'agentAction and context required' },
            { status: 400 }
          );
        }

        const result = await ethicsGuard(agentAction, context);

        return NextResponse.json({
          success: true,
          result,
        });
      }

      case 'override': {
        const { overrideRequest, context } = body as {
          overrideRequest: OverrideRequest;
          context: EthicsContext;
        };

        if (!overrideRequest || !context) {
          return NextResponse.json(
            { error: 'overrideRequest and context required' },
            { status: 400 }
          );
        }

        const result = await processHumanOverride(overrideRequest, context);

        return NextResponse.json({
          success: true,
          result,
        });
      }

      case 'batch': {
        const { actions, context } = body as {
          actions: AgentAction[];
          context: EthicsContext;
        };

        if (!actions?.length || !context) {
          return NextResponse.json(
            { error: 'actions array and context required' },
            { status: 400 }
          );
        }

        const result = await batchAssessment(actions, context);

        return NextResponse.json({
          success: true,
          result,
        });
      }

      case 'assess': {
        const { agentAction } = body as { agentAction: AgentAction };

        if (!agentAction) {
          return NextResponse.json(
            { error: 'agentAction required' },
            { status: 400 }
          );
        }

        const impact = calculateImpactScore(agentAction);
        const mitigations = generateMitigations(agentAction, impact);
        const reskilling = generateReskillingSuggestions(agentAction, impact);

        return NextResponse.json({
          success: true,
          assessment: {
            impact,
            mitigations,
            reskillingSuggestions: reskilling,
          },
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: evaluate, override, batch, or assess' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing ethics request:', error);
    return NextResponse.json(
      { error: 'Failed to process ethics request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ethics/guard
 * Get ethics information
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    switch (type) {
      case 'thresholds':
        return NextResponse.json({
          success: true,
          thresholds: {
            minimal: { max: 10, requiresApproval: false },
            low: { max: 30, requiresApproval: false },
            medium: { max: 50, requiresApproval: true },
            high: { max: 75, requiresApproval: true },
            critical: { max: 100, requiresApproval: true },
          },
        });

      case 'automation-types':
        return NextResponse.json({
          success: true,
          types: [
            { id: 'task_assist', weight: 0.1, description: 'Helps with specific tasks' },
            { id: 'role_augment', weight: 0.3, description: 'Enhances role capabilities' },
            { id: 'process_automate', weight: 0.5, description: 'Automates workflows' },
            { id: 'function_replace', weight: 0.8, description: 'Replaces job functions' },
            { id: 'team_replace', weight: 1.0, description: 'Replaces entire teams' },
          ],
        });

      default:
        return NextResponse.json(
          { error: 'Invalid type. Use: thresholds or automation-types' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching ethics info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ethics info' },
      { status: 500 }
    );
  }
}

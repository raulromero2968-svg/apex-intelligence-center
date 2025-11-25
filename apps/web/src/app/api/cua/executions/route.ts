/**
 * CUA Executions API
 *
 * Endpoints for managing agent executions.
 * Implements pack-cua-001 §3.4 (Agent Analytics Pipeline).
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  startExecution,
  updateExecutionStatus,
  getExecution,
  getRecentExecutions,
  logAction,
  getExecutionActions,
  executeAction,
  validateAction,
  updateAgentMetrics,
  DEFAULT_RUNTIME_CONFIG,
  type AgentAction,
  type ExecutionContext,
} from '@/lib/cua';

/**
 * GET /api/cua/executions
 *
 * List or get executions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') ?? 'list';
    const executionId = searchParams.get('executionId');
    const workflowId = searchParams.get('workflowId');
    const agentId = searchParams.get('agentId');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);

    switch (action) {
      case 'list': {
        const executions = await getRecentExecutions({
          workflowId: workflowId ?? undefined,
          agentId: agentId ?? undefined,
          userId: userId ?? undefined,
          status: status as any,
          limit,
        });

        return NextResponse.json({ executions });
      }

      case 'get': {
        if (!executionId) {
          return NextResponse.json(
            { error: 'Missing required parameter: executionId' },
            { status: 400 }
          );
        }

        const execution = await getExecution(executionId);
        if (!execution) {
          return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
        }

        return NextResponse.json({ execution });
      }

      case 'actions': {
        if (!executionId) {
          return NextResponse.json(
            { error: 'Missing required parameter: executionId' },
            { status: 400 }
          );
        }

        const actions = await getExecutionActions(executionId);
        return NextResponse.json({ actions });
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Valid actions: list, get, actions` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching executions:', error);
    return NextResponse.json({ error: 'Failed to fetch executions' }, { status: 500 });
  }
}

/**
 * POST /api/cua/executions
 *
 * Start execution or perform actions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action ?? 'start';

    switch (action) {
      case 'start': {
        if (!body.workflowId || !body.agentId) {
          return NextResponse.json(
            { error: 'Missing required fields: workflowId, agentId' },
            { status: 400 }
          );
        }

        const execution = await startExecution(body.workflowId, body.agentId, {
          userId: body.userId,
          inputData: body.inputData,
          triggerType: body.triggerType,
          triggerData: body.triggerData,
        });

        return NextResponse.json({ execution }, { status: 201 });
      }

      case 'execute-action': {
        if (!body.agentAction) {
          return NextResponse.json(
            { error: 'Missing required field: agentAction' },
            { status: 400 }
          );
        }

        const agentAction: AgentAction = body.agentAction;
        const context: ExecutionContext = body.context ?? { variables: {} };
        const config = body.config ?? DEFAULT_RUNTIME_CONFIG;

        // Validate action
        const validation = validateAction(agentAction, config);
        if (!validation.valid) {
          return NextResponse.json(
            { error: `Invalid action: ${validation.reason}` },
            { status: 400 }
          );
        }

        // Execute action
        const result = await executeAction(agentAction, context, config);

        return NextResponse.json({ result });
      }

      case 'log-action': {
        if (!body.executionId || !body.actionType || body.sequenceNumber === undefined) {
          return NextResponse.json(
            { error: 'Missing required fields: executionId, actionType, sequenceNumber' },
            { status: 400 }
          );
        }

        const logged = await logAction(body.executionId, {
          stepId: body.stepId,
          actionType: body.actionType,
          actionData: body.actionData,
          status: body.status ?? 'success',
          result: body.result,
          aiReasoning: body.aiReasoning,
          durationMs: body.durationMs,
          sequenceNumber: body.sequenceNumber,
        });

        return NextResponse.json({ action: logged }, { status: 201 });
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Valid actions: start, execute-action, log-action` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error with execution:', error);
    return NextResponse.json({ error: 'Failed to process execution' }, { status: 500 });
  }
}

/**
 * PATCH /api/cua/executions
 *
 * Update execution status
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.executionId || !body.status) {
      return NextResponse.json(
        { error: 'Missing required fields: executionId, status' },
        { status: 400 }
      );
    }

    const updated = await updateExecutionStatus(body.executionId, body.status, {
      currentStepId: body.currentStepId,
      completedSteps: body.completedSteps,
      totalSteps: body.totalSteps,
      progressPercent: body.progressPercent,
      outputData: body.outputData,
      errorMessage: body.errorMessage,
      errorStepId: body.errorStepId,
      errorDetails: body.errorDetails,
      metrics: body.metrics,
      context: body.context,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
    }

    // Update agent metrics if execution completed
    if (body.status === 'completed' || body.status === 'failed') {
      const execution = await getExecution(body.executionId);
      if (execution) {
        await updateAgentMetrics(execution.agentId, {
          success: body.status === 'completed',
          durationMs: execution.durationMs ?? 0,
          actionsCount: (execution.metrics as any)?.totalActions ?? 0,
        });
      }
    }

    return NextResponse.json({ execution: updated });
  } catch (error) {
    console.error('Error updating execution:', error);
    return NextResponse.json({ error: 'Failed to update execution' }, { status: 500 });
  }
}

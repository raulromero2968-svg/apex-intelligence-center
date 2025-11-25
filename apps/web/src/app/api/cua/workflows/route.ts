/**
 * CUA Workflows API
 *
 * Endpoints for managing automation workflows.
 * Implements pack-cua-001 §2.2 (Workflow Binding Wizard).
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createWorkflow,
  createWorkflowFromTemplate,
  getWorkflow,
  getWorkflowWithSteps,
  getUserWorkflows,
  updateWorkflow,
  deleteWorkflow,
  createStep,
  getWorkflowSteps,
  updateStep,
  deleteStep,
  reorderSteps,
  validateWorkflow,
  getWorkflowTemplates,
} from '@/lib/cua';

/**
 * GET /api/cua/workflows
 *
 * List workflows
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') ?? 'list';
    const userId = searchParams.get('userId');
    const workflowId = searchParams.get('workflowId');

    switch (action) {
      case 'list': {
        if (userId) {
          const workflows = await getUserWorkflows(userId);
          return NextResponse.json({ workflows });
        }

        return NextResponse.json({ workflows: [] });
      }

      case 'get': {
        if (!workflowId) {
          return NextResponse.json(
            { error: 'Missing required parameter: workflowId' },
            { status: 400 }
          );
        }

        const workflow = await getWorkflow(workflowId);
        if (!workflow) {
          return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
        }

        return NextResponse.json({ workflow });
      }

      case 'with-steps': {
        if (!workflowId) {
          return NextResponse.json(
            { error: 'Missing required parameter: workflowId' },
            { status: 400 }
          );
        }

        const result = await getWorkflowWithSteps(workflowId);
        if (!result) {
          return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
        }

        return NextResponse.json(result);
      }

      case 'steps': {
        if (!workflowId) {
          return NextResponse.json(
            { error: 'Missing required parameter: workflowId' },
            { status: 400 }
          );
        }

        const steps = await getWorkflowSteps(workflowId);
        return NextResponse.json({ steps });
      }

      case 'validate': {
        if (!workflowId) {
          return NextResponse.json(
            { error: 'Missing required parameter: workflowId' },
            { status: 400 }
          );
        }

        const validation = await validateWorkflow(workflowId);
        return NextResponse.json({ validation });
      }

      case 'templates': {
        const templates = getWorkflowTemplates();
        return NextResponse.json({ templates });
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Valid actions: list, get, with-steps, steps, validate, templates` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 });
  }
}

/**
 * POST /api/cua/workflows
 *
 * Create workflow or steps
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action ?? 'create';

    switch (action) {
      case 'create': {
        if (!body.name) {
          return NextResponse.json(
            { error: 'Missing required field: name' },
            { status: 400 }
          );
        }

        const workflow = await createWorkflow({
          name: body.name,
          description: body.description,
          ownerId: body.ownerId,
          isPublic: body.isPublic ?? false,
          workflowType: body.workflowType ?? 'custom',
          targetConfig: body.targetConfig,
          inputSchema: body.inputSchema,
          outputSchema: body.outputSchema,
          executionConfig: body.executionConfig,
          scheduleConfig: body.scheduleConfig,
          defaultAgentId: body.defaultAgentId,
          status: body.status ?? 'draft',
          tags: body.tags ?? [],
        });

        return NextResponse.json({ workflow }, { status: 201 });
      }

      case 'from-template': {
        if (!body.templateId) {
          return NextResponse.json(
            { error: 'Missing required field: templateId' },
            { status: 400 }
          );
        }

        const result = await createWorkflowFromTemplate(body.templateId, {
          name: body.name,
          ownerId: body.ownerId,
          targetConfig: body.targetConfig,
        });

        return NextResponse.json(result, { status: 201 });
      }

      case 'add-step': {
        if (!body.workflowId || !body.stepType || !body.name) {
          return NextResponse.json(
            { error: 'Missing required fields: workflowId, stepType, name' },
            { status: 400 }
          );
        }

        const step = await createStep({
          workflowId: body.workflowId,
          name: body.name,
          description: body.description,
          stepType: body.stepType,
          config: body.config,
          errorConfig: body.errorConfig,
          sortOrder: body.sortOrder ?? 0,
          parentStepId: body.parentStepId,
          isEnabled: body.isEnabled ?? true,
        });

        return NextResponse.json({ step }, { status: 201 });
      }

      case 'reorder-steps': {
        if (!body.workflowId || !body.stepOrders) {
          return NextResponse.json(
            { error: 'Missing required fields: workflowId, stepOrders' },
            { status: 400 }
          );
        }

        await reorderSteps(body.workflowId, body.stepOrders);
        const steps = await getWorkflowSteps(body.workflowId);

        return NextResponse.json({ steps });
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Valid actions: create, from-template, add-step, reorder-steps` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error creating workflow:', error);
    return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 });
  }
}

/**
 * PATCH /api/cua/workflows
 *
 * Update workflow or step
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const updateType = body.updateType ?? 'workflow';

    switch (updateType) {
      case 'workflow': {
        if (!body.id) {
          return NextResponse.json(
            { error: 'Missing required field: id' },
            { status: 400 }
          );
        }

        const updated = await updateWorkflow(body.id, {
          name: body.name,
          description: body.description,
          isPublic: body.isPublic,
          workflowType: body.workflowType,
          targetConfig: body.targetConfig,
          inputSchema: body.inputSchema,
          outputSchema: body.outputSchema,
          executionConfig: body.executionConfig,
          scheduleConfig: body.scheduleConfig,
          defaultAgentId: body.defaultAgentId,
          status: body.status,
          tags: body.tags,
        });

        if (!updated) {
          return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
        }

        return NextResponse.json({ workflow: updated });
      }

      case 'step': {
        if (!body.id) {
          return NextResponse.json(
            { error: 'Missing required field: id' },
            { status: 400 }
          );
        }

        const updated = await updateStep(body.id, {
          name: body.name,
          description: body.description,
          stepType: body.stepType,
          config: body.config,
          errorConfig: body.errorConfig,
          sortOrder: body.sortOrder,
          parentStepId: body.parentStepId,
          isEnabled: body.isEnabled,
        });

        if (!updated) {
          return NextResponse.json({ error: 'Step not found' }, { status: 404 });
        }

        return NextResponse.json({ step: updated });
      }

      default:
        return NextResponse.json(
          { error: `Invalid updateType: ${updateType}. Valid types: workflow, step` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error updating workflow:', error);
    return NextResponse.json({ error: 'Failed to update workflow' }, { status: 500 });
  }
}

/**
 * DELETE /api/cua/workflows
 *
 * Delete workflow or step
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deleteType = searchParams.get('type') ?? 'workflow';
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }

    switch (deleteType) {
      case 'workflow': {
        const deleted = await deleteWorkflow(id);
        if (!deleted) {
          return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true });
      }

      case 'step': {
        const deleted = await deleteStep(id);
        if (!deleted) {
          return NextResponse.json({ error: 'Step not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: `Invalid type: ${deleteType}. Valid types: workflow, step` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error deleting:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}

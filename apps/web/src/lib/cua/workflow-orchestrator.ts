/**
 * CUA Workflow Orchestrator for Apex Intelligence
 *
 * Manages Computer-Use Agent workflows with:
 * - Step-by-step execution
 * - State management
 * - Error recovery
 * - Audit logging
 *
 * @see pack-cua-001 for CUA architecture
 */

import { db } from '@/db';
import { ethicsGuardLogs } from '@/db/schema/ethics';

// ============================================================================
// TYPES
// ============================================================================

export type StepType = 'observe' | 'orient' | 'decide' | 'act' | 'validate';

export interface WorkflowStep {
  id: string;
  type: StepType;
  name: string;
  description?: string;
  input?: any;
  output?: any;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
}

export interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  currentStepIndex: number;
  context: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface WorkflowConfig {
  name: string;
  steps: Omit<WorkflowStep, 'id' | 'status' | 'startedAt' | 'completedAt' | 'duration'>[];
  context?: Record<string, any>;
  onStepComplete?: (step: WorkflowStep, workflow: Workflow) => Promise<void>;
  onError?: (error: Error, step: WorkflowStep, workflow: Workflow) => Promise<void>;
}

// ============================================================================
// WORKFLOW MANAGEMENT
// ============================================================================

/**
 * Create a new workflow instance
 */
export function createWorkflow(config: WorkflowConfig): Workflow {
  const workflow: Workflow = {
    id: crypto.randomUUID(),
    name: config.name,
    steps: config.steps.map((step, index) => ({
      ...step,
      id: `${crypto.randomUUID()}-${index}`,
      status: 'pending',
    })),
    status: 'pending',
    currentStepIndex: 0,
    context: config.context || {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return workflow;
}

/**
 * Execute a workflow step
 */
async function executeStep(
  step: WorkflowStep,
  workflow: Workflow,
  handlers: {
    observe?: (input: any, context: Record<string, any>) => Promise<any>;
    orient?: (input: any, context: Record<string, any>) => Promise<any>;
    decide?: (input: any, context: Record<string, any>) => Promise<any>;
    act?: (input: any, context: Record<string, any>) => Promise<any>;
    validate?: (input: any, context: Record<string, any>) => Promise<any>;
  }
): Promise<any> {
  const handler = handlers[step.type];

  if (!handler) {
    // Default handlers for each step type
    switch (step.type) {
      case 'observe':
        return { observed: step.input, timestamp: new Date().toISOString() };
      case 'orient':
        return { analysis: 'Default analysis', context: workflow.context };
      case 'decide':
        return { decision: 'proceed', confidence: 0.8 };
      case 'act':
        return { action: 'completed', result: step.input };
      case 'validate':
        return { valid: true, checks: ['format', 'ethics', 'security'] };
      default:
        return step.input;
    }
  }

  return handler(step.input, workflow.context);
}

/**
 * Execute an entire workflow
 */
export async function executeWorkflow(
  workflow: Workflow,
  handlers?: {
    observe?: (input: any, context: Record<string, any>) => Promise<any>;
    orient?: (input: any, context: Record<string, any>) => Promise<any>;
    decide?: (input: any, context: Record<string, any>) => Promise<any>;
    act?: (input: any, context: Record<string, any>) => Promise<any>;
    validate?: (input: any, context: Record<string, any>) => Promise<any>;
  },
  callbacks?: {
    onStepComplete?: (step: WorkflowStep, workflow: Workflow) => Promise<void>;
    onError?: (error: Error, step: WorkflowStep, workflow: Workflow) => Promise<void>;
  }
): Promise<Workflow> {
  workflow.status = 'running';
  workflow.updatedAt = new Date();

  for (let i = workflow.currentStepIndex; i < workflow.steps.length; i++) {
    const step = workflow.steps[i];
    workflow.currentStepIndex = i;

    step.status = 'running';
    step.startedAt = new Date();

    try {
      // Pass previous step output as input if not specified
      if (!step.input && i > 0) {
        step.input = workflow.steps[i - 1].output;
      }

      // Execute step
      const output = await executeStep(step, workflow, handlers || {});

      step.output = output;
      step.status = 'completed';
      step.completedAt = new Date();
      step.duration = step.completedAt.getTime() - step.startedAt.getTime();

      // Update workflow context with step output
      workflow.context[`step_${i}_output`] = output;
      workflow.updatedAt = new Date();

      // Log for audit
      await logWorkflowStep(workflow, step);

      // Callback
      if (callbacks?.onStepComplete) {
        await callbacks.onStepComplete(step, workflow);
      }
    } catch (error) {
      step.status = 'failed';
      step.error = error instanceof Error ? error.message : 'Unknown error';
      step.completedAt = new Date();
      step.duration = step.completedAt.getTime() - (step.startedAt?.getTime() || 0);

      workflow.status = 'failed';
      workflow.updatedAt = new Date();

      // Log error
      await logWorkflowStep(workflow, step, true);

      if (callbacks?.onError) {
        await callbacks.onError(
          error instanceof Error ? error : new Error('Unknown error'),
          step,
          workflow
        );
      }

      return workflow;
    }
  }

  workflow.status = 'completed';
  workflow.completedAt = new Date();
  workflow.updatedAt = new Date();

  return workflow;
}

/**
 * Log workflow step for audit trail
 */
async function logWorkflowStep(
  workflow: Workflow,
  step: WorkflowStep,
  isError: boolean = false
): Promise<void> {
  try {
    await db.insert(ethicsGuardLogs).values({
      requestType: `workflow_${step.type}`,
      requesterId: workflow.id,
      requesterType: 'system',
      checkConfig: {
        type: 'workflow_step',
        impactScore: isError ? 0.8 : 0.2,
        context: {
          workflowName: workflow.name,
          stepName: step.name,
          stepType: step.type,
        },
      },
      approved: !isError,
      reason: isError ? step.error : `Step completed in ${step.duration}ms`,
      checkDurationMs: step.duration,
    });
  } catch (error) {
    console.error('[Workflow] Failed to log step:', error);
  }
}

// ============================================================================
// OODA LOOP WORKFLOW
// ============================================================================

/**
 * Create an OODA loop workflow (Observe-Orient-Decide-Act)
 */
export function createOODAWorkflow(config: {
  name: string;
  observation: any;
  context?: Record<string, any>;
}): Workflow {
  return createWorkflow({
    name: config.name,
    steps: [
      {
        type: 'observe',
        name: 'Observe',
        description: 'Gather and process raw information',
        input: config.observation,
      },
      {
        type: 'orient',
        name: 'Orient',
        description: 'Analyze and synthesize information',
      },
      {
        type: 'decide',
        name: 'Decide',
        description: 'Make a decision based on analysis',
      },
      {
        type: 'act',
        name: 'Act',
        description: 'Execute the decision',
      },
      {
        type: 'validate',
        name: 'Validate',
        description: 'Verify action results',
      },
    ],
    context: config.context,
  });
}

// ============================================================================
// CODE REVIEW WORKFLOW
// ============================================================================

/**
 * Create a code review workflow
 */
export function createCodeReviewWorkflow(config: {
  code: string;
  prNumber?: number;
  repo?: string;
}): Workflow {
  return createWorkflow({
    name: 'Code Review',
    steps: [
      {
        type: 'observe',
        name: 'Parse Code',
        description: 'Parse and extract code patterns',
        input: { code: config.code, prNumber: config.prNumber },
      },
      {
        type: 'orient',
        name: 'Security Analysis',
        description: 'Scan for security vulnerabilities',
      },
      {
        type: 'orient',
        name: 'Ethics Analysis',
        description: 'Check for ethics compliance',
      },
      {
        type: 'orient',
        name: 'Performance Analysis',
        description: 'Identify performance issues',
      },
      {
        type: 'decide',
        name: 'Generate Recommendations',
        description: 'Compile findings and suggestions',
      },
      {
        type: 'act',
        name: 'Create Report',
        description: 'Generate review report',
      },
      {
        type: 'validate',
        name: 'Verify Report',
        description: 'Ensure report completeness',
      },
    ],
    context: { repo: config.repo },
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  executeStep,
  logWorkflowStep,
};

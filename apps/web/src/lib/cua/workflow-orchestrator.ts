/**
 * Workflow Orchestrator Service
 *
 * Implements pack-cua-001 §2.2 (Workflow Binding Wizard) and §2.5 (Multi-Agent Orchestrator).
 * Manages multi-step automation workflows and agent coordination.
 *
 * Features:
 * - Workflow CRUD and validation
 * - Step sequencing and execution
 * - Conditional logic and loops
 * - Multi-agent coordination
 * - Error handling and recovery
 *
 * @see pack-cua-001 for domain mapping
 */

import { db } from '@/lib/db';
import { eq, and, desc, asc } from 'drizzle-orm';
import {
  automationWorkflows,
  workflowSteps,
  cuaAgents,
  type AutomationWorkflow,
  type NewAutomationWorkflow,
  type WorkflowStep,
  type NewWorkflowStep,
} from '@/db/schema/cua';

// ============================================================================
// TYPES
// ============================================================================

export type WorkflowType = 'scraping' | 'form_fill' | 'testing' | 'monitoring' | 'data_entry' | 'custom';
export type StepType =
  | 'navigate'
  | 'click'
  | 'type'
  | 'scroll'
  | 'wait'
  | 'extract'
  | 'screenshot'
  | 'condition'
  | 'loop'
  | 'call_api'
  | 'run_script'
  | 'human_review'
  | 'sub_workflow';

export interface StepConfig {
  // Navigation
  url?: string;

  // Click/Type
  selector?: string;
  selectorType?: 'css' | 'xpath' | 'text' | 'ai';
  text?: string;
  clickType?: 'single' | 'double' | 'right';

  // Scroll
  scrollDirection?: 'up' | 'down' | 'left' | 'right';
  scrollAmount?: number;

  // Wait
  waitType?: 'time' | 'element' | 'condition';
  waitMs?: number;
  waitSelector?: string;
  waitCondition?: string;

  // Extract
  extractType?: 'text' | 'attribute' | 'html' | 'screenshot';
  extractSelector?: string;
  extractAttribute?: string;
  extractVariableName?: string;

  // Condition
  condition?: string;
  trueStepId?: string;
  falseStepId?: string;

  // Loop
  loopType?: 'count' | 'while' | 'forEach';
  loopCount?: number;
  loopCondition?: string;
  loopVariable?: string;
  loopArray?: string;

  // API call
  apiUrl?: string;
  apiMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  apiHeaders?: Record<string, string>;
  apiBody?: unknown;

  // Script
  script?: string;
  scriptLanguage?: 'javascript' | 'python';

  // Sub-workflow
  subWorkflowId?: string;
}

export interface WorkflowValidationResult {
  valid: boolean;
  errors: Array<{
    stepId?: string;
    field: string;
    message: string;
  }>;
  warnings: Array<{
    stepId?: string;
    field: string;
    message: string;
  }>;
}

// ============================================================================
// WORKFLOW TEMPLATES
// ============================================================================

/**
 * Pre-built workflow templates
 */
export const WORKFLOW_TEMPLATES: Record<string, {
  workflow: Partial<NewAutomationWorkflow>;
  steps: Partial<NewWorkflowStep>[];
}> = {
  tcg_price_scraper: {
    workflow: {
      name: 'TCG Price Scraper',
      description: 'Scrape trading card prices from marketplace',
      workflowType: 'scraping',
      targetConfig: {
        targetType: 'url',
        targetUrl: '',
      },
      inputSchema: {
        fields: [
          { name: 'cardName', type: 'string', required: true, description: 'Card name to search' },
          { name: 'setName', type: 'string', required: false, description: 'Set name filter' },
        ],
      },
      outputSchema: {
        fields: [
          { name: 'prices', type: 'array', description: 'List of prices found' },
          { name: 'source', type: 'string', description: 'Source website' },
        ],
      },
      executionConfig: {
        maxDuration: 120,
        maxSteps: 50,
        parallelExecution: false,
        retryPolicy: { maxRetries: 3, backoffMs: 2000, retryableErrors: ['timeout', 'network'] },
        errorHandling: 'retry',
      },
    },
    steps: [
      { stepType: 'navigate', name: 'Go to marketplace', config: { url: '{{targetUrl}}' }, sortOrder: 0 },
      { stepType: 'type', name: 'Search card', config: { selector: 'input[name="search"]', text: '{{cardName}}' }, sortOrder: 1 },
      { stepType: 'click', name: 'Submit search', config: { selector: 'button[type="submit"]' }, sortOrder: 2 },
      { stepType: 'wait', name: 'Wait for results', config: { waitType: 'element', waitSelector: '.results' }, sortOrder: 3 },
      { stepType: 'extract', name: 'Extract prices', config: { extractType: 'text', extractSelector: '.price', extractVariableName: 'prices' }, sortOrder: 4 },
      { stepType: 'screenshot', name: 'Capture results', config: {}, sortOrder: 5 },
    ],
  },
  form_automation: {
    workflow: {
      name: 'Form Automation',
      description: 'Fill out web forms automatically',
      workflowType: 'form_fill',
      targetConfig: {
        targetType: 'url',
      },
      inputSchema: {
        fields: [
          { name: 'formData', type: 'object', required: true, description: 'Form field values' },
        ],
      },
      outputSchema: {
        fields: [
          { name: 'submitted', type: 'boolean', description: 'Whether form was submitted' },
          { name: 'confirmation', type: 'string', description: 'Confirmation message' },
        ],
      },
      executionConfig: {
        maxDuration: 60,
        maxSteps: 30,
        parallelExecution: false,
        retryPolicy: { maxRetries: 2, backoffMs: 1000, retryableErrors: ['timeout'] },
        errorHandling: 'stop',
      },
    },
    steps: [
      { stepType: 'navigate', name: 'Go to form', config: { url: '{{targetUrl}}' }, sortOrder: 0 },
      { stepType: 'loop', name: 'Fill fields', config: { loopType: 'forEach', loopArray: 'formData' }, sortOrder: 1 },
      { stepType: 'type', name: 'Enter value', config: { selector: '{{item.selector}}', text: '{{item.value}}' }, sortOrder: 2, parentStepId: '{{loopStepId}}' },
      { stepType: 'click', name: 'Submit form', config: { selector: 'button[type="submit"]' }, sortOrder: 3 },
      { stepType: 'wait', name: 'Wait for confirmation', config: { waitType: 'element', waitSelector: '.confirmation' }, sortOrder: 4 },
      { stepType: 'extract', name: 'Get confirmation', config: { extractType: 'text', extractSelector: '.confirmation', extractVariableName: 'confirmation' }, sortOrder: 5 },
    ],
  },
  ui_test: {
    workflow: {
      name: 'UI Test Suite',
      description: 'Automated UI testing workflow',
      workflowType: 'testing',
      targetConfig: {
        targetType: 'url',
      },
      inputSchema: {
        fields: [
          { name: 'testCases', type: 'array', required: true, description: 'Test case definitions' },
        ],
      },
      outputSchema: {
        fields: [
          { name: 'passed', type: 'number', description: 'Passed test count' },
          { name: 'failed', type: 'number', description: 'Failed test count' },
          { name: 'results', type: 'array', description: 'Individual test results' },
        ],
      },
      executionConfig: {
        maxDuration: 300,
        maxSteps: 100,
        parallelExecution: false,
        retryPolicy: { maxRetries: 1, backoffMs: 500, retryableErrors: [] },
        errorHandling: 'skip',
      },
    },
    steps: [
      { stepType: 'navigate', name: 'Go to app', config: { url: '{{targetUrl}}' }, sortOrder: 0 },
      { stepType: 'screenshot', name: 'Initial state', config: {}, sortOrder: 1 },
      { stepType: 'loop', name: 'Run test cases', config: { loopType: 'forEach', loopArray: 'testCases' }, sortOrder: 2 },
    ],
  },
};

// ============================================================================
// WORKFLOW MANAGEMENT
// ============================================================================

/**
 * Create a new workflow
 */
export async function createWorkflow(data: NewAutomationWorkflow): Promise<AutomationWorkflow> {
  const [workflow] = await db
    .insert(automationWorkflows)
    .values(data)
    .returning()
    .execute();

  return workflow;
}

/**
 * Create workflow from template
 */
export async function createWorkflowFromTemplate(
  templateId: string,
  overrides?: Partial<NewAutomationWorkflow>
): Promise<{ workflow: AutomationWorkflow; steps: WorkflowStep[] }> {
  const template = WORKFLOW_TEMPLATES[templateId];
  if (!template) {
    throw new Error(`Unknown workflow template: ${templateId}`);
  }

  // Create workflow
  const workflow = await createWorkflow({
    ...template.workflow,
    ...overrides,
    name: overrides?.name ?? template.workflow.name ?? 'Unnamed Workflow',
  });

  // Create steps
  const steps = await Promise.all(
    template.steps.map((step) =>
      createStep({
        ...step,
        workflowId: workflow.id,
        name: step.name ?? 'Unnamed Step',
        stepType: step.stepType ?? 'wait',
      })
    )
  );

  return { workflow, steps };
}

/**
 * Get workflow by ID
 */
export async function getWorkflow(id: string): Promise<AutomationWorkflow | null> {
  const [workflow] = await db
    .select()
    .from(automationWorkflows)
    .where(eq(automationWorkflows.id, id))
    .limit(1)
    .execute();

  return workflow ?? null;
}

/**
 * Get workflow with steps
 */
export async function getWorkflowWithSteps(
  id: string
): Promise<{ workflow: AutomationWorkflow; steps: WorkflowStep[] } | null> {
  const workflow = await getWorkflow(id);
  if (!workflow) return null;

  const steps = await getWorkflowSteps(id);

  return { workflow, steps };
}

/**
 * Get workflows for a user
 */
export async function getUserWorkflows(userId: string): Promise<AutomationWorkflow[]> {
  return db
    .select()
    .from(automationWorkflows)
    .where(eq(automationWorkflows.ownerId, userId))
    .orderBy(desc(automationWorkflows.createdAt))
    .execute();
}

/**
 * Update workflow
 */
export async function updateWorkflow(
  id: string,
  updates: Partial<NewAutomationWorkflow>
): Promise<AutomationWorkflow | null> {
  const [updated] = await db
    .update(automationWorkflows)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(automationWorkflows.id, id))
    .returning()
    .execute();

  return updated ?? null;
}

/**
 * Delete workflow
 */
export async function deleteWorkflow(id: string): Promise<boolean> {
  const [deleted] = await db
    .delete(automationWorkflows)
    .where(eq(automationWorkflows.id, id))
    .returning()
    .execute();

  return !!deleted;
}

// ============================================================================
// STEP MANAGEMENT
// ============================================================================

/**
 * Create a workflow step
 */
export async function createStep(data: NewWorkflowStep): Promise<WorkflowStep> {
  const [step] = await db.insert(workflowSteps).values(data).returning().execute();

  return step;
}

/**
 * Get steps for a workflow
 */
export async function getWorkflowSteps(workflowId: string): Promise<WorkflowStep[]> {
  return db
    .select()
    .from(workflowSteps)
    .where(eq(workflowSteps.workflowId, workflowId))
    .orderBy(asc(workflowSteps.sortOrder))
    .execute();
}

/**
 * Update a step
 */
export async function updateStep(
  id: string,
  updates: Partial<NewWorkflowStep>
): Promise<WorkflowStep | null> {
  const [updated] = await db
    .update(workflowSteps)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(workflowSteps.id, id))
    .returning()
    .execute();

  return updated ?? null;
}

/**
 * Delete a step
 */
export async function deleteStep(id: string): Promise<boolean> {
  const [deleted] = await db
    .delete(workflowSteps)
    .where(eq(workflowSteps.id, id))
    .returning()
    .execute();

  return !!deleted;
}

/**
 * Reorder steps
 */
export async function reorderSteps(
  workflowId: string,
  stepOrders: Array<{ id: string; sortOrder: number }>
): Promise<void> {
  await Promise.all(
    stepOrders.map(({ id, sortOrder }) =>
      db
        .update(workflowSteps)
        .set({ sortOrder, updatedAt: new Date() })
        .where(and(eq(workflowSteps.id, id), eq(workflowSteps.workflowId, workflowId)))
        .execute()
    )
  );
}

// ============================================================================
// WORKFLOW VALIDATION
// ============================================================================

/**
 * Validate a workflow and its steps
 */
export async function validateWorkflow(workflowId: string): Promise<WorkflowValidationResult> {
  const result: WorkflowValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  const workflow = await getWorkflow(workflowId);
  if (!workflow) {
    result.valid = false;
    result.errors.push({ field: 'workflow', message: 'Workflow not found' });
    return result;
  }

  // Validate workflow fields
  if (!workflow.name || workflow.name.trim() === '') {
    result.valid = false;
    result.errors.push({ field: 'name', message: 'Workflow name is required' });
  }

  if (!workflow.targetConfig) {
    result.warnings.push({ field: 'targetConfig', message: 'No target configuration specified' });
  }

  // Validate steps
  const steps = await getWorkflowSteps(workflowId);

  if (steps.length === 0) {
    result.warnings.push({ field: 'steps', message: 'Workflow has no steps' });
  }

  for (const step of steps) {
    const stepErrors = validateStep(step);
    for (const error of stepErrors) {
      result.valid = false;
      result.errors.push({ stepId: step.id, ...error });
    }
  }

  // Validate step references (conditions, loops)
  const stepIds = new Set(steps.map((s) => s.id));
  for (const step of steps) {
    const config = step.config as StepConfig | null;

    if (step.stepType === 'condition' && config) {
      if (config.trueStepId && !stepIds.has(config.trueStepId)) {
        result.valid = false;
        result.errors.push({
          stepId: step.id,
          field: 'trueStepId',
          message: 'Referenced step not found',
        });
      }
      if (config.falseStepId && !stepIds.has(config.falseStepId)) {
        result.valid = false;
        result.errors.push({
          stepId: step.id,
          field: 'falseStepId',
          message: 'Referenced step not found',
        });
      }
    }

    if (step.stepType === 'sub_workflow' && config?.subWorkflowId) {
      const subWorkflow = await getWorkflow(config.subWorkflowId);
      if (!subWorkflow) {
        result.valid = false;
        result.errors.push({
          stepId: step.id,
          field: 'subWorkflowId',
          message: 'Referenced sub-workflow not found',
        });
      }
    }
  }

  return result;
}

/**
 * Validate a single step
 */
function validateStep(step: WorkflowStep): Array<{ field: string; message: string }> {
  const errors: Array<{ field: string; message: string }> = [];
  const config = step.config as StepConfig | null;

  if (!step.name || step.name.trim() === '') {
    errors.push({ field: 'name', message: 'Step name is required' });
  }

  // Type-specific validation
  switch (step.stepType) {
    case 'navigate':
      if (!config?.url) {
        errors.push({ field: 'url', message: 'URL is required for navigate step' });
      }
      break;

    case 'click':
    case 'type':
      if (!config?.selector && config?.selectorType !== 'ai') {
        errors.push({ field: 'selector', message: 'Selector is required' });
      }
      if (step.stepType === 'type' && !config?.text) {
        errors.push({ field: 'text', message: 'Text is required for type step' });
      }
      break;

    case 'wait':
      if (config?.waitType === 'time' && !config.waitMs) {
        errors.push({ field: 'waitMs', message: 'Wait time is required' });
      }
      if (config?.waitType === 'element' && !config.waitSelector) {
        errors.push({ field: 'waitSelector', message: 'Wait selector is required' });
      }
      if (config?.waitType === 'condition' && !config.waitCondition) {
        errors.push({ field: 'waitCondition', message: 'Wait condition is required' });
      }
      break;

    case 'extract':
      if (!config?.extractSelector) {
        errors.push({ field: 'extractSelector', message: 'Extract selector is required' });
      }
      if (!config?.extractVariableName) {
        errors.push({ field: 'extractVariableName', message: 'Variable name is required' });
      }
      break;

    case 'condition':
      if (!config?.condition) {
        errors.push({ field: 'condition', message: 'Condition expression is required' });
      }
      break;

    case 'loop':
      if (config?.loopType === 'count' && !config.loopCount) {
        errors.push({ field: 'loopCount', message: 'Loop count is required' });
      }
      if (config?.loopType === 'while' && !config.loopCondition) {
        errors.push({ field: 'loopCondition', message: 'Loop condition is required' });
      }
      if (config?.loopType === 'forEach' && !config.loopArray) {
        errors.push({ field: 'loopArray', message: 'Loop array is required' });
      }
      break;

    case 'call_api':
      if (!config?.apiUrl) {
        errors.push({ field: 'apiUrl', message: 'API URL is required' });
      }
      break;

    case 'run_script':
      if (!config?.script) {
        errors.push({ field: 'script', message: 'Script is required' });
      }
      break;

    case 'sub_workflow':
      if (!config?.subWorkflowId) {
        errors.push({ field: 'subWorkflowId', message: 'Sub-workflow ID is required' });
      }
      break;
  }

  return errors;
}

// ============================================================================
// MULTI-AGENT COORDINATION
// ============================================================================

/**
 * Agent role in multi-agent workflow
 */
export interface AgentRole {
  agentId: string;
  role: string;
  responsibilities: string[];
  inputFrom?: string[]; // Other agent IDs
  outputTo?: string[]; // Other agent IDs
}

/**
 * Multi-agent workflow configuration
 */
export interface MultiAgentConfig {
  coordinationType: 'sequential' | 'parallel' | 'pipeline';
  agents: AgentRole[];
  communicationProtocol: 'event_bus' | 'direct' | 'shared_state';
  fallbackStrategy: 'stop' | 'skip_agent' | 'retry';
}

/**
 * Create multi-agent workflow
 */
export async function createMultiAgentWorkflow(
  name: string,
  config: MultiAgentConfig,
  ownerId?: string
): Promise<AutomationWorkflow> {
  // Validate all agents exist
  for (const agentRole of config.agents) {
    const agent = await db
      .select()
      .from(cuaAgents)
      .where(eq(cuaAgents.id, agentRole.agentId))
      .limit(1)
      .execute();

    if (!agent || agent.length === 0) {
      throw new Error(`Agent not found: ${agentRole.agentId}`);
    }
  }

  return createWorkflow({
    name,
    description: `Multi-agent workflow with ${config.agents.length} agents`,
    ownerId,
    workflowType: 'custom',
    executionConfig: {
      maxDuration: 600,
      maxSteps: 200,
      parallelExecution: config.coordinationType === 'parallel',
      retryPolicy: {
        maxRetries: 2,
        backoffMs: 2000,
        retryableErrors: ['timeout', 'agent_unavailable'],
      },
      errorHandling: config.fallbackStrategy === 'stop' ? 'stop' : 'skip',
    },
  });
}

/**
 * Get available workflow templates
 */
export function getWorkflowTemplates(): Array<{
  id: string;
  name: string;
  description: string;
  type: string;
}> {
  return Object.entries(WORKFLOW_TEMPLATES).map(([id, template]) => ({
    id,
    name: template.workflow.name ?? 'Unnamed',
    description: template.workflow.description ?? '',
    type: template.workflow.workflowType ?? 'custom',
  }));
}

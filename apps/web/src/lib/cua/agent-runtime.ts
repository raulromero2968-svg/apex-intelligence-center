/**
 * Agent Runtime Service
 *
 * Implements pack-cua-001 §2.1 (Agent Preview Panel) and §3.2 (Automation Intent Tool).
 * Core runtime for executing computer-using agents.
 *
 * Features:
 * - Agent lifecycle management
 * - Action execution (click, type, navigate, etc.)
 * - Observation handling (screenshots, DOM)
 * - Error recovery and retries
 *
 * @see pack-cua-001 for domain mapping
 */

import { db } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';
import {
  cuaAgents,
  agentExecutions,
  executionActions,
  type CuaAgent,
  type NewCuaAgent,
  type AgentExecution,
  type NewAgentExecution,
  type ExecutionAction,
  type NewExecutionAction,
} from '@/db/schema/cua';

// ============================================================================
// TYPES
// ============================================================================

export type AgentType = 'cloud' | 'local' | 'hybrid';
export type ModelProvider = 'openai' | 'anthropic' | 'huggingface' | 'local' | 'custom';
export type ExecutionStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
export type ActionType =
  | 'observe'
  | 'navigate'
  | 'click'
  | 'type'
  | 'scroll'
  | 'wait'
  | 'extract'
  | 'screenshot'
  | 'api_call'
  | 'script'
  | 'decision'
  | 'error';

export interface AgentCapabilities {
  canObserveScreen: boolean;
  canClickElements: boolean;
  canTypeText: boolean;
  canScrollPage: boolean;
  canNavigate: boolean;
  canExtractData: boolean;
  canTakeScreenshots: boolean;
  canExecuteScripts: boolean;
  supportedPlatforms: ('web' | 'desktop' | 'mobile')[];
}

export interface RuntimeConfig {
  screenshotInterval: number;
  screenshotQuality: 'low' | 'medium' | 'high';
  observationMode: 'screenshot' | 'dom' | 'hybrid';
  actionDelay: number;
  retryAttempts: number;
  retryDelay: number;
  timeoutMs: number;
  allowNavigation: boolean;
  allowedDomains?: string[];
  blockedDomains?: string[];
  sandboxMode: boolean;
}

export interface AgentAction {
  type: ActionType;
  target?: string;
  value?: unknown;
  coordinates?: { x: number; y: number };
  waitMs?: number;
}

export interface AgentObservation {
  screenshot?: string; // Base64 or URL
  dom?: string; // Simplified DOM
  url?: string;
  title?: string;
  timestamp: number;
}

export interface AIReasoning {
  observation: string;
  thought: string;
  actionChosen: string;
  confidence: number;
}

export interface ExecutionContext {
  currentUrl?: string;
  variables: Record<string, unknown>;
  cookies?: Array<{ name: string; value: string; domain: string }>;
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

/**
 * Default agent capabilities
 */
export const DEFAULT_CAPABILITIES: AgentCapabilities = {
  canObserveScreen: true,
  canClickElements: true,
  canTypeText: true,
  canScrollPage: true,
  canNavigate: true,
  canExtractData: true,
  canTakeScreenshots: true,
  canExecuteScripts: false, // Disabled by default for safety
  supportedPlatforms: ['web'],
};

/**
 * Default runtime configuration
 */
export const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
  screenshotInterval: 1000, // 1 second
  screenshotQuality: 'medium',
  observationMode: 'screenshot',
  actionDelay: 500, // 500ms between actions
  retryAttempts: 3,
  retryDelay: 1000,
  timeoutMs: 300000, // 5 minutes
  allowNavigation: true,
  sandboxMode: true,
};

/**
 * Agent templates for quick setup
 */
export const AGENT_TEMPLATES: Record<string, Partial<NewCuaAgent>> = {
  scraper: {
    name: 'Web Scraper Agent',
    description: 'Extracts data from web pages',
    agentType: 'cloud',
    modelProvider: 'anthropic',
    capabilities: {
      ...DEFAULT_CAPABILITIES,
      canExecuteScripts: false,
    },
    runtimeConfig: {
      ...DEFAULT_RUNTIME_CONFIG,
      observationMode: 'hybrid',
    },
  },
  form_filler: {
    name: 'Form Automation Agent',
    description: 'Fills out web forms automatically',
    agentType: 'cloud',
    modelProvider: 'anthropic',
    capabilities: DEFAULT_CAPABILITIES,
    runtimeConfig: DEFAULT_RUNTIME_CONFIG,
  },
  tester: {
    name: 'UI Testing Agent',
    description: 'Automated UI testing and validation',
    agentType: 'cloud',
    modelProvider: 'anthropic',
    capabilities: {
      ...DEFAULT_CAPABILITIES,
      canTakeScreenshots: true,
    },
    runtimeConfig: {
      ...DEFAULT_RUNTIME_CONFIG,
      screenshotInterval: 500,
    },
  },
  local_private: {
    name: 'Local Privacy Agent',
    description: 'Privacy-preserving local automation',
    agentType: 'local',
    modelProvider: 'huggingface',
    modelId: 'fara-7b',
    capabilities: DEFAULT_CAPABILITIES,
    runtimeConfig: {
      ...DEFAULT_RUNTIME_CONFIG,
      sandboxMode: true,
    },
    privacyConfig: {
      dataRetention: 'none',
      encryptScreenshots: true,
      anonymizeData: true,
      localProcessingOnly: true,
    },
  },
};

// ============================================================================
// AGENT MANAGEMENT
// ============================================================================

/**
 * Create a new CUA agent
 */
export async function createAgent(data: NewCuaAgent): Promise<CuaAgent> {
  const fullData: NewCuaAgent = {
    ...data,
    capabilities: data.capabilities ?? DEFAULT_CAPABILITIES,
    runtimeConfig: data.runtimeConfig ?? DEFAULT_RUNTIME_CONFIG,
    performanceMetrics: {
      totalExecutions: 0,
      successRate: 0,
      avgExecutionTime: 0,
      avgActionsPerTask: 0,
      lastUpdated: new Date().toISOString(),
    },
  };

  const [agent] = await db.insert(cuaAgents).values(fullData).returning().execute();

  return agent;
}

/**
 * Create agent from template
 */
export async function createAgentFromTemplate(
  templateId: string,
  overrides?: Partial<NewCuaAgent>
): Promise<CuaAgent> {
  const template = AGENT_TEMPLATES[templateId];
  if (!template) {
    throw new Error(`Unknown agent template: ${templateId}`);
  }

  return createAgent({
    ...template,
    ...overrides,
    name: overrides?.name ?? template.name ?? 'Unnamed Agent',
  });
}

/**
 * Get agent by ID
 */
export async function getAgent(id: string): Promise<CuaAgent | null> {
  const [agent] = await db.select().from(cuaAgents).where(eq(cuaAgents.id, id)).limit(1).execute();

  return agent ?? null;
}

/**
 * Get agents for a user
 */
export async function getUserAgents(userId: string): Promise<CuaAgent[]> {
  return db
    .select()
    .from(cuaAgents)
    .where(eq(cuaAgents.ownerId, userId))
    .orderBy(desc(cuaAgents.createdAt))
    .execute();
}

/**
 * Update agent
 */
export async function updateAgent(
  id: string,
  updates: Partial<NewCuaAgent>
): Promise<CuaAgent | null> {
  const [updated] = await db
    .update(cuaAgents)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(cuaAgents.id, id))
    .returning()
    .execute();

  return updated ?? null;
}

/**
 * Delete agent
 */
export async function deleteAgent(id: string): Promise<boolean> {
  const [deleted] = await db.delete(cuaAgents).where(eq(cuaAgents.id, id)).returning().execute();

  return !!deleted;
}

// ============================================================================
// EXECUTION MANAGEMENT
// ============================================================================

/**
 * Start a new execution
 */
export async function startExecution(
  workflowId: string,
  agentId: string,
  options: {
    userId?: string;
    inputData?: Record<string, unknown>;
    triggerType?: 'manual' | 'scheduled' | 'api' | 'webhook' | 'event';
    triggerData?: Record<string, unknown>;
  } = {}
): Promise<AgentExecution> {
  const [execution] = await db
    .insert(agentExecutions)
    .values({
      workflowId,
      agentId,
      userId: options.userId,
      status: 'pending',
      inputData: options.inputData,
      triggerType: options.triggerType ?? 'manual',
      triggerData: options.triggerData,
      context: { variables: {} },
      metrics: {
        totalActions: 0,
        successfulActions: 0,
        failedActions: 0,
        avgActionTimeMs: 0,
        screenshotsTaken: 0,
        dataExtracted: 0,
      },
    })
    .returning()
    .execute();

  return execution;
}

/**
 * Update execution status
 */
export async function updateExecutionStatus(
  executionId: string,
  status: ExecutionStatus,
  updates?: Partial<NewAgentExecution>
): Promise<AgentExecution | null> {
  const [updated] = await db
    .update(agentExecutions)
    .set({
      status,
      ...updates,
      updatedAt: new Date(),
      ...(status === 'running' && !updates?.startedAt ? { startedAt: new Date() } : {}),
      ...(status === 'completed' || status === 'failed' || status === 'cancelled'
        ? { completedAt: new Date() }
        : {}),
    })
    .where(eq(agentExecutions.id, executionId))
    .returning()
    .execute();

  return updated ?? null;
}

/**
 * Get execution by ID
 */
export async function getExecution(id: string): Promise<AgentExecution | null> {
  const [execution] = await db
    .select()
    .from(agentExecutions)
    .where(eq(agentExecutions.id, id))
    .limit(1)
    .execute();

  return execution ?? null;
}

/**
 * Get recent executions
 */
export async function getRecentExecutions(
  options: {
    workflowId?: string;
    agentId?: string;
    userId?: string;
    status?: ExecutionStatus;
    limit?: number;
  } = {}
): Promise<AgentExecution[]> {
  const conditions = [];

  if (options.workflowId) {
    conditions.push(eq(agentExecutions.workflowId, options.workflowId));
  }
  if (options.agentId) {
    conditions.push(eq(agentExecutions.agentId, options.agentId));
  }
  if (options.userId) {
    conditions.push(eq(agentExecutions.userId, options.userId));
  }
  if (options.status) {
    conditions.push(eq(agentExecutions.status, options.status));
  }

  return db
    .select()
    .from(agentExecutions)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(agentExecutions.createdAt))
    .limit(options.limit ?? 50)
    .execute();
}

// ============================================================================
// ACTION LOGGING
// ============================================================================

/**
 * Log an action within an execution
 */
export async function logAction(
  executionId: string,
  action: {
    stepId?: string;
    actionType: ActionType;
    actionData?: {
      target?: string;
      value?: unknown;
      coordinates?: { x: number; y: number };
      screenshot?: string;
    };
    status: 'success' | 'failure' | 'skipped';
    result?: {
      success: boolean;
      data?: unknown;
      error?: string;
    };
    aiReasoning?: AIReasoning;
    durationMs?: number;
    sequenceNumber: number;
  }
): Promise<ExecutionAction> {
  const [logged] = await db
    .insert(executionActions)
    .values({
      executionId,
      stepId: action.stepId,
      actionType: action.actionType,
      actionData: action.actionData,
      status: action.status,
      result: action.result,
      aiReasoning: action.aiReasoning,
      startedAt: new Date(Date.now() - (action.durationMs ?? 0)),
      completedAt: new Date(),
      durationMs: action.durationMs,
      sequenceNumber: action.sequenceNumber,
    })
    .returning()
    .execute();

  return logged;
}

/**
 * Get actions for an execution
 */
export async function getExecutionActions(executionId: string): Promise<ExecutionAction[]> {
  return db
    .select()
    .from(executionActions)
    .where(eq(executionActions.executionId, executionId))
    .orderBy(executionActions.sequenceNumber)
    .execute();
}

// ============================================================================
// ACTION EXECUTION (SIMULATED)
// ============================================================================

/**
 * Execute an action (simulated for web environment)
 * In production, this would integrate with browser automation tools
 */
export async function executeAction(
  action: AgentAction,
  context: ExecutionContext,
  config: RuntimeConfig
): Promise<{
  success: boolean;
  result?: unknown;
  error?: string;
  durationMs: number;
}> {
  const startTime = Date.now();

  // Simulated action execution
  // In production, integrate with Puppeteer, Playwright, or Skyvern
  await new Promise((resolve) => setTimeout(resolve, config.actionDelay));

  try {
    switch (action.type) {
      case 'navigate':
        // Simulate navigation
        return {
          success: true,
          result: { url: action.target },
          durationMs: Date.now() - startTime,
        };

      case 'click':
        // Simulate click
        return {
          success: true,
          result: { clicked: action.target },
          durationMs: Date.now() - startTime,
        };

      case 'type':
        // Simulate typing
        return {
          success: true,
          result: { typed: action.value },
          durationMs: Date.now() - startTime,
        };

      case 'scroll':
        // Simulate scroll
        return {
          success: true,
          result: { scrolled: action.value },
          durationMs: Date.now() - startTime,
        };

      case 'wait':
        // Wait for specified time
        await new Promise((resolve) => setTimeout(resolve, action.waitMs ?? 1000));
        return {
          success: true,
          result: { waited: action.waitMs },
          durationMs: Date.now() - startTime,
        };

      case 'extract':
        // Simulate data extraction
        return {
          success: true,
          result: { extracted: 'simulated data' },
          durationMs: Date.now() - startTime,
        };

      case 'screenshot':
        // Simulate screenshot
        return {
          success: true,
          result: { screenshot: 'simulated_screenshot_base64' },
          durationMs: Date.now() - startTime,
        };

      default:
        return {
          success: false,
          error: `Unknown action type: ${action.type}`,
          durationMs: Date.now() - startTime,
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Validate action against safety policies
 */
export function validateAction(
  action: AgentAction,
  config: RuntimeConfig
): { valid: boolean; reason?: string } {
  // Check navigation restrictions
  if (action.type === 'navigate' && action.target) {
    if (!config.allowNavigation) {
      return { valid: false, reason: 'Navigation is disabled' };
    }

    try {
      const url = new URL(action.target);

      // Check blocked domains
      if (config.blockedDomains?.some((d) => url.hostname.includes(d))) {
        return { valid: false, reason: `Domain ${url.hostname} is blocked` };
      }

      // Check allowed domains
      if (
        config.allowedDomains &&
        config.allowedDomains.length > 0 &&
        !config.allowedDomains.some((d) => url.hostname.includes(d))
      ) {
        return { valid: false, reason: `Domain ${url.hostname} is not in allowed list` };
      }
    } catch {
      return { valid: false, reason: 'Invalid URL' };
    }
  }

  return { valid: true };
}

// ============================================================================
// INTENT MAPPING
// ============================================================================

/**
 * Map user goal to agent actions
 * Implements pack-cua-001 §3.2 (Automation Intent Tool)
 */
export function mapGoalToActions(
  goal: string,
  context: {
    targetUrl?: string;
    currentPage?: string;
    availableElements?: string[];
  }
): AgentAction[] {
  // Simple pattern matching for common goals
  // In production, use LLM for intelligent mapping
  const goalLower = goal.toLowerCase();
  const actions: AgentAction[] = [];

  if (goalLower.includes('navigate') || goalLower.includes('go to')) {
    // Extract URL from goal
    const urlMatch = goal.match(/https?:\/\/[^\s]+/);
    if (urlMatch || context.targetUrl) {
      actions.push({
        type: 'navigate',
        target: urlMatch?.[0] ?? context.targetUrl,
      });
    }
  }

  if (goalLower.includes('click') || goalLower.includes('press')) {
    // Extract target element
    const targetMatch = goal.match(/click (?:on )?["']?([^"']+)["']?/i);
    if (targetMatch) {
      actions.push({
        type: 'click',
        target: targetMatch[1],
      });
    }
  }

  if (goalLower.includes('type') || goalLower.includes('enter') || goalLower.includes('input')) {
    // Extract text to type
    const textMatch = goal.match(/(?:type|enter|input) ["']([^"']+)["']/i);
    if (textMatch) {
      actions.push({
        type: 'type',
        value: textMatch[1],
      });
    }
  }

  if (goalLower.includes('extract') || goalLower.includes('get') || goalLower.includes('scrape')) {
    actions.push({
      type: 'extract',
      target: context.currentPage,
    });
  }

  if (goalLower.includes('screenshot') || goalLower.includes('capture')) {
    actions.push({
      type: 'screenshot',
    });
  }

  if (goalLower.includes('wait') || goalLower.includes('pause')) {
    const timeMatch = goal.match(/(\d+)\s*(?:seconds?|ms|milliseconds?)/i);
    const waitMs = timeMatch ? parseInt(timeMatch[1], 10) * (goal.includes('ms') ? 1 : 1000) : 2000;
    actions.push({
      type: 'wait',
      waitMs,
    });
  }

  return actions;
}

// ============================================================================
// AGENT METRICS
// ============================================================================

/**
 * Update agent performance metrics after execution
 */
export async function updateAgentMetrics(
  agentId: string,
  executionResult: {
    success: boolean;
    durationMs: number;
    actionsCount: number;
  }
): Promise<void> {
  const agent = await getAgent(agentId);
  if (!agent) return;

  const currentMetrics = (agent.performanceMetrics as {
    totalExecutions: number;
    successRate: number;
    avgExecutionTime: number;
    avgActionsPerTask: number;
  }) ?? {
    totalExecutions: 0,
    successRate: 0,
    avgExecutionTime: 0,
    avgActionsPerTask: 0,
  };

  const newTotal = currentMetrics.totalExecutions + 1;
  const successCount =
    Math.round(currentMetrics.successRate * currentMetrics.totalExecutions) +
    (executionResult.success ? 1 : 0);

  const newMetrics = {
    totalExecutions: newTotal,
    successRate: successCount / newTotal,
    avgExecutionTime:
      (currentMetrics.avgExecutionTime * currentMetrics.totalExecutions +
        executionResult.durationMs) /
      newTotal,
    avgActionsPerTask:
      (currentMetrics.avgActionsPerTask * currentMetrics.totalExecutions +
        executionResult.actionsCount) /
      newTotal,
    lastUpdated: new Date().toISOString(),
  };

  await updateAgent(agentId, { performanceMetrics: newMetrics });
}

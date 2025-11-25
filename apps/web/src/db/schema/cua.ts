/**
 * Computer-Using Agents (CUA) Database Schema
 *
 * Implements pack-cua-001 architecture for agentic GUI automation.
 * Supports agent configurations, workflows, executions, RL training, and analytics.
 *
 * Tables:
 * - cuaAgents: Agent configurations and capabilities
 * - automationWorkflows: Multi-step automation workflows
 * - workflowSteps: Individual steps within workflows
 * - agentExecutions: Runtime execution logs
 * - executionActions: Individual actions within executions
 * - rlTrainingSessions: Reinforcement learning training sessions
 * - cuaAnalytics: Agent performance analytics
 * - cuaKnowledge: RAG documents for CUA guidance
 *
 * @see pack-cua-001 for domain mapping
 */

import {
  pgTable,
  text,
  boolean,
  jsonb,
  timestamp,
  uuid,
  index,
  real,
  integer,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// CUA AGENTS
// ============================================================================

/**
 * Computer-Using Agent configurations
 *
 * Defines agent capabilities, model backends, and runtime settings.
 * Supports cloud (OpenAI CUA, Claude) and local (Fara-7B) agents.
 */
export const cuaAgents = pgTable(
  'cua_agents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    ownerId: text('owner_id'),
    isPublic: boolean('is_public').default(false).notNull(),

    // Agent type and model
    agentType: text('agent_type', {
      enum: ['cloud', 'local', 'hybrid'],
    })
      .default('cloud')
      .notNull(),
    modelProvider: text('model_provider', {
      enum: ['openai', 'anthropic', 'huggingface', 'local', 'custom'],
    })
      .default('anthropic')
      .notNull(),
    modelId: text('model_id').default('claude-3-sonnet'), // e.g., 'gpt-4-vision', 'fara-7b'

    // Capabilities
    capabilities: jsonb('capabilities').$type<{
      canObserveScreen: boolean;
      canClickElements: boolean;
      canTypeText: boolean;
      canScrollPage: boolean;
      canNavigate: boolean;
      canExtractData: boolean;
      canTakeScreenshots: boolean;
      canExecuteScripts: boolean;
      supportedPlatforms: ('web' | 'desktop' | 'mobile')[];
    }>(),

    // Runtime configuration
    runtimeConfig: jsonb('runtime_config').$type<{
      // Observation settings
      screenshotInterval: number; // ms between observations
      screenshotQuality: 'low' | 'medium' | 'high';
      observationMode: 'screenshot' | 'dom' | 'hybrid';

      // Action settings
      actionDelay: number; // ms between actions
      retryAttempts: number;
      retryDelay: number; // ms
      timeoutMs: number; // max execution time

      // Safety
      allowNavigation: boolean;
      allowedDomains?: string[];
      blockedDomains?: string[];
      sandboxMode: boolean;
    }>(),

    // Privacy settings
    privacyConfig: jsonb('privacy_config').$type<{
      dataRetention: 'none' | 'session' | 'persistent';
      encryptScreenshots: boolean;
      anonymizeData: boolean;
      localProcessingOnly: boolean;
    }>(),

    // Performance metrics (aggregated)
    performanceMetrics: jsonb('performance_metrics').$type<{
      totalExecutions: number;
      successRate: number;
      avgExecutionTime: number;
      avgActionsPerTask: number;
      lastUpdated: string;
    }>(),

    // Status
    status: text('status', {
      enum: ['active', 'inactive', 'training', 'error'],
    })
      .default('active')
      .notNull(),

    // Metadata
    tags: jsonb('tags').$type<string[]>().default([]),
    version: text('version').default('1.0.0'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    ownerIdx: index('idx_cua_agents_owner').on(table.ownerId),
    typeIdx: index('idx_cua_agents_type').on(table.agentType),
    providerIdx: index('idx_cua_agents_provider').on(table.modelProvider),
  })
);

export type CuaAgent = typeof cuaAgents.$inferSelect;
export type NewCuaAgent = typeof cuaAgents.$inferInsert;

// ============================================================================
// AUTOMATION WORKFLOWS
// ============================================================================

/**
 * Multi-step automation workflows
 *
 * Defines sequences of actions for agents to execute.
 * Supports conditional logic, loops, and error handling.
 */
export const automationWorkflows = pgTable(
  'automation_workflows',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    ownerId: text('owner_id'),
    isPublic: boolean('is_public').default(false).notNull(),

    // Workflow type
    workflowType: text('workflow_type', {
      enum: ['scraping', 'form_fill', 'testing', 'monitoring', 'data_entry', 'custom'],
    })
      .default('custom')
      .notNull(),

    // Target configuration
    targetConfig: jsonb('target_config').$type<{
      targetType: 'url' | 'application' | 'api';
      targetUrl?: string;
      applicationName?: string;
      startCondition?: string; // JS expression
    }>(),

    // Input/output schema
    inputSchema: jsonb('input_schema').$type<{
      fields: Array<{
        name: string;
        type: 'string' | 'number' | 'boolean' | 'array' | 'object';
        required: boolean;
        description?: string;
        default?: unknown;
      }>;
    }>(),
    outputSchema: jsonb('output_schema').$type<{
      fields: Array<{
        name: string;
        type: 'string' | 'number' | 'boolean' | 'array' | 'object';
        description?: string;
      }>;
    }>(),

    // Execution settings
    executionConfig: jsonb('execution_config').$type<{
      maxDuration: number; // seconds
      maxSteps: number;
      parallelExecution: boolean;
      retryPolicy: {
        maxRetries: number;
        backoffMs: number;
        retryableErrors: string[];
      };
      errorHandling: 'stop' | 'skip' | 'retry';
    }>(),

    // Schedule (for recurring)
    scheduleConfig: jsonb('schedule_config').$type<{
      enabled: boolean;
      cron?: string; // Cron expression
      timezone?: string;
      nextRunAt?: string;
    }>(),

    // Assigned agent
    defaultAgentId: uuid('default_agent_id').references(() => cuaAgents.id),

    // Status
    status: text('status', {
      enum: ['draft', 'active', 'paused', 'archived'],
    })
      .default('draft')
      .notNull(),

    // Metadata
    tags: jsonb('tags').$type<string[]>().default([]),
    version: text('version').default('1.0.0'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    ownerIdx: index('idx_automation_workflows_owner').on(table.ownerId),
    typeIdx: index('idx_automation_workflows_type').on(table.workflowType),
    statusIdx: index('idx_automation_workflows_status').on(table.status),
  })
);

export type AutomationWorkflow = typeof automationWorkflows.$inferSelect;
export type NewAutomationWorkflow = typeof automationWorkflows.$inferInsert;

// ============================================================================
// WORKFLOW STEPS
// ============================================================================

/**
 * Individual steps within workflows
 *
 * Represents atomic actions or decision points in automation.
 */
export const workflowSteps = pgTable(
  'workflow_steps',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workflowId: uuid('workflow_id')
      .references(() => automationWorkflows.id, { onDelete: 'cascade' })
      .notNull(),
    name: text('name').notNull(),
    description: text('description'),

    // Step type
    stepType: text('step_type', {
      enum: [
        'navigate',
        'click',
        'type',
        'scroll',
        'wait',
        'extract',
        'screenshot',
        'condition',
        'loop',
        'call_api',
        'run_script',
        'human_review',
        'sub_workflow',
      ],
    }).notNull(),

    // Step configuration
    config: jsonb('config').$type<{
      // Navigation
      url?: string;

      // Click/Type
      selector?: string; // CSS/XPath selector
      selectorType?: 'css' | 'xpath' | 'text' | 'ai'; // 'ai' = let agent find element
      text?: string; // For typing
      clickType?: 'single' | 'double' | 'right';

      // Scroll
      scrollDirection?: 'up' | 'down' | 'left' | 'right';
      scrollAmount?: number;

      // Wait
      waitType?: 'time' | 'element' | 'condition';
      waitMs?: number;
      waitSelector?: string;
      waitCondition?: string; // JS expression

      // Extract
      extractType?: 'text' | 'attribute' | 'html' | 'screenshot';
      extractSelector?: string;
      extractAttribute?: string;
      extractVariableName?: string;

      // Condition
      condition?: string; // JS expression
      trueStepId?: string;
      falseStepId?: string;

      // Loop
      loopType?: 'count' | 'while' | 'forEach';
      loopCount?: number;
      loopCondition?: string;
      loopVariable?: string;
      loopArray?: string; // Variable name containing array

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
    }>(),

    // Error handling for this step
    errorConfig: jsonb('error_config').$type<{
      onError: 'stop' | 'skip' | 'retry' | 'goto';
      maxRetries?: number;
      gotoStepId?: string;
      fallbackValue?: unknown;
    }>(),

    // Position in workflow
    sortOrder: integer('sort_order').default(0).notNull(),
    parentStepId: uuid('parent_step_id'), // For nested steps (in loops/conditions)

    // Status
    isEnabled: boolean('is_enabled').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    workflowIdx: index('idx_workflow_steps_workflow').on(table.workflowId),
    typeIdx: index('idx_workflow_steps_type').on(table.stepType),
    orderIdx: index('idx_workflow_steps_order').on(table.workflowId, table.sortOrder),
  })
);

export type WorkflowStep = typeof workflowSteps.$inferSelect;
export type NewWorkflowStep = typeof workflowSteps.$inferInsert;

// ============================================================================
// AGENT EXECUTIONS
// ============================================================================

/**
 * Runtime execution logs for agent workflows
 *
 * Tracks individual execution runs with status, timing, and results.
 */
export const agentExecutions = pgTable(
  'agent_executions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workflowId: uuid('workflow_id')
      .references(() => automationWorkflows.id)
      .notNull(),
    agentId: uuid('agent_id')
      .references(() => cuaAgents.id)
      .notNull(),
    userId: text('user_id'),

    // Execution status
    status: text('status', {
      enum: ['pending', 'running', 'paused', 'completed', 'failed', 'cancelled'],
    })
      .default('pending')
      .notNull(),

    // Timing
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    pausedAt: timestamp('paused_at'),
    durationMs: integer('duration_ms'),

    // Progress
    currentStepId: uuid('current_step_id'),
    completedSteps: integer('completed_steps').default(0),
    totalSteps: integer('total_steps'),
    progressPercent: real('progress_percent').default(0),

    // Input/Output
    inputData: jsonb('input_data').$type<Record<string, unknown>>(),
    outputData: jsonb('output_data').$type<Record<string, unknown>>(),

    // Error info
    errorMessage: text('error_message'),
    errorStepId: uuid('error_step_id'),
    errorDetails: jsonb('error_details').$type<{
      code: string;
      message: string;
      stack?: string;
      screenshot?: string; // Base64 or URL
    }>(),

    // Performance metrics
    metrics: jsonb('metrics').$type<{
      totalActions: number;
      successfulActions: number;
      failedActions: number;
      avgActionTimeMs: number;
      screenshotsTaken: number;
      dataExtracted: number;
    }>(),

    // Context (browser state, variables)
    context: jsonb('context').$type<{
      currentUrl?: string;
      variables: Record<string, unknown>;
      cookies?: Array<{ name: string; value: string; domain: string }>;
    }>(),

    // Trigger info
    triggerType: text('trigger_type', {
      enum: ['manual', 'scheduled', 'api', 'webhook', 'event'],
    })
      .default('manual')
      .notNull(),
    triggerData: jsonb('trigger_data').$type<Record<string, unknown>>(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    workflowIdx: index('idx_agent_executions_workflow').on(table.workflowId),
    agentIdx: index('idx_agent_executions_agent').on(table.agentId),
    userIdx: index('idx_agent_executions_user').on(table.userId),
    statusIdx: index('idx_agent_executions_status').on(table.status),
    createdIdx: index('idx_agent_executions_created').on(table.createdAt),
  })
);

export type AgentExecution = typeof agentExecutions.$inferSelect;
export type NewAgentExecution = typeof agentExecutions.$inferInsert;

// ============================================================================
// EXECUTION ACTIONS
// ============================================================================

/**
 * Individual actions within an execution
 *
 * Detailed log of each action taken by the agent.
 */
export const executionActions = pgTable(
  'execution_actions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    executionId: uuid('execution_id')
      .references(() => agentExecutions.id, { onDelete: 'cascade' })
      .notNull(),
    stepId: uuid('step_id').references(() => workflowSteps.id),

    // Action info
    actionType: text('action_type', {
      enum: [
        'observe',
        'navigate',
        'click',
        'type',
        'scroll',
        'wait',
        'extract',
        'screenshot',
        'api_call',
        'script',
        'decision',
        'error',
      ],
    }).notNull(),
    actionData: jsonb('action_data').$type<{
      target?: string; // Selector or URL
      value?: unknown; // Typed text, extracted data, etc.
      coordinates?: { x: number; y: number };
      screenshot?: string; // Base64 or URL
    }>(),

    // Result
    status: text('status', {
      enum: ['success', 'failure', 'skipped'],
    }).notNull(),
    result: jsonb('result').$type<{
      success: boolean;
      data?: unknown;
      error?: string;
    }>(),

    // Timing
    startedAt: timestamp('started_at').notNull(),
    completedAt: timestamp('completed_at'),
    durationMs: integer('duration_ms'),

    // AI reasoning (if applicable)
    aiReasoning: jsonb('ai_reasoning').$type<{
      observation: string;
      thought: string;
      actionChosen: string;
      confidence: number;
    }>(),

    // Order
    sequenceNumber: integer('sequence_number').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    executionIdx: index('idx_execution_actions_execution').on(table.executionId),
    stepIdx: index('idx_execution_actions_step').on(table.stepId),
    typeIdx: index('idx_execution_actions_type').on(table.actionType),
    sequenceIdx: index('idx_execution_actions_sequence').on(
      table.executionId,
      table.sequenceNumber
    ),
  })
);

export type ExecutionAction = typeof executionActions.$inferSelect;
export type NewExecutionAction = typeof executionActions.$inferInsert;

// ============================================================================
// RL TRAINING SESSIONS
// ============================================================================

/**
 * Reinforcement learning training sessions
 *
 * Tracks RL training runs for fine-tuning agents.
 */
export const rlTrainingSessions = pgTable(
  'rl_training_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    agentId: uuid('agent_id')
      .references(() => cuaAgents.id)
      .notNull(),
    name: text('name').notNull(),
    description: text('description'),
    ownerId: text('owner_id'),

    // Training configuration
    trainingConfig: jsonb('training_config').$type<{
      algorithm: 'ppo' | 'dpo' | 'rlhf' | 'webrl' | 'custom';
      learningRate: number;
      batchSize: number;
      epochs: number;
      warmupSteps: number;
      maxSteps: number;
      rewardShaping: {
        successReward: number;
        failureReward: number;
        stepPenalty: number;
        efficiencyBonus: number;
      };
      curriculum?: {
        stages: Array<{
          name: string;
          difficulty: number;
          tasksRequired: number;
        }>;
      };
    }>(),

    // Training data
    trainingData: jsonb('training_data').$type<{
      datasetType: 'demonstrations' | 'interactions' | 'synthetic';
      datasetSize: number;
      datasetPath?: string;
      validationSplit: number;
    }>(),

    // Status
    status: text('status', {
      enum: ['pending', 'running', 'paused', 'completed', 'failed'],
    })
      .default('pending')
      .notNull(),

    // Progress
    currentEpoch: integer('current_epoch').default(0),
    currentStep: integer('current_step').default(0),
    progressPercent: real('progress_percent').default(0),

    // Metrics
    metrics: jsonb('metrics').$type<{
      trainLoss: number[];
      valLoss: number[];
      successRate: number[];
      avgReward: number[];
      avgStepsPerTask: number[];
    }>(),

    // Best checkpoint
    bestCheckpoint: jsonb('best_checkpoint').$type<{
      epoch: number;
      step: number;
      valLoss: number;
      successRate: number;
      modelPath: string;
    }>(),

    // Timing
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    estimatedCompletionAt: timestamp('estimated_completion_at'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    agentIdx: index('idx_rl_training_agent').on(table.agentId),
    ownerIdx: index('idx_rl_training_owner').on(table.ownerId),
    statusIdx: index('idx_rl_training_status').on(table.status),
  })
);

export type RlTrainingSession = typeof rlTrainingSessions.$inferSelect;
export type NewRlTrainingSession = typeof rlTrainingSessions.$inferInsert;

// ============================================================================
// CUA ANALYTICS
// ============================================================================

/**
 * Agent performance analytics events
 *
 * Tracks agent usage, performance, and errors for optimization.
 */
export const cuaAnalytics = pgTable(
  'cua_analytics',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    agentId: uuid('agent_id').references(() => cuaAgents.id),
    workflowId: uuid('workflow_id').references(() => automationWorkflows.id),
    executionId: uuid('execution_id').references(() => agentExecutions.id),
    userId: text('user_id'),

    // Event type
    eventType: text('event_type', {
      enum: [
        'execution_start',
        'execution_complete',
        'execution_fail',
        'step_complete',
        'step_fail',
        'action_success',
        'action_fail',
        'performance_metric',
        'error',
      ],
    }).notNull(),

    // Event data
    eventData: jsonb('event_data').$type<{
      // Execution events
      executionDurationMs?: number;
      stepsCompleted?: number;
      actionsPerformed?: number;

      // Step events
      stepType?: string;
      stepDurationMs?: number;

      // Action events
      actionType?: string;
      actionDurationMs?: number;
      actionSuccess?: boolean;

      // Performance
      cpuUsage?: number;
      memoryUsage?: number;
      networkRequests?: number;

      // Errors
      errorCode?: string;
      errorMessage?: string;

      // Custom
      customData?: Record<string, unknown>;
    }>(),

    // Context
    context: jsonb('context').$type<{
      userAgent?: string;
      platform?: string;
      targetDomain?: string;
    }>(),

    timestamp: timestamp('timestamp').defaultNow().notNull(),
  },
  (table) => ({
    agentIdx: index('idx_cua_analytics_agent').on(table.agentId),
    workflowIdx: index('idx_cua_analytics_workflow').on(table.workflowId),
    executionIdx: index('idx_cua_analytics_execution').on(table.executionId),
    typeIdx: index('idx_cua_analytics_type').on(table.eventType),
    timestampIdx: index('idx_cua_analytics_timestamp').on(table.timestamp),
  })
);

export type CuaAnalytic = typeof cuaAnalytics.$inferSelect;
export type NewCuaAnalytic = typeof cuaAnalytics.$inferInsert;

// ============================================================================
// CUA KNOWLEDGE
// ============================================================================

/**
 * RAG knowledge base for CUA guidance
 *
 * Stores documentation, patterns, and troubleshooting for agent development.
 */
export const cuaKnowledge = pgTable(
  'cua_knowledge',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Document classification
    documentType: text('document_type', {
      enum: [
        'concept',
        'pattern',
        'api',
        'tutorial',
        'troubleshooting',
        'security',
        'optimization',
        'integration',
      ],
    }).notNull(),

    // Content
    title: text('title').notNull(),
    content: text('content').notNull(),
    summary: text('summary'),

    // Categorization
    category: text('category', {
      enum: ['fundamentals', 'workflow', 'rl', 'multi_agent', 'privacy', 'testing', 'advanced'],
    }),
    topics: jsonb('topics').$type<string[]>().default([]),
    tags: jsonb('tags').$type<string[]>().default([]),

    // Code examples
    codeExamples: jsonb('code_examples').$type<
      Array<{
        language: 'typescript' | 'python' | 'javascript';
        code: string;
        description?: string;
      }>
    >(),

    // References
    sourceRef: text('source_ref'),
    externalLinks: jsonb('external_links').$type<
      Array<{
        title: string;
        url: string;
        type: 'documentation' | 'paper' | 'repo' | 'article';
      }>
    >(),

    // Metadata
    metadata: jsonb('metadata').$type<{
      reliability: number;
      lastVerified?: string;
      agentTypes?: string[];
    }>(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    typeIdx: index('idx_cua_knowledge_type').on(table.documentType),
    categoryIdx: index('idx_cua_knowledge_category').on(table.category),
  })
);

export type CuaKnowledge = typeof cuaKnowledge.$inferSelect;
export type NewCuaKnowledge = typeof cuaKnowledge.$inferInsert;

// ============================================================================
// RELATIONS
// ============================================================================

export const cuaAgentsRelations = relations(cuaAgents, ({ many }) => ({
  workflows: many(automationWorkflows),
  executions: many(agentExecutions),
  trainingSessions: many(rlTrainingSessions),
  analytics: many(cuaAnalytics),
}));

export const automationWorkflowsRelations = relations(automationWorkflows, ({ one, many }) => ({
  defaultAgent: one(cuaAgents, {
    fields: [automationWorkflows.defaultAgentId],
    references: [cuaAgents.id],
  }),
  steps: many(workflowSteps),
  executions: many(agentExecutions),
  analytics: many(cuaAnalytics),
}));

export const workflowStepsRelations = relations(workflowSteps, ({ one, many }) => ({
  workflow: one(automationWorkflows, {
    fields: [workflowSteps.workflowId],
    references: [automationWorkflows.id],
  }),
  actions: many(executionActions),
}));

export const agentExecutionsRelations = relations(agentExecutions, ({ one, many }) => ({
  workflow: one(automationWorkflows, {
    fields: [agentExecutions.workflowId],
    references: [automationWorkflows.id],
  }),
  agent: one(cuaAgents, {
    fields: [agentExecutions.agentId],
    references: [cuaAgents.id],
  }),
  actions: many(executionActions),
  analytics: many(cuaAnalytics),
}));

export const executionActionsRelations = relations(executionActions, ({ one }) => ({
  execution: one(agentExecutions, {
    fields: [executionActions.executionId],
    references: [agentExecutions.id],
  }),
  step: one(workflowSteps, {
    fields: [executionActions.stepId],
    references: [workflowSteps.id],
  }),
}));

export const rlTrainingSessionsRelations = relations(rlTrainingSessions, ({ one }) => ({
  agent: one(cuaAgents, {
    fields: [rlTrainingSessions.agentId],
    references: [cuaAgents.id],
  }),
}));

export const cuaAnalyticsRelations = relations(cuaAnalytics, ({ one }) => ({
  agent: one(cuaAgents, {
    fields: [cuaAnalytics.agentId],
    references: [cuaAgents.id],
  }),
  workflow: one(automationWorkflows, {
    fields: [cuaAnalytics.workflowId],
    references: [automationWorkflows.id],
  }),
  execution: one(agentExecutions, {
    fields: [cuaAnalytics.executionId],
    references: [agentExecutions.id],
  }),
}));

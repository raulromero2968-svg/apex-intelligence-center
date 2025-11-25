/**
 * Computer-Using Agents Module
 *
 * Exports all CUA services for GUI automation.
 * Implements pack-cua-001 architecture.
 *
 * @see pack-cua-001 for domain mapping
 */

// Agent Runtime
export {
  createAgent,
  createAgentFromTemplate,
  getAgent,
  getUserAgents,
  updateAgent,
  deleteAgent,
  startExecution,
  updateExecutionStatus,
  getExecution,
  getRecentExecutions,
  logAction,
  getExecutionActions,
  executeAction,
  validateAction,
  mapGoalToActions,
  updateAgentMetrics,
  DEFAULT_CAPABILITIES,
  DEFAULT_RUNTIME_CONFIG,
  AGENT_TEMPLATES,
  type AgentType,
  type ModelProvider,
  type ExecutionStatus,
  type ActionType,
  type AgentCapabilities,
  type RuntimeConfig,
  type AgentAction,
  type AgentObservation,
  type AIReasoning,
  type ExecutionContext,
} from './agent-runtime';

// Workflow Orchestrator
export {
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
  createMultiAgentWorkflow,
  getWorkflowTemplates,
  WORKFLOW_TEMPLATES,
  type WorkflowType,
  type StepType,
  type StepConfig,
  type WorkflowValidationResult,
  type AgentRole,
  type MultiAgentConfig,
} from './workflow-orchestrator';

// Domain Pack (RAG)
export {
  initializeCuaKnowledge,
  searchKnowledge,
  getKnowledgeByCategory,
  getKnowledgeByType,
  getPromptTemplate,
  fillPromptTemplate,
  generateCuaPrompt,
  CORE_KNOWLEDGE,
  PROMPT_TEMPLATES,
  type DocumentType,
  type Category,
  type KnowledgeQuery,
  type PromptTemplate,
} from './domain-pack';

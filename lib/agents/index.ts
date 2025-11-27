/**
 * Multi-Agent Framework Barrel Export
 *
 * Exports all agent-related functionality including:
 * - Multi-agent orchestration
 * - Visual code generation
 * - Pigeon Paradox verification
 * - Market analysis
 *
 * @module agents
 */

// Multi-Agent Framework
export {
  Agent,
  MultiAgentOrchestrator,
  generateVisualCode,
  verifyWithPigeonParadox,
  analyzeMarket,
} from './multi-agent';

// Types
export {
  AgentConfigSchema,
  TaskDefinitionSchema,
  DEFAULT_AGENT_CONFIGS,
  TASK_TEMPLATES,
  type AgentRole,
  type AgentStatus,
  type CommunicationMode,
  type AgentConfig,
  type AgentState,
  type TaskType,
  type TaskDefinition,
  type AgentExecutionResult,
  type MultiAgentResult,
  type VisualCodeRequest,
  type VisualCodeResult,
  type VerificationRequest,
  type VerificationResult,
  type LatentMessage,
  type LatentChannel,
} from './types';

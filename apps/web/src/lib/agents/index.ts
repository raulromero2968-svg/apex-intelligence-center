/**
 * Agents Module Exports
 *
 * Central export point for agent-related functionality including:
 * - Livelihood Agent for job impact analysis
 * - Policy compliance utilities
 * - Multi-Agent Framework for evolved transformers
 *
 * @see master-plan-ai-livelihood-analysis
 */

export {
  // Livelihood Agent Pipeline
  livelihoodAgent,
  checkUserCompliance,
  AGENT_CONFIGS,
  generateFinalResponse,
  determineAnalysisType,
  calculateConfidence,
  // Types (Livelihood-specific, prefixed to avoid conflicts)
  type AgentConfig as LivelihoodAgentConfig,
  type AgentName,
  type AgentState as LivelihoodAgentState,
  type AgentMessage,
  type AnalyzerResult,
  type DiscovererResult,
  type VerifierResult,
  type LivelihoodAgentParams,
  type LivelihoodAgentResponse,
} from './livelihood-agent';

// Multi-Agent Framework exports
export {
  Agent,
  MultiAgentOrchestrator,
  generateVisualCode,
  verifyWithPigeonParadox,
  analyzeMarket,
} from './multi-agent';

// Multi-Agent Types
export {
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
  AgentConfigSchema,
  TaskDefinitionSchema,
  DEFAULT_AGENT_CONFIGS,
  TASK_TEMPLATES,
} from './types';

/**
 * Agents Module Exports
 *
 * Central export point for agent-related functionality including:
 * - Livelihood Agent for job impact analysis
 * - Multi-Agent system for TCG reasoning
 * - Policy compliance utilities
 *
 * @see master-plan-ai-livelihood-analysis
 * @see multi-agent.ts for TCG multi-agent pipeline
 */

export {
  // Livelihood Agent Pipeline
  livelihoodAgent,
  checkUserCompliance,
  AGENT_CONFIGS,
  generateFinalResponse,
  determineAnalysisType,
  calculateConfidence,
  // Types
  type AgentConfig,
  type AgentName,
  type AgentState,
  type AgentMessage,
  type AnalyzerResult,
  type DiscovererResult,
  type VerifierResult,
  type LivelihoodAgentParams,
  type LivelihoodAgentResponse,
} from './livelihood-agent';

// Multi-Agent System
export {
  multiAgentEvolve,
  processTask,
  evolveAgent,
  MultiAgentOrchestrator,
  analyzeMarket,
  generateVisualCode,
  verifyWithPigeonParadox,
  TCGValuationTool,
  TCGMarketTrendsTool,
  ComplianceCheckTool,
  MULTI_AGENT_CONFIGS,
} from './multi-agent';

// Agent Types
export type {
  MultiAgentConfig,
  MultiAgentState,
  LatentRepresentation,
  TaskResult,
  AgentTaskConfig,
  ToolResult,
  TCGToolConfig,
  EvolutionResult,
  EvolutionOptions,
  TaskDefinition,
  VisualCodeRequest,
  VerificationRequest,
} from './types';

// Task Templates
export { TASK_TEMPLATES } from './types';

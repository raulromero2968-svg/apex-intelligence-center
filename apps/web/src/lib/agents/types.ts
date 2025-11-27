/**
 * Agent Type Definitions
 *
 * Core types for multi-agent configuration, state management, and task results.
 * These types are used across the agent system for TCG reasoning and analysis.
 *
 * Trade-offs:
 * - GOOD: Strong typing enables IDE support and compile-time safety
 * - BAD: Type imports may add bundle size; mitigate with tree-shaking
 *
 * @see multi-agent.ts for implementation
 * @see livelihood-agent.ts for extended agent types
 */

import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Tool } from '@langchain/core/tools';

// ============================================================================
// CORE AGENT TYPES
// ============================================================================

/**
 * Configuration for a single agent in the multi-agent system
 */
export interface MultiAgentConfig {
  /** Unique identifier for the agent */
  name: string;
  /** LangChain chat model instance for this agent */
  llm: BaseChatModel;
  /** Array of tools available to this agent */
  tools: Tool[];
  /** Optional system prompt for the agent */
  systemPrompt?: string;
  /** Optional temperature override */
  temperature?: number;
  /** Optional max tokens override */
  maxTokens?: number;
}

/**
 * State maintained across multi-agent evolution pipeline
 */
export interface MultiAgentState {
  /** Original query or task being processed */
  query: string;
  /** Optional latent query representation for RAG efficiency */
  latent?: LatentRepresentation;
  /** Outputs from each agent, keyed by agent name */
  outputs: Record<string, string>;
  /** Optional metadata for tracking */
  metadata?: {
    startTime?: number;
    tokensUsed?: number;
    userId?: string;
  };
}

/**
 * Latent representation for compressed query storage
 */
export interface LatentRepresentation {
  /** Vector embedding of the latent query */
  vector: number[];
  /** Optional metadata about the latent representation */
  metadata?: {
    originalQuery?: string;
    compressed?: boolean;
    dimensions?: number;
  };
}

// ============================================================================
// TASK AND RESULT TYPES
// ============================================================================

/**
 * Result from a task execution
 */
export interface TaskResult {
  /** Status of the task execution */
  status: 'success' | 'failure' | 'pending' | 'processing';
  /** Output data from the task */
  output?: string;
  /** Error message if status is 'failure' */
  error?: string;
  /** Execution metrics */
  metrics?: {
    executionTimeMs: number;
    tokensUsed: number;
    agentsInvolved: string[];
  };
}

/**
 * Configuration for agent-based task execution
 */
export interface AgentTaskConfig {
  /** Unique ID for the task */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what this task does */
  description?: string;
  /** Priority level (lower = higher priority) */
  priority?: number;
  /** Maximum execution time in milliseconds */
  timeoutMs?: number;
  /** Whether to retry on failure */
  retryOnFailure?: boolean;
  /** Maximum retry attempts */
  maxRetries?: number;
}

// ============================================================================
// TOOL TYPES
// ============================================================================

/**
 * Result from a tool invocation
 */
export interface ToolResult {
  /** Name of the tool that was invoked */
  toolName: string;
  /** Input provided to the tool */
  input: string;
  /** Output from the tool */
  output: string;
  /** Whether the tool execution succeeded */
  success: boolean;
  /** Execution duration in milliseconds */
  durationMs?: number;
}

/**
 * Configuration for custom TCG-specific tools
 */
export interface TCGToolConfig {
  /** Tool name identifier */
  name: string;
  /** Human-readable description for the LLM */
  description: string;
  /** Whether this tool requires authentication */
  requiresAuth?: boolean;
  /** Rate limit per minute */
  rateLimitPerMinute?: number;
}

// ============================================================================
// EVOLUTION TYPES
// ============================================================================

/**
 * Result from multi-agent evolution pipeline
 */
export interface EvolutionResult {
  /** Final evolved output */
  finalOutput: string;
  /** Intermediate outputs from each agent */
  intermediateOutputs: Record<string, string>;
  /** Whether consensus was reached among agents */
  consensusReached: boolean;
  /** Confidence score for the final output (0-1) */
  confidenceScore: number;
  /** List of agents that participated */
  participatingAgents: string[];
  /** Execution metrics */
  executionMetrics: {
    totalTimeMs: number;
    totalTokens: number;
    latentQueriesUsed: number;
  };
}

/**
 * Options for the evolution pipeline
 */
export interface EvolutionOptions {
  /** Maximum number of evolution iterations */
  maxIterations?: number;
  /** Whether to use latent query compression */
  useLatentCompression?: boolean;
  /** Minimum confidence threshold to accept result */
  confidenceThreshold?: number;
  /** Whether to include verification step */
  includeVerification?: boolean;
  /** User ID for personalization */
  userId?: string;
}

// ============================================================================
// LEGACY COMPATIBILITY TYPES
// ============================================================================

/**
 * Legacy AgentConfig type for backwards compatibility
 * @deprecated Use MultiAgentConfig instead
 */
export type AgentConfig = {
  id?: string;
  name: string;
  llm?: BaseChatModel;
  tools?: Tool[];
};

// Re-export for convenience
export type { BaseChatModel, Tool };

// ============================================================================
// API ROUTE COMPATIBILITY TYPES
// ============================================================================

/**
 * Task definition for multi-agent orchestration
 */
export interface TaskDefinition {
  /** Unique task identifier */
  id: string;
  /** Task type for routing */
  type: string;
  /** Human-readable description */
  description: string;
  /** Input data for the task */
  input: Record<string, any>;
  /** Required agent roles for execution */
  requiredAgents: string[];
  /** Task-specific configuration */
  config?: {
    maxIterations?: number;
    consensusThreshold?: number;
    timeoutMs?: number;
    [key: string]: any;
  };
}

/**
 * Request for visual code generation
 */
export interface VisualCodeRequest {
  /** Description of the visual component to generate */
  description: string;
  /** Type of component (e.g., 'starfield', 'chart', 'animation') */
  componentType: string;
  /** Target framework (e.g., 'react', 'threejs', 'canvas') */
  framework: 'react' | 'threejs' | 'canvas' | 'svg';
  /** Existing code to modify or extend */
  existingCode?: string;
  /** Enable debug output */
  debugMode?: boolean;
  /** Design constraints */
  constraints?: {
    width?: number;
    height?: number;
    colors?: string[];
    performance?: 'low' | 'medium' | 'high';
  };
}

/**
 * Request for claim verification
 */
export interface VerificationRequest {
  /** The claim to verify */
  claim: string;
  /** Supporting evidence */
  evidence: string | string[];
  /** Context for verification */
  context: string;
  /** Specific verification criteria */
  verificationCriteria?: string[];
}

/**
 * Task templates for common operations
 */
export const TASK_TEMPLATES: Record<string, Partial<TaskDefinition>> = {
  market_analysis: {
    type: 'market_analysis',
    requiredAgents: ['debater', 'researcher', 'synthesizer'],
    config: {
      maxIterations: 3,
      consensusThreshold: 0.7,
    },
  },
  visual_generation: {
    type: 'visual_generation',
    requiredAgents: ['visualizer', 'verifier'],
    config: {
      maxIterations: 2,
    },
  },
  claim_verification: {
    type: 'claim_verification',
    requiredAgents: ['researcher', 'verifier', 'critic'],
    config: {
      maxIterations: 2,
      consensusThreshold: 0.8,
    },
  },
  opportunity_discovery: {
    type: 'opportunity_discovery',
    requiredAgents: ['discoverer', 'researcher', 'synthesizer'],
    config: {
      maxIterations: 3,
    },
  },
};

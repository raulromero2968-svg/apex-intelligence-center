/**
 * Multi-Agent Framework Types
 *
 * Type definitions for the evolved transformer multi-agent system.
 * Inspired by Ilya Sutskever's insights on multi-agent self-play
 * and David Shapiro's Cognitive Primitives.
 *
 * Key Concepts:
 * - Latent communication between agents (LatentMAS)
 * - High-dimensional reasoning (Pigeon Paradox)
 * - Verification and consensus mechanisms
 *
 * @module agents/types
 */

import { z } from 'zod';

// ============================================================================
// AGENT ROLE DEFINITIONS
// ============================================================================

/**
 * Agent role types in the multi-agent system
 */
export type AgentRole =
  | 'debater'      // Analyzes market perspectives, generates arguments
  | 'visualizer'   // Generates visual code, UI components, charts
  | 'verifier'     // Validates claims, checks consistency (Pigeon Paradox)
  | 'researcher'   // Deep dives into specific topics, RAG queries
  | 'synthesizer'  // Combines insights from multiple agents
  | 'critic';      // Provides contrarian viewpoints

/**
 * Agent status in the execution pipeline
 */
export type AgentStatus =
  | 'idle'
  | 'thinking'
  | 'executing'
  | 'waiting'
  | 'completed'
  | 'failed';

/**
 * Communication mode between agents
 */
export type CommunicationMode =
  | 'full_text'    // Traditional text messages
  | 'latent'       // Compressed latent vectors (LatentMAS)
  | 'hybrid';      // Text + latent metadata

// ============================================================================
// AGENT CONFIGURATION
// ============================================================================

/**
 * Zod schema for agent configuration validation
 */
export const AgentConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(['debater', 'visualizer', 'verifier', 'researcher', 'synthesizer', 'critic']),
  model: z.string().default('gpt-4-turbo'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().default(4096),
  systemPrompt: z.string().optional(),
  tools: z.array(z.string()).default([]),
  communicationMode: z.enum(['full_text', 'latent', 'hybrid']).default('hybrid'),
  priority: z.number().default(1),
  timeout: z.number().default(30000), // 30 seconds
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

// ============================================================================
// AGENT STATE
// ============================================================================

/**
 * Agent state during execution
 */
export interface AgentState {
  id: string;
  role: AgentRole;
  status: AgentStatus;
  lastOutput: string | null;
  latentState: number[] | null; // Compressed state for inter-agent comm
  context: {
    task: string;
    previousOutputs: Map<string, string>;
    sharedKnowledge: Record<string, any>;
  };
  metrics: {
    startTime: number;
    endTime: number | null;
    tokenCount: number;
    latencyMs: number;
  };
  error: string | null;
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

/**
 * Multi-agent task types
 */
export type TaskType =
  | 'market_analysis'      // Analyze market trends for TCG
  | 'visual_code_gen'      // Generate/fix visual code
  | 'visual_debug'         // Debug visual rendering issues
  | 'price_prediction'     // Predict card prices
  | 'sentiment_analysis'   // Analyze market sentiment
  | 'arbitrage_scan'       // Find arbitrage opportunities
  | 'custom';              // Custom task

/**
 * Zod schema for task definition
 */
export const TaskDefinitionSchema = z.object({
  id: z.string(),
  type: z.enum([
    'market_analysis',
    'visual_code_gen',
    'visual_debug',
    'price_prediction',
    'sentiment_analysis',
    'arbitrage_scan',
    'custom',
  ]),
  description: z.string(),
  input: z.record(z.any()),
  requiredAgents: z.array(z.enum([
    'debater', 'visualizer', 'verifier', 'researcher', 'synthesizer', 'critic',
  ])),
  config: z.object({
    maxIterations: z.number().default(5),
    consensusThreshold: z.number().default(0.8),
    enableLatentComm: z.boolean().default(true),
    parallelExecution: z.boolean().default(true),
    timeout: z.number().default(120000), // 2 minutes
  }).optional(),
});

export type TaskDefinition = z.infer<typeof TaskDefinitionSchema>;

// ============================================================================
// EXECUTION RESULTS
// ============================================================================

/**
 * Individual agent execution result
 */
export interface AgentExecutionResult {
  agentId: string;
  role: AgentRole;
  success: boolean;
  output: string;
  latentVector: number[] | null;
  confidence: number;
  reasoning: string[];
  citations: Array<{
    type: string;
    id: string;
    content: string;
  }>;
  metrics: {
    tokenCount: number;
    latencyMs: number;
    modelUsed: string;
  };
  error: string | null;
}

/**
 * Multi-agent task execution result
 */
export interface MultiAgentResult {
  taskId: string;
  taskType: TaskType;
  success: boolean;
  finalOutput: string;
  consensus: {
    achieved: boolean;
    score: number;
    disagreements: Array<{
      agentId: string;
      position: string;
      confidence: number;
    }>;
  };
  agentResults: AgentExecutionResult[];
  verification: {
    verified: boolean;
    verifierAgentId: string;
    issues: string[];
    confidence: number;
  } | null;
  metadata: {
    totalLatencyMs: number;
    totalTokens: number;
    iterationCount: number;
    latentCommUsed: boolean;
  };
}

// ============================================================================
// VISUAL CODE GENERATION TYPES
// ============================================================================

/**
 * Visual code generation request
 */
export interface VisualCodeRequest {
  description: string;
  componentType: 'starfield' | 'chart' | 'card' | 'animation' | 'custom';
  framework: 'react' | 'three' | 'canvas' | 'svg';
  existingCode?: string;
  debugMode?: boolean;
  constraints?: {
    maxFileSize?: number;
    performance?: 'low' | 'medium' | 'high';
    accessibility?: boolean;
  };
}

/**
 * Visual code generation result
 */
export interface VisualCodeResult {
  code: string;
  language: 'typescript' | 'javascript';
  componentName: string;
  dependencies: string[];
  explanation: string;
  performanceNotes: string[];
  testCases?: Array<{
    name: string;
    description: string;
    code: string;
  }>;
}

// ============================================================================
// PIGEON PARADOX VERIFICATION
// ============================================================================

/**
 * High-dimensional verification request (Pigeon Paradox)
 *
 * AI reasons in 11k+ dimensions, but humans need 3D visualization.
 * This structure captures the verification of high-dim reasoning.
 */
export interface VerificationRequest {
  claim: string;
  evidence: Array<{
    source: string;
    content: string;
    confidence: number;
  }>;
  context: {
    domain: string;
    timeframe?: string;
    entities: string[];
  };
  verificationCriteria: Array<{
    criterion: string;
    weight: number;
  }>;
}

/**
 * Verification result with human-interpretable explanation
 */
export interface VerificationResult {
  verified: boolean;
  confidence: number;
  highDimScore: number; // Raw AI confidence
  humanInterpretation: string; // 3D/human-understandable explanation
  criteriaResults: Array<{
    criterion: string;
    passed: boolean;
    score: number;
    explanation: string;
  }>;
  warnings: string[];
  recommendations: string[];
}

// ============================================================================
// LATENT COMMUNICATION
// ============================================================================

/**
 * Latent message for inter-agent communication
 */
export interface LatentMessage {
  senderId: string;
  receiverId: string | null; // null = broadcast
  vector: number[];
  metadata: {
    messageType: 'instruction' | 'observation' | 'result' | 'query' | 'feedback';
    priority: number;
    timestamp: Date;
    expiresAt?: Date;
  };
  // Optional text fallback for debugging
  textFallback?: string;
}

/**
 * Latent communication channel
 */
export interface LatentChannel {
  taskId: string;
  participants: string[];
  messages: LatentMessage[];
  sharedLatentSpace: number[][]; // Accumulated knowledge
}

// ============================================================================
// DEFAULT AGENT CONFIGURATIONS
// ============================================================================

/**
 * Default configurations for each agent role
 */
export const DEFAULT_AGENT_CONFIGS: Record<AgentRole, Partial<AgentConfig>> = {
  debater: {
    model: 'gpt-4-turbo',
    temperature: 0.8,
    systemPrompt: `You are a market analyst debater. Analyze TCG market data and form well-reasoned arguments.
Present both bullish and bearish perspectives with evidence. Be objective and data-driven.`,
  },
  visualizer: {
    model: 'gpt-4-turbo',
    temperature: 0.6,
    tools: ['code_execution', 'image_generation'],
    systemPrompt: `You are a visual code generator specializing in React, Three.js, and Canvas.
Generate clean, performant, accessible code for visual components.
Focus on 60fps animations and GPU optimization.`,
  },
  verifier: {
    model: 'gpt-4-turbo',
    temperature: 0.3,
    systemPrompt: `You are a verification agent implementing the Pigeon Paradox principle.
Verify claims by checking logical consistency, evidence quality, and potential biases.
Flag any unverifiable high-dimensional reasoning.`,
  },
  researcher: {
    model: 'gpt-4-turbo',
    temperature: 0.5,
    tools: ['rag_search', 'web_search'],
    systemPrompt: `You are a deep research agent. Use RAG and external sources to gather comprehensive information.
Always cite sources and assess reliability.`,
  },
  synthesizer: {
    model: 'gpt-4-turbo',
    temperature: 0.6,
    systemPrompt: `You are a synthesis agent. Combine insights from multiple agents into coherent, actionable intelligence.
Resolve conflicts and highlight consensus points.`,
  },
  critic: {
    model: 'gpt-4-turbo',
    temperature: 0.9,
    systemPrompt: `You are a contrarian critic. Challenge assumptions, identify weaknesses, and stress-test conclusions.
Be constructively critical and suggest improvements.`,
  },
};

// ============================================================================
// TASK TEMPLATES
// ============================================================================

/**
 * Pre-defined task templates for common operations
 */
export const TASK_TEMPLATES: Record<string, Partial<TaskDefinition>> = {
  market_analysis: {
    type: 'market_analysis',
    requiredAgents: ['researcher', 'debater', 'synthesizer', 'verifier'],
    config: {
      maxIterations: 3,
      consensusThreshold: 0.7,
      enableLatentComm: true,
      parallelExecution: true,
    },
  },
  visual_debug: {
    type: 'visual_debug',
    requiredAgents: ['visualizer', 'verifier', 'critic'],
    config: {
      maxIterations: 5,
      consensusThreshold: 0.9,
      enableLatentComm: false,
      parallelExecution: false,
    },
  },
  price_prediction: {
    type: 'price_prediction',
    requiredAgents: ['researcher', 'debater', 'critic', 'synthesizer', 'verifier'],
    config: {
      maxIterations: 4,
      consensusThreshold: 0.8,
      enableLatentComm: true,
      parallelExecution: true,
    },
  },
};

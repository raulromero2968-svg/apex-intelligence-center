/**
 * Multi-Agent Framework for Evolved Transformers
 *
 * Implements a multi-agent system inspired by:
 * - Ilya Sutskever: Evolved transformers via multi-agent self-play
 * - LatentMAS (DAIR.AI): Latent space communication between agents
 * - David Shapiro: Cognitive Primitives and Pigeon Paradox
 * - Jensen Huang: GPU-accelerated AI inference
 *
 * Key Features:
 * - Parallel agent execution with consensus
 * - Latent communication for efficiency
 * - Pigeon Paradox verification
 * - Visual code generation and debugging
 *
 * @module agents/multi-agent
 */

import { ChatOpenAI } from '@langchain/openai';
import { Pool } from 'pg';
import * as Sentry from '@sentry/nextjs';

import {
  AgentRole,
  AgentConfig,
  AgentState,
  AgentExecutionResult,
  MultiAgentResult,
  TaskDefinition,
  LatentMessage,
  VerificationRequest,
  VerificationResult,
  VisualCodeRequest,
  VisualCodeResult,
  DEFAULT_AGENT_CONFIGS,
  AgentConfigSchema,
} from './types';
import {
  generateLatentQueries,
  compressForAgentComm,
  decompressFromLatent,
  latentRAG,
} from '../rag/latent-query';

// ============================================================================
// AGENT CLASS
// ============================================================================

/**
 * Individual agent in the multi-agent system
 */
class Agent {
  readonly config: AgentConfig;
  private llm: ChatOpenAI;
  private state: AgentState;

  constructor(config: AgentConfig) {
    // Validate and merge with defaults
    const roleDefaults = DEFAULT_AGENT_CONFIGS[config.role] || {};
    this.config = AgentConfigSchema.parse({
      ...roleDefaults,
      ...config,
    });

    // Initialize LLM
    this.llm = new ChatOpenAI({
      modelName: this.config.model,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Initialize state
    this.state = {
      id: this.config.id,
      role: this.config.role as AgentRole,
      status: 'idle',
      lastOutput: null,
      latentState: null,
      context: {
        task: '',
        previousOutputs: new Map(),
        sharedKnowledge: {},
      },
      metrics: {
        startTime: 0,
        endTime: null,
        tokenCount: 0,
        latencyMs: 0,
      },
      error: null,
    };
  }

  /**
   * Execute agent with given input
   */
  async execute(
    input: string,
    context?: Record<string, any>
  ): Promise<AgentExecutionResult> {
    const startTime = Date.now();
    this.state.status = 'executing';
    this.state.metrics.startTime = startTime;

    try {
      // Build messages
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

      // Add system prompt
      if (this.config.systemPrompt) {
        messages.push({ role: 'system', content: this.config.systemPrompt });
      }

      // Add context from previous agents if available
      if (context?.previousOutputs) {
        const contextStr = Object.entries(context.previousOutputs)
          .map(([agentId, output]) => `[${agentId}]: ${output}`)
          .join('\n\n');

        if (contextStr) {
          messages.push({
            role: 'system',
            content: `Previous agent outputs:\n${contextStr}`,
          });
        }
      }

      // Add user input
      messages.push({ role: 'user', content: input });

      // Execute LLM call
      const response = await this.llm.invoke(messages);

      const output = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

      // Update state
      this.state.status = 'completed';
      this.state.lastOutput = output;
      this.state.metrics.endTime = Date.now();
      this.state.metrics.latencyMs = Date.now() - startTime;

      // Generate latent representation if in latent mode
      let latentVector: number[] | null = null;
      if (this.config.communicationMode !== 'full_text') {
        const compressed = await compressForAgentComm(output);
        latentVector = compressed.vector;
        this.state.latentState = latentVector;
      }

      // Parse confidence and reasoning from output
      const { confidence, reasoning, citations } = this.parseOutput(output);

      return {
        agentId: this.config.id,
        role: this.config.role as AgentRole,
        success: true,
        output,
        latentVector,
        confidence,
        reasoning,
        citations,
        metrics: {
          tokenCount: this.estimateTokens(input + output),
          latencyMs: this.state.metrics.latencyMs,
          modelUsed: this.config.model,
        },
        error: null,
      };
    } catch (error) {
      this.state.status = 'failed';
      this.state.error = error instanceof Error ? error.message : 'Unknown error';
      this.state.metrics.endTime = Date.now();
      this.state.metrics.latencyMs = Date.now() - startTime;

      Sentry.captureException(error, {
        tags: { agent: this.config.id, role: this.config.role },
      });

      return {
        agentId: this.config.id,
        role: this.config.role as AgentRole,
        success: false,
        output: '',
        latentVector: null,
        confidence: 0,
        reasoning: [],
        citations: [],
        metrics: {
          tokenCount: 0,
          latencyMs: this.state.metrics.latencyMs,
          modelUsed: this.config.model,
        },
        error: this.state.error,
      };
    }
  }

  /**
   * Parse structured output from LLM response
   */
  private parseOutput(output: string): {
    confidence: number;
    reasoning: string[];
    citations: Array<{ type: string; id: string; content: string }>;
  } {
    // Try to extract confidence score
    const confidenceMatch = output.match(/confidence[:\s]+(\d+(?:\.\d+)?)/i);
    const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) / 100 : 0.7;

    // Extract reasoning points (lines starting with - or *)
    const reasoning = output
      .split('\n')
      .filter((line) => /^[\-\*]\s/.test(line.trim()))
      .map((line) => line.replace(/^[\-\*]\s*/, '').trim());

    // Extract citations [source:N] format
    const citationMatches = output.matchAll(/\[source:(\d+)\]/g);
    const citations = Array.from(citationMatches).map((match) => ({
      type: 'source',
      id: match[1],
      content: '',
    }));

    return { confidence: Math.min(1, Math.max(0, confidence)), reasoning, citations };
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough estimate: 4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Get current state
   */
  getState(): AgentState {
    return { ...this.state };
  }

  /**
   * Update shared context
   */
  updateContext(key: string, value: any): void {
    this.state.context.sharedKnowledge[key] = value;
  }
}

// ============================================================================
// MULTI-AGENT ORCHESTRATOR
// ============================================================================

/**
 * Orchestrates multi-agent task execution
 */
export class MultiAgentOrchestrator {
  private agents: Map<string, Agent> = new Map();
  private pool: Pool | null = null;

  constructor(pool?: Pool) {
    this.pool = pool || null;
  }

  /**
   * Initialize agents for a task
   */
  initializeAgents(task: TaskDefinition): void {
    this.agents.clear();

    for (const role of task.requiredAgents) {
      const config: AgentConfig = {
        id: `agent_${role}_${Date.now()}`,
        name: `${role.charAt(0).toUpperCase() + role.slice(1)} Agent`,
        role,
        ...DEFAULT_AGENT_CONFIGS[role],
        model: DEFAULT_AGENT_CONFIGS[role]?.model || 'gpt-4-turbo',
        temperature: DEFAULT_AGENT_CONFIGS[role]?.temperature || 0.7,
        maxTokens: 4096,
        tools: DEFAULT_AGENT_CONFIGS[role]?.tools || [],
        communicationMode: task.config?.enableLatentComm ? 'hybrid' : 'full_text',
        priority: 1,
        timeout: task.config?.timeout || 30000,
      };

      this.agents.set(config.id, new Agent(config));
    }
  }

  /**
   * Execute multi-agent task
   */
  async execute(task: TaskDefinition): Promise<MultiAgentResult> {
    const startTime = Date.now();

    // Initialize agents
    this.initializeAgents(task);

    const agentResults: AgentExecutionResult[] = [];
    let iteration = 0;
    const maxIterations = task.config?.maxIterations || 5;
    const consensusThreshold = task.config?.consensusThreshold || 0.8;

    try {
      // Main execution loop
      while (iteration < maxIterations) {
        iteration++;

        // Execute agents (parallel or sequential based on config)
        const iterationResults = task.config?.parallelExecution
          ? await this.executeParallel(task, agentResults)
          : await this.executeSequential(task, agentResults);

        agentResults.push(...iterationResults);

        // Check for consensus
        const consensus = this.calculateConsensus(iterationResults);
        if (consensus.score >= consensusThreshold) {
          break;
        }
      }

      // Run verification if verifier is present
      let verification: MultiAgentResult['verification'] = null;
      const verifierResult = agentResults.find((r) => r.role === 'verifier');
      if (verifierResult) {
        verification = {
          verified: verifierResult.confidence >= 0.7,
          verifierAgentId: verifierResult.agentId,
          issues: this.extractIssues(verifierResult.output),
          confidence: verifierResult.confidence,
        };
      }

      // Synthesize final output
      const finalOutput = this.synthesizeFinalOutput(agentResults, task);

      // Calculate final consensus
      const finalConsensus = this.calculateConsensus(agentResults);

      return {
        taskId: task.id,
        taskType: task.type,
        success: finalConsensus.achieved,
        finalOutput,
        consensus: finalConsensus,
        agentResults,
        verification,
        metadata: {
          totalLatencyMs: Date.now() - startTime,
          totalTokens: agentResults.reduce((sum, r) => sum + r.metrics.tokenCount, 0),
          iterationCount: iteration,
          latentCommUsed: task.config?.enableLatentComm || false,
        },
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { taskId: task.id, taskType: task.type },
      });

      return {
        taskId: task.id,
        taskType: task.type,
        success: false,
        finalOutput: `Multi-agent execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        consensus: { achieved: false, score: 0, disagreements: [] },
        agentResults,
        verification: null,
        metadata: {
          totalLatencyMs: Date.now() - startTime,
          totalTokens: agentResults.reduce((sum, r) => sum + r.metrics.tokenCount, 0),
          iterationCount: iteration,
          latentCommUsed: false,
        },
      };
    }
  }

  /**
   * Execute agents in parallel
   */
  private async executeParallel(
    task: TaskDefinition,
    previousResults: AgentExecutionResult[]
  ): Promise<AgentExecutionResult[]> {
    const context = this.buildContext(previousResults);

    const promises = Array.from(this.agents.values()).map((agent) =>
      agent.execute(task.description, context)
    );

    return Promise.all(promises);
  }

  /**
   * Execute agents sequentially
   */
  private async executeSequential(
    task: TaskDefinition,
    previousResults: AgentExecutionResult[]
  ): Promise<AgentExecutionResult[]> {
    const results: AgentExecutionResult[] = [];
    const context = this.buildContext(previousResults);

    for (const agent of this.agents.values()) {
      // Update context with results from this iteration
      const updatedContext = {
        ...context,
        previousOutputs: {
          ...context.previousOutputs,
          ...Object.fromEntries(results.map((r) => [r.agentId, r.output])),
        },
      };

      const result = await agent.execute(task.description, updatedContext);
      results.push(result);
    }

    return results;
  }

  /**
   * Build context from previous results
   */
  private buildContext(results: AgentExecutionResult[]): Record<string, any> {
    return {
      previousOutputs: Object.fromEntries(
        results.filter((r) => r.success).map((r) => [r.agentId, r.output])
      ),
    };
  }

  /**
   * Calculate consensus among agent outputs
   */
  private calculateConsensus(results: AgentExecutionResult[]): {
    achieved: boolean;
    score: number;
    disagreements: Array<{ agentId: string; position: string; confidence: number }>;
  } {
    const successfulResults = results.filter((r) => r.success);

    if (successfulResults.length === 0) {
      return { achieved: false, score: 0, disagreements: [] };
    }

    // Calculate weighted average confidence
    const totalConfidence = successfulResults.reduce((sum, r) => sum + r.confidence, 0);
    const avgConfidence = totalConfidence / successfulResults.length;

    // Find disagreements (agents with low confidence)
    const disagreements = successfulResults
      .filter((r) => r.confidence < 0.5)
      .map((r) => ({
        agentId: r.agentId,
        position: r.output.slice(0, 200) + '...',
        confidence: r.confidence,
      }));

    return {
      achieved: avgConfidence >= 0.7 && disagreements.length === 0,
      score: avgConfidence,
      disagreements,
    };
  }

  /**
   * Synthesize final output from all agent results
   */
  private synthesizeFinalOutput(
    results: AgentExecutionResult[],
    _task: TaskDefinition
  ): string {
    // Find synthesizer output if available
    const synthesizerResult = results.find((r) => r.role === 'synthesizer' && r.success);
    if (synthesizerResult) {
      return synthesizerResult.output;
    }

    // Otherwise, combine outputs
    const successfulOutputs = results
      .filter((r) => r.success)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);

    return successfulOutputs
      .map((r) => `[${r.role}] (confidence: ${(r.confidence * 100).toFixed(1)}%)\n${r.output}`)
      .join('\n\n---\n\n');
  }

  /**
   * Extract issues from verifier output
   */
  private extractIssues(output: string): string[] {
    const issuePatterns = [
      /issue[:\s]+(.+?)(?:\n|$)/gi,
      /warning[:\s]+(.+?)(?:\n|$)/gi,
      /concern[:\s]+(.+?)(?:\n|$)/gi,
      /problem[:\s]+(.+?)(?:\n|$)/gi,
    ];

    const issues: string[] = [];
    for (const pattern of issuePatterns) {
      const matches = output.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          issues.push(match[1].trim());
        }
      }
    }

    return issues;
  }
}

// ============================================================================
// SPECIALIZED AGENT FUNCTIONS
// ============================================================================

/**
 * Generate visual code using the visualizer agent
 */
export async function generateVisualCode(
  request: VisualCodeRequest
): Promise<VisualCodeResult> {
  const agent = new Agent({
    id: `visualizer_${Date.now()}`,
    name: 'Visual Code Generator',
    role: 'visualizer',
    model: 'gpt-4-turbo',
    temperature: 0.6,
    maxTokens: 8192,
    systemPrompt: `You are an expert visual code generator. Generate clean, performant code for:
- React components with TypeScript
- Three.js/React Three Fiber for 3D
- Canvas 2D for high-performance animations
- SVG for vector graphics

Guidelines:
- Use 'use client' for client components
- Optimize for 60fps animations
- Include proper TypeScript types
- Add performance comments for complex operations
- Use requestAnimationFrame for animations

Output format:
\`\`\`typescript
// Component code here
\`\`\`

DEPENDENCIES: package1, package2

EXPLANATION:
Brief explanation of the code

PERFORMANCE_NOTES:
- Note 1
- Note 2`,
    tools: [],
    communicationMode: 'full_text',
    priority: 1,
    timeout: 60000,
  });

  const input = `Generate a ${request.componentType} component for ${request.framework}.

Description: ${request.description}

${request.existingCode ? `Existing code to improve/fix:\n\`\`\`\n${request.existingCode}\n\`\`\`` : ''}

${request.debugMode ? 'This is in DEBUG mode - focus on finding and fixing issues.' : ''}

Constraints:
- Performance: ${request.constraints?.performance || 'high'}
- Accessibility: ${request.constraints?.accessibility ? 'Required' : 'Optional'}`;

  const result = await agent.execute(input);

  if (!result.success) {
    throw new Error(`Visual code generation failed: ${result.error}`);
  }

  // Parse the output
  const codeMatch = result.output.match(/```(?:typescript|tsx|jsx|javascript)?\n([\s\S]*?)```/);
  const code = codeMatch ? codeMatch[1].trim() : result.output;

  const depsMatch = result.output.match(/DEPENDENCIES:\s*(.+)/);
  const dependencies = depsMatch
    ? depsMatch[1].split(',').map((d) => d.trim())
    : [];

  const explanationMatch = result.output.match(/EXPLANATION:\s*([\s\S]*?)(?:PERFORMANCE_NOTES:|$)/);
  const explanation = explanationMatch ? explanationMatch[1].trim() : '';

  const perfMatch = result.output.match(/PERFORMANCE_NOTES:\s*([\s\S]*?)$/);
  const performanceNotes = perfMatch
    ? perfMatch[1]
        .split('\n')
        .filter((line) => line.trim().startsWith('-'))
        .map((line) => line.replace(/^-\s*/, '').trim())
    : [];

  return {
    code,
    language: 'typescript',
    componentName: request.componentType.charAt(0).toUpperCase() + request.componentType.slice(1),
    dependencies,
    explanation,
    performanceNotes,
  };
}

/**
 * Verify a claim using the Pigeon Paradox principle
 */
export async function verifyWithPigeonParadox(
  request: VerificationRequest
): Promise<VerificationResult> {
  const agent = new Agent({
    id: `verifier_${Date.now()}`,
    name: 'Pigeon Paradox Verifier',
    role: 'verifier',
    model: 'gpt-4-turbo',
    temperature: 0.3,
    maxTokens: 4096,
    systemPrompt: `You are a verification agent implementing the Pigeon Paradox principle.

The Pigeon Paradox: AI reasons in high-dimensional space (~11,000+ dimensions),
but humans can only visualize 3 dimensions. Your job is to:

1. Verify claims using logical analysis
2. Translate high-dimensional reasoning into human-understandable terms
3. Flag any claims that rely on patterns humans cannot verify
4. Provide confidence scores with justification

Output format:
VERIFIED: [true/false]
CONFIDENCE: [0-100]
HIGH_DIM_SCORE: [internal confidence 0-100]
HUMAN_INTERPRETATION: [Plain language explanation]

CRITERIA_RESULTS:
- [Criterion 1]: [PASS/FAIL] - [Score] - [Explanation]
- [Criterion 2]: [PASS/FAIL] - [Score] - [Explanation]

WARNINGS:
- [Warning 1]
- [Warning 2]

RECOMMENDATIONS:
- [Recommendation 1]
- [Recommendation 2]`,
    tools: [],
    communicationMode: 'full_text',
    priority: 1,
    timeout: 30000,
  });

  const input = `Verify the following claim:

CLAIM: ${request.claim}

DOMAIN: ${request.context.domain}
${request.context.timeframe ? `TIMEFRAME: ${request.context.timeframe}` : ''}
ENTITIES: ${request.context.entities.join(', ')}

EVIDENCE:
${request.evidence.map((e, i) => `${i + 1}. [${e.source}] (confidence: ${e.confidence}): ${e.content}`).join('\n')}

VERIFICATION CRITERIA:
${request.verificationCriteria.map((c) => `- ${c.criterion} (weight: ${c.weight})`).join('\n')}`;

  const result = await agent.execute(input);

  if (!result.success) {
    return {
      verified: false,
      confidence: 0,
      highDimScore: 0,
      humanInterpretation: `Verification failed: ${result.error}`,
      criteriaResults: [],
      warnings: ['Verification process encountered an error'],
      recommendations: ['Retry verification or manually review'],
    };
  }

  // Parse output
  const output = result.output;

  const verifiedMatch = output.match(/VERIFIED:\s*(true|false)/i);
  const verified = verifiedMatch ? verifiedMatch[1].toLowerCase() === 'true' : false;

  const confidenceMatch = output.match(/CONFIDENCE:\s*(\d+)/);
  const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) / 100 : result.confidence;

  const highDimMatch = output.match(/HIGH_DIM_SCORE:\s*(\d+)/);
  const highDimScore = highDimMatch ? parseInt(highDimMatch[1]) / 100 : confidence;

  const interpretationMatch = output.match(/HUMAN_INTERPRETATION:\s*(.+?)(?=\n\n|CRITERIA_RESULTS|$)/s);
  const humanInterpretation = interpretationMatch ? interpretationMatch[1].trim() : '';

  // Parse criteria results
  const criteriaSection = output.match(/CRITERIA_RESULTS:\s*([\s\S]*?)(?=WARNINGS|$)/);
  const criteriaResults = criteriaSection
    ? criteriaSection[1]
        .split('\n')
        .filter((line) => line.trim().startsWith('-'))
        .map((line) => {
          const match = line.match(/-\s*\[(.+?)\]:\s*\[(PASS|FAIL)\]\s*-\s*(\d+)\s*-\s*(.+)/i);
          if (match) {
            return {
              criterion: match[1],
              passed: match[2].toUpperCase() === 'PASS',
              score: parseInt(match[3]) / 100,
              explanation: match[4].trim(),
            };
          }
          return null;
        })
        .filter((r): r is NonNullable<typeof r> => r !== null)
    : [];

  // Parse warnings
  const warningsSection = output.match(/WARNINGS:\s*([\s\S]*?)(?=RECOMMENDATIONS|$)/);
  const warnings = warningsSection
    ? warningsSection[1]
        .split('\n')
        .filter((line) => line.trim().startsWith('-'))
        .map((line) => line.replace(/^-\s*/, '').trim())
    : [];

  // Parse recommendations
  const recsSection = output.match(/RECOMMENDATIONS:\s*([\s\S]*?)$/);
  const recommendations = recsSection
    ? recsSection[1]
        .split('\n')
        .filter((line) => line.trim().startsWith('-'))
        .map((line) => line.replace(/^-\s*/, '').trim())
    : [];

  return {
    verified,
    confidence,
    highDimScore,
    humanInterpretation,
    criteriaResults,
    warnings,
    recommendations,
  };
}

/**
 * Execute a market analysis using the full multi-agent system
 */
export async function analyzeMarket(
  query: string,
  pool: Pool
): Promise<MultiAgentResult> {
  const orchestrator = new MultiAgentOrchestrator(pool);

  // First, enhance the query with RAG
  const ragResults = await latentRAG(query, pool, { numQueries: 3 });

  // Build task with RAG context
  const task: TaskDefinition = {
    id: `market_analysis_${Date.now()}`,
    type: 'market_analysis',
    description: `${query}

Context from knowledge base:
${ragResults.documents.slice(0, 3).map((d) => `- ${d.content.slice(0, 500)}...`).join('\n')}`,
    input: { query, ragDocuments: ragResults.documents },
    requiredAgents: ['researcher', 'debater', 'critic', 'synthesizer', 'verifier'],
    config: {
      maxIterations: 3,
      consensusThreshold: 0.7,
      enableLatentComm: true,
      parallelExecution: true,
      timeout: 120000,
    },
  };

  return orchestrator.execute(task);
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  Agent,
  MultiAgentOrchestrator,
  generateVisualCode,
  verifyWithPigeonParadox,
  analyzeMarket,
};

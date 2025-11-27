/**
 * Multi-Agent Evolution API Endpoint
 *
 * REST API for the evolved transformer multi-agent system.
 * Supports market analysis, visual code generation, and verification.
 *
 * @module api/agent/evolve
 */

import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { pool } from '@/db';
import {
  MultiAgentOrchestrator,
  generateVisualCode,
  verifyWithPigeonParadox,
  analyzeMarket,
} from '@/lib/agents/multi-agent';
import {
  TaskDefinition,
  VisualCodeRequest,
  VerificationRequest,
  TASK_TEMPLATES,
} from '@/lib/agents/types';

// ============================================================================
// TYPES
// ============================================================================

interface EvolveRequest {
  action: 'analyze' | 'generate_visual' | 'verify' | 'custom_task';
  payload: Record<string, any>;
}

// ============================================================================
// POST - Execute Multi-Agent Task
// ============================================================================

/**
 * Execute a multi-agent task
 *
 * @route POST /api/agent/evolve
 *
 * @body {string} action - Task type: 'analyze' | 'generate_visual' | 'verify' | 'custom_task'
 * @body {object} payload - Task-specific payload
 *
 * @returns {object} Multi-agent execution result
 *
 * @example Market Analysis
 * ```bash
 * curl -X POST /api/agent/evolve \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "action": "analyze",
 *     "payload": { "query": "Will vintage Pokemon cards increase in value?" }
 *   }'
 * ```
 *
 * @example Visual Code Generation
 * ```bash
 * curl -X POST /api/agent/evolve \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "action": "generate_visual",
 *     "payload": {
 *       "description": "Create a starfield animation with shooting stars",
 *       "componentType": "starfield",
 *       "framework": "react"
 *     }
 *   }'
 * ```
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: EvolveRequest = await request.json();
    const { action, payload } = body;

    if (!action || !payload) {
      return NextResponse.json(
        { success: false, error: 'Action and payload are required' },
        { status: 400 }
      );
    }

    let result: any;

    switch (action) {
      case 'analyze':
        result = await handleAnalyze(payload);
        break;

      case 'generate_visual':
        result = await handleGenerateVisual(payload);
        break;

      case 'verify':
        result = await handleVerify(payload);
        break;

      case 'custom_task':
        result = await handleCustomTask(payload);
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      data: result,
      metadata: {
        apiLatencyMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { api: 'agent-evolve', method: 'POST' },
    });

    console.error('[AGENT_EVOLVE_API_ERROR]', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        latencyMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * Handle market analysis request
 */
async function handleAnalyze(payload: {
  query: string;
  options?: {
    maxIterations?: number;
    consensusThreshold?: number;
  };
}): Promise<any> {
  const { query, options } = payload;

  if (!query || typeof query !== 'string') {
    throw new Error('Query is required for analysis');
  }

  return analyzeMarket(query, pool);
}

/**
 * Handle visual code generation request
 */
async function handleGenerateVisual(payload: VisualCodeRequest): Promise<any> {
  if (!payload.description || !payload.componentType || !payload.framework) {
    throw new Error('description, componentType, and framework are required');
  }

  return generateVisualCode(payload);
}

/**
 * Handle verification request
 */
async function handleVerify(payload: VerificationRequest): Promise<any> {
  if (!payload.claim || !payload.evidence || !payload.context) {
    throw new Error('claim, evidence, and context are required');
  }

  return verifyWithPigeonParadox(payload);
}

/**
 * Handle custom task request
 */
async function handleCustomTask(payload: {
  task: Partial<TaskDefinition>;
}): Promise<any> {
  const { task } = payload;

  if (!task || !task.type || !task.description) {
    throw new Error('Task with type and description is required');
  }

  // Merge with template if available
  const template = TASK_TEMPLATES[task.type] || {};
  const fullTask: TaskDefinition = {
    id: task.id || `custom_${Date.now()}`,
    type: task.type,
    description: task.description,
    input: task.input || {},
    requiredAgents: task.requiredAgents || template.requiredAgents || ['researcher', 'synthesizer'],
    config: {
      ...template.config,
      ...task.config,
    },
  };

  const orchestrator = new MultiAgentOrchestrator(pool);
  return orchestrator.execute(fullTask);
}

// ============================================================================
// GET - Get Available Actions and Templates
// ============================================================================

/**
 * Get available actions and task templates
 *
 * @route GET /api/agent/evolve
 *
 * @returns {object} Available actions and templates
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      actions: [
        {
          name: 'analyze',
          description: 'Execute market analysis using multi-agent system',
          requiredFields: ['query'],
          optionalFields: ['options.maxIterations', 'options.consensusThreshold'],
        },
        {
          name: 'generate_visual',
          description: 'Generate visual code (React, Three.js, Canvas)',
          requiredFields: ['description', 'componentType', 'framework'],
          optionalFields: ['existingCode', 'debugMode', 'constraints'],
        },
        {
          name: 'verify',
          description: 'Verify claims using Pigeon Paradox principle',
          requiredFields: ['claim', 'evidence', 'context'],
          optionalFields: ['verificationCriteria'],
        },
        {
          name: 'custom_task',
          description: 'Execute a custom multi-agent task',
          requiredFields: ['task.type', 'task.description'],
          optionalFields: ['task.requiredAgents', 'task.config'],
        },
      ],
      templates: Object.entries(TASK_TEMPLATES).map(([key, template]) => ({
        name: key,
        type: template.type,
        requiredAgents: template.requiredAgents,
        config: template.config,
      })),
      agentRoles: [
        { role: 'debater', description: 'Analyzes market perspectives, generates arguments' },
        { role: 'visualizer', description: 'Generates visual code, UI components' },
        { role: 'verifier', description: 'Validates claims, checks consistency' },
        { role: 'researcher', description: 'Deep research via RAG queries' },
        { role: 'synthesizer', description: 'Combines insights from multiple agents' },
        { role: 'critic', description: 'Provides contrarian viewpoints' },
      ],
    },
  });
}

/**
 * DDIL Simulation API
 *
 * Endpoints for simulating DDIL (Denied, Degraded, Intermittent, Limited) conditions.
 * Used for testing application resilience.
 *
 * Implements pack-ai-defense-001 §3.1
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  simulateDDIL,
  endDDILSimulation,
  type DDILSimulationConfig,
  type NodeStatus,
} from '@/lib/defense';

// Store active simulations (in production, use Redis)
const activeSimulations = new Map<string, Map<string, NodeStatus>>();

/**
 * POST /api/defense/simulate-ddil
 *
 * Start a DDIL simulation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate scenario
    const validScenarios = ['intermittent', 'limited', 'denied', 'degraded'];
    if (!body.scenario || !validScenarios.includes(body.scenario)) {
      return NextResponse.json(
        { error: `Invalid scenario. Must be one of: ${validScenarios.join(', ')}` },
        { status: 400 }
      );
    }

    const config: DDILSimulationConfig = {
      targetNodes: body.targetNodes,
      scenario: body.scenario,
      durationMs: body.durationMs ?? 60000, // Default 1 minute
      intensity: Math.min(Math.max(body.intensity ?? 0.5, 0), 1), // Clamp 0-1
    };

    // Limit duration to prevent accidental long simulations
    if (config.durationMs > 300000) { // 5 minutes max
      return NextResponse.json(
        { error: 'Duration cannot exceed 5 minutes (300000ms)' },
        { status: 400 }
      );
    }

    const result = await simulateDDIL(config);

    // Store simulation state for potential manual end
    const simulationId = `sim_${Date.now()}`;
    activeSimulations.set(simulationId, result.previousStates);

    // Auto-cleanup after duration
    setTimeout(() => {
      activeSimulations.delete(simulationId);
    }, config.durationMs + 5000);

    return NextResponse.json({
      simulationId,
      scenario: config.scenario,
      durationMs: config.durationMs,
      affectedNodes: result.affectedNodes,
      message: `DDIL simulation started. ${result.affectedNodes.length} nodes affected.`,
    });
  } catch (error) {
    console.error('Error starting DDIL simulation:', error);
    return NextResponse.json(
      { error: 'Failed to start simulation' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/defense/simulate-ddil
 *
 * End an active DDIL simulation early
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const simulationId = searchParams.get('simulationId');

    if (!simulationId) {
      return NextResponse.json(
        { error: 'simulationId is required' },
        { status: 400 }
      );
    }

    const previousStates = activeSimulations.get(simulationId);

    if (!previousStates) {
      return NextResponse.json(
        { error: 'Simulation not found or already ended' },
        { status: 404 }
      );
    }

    await endDDILSimulation(previousStates);
    activeSimulations.delete(simulationId);

    return NextResponse.json({
      message: 'Simulation ended successfully',
      restoredNodes: Array.from(previousStates.keys()),
    });
  } catch (error) {
    console.error('Error ending DDIL simulation:', error);
    return NextResponse.json(
      { error: 'Failed to end simulation' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/defense/simulate-ddil
 *
 * Get active simulations
 */
export async function GET() {
  try {
    const simulations = Array.from(activeSimulations.entries()).map(([id, states]) => ({
      simulationId: id,
      affectedNodeCount: states.size,
    }));

    return NextResponse.json({ simulations });
  } catch (error) {
    console.error('Error fetching simulations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch simulations' },
      { status: 500 }
    );
  }
}

/**
 * 3D Simulation API Routes
 *
 * REST endpoints for 3D world state management.
 * Works alongside WebSocket for real-time updates.
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// TYPES
// ============================================================================

interface WorldStateUpdate {
  userId: string;
  worldId: string;
  heroPosition?: [number, number, number];
  heroRotation?: [number, number, number];
  heroStats?: Record<string, number>;
  cardsInView?: string[];
}

interface SimulationCommand {
  type: 'spawn' | 'despawn' | 'move' | 'interact' | 'battle' | 'weather';
  targetId?: string;
  position?: [number, number, number];
  params?: Record<string, unknown>;
}

// In-memory state (use Redis/DB in production)
const worldStates = new Map<string, WorldStateUpdate>();
const activeSims = new Map<string, { startTime: number; type: string }>();

// ============================================================================
// POST - World Operations
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'update-state': {
        const { userId, worldId, heroPosition, heroRotation, heroStats, cardsInView } = body;

        if (!userId || !worldId) {
          return NextResponse.json({ error: 'userId and worldId required' }, { status: 400 });
        }

        const stateKey = `${userId}:${worldId}`;
        const existingState = worldStates.get(stateKey) || { userId, worldId };

        const updatedState: WorldStateUpdate = {
          ...existingState,
          ...(heroPosition && { heroPosition }),
          ...(heroRotation && { heroRotation }),
          ...(heroStats && { heroStats }),
          ...(cardsInView && { cardsInView }),
        };

        worldStates.set(stateKey, updatedState);

        return NextResponse.json({
          success: true,
          state: updatedState,
          timestamp: Date.now(),
        });
      }

      case 'start-sim': {
        const { userId, worldId, simType, params } = body;

        if (!userId || !worldId || !simType) {
          return NextResponse.json(
            { error: 'userId, worldId, and simType required' },
            { status: 400 }
          );
        }

        const simKey = `${userId}:${worldId}`;

        if (activeSims.has(simKey)) {
          return NextResponse.json({
            success: false,
            message: 'Simulation already running',
          });
        }

        activeSims.set(simKey, { startTime: Date.now(), type: simType });

        return NextResponse.json({
          success: true,
          simId: simKey,
          simType,
          startTime: Date.now(),
        });
      }

      case 'stop-sim': {
        const { userId, worldId } = body;
        const simKey = `${userId}:${worldId}`;

        const sim = activeSims.get(simKey);
        if (!sim) {
          return NextResponse.json({
            success: false,
            message: 'No active simulation',
          });
        }

        const duration = Date.now() - sim.startTime;
        activeSims.delete(simKey);

        return NextResponse.json({
          success: true,
          duration,
          simType: sim.type,
        });
      }

      case 'execute-command': {
        const { userId, worldId, command } = body as {
          userId: string;
          worldId: string;
          command: SimulationCommand;
        };

        if (!userId || !worldId || !command) {
          return NextResponse.json(
            { error: 'userId, worldId, and command required' },
            { status: 400 }
          );
        }

        // Process command
        const result = processSimCommand(command);

        return NextResponse.json({
          success: result.success,
          command: command.type,
          result: result.data,
        });
      }

      case 'spawn-card': {
        const { worldId, cardId, position, rotation } = body;

        if (!worldId || !cardId || !position) {
          return NextResponse.json(
            { error: 'worldId, cardId, and position required' },
            { status: 400 }
          );
        }

        const spawnedCard = {
          id: `card-${Date.now()}`,
          cardId,
          worldId,
          position,
          rotation: rotation || [0, 0, 0],
          spawnedAt: Date.now(),
        };

        return NextResponse.json({
          success: true,
          card: spawnedCard,
        });
      }

      case 'trigger-event': {
        const { worldId, eventType, epicenter, radius, duration } = body;

        if (!worldId || !eventType) {
          return NextResponse.json({ error: 'worldId and eventType required' }, { status: 400 });
        }

        const event = {
          id: `event-${Date.now()}`,
          worldId,
          eventType,
          epicenter: epicenter || [0, 0, 0],
          radius: radius || 10,
          duration: duration || 60,
          startTime: Date.now(),
          status: 'active',
        };

        return NextResponse.json({
          success: true,
          event,
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('3D Sim API error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

// ============================================================================
// GET - Query State
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const userId = searchParams.get('userId');
    const worldId = searchParams.get('worldId');

    switch (type) {
      case 'state':
        if (!userId || !worldId) {
          return NextResponse.json({ error: 'userId and worldId required' }, { status: 400 });
        }

        const stateKey = `${userId}:${worldId}`;
        const state = worldStates.get(stateKey);

        return NextResponse.json({
          success: true,
          state: state || null,
        });

      case 'active-sims':
        const sims = Array.from(activeSims.entries()).map(([key, sim]) => ({
          simId: key,
          ...sim,
          runningTime: Date.now() - sim.startTime,
        }));

        return NextResponse.json({
          success: true,
          simulations: sims,
        });

      case 'world-info':
        return NextResponse.json({
          success: true,
          info: {
            zones: ['market', 'arena', 'wilderness', 'city', 'quantum'],
            maxPlayers: 100,
            features: ['battles', 'trading', 'quests', 'events'],
            physics: 'hybrid', // Three.js + Omniverse
          },
        });

      default:
        return NextResponse.json(
          { error: 'Invalid type. Use: state, active-sims, or world-info' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('3D Sim GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function processSimCommand(command: SimulationCommand): { success: boolean; data: unknown } {
  switch (command.type) {
    case 'spawn':
      return {
        success: true,
        data: {
          spawnedAt: command.position || [0, 0, 0],
          targetId: command.targetId,
        },
      };

    case 'despawn':
      return {
        success: true,
        data: { removed: command.targetId },
      };

    case 'move':
      return {
        success: true,
        data: {
          targetId: command.targetId,
          newPosition: command.position,
        },
      };

    case 'interact':
      return {
        success: true,
        data: {
          targetId: command.targetId,
          interaction: command.params?.action || 'default',
        },
      };

    case 'battle':
      // Would trigger battle system
      return {
        success: true,
        data: {
          battleId: `battle-${Date.now()}`,
          participants: command.params?.participants || [],
        },
      };

    case 'weather':
      return {
        success: true,
        data: {
          weatherType: command.params?.weatherType || 'clear',
          duration: command.params?.duration || 300,
        },
      };

    default:
      return { success: false, data: { error: 'Unknown command type' } };
  }
}

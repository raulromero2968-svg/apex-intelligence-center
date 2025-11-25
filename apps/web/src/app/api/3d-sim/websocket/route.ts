/**
 * 3D Simulation WebSocket API
 *
 * Real-time bidirectional communication for 3D world simulation.
 * Handles player movement, card spawning, battles, and world events.
 *
 * Protocol:
 * - Client sends: { type: string, payload: any }
 * - Server sends: { type: string, payload: any, timestamp: number }
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// TYPES
// ============================================================================

interface WebSocketMessage {
  type: string;
  payload: unknown;
  clientId?: string;
  timestamp?: number;
}

interface PlayerState {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  health: number;
  zone: string;
  lastUpdate: number;
}

interface WorldEvent {
  id: string;
  type: string;
  position: [number, number, number];
  radius: number;
  data: Record<string, unknown>;
  startTime: number;
  duration: number;
}

// ============================================================================
// STATE MANAGEMENT (In-memory for demo, use Redis in production)
// ============================================================================

const connectedPlayers = new Map<string, PlayerState>();
const activeWorldEvents = new Map<string, WorldEvent>();
const worldState = {
  time: 0, // World time in seconds
  weather: 'clear' as string,
  activeQuests: [] as string[],
  spawnedCards: new Map<string, { cardId: string; position: [number, number, number] }>(),
};

// Message handlers registry
type MessageHandler = (clientId: string, payload: unknown) => WebSocketResponse;

interface WebSocketResponse {
  broadcast?: boolean;
  response: WebSocketMessage;
  additionalBroadcasts?: WebSocketMessage[];
}

const messageHandlers: Record<string, MessageHandler> = {
  // Player joins world
  join: (clientId, payload) => {
    const { position, zone } = payload as { position?: [number, number, number]; zone?: string };

    const playerState: PlayerState = {
      id: clientId,
      position: position || [0, 0, 0],
      rotation: [0, 0, 0],
      health: 100,
      zone: zone || 'market',
      lastUpdate: Date.now(),
    };

    connectedPlayers.set(clientId, playerState);

    return {
      broadcast: true,
      response: {
        type: 'player_joined',
        payload: {
          playerId: clientId,
          state: playerState,
          playerCount: connectedPlayers.size,
        },
      },
    };
  },

  // Player leaves world
  leave: (clientId) => {
    connectedPlayers.delete(clientId);

    return {
      broadcast: true,
      response: {
        type: 'player_left',
        payload: {
          playerId: clientId,
          playerCount: connectedPlayers.size,
        },
      },
    };
  },

  // Player position update
  move: (clientId, payload) => {
    const { position, rotation } = payload as {
      position: [number, number, number];
      rotation?: [number, number, number];
    };

    const player = connectedPlayers.get(clientId);
    if (player) {
      player.position = position;
      if (rotation) player.rotation = rotation;
      player.lastUpdate = Date.now();

      // Check zone transition
      const newZone = getZoneAtPosition(position);
      const zoneChanged = newZone !== player.zone;
      if (zoneChanged) {
        player.zone = newZone;
      }

      return {
        broadcast: true,
        response: {
          type: 'player_moved',
          payload: {
            playerId: clientId,
            position,
            rotation: player.rotation,
            zone: player.zone,
            zoneChanged,
          },
        },
      };
    }

    return {
      broadcast: false,
      response: {
        type: 'error',
        payload: { message: 'Player not found' },
      },
    };
  },

  // Get nearby players
  get_nearby: (clientId, payload) => {
    const { radius } = (payload as { radius?: number }) || {};
    const searchRadius = radius || 50;

    const player = connectedPlayers.get(clientId);
    if (!player) {
      return {
        broadcast: false,
        response: {
          type: 'error',
          payload: { message: 'Player not found' },
        },
      };
    }

    const nearbyPlayers: PlayerState[] = [];
    for (const [id, state] of connectedPlayers) {
      if (id !== clientId) {
        const distance = calculateDistance(player.position, state.position);
        if (distance <= searchRadius) {
          nearbyPlayers.push(state);
        }
      }
    }

    return {
      broadcast: false,
      response: {
        type: 'nearby_players',
        payload: {
          players: nearbyPlayers,
          count: nearbyPlayers.length,
        },
      },
    };
  },

  // Spawn card in world
  spawn_card: (clientId, payload) => {
    const { cardId, position } = payload as {
      cardId: string;
      position: [number, number, number];
    };

    const spawnId = `spawn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    worldState.spawnedCards.set(spawnId, { cardId, position });

    return {
      broadcast: true,
      response: {
        type: 'card_spawned',
        payload: {
          spawnId,
          cardId,
          position,
          spawnedBy: clientId,
        },
      },
    };
  },

  // Collect card from world
  collect_card: (clientId, payload) => {
    const { spawnId } = payload as { spawnId: string };

    const card = worldState.spawnedCards.get(spawnId);
    if (!card) {
      return {
        broadcast: false,
        response: {
          type: 'error',
          payload: { message: 'Card not found' },
        },
      };
    }

    worldState.spawnedCards.delete(spawnId);

    return {
      broadcast: true,
      response: {
        type: 'card_collected',
        payload: {
          spawnId,
          cardId: card.cardId,
          collectedBy: clientId,
        },
      },
    };
  },

  // Initiate battle
  battle_request: (clientId, payload) => {
    const { targetPlayerId, battleType } = payload as {
      targetPlayerId: string;
      battleType: 'duel' | 'team' | 'tournament';
    };

    const challenger = connectedPlayers.get(clientId);
    const target = connectedPlayers.get(targetPlayerId);

    if (!challenger || !target) {
      return {
        broadcast: false,
        response: {
          type: 'error',
          payload: { message: 'One or both players not found' },
        },
      };
    }

    const distance = calculateDistance(challenger.position, target.position);
    if (distance > 20) {
      return {
        broadcast: false,
        response: {
          type: 'error',
          payload: { message: 'Players too far apart for battle' },
        },
      };
    }

    const battleId = `battle-${Date.now()}`;

    return {
      broadcast: false,
      response: {
        type: 'battle_requested',
        payload: {
          battleId,
          challengerId: clientId,
          targetId: targetPlayerId,
          battleType,
        },
        clientId: targetPlayerId, // Send to target
      },
      additionalBroadcasts: [
        {
          type: 'battle_pending',
          payload: { battleId, targetId: targetPlayerId },
          clientId, // Send to challenger
        },
      ],
    };
  },

  // Trigger world event
  trigger_event: (clientId, payload) => {
    const { eventType, position, radius, duration, data } = payload as {
      eventType: string;
      position: [number, number, number];
      radius: number;
      duration: number;
      data?: Record<string, unknown>;
    };

    const eventId = `event-${Date.now()}`;
    const event: WorldEvent = {
      id: eventId,
      type: eventType,
      position,
      radius: radius || 50,
      data: data || {},
      startTime: Date.now(),
      duration: duration || 60000,
    };

    activeWorldEvents.set(eventId, event);

    // Auto-cleanup after duration
    setTimeout(() => {
      activeWorldEvents.delete(eventId);
    }, event.duration);

    return {
      broadcast: true,
      response: {
        type: 'world_event',
        payload: {
          event,
          triggeredBy: clientId,
        },
      },
    };
  },

  // Change weather
  set_weather: (_clientId, payload) => {
    const { weather } = payload as { weather: string };

    const validWeathers = ['clear', 'cloudy', 'rain', 'storm', 'fog', 'quantum'];
    if (!validWeathers.includes(weather)) {
      return {
        broadcast: false,
        response: {
          type: 'error',
          payload: { message: 'Invalid weather type' },
        },
      };
    }

    worldState.weather = weather;

    return {
      broadcast: true,
      response: {
        type: 'weather_changed',
        payload: {
          weather,
          timestamp: Date.now(),
        },
      },
    };
  },

  // Sync world state
  sync: (clientId) => {
    const player = connectedPlayers.get(clientId);

    return {
      broadcast: false,
      response: {
        type: 'world_sync',
        payload: {
          worldTime: worldState.time,
          weather: worldState.weather,
          playerCount: connectedPlayers.size,
          activeEvents: Array.from(activeWorldEvents.values()),
          spawnedCards: Array.from(worldState.spawnedCards.entries()).map(([id, card]) => ({
            spawnId: id,
            ...card,
          })),
          playerState: player,
        },
      },
    };
  },

  // Heartbeat/ping
  ping: (clientId) => {
    return {
      broadcast: false,
      response: {
        type: 'pong',
        payload: {
          serverTime: Date.now(),
          clientId,
        },
      },
    };
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateDistance(
  pos1: [number, number, number],
  pos2: [number, number, number]
): number {
  const dx = pos1[0] - pos2[0];
  const dy = pos1[1] - pos2[1];
  const dz = pos1[2] - pos2[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function getZoneAtPosition(position: [number, number, number]): string {
  // Simple zone detection based on position quadrants
  const [x, _y, z] = position;

  if (x >= -50 && x <= 50 && z >= -50 && z <= 50) return 'market';
  if (x > 50 && x <= 150 && z > 50 && z <= 150) return 'arena';
  if (x < -50 || z > 150) return 'wilderness';
  if (x > 150) return 'city';
  if (position[1] > 30) return 'quantum'; // Elevated areas

  return 'market';
}

function processMessage(clientId: string, message: WebSocketMessage): WebSocketResponse {
  const handler = messageHandlers[message.type];

  if (!handler) {
    return {
      broadcast: false,
      response: {
        type: 'error',
        payload: { message: `Unknown message type: ${message.type}` },
      },
    };
  }

  return handler(clientId, message.payload);
}

// ============================================================================
// HTTP ENDPOINT (WebSocket upgrade simulation)
// ============================================================================

/**
 * POST endpoint to simulate WebSocket messages
 * In production, use actual WebSocket with Edge Runtime or separate WS server
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, message } = body as { clientId: string; message: WebSocketMessage };

    if (!clientId || !message) {
      return NextResponse.json(
        { error: 'clientId and message required' },
        { status: 400 }
      );
    }

    const result = processMessage(clientId, message);

    return NextResponse.json({
      success: true,
      ...result.response,
      timestamp: Date.now(),
      broadcast: result.broadcast,
      additionalBroadcasts: result.additionalBroadcasts,
    });
  } catch (error) {
    console.error('WebSocket API error:', error);
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
}

/**
 * GET endpoint for world state polling
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');
  const type = searchParams.get('type') || 'sync';

  if (!clientId) {
    return NextResponse.json({ error: 'clientId required' }, { status: 400 });
  }

  const result = processMessage(clientId, { type, payload: {} });

  return NextResponse.json({
    success: true,
    ...result.response,
    timestamp: Date.now(),
  });
}

// ============================================================================
// EXPORTS FOR TESTING
// ============================================================================

export const __testing = {
  connectedPlayers,
  activeWorldEvents,
  worldState,
  processMessage,
  calculateDistance,
  getZoneAtPosition,
};

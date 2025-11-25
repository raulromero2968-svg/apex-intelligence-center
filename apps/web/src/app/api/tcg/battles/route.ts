/**
 * TCG Battles API Routes
 *
 * Turn-based card battle simulation endpoints.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createBattle,
  playCard,
  attackWithCard,
  useAbility,
  endTurn,
  getAiAction,
  calculateBattleResult,
  type BattleCard,
  type BattleState,
} from '@/lib/tcg-domains';

// In-memory battle storage (use database in production)
const activeBattles = new Map<string, BattleState>();

/**
 * POST /api/tcg/battles
 * Battle operations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create': {
        const { player1, player2, options } = body as {
          player1: { id: string; name: string; deck: BattleCard[] };
          player2: { id: string; name: string; deck: BattleCard[] };
          options?: {
            weatherBoost?: { element: string; modifier: number };
            locationBoost?: { element: string; modifier: number };
          };
        };

        if (!player1 || !player2) {
          return NextResponse.json(
            { error: 'player1 and player2 required' },
            { status: 400 }
          );
        }

        const battle = createBattle(player1, player2, options);
        activeBattles.set(battle.id, battle);

        return NextResponse.json({
          success: true,
          battle: {
            id: battle.id,
            phase: battle.phase,
            turn: battle.turn,
            activePlayerId: battle.activePlayerId,
            players: battle.players.map((p) => ({
              id: p.id,
              name: p.name,
              health: p.health,
              energy: p.energy,
              handCount: p.hand.length,
              fieldCount: p.field.length,
              deckCount: p.deck.length,
            })),
          },
        });
      }

      case 'play-card': {
        const { battleId, playerId, cardId } = body;

        const battle = activeBattles.get(battleId);
        if (!battle) {
          return NextResponse.json({ error: 'Battle not found' }, { status: 404 });
        }

        if (battle.activePlayerId !== playerId) {
          return NextResponse.json({ error: 'Not your turn' }, { status: 400 });
        }

        const { state, result } = playCard(battle, playerId, cardId);
        activeBattles.set(battleId, state);

        return NextResponse.json({ success: result.success, result });
      }

      case 'attack': {
        const { battleId, playerId, attackerCardId, targetCardId } = body;

        const battle = activeBattles.get(battleId);
        if (!battle) {
          return NextResponse.json({ error: 'Battle not found' }, { status: 404 });
        }

        if (battle.activePlayerId !== playerId) {
          return NextResponse.json({ error: 'Not your turn' }, { status: 400 });
        }

        const { state, result } = attackWithCard(battle, playerId, attackerCardId, targetCardId);
        activeBattles.set(battleId, state);

        // Check for battle end
        if (state.phase === 'finished' && state.winner) {
          const battleResult = calculateBattleResult(state);
          return NextResponse.json({
            success: result.success,
            result,
            battleEnded: true,
            battleResult,
          });
        }

        return NextResponse.json({ success: result.success, result });
      }

      case 'use-ability': {
        const { battleId, playerId, cardId, abilityId, targetCardId } = body;

        const battle = activeBattles.get(battleId);
        if (!battle) {
          return NextResponse.json({ error: 'Battle not found' }, { status: 404 });
        }

        if (battle.activePlayerId !== playerId) {
          return NextResponse.json({ error: 'Not your turn' }, { status: 400 });
        }

        const { state, result } = useAbility(battle, playerId, cardId, abilityId, targetCardId);
        activeBattles.set(battleId, state);

        return NextResponse.json({ success: result.success, result });
      }

      case 'end-turn': {
        const { battleId, playerId } = body;

        const battle = activeBattles.get(battleId);
        if (!battle) {
          return NextResponse.json({ error: 'Battle not found' }, { status: 404 });
        }

        if (battle.activePlayerId !== playerId) {
          return NextResponse.json({ error: 'Not your turn' }, { status: 400 });
        }

        const state = endTurn(battle, playerId);
        activeBattles.set(battleId, state);

        return NextResponse.json({
          success: true,
          turn: state.turn,
          activePlayerId: state.activePlayerId,
        });
      }

      case 'ai-action': {
        const { battleId, aiPlayerId } = body;

        const battle = activeBattles.get(battleId);
        if (!battle) {
          return NextResponse.json({ error: 'Battle not found' }, { status: 404 });
        }

        if (battle.activePlayerId !== aiPlayerId) {
          return NextResponse.json({ error: 'Not AI turn' }, { status: 400 });
        }

        const aiAction = getAiAction(battle, aiPlayerId);
        let result;
        let state = battle;

        switch (aiAction.actionType) {
          case 'play':
            ({ state, result } = playCard(state, aiPlayerId, aiAction.cardId!));
            break;
          case 'attack':
            ({ state, result } = attackWithCard(state, aiPlayerId, aiAction.cardId!, aiAction.targetCardId));
            break;
          case 'ability':
            ({ state, result } = useAbility(state, aiPlayerId, aiAction.cardId!, aiAction.abilityId!, aiAction.targetCardId));
            break;
          case 'end_turn':
            state = endTurn(state, aiPlayerId);
            result = { success: true, message: 'AI ended turn' };
            break;
        }

        activeBattles.set(battleId, state);

        if (state.phase === 'finished' && state.winner) {
          return NextResponse.json({
            success: true,
            aiAction,
            result,
            battleEnded: true,
            battleResult: calculateBattleResult(state),
          });
        }

        return NextResponse.json({ success: true, aiAction, result });
      }

      case 'get-state': {
        const { battleId, playerId } = body;

        const battle = activeBattles.get(battleId);
        if (!battle) {
          return NextResponse.json({ error: 'Battle not found' }, { status: 404 });
        }

        const player = battle.players.find((p) => p.id === playerId);
        const opponent = battle.players.find((p) => p.id !== playerId);

        if (!player || !opponent) {
          return NextResponse.json({ error: 'Player not found' }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          state: {
            id: battle.id,
            phase: battle.phase,
            turn: battle.turn,
            isYourTurn: battle.activePlayerId === playerId,
            you: {
              id: player.id,
              name: player.name,
              health: player.health,
              energy: player.energy,
              hand: player.hand,
              field: player.field,
              deckCount: player.deck.length,
              graveyardCount: player.graveyard.length,
            },
            opponent: {
              id: opponent.id,
              name: opponent.name,
              health: opponent.health,
              energy: opponent.energy,
              handCount: opponent.hand.length,
              field: opponent.field,
              deckCount: opponent.deck.length,
              graveyardCount: opponent.graveyard.length,
            },
            weatherBoost: battle.weatherBoost,
            locationBoost: battle.locationBoost,
          },
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing battle request:', error);
    return NextResponse.json(
      { error: 'Failed to process battle request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tcg/battles
 * Get battle info
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const battleId = searchParams.get('battleId');

    switch (type) {
      case 'battle':
        if (!battleId) {
          return NextResponse.json({ error: 'battleId required' }, { status: 400 });
        }

        const battle = activeBattles.get(battleId);
        if (!battle) {
          return NextResponse.json({ error: 'Battle not found' }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          battle: {
            id: battle.id,
            phase: battle.phase,
            turn: battle.turn,
            activePlayerId: battle.activePlayerId,
            winner: battle.winner,
            turnHistoryLength: battle.turnHistory.length,
          },
        });

      case 'active':
        return NextResponse.json({
          success: true,
          battles: Array.from(activeBattles.values()).map((b) => ({
            id: b.id,
            phase: b.phase,
            turn: b.turn,
            players: b.players.map((p) => ({ id: p.id, name: p.name })),
          })),
        });

      case 'history':
        if (!battleId) {
          return NextResponse.json({ error: 'battleId required' }, { status: 400 });
        }

        const historyBattle = activeBattles.get(battleId);
        if (!historyBattle) {
          return NextResponse.json({ error: 'Battle not found' }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          history: historyBattle.turnHistory,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid type. Use: battle, active, or history' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching battle info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch battle info' },
      { status: 500 }
    );
  }
}

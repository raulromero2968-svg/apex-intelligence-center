/**
 * TCG Battle Simulation
 *
 * Turn-based card battle mechanics for TCG gameplay.
 * Integrates with creature evolution and weather/location systems.
 *
 * Features:
 * - Turn-based combat system
 * - Element advantage calculations
 * - Ability and effect resolution
 * - Battle state management
 * - AI opponent logic
 */

// ============================================================================
// TYPES
// ============================================================================

export type BattlePhase = 'setup' | 'draw' | 'main' | 'combat' | 'end' | 'finished';
export type TargetType = 'self' | 'opponent' | 'ally' | 'enemy' | 'all' | 'random';
export type EffectType = 'damage' | 'heal' | 'buff' | 'debuff' | 'status' | 'special';

export interface BattleCard {
  id: string;
  name: string;
  element: string;
  attack: number;
  defense: number;
  health: number;
  maxHealth: number;
  speed: number;
  special: number;
  abilities: Ability[];
  statusEffects: StatusEffect[];
  isExhausted: boolean;
  position: 'hand' | 'field' | 'graveyard';
}

export interface Ability {
  id: string;
  name: string;
  description: string;
  cost: number; // Energy cost
  cooldown: number;
  currentCooldown: number;
  targetType: TargetType;
  effects: AbilityEffect[];
}

export interface AbilityEffect {
  type: EffectType;
  value: number;
  duration?: number;
  stat?: string;
  element?: string;
}

export interface StatusEffect {
  id: string;
  name: string;
  type: 'buff' | 'debuff' | 'neutral';
  stat?: string;
  value: number;
  duration: number;
  stackable: boolean;
}

export interface Player {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  deck: BattleCard[];
  hand: BattleCard[];
  field: BattleCard[];
  graveyard: BattleCard[];
}

export interface BattleState {
  id: string;
  phase: BattlePhase;
  turn: number;
  activePlayerId: string;
  players: [Player, Player];
  turnHistory: TurnAction[];
  weatherBoost?: { element: string; modifier: number };
  locationBoost?: { element: string; modifier: number };
  winner?: string;
  timestamp: Date;
}

export interface TurnAction {
  turn: number;
  playerId: string;
  actionType: 'draw' | 'play' | 'attack' | 'ability' | 'end_turn';
  sourceCardId?: string;
  targetCardId?: string;
  abilityId?: string;
  result: ActionResult;
}

export interface ActionResult {
  success: boolean;
  damage?: number;
  healing?: number;
  effects?: StatusEffect[];
  message: string;
}

export interface BattleResult {
  winnerId: string;
  loserId: string;
  turns: number;
  totalDamageDealt: Record<string, number>;
  cardsPlayed: Record<string, number>;
  abilitiesUsed: Record<string, number>;
  mvpCard?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const ELEMENT_ADVANTAGES: Record<string, string[]> = {
  fire: ['nature', 'air'],
  water: ['fire', 'earth'],
  earth: ['lightning', 'fire'],
  air: ['earth', 'nature'],
  lightning: ['water', 'air'],
  nature: ['water', 'earth'],
  dark: ['light', 'nature'],
  light: ['dark', 'fire'],
};

export const ELEMENT_DISADVANTAGES: Record<string, string[]> = {
  fire: ['water'],
  water: ['lightning', 'nature'],
  earth: ['water', 'air'],
  air: ['lightning'],
  lightning: ['earth'],
  nature: ['fire', 'air'],
  dark: ['light'],
  light: ['dark'],
};

export const ADVANTAGE_MULTIPLIER = 1.5;
export const DISADVANTAGE_MULTIPLIER = 0.75;
export const CRITICAL_HIT_CHANCE = 0.1;
export const CRITICAL_HIT_MULTIPLIER = 2.0;

export const MAX_FIELD_SIZE = 5;
export const STARTING_HAND_SIZE = 5;
export const MAX_HAND_SIZE = 10;
export const STARTING_ENERGY = 3;
export const ENERGY_PER_TURN = 1;
export const MAX_ENERGY = 10;

// ============================================================================
// BATTLE INITIALIZATION
// ============================================================================

/**
 * Create a new battle instance
 */
export function createBattle(
  player1: { id: string; name: string; deck: BattleCard[] },
  player2: { id: string; name: string; deck: BattleCard[] },
  options?: {
    weatherBoost?: { element: string; modifier: number };
    locationBoost?: { element: string; modifier: number };
  }
): BattleState {
  const initPlayer = (data: typeof player1): Player => ({
    id: data.id,
    name: data.name,
    health: 30,
    maxHealth: 30,
    energy: STARTING_ENERGY,
    maxEnergy: MAX_ENERGY,
    deck: shuffleDeck([...data.deck]),
    hand: [],
    field: [],
    graveyard: [],
  });

  const state: BattleState = {
    id: `battle-${Date.now()}`,
    phase: 'setup',
    turn: 0,
    activePlayerId: player1.id, // First player determined randomly in production
    players: [initPlayer(player1), initPlayer(player2)],
    turnHistory: [],
    weatherBoost: options?.weatherBoost,
    locationBoost: options?.locationBoost,
    timestamp: new Date(),
  };

  // Draw initial hands
  for (const player of state.players) {
    for (let i = 0; i < STARTING_HAND_SIZE; i++) {
      drawCard(player);
    }
  }

  state.phase = 'main';
  state.turn = 1;

  return state;
}

/**
 * Shuffle deck
 */
function shuffleDeck(deck: BattleCard[]): BattleCard[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Draw card from deck
 */
function drawCard(player: Player): BattleCard | null {
  if (player.deck.length === 0) return null;
  if (player.hand.length >= MAX_HAND_SIZE) return null;

  const card = player.deck.pop()!;
  card.position = 'hand';
  player.hand.push(card);
  return card;
}

// ============================================================================
// BATTLE ACTIONS
// ============================================================================

/**
 * Play card from hand to field
 */
export function playCard(
  state: BattleState,
  playerId: string,
  cardId: string
): { state: BattleState; result: ActionResult } {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { state, result: { success: false, message: 'Player not found' } };
  }

  const cardIndex = player.hand.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) {
    return { state, result: { success: false, message: 'Card not in hand' } };
  }

  if (player.field.length >= MAX_FIELD_SIZE) {
    return { state, result: { success: false, message: 'Field is full' } };
  }

  const card = player.hand.splice(cardIndex, 1)[0];
  card.position = 'field';
  card.isExhausted = true; // Can't attack on the turn it's played
  player.field.push(card);

  // Apply weather/location boosts
  applyEnvironmentBoosts(card, state);

  const action: TurnAction = {
    turn: state.turn,
    playerId,
    actionType: 'play',
    sourceCardId: cardId,
    result: { success: true, message: `${card.name} entered the field` },
  };
  state.turnHistory.push(action);

  return { state, result: action.result };
}

/**
 * Attack with card
 */
export function attackWithCard(
  state: BattleState,
  attackerId: string,
  attackerCardId: string,
  targetCardId?: string
): { state: BattleState; result: ActionResult } {
  const attacker = state.players.find((p) => p.id === attackerId);
  const defender = state.players.find((p) => p.id !== attackerId);

  if (!attacker || !defender) {
    return { state, result: { success: false, message: 'Invalid players' } };
  }

  const attackerCard = attacker.field.find((c) => c.id === attackerCardId);
  if (!attackerCard) {
    return { state, result: { success: false, message: 'Attacker not on field' } };
  }

  if (attackerCard.isExhausted) {
    return { state, result: { success: false, message: 'Card is exhausted' } };
  }

  let damage: number;
  let target: BattleCard | Player;

  if (targetCardId) {
    // Attack enemy card
    const targetCard = defender.field.find((c) => c.id === targetCardId);
    if (!targetCard) {
      return { state, result: { success: false, message: 'Target not on field' } };
    }

    damage = calculateDamage(attackerCard, targetCard);
    targetCard.health -= damage;

    // Check if target is destroyed
    if (targetCard.health <= 0) {
      const idx = defender.field.indexOf(targetCard);
      defender.field.splice(idx, 1);
      targetCard.position = 'graveyard';
      defender.graveyard.push(targetCard);
    }

    target = targetCard;
  } else {
    // Direct attack on player (only if no defenders)
    if (defender.field.length > 0) {
      return { state, result: { success: false, message: 'Must attack field cards first' } };
    }

    damage = attackerCard.attack;
    defender.health -= damage;
    target = defender;

    // Check win condition
    if (defender.health <= 0) {
      state.phase = 'finished';
      state.winner = attackerId;
    }
  }

  attackerCard.isExhausted = true;

  const action: TurnAction = {
    turn: state.turn,
    playerId: attackerId,
    actionType: 'attack',
    sourceCardId: attackerCardId,
    targetCardId,
    result: {
      success: true,
      damage,
      message: `${attackerCard.name} dealt ${damage} damage to ${
        'name' in target ? target.name : 'opponent'
      }`,
    },
  };
  state.turnHistory.push(action);

  return { state, result: action.result };
}

/**
 * Use ability
 */
export function useAbility(
  state: BattleState,
  playerId: string,
  cardId: string,
  abilityId: string,
  targetCardId?: string
): { state: BattleState; result: ActionResult } {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { state, result: { success: false, message: 'Player not found' } };
  }

  const card = player.field.find((c) => c.id === cardId);
  if (!card) {
    return { state, result: { success: false, message: 'Card not on field' } };
  }

  const ability = card.abilities.find((a) => a.id === abilityId);
  if (!ability) {
    return { state, result: { success: false, message: 'Ability not found' } };
  }

  if (ability.currentCooldown > 0) {
    return { state, result: { success: false, message: 'Ability on cooldown' } };
  }

  if (player.energy < ability.cost) {
    return { state, result: { success: false, message: 'Not enough energy' } };
  }

  // Find target
  let target: BattleCard | Player | undefined;
  if (ability.targetType === 'self') {
    target = card;
  } else if (targetCardId) {
    const opponent = state.players.find((p) => p.id !== playerId);
    target = opponent?.field.find((c) => c.id === targetCardId) || player.field.find((c) => c.id === targetCardId);
  }

  // Apply effects
  const appliedEffects: StatusEffect[] = [];
  let totalDamage = 0;
  let totalHealing = 0;

  for (const effect of ability.effects) {
    if (target && 'health' in target) {
      switch (effect.type) {
        case 'damage':
          const dmg = effect.value + (card.special * 0.5);
          (target as BattleCard).health -= dmg;
          totalDamage += dmg;
          break;

        case 'heal':
          const heal = Math.min(effect.value, (target as BattleCard).maxHealth - (target as BattleCard).health);
          (target as BattleCard).health += heal;
          totalHealing += heal;
          break;

        case 'buff':
        case 'debuff':
          const statusEffect: StatusEffect = {
            id: `effect-${Date.now()}`,
            name: ability.name,
            type: effect.type === 'buff' ? 'buff' : 'debuff',
            stat: effect.stat,
            value: effect.value,
            duration: effect.duration || 2,
            stackable: false,
          };
          (target as BattleCard).statusEffects.push(statusEffect);
          appliedEffects.push(statusEffect);
          break;
      }
    }
  }

  // Consume energy and set cooldown
  player.energy -= ability.cost;
  ability.currentCooldown = ability.cooldown;

  const action: TurnAction = {
    turn: state.turn,
    playerId,
    actionType: 'ability',
    sourceCardId: cardId,
    targetCardId,
    abilityId,
    result: {
      success: true,
      damage: totalDamage > 0 ? totalDamage : undefined,
      healing: totalHealing > 0 ? totalHealing : undefined,
      effects: appliedEffects,
      message: `${card.name} used ${ability.name}`,
    },
  };
  state.turnHistory.push(action);

  return { state, result: action.result };
}

/**
 * End turn
 */
export function endTurn(state: BattleState, playerId: string): BattleState {
  if (state.activePlayerId !== playerId) {
    return state;
  }

  // Process end of turn effects
  const player = state.players.find((p) => p.id === playerId)!;

  // Reduce cooldowns
  for (const card of player.field) {
    for (const ability of card.abilities) {
      if (ability.currentCooldown > 0) {
        ability.currentCooldown--;
      }
    }

    // Process status effects
    card.statusEffects = card.statusEffects.filter((effect) => {
      effect.duration--;
      return effect.duration > 0;
    });

    // Refresh exhausted state
    card.isExhausted = false;
  }

  // Switch active player
  const nextPlayer = state.players.find((p) => p.id !== playerId)!;
  state.activePlayerId = nextPlayer.id;

  // New turn setup
  state.turn++;
  drawCard(nextPlayer);
  nextPlayer.energy = Math.min(nextPlayer.energy + ENERGY_PER_TURN, nextPlayer.maxEnergy);

  state.turnHistory.push({
    turn: state.turn - 1,
    playerId,
    actionType: 'end_turn',
    result: { success: true, message: 'Turn ended' },
  });

  return state;
}

// ============================================================================
// DAMAGE CALCULATION
// ============================================================================

/**
 * Calculate damage with element advantages
 */
export function calculateDamage(attacker: BattleCard, defender: BattleCard): number {
  let baseDamage = Math.max(0, attacker.attack - defender.defense);

  // Element advantage
  if (ELEMENT_ADVANTAGES[attacker.element]?.includes(defender.element)) {
    baseDamage = Math.round(baseDamage * ADVANTAGE_MULTIPLIER);
  } else if (ELEMENT_DISADVANTAGES[attacker.element]?.includes(defender.element)) {
    baseDamage = Math.round(baseDamage * DISADVANTAGE_MULTIPLIER);
  }

  // Critical hit
  if (Math.random() < CRITICAL_HIT_CHANCE) {
    baseDamage = Math.round(baseDamage * CRITICAL_HIT_MULTIPLIER);
  }

  // Apply status effects
  const attackBuff = attacker.statusEffects
    .filter((e) => e.stat === 'attack')
    .reduce((sum, e) => sum + e.value, 0);
  const defenseBuff = defender.statusEffects
    .filter((e) => e.stat === 'defense')
    .reduce((sum, e) => sum + e.value, 0);

  baseDamage = Math.max(1, baseDamage + attackBuff - defenseBuff);

  return baseDamage;
}

/**
 * Apply environment boosts to card
 */
function applyEnvironmentBoosts(card: BattleCard, state: BattleState): void {
  if (state.weatherBoost && card.element === state.weatherBoost.element) {
    card.attack = Math.round(card.attack * state.weatherBoost.modifier);
    card.special = Math.round(card.special * state.weatherBoost.modifier);
  }

  if (state.locationBoost && card.element === state.locationBoost.element) {
    card.defense = Math.round(card.defense * state.locationBoost.modifier);
  }
}

// ============================================================================
// AI OPPONENT
// ============================================================================

/**
 * Simple AI opponent logic
 */
export function getAiAction(state: BattleState, aiPlayerId: string): {
  actionType: 'play' | 'attack' | 'ability' | 'end_turn';
  cardId?: string;
  targetCardId?: string;
  abilityId?: string;
} {
  const ai = state.players.find((p) => p.id === aiPlayerId)!;
  const opponent = state.players.find((p) => p.id !== aiPlayerId)!;

  // Priority 1: Play cards if we can
  if (ai.hand.length > 0 && ai.field.length < MAX_FIELD_SIZE) {
    // Play highest attack card
    const bestCard = [...ai.hand].sort((a, b) => b.attack - a.attack)[0];
    return { actionType: 'play', cardId: bestCard.id };
  }

  // Priority 2: Attack with non-exhausted cards
  const readyAttackers = ai.field.filter((c) => !c.isExhausted);
  if (readyAttackers.length > 0) {
    const attacker = readyAttackers[0];

    // Target weakest enemy card or player
    if (opponent.field.length > 0) {
      const weakest = [...opponent.field].sort((a, b) => a.health - b.health)[0];
      return { actionType: 'attack', cardId: attacker.id, targetCardId: weakest.id };
    } else {
      return { actionType: 'attack', cardId: attacker.id };
    }
  }

  // Priority 3: Use abilities if available
  for (const card of ai.field) {
    for (const ability of card.abilities) {
      if (ability.currentCooldown === 0 && ai.energy >= ability.cost) {
        const target = ability.targetType === 'self' ? card.id :
                       ability.targetType === 'enemy' && opponent.field.length > 0 ? opponent.field[0].id :
                       undefined;
        return { actionType: 'ability', cardId: card.id, abilityId: ability.id, targetCardId: target };
      }
    }
  }

  // Default: End turn
  return { actionType: 'end_turn' };
}

// ============================================================================
// BATTLE RESULT
// ============================================================================

/**
 * Calculate battle result
 */
export function calculateBattleResult(state: BattleState): BattleResult {
  const winner = state.players.find((p) => p.id === state.winner)!;
  const loser = state.players.find((p) => p.id !== state.winner)!;

  const totalDamageDealt: Record<string, number> = {};
  const cardsPlayed: Record<string, number> = {};
  const abilitiesUsed: Record<string, number> = {};

  for (const action of state.turnHistory) {
    if (action.result.damage) {
      totalDamageDealt[action.playerId] = (totalDamageDealt[action.playerId] || 0) + action.result.damage;
    }
    if (action.actionType === 'play') {
      cardsPlayed[action.playerId] = (cardsPlayed[action.playerId] || 0) + 1;
    }
    if (action.actionType === 'ability') {
      abilitiesUsed[action.playerId] = (abilitiesUsed[action.playerId] || 0) + 1;
    }
  }

  // Find MVP card (most damage dealt)
  const cardDamage = new Map<string, number>();
  for (const action of state.turnHistory) {
    if (action.sourceCardId && action.result.damage) {
      cardDamage.set(action.sourceCardId, (cardDamage.get(action.sourceCardId) || 0) + action.result.damage);
    }
  }
  const mvpCard = [...cardDamage.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  return {
    winnerId: winner.id,
    loserId: loser.id,
    turns: state.turn,
    totalDamageDealt,
    cardsPlayed,
    abilitiesUsed,
    mvpCard,
  };
}

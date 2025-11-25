/**
 * @apex/core/tcg
 *
 * TCG (Trading Card Game) core primitives for battle simulation,
 * creature management, and market integration.
 */

// ============================================================================
// TYPES
// ============================================================================

export type ElementType = 'fire' | 'water' | 'earth' | 'air' | 'lightning' | 'nature' | 'dark' | 'light';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type BattlePhase = 'setup' | 'draw' | 'main' | 'combat' | 'end' | 'finished';

export interface CardStats {
  attack: number;
  defense: number;
  health: number;
  speed: number;
  special: number;
}

export interface Card {
  id: string;
  name: string;
  element: ElementType;
  rarity: Rarity;
  stats: CardStats;
  abilities: CardAbility[];
  metadata: {
    artist?: string;
    edition: string;
    mintNumber?: number;
  };
}

export interface CardAbility {
  id: string;
  name: string;
  description: string;
  cost: number;
  cooldown: number;
  effects: AbilityEffect[];
}

export interface AbilityEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'status';
  value: number;
  target: 'self' | 'enemy' | 'ally' | 'all';
  duration?: number;
  stat?: keyof CardStats;
}

export interface BattleState {
  id: string;
  phase: BattlePhase;
  turn: number;
  activePlayerId: string;
  players: BattlePlayer[];
  winner?: string;
}

export interface BattlePlayer {
  id: string;
  name: string;
  health: number;
  energy: number;
  deck: Card[];
  hand: Card[];
  field: Card[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const ELEMENT_ADVANTAGES: Record<ElementType, ElementType[]> = {
  fire: ['nature', 'air'],
  water: ['fire', 'earth'],
  earth: ['lightning', 'fire'],
  air: ['earth', 'nature'],
  lightning: ['water', 'air'],
  nature: ['water', 'earth'],
  dark: ['light', 'nature'],
  light: ['dark', 'fire'],
};

export const RARITY_MULTIPLIERS: Record<Rarity, number> = {
  common: 1.0,
  uncommon: 1.2,
  rare: 1.5,
  epic: 2.0,
  legendary: 3.0,
  mythic: 5.0,
};

export const BATTLE_CONSTANTS = {
  STARTING_HEALTH: 30,
  STARTING_ENERGY: 3,
  MAX_ENERGY: 10,
  ENERGY_PER_TURN: 1,
  MAX_HAND_SIZE: 10,
  MAX_FIELD_SIZE: 5,
  STARTING_HAND_SIZE: 5,
  ADVANTAGE_MULTIPLIER: 1.5,
  DISADVANTAGE_MULTIPLIER: 0.75,
  CRITICAL_CHANCE: 0.1,
  CRITICAL_MULTIPLIER: 2.0,
};

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Check element advantage
 */
export function hasAdvantage(attacker: ElementType, defender: ElementType): boolean {
  return ELEMENT_ADVANTAGES[attacker]?.includes(defender) ?? false;
}

/**
 * Calculate damage with element modifiers
 */
export function calculateDamage(
  attackerStats: CardStats,
  defenderStats: CardStats,
  attackerElement: ElementType,
  defenderElement: ElementType
): number {
  let damage = Math.max(0, attackerStats.attack - defenderStats.defense);

  // Apply element modifier
  if (hasAdvantage(attackerElement, defenderElement)) {
    damage = Math.round(damage * BATTLE_CONSTANTS.ADVANTAGE_MULTIPLIER);
  } else if (hasAdvantage(defenderElement, attackerElement)) {
    damage = Math.round(damage * BATTLE_CONSTANTS.DISADVANTAGE_MULTIPLIER);
  }

  // Critical hit check
  if (Math.random() < BATTLE_CONSTANTS.CRITICAL_CHANCE) {
    damage = Math.round(damage * BATTLE_CONSTANTS.CRITICAL_MULTIPLIER);
  }

  return Math.max(1, damage);
}

/**
 * Create a new card
 */
export function createCard(
  name: string,
  element: ElementType,
  rarity: Rarity,
  baseStats: Partial<CardStats>,
  abilities: CardAbility[] = []
): Card {
  const multiplier = RARITY_MULTIPLIERS[rarity];

  const stats: CardStats = {
    attack: Math.round((baseStats.attack || 10) * multiplier),
    defense: Math.round((baseStats.defense || 5) * multiplier),
    health: Math.round((baseStats.health || 20) * multiplier),
    speed: Math.round((baseStats.speed || 5) * multiplier),
    special: Math.round((baseStats.special || 5) * multiplier),
  };

  return {
    id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    element,
    rarity,
    stats,
    abilities,
    metadata: {
      edition: 'apex-core-v1',
    },
  };
}

/**
 * Shuffle deck
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Initialize battle state
 */
export function initializeBattle(
  player1: { id: string; name: string; deck: Card[] },
  player2: { id: string; name: string; deck: Card[] }
): BattleState {
  const createPlayer = (data: typeof player1): BattlePlayer => {
    const shuffled = shuffleDeck(data.deck);
    return {
      id: data.id,
      name: data.name,
      health: BATTLE_CONSTANTS.STARTING_HEALTH,
      energy: BATTLE_CONSTANTS.STARTING_ENERGY,
      deck: shuffled.slice(BATTLE_CONSTANTS.STARTING_HAND_SIZE),
      hand: shuffled.slice(0, BATTLE_CONSTANTS.STARTING_HAND_SIZE),
      field: [],
    };
  };

  return {
    id: `battle-${Date.now()}`,
    phase: 'main',
    turn: 1,
    activePlayerId: player1.id,
    players: [createPlayer(player1), createPlayer(player2)],
  };
}

/**
 * Estimate card market value
 */
export function estimateCardValue(card: Card): number {
  const baseValue = 10;
  const rarityMultiplier = RARITY_MULTIPLIERS[card.rarity];
  const statsSum = Object.values(card.stats).reduce((a, b) => a + b, 0);
  const abilityBonus = card.abilities.length * 5;

  return Math.round(baseValue * rarityMultiplier * (1 + statsSum / 100) + abilityBonus);
}

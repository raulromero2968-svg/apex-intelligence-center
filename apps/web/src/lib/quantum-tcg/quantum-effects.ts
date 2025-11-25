/**
 * Quantum TCG Effects Module
 *
 * Quantum-inspired mechanics for TCG card effects.
 * Uses quantum computing concepts for game mechanics:
 * - Superposition for uncertain outcomes
 * - Entanglement for linked card effects
 * - Quantum interference for probability manipulation
 *
 * Note: These are quantum-inspired simulations, not actual quantum computing.
 */

// ============================================================================
// TYPES
// ============================================================================

export type QuantumState = 'ground' | 'excited' | 'superposition' | 'entangled';
export type QuantumEffect = 'observe' | 'entangle' | 'superpose' | 'interfere' | 'collapse';

export interface QuantumCard {
  id: string;
  name: string;
  baseStats: CardStats;
  quantumState: QuantumState;
  superpositionStats?: CardStats[]; // Multiple possible states
  entangledWith?: string; // ID of entangled card
  coherence: number; // 0-1, chance of maintaining quantum state
  observedStats?: CardStats; // Stats after observation/collapse
}

export interface CardStats {
  attack: number;
  defense: number;
  health: number;
  special: number;
}

export interface QuantumOperation {
  id: string;
  type: QuantumEffect;
  targetCardId: string;
  secondaryCardId?: string;
  probability: number;
  result: QuantumOperationResult;
}

export interface QuantumOperationResult {
  success: boolean;
  newState: QuantumState;
  statsChange?: Partial<CardStats>;
  message: string;
  quantumAdvantage?: number; // Bonus from quantum effect
}

export interface EntanglementPair {
  card1Id: string;
  card2Id: string;
  correlation: 'positive' | 'negative'; // Positive: same outcome, Negative: opposite
  strength: number; // 0-1
}

export interface QuantumBattleState {
  cards: Map<string, QuantumCard>;
  entanglements: EntanglementPair[];
  operationHistory: QuantumOperation[];
  quantumField: {
    coherenceBonus: number;
    interferencePattern: number[];
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const QUANTUM_CONSTANTS = {
  BASE_COHERENCE: 0.8,
  COHERENCE_DECAY_RATE: 0.05,
  ENTANGLEMENT_RANGE: 2, // Max stat difference for entanglement
  SUPERPOSITION_STATES: 3, // Number of possible states in superposition
  OBSERVATION_COLLAPSE_THRESHOLD: 0.5,
  INTERFERENCE_AMPLITUDE: 0.3,
};

export const QUANTUM_EFFECT_COSTS: Record<QuantumEffect, number> = {
  observe: 1,
  superpose: 2,
  entangle: 3,
  interfere: 2,
  collapse: 1,
};

// ============================================================================
// QUANTUM STATE MANAGEMENT
// ============================================================================

/**
 * Initialize a card with quantum properties
 */
export function initializeQuantumCard(
  id: string,
  name: string,
  baseStats: CardStats
): QuantumCard {
  return {
    id,
    name,
    baseStats,
    quantumState: 'ground',
    coherence: QUANTUM_CONSTANTS.BASE_COHERENCE,
  };
}

/**
 * Put card into superposition
 */
export function applySuperposition(card: QuantumCard): QuantumOperationResult {
  if (card.quantumState === 'entangled') {
    return {
      success: false,
      newState: card.quantumState,
      message: 'Cannot superpose entangled card',
    };
  }

  // Generate possible states
  const states: CardStats[] = [];
  for (let i = 0; i < QUANTUM_CONSTANTS.SUPERPOSITION_STATES; i++) {
    const variance = 0.2 + Math.random() * 0.3; // 20-50% variance
    const direction = Math.random() > 0.5 ? 1 : -1;

    states.push({
      attack: Math.round(card.baseStats.attack * (1 + direction * variance)),
      defense: Math.round(card.baseStats.defense * (1 + direction * variance * 0.8)),
      health: Math.round(card.baseStats.health * (1 + direction * variance * 0.5)),
      special: Math.round(card.baseStats.special * (1 + direction * variance * 1.2)),
    });
  }

  card.quantumState = 'superposition';
  card.superpositionStats = states;
  card.coherence = Math.min(1, card.coherence + 0.1);

  // Calculate potential advantage
  const avgStats = states.reduce(
    (acc, s) => ({
      attack: acc.attack + s.attack,
      defense: acc.defense + s.defense,
      health: acc.health + s.health,
      special: acc.special + s.special,
    }),
    { attack: 0, defense: 0, health: 0, special: 0 }
  );

  const quantumAdvantage =
    (avgStats.attack / QUANTUM_CONSTANTS.SUPERPOSITION_STATES - card.baseStats.attack) / card.baseStats.attack;

  return {
    success: true,
    newState: 'superposition',
    message: `${card.name} entered superposition with ${states.length} possible states`,
    quantumAdvantage,
  };
}

/**
 * Entangle two cards
 */
export function applyEntanglement(
  card1: QuantumCard,
  card2: QuantumCard,
  correlation: 'positive' | 'negative' = 'positive'
): { result: QuantumOperationResult; pair?: EntanglementPair } {
  // Check compatibility
  const statDiff = Math.abs(
    (card1.baseStats.attack + card1.baseStats.defense) -
    (card2.baseStats.attack + card2.baseStats.defense)
  );

  if (statDiff > QUANTUM_CONSTANTS.ENTANGLEMENT_RANGE * 20) {
    return {
      result: {
        success: false,
        newState: card1.quantumState,
        message: 'Cards too different to entangle',
      },
    };
  }

  // Collapse any existing superposition
  if (card1.quantumState === 'superposition') {
    collapseWavefunction(card1);
  }
  if (card2.quantumState === 'superposition') {
    collapseWavefunction(card2);
  }

  // Create entanglement
  card1.quantumState = 'entangled';
  card2.quantumState = 'entangled';
  card1.entangledWith = card2.id;
  card2.entangledWith = card1.id;

  const strength = 0.5 + Math.random() * 0.5;

  const pair: EntanglementPair = {
    card1Id: card1.id,
    card2Id: card2.id,
    correlation,
    strength,
  };

  return {
    result: {
      success: true,
      newState: 'entangled',
      message: `${card1.name} and ${card2.name} are now ${correlation}ly entangled`,
      quantumAdvantage: strength * 0.2,
    },
    pair,
  };
}

/**
 * Observe/collapse a card's quantum state
 */
export function observeCard(card: QuantumCard): QuantumOperationResult {
  if (card.quantumState === 'ground') {
    return {
      success: true,
      newState: 'ground',
      message: `${card.name} is already in ground state`,
    };
  }

  if (card.quantumState === 'superposition') {
    return collapseWavefunction(card);
  }

  if (card.quantumState === 'entangled') {
    return {
      success: false,
      newState: 'entangled',
      message: 'Observing entangled card affects its partner - use collapse instead',
    };
  }

  return {
    success: true,
    newState: card.quantumState,
    message: `${card.name} observed in ${card.quantumState} state`,
  };
}

/**
 * Collapse superposition to definite state
 */
export function collapseWavefunction(card: QuantumCard): QuantumOperationResult {
  if (card.quantumState !== 'superposition' || !card.superpositionStats) {
    return {
      success: false,
      newState: card.quantumState,
      message: 'Card not in superposition',
    };
  }

  // Weight selection by coherence
  const weights = card.superpositionStats.map((stats, idx) => {
    // Higher coherence = more likely to get better stats
    const totalStats = stats.attack + stats.defense + stats.health + stats.special;
    return totalStats * card.coherence + Math.random() * (1 - card.coherence) * 100;
  });

  // Select state with highest weighted value
  const maxWeight = Math.max(...weights);
  const selectedIdx = weights.indexOf(maxWeight);
  const selectedStats = card.superpositionStats[selectedIdx];

  card.observedStats = selectedStats;
  card.quantumState = 'ground';
  card.superpositionStats = undefined;

  // Calculate advantage from collapse
  const baseTotal = card.baseStats.attack + card.baseStats.defense + card.baseStats.health + card.baseStats.special;
  const newTotal = selectedStats.attack + selectedStats.defense + selectedStats.health + selectedStats.special;
  const quantumAdvantage = (newTotal - baseTotal) / baseTotal;

  return {
    success: true,
    newState: 'ground',
    statsChange: {
      attack: selectedStats.attack - card.baseStats.attack,
      defense: selectedStats.defense - card.baseStats.defense,
      health: selectedStats.health - card.baseStats.health,
      special: selectedStats.special - card.baseStats.special,
    },
    message: `${card.name} collapsed to ${quantumAdvantage >= 0 ? 'favorable' : 'unfavorable'} state`,
    quantumAdvantage,
  };
}

/**
 * Apply quantum interference to modify probabilities
 */
export function applyInterference(
  card: QuantumCard,
  amplitude: number = QUANTUM_CONSTANTS.INTERFERENCE_AMPLITUDE
): QuantumOperationResult {
  if (card.quantumState !== 'superposition' || !card.superpositionStats) {
    return {
      success: false,
      newState: card.quantumState,
      message: 'Interference only works on superposed cards',
    };
  }

  // Modify superposition states through interference
  card.superpositionStats = card.superpositionStats.map((stats) => ({
    attack: Math.round(stats.attack * (1 + amplitude * (Math.random() - 0.5))),
    defense: Math.round(stats.defense * (1 + amplitude * (Math.random() - 0.5))),
    health: Math.round(stats.health * (1 + amplitude * (Math.random() - 0.5))),
    special: Math.round(stats.special * (1 + amplitude * (Math.random() - 0.5))),
  }));

  // Interference can increase or decrease coherence
  card.coherence = Math.max(0.1, Math.min(1, card.coherence + (Math.random() - 0.5) * 0.2));

  return {
    success: true,
    newState: 'superposition',
    message: `Interference pattern applied to ${card.name}`,
    quantumAdvantage: amplitude * (card.coherence - 0.5),
  };
}

// ============================================================================
// BATTLE INTEGRATION
// ============================================================================

/**
 * Calculate damage with quantum effects
 */
export function calculateQuantumDamage(
  attacker: QuantumCard,
  defender: QuantumCard
): {
  damage: number;
  quantumBonus: number;
  effects: string[];
} {
  const effects: string[] = [];
  let quantumBonus = 0;

  // Get effective stats
  const attackerStats = attacker.observedStats || attacker.baseStats;
  const defenderStats = defender.observedStats || defender.baseStats;

  let baseDamage = Math.max(1, attackerStats.attack - defenderStats.defense);

  // Superposition bonus - uncertainty advantage
  if (attacker.quantumState === 'superposition') {
    const varianceBonus = Math.random() * 0.3 * attacker.coherence;
    quantumBonus += varianceBonus;
    effects.push('Superposition uncertainty bonus');
  }

  // Entanglement effects
  if (attacker.quantumState === 'entangled' && attacker.entangledWith) {
    // Entangled cards deal bonus damage based on partner's state
    quantumBonus += 0.15;
    effects.push('Entanglement resonance');
  }

  // Coherence modifier
  if (attacker.coherence > 0.8) {
    quantumBonus += 0.1;
    effects.push('High coherence precision');
  }

  const finalDamage = Math.round(baseDamage * (1 + quantumBonus));

  return {
    damage: finalDamage,
    quantumBonus,
    effects,
  };
}

/**
 * Process entanglement effects when one card takes damage
 */
export function processEntanglementDamage(
  damagedCard: QuantumCard,
  damage: number,
  entanglement: EntanglementPair,
  partnerCard: QuantumCard
): {
  partnerEffect: 'damage' | 'heal' | 'none';
  partnerValue: number;
  message: string;
} {
  if (!entanglement || damagedCard.quantumState !== 'entangled') {
    return { partnerEffect: 'none', partnerValue: 0, message: 'No entanglement active' };
  }

  const effectValue = Math.round(damage * entanglement.strength * 0.5);

  if (entanglement.correlation === 'positive') {
    // Partner takes proportional damage
    return {
      partnerEffect: 'damage',
      partnerValue: effectValue,
      message: `${partnerCard.name} shares ${effectValue} damage through entanglement`,
    };
  } else {
    // Partner heals from the damage
    return {
      partnerEffect: 'heal',
      partnerValue: effectValue,
      message: `${partnerCard.name} gains ${effectValue} health through negative entanglement`,
    };
  }
}

/**
 * Decay coherence over time
 */
export function decayCoherence(card: QuantumCard): void {
  if (card.quantumState === 'superposition' || card.quantumState === 'entangled') {
    card.coherence = Math.max(0.1, card.coherence - QUANTUM_CONSTANTS.COHERENCE_DECAY_RATE);

    // Low coherence can cause spontaneous collapse
    if (card.coherence < QUANTUM_CONSTANTS.OBSERVATION_COLLAPSE_THRESHOLD && card.quantumState === 'superposition') {
      collapseWavefunction(card);
    }
  }
}

// ============================================================================
// QUANTUM BATTLE STATE
// ============================================================================

/**
 * Initialize quantum battle state
 */
export function initializeQuantumBattle(cards: QuantumCard[]): QuantumBattleState {
  const cardMap = new Map<string, QuantumCard>();
  for (const card of cards) {
    cardMap.set(card.id, card);
  }

  return {
    cards: cardMap,
    entanglements: [],
    operationHistory: [],
    quantumField: {
      coherenceBonus: 0,
      interferencePattern: Array(8).fill(0).map(() => Math.random()),
    },
  };
}

/**
 * Execute quantum operation in battle
 */
export function executeQuantumOperation(
  state: QuantumBattleState,
  effect: QuantumEffect,
  targetId: string,
  secondaryId?: string
): QuantumOperationResult {
  const target = state.cards.get(targetId);
  if (!target) {
    return {
      success: false,
      newState: 'ground',
      message: 'Target card not found',
    };
  }

  let result: QuantumOperationResult;

  switch (effect) {
    case 'superpose':
      result = applySuperposition(target);
      break;

    case 'observe':
      result = observeCard(target);
      break;

    case 'collapse':
      result = collapseWavefunction(target);
      break;

    case 'interfere':
      result = applyInterference(target);
      break;

    case 'entangle':
      if (!secondaryId) {
        return {
          success: false,
          newState: target.quantumState,
          message: 'Entanglement requires a second card',
        };
      }
      const secondary = state.cards.get(secondaryId);
      if (!secondary) {
        return {
          success: false,
          newState: target.quantumState,
          message: 'Secondary card not found',
        };
      }
      const entangleResult = applyEntanglement(target, secondary);
      if (entangleResult.pair) {
        state.entanglements.push(entangleResult.pair);
      }
      result = entangleResult.result;
      break;

    default:
      result = {
        success: false,
        newState: target.quantumState,
        message: 'Unknown quantum effect',
      };
  }

  // Record operation
  state.operationHistory.push({
    id: `qop-${Date.now()}`,
    type: effect,
    targetCardId: targetId,
    secondaryCardId: secondaryId,
    probability: target.coherence,
    result,
  });

  return result;
}

/**
 * Get quantum battle summary
 */
export function getQuantumBattleSummary(state: QuantumBattleState): {
  cardsInSuperposition: number;
  entangledPairs: number;
  averageCoherence: number;
  totalQuantumAdvantage: number;
} {
  let superpositionCount = 0;
  let totalCoherence = 0;
  let totalAdvantage = 0;

  for (const card of state.cards.values()) {
    if (card.quantumState === 'superposition') superpositionCount++;
    totalCoherence += card.coherence;
  }

  for (const op of state.operationHistory) {
    totalAdvantage += op.result.quantumAdvantage || 0;
  }

  return {
    cardsInSuperposition: superpositionCount,
    entangledPairs: state.entanglements.length,
    averageCoherence: state.cards.size > 0 ? totalCoherence / state.cards.size : 0,
    totalQuantumAdvantage: totalAdvantage,
  };
}

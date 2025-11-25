/**
 * Quantum TCG Module
 *
 * Quantum-inspired game mechanics for TCG battles.
 * Features superposition, entanglement, and interference effects.
 */

export {
  // Types
  type QuantumState,
  type QuantumEffect,
  type QuantumCard,
  type CardStats,
  type QuantumOperation,
  type QuantumOperationResult,
  type EntanglementPair,
  type QuantumBattleState,

  // Constants
  QUANTUM_CONSTANTS,
  QUANTUM_EFFECT_COSTS,
  RARITY_MAGNITUDE,

  // Card Initialization
  initializeQuantumCard,

  // Rarity-Based Magnitude Helpers
  getRarityMagnitude,
  getCardCount,

  // Quantum Operations
  applySuperposition,
  applyEntanglement,
  observeCard,
  collapseWavefunction,
  applyInterference,

  // Battle Integration
  calculateQuantumDamage,
  processEntanglementDamage,
  decayCoherence,

  // Battle State
  initializeQuantumBattle,
  executeQuantumOperation,
  getQuantumBattleSummary,
} from './quantum-effects';

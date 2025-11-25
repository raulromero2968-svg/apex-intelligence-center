/**
 * Biology/Chemistry TCG Evolution Simulation
 *
 * Creature evolution and mutation simulation for TCG mechanics.
 * Simulates biological processes for game card evolution.
 *
 * Features:
 * - DNA-based creature attributes
 * - Evolution/mutation simulation
 * - Breeding mechanics
 * - Chemistry-based "potion" effects
 */

// ============================================================================
// TYPES
// ============================================================================

export interface GeneticCode {
  sequence: string; // DNA-like sequence (ATCG)
  traits: GeneticTrait[];
  mutations: number;
  generation: number;
}

export interface GeneticTrait {
  name: string;
  gene: string; // 3-letter codon
  expression: number; // 0-1 strength
  dominant: boolean;
}

export interface Creature {
  id: string;
  name: string;
  species: string;
  genetics: GeneticCode;
  stats: CreatureStats;
  element: ElementType;
  evolutionStage: number;
  canEvolve: boolean;
}

export interface CreatureStats {
  health: number;
  attack: number;
  defense: number;
  speed: number;
  special: number;
}

export type ElementType =
  | 'fire'
  | 'water'
  | 'earth'
  | 'air'
  | 'lightning'
  | 'nature'
  | 'dark'
  | 'light';

export interface EvolutionResult {
  success: boolean;
  originalCreature: Creature;
  evolvedCreature?: Creature;
  mutations: MutationEvent[];
  message: string;
}

export interface MutationEvent {
  type: 'beneficial' | 'neutral' | 'harmful';
  trait: string;
  change: number;
  description: string;
}

export interface BreedingResult {
  success: boolean;
  parents: [Creature, Creature];
  offspring?: Creature;
  inheritedTraits: string[];
  newMutations: MutationEvent[];
  message: string;
}

export interface PotionEffect {
  name: string;
  type: 'boost' | 'heal' | 'transform' | 'mutate';
  targetStat?: keyof CreatureStats;
  magnitude: number;
  duration: number; // turns
  sideEffects?: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const NUCLEOTIDES = ['A', 'T', 'C', 'G'] as const;

export const CODON_TRAITS: Record<string, string> = {
  ATG: 'strength',
  TGC: 'speed',
  GCA: 'defense',
  CAT: 'intelligence',
  AGT: 'vitality',
  TCG: 'agility',
  CGT: 'resistance',
  GTA: 'power',
};

export const ELEMENT_STRENGTHS: Record<ElementType, ElementType[]> = {
  fire: ['nature', 'air'],
  water: ['fire', 'earth'],
  earth: ['lightning', 'fire'],
  air: ['earth', 'nature'],
  lightning: ['water', 'air'],
  nature: ['water', 'earth'],
  dark: ['light', 'nature'],
  light: ['dark', 'fire'],
};

export const EVOLUTION_THRESHOLDS = [100, 250, 500, 1000]; // XP thresholds

// ============================================================================
// GENETIC OPERATIONS
// ============================================================================

/**
 * Generate random DNA sequence
 */
export function generateDnaSequence(length: number = 30): string {
  let sequence = '';
  for (let i = 0; i < length; i++) {
    sequence += NUCLEOTIDES[Math.floor(Math.random() * 4)];
  }
  return sequence;
}

/**
 * Get complementary DNA strand
 */
export function getComplementaryStrand(sequence: string): string {
  const complement: Record<string, string> = { A: 'T', T: 'A', C: 'G', G: 'C' };
  return sequence.split('').map((n) => complement[n] || n).join('');
}

/**
 * Transcribe DNA to RNA
 */
export function transcribeDna(sequence: string): string {
  return sequence.replace(/T/g, 'U');
}

/**
 * Extract traits from DNA sequence
 */
export function extractTraits(sequence: string): GeneticTrait[] {
  const traits: GeneticTrait[] = [];

  for (let i = 0; i < sequence.length - 2; i += 3) {
    const codon = sequence.slice(i, i + 3);
    const traitName = CODON_TRAITS[codon];

    if (traitName) {
      // Check if trait already exists
      const existing = traits.find((t) => t.name === traitName);
      if (existing) {
        existing.expression = Math.min(1, existing.expression + 0.2);
      } else {
        traits.push({
          name: traitName,
          gene: codon,
          expression: 0.5 + Math.random() * 0.3,
          dominant: Math.random() > 0.5,
        });
      }
    }
  }

  return traits;
}

/**
 * Mutate DNA sequence
 */
export function mutateDna(
  sequence: string,
  mutationRate: number = 0.05
): { sequence: string; mutations: number } {
  let mutations = 0;
  const mutated = sequence
    .split('')
    .map((nucleotide) => {
      if (Math.random() < mutationRate) {
        mutations++;
        // Random mutation
        const newNucleotide = NUCLEOTIDES[Math.floor(Math.random() * 4)];
        return newNucleotide;
      }
      return nucleotide;
    })
    .join('');

  return { sequence: mutated, mutations };
}

// ============================================================================
// CREATURE GENERATION
// ============================================================================

/**
 * Create a new creature from DNA
 */
export function createCreature(
  name: string,
  species: string,
  dna?: string
): Creature {
  const sequence = dna || generateDnaSequence(30);
  const traits = extractTraits(sequence);

  const genetics: GeneticCode = {
    sequence,
    traits,
    mutations: 0,
    generation: 1,
  };

  const stats = calculateStatsFromTraits(traits);
  const element = determineElement(sequence);

  return {
    id: `creature-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name,
    species,
    genetics,
    stats,
    element,
    evolutionStage: 1,
    canEvolve: true,
  };
}

/**
 * Calculate stats from genetic traits
 */
function calculateStatsFromTraits(traits: GeneticTrait[]): CreatureStats {
  const baseStats: CreatureStats = {
    health: 50,
    attack: 10,
    defense: 10,
    speed: 10,
    special: 10,
  };

  for (const trait of traits) {
    const bonus = Math.round(trait.expression * 20);

    switch (trait.name) {
      case 'vitality':
        baseStats.health += bonus * 2;
        break;
      case 'strength':
      case 'power':
        baseStats.attack += bonus;
        break;
      case 'defense':
      case 'resistance':
        baseStats.defense += bonus;
        break;
      case 'speed':
      case 'agility':
        baseStats.speed += bonus;
        break;
      case 'intelligence':
        baseStats.special += bonus;
        break;
    }
  }

  return baseStats;
}

/**
 * Determine element from DNA
 */
function determineElement(sequence: string): ElementType {
  const elementCodes: Record<string, ElementType> = {
    AAA: 'fire',
    TTT: 'water',
    CCC: 'earth',
    GGG: 'air',
    ATC: 'lightning',
    TAG: 'nature',
    GCA: 'dark',
    CGT: 'light',
  };

  // Find most common 3-mer
  const threeMers: Record<string, number> = {};
  for (let i = 0; i < sequence.length - 2; i++) {
    const mer = sequence.slice(i, i + 3);
    threeMers[mer] = (threeMers[mer] || 0) + 1;
  }

  const sortedMers = Object.entries(threeMers).sort((a, b) => b[1] - a[1]);

  for (const [mer] of sortedMers) {
    if (elementCodes[mer]) {
      return elementCodes[mer];
    }
  }

  // Default to nature
  return 'nature';
}

// ============================================================================
// EVOLUTION
// ============================================================================

/**
 * Evolve a creature
 */
export function evolveCreature(creature: Creature, xp: number = 0): EvolutionResult {
  if (!creature.canEvolve) {
    return {
      success: false,
      originalCreature: creature,
      mutations: [],
      message: 'This creature cannot evolve further.',
    };
  }

  if (creature.evolutionStage >= 4) {
    return {
      success: false,
      originalCreature: creature,
      mutations: [],
      message: 'Maximum evolution stage reached.',
    };
  }

  // Mutate DNA
  const { sequence: mutatedDna, mutations: mutationCount } = mutateDna(
    creature.genetics.sequence,
    0.1 + creature.evolutionStage * 0.02
  );

  // Extract new traits
  const newTraits = extractTraits(mutatedDna);

  // Calculate stat changes
  const mutations: MutationEvent[] = [];
  const oldStats = creature.stats;
  const newStats = calculateStatsFromTraits(newTraits);

  // Track mutations
  for (const stat of Object.keys(oldStats) as (keyof CreatureStats)[]) {
    const change = newStats[stat] - oldStats[stat];
    if (change !== 0) {
      mutations.push({
        type: change > 0 ? 'beneficial' : change < 0 ? 'harmful' : 'neutral',
        trait: stat,
        change,
        description: `${stat} ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change)}`,
      });
    }
  }

  // Evolution bonus
  const evolutionBonus = 1.15 + creature.evolutionStage * 0.05;
  for (const stat of Object.keys(newStats) as (keyof CreatureStats)[]) {
    newStats[stat] = Math.round(newStats[stat] * evolutionBonus);
  }

  const evolvedCreature: Creature = {
    ...creature,
    id: `${creature.id}-evo${creature.evolutionStage + 1}`,
    name: `${creature.name} Mk${creature.evolutionStage + 1}`,
    genetics: {
      sequence: mutatedDna,
      traits: newTraits,
      mutations: creature.genetics.mutations + mutationCount,
      generation: creature.genetics.generation,
    },
    stats: newStats,
    evolutionStage: creature.evolutionStage + 1,
    canEvolve: creature.evolutionStage + 1 < 4,
  };

  return {
    success: true,
    originalCreature: creature,
    evolvedCreature,
    mutations,
    message: `${creature.name} evolved into ${evolvedCreature.name}!`,
  };
}

// ============================================================================
// BREEDING
// ============================================================================

/**
 * Breed two creatures
 */
export function breedCreatures(parent1: Creature, parent2: Creature): BreedingResult {
  // Check compatibility (same species or related elements)
  const compatible =
    parent1.species === parent2.species ||
    ELEMENT_STRENGTHS[parent1.element]?.includes(parent2.element) ||
    ELEMENT_STRENGTHS[parent2.element]?.includes(parent1.element);

  if (!compatible) {
    return {
      success: false,
      parents: [parent1, parent2],
      inheritedTraits: [],
      newMutations: [],
      message: 'These creatures are not compatible for breeding.',
    };
  }

  // Crossover DNA
  const crossoverPoint = Math.floor(parent1.genetics.sequence.length / 2);
  let offspringDna =
    parent1.genetics.sequence.slice(0, crossoverPoint) +
    parent2.genetics.sequence.slice(crossoverPoint);

  // Apply breeding mutations
  const { sequence: mutatedDna, mutations } = mutateDna(offspringDna, 0.03);

  // Inherit traits
  const inheritedTraits: string[] = [];
  const allTraits = [...parent1.genetics.traits, ...parent2.genetics.traits];

  for (const trait of allTraits) {
    if (trait.dominant || Math.random() > 0.3) {
      inheritedTraits.push(trait.name);
    }
  }

  // Create offspring
  const offspring = createCreature(
    `${parent1.name.slice(0, 3)}${parent2.name.slice(-3)}`,
    parent1.species,
    mutatedDna
  );

  offspring.genetics.generation = Math.max(
    parent1.genetics.generation,
    parent2.genetics.generation
  ) + 1;

  // Determine element (blend or dominant)
  offspring.element = Math.random() > 0.5 ? parent1.element : parent2.element;

  const newMutations: MutationEvent[] = [];
  if (mutations > 0) {
    newMutations.push({
      type: 'neutral',
      trait: 'genetics',
      change: mutations,
      description: `${mutations} genetic mutations occurred during breeding`,
    });
  }

  return {
    success: true,
    parents: [parent1, parent2],
    offspring,
    inheritedTraits: [...new Set(inheritedTraits)],
    newMutations,
    message: `A new ${offspring.species} was born: ${offspring.name}!`,
  };
}

// ============================================================================
// POTION EFFECTS (CHEMISTRY)
// ============================================================================

export const POTIONS: Record<string, PotionEffect> = {
  strength_elixir: {
    name: 'Strength Elixir',
    type: 'boost',
    targetStat: 'attack',
    magnitude: 1.5,
    duration: 3,
    sideEffects: ['Slight defense reduction'],
  },
  vitality_brew: {
    name: 'Vitality Brew',
    type: 'heal',
    targetStat: 'health',
    magnitude: 50,
    duration: 1,
  },
  speed_serum: {
    name: 'Speed Serum',
    type: 'boost',
    targetStat: 'speed',
    magnitude: 2.0,
    duration: 2,
    sideEffects: ['Causes jitters'],
  },
  mutation_catalyst: {
    name: 'Mutation Catalyst',
    type: 'mutate',
    magnitude: 0.15,
    duration: 0,
    sideEffects: ['Unpredictable genetic changes'],
  },
  elemental_essence: {
    name: 'Elemental Essence',
    type: 'transform',
    magnitude: 1,
    duration: 5,
    sideEffects: ['Temporary element change'],
  },
};

/**
 * Apply potion to creature
 */
export function applyPotion(
  creature: Creature,
  potionId: string
): { creature: Creature; effect: string } {
  const potion = POTIONS[potionId];
  if (!potion) {
    return { creature, effect: 'Unknown potion' };
  }

  const modifiedCreature = { ...creature, stats: { ...creature.stats } };
  let effect = '';

  switch (potion.type) {
    case 'boost':
      if (potion.targetStat) {
        modifiedCreature.stats[potion.targetStat] = Math.round(
          modifiedCreature.stats[potion.targetStat] * potion.magnitude
        );
        effect = `${potion.targetStat} boosted by ${(potion.magnitude - 1) * 100}%`;
      }
      break;

    case 'heal':
      if (potion.targetStat === 'health') {
        modifiedCreature.stats.health += potion.magnitude;
        effect = `Healed ${potion.magnitude} health`;
      }
      break;

    case 'mutate':
      const { sequence } = mutateDna(creature.genetics.sequence, potion.magnitude);
      modifiedCreature.genetics = {
        ...creature.genetics,
        sequence,
        mutations: creature.genetics.mutations + 1,
      };
      modifiedCreature.stats = calculateStatsFromTraits(extractTraits(sequence));
      effect = 'Genetic mutation applied';
      break;

    case 'transform':
      // Randomly change element
      const elements: ElementType[] = ['fire', 'water', 'earth', 'air', 'lightning', 'nature', 'dark', 'light'];
      modifiedCreature.element = elements[Math.floor(Math.random() * elements.length)];
      effect = `Element transformed to ${modifiedCreature.element}`;
      break;
  }

  return { creature: modifiedCreature, effect };
}

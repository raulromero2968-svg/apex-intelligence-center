/**
 * TCG Creatures API Routes
 *
 * Biology/evolution creature simulation for TCG.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createCreature,
  evolveCreature,
  breedCreatures,
  applyPotion,
  generateDnaSequence,
  mutateDna,
  extractTraits,
  POTIONS,
  ELEMENT_STRENGTHS,
  type Creature,
} from '@/lib/tcg-domains';

// In-memory creature storage (use database in production)
const creatures = new Map<string, Creature>();

/**
 * POST /api/tcg/creatures
 * Creature operations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create': {
        const { name, species, dna } = body;

        if (!name || !species) {
          return NextResponse.json(
            { error: 'name and species required' },
            { status: 400 }
          );
        }

        const creature = createCreature(name, species, dna);
        creatures.set(creature.id, creature);

        return NextResponse.json({ success: true, creature });
      }

      case 'evolve': {
        const { creatureId, xp } = body;

        if (!creatureId) {
          return NextResponse.json({ error: 'creatureId required' }, { status: 400 });
        }

        const creature = creatures.get(creatureId);
        if (!creature) {
          return NextResponse.json({ error: 'Creature not found' }, { status: 404 });
        }

        const result = evolveCreature(creature, xp);

        if (result.success && result.evolvedCreature) {
          creatures.set(result.evolvedCreature.id, result.evolvedCreature);
        }

        return NextResponse.json({ success: true, result });
      }

      case 'breed': {
        const { parent1Id, parent2Id } = body;

        if (!parent1Id || !parent2Id) {
          return NextResponse.json(
            { error: 'parent1Id and parent2Id required' },
            { status: 400 }
          );
        }

        const parent1 = creatures.get(parent1Id);
        const parent2 = creatures.get(parent2Id);

        if (!parent1 || !parent2) {
          return NextResponse.json({ error: 'One or both parents not found' }, { status: 404 });
        }

        const result = breedCreatures(parent1, parent2);

        if (result.success && result.offspring) {
          creatures.set(result.offspring.id, result.offspring);
        }

        return NextResponse.json({ success: true, result });
      }

      case 'apply-potion': {
        const { creatureId, potionId } = body;

        if (!creatureId || !potionId) {
          return NextResponse.json(
            { error: 'creatureId and potionId required' },
            { status: 400 }
          );
        }

        const creature = creatures.get(creatureId);
        if (!creature) {
          return NextResponse.json({ error: 'Creature not found' }, { status: 404 });
        }

        const { creature: modified, effect } = applyPotion(creature, potionId);
        creatures.set(modified.id, modified);

        return NextResponse.json({ success: true, creature: modified, effect });
      }

      case 'generate-dna': {
        const { length } = body;
        const dna = generateDnaSequence(length || 30);
        const traits = extractTraits(dna);

        return NextResponse.json({ success: true, dna, traits });
      }

      case 'mutate-dna': {
        const { sequence, mutationRate } = body;

        if (!sequence) {
          return NextResponse.json({ error: 'sequence required' }, { status: 400 });
        }

        const result = mutateDna(sequence, mutationRate || 0.05);
        const newTraits = extractTraits(result.sequence);

        return NextResponse.json({
          success: true,
          original: sequence,
          mutated: result.sequence,
          mutationCount: result.mutations,
          traits: newTraits,
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing creature request:', error);
    return NextResponse.json(
      { error: 'Failed to process creature request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tcg/creatures
 * Get creature info
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const creatureId = searchParams.get('id');

    switch (type) {
      case 'creature':
        if (!creatureId) {
          return NextResponse.json({ error: 'id required' }, { status: 400 });
        }

        const creature = creatures.get(creatureId);
        if (!creature) {
          return NextResponse.json({ error: 'Creature not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, creature });

      case 'all':
        return NextResponse.json({
          success: true,
          creatures: Array.from(creatures.values()),
        });

      case 'potions':
        return NextResponse.json({
          success: true,
          potions: Object.entries(POTIONS).map(([id, potion]) => ({
            id,
            ...potion,
          })),
        });

      case 'elements':
        return NextResponse.json({
          success: true,
          elements: Object.entries(ELEMENT_STRENGTHS).map(([element, strengths]) => ({
            element,
            strongAgainst: strengths,
          })),
        });

      default:
        return NextResponse.json(
          { error: 'Invalid type. Use: creature, all, potions, or elements' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching creature info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch creature info' },
      { status: 500 }
    );
  }
}

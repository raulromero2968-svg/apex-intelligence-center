/**
 * 3D World Database Schema
 *
 * Stores world states, hero positions, and simulation data
 * for the Grok Hero 3D TCG environment.
 *
 * Uses pgvector for scene state similarity search.
 */

import { pgTable, text, timestamp, jsonb, integer, real, boolean, uuid } from 'drizzle-orm/pg-core';
import { vector } from 'pgvector/drizzle-orm';

// ============================================================================
// WORLD STATE
// ============================================================================

/**
 * Stores persistent world state for each user
 */
export const worldStates = pgTable('world_states', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  worldId: text('world_id').notNull().default('default'),

  // Hero state
  heroPosition: jsonb('hero_position').$type<[number, number, number]>().default([0, 0, 0]),
  heroRotation: jsonb('hero_rotation').$type<[number, number, number]>().default([0, 0, 0]),
  heroStats: jsonb('hero_stats').$type<{
    health: number;
    energy: number;
    experience: number;
    level: number;
  }>().default({ health: 100, energy: 100, experience: 0, level: 1 }),

  // Scene vector for similarity search (pgvector)
  sceneVector: vector('scene_vector', { dimensions: 128 }),

  // Full simulation data
  simData: jsonb('sim_data').$type<{
    cards: Array<{ id: string; position: [number, number, number]; rotation: [number, number, number] }>;
    npcs: Array<{ id: string; type: string; position: [number, number, number] }>;
    weather: string;
    timeOfDay: number;
    activeQuests: string[];
  }>(),

  // Metadata
  lastActive: timestamp('last_active').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================================================
// WORLD ZONES
// ============================================================================

/**
 * Defines regions/zones in the 3D world
 */
export const worldZones = pgTable('world_zones', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),

  // Spatial bounds
  boundsMin: jsonb('bounds_min').$type<[number, number, number]>().notNull(),
  boundsMax: jsonb('bounds_max').$type<[number, number, number]>().notNull(),

  // Zone properties
  zoneType: text('zone_type').notNull(), // 'market', 'arena', 'wilderness', 'city'
  elementAffinity: text('element_affinity'), // Fire, Water, etc.
  difficultyLevel: integer('difficulty_level').default(1),

  // Visual settings
  environment: jsonb('environment').$type<{
    skybox: string;
    ambientColor: string;
    fogDensity: number;
    music: string;
  }>(),

  // Active effects
  activeBoosts: jsonb('active_boosts').$type<Array<{
    element: string;
    modifier: number;
    duration: number;
  }>>(),

  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================================================
// WORLD CARDS (3D Instances)
// ============================================================================

/**
 * Cards placed in the 3D world
 */
export const worldCards = pgTable('world_cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  cardId: text('card_id').notNull(), // Reference to TCG card
  worldId: text('world_id').notNull(),
  zoneId: uuid('zone_id').references(() => worldZones.id),

  // 3D Transform
  position: jsonb('position').$type<[number, number, number]>().notNull(),
  rotation: jsonb('rotation').$type<[number, number, number]>().default([0, 0, 0]),
  scale: real('scale').default(1),

  // State
  isVisible: boolean('is_visible').default(true),
  isInteractable: boolean('is_interactable').default(true),
  ownerId: text('owner_id'),
  quantumState: text('quantum_state').default('ground'), // ground, superposition, entangled

  // Interaction history
  lastInteraction: timestamp('last_interaction'),
  interactionCount: integer('interaction_count').default(0),

  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================================================
// WORLD EVENTS
// ============================================================================

/**
 * Dynamic events occurring in the world
 */
export const worldEvents = pgTable('world_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  worldId: text('world_id').notNull(),
  zoneId: uuid('zone_id').references(() => worldZones.id),

  // Event details
  eventType: text('event_type').notNull(), // 'ddil_storm', 'market_surge', 'boss_spawn', 'tournament'
  name: text('name').notNull(),
  description: text('description'),

  // Spatial info
  epicenter: jsonb('epicenter').$type<[number, number, number]>(),
  radius: real('radius').default(10),

  // Timing
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  duration: integer('duration'), // seconds

  // Effects
  effects: jsonb('effects').$type<Array<{
    type: string;
    target: string;
    value: number;
  }>>(),

  // Status
  status: text('status').default('scheduled'), // scheduled, active, completed, cancelled

  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================================================
// HERO INVENTORY (3D World specific)
// ============================================================================

/**
 * Items collected in the 3D world
 */
export const worldInventory = pgTable('world_inventory', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),

  // Item details
  itemType: text('item_type').notNull(), // 'card', 'potion', 'artifact', 'material'
  itemId: text('item_id').notNull(),
  quantity: integer('quantity').default(1),

  // Metadata
  acquiredAt: timestamp('acquired_at').defaultNow(),
  acquiredFrom: text('acquired_from'), // zone/event/trade
  equipped: boolean('equipped').default(false),
});

// ============================================================================
// SIMULATION LOGS
// ============================================================================

/**
 * Logs for Omniverse/physics simulations
 */
export const simulationLogs = pgTable('simulation_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  worldId: text('world_id').notNull(),

  // Simulation details
  simType: text('sim_type').notNull(), // 'physics', 'battle', 'market', 'weather'
  inputData: jsonb('input_data'),
  outputData: jsonb('output_data'),

  // Performance
  durationMs: integer('duration_ms'),
  frameCount: integer('frame_count'),

  // Ethics tracking
  ethicsScore: real('ethics_score'),
  ethicsCategory: text('ethics_category'),

  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================================================
// TYPES
// ============================================================================

export type WorldState = typeof worldStates.$inferSelect;
export type NewWorldState = typeof worldStates.$inferInsert;
export type WorldZone = typeof worldZones.$inferSelect;
export type WorldCard = typeof worldCards.$inferSelect;
export type WorldEvent = typeof worldEvents.$inferSelect;
export type WorldInventory = typeof worldInventory.$inferSelect;
export type SimulationLog = typeof simulationLogs.$inferSelect;

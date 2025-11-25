/**
 * 3D World Schema for Apex Intelligence
 *
 * Implements the Three.js-based 3D world system with:
 * - Scene configurations for immersive TCG environments
 * - Hero controller state persistence
 * - Real-time WebSocket session tracking
 * - Procedural audio generation settings
 *
 * @see pack-webxr-001 for Three.js integration
 */

import { pgTable, text, boolean, jsonb, timestamp, uuid, index, uniqueIndex, integer, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from '../schema';

// ============================================================================
// 3D WORLD SCENE MANAGEMENT
// ============================================================================

/**
 * World Scenes - Pre-configured 3D environments for TCG exploration
 *
 * Each scene represents a themed environment with lighting, objects,
 * and interactive elements for card viewing and portfolio visualization.
 */
export const worldScenes = pgTable('world_scenes', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Scene identification
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),

  // Scene type
  sceneType: text('scene_type', {
    enum: ['gallery', 'arena', 'collection_room', 'trading_floor', 'custom']
  }).notNull().default('gallery'),

  // Three.js scene configuration
  config: jsonb('config').$type<{
    // Camera settings
    camera: {
      position: [number, number, number];
      fov: number;
      near: number;
      far: number;
    };
    // Lighting configuration
    lighting: {
      ambient: { color: string; intensity: number };
      directional?: { color: string; intensity: number; position: [number, number, number] };
      points?: Array<{ color: string; intensity: number; position: [number, number, number] }>;
    };
    // Environment settings
    environment: {
      background: string;
      fog?: { color: string; near: number; far: number };
      skybox?: string;
    };
    // Physics settings (optional)
    physics?: {
      gravity: [number, number, number];
      friction: number;
    };
  }>().notNull(),

  // Interactive elements
  interactiveElements: jsonb('interactive_elements').$type<Array<{
    id: string;
    type: 'card_display' | 'portfolio_pedestal' | 'info_panel' | 'portal' | 'npc';
    position: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
    metadata?: Record<string, any>;
  }>>().default([]),

  // Audio configuration
  audioConfig: jsonb('audio_config').$type<{
    ambient?: { url?: string; volume: number; loop: boolean };
    procedural?: {
      enabled: boolean;
      type: 'cyberpunk' | 'nature' | 'industrial' | 'epic';
      parameters: Record<string, number>;
    };
  }>(),

  // Visibility and access
  isPublic: boolean('is_public').default(false).notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  creatorId: text('creator_id').references(() => users.id, { onDelete: 'set null' }),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex('idx_world_scenes_slug').on(table.slug),
  typeIdx: index('idx_world_scenes_type').on(table.sceneType),
  publicIdx: index('idx_world_scenes_public').on(table.isPublic),
  creatorIdx: index('idx_world_scenes_creator').on(table.creatorId),
}));

/**
 * Hero Controllers - Player avatar state and preferences
 *
 * Tracks the "Grok Hero" player state including position,
 * inventory, and customization options.
 */
export const heroControllers = pgTable('hero_controllers', {
  id: uuid('id').defaultRandom().primaryKey(),

  // User reference
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Hero identification
  heroName: text('hero_name').notNull().default('Grok'),
  avatarType: text('avatar_type', {
    enum: ['default', 'collector', 'trader', 'analyst', 'champion', 'custom']
  }).default('default').notNull(),

  // Position and state in current scene
  currentSceneId: uuid('current_scene_id').references(() => worldScenes.id, { onDelete: 'set null' }),
  position: jsonb('position').$type<[number, number, number]>().default([0, 0, 0]).notNull(),
  rotation: jsonb('rotation').$type<[number, number, number]>().default([0, 0, 0]).notNull(),

  // Avatar customization
  appearance: jsonb('appearance').$type<{
    model?: string;
    texture?: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
    accessories?: string[];
  }>().default({ colors: { primary: '#00D4FF', secondary: '#7B2FFF', accent: '#FFFFFF' } }),

  // Movement settings
  movementConfig: jsonb('movement_config').$type<{
    walkSpeed: number;
    runSpeed: number;
    jumpHeight: number;
    sensitivity: number;
  }>().default({ walkSpeed: 5, runSpeed: 10, jumpHeight: 2, sensitivity: 1 }),

  // Inventory (collected items, unlocked scenes, etc.)
  inventory: jsonb('inventory').$type<{
    unlockedScenes: string[];
    collectedItems: Array<{ id: string; type: string; acquiredAt: string }>;
    achievements: Array<{ id: string; unlockedAt: string }>;
  }>().default({ unlockedScenes: [], collectedItems: [], achievements: [] }),

  // Statistics
  stats: jsonb('stats').$type<{
    totalPlayTime: number; // seconds
    scenesVisited: number;
    cardsViewed: number;
    tradesWitnessed: number;
  }>().default({ totalPlayTime: 0, scenesVisited: 0, cardsViewed: 0, tradesWitnessed: 0 }),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_hero_controllers_user').on(table.userId),
  sceneIdx: index('idx_hero_controllers_scene').on(table.currentSceneId),
  uniqueUserHero: uniqueIndex('idx_hero_controllers_user_unique').on(table.userId),
}));

/**
 * World Sessions - Real-time session tracking via WebSocket
 *
 * Tracks active 3D world sessions for multiplayer coordination
 * and analytics.
 */
export const worldSessions = pgTable('world_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),

  // User and hero reference
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  heroId: uuid('hero_id').references(() => heroControllers.id, { onDelete: 'set null' }),
  sceneId: uuid('scene_id').references(() => worldScenes.id, { onDelete: 'set null' }),

  // WebSocket connection info
  socketId: text('socket_id').notNull(),
  connectionStatus: text('connection_status', {
    enum: ['connected', 'disconnected', 'reconnecting']
  }).default('connected').notNull(),

  // Session metadata
  deviceInfo: jsonb('device_info').$type<{
    userAgent: string;
    platform: string;
    gpuRenderer?: string;
    screenResolution?: [number, number];
  }>(),

  // Performance metrics
  performanceMetrics: jsonb('performance_metrics').$type<{
    avgFps: number;
    avgLatency: number;
    memoryUsage?: number;
  }>(),

  // Session timing
  startedAt: timestamp('started_at').defaultNow().notNull(),
  lastPingAt: timestamp('last_ping_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),

  // Session duration (computed on end)
  durationSeconds: integer('duration_seconds'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_world_sessions_user').on(table.userId),
  sceneIdx: index('idx_world_sessions_scene').on(table.sceneId),
  statusIdx: index('idx_world_sessions_status').on(table.connectionStatus),
  startedIdx: index('idx_world_sessions_started').on(table.startedAt),
  socketIdx: uniqueIndex('idx_world_sessions_socket').on(table.socketId),
}));

/**
 * Procedural Audio Settings - User preferences for generated soundscapes
 */
export const proceduralAudioSettings = pgTable('procedural_audio_settings', {
  id: uuid('id').defaultRandom().primaryKey(),

  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Audio preferences
  enabled: boolean('enabled').default(true).notNull(),
  masterVolume: real('master_volume').default(0.7).notNull(),

  // Generator settings
  generatorConfig: jsonb('generator_config').$type<{
    type: 'cyberpunk' | 'ambient' | 'epic' | 'minimal';
    tempo: number; // BPM
    key: string; // Musical key
    mood: 'energetic' | 'calm' | 'tense' | 'triumphant';
    layers: {
      bass: boolean;
      drums: boolean;
      synth: boolean;
      ambient: boolean;
    };
    effects: {
      reverb: number;
      delay: number;
      filter: number;
    };
  }>().default({
    type: 'cyberpunk',
    tempo: 120,
    key: 'Am',
    mood: 'energetic',
    layers: { bass: true, drums: true, synth: true, ambient: true },
    effects: { reverb: 0.3, delay: 0.2, filter: 0.5 }
  }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: uniqueIndex('idx_procedural_audio_user').on(table.userId),
}));

// ============================================================================
// RELATIONS
// ============================================================================

export const worldScenesRelations = relations(worldScenes, ({ one, many }) => ({
  creator: one(users, {
    fields: [worldScenes.creatorId],
    references: [users.id],
  }),
  sessions: many(worldSessions),
  heroes: many(heroControllers),
}));

export const heroControllersRelations = relations(heroControllers, ({ one, many }) => ({
  user: one(users, {
    fields: [heroControllers.userId],
    references: [users.id],
  }),
  currentScene: one(worldScenes, {
    fields: [heroControllers.currentSceneId],
    references: [worldScenes.id],
  }),
  sessions: many(worldSessions),
}));

export const worldSessionsRelations = relations(worldSessions, ({ one }) => ({
  user: one(users, {
    fields: [worldSessions.userId],
    references: [users.id],
  }),
  hero: one(heroControllers, {
    fields: [worldSessions.heroId],
    references: [heroControllers.id],
  }),
  scene: one(worldScenes, {
    fields: [worldSessions.sceneId],
    references: [worldScenes.id],
  }),
}));

export const proceduralAudioSettingsRelations = relations(proceduralAudioSettings, ({ one }) => ({
  user: one(users, {
    fields: [proceduralAudioSettings.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type WorldScene = typeof worldScenes.$inferSelect;
export type NewWorldScene = typeof worldScenes.$inferInsert;
export type HeroController = typeof heroControllers.$inferSelect;
export type NewHeroController = typeof heroControllers.$inferInsert;
export type WorldSession = typeof worldSessions.$inferSelect;
export type NewWorldSession = typeof worldSessions.$inferInsert;
export type ProceduralAudioSetting = typeof proceduralAudioSettings.$inferSelect;
export type NewProceduralAudioSetting = typeof proceduralAudioSettings.$inferInsert;

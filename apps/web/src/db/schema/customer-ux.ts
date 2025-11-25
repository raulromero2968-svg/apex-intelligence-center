/**
 * Customer UX Schema for Apex Intelligence
 *
 * Implements personalized customer experience with:
 * - User preferences with pgvector embeddings for similarity
 * - AR event tracking for location-based experiences
 * - Engagement metrics and delight moments
 * - Real-time preference updates
 *
 * @see knowledge-09-database-architecture for pgvector patterns
 * @see pack-ai-defense-001 for resilience adaptations
 */

import { pgTable, text, boolean, jsonb, timestamp, uuid, index, uniqueIndex, integer, real, customType } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from '../schema';

/**
 * Custom pgvector type for preference embeddings
 */
const vector = customType<{ data: number[]; driverData: string }>({
  dataType(config) {
    return config?.dimensions ? `vector(${config.dimensions})` : 'vector';
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): number[] {
    return value.slice(1, -1).split(',').map(Number);
  },
});

// ============================================================================
// USER PREFERENCES (PGVECTOR FOR SIMILARITY)
// ============================================================================

/**
 * User Preferences - Personalized TCG interests with vector embeddings
 *
 * Stores user preferences for hyper-personalized recommendations.
 * Uses OpenAI text-embedding-3-large (1536 dims) for similarity search.
 */
export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').defaultRandom().primaryKey(),

  // User reference
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // TCG interests (structured JSON)
  tcgInterests: jsonb('tcg_interests').$type<{
    themes: string[]; // ['biology', 'quantum', 'defense', 'retro']
    playStyle: 'aggressive' | 'defensive' | 'balanced' | 'collector';
    favoriteGames: string[]; // ['pokemon', 'mtg', 'yugioh']
    priceRange: { min: number; max: number };
    rarity: 'common' | 'rare' | 'ultra_rare' | 'any';
    gradingPreference: 'raw' | 'psa' | 'bgs' | 'cgc' | 'any';
  }>().notNull().default({
    themes: [],
    playStyle: 'balanced',
    favoriteGames: ['pokemon'],
    priceRange: { min: 0, max: 1000 },
    rarity: 'any',
    gradingPreference: 'any',
  }),

  // Vector embedding for similarity search (1536 dims for OpenAI)
  prefVector: vector('pref_vector', { dimensions: 1536 }),

  // Engagement metrics
  engagementScore: real('engagement_score').default(0).notNull(),
  lastActiveAt: timestamp('last_active_at').defaultNow().notNull(),
  totalSessions: integer('total_sessions').default(0).notNull(),
  avgSessionDuration: real('avg_session_duration').default(0), // seconds

  // Personalization settings
  personalizationEnabled: boolean('personalization_enabled').default(true).notNull(),
  arEventsEnabled: boolean('ar_events_enabled').default(true).notNull(),
  realTimeUpdates: boolean('real_time_updates').default(true).notNull(),

  // Ethics opt-in
  dataCollectionConsent: boolean('data_collection_consent').default(false).notNull(),
  consentUpdatedAt: timestamp('consent_updated_at'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: uniqueIndex('idx_user_preferences_user').on(table.userId),
  engagementIdx: index('idx_user_preferences_engagement').on(table.engagementScore),
  activeIdx: index('idx_user_preferences_active').on(table.lastActiveAt),
  // HNSW index for fast vector similarity (created in migration)
  // prefVectorIdx: index('idx_user_preferences_vector').on(table.prefVector).using('hnsw'),
}));

// ============================================================================
// AR EVENTS (LOCATION-BASED EXPERIENCES)
// ============================================================================

/**
 * AR Events - Location-based augmented reality TCG events
 *
 * Tracks AR events for users based on location, weather,
 * and personalized preferences.
 */
export const arEvents = pgTable('ar_events', {
  id: uuid('id').defaultRandom().primaryKey(),

  // User reference
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Location data (user-consented)
  location: text('location').notNull(),
  coordinates: jsonb('coordinates').$type<{
    lat: number;
    lng: number;
    accuracy?: number;
  }>(),

  // Weather boost (from previous expansion)
  weatherBoost: text('weather_boost'), // 'rain', 'sunny', 'snow', etc.
  weatherMultiplier: real('weather_multiplier').default(1.0),

  // Event data
  eventType: text('event_type', {
    enum: ['card_spawn', 'battle_arena', 'trade_meetup', 'tournament', 'special']
  }).notNull().default('card_spawn'),

  eventData: jsonb('event_data').$type<{
    stores?: Array<{ name: string; address: string; distance: number }>;
    cards?: Array<{ cardId: string; rarity: string; spawnRate: number }>;
    rewards?: Array<{ type: string; amount: number }>;
    duration?: number; // minutes
    participants?: number;
  }>().default({}),

  // Status
  status: text('status', {
    enum: ['active', 'completed', 'expired', 'cancelled']
  }).default('active').notNull(),

  // Engagement tracking
  participated: boolean('participated').default(false).notNull(),
  rewardsCollected: boolean('rewards_collected').default(false).notNull(),

  // Timing
  startsAt: timestamp('starts_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  completedAt: timestamp('completed_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_ar_events_user').on(table.userId),
  statusIdx: index('idx_ar_events_status').on(table.status),
  startsIdx: index('idx_ar_events_starts').on(table.startsAt),
  expiresIdx: index('idx_ar_events_expires').on(table.expiresAt),
  locationIdx: index('idx_ar_events_location').on(table.location),
}));

// ============================================================================
// DELIGHT MOMENTS (ENGAGEMENT BOOSTS)
// ============================================================================

/**
 * Delight Moments - Personalized surprise interactions
 *
 * Tracks special moments designed to delight users and boost engagement.
 */
export const delightMoments = pgTable('delight_moments', {
  id: uuid('id').defaultRandom().primaryKey(),

  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Moment type
  momentType: text('moment_type', {
    enum: ['daily_reward', 'streak_bonus', 'weather_animation', 'quantum_rng', 'achievement', 'personalized_tip']
  }).notNull(),

  // Moment data
  title: text('title').notNull(),
  description: text('description'),
  data: jsonb('data').$type<{
    reward?: { type: string; amount: number };
    animation?: string;
    streakDays?: number;
    cardSuggestions?: string[];
  }>(),

  // User interaction
  viewed: boolean('viewed').default(false).notNull(),
  dismissed: boolean('dismissed').default(false).notNull(),
  interactionType: text('interaction_type'), // 'clicked', 'shared', 'saved'

  // Timing
  triggeredAt: timestamp('triggered_at').defaultNow().notNull(),
  viewedAt: timestamp('viewed_at'),
  expiresAt: timestamp('expires_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_delight_moments_user').on(table.userId),
  typeIdx: index('idx_delight_moments_type').on(table.momentType),
  viewedIdx: index('idx_delight_moments_viewed').on(table.viewed),
  triggeredIdx: index('idx_delight_moments_triggered').on(table.triggeredAt),
}));

// ============================================================================
// CX METRICS (CUSTOMER EXPERIENCE TRACKING)
// ============================================================================

/**
 * CX Metrics - Customer experience score tracking
 *
 * Aggregates engagement, satisfaction, and personalization metrics.
 */
export const cxMetrics = pgTable('cx_metrics', {
  id: uuid('id').defaultRandom().primaryKey(),

  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // NPS-style metrics
  npsScore: integer('nps_score'), // -100 to 100
  satisfactionScore: real('satisfaction_score'), // 0-5
  effortScore: real('effort_score'), // 0-5 (lower is better)

  // Engagement metrics
  weeklyActiveMinutes: integer('weekly_active_minutes').default(0).notNull(),
  featuresUsed: jsonb('features_used').$type<string[]>().default([]),
  returnVisitRate: real('return_visit_rate').default(0), // 0-1

  // Personalization effectiveness
  recommendationAcceptRate: real('recommendation_accept_rate').default(0), // 0-1
  personalizedVsGenericEngagement: real('personalized_vs_generic_engagement').default(1), // ratio

  // Computed CX score (0-100)
  cxScore: real('cx_score').default(50).notNull(),

  // Period
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_cx_metrics_user').on(table.userId),
  periodIdx: index('idx_cx_metrics_period').on(table.periodStart, table.periodEnd),
  cxScoreIdx: index('idx_cx_metrics_score').on(table.cxScore),
}));

// ============================================================================
// RELATIONS
// ============================================================================

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

export const arEventsRelations = relations(arEvents, ({ one }) => ({
  user: one(users, {
    fields: [arEvents.userId],
    references: [users.id],
  }),
}));

export const delightMomentsRelations = relations(delightMoments, ({ one }) => ({
  user: one(users, {
    fields: [delightMoments.userId],
    references: [users.id],
  }),
}));

export const cxMetricsRelations = relations(cxMetrics, ({ one }) => ({
  user: one(users, {
    fields: [cxMetrics.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type UserPreference = typeof userPreferences.$inferSelect;
export type NewUserPreference = typeof userPreferences.$inferInsert;
export type ArEvent = typeof arEvents.$inferSelect;
export type NewArEvent = typeof arEvents.$inferInsert;
export type DelightMoment = typeof delightMoments.$inferSelect;
export type NewDelightMoment = typeof delightMoments.$inferInsert;
export type CxMetric = typeof cxMetrics.$inferSelect;
export type NewCxMetric = typeof cxMetrics.$inferInsert;

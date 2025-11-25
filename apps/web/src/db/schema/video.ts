/**
 * Video/Tutorial Schema for Apex Intelligence
 *
 * Implements video tutorial generation from X videos:
 * - Tutorial extraction and generation
 * - Frame and subtitle storage
 * - Script generation via RAG
 * - User tutorial progress tracking
 *
 * @see view_x_video for video processing
 */

import { pgTable, text, boolean, jsonb, timestamp, uuid, index, uniqueIndex, integer, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from '../schema';

// ============================================================================
// VIDEO TUTORIAL SYSTEM
// ============================================================================

/**
 * Source Videos - Ingested X/social videos for tutorial generation
 */
export const sourceVideos = pgTable('source_videos', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Source info
  platform: text('platform', {
    enum: ['twitter', 'youtube', 'tiktok']
  }).notNull().default('twitter'),
  sourceUrl: text('source_url').notNull(),
  platformVideoId: text('platform_video_id'),

  // Author info
  authorUsername: text('author_username'),
  authorDisplayName: text('author_display_name'),

  // Video metadata
  title: text('title'),
  description: text('description'),
  duration: integer('duration'), // seconds
  thumbnailUrl: text('thumbnail_url'),

  // Extracted content
  subtitles: text('subtitles'), // Raw subtitle text
  subtitlesTimestamped: jsonb('subtitles_timestamped').$type<Array<{
    start: number;
    end: number;
    text: string;
  }>>(),

  // Extracted frames
  frames: jsonb('frames').$type<Array<{
    timestamp: number;
    imageUrl: string;
    description?: string;
  }>>().default([]),

  // Processing status
  status: text('status', {
    enum: ['pending', 'processing', 'completed', 'failed']
  }).default('pending').notNull(),
  errorMessage: text('error_message'),

  // Content classification
  topic: text('topic'),
  category: text('category', {
    enum: ['strategy', 'market_analysis', 'collection', 'unboxing', 'tournament', 'news', 'other']
  }),

  // Ethics approval
  ethicsApproved: boolean('ethics_approved').default(false).notNull(),
  ethicsCheckAt: timestamp('ethics_check_at'),

  // Timestamps
  fetchedAt: timestamp('fetched_at').defaultNow().notNull(),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  sourceUrlIdx: uniqueIndex('idx_source_videos_url').on(table.sourceUrl),
  platformIdx: index('idx_source_videos_platform').on(table.platform),
  statusIdx: index('idx_source_videos_status').on(table.status),
  categoryIdx: index('idx_source_videos_category').on(table.category),
  authorIdx: index('idx_source_videos_author').on(table.authorUsername),
}));

/**
 * Generated Tutorials - AI-generated tutorials from source videos
 */
export const generatedTutorials = pgTable('generated_tutorials', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Source video reference
  sourceVideoId: uuid('source_video_id').references(() => sourceVideos.id, { onDelete: 'cascade' }),

  // Tutorial metadata
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  topic: text('topic').notNull(),

  // Generated content
  script: text('script').notNull(),
  scriptSections: jsonb('script_sections').$type<Array<{
    title: string;
    content: string;
    timestamp?: number;
    frameRef?: string;
  }>>().default([]),

  // Selected frames for tutorial
  selectedFrames: jsonb('selected_frames').$type<Array<{
    imageUrl: string;
    caption: string;
    order: number;
  }>>().default([]),

  // Key points extracted
  keyPoints: jsonb('key_points').$type<Array<{
    point: string;
    importance: 'high' | 'medium' | 'low';
  }>>().default([]),

  // Card references mentioned
  cardReferences: jsonb('card_references').$type<Array<{
    cardName: string;
    setName?: string;
    context: string;
  }>>().default([]),

  // Difficulty and metadata
  difficulty: text('difficulty', {
    enum: ['beginner', 'intermediate', 'advanced', 'expert']
  }).default('intermediate').notNull(),
  estimatedReadTime: integer('estimated_read_time'), // minutes
  game: text('game', {
    enum: ['pokemon', 'mtg', 'yugioh', 'lorcana', 'general']
  }).default('general').notNull(),

  // Generation metadata
  modelUsed: text('model_used'),
  generationPrompt: text('generation_prompt'),

  // Publication status
  status: text('status', {
    enum: ['draft', 'review', 'published', 'archived']
  }).default('draft').notNull(),
  publishedAt: timestamp('published_at'),

  // Engagement metrics
  viewCount: integer('view_count').default(0).notNull(),
  likeCount: integer('like_count').default(0).notNull(),
  saveCount: integer('save_count').default(0).notNull(),

  // Ethics
  ethicsApproved: boolean('ethics_approved').default(false).notNull(),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex('idx_generated_tutorials_slug').on(table.slug),
  sourceIdx: index('idx_generated_tutorials_source').on(table.sourceVideoId),
  topicIdx: index('idx_generated_tutorials_topic').on(table.topic),
  statusIdx: index('idx_generated_tutorials_status').on(table.status),
  gameIdx: index('idx_generated_tutorials_game').on(table.game),
  viewsIdx: index('idx_generated_tutorials_views').on(table.viewCount),
}));

/**
 * User Tutorial Progress - Tracks user's tutorial completion
 */
export const userTutorialProgress = pgTable('user_tutorial_progress', {
  id: uuid('id').defaultRandom().primaryKey(),

  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tutorialId: uuid('tutorial_id').notNull().references(() => generatedTutorials.id, { onDelete: 'cascade' }),

  // Progress tracking
  status: text('status', {
    enum: ['not_started', 'in_progress', 'completed']
  }).default('not_started').notNull(),
  progressPercent: integer('progress_percent').default(0).notNull(),
  lastSectionIndex: integer('last_section_index').default(0),

  // Engagement
  liked: boolean('liked').default(false).notNull(),
  saved: boolean('saved').default(false).notNull(),
  rating: integer('rating'), // 1-5

  // Time tracking
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  totalTimeSpent: integer('total_time_spent').default(0), // seconds

  // Notes
  userNotes: text('user_notes'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userTutorialIdx: uniqueIndex('idx_user_tutorial_progress_unique').on(table.userId, table.tutorialId),
  userIdx: index('idx_user_tutorial_progress_user').on(table.userId),
  statusIdx: index('idx_user_tutorial_progress_status').on(table.status),
}));

/**
 * Tutorial Collections - Curated tutorial playlists
 */
export const tutorialCollections = pgTable('tutorial_collections', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Collection metadata
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),

  // Curation info
  curatorId: text('curator_id').references(() => users.id, { onDelete: 'set null' }),
  isOfficial: boolean('is_official').default(false).notNull(),
  isPublic: boolean('is_public').default(true).notNull(),

  // Collection content
  tutorialIds: jsonb('tutorial_ids').$type<string[]>().default([]).notNull(),
  tutorialOrder: jsonb('tutorial_order').$type<Record<string, number>>().default({}),

  // Category
  game: text('game', {
    enum: ['pokemon', 'mtg', 'yugioh', 'lorcana', 'general']
  }).default('general').notNull(),
  difficulty: text('difficulty', {
    enum: ['beginner', 'intermediate', 'advanced', 'mixed']
  }).default('mixed').notNull(),

  // Metrics
  followerCount: integer('follower_count').default(0).notNull(),
  totalViews: integer('total_views').default(0).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex('idx_tutorial_collections_slug').on(table.slug),
  curatorIdx: index('idx_tutorial_collections_curator').on(table.curatorId),
  gameIdx: index('idx_tutorial_collections_game').on(table.game),
  publicIdx: index('idx_tutorial_collections_public').on(table.isPublic),
}));

// ============================================================================
// RELATIONS
// ============================================================================

export const sourceVideosRelations = relations(sourceVideos, ({ many }) => ({
  tutorials: many(generatedTutorials),
}));

export const generatedTutorialsRelations = relations(generatedTutorials, ({ one, many }) => ({
  sourceVideo: one(sourceVideos, {
    fields: [generatedTutorials.sourceVideoId],
    references: [sourceVideos.id],
  }),
  userProgress: many(userTutorialProgress),
}));

export const userTutorialProgressRelations = relations(userTutorialProgress, ({ one }) => ({
  user: one(users, {
    fields: [userTutorialProgress.userId],
    references: [users.id],
  }),
  tutorial: one(generatedTutorials, {
    fields: [userTutorialProgress.tutorialId],
    references: [generatedTutorials.id],
  }),
}));

export const tutorialCollectionsRelations = relations(tutorialCollections, ({ one }) => ({
  curator: one(users, {
    fields: [tutorialCollections.curatorId],
    references: [users.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type SourceVideo = typeof sourceVideos.$inferSelect;
export type NewSourceVideo = typeof sourceVideos.$inferInsert;
export type GeneratedTutorial = typeof generatedTutorials.$inferSelect;
export type NewGeneratedTutorial = typeof generatedTutorials.$inferInsert;
export type UserTutorialProgress = typeof userTutorialProgress.$inferSelect;
export type NewUserTutorialProgress = typeof userTutorialProgress.$inferInsert;
export type TutorialCollection = typeof tutorialCollections.$inferSelect;
export type NewTutorialCollection = typeof tutorialCollections.$inferInsert;

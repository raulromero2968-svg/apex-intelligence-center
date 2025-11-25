/**
 * Social & Video Database Schema
 *
 * Schema for community data and video tutorials.
 * Supports X integration, sentiment tracking, and tutorial storage.
 *
 * Tables:
 * - communitySearches: Search query history with results
 * - communityPosts: Cached X posts for analysis
 * - communityInfluencers: Tracked influencers
 * - sentimentReports: Sentiment analysis history
 * - tutorialVideos: Generated tutorial metadata
 * - tutorialSections: Tutorial section content
 * - videoFrames: Extracted video frames
 * - userEngagement: User interaction tracking
 */

import { pgTable, text, uuid, timestamp, jsonb, integer, boolean, real, index } from 'drizzle-orm/pg-core';

// ============================================================================
// COMMUNITY DATA TABLES
// ============================================================================

/**
 * Community search history
 */
export const communitySearches = pgTable(
  'community_searches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id'),
    query: text('query').notNull(),
    resultCount: integer('result_count').default(0),
    sentiment: text('sentiment').$type<'positive' | 'negative' | 'neutral' | 'mixed'>(),
    sentimentScore: real('sentiment_score'),
    searchParams: jsonb('search_params').$type<{
      mode?: string;
      limit?: number;
      dateRange?: { since?: string; until?: string };
    }>(),
    trending: jsonb('trending').$type<
      Array<{
        topic: string;
        postCount: number;
        sentiment: string;
      }>
    >(),
    processingTime: integer('processing_time'), // milliseconds
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    queryIdx: index('community_searches_query_idx').on(table.query),
    userIdx: index('community_searches_user_idx').on(table.userId),
    createdAtIdx: index('community_searches_created_idx').on(table.createdAt),
  })
);

/**
 * Cached community posts
 */
export const communityPosts = pgTable(
  'community_posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    externalId: text('external_id').notNull().unique(), // X post ID
    text: text('text').notNull(),
    username: text('username').notNull(),
    displayName: text('display_name'),
    verified: boolean('verified').default(false),
    likes: integer('likes').default(0),
    retweets: integer('retweets').default(0),
    replies: integer('replies').default(0),
    hashtags: jsonb('hashtags').$type<string[]>().default([]),
    mentions: jsonb('mentions').$type<string[]>().default([]),
    mediaUrls: jsonb('media_urls').$type<string[]>(),
    sentiment: text('sentiment').$type<'positive' | 'negative' | 'neutral'>(),
    relevanceScore: real('relevance_score'),
    postedAt: timestamp('posted_at'),
    cachedAt: timestamp('cached_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at'), // For cache invalidation
  },
  (table) => ({
    externalIdIdx: index('community_posts_external_idx').on(table.externalId),
    usernameIdx: index('community_posts_username_idx').on(table.username),
    sentimentIdx: index('community_posts_sentiment_idx').on(table.sentiment),
    cachedAtIdx: index('community_posts_cached_idx').on(table.cachedAt),
  })
);

/**
 * Tracked influencers
 */
export const communityInfluencers = pgTable(
  'community_influencers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    externalId: text('external_id').notNull().unique(), // X user ID
    username: text('username').notNull(),
    displayName: text('display_name'),
    bio: text('bio'),
    followers: integer('followers').default(0),
    following: integer('following').default(0),
    verified: boolean('verified').default(false),
    profileImageUrl: text('profile_image_url'),
    topics: jsonb('topics').$type<string[]>().default([]), // TCG topics they cover
    engagementRate: real('engagement_rate'),
    isTracked: boolean('is_tracked').default(false),
    lastPostAt: timestamp('last_post_at'),
    discoveredAt: timestamp('discovered_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    usernameIdx: index('influencers_username_idx').on(table.username),
    followersIdx: index('influencers_followers_idx').on(table.followers),
    trackedIdx: index('influencers_tracked_idx').on(table.isTracked),
  })
);

/**
 * Sentiment analysis reports
 */
export const sentimentReports = pgTable(
  'sentiment_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    searchId: uuid('search_id').references(() => communitySearches.id),
    overall: text('overall').$type<'positive' | 'negative' | 'neutral' | 'mixed'>().notNull(),
    score: real('score').notNull(), // -1 to 1
    breakdown: jsonb('breakdown').$type<{
      positive: number;
      negative: number;
      neutral: number;
    }>().notNull(),
    topThemes: jsonb('top_themes').$type<string[]>().default([]),
    insights: jsonb('insights').$type<string[]>().default([]),
    postCount: integer('post_count').default(0),
    generatedAt: timestamp('generated_at').defaultNow().notNull(),
  },
  (table) => ({
    searchIdx: index('sentiment_reports_search_idx').on(table.searchId),
    overallIdx: index('sentiment_reports_overall_idx').on(table.overall),
  })
);

// ============================================================================
// VIDEO & TUTORIAL TABLES
// ============================================================================

/**
 * Generated tutorials
 */
export const tutorialVideos = pgTable(
  'tutorial_videos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id'),
    title: text('title').notNull(),
    topic: text('topic').notNull(),
    sourceVideoUrl: text('source_video_url').notNull(),
    sourceCreator: text('source_creator'),
    totalDuration: integer('total_duration'), // seconds
    sectionCount: integer('section_count').default(0),
    frameCount: integer('frame_count').default(0),
    subtitleCount: integer('subtitle_count').default(0),
    thumbnailUrl: text('thumbnail_url'),
    targetAudience: text('target_audience').$type<'beginner' | 'intermediate' | 'advanced'>(),
    status: text('status').$type<'generating' | 'ready' | 'failed'>().default('generating'),
    processingTime: integer('processing_time'), // milliseconds
    viewCount: integer('view_count').default(0),
    generatedAt: timestamp('generated_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('tutorials_user_idx').on(table.userId),
    topicIdx: index('tutorials_topic_idx').on(table.topic),
    statusIdx: index('tutorials_status_idx').on(table.status),
    createdIdx: index('tutorials_created_idx').on(table.generatedAt),
  })
);

/**
 * Tutorial sections
 */
export const tutorialSections = pgTable(
  'tutorial_sections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tutorialId: uuid('tutorial_id')
      .references(() => tutorialVideos.id, { onDelete: 'cascade' })
      .notNull(),
    sectionIndex: integer('section_index').notNull(),
    title: text('title').notNull(),
    timestamp: integer('timestamp').default(0), // seconds
    duration: integer('duration').default(0), // seconds
    summary: text('summary'),
    keyPoints: jsonb('key_points').$type<string[]>().default([]),
    subtitles: jsonb('subtitles').$type<
      Array<{
        index: number;
        startTime: number;
        endTime: number;
        text: string;
      }>
    >(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    tutorialIdx: index('sections_tutorial_idx').on(table.tutorialId),
    orderIdx: index('sections_order_idx').on(table.tutorialId, table.sectionIndex),
  })
);

/**
 * Extracted video frames
 */
export const videoFrames = pgTable(
  'video_frames',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tutorialId: uuid('tutorial_id')
      .references(() => tutorialVideos.id, { onDelete: 'cascade' })
      .notNull(),
    sectionId: uuid('section_id').references(() => tutorialSections.id, { onDelete: 'cascade' }),
    frameIndex: integer('frame_index').notNull(),
    timestamp: real('timestamp').default(0), // seconds
    imageUrl: text('image_url'),
    imageData: text('image_data'), // Base64 for small previews
    description: text('description'),
    isKeyFrame: boolean('is_key_frame').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    tutorialIdx: index('frames_tutorial_idx').on(table.tutorialId),
    sectionIdx: index('frames_section_idx').on(table.sectionId),
    timestampIdx: index('frames_timestamp_idx').on(table.timestamp),
  })
);

/**
 * User engagement tracking
 */
export const userEngagement = pgTable(
  'user_engagement',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    contentType: text('content_type').$type<'tutorial' | 'post' | 'influencer' | 'search'>().notNull(),
    contentId: uuid('content_id').notNull(),
    action: text('action').$type<'view' | 'like' | 'share' | 'bookmark' | 'complete'>().notNull(),
    duration: integer('duration'), // seconds spent
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('engagement_user_idx').on(table.userId),
    contentIdx: index('engagement_content_idx').on(table.contentType, table.contentId),
    actionIdx: index('engagement_action_idx').on(table.action),
    createdIdx: index('engagement_created_idx').on(table.createdAt),
  })
);

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CommunitySearch = typeof communitySearches.$inferSelect;
export type NewCommunitySearch = typeof communitySearches.$inferInsert;

export type CommunityPost = typeof communityPosts.$inferSelect;
export type NewCommunityPost = typeof communityPosts.$inferInsert;

export type CommunityInfluencer = typeof communityInfluencers.$inferSelect;
export type NewCommunityInfluencer = typeof communityInfluencers.$inferInsert;

export type SentimentReport = typeof sentimentReports.$inferSelect;
export type NewSentimentReport = typeof sentimentReports.$inferInsert;

export type TutorialVideo = typeof tutorialVideos.$inferSelect;
export type NewTutorialVideo = typeof tutorialVideos.$inferInsert;

export type TutorialSection = typeof tutorialSections.$inferSelect;
export type NewTutorialSection = typeof tutorialSections.$inferInsert;

export type VideoFrame = typeof videoFrames.$inferSelect;
export type NewVideoFrame = typeof videoFrames.$inferInsert;

export type UserEngagement = typeof userEngagement.$inferSelect;
export type NewUserEngagement = typeof userEngagement.$inferInsert;

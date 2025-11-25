/**
 * Social Schema for Apex Intelligence
 *
 * Implements X/Twitter community integration for TCG:
 * - Community search results caching
 * - Sentiment analysis storage
 * - Influencer tracking
 * - Engagement metrics
 *
 * @see knowledge-06-data-ab-testing for sentiment patterns
 */

import { pgTable, text, boolean, jsonb, timestamp, uuid, index, uniqueIndex, integer, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from '../schema';

// ============================================================================
// X/TWITTER COMMUNITY DATA
// ============================================================================

/**
 * Community Searches - Cached X search results with sentiment
 *
 * Stores community search results for TCG-related queries with
 * RAG-powered sentiment analysis.
 */
export const communitySearches = pgTable('community_searches', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Search query
  query: text('query').notNull(),
  searchType: text('search_type', {
    enum: ['keyword', 'semantic', 'user', 'hashtag']
  }).notNull(),

  // Results metadata
  resultCount: integer('result_count').notNull().default(0),

  // Aggregated sentiment analysis
  sentimentAnalysis: jsonb('sentiment_analysis').$type<{
    overall: 'bullish' | 'bearish' | 'neutral' | 'mixed';
    score: number; // -1 to 1
    confidence: number; // 0 to 1
    breakdown: {
      positive: number;
      negative: number;
      neutral: number;
    };
    topics: Array<{ topic: string; sentiment: string; count: number }>;
  }>(),

  // Cache control
  fetchedAt: timestamp('fetched_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),

  // Raw results (for debugging/replay)
  rawResults: jsonb('raw_results').$type<{
    posts?: Array<{
      id: string;
      text: string;
      username: string;
      createdAt: string;
      metrics: { likes: number; retweets: number; replies: number };
    }>;
    users?: Array<{
      id: string;
      username: string;
      displayName: string;
      followersCount: number;
      verified: boolean;
    }>;
  }>(),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  queryIdx: index('idx_community_searches_query').on(table.query),
  typeIdx: index('idx_community_searches_type').on(table.searchType),
  expiresIdx: index('idx_community_searches_expires').on(table.expiresAt),
  fetchedIdx: index('idx_community_searches_fetched').on(table.fetchedAt),
}));

/**
 * TCG Influencers - Tracked community influencers
 *
 * Stores influencer profiles for monitoring and engagement tracking.
 */
export const tcgInfluencers = pgTable('tcg_influencers', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Platform identity
  platform: text('platform', {
    enum: ['twitter', 'youtube', 'twitch', 'instagram', 'tiktok']
  }).notNull().default('twitter'),
  platformUserId: text('platform_user_id').notNull(),
  username: text('username').notNull(),
  displayName: text('display_name'),

  // Profile data
  profileImageUrl: text('profile_image_url'),
  bio: text('bio'),
  verified: boolean('verified').default(false).notNull(),

  // Audience metrics
  followersCount: integer('followers_count').default(0).notNull(),
  followingCount: integer('following_count').default(0).notNull(),
  postsCount: integer('posts_count').default(0).notNull(),

  // TCG focus
  primaryGame: text('primary_game', {
    enum: ['pokemon', 'mtg', 'yugioh', 'lorcana', 'one_piece', 'multi']
  }),
  contentType: text('content_type', {
    enum: ['investing', 'collecting', 'gameplay', 'news', 'entertainment', 'mixed']
  }),

  // Engagement tracking
  engagementScore: real('engagement_score').default(0), // Computed metric
  avgLikes: real('avg_likes').default(0),
  avgRetweets: real('avg_retweets').default(0),

  // Reliability for market signals
  reliabilityScore: real('reliability_score').default(0.5), // 0-1, how often predictions are correct
  totalPredictions: integer('total_predictions').default(0),
  correctPredictions: integer('correct_predictions').default(0),

  // Last activity tracking
  lastPostAt: timestamp('last_post_at'),
  lastCheckedAt: timestamp('last_checked_at'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  platformUserIdx: uniqueIndex('idx_tcg_influencers_platform_user').on(table.platform, table.platformUserId),
  usernameIdx: index('idx_tcg_influencers_username').on(table.username),
  gameIdx: index('idx_tcg_influencers_game').on(table.primaryGame),
  followersIdx: index('idx_tcg_influencers_followers').on(table.followersCount),
  reliabilityIdx: index('idx_tcg_influencers_reliability').on(table.reliabilityScore),
}));

/**
 * Community Posts - Individual cached posts for analysis
 *
 * Stores individual posts from community searches for
 * historical analysis and trend detection.
 */
export const communityPosts = pgTable('community_posts', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Platform reference
  platform: text('platform', {
    enum: ['twitter', 'youtube', 'reddit', 'discord']
  }).notNull().default('twitter'),
  platformPostId: text('platform_post_id').notNull(),

  // Author info
  authorUsername: text('author_username').notNull(),
  authorId: text('author_id'),
  influencerId: uuid('influencer_id').references(() => tcgInfluencers.id, { onDelete: 'set null' }),

  // Content
  content: text('content').notNull(),
  contentType: text('content_type', {
    enum: ['text', 'image', 'video', 'thread', 'poll']
  }).default('text').notNull(),

  // Card/market references extracted
  cardMentions: jsonb('card_mentions').$type<Array<{
    cardName: string;
    setName?: string;
    sentiment?: 'bullish' | 'bearish' | 'neutral';
    priceTarget?: number;
  }>>().default([]),

  // Engagement metrics at capture time
  metrics: jsonb('metrics').$type<{
    likes: number;
    retweets: number;
    replies: number;
    views?: number;
    bookmarks?: number;
  }>().notNull(),

  // Sentiment analysis
  sentiment: text('sentiment', {
    enum: ['bullish', 'bearish', 'neutral', 'mixed']
  }),
  sentimentScore: real('sentiment_score'), // -1 to 1

  // Original post timestamp
  postedAt: timestamp('posted_at').notNull(),

  // Cache timestamp
  capturedAt: timestamp('captured_at').defaultNow().notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  platformPostIdx: uniqueIndex('idx_community_posts_platform_post').on(table.platform, table.platformPostId),
  authorIdx: index('idx_community_posts_author').on(table.authorUsername),
  postedAtIdx: index('idx_community_posts_posted').on(table.postedAt),
  sentimentIdx: index('idx_community_posts_sentiment').on(table.sentiment),
  influencerIdx: index('idx_community_posts_influencer').on(table.influencerId),
}));

/**
 * User Social Follows - User's followed influencers
 */
export const userSocialFollows = pgTable('user_social_follows', {
  id: uuid('id').defaultRandom().primaryKey(),

  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  influencerId: uuid('influencer_id').notNull().references(() => tcgInfluencers.id, { onDelete: 'cascade' }),

  // Notification preferences for this follow
  notifyOnPost: boolean('notify_on_post').default(false).notNull(),
  notifyOnCardMention: boolean('notify_on_card_mention').default(true).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userInfluencerIdx: uniqueIndex('idx_user_social_follows_unique').on(table.userId, table.influencerId),
  userIdx: index('idx_user_social_follows_user').on(table.userId),
}));

// ============================================================================
// RELATIONS
// ============================================================================

export const tcgInfluencersRelations = relations(tcgInfluencers, ({ many }) => ({
  posts: many(communityPosts),
  followers: many(userSocialFollows),
}));

export const communityPostsRelations = relations(communityPosts, ({ one }) => ({
  influencer: one(tcgInfluencers, {
    fields: [communityPosts.influencerId],
    references: [tcgInfluencers.id],
  }),
}));

export const userSocialFollowsRelations = relations(userSocialFollows, ({ one }) => ({
  user: one(users, {
    fields: [userSocialFollows.userId],
    references: [users.id],
  }),
  influencer: one(tcgInfluencers, {
    fields: [userSocialFollows.influencerId],
    references: [tcgInfluencers.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CommunitySearch = typeof communitySearches.$inferSelect;
export type NewCommunitySearch = typeof communitySearches.$inferInsert;
export type TcgInfluencer = typeof tcgInfluencers.$inferSelect;
export type NewTcgInfluencer = typeof tcgInfluencers.$inferInsert;
export type CommunityPost = typeof communityPosts.$inferSelect;
export type NewCommunityPost = typeof communityPosts.$inferInsert;
export type UserSocialFollow = typeof userSocialFollows.$inferSelect;
export type NewUserSocialFollow = typeof userSocialFollows.$inferInsert;

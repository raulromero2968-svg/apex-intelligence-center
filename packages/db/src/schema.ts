import { pgTable, text, timestamp, integer, boolean, jsonb, uuid, decimal, index } from 'drizzle-orm/pg-core';

// User table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Watchlist table
export const watchlist = pgTable('watchlist', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  cardId: text('card_id').notNull(),
  game: text('game').notNull(),
  targetPrice: integer('target_price'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Portfolio table
export const portfolio = pgTable('portfolio', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  cardId: text('card_id').notNull(),
  game: text('game').notNull(),
  quantity: integer('quantity').notNull().default(1),
  purchasePrice: integer('purchase_price'),
  purchaseDate: timestamp('purchase_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Notification preferences
export const notificationPreferences = pgTable('notification_preferences', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  email: boolean('email').default(true),
  push: boolean('push').default(true),
  priceAlerts: boolean('price_alerts').default(true),
  weeklyDigest: boolean('weekly_digest').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Push tokens (Expo/FCM/APNS)
export const pushTokens = pgTable('push_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  token: text('token').notNull().unique(),
  platform: text('platform').notNull(), // 'expo' | 'fcm' | 'apns'
  active: boolean('active').default(true).notNull(),
  lastUsed: timestamp('last_used').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Push notification tickets (for receipt validation)
export const pushTickets = pgTable('push_tickets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  tokenId: uuid('token_id').references(() => pushTokens.id).notNull(),
  ticketId: text('ticket_id').notNull().unique(), // Expo ticket ID
  status: text('status').notNull().default('sent'), // 'sent' | 'delivered' | 'failed'
  retries: integer('retries').default(0).notNull(),
  nextAttemptAt: timestamp('next_attempt_at'),
  deliveredAt: timestamp('delivered_at'),
  failedAt: timestamp('failed_at'),
  errorDetails: jsonb('error_details'), // Store error info from Expo
  payload: jsonb('payload').notNull(), // Original notification payload
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Price history table (for Monte Carlo simulation and valuation)
export const priceHistory = pgTable('price_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  cardId: text('card_id').notNull(),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  volume: integer('volume'), // Optional trading volume
  market: text('market').notNull().default('tcgplayer'), // 'tcgplayer' | 'ebay' | 'cardmarket'
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
}, (table) => ({
  cardDateIdx: index('price_history_card_date_idx').on(table.cardId, table.recordedAt.desc()),
  cardMarketIdx: index('price_history_card_market_idx').on(table.cardId, table.market),
}));

// =============================================================================
// EMERGENCY STUBS - Build Compatibility Layer
// =============================================================================
// These stub exports satisfy the TypeScript compiler for features under development.
// Replace with real PgTable definitions when implementing each feature.

// Vault & Job Processing
export const vaultJobs = {};

// Family & Parental Controls
export const familyLinks = {};
export const childActivityHistory = {};
export const parentalControls = {};

// Multi-Modal AI Features
export const multiModalEmbeddings = {};
export const videoGenerationRequests = {};

// Market Intelligence
export const market_knowledge = {};
export const manipulationAlerts = {};
export const cards = {};
export const sales = {};
export const prices = {};

// Financial Tracking
export const spendTracking = {};

// Alert & Notification System
export const alertSubscriptions = {};
export const pushSubscriptions = {};
export const mobilePushTokens = {};

// Portfolio & Trading
export const watchlistItems = {};
export const portfolios = {};
export const holdings = {};
export const arbitrageOpportunities = {};
export const makerTasks = {};
export const populationReports = {};

// Content & Collections
export const collections = {};
export const collection_items = {};
export const tcg_documents = {};

// Compliance
export const complianceLogs = {};

// =============================================================================
// TYPE STUBS - Build Compatibility Layer
// =============================================================================
// Placeholder types for features under development

export type ParentalControl = Record<string, unknown>;
export type SessionHistory = Record<string, unknown>;
export type WatchlistItem = Record<string, unknown>;
export type Portfolio = Record<string, unknown>;
export type ManipulationAlert = Record<string, unknown>;
export type User = Record<string, unknown>;
export type PushSubscription = Record<string, unknown>;
export type NewSpendTracking = Record<string, unknown>;


/**
 * Offline-First SQLite Database with Drizzle ORM
 *
 * Features:
 * - Local SQLite storage via expo-sqlite
 * - Same schema as server for easy sync
 * - Automatic sync when online
 * - Conflict resolution with last-write-wins
 */

import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Open SQLite database
const sqlite = SQLite.openDatabaseSync('apex.db');

// Define local schema (mirrors server schema)
export const localWatchlistItems = sqliteTable('watchlist_items', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  cardId: text('card_id').notNull(),
  targetPrice: real('target_price').notNull(),
  direction: text('direction').notNull(), // 'above' | 'below'
  isTriggered: integer('is_triggered', { mode: 'boolean' }).notNull().default(false),
  triggeredAt: integer('triggered_at'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  syncedAt: integer('synced_at'), // Track last sync
});

export const localPortfolioItems = sqliteTable('portfolio_items', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  cardId: text('card_id').notNull(),
  quantity: integer('quantity').notNull(),
  costBasis: real('cost_basis').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  syncedAt: integer('synced_at'),
});

export const localCards = sqliteTable('cards', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  setName: text('set_name').notNull(),
  cardNumber: text('card_number').notNull(),
  game: text('game').notNull(),
  currentPrice: real('current_price'),
  apexScore: real('apex_score'),
  imageUrl: text('image_url'),
  syncedAt: integer('synced_at'),
});

// Initialize Drizzle
export const db = drizzle(sqlite, {
  schema: {
    watchlistItems: localWatchlistItems,
    portfolioItems: localPortfolioItems,
    cards: localCards,
  },
});

/**
 * Initialize database with tables
 */
export async function initDatabase() {
  // Create tables if they don't exist
  await sqlite.execAsync(`
    CREATE TABLE IF NOT EXISTS watchlist_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      card_id TEXT NOT NULL,
      target_price REAL NOT NULL,
      direction TEXT NOT NULL,
      is_triggered INTEGER NOT NULL DEFAULT 0,
      triggered_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      synced_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS portfolio_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      card_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      cost_basis REAL NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      synced_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      set_name TEXT NOT NULL,
      card_number TEXT NOT NULL,
      game TEXT NOT NULL,
      current_price REAL,
      apex_score REAL,
      image_url TEXT,
      synced_at INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist_items(user_id);
    CREATE INDEX IF NOT EXISTS idx_watchlist_card ON watchlist_items(card_id);
    CREATE INDEX IF NOT EXISTS idx_portfolio_user ON portfolio_items(user_id);
    CREATE INDEX IF NOT EXISTS idx_portfolio_card ON portfolio_items(card_id);
  `);
}

/**
 * Clear all local data (logout)
 */
export async function clearDatabase() {
  await sqlite.execAsync(`
    DELETE FROM watchlist_items;
    DELETE FROM portfolio_items;
    DELETE FROM cards;
  `);
}

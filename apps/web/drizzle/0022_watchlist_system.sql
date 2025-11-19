-- Migration: Watchlist System with Redis Caching
-- Production-ready price watchlist with real-time alerts via Redis pub/sub
-- This migration creates the watchlist_items table for tracking user price targets

-- Create watchlist_items table
CREATE TABLE IF NOT EXISTS watchlist_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  target_price REAL,
  direction TEXT,
  notified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for watchlist_items
CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_card ON watchlist_items(card_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_watchlist_user_card ON watchlist_items(user_id, card_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_notified ON watchlist_items(notified);

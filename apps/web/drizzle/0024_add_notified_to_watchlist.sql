-- Migration: Add notified and updated_at columns to watchlist_items
-- Fix schema drift: cron job expects notified column for price alert tracking
-- Generated: 2025-11-20
-- Session: claude/fix-production-schema-01KmrpCLyX8MqYfTNp2XMV5e

-- Add notified column with default false (safe for existing rows)
ALTER TABLE watchlist_items
ADD COLUMN IF NOT EXISTS notified BOOLEAN NOT NULL DEFAULT false;

-- Add updated_at column for tracking notification status changes
ALTER TABLE watchlist_items
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Add index for query performance (used in update-prices cron)
-- This index helps filter unnotified watchlist items efficiently
CREATE INDEX IF NOT EXISTS idx_watchlist_notified
ON watchlist_items (notified);

-- Add partial index for even better performance (only index unnotified items)
-- This is used by the cron job to find items that need notification
CREATE INDEX IF NOT EXISTS idx_watchlist_card_unnotified
ON watchlist_items (card_id)
WHERE notified = false;

-- Add comments for documentation
COMMENT ON COLUMN watchlist_items.notified IS 'Whether user has been notified of price movement (reset manually or by user action)';
COMMENT ON COLUMN watchlist_items.updated_at IS 'Last update timestamp, set when notification status changes';
COMMENT ON INDEX idx_watchlist_card_unnotified IS 'Partial index for efficient filtering of unnotified items in cron job';

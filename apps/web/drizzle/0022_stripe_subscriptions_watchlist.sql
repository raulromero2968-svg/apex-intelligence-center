-- Migration: Add Stripe subscription support and watchlist features
-- Generated: 2025-11-19
-- Session: CLAUDE_SESSION_10

-- Extend users table with subscription fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;

-- Add check constraint for subscription tier enum
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_subscription_tier_check;
ALTER TABLE users ADD CONSTRAINT users_subscription_tier_check
  CHECK (subscription_tier IN ('free', 'pro', 'enterprise'));

-- Add check constraint for subscription status enum
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_subscription_status_check;
ALTER TABLE users ADD CONSTRAINT users_subscription_status_check
  CHECK (subscription_status IS NULL OR subscription_status IN ('active', 'canceled', 'past_due', 'trialing'));

-- Create index on stripe_customer_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);

-- Create watchlist_items table
CREATE TABLE IF NOT EXISTS watchlist_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  target_price REAL NOT NULL,
  direction TEXT NOT NULL,
  is_triggered BOOLEAN NOT NULL DEFAULT false,
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add check constraint for direction enum
ALTER TABLE watchlist_items DROP CONSTRAINT IF EXISTS watchlist_items_direction_check;
ALTER TABLE watchlist_items ADD CONSTRAINT watchlist_items_direction_check
  CHECK (direction IN ('above', 'below'));

-- Create indexes for watchlist_items
CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_card ON watchlist_items(card_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_triggered ON watchlist_items(is_triggered);
CREATE UNIQUE INDEX IF NOT EXISTS idx_watchlist_user_card_unique ON watchlist_items(user_id, card_id);

-- Add comments for documentation
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID for subscription management';
COMMENT ON COLUMN users.subscription_tier IS 'User subscription tier: free (10 watchlist, 100 API/day), pro (100 watchlist, 10k API/day), enterprise (unlimited)';
COMMENT ON COLUMN users.subscription_status IS 'Stripe subscription status';
COMMENT ON COLUMN users.subscription_ends_at IS 'When the subscription period ends';
COMMENT ON TABLE watchlist_items IS 'User price alerts with tiered limits based on subscription';

-- Migration: 0026_parent_dashboard
-- Created: 2025-11-21
-- Description: Add parent-child account relationships, account freeze, and session tracking

-- Add new columns to users table for parent dashboard features
ALTER TABLE users ADD COLUMN parent_id TEXT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE users ADD COLUMN account_type TEXT NOT NULL DEFAULT 'independent';
ALTER TABLE users ADD COLUMN account_frozen BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN account_frozen_at TIMESTAMP;
ALTER TABLE users ADD COLUMN account_frozen_by TEXT;
ALTER TABLE users ADD COLUMN bedtime_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN bedtime_start TEXT;
ALTER TABLE users ADD COLUMN bedtime_end TEXT;
ALTER TABLE users ADD COLUMN cooldown_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN spending_limit_cents INTEGER NOT NULL DEFAULT 0;

-- Add CHECK constraint for account_type enum
ALTER TABLE users ADD CONSTRAINT check_account_type
  CHECK (account_type IN ('parent', 'child', 'independent'));

-- Create session_history table
CREATE TABLE session_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_start TIMESTAMP NOT NULL,
  session_end TIMESTAMP,
  duration_minutes INTEGER,
  pages_viewed INTEGER NOT NULL DEFAULT 0,
  cards_viewed JSONB NOT NULL DEFAULT '[]'::jsonb,
  actions_performed JSONB NOT NULL DEFAULT '[]'::jsonb,
  device_info JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for session_history
CREATE INDEX idx_session_history_user ON session_history(user_id);
CREATE INDEX idx_session_history_start ON session_history(session_start);

-- Create index on parent_id for efficient child lookup
CREATE INDEX idx_users_parent_id ON users(parent_id);

-- Create index on account_frozen for quick filtering
CREATE INDEX idx_users_account_frozen ON users(account_frozen) WHERE account_frozen = true;

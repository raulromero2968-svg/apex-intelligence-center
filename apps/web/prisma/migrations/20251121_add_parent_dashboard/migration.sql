-- Parent Dashboard Tables Migration
-- Created: 2025-11-21

-- Family Links table - OAuth-based parent-child account linking
CREATE TABLE IF NOT EXISTS family_links (
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  child_cannot_revoke BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for family_links
CREATE INDEX IF NOT EXISTS idx_family_links_parent ON family_links(parent_id);
CREATE INDEX IF NOT EXISTS idx_family_links_child ON family_links(child_id);
CREATE INDEX IF NOT EXISTS idx_family_links_status ON family_links(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_family_links_parent_child_unique ON family_links(parent_id, child_id);

-- Parental Controls table - Per-child control settings
CREATE TABLE IF NOT EXISTS parental_controls (
  id TEXT PRIMARY KEY,
  family_link_id TEXT NOT NULL REFERENCES family_links(id) ON DELETE CASCADE,
  child_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Bedtime mode
  bedtime_enabled BOOLEAN NOT NULL DEFAULT false,
  bedtime_start TEXT,
  bedtime_end TEXT,
  bedtime_timezone TEXT DEFAULT 'America/New_York',
  -- Cool down mode
  cool_down_enabled BOOLEAN NOT NULL DEFAULT false,
  cool_down_minutes INTEGER DEFAULT 30,
  -- Notification controls
  notifications_disabled BOOLEAN NOT NULL DEFAULT false,
  disabled_channels JSONB DEFAULT '[]'::jsonb,
  -- Activity limits
  daily_trading_limit INTEGER,
  max_portfolio_value REAL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for parental_controls
CREATE INDEX IF NOT EXISTS idx_parental_controls_child ON parental_controls(child_id);
CREATE INDEX IF NOT EXISTS idx_parental_controls_family_link ON parental_controls(family_link_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_parental_controls_child_unique ON parental_controls(child_id);

-- Session History table - Tracks child activity for parent monitoring
CREATE TABLE IF NOT EXISTS session_history (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_data JSONB NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  device_info JSONB,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  blocked_by_bedtime BOOLEAN NOT NULL DEFAULT false,
  blocked_by_cool_down BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for session_history
CREATE INDEX IF NOT EXISTS idx_session_history_child_timestamp ON session_history(child_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_session_history_activity_type ON session_history(activity_type);
CREATE INDEX IF NOT EXISTS idx_session_history_timestamp ON session_history(timestamp DESC);

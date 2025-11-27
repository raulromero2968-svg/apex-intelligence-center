-- Migration: 0028_child_activity_history
-- Created: 2025-11-25
-- Description: Create child_activity_history table for parental control activity tracking

-- Create child_activity_history table
-- This table tracks all significant child activities for real-time monitoring and history review
CREATE TABLE IF NOT EXISTS child_activity_history (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_data JSONB NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  device_info JSONB,
  "timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
  blocked_by_bedtime BOOLEAN NOT NULL DEFAULT false,
  blocked_by_cool_down BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_child_activity_history_child_timestamp
  ON child_activity_history(child_id, "timestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_child_activity_history_activity_type
  ON child_activity_history(activity_type);
CREATE INDEX IF NOT EXISTS idx_child_activity_history_timestamp
  ON child_activity_history("timestamp" DESC);

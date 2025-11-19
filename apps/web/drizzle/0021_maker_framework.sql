-- Migration: MAKER Framework Tables
-- Multi-Agent Knowledge Ensemble Refinement for high-reliability arbitrage scanning
-- This migration creates tables for tracking MAKER tasks and votes

-- Create maker_tasks table
CREATE TABLE IF NOT EXISTS maker_tasks (
  id TEXT PRIMARY KEY,
  task_type TEXT NOT NULL,
  status TEXT NOT NULL,
  total_steps INTEGER,
  successful_steps INTEGER DEFAULT 0,
  total_votes_cast INTEGER DEFAULT 0,
  red_flagged_votes INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for maker_tasks
CREATE INDEX IF NOT EXISTS idx_maker_tasks_status ON maker_tasks(status);
CREATE INDEX IF NOT EXISTS idx_maker_tasks_type ON maker_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_maker_tasks_started ON maker_tasks(started_at);

-- Create maker_votes table
CREATE TABLE IF NOT EXISTS maker_votes (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES maker_tasks(id) ON DELETE CASCADE,
  card_id TEXT REFERENCES cards(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL,
  vote_index INTEGER NOT NULL,
  result_hash TEXT,
  result_json JSONB,
  is_red_flagged BOOLEAN NOT NULL DEFAULT false,
  red_flag_reason TEXT,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for maker_votes
CREATE INDEX IF NOT EXISTS idx_maker_votes_task ON maker_votes(task_id);
CREATE INDEX IF NOT EXISTS idx_maker_votes_step ON maker_votes(step_name);
CREATE INDEX IF NOT EXISTS idx_maker_votes_hash ON maker_votes(result_hash);
CREATE INDEX IF NOT EXISTS idx_maker_votes_flagged ON maker_votes(is_red_flagged);

-- Add comments for documentation
COMMENT ON TABLE maker_tasks IS 'MAKER framework task tracking for high-reliability operations';
COMMENT ON TABLE maker_votes IS 'Individual voting attempts for MAKER consensus mechanism';
COMMENT ON COLUMN maker_votes.result_hash IS 'SHA-256 hash of deterministic JSON for result deduplication';
COMMENT ON COLUMN maker_votes.is_red_flagged IS 'Whether this vote was excluded due to red flag conditions';

-- Analytics Events Schema Migration
-- Tracks buy conversions and user engagement for metrics dashboards
-- Reference: knowledge-07-seo-performance.md

-- =============================================================================
-- ENUM TYPE
-- =============================================================================

-- Create enum for analytics event types
DO $$ BEGIN
  CREATE TYPE analytics_event_type AS ENUM (
    'buy_report',
    'buy_listing',
    'buy_subscription',
    'view_report',
    'like_report',
    'share_report',
    'download_resource',
    'search_reports',
    'search_marketplace',
    'page_view',
    'signup_started',
    'signup_completed',
    'checkout_started',
    'checkout_completed',
    'rc_earned',
    'rc_spent',
    'rc_purchased'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- ANALYTICS EVENTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event classification
  event_type TEXT NOT NULL,

  -- User reference (nullable for anonymous events)
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Session tracking (for funnel analysis)
  session_id TEXT,

  -- Flexible metadata for event-specific properties
  metadata JSONB,

  -- Denormalized price for fast aggregation queries
  price_amount DECIMAL(10, 2),

  -- Event count for batched events (default: 1)
  event_count INTEGER NOT NULL DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Event type filtering (most common query pattern)
CREATE INDEX IF NOT EXISTS analytics_events_type_idx
  ON analytics_events(event_type);

-- Time-based queries (daily/weekly/monthly aggregations)
CREATE INDEX IF NOT EXISTS analytics_events_time_idx
  ON analytics_events(created_at);

-- User-specific analytics
CREATE INDEX IF NOT EXISTS analytics_events_user_idx
  ON analytics_events(user_id);

-- Composite index for conversion queries: type + time
CREATE INDEX IF NOT EXISTS analytics_events_conversion_idx
  ON analytics_events(event_type, created_at);

-- Session tracking for funnel analysis
CREATE INDEX IF NOT EXISTS analytics_events_session_idx
  ON analytics_events(session_id);

-- Price aggregation for revenue queries
CREATE INDEX IF NOT EXISTS analytics_events_price_idx
  ON analytics_events(price_amount)
  WHERE price_amount IS NOT NULL;

-- =============================================================================
-- PARTITIONING (for future scalability)
-- Note: Consider partitioning by created_at for high-volume tables
-- This is a placeholder comment for when table grows large
-- =============================================================================

-- Add comment to table
COMMENT ON TABLE analytics_events IS 'Tracks user actions for conversion and engagement analytics. Designed for high-volume inserts with async logging.';

-- Column comments
COMMENT ON COLUMN analytics_events.event_type IS 'Type of analytics event (buy_report, view_report, etc.)';
COMMENT ON COLUMN analytics_events.metadata IS 'Event-specific properties in JSONB format';
COMMENT ON COLUMN analytics_events.price_amount IS 'Denormalized price for fast revenue aggregations';
COMMENT ON COLUMN analytics_events.session_id IS 'Session identifier for funnel analysis';

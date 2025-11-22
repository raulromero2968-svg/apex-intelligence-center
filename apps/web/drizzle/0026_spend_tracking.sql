-- Migration: Add Spend Tracking and Limit Enforcement
-- Generated: 2025-11-21
-- Session: CLAUDE_SESSION_SPEND_LIMITS
-- Purpose: Implement unbreakable $50/day and $200/week spend limits across Stripe + on-chain payments

-- ============================================================================
-- Payment Transactions Table
-- ============================================================================
-- Records all payment attempts for audit trail and dispute resolution.
-- Source of truth for historical transaction data (Redis is real-time cache).

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Amount tracking (stored in USD with cents precision)
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',

  -- Payment source identification
  payment_source TEXT NOT NULL, -- 'stripe' | 'on-chain'
  payment_method TEXT, -- 'card' | 'ach' | 'eth' | 'usdc' | etc.

  -- External reference IDs for reconciliation
  stripe_payment_intent_id TEXT,
  on_chain_tx_hash TEXT,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'completed' | 'failed' | 'refunded'

  -- Metadata
  description TEXT,
  metadata TEXT, -- JSON string for additional context

  -- Limit enforcement tracking (snapshot at time of transaction)
  daily_spend_before DECIMAL(12, 2), -- Spend before this tx
  weekly_spend_before DECIMAL(12, 2), -- Spend before this tx

  -- Failure tracking (for security monitoring)
  failure_reason TEXT,
  was_blocked INTEGER NOT NULL DEFAULT 0, -- 1 if blocked by spend limit

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ
);

-- Add check constraints
ALTER TABLE payment_transactions DROP CONSTRAINT IF EXISTS payment_tx_payment_source_check;
ALTER TABLE payment_transactions ADD CONSTRAINT payment_tx_payment_source_check
  CHECK (payment_source IN ('stripe', 'on-chain'));

ALTER TABLE payment_transactions DROP CONSTRAINT IF EXISTS payment_tx_status_check;
ALTER TABLE payment_transactions ADD CONSTRAINT payment_tx_status_check
  CHECK (status IN ('pending', 'completed', 'failed', 'refunded'));

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS payment_tx_user_date_idx ON payment_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payment_tx_status_idx ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS payment_tx_stripe_idx ON payment_transactions(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS payment_tx_onchain_idx ON payment_transactions(on_chain_tx_hash);
CREATE INDEX IF NOT EXISTS payment_tx_blocked_idx ON payment_transactions(was_blocked, created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE payment_transactions IS 'Audit trail of all payment attempts across Stripe and on-chain. Indexed for fast daily/weekly aggregation queries.';
COMMENT ON COLUMN payment_transactions.amount IS 'Payment amount in USD (stored as decimal for cents precision)';
COMMENT ON COLUMN payment_transactions.daily_spend_before IS 'User daily spend before this transaction (for audit trail)';
COMMENT ON COLUMN payment_transactions.weekly_spend_before IS 'User weekly spend before this transaction (for audit trail)';
COMMENT ON COLUMN payment_transactions.was_blocked IS '1 if transaction was blocked by spend limit, 0 otherwise';

-- ============================================================================
-- Spend Limit Violations Table
-- ============================================================================
-- Tracks all spend limit violation attempts for security monitoring.
-- Helps detect compromised accounts and payment fraud.

CREATE TABLE IF NOT EXISTS spend_limit_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Violation details
  attempted_amount DECIMAL(12, 2) NOT NULL,
  current_daily_spend DECIMAL(12, 2) NOT NULL,
  current_weekly_spend DECIMAL(12, 2) NOT NULL,

  -- Limit that was violated
  violation_type TEXT NOT NULL, -- 'daily' | 'weekly' | 'both'

  -- Request context for forensics
  ip_address TEXT,
  user_agent TEXT,
  request_path TEXT,

  -- Payment context
  payment_source TEXT NOT NULL, -- 'stripe' | 'on-chain'

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add check constraint
ALTER TABLE spend_limit_violations DROP CONSTRAINT IF EXISTS spend_violations_type_check;
ALTER TABLE spend_limit_violations ADD CONSTRAINT spend_violations_type_check
  CHECK (violation_type IN ('daily', 'weekly', 'both'));

ALTER TABLE spend_limit_violations DROP CONSTRAINT IF EXISTS spend_violations_source_check;
ALTER TABLE spend_limit_violations ADD CONSTRAINT spend_violations_source_check
  CHECK (payment_source IN ('stripe', 'on-chain'));

-- Create indexes
CREATE INDEX IF NOT EXISTS spend_violations_user_date_idx ON spend_limit_violations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS spend_violations_type_idx ON spend_limit_violations(violation_type);

-- Add comments
COMMENT ON TABLE spend_limit_violations IS 'Security audit trail of all spend limit violation attempts. Used to detect fraud and compromised accounts.';
COMMENT ON COLUMN spend_limit_violations.violation_type IS 'Which limit was violated: daily ($50), weekly ($200), or both';

-- ============================================================================
-- Daily Spend Aggregates (Materialized Cache)
-- ============================================================================
-- Pre-computed daily spend totals for fast dashboard queries.
-- Note: This is a cache layer. Source of truth is Redis + payment_transactions.

CREATE TABLE IF NOT EXISTS daily_spend_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Date bucket (UTC, truncated to day)
  date TIMESTAMPTZ NOT NULL,

  -- Aggregated amounts
  total_spend DECIMAL(12, 2) NOT NULL DEFAULT 0,
  stripe_spend DECIMAL(12, 2) NOT NULL DEFAULT 0,
  on_chain_spend DECIMAL(12, 2) NOT NULL DEFAULT 0,

  -- Transaction counts
  transaction_count INTEGER NOT NULL DEFAULT 0,
  blocked_count INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create unique index to prevent duplicate rows per user per day
CREATE UNIQUE INDEX IF NOT EXISTS daily_spend_user_date_unique ON daily_spend_aggregates(user_id, date);

-- Create index for time series queries
CREATE INDEX IF NOT EXISTS daily_spend_date_idx ON daily_spend_aggregates(date DESC);

-- Add comments
COMMENT ON TABLE daily_spend_aggregates IS 'Pre-computed daily spend cache for dashboard performance. Updated via batch job or trigger.';
COMMENT ON COLUMN daily_spend_aggregates.date IS 'UTC date truncated to day (00:00:00)';

-- ============================================================================
-- Database Function: Update Daily Aggregates on Transaction Insert
-- ============================================================================
-- Trigger function to automatically update daily_spend_aggregates when a new
-- completed transaction is inserted. This keeps the cache in sync.

CREATE OR REPLACE FUNCTION update_daily_spend_aggregate()
RETURNS TRIGGER AS $$
DECLARE
  date_bucket TIMESTAMPTZ;
BEGIN
  -- Only update aggregates for completed transactions
  IF NEW.status = 'completed' THEN
    -- Truncate timestamp to day (UTC)
    date_bucket := DATE_TRUNC('day', NEW.created_at);

    -- Insert or update the daily aggregate
    INSERT INTO daily_spend_aggregates (
      user_id,
      date,
      total_spend,
      stripe_spend,
      on_chain_spend,
      transaction_count,
      blocked_count,
      updated_at
    ) VALUES (
      NEW.user_id,
      date_bucket,
      NEW.amount,
      CASE WHEN NEW.payment_source = 'stripe' THEN NEW.amount ELSE 0 END,
      CASE WHEN NEW.payment_source = 'on-chain' THEN NEW.amount ELSE 0 END,
      1,
      NEW.was_blocked,
      NOW()
    )
    ON CONFLICT (user_id, date)
    DO UPDATE SET
      total_spend = daily_spend_aggregates.total_spend + NEW.amount,
      stripe_spend = daily_spend_aggregates.stripe_spend +
        CASE WHEN NEW.payment_source = 'stripe' THEN NEW.amount ELSE 0 END,
      on_chain_spend = daily_spend_aggregates.on_chain_spend +
        CASE WHEN NEW.payment_source = 'on-chain' THEN NEW.amount ELSE 0 END,
      transaction_count = daily_spend_aggregates.transaction_count + 1,
      blocked_count = daily_spend_aggregates.blocked_count + NEW.was_blocked,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_daily_spend_aggregate ON payment_transactions;
CREATE TRIGGER trigger_update_daily_spend_aggregate
  AFTER INSERT ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_spend_aggregate();

COMMENT ON FUNCTION update_daily_spend_aggregate IS 'Automatically updates daily_spend_aggregates when a completed payment transaction is inserted';

-- ============================================================================
-- Grant permissions (if using row-level security)
-- ============================================================================
-- Users should only be able to see their own transactions

-- Enable RLS on sensitive tables
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE spend_limit_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_spend_aggregates ENABLE ROW LEVEL SECURITY;

-- Create policies for user access (users can only see their own data)
DROP POLICY IF EXISTS payment_transactions_user_policy ON payment_transactions;
CREATE POLICY payment_transactions_user_policy ON payment_transactions
  FOR SELECT
  USING (user_id = current_setting('app.user_id', TRUE));

DROP POLICY IF EXISTS spend_violations_user_policy ON spend_limit_violations;
CREATE POLICY spend_violations_user_policy ON spend_limit_violations
  FOR SELECT
  USING (user_id = current_setting('app.user_id', TRUE));

DROP POLICY IF EXISTS daily_spend_user_policy ON daily_spend_aggregates;
CREATE POLICY daily_spend_user_policy ON daily_spend_aggregates
  FOR SELECT
  USING (user_id = current_setting('app.user_id', TRUE));

-- Service role bypass (for backend services)
DROP POLICY IF EXISTS payment_transactions_service_policy ON payment_transactions;
CREATE POLICY payment_transactions_service_policy ON payment_transactions
  FOR ALL
  USING (current_setting('app.role', TRUE) = 'service');

DROP POLICY IF EXISTS spend_violations_service_policy ON spend_limit_violations;
CREATE POLICY spend_violations_service_policy ON spend_limit_violations
  FOR ALL
  USING (current_setting('app.role', TRUE) = 'service');

DROP POLICY IF EXISTS daily_spend_service_policy ON daily_spend_aggregates;
CREATE POLICY daily_spend_service_policy ON daily_spend_aggregates
  FOR ALL
  USING (current_setting('app.role', TRUE) = 'service');

-- Family Protection Lockdown v3 Migration
-- Adds immutable safety features for minors and family protection

-- Add new columns to users table for Family Protection Lockdown v3
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_spend_limit NUMERIC(10, 2) DEFAULT 50.00 NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_monthly_spend NUMERIC(10, 2) DEFAULT 0.00 NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bedtime_start TEXT; -- Format: "22:00"
ALTER TABLE users ADD COLUMN IF NOT EXISTS bedtime_end TEXT;   -- Format: "07:00"
ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_user_id TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_minor BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cool_down_until TIMESTAMP;

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_bedtime ON users(bedtime_start, bedtime_end) WHERE bedtime_start IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_cool_down ON users(cool_down_until) WHERE cool_down_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_is_minor ON users(is_minor) WHERE is_minor = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_parent ON users(parent_user_id) WHERE parent_user_id IS NOT NULL;

-- Add constraint to ensure age is reasonable (if date_of_birth is set, must be between 13 and 120 years old)
ALTER TABLE users ADD CONSTRAINT chk_users_date_of_birth CHECK (
  date_of_birth IS NULL OR
  (date_of_birth <= CURRENT_TIMESTAMP - INTERVAL '13 years' AND
   date_of_birth >= CURRENT_TIMESTAMP - INTERVAL '120 years')
);

-- Add constraint to ensure spend limits are positive
ALTER TABLE users ADD CONSTRAINT chk_users_spend_positive CHECK (
  monthly_spend_limit >= 0 AND current_monthly_spend >= 0
);

-- Create vault_jobs table for production job queue
CREATE TABLE IF NOT EXISTS vault_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority INTEGER DEFAULT 0 NOT NULL,
  retry_count INTEGER DEFAULT 0 NOT NULL,
  error_message TEXT,
  community_quotes JSONB,
  mdx_content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for vault_jobs
CREATE INDEX IF NOT EXISTS idx_vault_jobs_card ON vault_jobs(card_id);
CREATE INDEX IF NOT EXISTS idx_vault_jobs_status ON vault_jobs(status);
CREATE INDEX IF NOT EXISTS idx_vault_jobs_priority ON vault_jobs(priority DESC, created_at ASC) WHERE status = 'pending';

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vault_jobs_updated_at BEFORE UPDATE ON vault_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comment the tables and columns for documentation
COMMENT ON COLUMN users.date_of_birth IS 'User date of birth for age gating (13+ required)';
COMMENT ON COLUMN users.monthly_spend_limit IS 'Maximum monthly spend allowed (default $50)';
COMMENT ON COLUMN users.current_monthly_spend IS 'Current month spend total';
COMMENT ON COLUMN users.bedtime_start IS 'Bedtime start hour in HH:MM format (e.g., 22:00)';
COMMENT ON COLUMN users.bedtime_end IS 'Bedtime end hour in HH:MM format (e.g., 07:00)';
COMMENT ON COLUMN users.parent_user_id IS 'Parent user ID for minor accounts';
COMMENT ON COLUMN users.is_minor IS 'Flag indicating if user is under 18';
COMMENT ON COLUMN users.cool_down_until IS 'Timestamp until which user is in cooldown mode';

COMMENT ON TABLE vault_jobs IS 'Production job queue for Vault content generation';
COMMENT ON COLUMN vault_jobs.status IS 'Job status: pending, processing, completed, failed';
COMMENT ON COLUMN vault_jobs.priority IS 'Job priority (higher = more urgent)';
COMMENT ON COLUMN vault_jobs.retry_count IS 'Number of retry attempts';
COMMENT ON COLUMN vault_jobs.community_quotes IS 'JSON array of community quotes from X/Reddit';
COMMENT ON COLUMN vault_jobs.mdx_content IS 'Generated MDX content for the vault entry';

-- Migration: Minor Protection System
-- This migration adds age verification and parental consent fields to protect minors
-- from payment and financial features, ensuring compliance with COPPA and child protection laws

-- Add birth date and minor protection fields to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS birth_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_minor BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS parental_consent_given BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS parental_consent_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS parental_guardian_email TEXT;

-- Create index on is_minor for fast filtering of minor accounts
CREATE INDEX IF NOT EXISTS idx_users_is_minor
  ON users (is_minor) WHERE is_minor = true;

-- Create index on birth_date for age-related queries
CREATE INDEX IF NOT EXISTS idx_users_birth_date
  ON users (birth_date);

-- Add comments for documentation
COMMENT ON COLUMN users.birth_date IS 'User date of birth for age verification (COPPA compliance)';
COMMENT ON COLUMN users.is_minor IS 'Computed flag indicating if user is under 18 years old';
COMMENT ON COLUMN users.parental_consent_given IS 'Whether parental consent has been provided for account upgrade';
COMMENT ON COLUMN users.parental_consent_date IS 'Date when parental consent was granted';
COMMENT ON COLUMN users.parental_guardian_email IS 'Email address of parent or legal guardian for consent verification';

-- Ensure minors cannot have paid subscriptions (data integrity constraint)
-- This prevents database-level bypass of minor protection
ALTER TABLE users
  ADD CONSTRAINT check_minor_no_paid_tier
  CHECK (
    is_minor = false OR
    (is_minor = true AND subscription_tier = 'free')
  );

COMMENT ON CONSTRAINT check_minor_no_paid_tier ON users IS 'Enforces that minors can only have free tier subscriptions';

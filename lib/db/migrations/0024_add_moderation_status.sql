-- Migration: Add moderation status to intel_reports
-- Reference: knowledge-05-security-oauth2-jwt.md (RBAC, resource-level permissions)
--
-- This migration adds:
-- 1. moderation_status field for pending/approved/rejected workflow
-- 2. moderated_by and moderated_at tracking
-- 3. moderation_reason for rejection justification
-- 4. trusted_author flag for auto-approval
-- 5. Indexes for moderation queue queries
--
-- Trade-offs:
-- - Delays publishing for pending status (hours)
-- - Auto-approve trusted users to reduce friction
-- - Manual overhead requires AI pre-filter in future

-- =============================================================================
-- ADD MODERATION STATUS ENUM
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moderation_status') THEN
    CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'rejected', 'auto_approved');
  END IF;
END
$$;

-- =============================================================================
-- ADD MODERATION COLUMNS TO INTEL_REPORTS
-- =============================================================================

-- Moderation status (default to 'pending' for new public reports)
ALTER TABLE intel_reports
ADD COLUMN IF NOT EXISTS moderation_status moderation_status DEFAULT 'pending';

-- Who moderated and when
ALTER TABLE intel_reports
ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES users(id);

ALTER TABLE intel_reports
ADD COLUMN IF NOT EXISTS moderated_at timestamptz;

-- Reason for rejection (required for 'rejected' status)
ALTER TABLE intel_reports
ADD COLUMN IF NOT EXISTS moderation_reason text;

-- =============================================================================
-- ADD TRUSTED AUTHOR FLAG TO USERS
-- =============================================================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_trusted_author boolean DEFAULT false;

-- Comment explaining trusted author flag
COMMENT ON COLUMN users.is_trusted_author IS
  'Trusted authors get auto-approved reports without moderation delay';

-- =============================================================================
-- UPDATE EXISTING PUBLISHED REPORTS TO APPROVED
-- =============================================================================

-- Mark all existing published reports as approved (grandfather clause)
UPDATE intel_reports
SET moderation_status = 'approved',
    moderated_at = created_at
WHERE status = 'published'
  AND moderation_status = 'pending';

-- Mark drafts as auto_approved (they bypass moderation until published)
UPDATE intel_reports
SET moderation_status = 'auto_approved'
WHERE status = 'draft';

-- =============================================================================
-- CREATE INDEXES FOR MODERATION QUERIES
-- =============================================================================

-- Index for fetching pending moderation queue
CREATE INDEX IF NOT EXISTS idx_intel_reports_moderation_status
ON intel_reports(moderation_status)
WHERE moderation_status = 'pending';

-- Composite index for moderation queue with ordering
CREATE INDEX IF NOT EXISTS idx_intel_reports_moderation_queue
ON intel_reports(moderation_status, created_at DESC)
WHERE moderation_status = 'pending';

-- Index for moderator history lookup
CREATE INDEX IF NOT EXISTS idx_intel_reports_moderated_by
ON intel_reports(moderated_by, moderated_at DESC)
WHERE moderated_by IS NOT NULL;

-- =============================================================================
-- CREATE MODERATION AUDIT LOG ENTRIES
-- =============================================================================

-- Add moderation actions to audit_action_type enum if not exists
DO $$
BEGIN
  -- Check if 'moderate_report' already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'audit_action_type'::regtype
    AND enumlabel = 'moderate_report'
  ) THEN
    ALTER TYPE audit_action_type ADD VALUE IF NOT EXISTS 'moderate_report';
  END IF;
END
$$;

-- =============================================================================
-- CREATE FUNCTION FOR AUTO-APPROVAL CHECK
-- =============================================================================

CREATE OR REPLACE FUNCTION check_auto_approve_report()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-approve if author is trusted
  IF EXISTS (
    SELECT 1 FROM users
    WHERE id = NEW.user_id
    AND is_trusted_author = true
  ) THEN
    NEW.moderation_status := 'auto_approved';
    NEW.moderated_at := NOW();
  END IF;

  -- Auto-approve premium/exclusive tier reports (paid content has accountability)
  IF NEW.tier IN ('premium', 'exclusive') THEN
    NEW.moderation_status := 'auto_approved';
    NEW.moderated_at := NOW();
  END IF;

  -- Drafts bypass moderation
  IF NEW.status = 'draft' THEN
    NEW.moderation_status := 'auto_approved';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-approval
DROP TRIGGER IF EXISTS auto_approve_report_trigger ON intel_reports;
CREATE TRIGGER auto_approve_report_trigger
BEFORE INSERT ON intel_reports
FOR EACH ROW
EXECUTE FUNCTION check_auto_approve_report();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON COLUMN intel_reports.moderation_status IS
  'Content moderation status: pending (awaiting review), approved (published), rejected (blocked), auto_approved (trusted/paid)';

COMMENT ON COLUMN intel_reports.moderated_by IS
  'Admin/moderator who reviewed this report';

COMMENT ON COLUMN intel_reports.moderated_at IS
  'Timestamp when moderation decision was made';

COMMENT ON COLUMN intel_reports.moderation_reason IS
  'Required reason when rejecting a report, optional notes for approval';

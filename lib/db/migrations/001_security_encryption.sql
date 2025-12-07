-- =============================================================================
-- Security Audit Implementation: Database Encryption & MFA Schema
-- Migration: 001_security_encryption.sql
-- Date: 2025-12-07
-- Author: Security Audit Implementation
-- Reference: Security Audit Report Sections 1-3
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- SECTION 1: User Security Fields (MFA, Sessions, Password Policy)
-- =============================================================================

-- Add MFA and security columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_secret TEXT; -- Encrypted TOTP secret
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_backup_codes JSONB DEFAULT '[]'; -- Hashed backup codes
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_phone TEXT; -- E.164 format for SMS fallback
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_verified_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_failed_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS e2e_public_key TEXT; -- X25519 public key for E2E encryption
ALTER TABLE users ADD COLUMN IF NOT EXISTS e2e_key_created_at TIMESTAMP;

-- =============================================================================
-- SECTION 2: Session Management Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    device_id TEXT NOT NULL,
    device_fingerprint TEXT NOT NULL,
    device_info JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    mfa_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    last_activity_at TIMESTAMP DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    revoke_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_device ON user_sessions(user_id, device_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- =============================================================================
-- SECTION 3: MFA Verification Attempts (Rate Limiting & Audit)
-- =============================================================================

CREATE TABLE IF NOT EXISTS mfa_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,
    attempt_type TEXT NOT NULL CHECK (attempt_type IN ('totp', 'sms', 'backup', 'hardware')),
    success BOOLEAN NOT NULL,
    ip_address INET,
    user_agent TEXT,
    failure_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mfa_attempts_user ON mfa_attempts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mfa_attempts_recent ON mfa_attempts(user_id, created_at)
    WHERE created_at > NOW() - INTERVAL '1 hour';

-- =============================================================================
-- SECTION 4: Encrypted Data Storage (PII Fields)
-- =============================================================================

-- Create encrypted PII table for sensitive user data
CREATE TABLE IF NOT EXISTS user_encrypted_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    encrypted_value TEXT NOT NULL, -- AES-256-GCM encrypted
    search_hash TEXT, -- HMAC hash for searching without decryption
    encryption_key_id TEXT, -- For key rotation tracking
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, field_name)
);

CREATE INDEX IF NOT EXISTS idx_encrypted_data_user ON user_encrypted_data(user_id);
CREATE INDEX IF NOT EXISTS idx_encrypted_data_search ON user_encrypted_data(field_name, search_hash);

-- =============================================================================
-- SECTION 5: Key Management for Encryption
-- =============================================================================

CREATE TABLE IF NOT EXISTS encryption_keys (
    id TEXT PRIMARY KEY,
    key_type TEXT NOT NULL CHECK (key_type IN ('master', 'data', 'user')),
    encrypted_key TEXT NOT NULL, -- Key encrypted with master key (KMS in production)
    purpose TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    rotated_at TIMESTAMP,
    expires_at TIMESTAMP,
    retired_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_encryption_keys_active ON encryption_keys(key_type, is_active) WHERE is_active = TRUE;

-- =============================================================================
-- SECTION 6: GDPR Compliance Tables
-- =============================================================================

-- Data subject requests (deletion, export, access)
CREATE TABLE IF NOT EXISTS gdpr_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL CHECK (request_type IN ('deletion', 'export', 'access', 'rectification', 'restriction')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected', 'expired')),
    request_data JSONB DEFAULT '{}',
    response_data JSONB,
    ip_address INET,
    verification_token TEXT,
    verified_at TIMESTAMP,
    processed_by UUID REFERENCES users(id),
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMP,
    expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days'
);

CREATE INDEX IF NOT EXISTS idx_gdpr_requests_user ON gdpr_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_status ON gdpr_requests(status) WHERE status IN ('pending', 'processing');

-- Data retention tracking
CREATE TABLE IF NOT EXISTS data_retention_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    data_type TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('retain', 'anonymize', 'delete', 'export')),
    retention_policy TEXT,
    data_summary JSONB,
    performed_by TEXT, -- 'system', 'user', or admin user_id
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_retention_log_user ON data_retention_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_retention_log_type ON data_retention_log(data_type, created_at DESC);

-- Consent tracking
CREATE TABLE IF NOT EXISTS user_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL,
    version TEXT NOT NULL,
    granted BOOLEAN NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    withdrawn_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_consents_user ON user_consents(user_id, consent_type);
CREATE INDEX IF NOT EXISTS idx_consents_active ON user_consents(user_id, consent_type, granted) WHERE withdrawn_at IS NULL;

-- =============================================================================
-- SECTION 7: Security Event Logging
-- =============================================================================

CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical', 'emergency')),
    event_data JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    country_code TEXT,
    is_suspicious BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_suspicious ON security_events(is_suspicious, created_at DESC) WHERE is_suspicious = TRUE;
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity, created_at DESC) WHERE severity IN ('critical', 'emergency');

-- =============================================================================
-- SECTION 8: E2E Encryption Key Exchange
-- =============================================================================

-- Store encrypted messages (E2E encrypted, stored temporarily for delivery)
CREATE TABLE IF NOT EXISTS e2e_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_public_key TEXT NOT NULL,
    encrypted_content TEXT NOT NULL, -- Encrypted message package
    nonce TEXT NOT NULL,
    tag TEXT NOT NULL,
    delivered BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days'
);

CREATE INDEX IF NOT EXISTS idx_e2e_messages_recipient ON e2e_messages(recipient_id, delivered, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_e2e_messages_sender ON e2e_messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_e2e_messages_expires ON e2e_messages(expires_at) WHERE NOT delivered;

-- =============================================================================
-- SECTION 9: Helper Functions
-- =============================================================================

-- Function to hash email for encrypted storage search
CREATE OR REPLACE FUNCTION hash_for_search(value TEXT, context TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(
        hmac(
            lower(context) || ':' || lower(value),
            current_setting('app.encryption_key', true),
            'sha256'
        ),
        'hex'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions
    WHERE expires_at < NOW() OR (revoked_at IS NOT NULL AND revoked_at < NOW() - INTERVAL '24 hours');
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to anonymize user data for GDPR deletion
CREATE OR REPLACE FUNCTION anonymize_user_data(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Update user record with anonymized data
    UPDATE users SET
        email = 'deleted_' || target_user_id || '@anonymized.local',
        name = 'Deleted User',
        image = NULL,
        password_hash = NULL,
        mfa_enabled = FALSE,
        mfa_secret = NULL,
        mfa_backup_codes = '[]',
        mfa_phone = NULL,
        e2e_public_key = NULL,
        updated_at = NOW()
    WHERE id = target_user_id;

    -- Delete encrypted PII
    DELETE FROM user_encrypted_data WHERE user_id = target_user_id;

    -- Log the anonymization
    INSERT INTO data_retention_log (user_id, data_type, action, performed_by, data_summary)
    VALUES (target_user_id, 'user_profile', 'anonymize', 'system',
            jsonb_build_object('reason', 'gdpr_deletion', 'timestamp', NOW()));
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SECTION 10: Row Level Security Policies
-- =============================================================================

-- Enable RLS on sensitive tables
ALTER TABLE user_encrypted_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE e2e_messages ENABLE ROW LEVEL SECURITY;

-- Users can only access their own encrypted data
CREATE POLICY encrypted_data_user_policy ON user_encrypted_data
    FOR ALL USING (user_id = current_setting('app.current_user_id', true)::UUID);

-- Users can only access their own sessions
CREATE POLICY sessions_user_policy ON user_sessions
    FOR ALL USING (user_id = current_setting('app.current_user_id', true)::UUID);

-- Users can only see their own MFA attempts
CREATE POLICY mfa_attempts_user_policy ON mfa_attempts
    FOR ALL USING (user_id = current_setting('app.current_user_id', true)::UUID);

-- Users can only access their own GDPR requests
CREATE POLICY gdpr_requests_user_policy ON gdpr_requests
    FOR ALL USING (user_id = current_setting('app.current_user_id', true)::UUID);

-- Users can only access messages they sent or received
CREATE POLICY e2e_messages_user_policy ON e2e_messages
    FOR ALL USING (
        sender_id = current_setting('app.current_user_id', true)::UUID
        OR recipient_id = current_setting('app.current_user_id', true)::UUID
    );

-- =============================================================================
-- SECTION 11: Triggers for Audit Trail
-- =============================================================================

-- Trigger to log security-relevant changes to users table
CREATE OR REPLACE FUNCTION log_user_security_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Log MFA changes
    IF OLD.mfa_enabled IS DISTINCT FROM NEW.mfa_enabled THEN
        INSERT INTO security_events (user_id, event_type, severity, event_data)
        VALUES (
            NEW.id,
            CASE WHEN NEW.mfa_enabled THEN 'mfa_enabled' ELSE 'mfa_disabled' END,
            'info',
            jsonb_build_object('old_value', OLD.mfa_enabled, 'new_value', NEW.mfa_enabled)
        );
    END IF;

    -- Log password changes
    IF OLD.password_hash IS DISTINCT FROM NEW.password_hash AND NEW.password_hash IS NOT NULL THEN
        INSERT INTO security_events (user_id, event_type, severity, event_data)
        VALUES (NEW.id, 'password_changed', 'info', '{}');
    END IF;

    -- Log account locks
    IF NEW.locked_until IS NOT NULL AND OLD.locked_until IS NULL THEN
        INSERT INTO security_events (user_id, event_type, severity, event_data)
        VALUES (
            NEW.id,
            'account_locked',
            'warning',
            jsonb_build_object('locked_until', NEW.locked_until, 'failed_attempts', NEW.failed_login_attempts)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_security_audit_trigger
    AFTER UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION log_user_security_changes();

-- =============================================================================
-- Migration Complete
-- =============================================================================

COMMENT ON TABLE user_sessions IS 'Active user sessions with device tracking and MFA status';
COMMENT ON TABLE mfa_attempts IS 'MFA verification attempts for rate limiting and security analysis';
COMMENT ON TABLE user_encrypted_data IS 'Field-level encrypted PII storage with searchable hashes';
COMMENT ON TABLE encryption_keys IS 'Key management for data encryption rotation';
COMMENT ON TABLE gdpr_requests IS 'GDPR data subject requests (deletion, export, access)';
COMMENT ON TABLE security_events IS 'Security event log for monitoring and forensics';
COMMENT ON TABLE e2e_messages IS 'E2E encrypted messages with temporary storage for delivery';

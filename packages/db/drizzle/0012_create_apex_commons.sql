-- Migration: 0012_create_apex_commons
-- Description: Create Apex Commons resource library tables for TCG-like resource management
-- Date: 2025-12-02

-- =============================================================================
-- ENUMS
-- =============================================================================

-- User roles for Commons RBAC
DO $$ BEGIN
    CREATE TYPE commons_user_role AS ENUM ('user', 'teacher', 'moderator', 'admin');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Contributor levels based on reputation
DO $$ BEGIN
    CREATE TYPE contributor_level AS ENUM ('bronze', 'silver', 'gold', 'platinum');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Resource approval status
DO $$ BEGIN
    CREATE TYPE resource_status AS ENUM ('draft', 'pending', 'approved', 'rejected', 'flagged', 'archived');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Resource types
DO $$ BEGIN
    CREATE TYPE resource_type AS ENUM ('lesson_plan', 'worksheet', 'video', 'article', 'presentation', 'assessment', 'template', 'other');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Vote types
DO $$ BEGIN
    CREATE TYPE vote_type AS ENUM ('up', 'down');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Proposal status
DO $$ BEGIN
    CREATE TYPE proposal_status AS ENUM ('active', 'passed', 'rejected', 'expired');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Moderation flag status
DO $$ BEGIN
    CREATE TYPE flag_status AS ENUM ('open', 'under_review', 'resolved', 'dismissed');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- TABLES
-- =============================================================================

-- User profiles (extends base users)
CREATE TABLE IF NOT EXISTS commons_user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    role commons_user_role NOT NULL DEFAULT 'user',
    bio TEXT,
    subjects JSONB DEFAULT '[]',
    grade_levels JSONB DEFAULT '[]',
    school TEXT,
    location TEXT,
    reputation_credits INTEGER NOT NULL DEFAULT 0,
    contributor_level contributor_level NOT NULL DEFAULT 'bronze',
    total_resources INTEGER NOT NULL DEFAULT 0,
    total_upvotes_received INTEGER NOT NULL DEFAULT 0,
    total_downloads INTEGER NOT NULL DEFAULT 0,
    is_verified_teacher BOOLEAN NOT NULL DEFAULT FALSE,
    preferences JSONB DEFAULT '{"emailNotifications": true, "newResourceAlerts": true, "weeklyDigest": true}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Resources table
CREATE TABLE IF NOT EXISTS commons_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contributor_id UUID NOT NULL REFERENCES commons_user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    subject TEXT,
    grade_level TEXT,
    resource_type resource_type NOT NULL DEFAULT 'other',
    files JSONB DEFAULT '[]',
    thumbnail_url TEXT,
    preview_url TEXT,
    quality_score INTEGER NOT NULL DEFAULT 0,
    upvotes INTEGER NOT NULL DEFAULT 0,
    downvotes INTEGER NOT NULL DEFAULT 0,
    downloads INTEGER NOT NULL DEFAULT 0,
    views INTEGER NOT NULL DEFAULT 0,
    status resource_status NOT NULL DEFAULT 'draft',
    reviewed_by UUID REFERENCES commons_user_profiles(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    tags JSONB DEFAULT '[]',
    standards JSONB DEFAULT '[]',
    estimated_duration INTEGER,
    difficulty TEXT,
    language TEXT NOT NULL DEFAULT 'en',
    license TEXT NOT NULL DEFAULT 'CC-BY-4.0',
    embedding TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Resource votes
CREATE TABLE IF NOT EXISTS commons_resource_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID NOT NULL REFERENCES commons_resources(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES commons_user_profiles(id) ON DELETE CASCADE,
    vote_type vote_type NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Collections
CREATE TABLE IF NOT EXISTS commons_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES commons_user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    thumbnail_url TEXT,
    resource_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Collection items (junction table)
CREATE TABLE IF NOT EXISTS commons_collection_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL REFERENCES commons_collections(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES commons_resources(id) ON DELETE CASCADE,
    "order" INTEGER NOT NULL DEFAULT 0,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Governance proposals
CREATE TABLE IF NOT EXISTS commons_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES commons_user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    status proposal_status NOT NULL DEFAULT 'active',
    votes_for INTEGER NOT NULL DEFAULT 0,
    votes_against INTEGER NOT NULL DEFAULT 0,
    votes_abstain INTEGER NOT NULL DEFAULT 0,
    quorum_required INTEGER NOT NULL DEFAULT 100,
    min_reputation INTEGER NOT NULL DEFAULT 50,
    metadata JSONB DEFAULT '{}',
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ends_at TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Proposal votes
CREATE TABLE IF NOT EXISTS commons_proposal_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES commons_proposals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES commons_user_profiles(id) ON DELETE CASCADE,
    vote TEXT NOT NULL,
    weight INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RC Transactions ledger
CREATE TABLE IF NOT EXISTS commons_rc_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES commons_user_profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    balance INTEGER NOT NULL,
    reason TEXT NOT NULL,
    reason_code TEXT NOT NULL,
    reference_type TEXT,
    reference_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Moderation flags
CREATE TABLE IF NOT EXISTS commons_moderation_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID REFERENCES commons_resources(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES commons_user_profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    reason_code TEXT NOT NULL,
    description TEXT,
    status flag_status NOT NULL DEFAULT 'open',
    reviewed_by UUID REFERENCES commons_user_profiles(id),
    reviewed_at TIMESTAMPTZ,
    resolution TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Downloads tracking
CREATE TABLE IF NOT EXISTS commons_downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID NOT NULL REFERENCES commons_resources(id) ON DELETE CASCADE,
    user_id UUID REFERENCES commons_user_profiles(id) ON DELETE SET NULL,
    ip_hash TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Views tracking
CREATE TABLE IF NOT EXISTS commons_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID NOT NULL REFERENCES commons_resources(id) ON DELETE CASCADE,
    user_id UUID REFERENCES commons_user_profiles(id) ON DELETE SET NULL,
    session_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS commons_profiles_user_id_idx ON commons_user_profiles(user_id);
CREATE INDEX IF NOT EXISTS commons_profiles_role_idx ON commons_user_profiles(role);
CREATE INDEX IF NOT EXISTS commons_profiles_contributor_level_idx ON commons_user_profiles(contributor_level);
CREATE INDEX IF NOT EXISTS commons_profiles_reputation_idx ON commons_user_profiles(reputation_credits);

-- Resources indexes
CREATE INDEX IF NOT EXISTS commons_resources_contributor_idx ON commons_resources(contributor_id);
CREATE INDEX IF NOT EXISTS commons_resources_status_idx ON commons_resources(status);
CREATE INDEX IF NOT EXISTS commons_resources_category_idx ON commons_resources(category);
CREATE INDEX IF NOT EXISTS commons_resources_subject_idx ON commons_resources(subject);
CREATE INDEX IF NOT EXISTS commons_resources_grade_level_idx ON commons_resources(grade_level);
CREATE INDEX IF NOT EXISTS commons_resources_type_idx ON commons_resources(resource_type);
CREATE INDEX IF NOT EXISTS commons_resources_quality_idx ON commons_resources(quality_score);
CREATE INDEX IF NOT EXISTS commons_resources_published_at_idx ON commons_resources(published_at);
CREATE INDEX IF NOT EXISTS commons_resources_created_at_idx ON commons_resources(created_at);

-- Resource votes indexes
CREATE UNIQUE INDEX IF NOT EXISTS commons_votes_unique_idx ON commons_resource_votes(resource_id, user_id);
CREATE INDEX IF NOT EXISTS commons_votes_resource_idx ON commons_resource_votes(resource_id);
CREATE INDEX IF NOT EXISTS commons_votes_user_idx ON commons_resource_votes(user_id);

-- Collections indexes
CREATE INDEX IF NOT EXISTS commons_collections_user_idx ON commons_collections(user_id);
CREATE INDEX IF NOT EXISTS commons_collections_public_idx ON commons_collections(is_public);

-- Collection items indexes
CREATE UNIQUE INDEX IF NOT EXISTS commons_collection_items_unique_idx ON commons_collection_items(collection_id, resource_id);
CREATE INDEX IF NOT EXISTS commons_collection_items_collection_idx ON commons_collection_items(collection_id);
CREATE INDEX IF NOT EXISTS commons_collection_items_resource_idx ON commons_collection_items(resource_id);

-- Proposals indexes
CREATE INDEX IF NOT EXISTS commons_proposals_author_idx ON commons_proposals(author_id);
CREATE INDEX IF NOT EXISTS commons_proposals_status_idx ON commons_proposals(status);
CREATE INDEX IF NOT EXISTS commons_proposals_ends_at_idx ON commons_proposals(ends_at);

-- Proposal votes indexes
CREATE UNIQUE INDEX IF NOT EXISTS commons_proposal_votes_unique_idx ON commons_proposal_votes(proposal_id, user_id);
CREATE INDEX IF NOT EXISTS commons_proposal_votes_proposal_idx ON commons_proposal_votes(proposal_id);
CREATE INDEX IF NOT EXISTS commons_proposal_votes_user_idx ON commons_proposal_votes(user_id);

-- RC transactions indexes
CREATE INDEX IF NOT EXISTS commons_rc_transactions_user_idx ON commons_rc_transactions(user_id);
CREATE INDEX IF NOT EXISTS commons_rc_transactions_created_at_idx ON commons_rc_transactions(created_at);
CREATE INDEX IF NOT EXISTS commons_rc_transactions_reason_code_idx ON commons_rc_transactions(reason_code);
CREATE INDEX IF NOT EXISTS commons_rc_transactions_reference_idx ON commons_rc_transactions(reference_type, reference_id);

-- Moderation flags indexes
CREATE INDEX IF NOT EXISTS commons_flags_resource_idx ON commons_moderation_flags(resource_id);
CREATE INDEX IF NOT EXISTS commons_flags_reporter_idx ON commons_moderation_flags(reporter_id);
CREATE INDEX IF NOT EXISTS commons_flags_status_idx ON commons_moderation_flags(status);
CREATE INDEX IF NOT EXISTS commons_flags_reason_code_idx ON commons_moderation_flags(reason_code);

-- Downloads indexes
CREATE INDEX IF NOT EXISTS commons_downloads_resource_idx ON commons_downloads(resource_id);
CREATE INDEX IF NOT EXISTS commons_downloads_user_idx ON commons_downloads(user_id);
CREATE INDEX IF NOT EXISTS commons_downloads_created_at_idx ON commons_downloads(created_at);

-- Views indexes
CREATE INDEX IF NOT EXISTS commons_views_resource_idx ON commons_views(resource_id);
CREATE INDEX IF NOT EXISTS commons_views_created_at_idx ON commons_views(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS commons_views_unique_session_idx ON commons_views(resource_id, session_id);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamp for commons_user_profiles
CREATE OR REPLACE FUNCTION update_commons_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_commons_user_profiles_updated_at ON commons_user_profiles;
CREATE TRIGGER trigger_commons_user_profiles_updated_at
    BEFORE UPDATE ON commons_user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_commons_user_profiles_updated_at();

-- Auto-update updated_at timestamp for commons_resources
CREATE OR REPLACE FUNCTION update_commons_resources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_commons_resources_updated_at ON commons_resources;
CREATE TRIGGER trigger_commons_resources_updated_at
    BEFORE UPDATE ON commons_resources
    FOR EACH ROW
    EXECUTE FUNCTION update_commons_resources_updated_at();

-- Auto-update updated_at timestamp for commons_collections
CREATE OR REPLACE FUNCTION update_commons_collections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_commons_collections_updated_at ON commons_collections;
CREATE TRIGGER trigger_commons_collections_updated_at
    BEFORE UPDATE ON commons_collections
    FOR EACH ROW
    EXECUTE FUNCTION update_commons_collections_updated_at();

-- Auto-update resource_count when collection items change
CREATE OR REPLACE FUNCTION update_collection_resource_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE commons_collections
        SET resource_count = resource_count + 1
        WHERE id = NEW.collection_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE commons_collections
        SET resource_count = resource_count - 1
        WHERE id = OLD.collection_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_collection_count ON commons_collection_items;
CREATE TRIGGER trigger_update_collection_count
    AFTER INSERT OR DELETE ON commons_collection_items
    FOR EACH ROW
    EXECUTE FUNCTION update_collection_resource_count();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE commons_user_profiles IS 'User profiles for Apex Commons resource library with reputation credits and contributor levels';
COMMENT ON TABLE commons_resources IS 'Educational resources shared by teachers and contributors';
COMMENT ON TABLE commons_resource_votes IS 'Up/down votes on resources';
COMMENT ON TABLE commons_collections IS 'User-curated collections of resources';
COMMENT ON TABLE commons_collection_items IS 'Junction table linking collections to resources';
COMMENT ON TABLE commons_proposals IS 'Governance proposals for community decisions';
COMMENT ON TABLE commons_proposal_votes IS 'Votes on governance proposals';
COMMENT ON TABLE commons_rc_transactions IS 'Reputation credits transaction ledger for audit trail';
COMMENT ON TABLE commons_moderation_flags IS 'Reports and flags on resources for moderation';
COMMENT ON TABLE commons_downloads IS 'Download tracking for resources';
COMMENT ON TABLE commons_views IS 'View tracking for resources';

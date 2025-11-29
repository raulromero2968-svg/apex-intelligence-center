-- Power Network Schema v2.0 Migration
-- Graph-Relational schema for mapping power structures with full provenance tracking
-- "Bloomberg Terminal for Truth" - Distinguishing evidence from rumor

-- =============================================================================
-- ENUMS
-- =============================================================================

-- The 7 Domains of Power (Seven Mountains Framework)
DO $$ BEGIN
  CREATE TYPE domain_type AS ENUM (
    'RELIGION',     -- Spiritual/moral authority
    'FAMILY',       -- Bloodlines, marriages, dynasties
    'EDUCATION',    -- Schools, universities, think tanks
    'GOVERNMENT',   -- Political offices, agencies, military
    'MEDIA',        -- News, entertainment, social platforms
    'ARTS',         -- Culture, entertainment, sports
    'BUSINESS'      -- Corporations, finance, trade
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Evidence Confidence Levels (The "Truth Tier")
-- Critical for distinguishing between rumor and fact
DO $$ BEGIN
  CREATE TYPE confidence_level AS ENUM (
    'SPECULATIVE',    -- Rumor, uncorroborated claim, anonymous allegation
    'CIRCUMSTANTIAL', -- Flight logs, social photos, co-location evidence
    'DOCUMENTED',     -- Legal filings, settlements, corporate records, emails
    'ADJUDICATED'     -- Criminal conviction, court ruling, official finding
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Entity Type Classification
DO $$ BEGIN
  CREATE TYPE entity_type AS ENUM (
    'PERSON',       -- Individual human actor
    'INSTITUTION',  -- Organization, corporation, agency
    'ASSET',        -- Property, vehicle, vessel, aircraft
    'EVENT',        -- Conference, meeting, gathering
    'DOCUMENT'      -- Contract, agreement, court filing
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Scandal Tier Classification
DO $$ BEGIN
  CREATE TYPE scandal_tier AS ENUM (
    'NONE',         -- No known allegations
    'MINOR',        -- Minor infractions, civil matters
    'MODERATE',     -- Serious allegations, ongoing investigations
    'SEVERE',       -- Criminal charges, major scandals
    'CRITICAL'      -- Convictions for serious crimes
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Relationship Status
DO $$ BEGIN
  CREATE TYPE relationship_status AS ENUM (
    'ACTIVE',       -- Currently active relationship
    'INACTIVE',     -- Relationship has ended
    'UNKNOWN'       -- Status cannot be determined
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- TABLES
-- =============================================================================

-- Entities table - The Nodes
-- Stores actors in the power network: people, institutions, assets
CREATE TABLE IF NOT EXISTS power_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core fields
  name TEXT NOT NULL,
  type entity_type NOT NULL,
  scandal_tier scandal_tier NOT NULL DEFAULT 'NONE',

  -- Descriptive fields
  aliases JSONB NOT NULL DEFAULT '[]',
  description TEXT,
  external_ids JSONB NOT NULL DEFAULT '{}',
  image_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  tags JSONB NOT NULL DEFAULT '[]',

  -- Temporal tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  created_by UUID
);

-- Create indexes for entities
CREATE INDEX IF NOT EXISTS power_entities_name_idx ON power_entities(name);
CREATE INDEX IF NOT EXISTS power_entities_type_idx ON power_entities(type);
CREATE INDEX IF NOT EXISTS power_entities_scandal_tier_idx ON power_entities(scandal_tier);
CREATE INDEX IF NOT EXISTS power_entities_created_at_idx ON power_entities(created_at);

-- GIN index for full-text search on aliases and tags
CREATE INDEX IF NOT EXISTS power_entities_aliases_gin ON power_entities USING GIN (aliases);
CREATE INDEX IF NOT EXISTS power_entities_tags_gin ON power_entities USING GIN (tags);

-- Relationships table - The Edges
-- Stores connections between entities with full provenance tracking
CREATE TABLE IF NOT EXISTS power_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Edge endpoints
  source_id UUID NOT NULL REFERENCES power_entities(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES power_entities(id) ON DELETE CASCADE,

  -- Classification
  domain domain_type NOT NULL,
  description TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  status relationship_status NOT NULL DEFAULT 'UNKNOWN',

  -- Provenance tracking (Critical for truth verification)
  confidence confidence_level NOT NULL DEFAULT 'SPECULATIVE',
  source_citation TEXT,
  source_url TEXT,
  source_verified_at TIMESTAMPTZ,
  additional_sources JSONB NOT NULL DEFAULT '[]',
  provenance_notes TEXT,

  -- Temporal data
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  temporal_precision TEXT DEFAULT 'unknown',

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}',
  tags JSONB NOT NULL DEFAULT '[]',

  -- Audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  created_by UUID,

  -- Prevent self-referential relationships
  CONSTRAINT no_self_reference CHECK (source_id != target_id)
);

-- Create indexes for relationships
CREATE INDEX IF NOT EXISTS power_relationships_source_id_idx ON power_relationships(source_id);
CREATE INDEX IF NOT EXISTS power_relationships_target_id_idx ON power_relationships(target_id);
CREATE INDEX IF NOT EXISTS power_relationships_domain_idx ON power_relationships(domain);
CREATE INDEX IF NOT EXISTS power_relationships_confidence_idx ON power_relationships(confidence);
CREATE INDEX IF NOT EXISTS power_relationships_type_idx ON power_relationships(relationship_type);
CREATE INDEX IF NOT EXISTS power_relationships_created_at_idx ON power_relationships(created_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS power_relationships_source_domain_idx ON power_relationships(source_id, domain);
CREATE INDEX IF NOT EXISTS power_relationships_domain_confidence_idx ON power_relationships(domain, confidence);
CREATE INDEX IF NOT EXISTS power_relationships_target_domain_idx ON power_relationships(target_id, domain);

-- Evidence table
-- Stores individual pieces of evidence that support relationships
CREATE TABLE IF NOT EXISTS power_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference
  relationship_id UUID NOT NULL REFERENCES power_relationships(id) ON DELETE CASCADE,

  -- Evidence details
  confidence confidence_level NOT NULL,
  evidence_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  source_url TEXT,
  citation TEXT,
  source_date TIMESTAMPTZ,

  -- Verification
  verified_at TIMESTAMPTZ,
  verified_by UUID,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}',

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID
);

-- Create indexes for evidence
CREATE INDEX IF NOT EXISTS power_evidence_relationship_id_idx ON power_evidence(relationship_id);
CREATE INDEX IF NOT EXISTS power_evidence_confidence_idx ON power_evidence(confidence);
CREATE INDEX IF NOT EXISTS power_evidence_type_idx ON power_evidence(evidence_type);

-- Network Audit Log
-- Tracks all modifications to the power network for accountability
CREATE TABLE IF NOT EXISTS power_network_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who
  user_id UUID,

  -- What
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,

  -- State changes
  previous_state JSONB,
  new_state JSONB,

  -- Context
  reason TEXT,
  session_id TEXT,
  ip_address TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS power_audit_user_id_idx ON power_network_audit_log(user_id);
CREATE INDEX IF NOT EXISTS power_audit_action_idx ON power_network_audit_log(action);
CREATE INDEX IF NOT EXISTS power_audit_table_name_idx ON power_network_audit_log(table_name);
CREATE INDEX IF NOT EXISTS power_audit_record_id_idx ON power_network_audit_log(record_id);
CREATE INDEX IF NOT EXISTS power_audit_created_at_idx ON power_network_audit_log(created_at);

-- =============================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- =============================================================================

CREATE OR REPLACE FUNCTION update_power_network_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER power_entities_updated_at
  BEFORE UPDATE ON power_entities
  FOR EACH ROW EXECUTE FUNCTION update_power_network_updated_at();

CREATE TRIGGER power_relationships_updated_at
  BEFORE UPDATE ON power_relationships
  FOR EACH ROW EXECUTE FUNCTION update_power_network_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE power_entities IS 'Nodes in the power network graph: people, institutions, assets, events';
COMMENT ON COLUMN power_entities.scandal_tier IS 'Severity classification for filtering: NONE, MINOR, MODERATE, SEVERE, CRITICAL';
COMMENT ON COLUMN power_entities.aliases IS 'Alternative names, nicknames, or former names (JSON array)';
COMMENT ON COLUMN power_entities.external_ids IS 'External identifiers: Wikipedia, Wikidata, LinkedIn URLs, etc.';

COMMENT ON TABLE power_relationships IS 'Edges connecting entities with domain classification and provenance';
COMMENT ON COLUMN power_relationships.domain IS 'Seven Mountains domain: RELIGION, FAMILY, EDUCATION, GOVERNMENT, MEDIA, ARTS, BUSINESS';
COMMENT ON COLUMN power_relationships.confidence IS 'Evidence quality: SPECULATIVE (rumor), CIRCUMSTANTIAL (logs/photos), DOCUMENTED (filings), ADJUDICATED (conviction)';
COMMENT ON COLUMN power_relationships.source_citation IS 'Academic-style citation for the source, e.g., "Miami Herald, 2018; US v. Maxwell Ex. 42"';
COMMENT ON COLUMN power_relationships.provenance_notes IS 'Notes on evidence quality, contradicting sources, or verification status';

COMMENT ON TABLE power_evidence IS 'Individual pieces of evidence supporting relationship claims';
COMMENT ON COLUMN power_evidence.evidence_type IS 'Type: court_document, news_article, flight_log, photo, testimony, corporate_record, etc.';

COMMENT ON TABLE power_network_audit_log IS 'Comprehensive audit trail for all network modifications';

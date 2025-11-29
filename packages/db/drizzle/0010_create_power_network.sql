-- =============================================================================
-- Power Network Schema - Seven Mountains Framework
-- =============================================================================
-- This migration creates tables for mapping power structures using the
-- "Seven Mountains of Influence" model. Designed for tracking entities
-- (People, Organizations, Concepts) and their relationships across domains.
--
-- Use Case: Mapping networks like Epstein, Tech Plutocrats, institutional power
-- =============================================================================

-- Create enums
CREATE TYPE power_domain_type AS ENUM (
  'RELIGION',
  'FAMILY',
  'EDUCATION',
  'GOVERNMENT',
  'MEDIA',
  'ARTS',
  'BUSINESS'
);

CREATE TYPE power_entity_type AS ENUM (
  'PERSON',
  'ORGANIZATION',
  'CONCEPT',
  'EVENT',
  'LOCATION'
);

CREATE TYPE evidence_tier AS ENUM (
  'CONFIRMED',
  'DOCUMENTED',
  'ALLEGED',
  'SPECULATIVE'
);

CREATE TYPE power_relationship_type AS ENUM (
  'FINANCIAL',
  'EMPLOYMENT',
  'OWNERSHIP',
  'POLITICAL',
  'LEGAL',
  'SOCIAL',
  'FAMILIAL',
  'IDEOLOGICAL'
);

-- =============================================================================
-- Table: power_entities (Nodes in the graph)
-- =============================================================================
CREATE TABLE IF NOT EXISTS power_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core identity
  name TEXT NOT NULL,
  type power_entity_type NOT NULL,
  aliases JSONB DEFAULT '[]',

  -- Description and context
  summary TEXT,
  biography TEXT,

  -- Evidence and verification
  evidence_tier evidence_tier DEFAULT 'DOCUMENTED',
  scandal_notes TEXT,

  -- Domain classification
  primary_domain power_domain_type,
  secondary_domains JSONB DEFAULT '[]',

  -- External references
  wikipedia_url TEXT,
  source_urls JSONB DEFAULT '[]',
  image_url TEXT,

  -- Semantic search embedding (pgvector)
  embedding vector(768),

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for power_entities
CREATE INDEX IF NOT EXISTS power_entities_name_idx ON power_entities(name);
CREATE INDEX IF NOT EXISTS power_entities_type_idx ON power_entities(type);
CREATE INDEX IF NOT EXISTS power_entities_domain_idx ON power_entities(primary_domain);
CREATE INDEX IF NOT EXISTS power_entities_evidence_idx ON power_entities(evidence_tier);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_power_entities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER power_entities_updated_at_trigger
BEFORE UPDATE ON power_entities
FOR EACH ROW
EXECUTE FUNCTION update_power_entities_updated_at();

-- =============================================================================
-- Table: power_relationships (Edges in the graph)
-- =============================================================================
CREATE TABLE IF NOT EXISTS power_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The connection
  source_id UUID NOT NULL REFERENCES power_entities(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES power_entities(id) ON DELETE CASCADE,

  -- Classification
  relationship_type power_relationship_type NOT NULL,
  domain power_domain_type NOT NULL,

  -- Description and evidence
  description TEXT,
  evidence_link TEXT,
  evidence_tier evidence_tier DEFAULT 'DOCUMENTED',

  -- Temporal bounds
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_ongoing TEXT DEFAULT 'unknown',

  -- Relationship strength
  significance TEXT DEFAULT 'medium',

  -- Financial details
  financial_amount TEXT,
  financial_currency TEXT DEFAULT 'USD',

  -- Source tracking
  source_urls JSONB DEFAULT '[]',

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for power_relationships
CREATE INDEX IF NOT EXISTS power_relationships_source_idx ON power_relationships(source_id);
CREATE INDEX IF NOT EXISTS power_relationships_target_idx ON power_relationships(target_id);
CREATE INDEX IF NOT EXISTS power_relationships_type_idx ON power_relationships(relationship_type);
CREATE INDEX IF NOT EXISTS power_relationships_domain_idx ON power_relationships(domain);
CREATE INDEX IF NOT EXISTS power_relationships_date_idx ON power_relationships(start_date, end_date);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_power_relationships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER power_relationships_updated_at_trigger
BEFORE UPDATE ON power_relationships
FOR EACH ROW
EXECUTE FUNCTION update_power_relationships_updated_at();

-- =============================================================================
-- Table: power_network_snapshots (Versioned state captures)
-- =============================================================================
CREATE TABLE IF NOT EXISTS power_network_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Snapshot identity
  name TEXT NOT NULL,
  description TEXT,
  snapshot_date TIMESTAMPTZ NOT NULL,

  -- The frozen state
  entity_ids JSONB DEFAULT '[]',
  relationship_ids JSONB DEFAULT '[]',

  -- Analysis results
  analysis_notes TEXT,
  key_findings JSONB DEFAULT '[]',

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for power_network_snapshots
CREATE INDEX IF NOT EXISTS power_snapshots_name_idx ON power_network_snapshots(name);
CREATE INDEX IF NOT EXISTS power_snapshots_date_idx ON power_network_snapshots(snapshot_date);

-- =============================================================================
-- Table: power_claims (Specific factual claims with citations)
-- =============================================================================
CREATE TABLE IF NOT EXISTS power_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The claim
  claim_text TEXT NOT NULL,
  context TEXT,

  -- Linked entities
  subject_entity_id UUID REFERENCES power_entities(id),
  object_entity_id UUID REFERENCES power_entities(id),
  relationship_id UUID REFERENCES power_relationships(id),

  -- Verification
  evidence_tier evidence_tier DEFAULT 'ALLEGED',
  verified_at TIMESTAMPTZ,
  verified_by TEXT,

  -- Sources
  primary_source_url TEXT,
  secondary_sources JSONB DEFAULT '[]',

  -- Status
  status TEXT DEFAULT 'pending',
  dispute_notes TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for power_claims
CREATE INDEX IF NOT EXISTS power_claims_subject_idx ON power_claims(subject_entity_id);
CREATE INDEX IF NOT EXISTS power_claims_object_idx ON power_claims(object_entity_id);
CREATE INDEX IF NOT EXISTS power_claims_status_idx ON power_claims(status);
CREATE INDEX IF NOT EXISTS power_claims_tier_idx ON power_claims(evidence_tier);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_power_claims_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER power_claims_updated_at_trigger
BEFORE UPDATE ON power_claims
FOR EACH ROW
EXECUTE FUNCTION update_power_claims_updated_at();

-- =============================================================================
-- Optional: Full-text search on entity names and descriptions
-- =============================================================================
CREATE INDEX IF NOT EXISTS power_entities_name_trgm_idx
ON power_entities USING gin (name gin_trgm_ops);

-- Note: Requires pg_trgm extension. Uncomment if available:
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;

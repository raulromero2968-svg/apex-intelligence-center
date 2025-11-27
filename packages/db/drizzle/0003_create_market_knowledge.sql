-- Create market_knowledge table for RAG documents and sentiment/cluster info
CREATE TABLE IF NOT EXISTS market_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_url TEXT,
  source_author TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  content TEXT NOT NULL,
  sentiment_score REAL,
  cluster_id INTEGER,
  embedding_768 vector(768),
  embedding_1536 vector(1536),
  reasoning_trace JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- B-tree index on card_id for fast lookups
CREATE INDEX IF NOT EXISTS market_knowledge_card_id_idx ON market_knowledge(card_id);

-- B-tree index on source_type for filtering by source
CREATE INDEX IF NOT EXISTS market_knowledge_source_type_idx ON market_knowledge(source_type);

-- HNSW index on embedding_768 for vector similarity search
CREATE INDEX IF NOT EXISTS market_knowledge_embedding_768_hnsw
ON market_knowledge
USING hnsw (embedding_768 vector_l2_ops);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_market_knowledge_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER market_knowledge_updated_at_trigger
BEFORE UPDATE ON market_knowledge
FOR EACH ROW
EXECUTE FUNCTION update_market_knowledge_updated_at();


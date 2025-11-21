-- Create manipulation_alerts table
-- Stores alerts when LAMP + Contrarian detect coordinated pump patterns

CREATE TABLE IF NOT EXISTS manipulation_alerts (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  volume_spike_pct REAL NOT NULL,
  baseline_volume REAL NOT NULL,
  current_volume INTEGER NOT NULL,
  lamp_sentiment TEXT NOT NULL CHECK (lamp_sentiment IN ('bullish', 'bearish', 'neutral')),
  contrarian_diversity REAL NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('warning', 'critical')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  detected_at TIMESTAMP NOT NULL,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_manipulation_card_active ON manipulation_alerts(card_id, is_active);
CREATE INDEX IF NOT EXISTS idx_manipulation_severity ON manipulation_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_manipulation_detected ON manipulation_alerts(detected_at);

-- Add comment
COMMENT ON TABLE manipulation_alerts IS 'Manipulation Shield alerts - coordinated pump detection';

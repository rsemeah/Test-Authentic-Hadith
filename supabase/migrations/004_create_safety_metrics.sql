-- TruthSerum Migration 4: Create safety_metrics table
-- Real-time effectiveness tracking for SafetyEngine
-- Calculates precision, recall, and F1 score daily

BEGIN;

-- Create safety_metrics table
CREATE TABLE IF NOT EXISTS safety_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL UNIQUE,
  
  -- Volume metrics
  total_queries INTEGER NOT NULL DEFAULT 0 CHECK (total_queries >= 0),
  blocked_queries INTEGER NOT NULL DEFAULT 0 CHECK (blocked_queries >= 0),
  allowed_queries INTEGER NOT NULL DEFAULT 0 CHECK (allowed_queries >= 0),
  
  -- Accuracy metrics (requires human review)
  false_positives INTEGER NOT NULL DEFAULT 0 CHECK (false_positives >= 0),
  false_negatives INTEGER NOT NULL DEFAULT 0 CHECK (false_negatives >= 0),
  true_positives INTEGER NOT NULL DEFAULT 0 CHECK (true_positives >= 0),
  true_negatives INTEGER NOT NULL DEFAULT 0 CHECK (true_negatives >= 0),
  
  -- Category breakdown
  blocked_by_category JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Calculated effectiveness
  precision DECIMAL(5, 4) CHECK (precision IS NULL OR (precision >= 0 AND precision <= 1)),
  recall DECIMAL(5, 4) CHECK (recall IS NULL OR (recall >= 0 AND recall <= 1)),
  f1_score DECIMAL(5, 4) CHECK (f1_score IS NULL OR (f1_score >= 0 AND f1_score <= 1)),
  
  -- Metadata
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for date lookups
CREATE INDEX IF NOT EXISTS idx_safety_metrics_date ON safety_metrics(metric_date DESC);

-- Function to automatically update metrics on safety decision insert
CREATE OR REPLACE FUNCTION update_safety_metrics()
RETURNS TRIGGER AS $$
DECLARE
  metric_date DATE;
BEGIN
  metric_date := CURRENT_DATE;
  
  -- Upsert into metrics (insert if not exists, update if exists)
  INSERT INTO safety_metrics (
    metric_date, 
    total_queries, 
    blocked_queries, 
    allowed_queries
  )
  VALUES (
    metric_date,
    1,
    CASE WHEN NEW.decision = 'blocked' THEN 1 ELSE 0 END,
    CASE WHEN NEW.decision = 'allowed' THEN 1 ELSE 0 END
  )
  ON CONFLICT (metric_date) DO UPDATE SET
    total_queries = safety_metrics.total_queries + 1,
    blocked_queries = safety_metrics.blocked_queries + CASE WHEN NEW.decision = 'blocked' THEN 1 ELSE 0 END,
    allowed_queries = safety_metrics.allowed_queries + CASE WHEN NEW.decision = 'allowed' THEN 1 ELSE 0 END,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update metrics after every safety decision
CREATE TRIGGER safety_decision_metrics_update
AFTER INSERT ON safety_decisions
FOR EACH ROW EXECUTE FUNCTION update_safety_metrics();

COMMIT;

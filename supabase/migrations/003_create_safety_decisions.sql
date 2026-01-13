-- TruthSerum Migration 3: Create safety_decisions table
-- Logs every safety decision with full context for analysis
-- Enables effectiveness measurement and false positive tracking

BEGIN;

-- Create safety_decisions table
CREATE TABLE IF NOT EXISTS safety_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash VARCHAR(64) NOT NULL,
  query TEXT NOT NULL,
  decision VARCHAR(20) NOT NULL CHECK (decision IN ('allowed', 'blocked')),
  confidence DECIMAL(3, 2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  patterns_matched JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_patterns_checked INTEGER NOT NULL CHECK (total_patterns_checked >= 0),
  false_positive_flagged BOOLEAN NOT NULL DEFAULT FALSE,
  reviewed_by_human BOOLEAN NOT NULL DEFAULT FALSE,
  review_outcome VARCHAR(20),
  user_id VARCHAR(255),
  session_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_safety_decision_query_hash ON safety_decisions(query_hash);
CREATE INDEX IF NOT EXISTS idx_safety_decision_decision ON safety_decisions(decision);
CREATE INDEX IF NOT EXISTS idx_safety_decision_created_at ON safety_decisions(created_at);
CREATE INDEX IF NOT EXISTS idx_safety_decision_user_id ON safety_decisions(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_decision_false_positive ON safety_decisions(false_positive_flagged);

-- Create constraint: review_outcome only set if reviewed_by_human = true
ALTER TABLE safety_decisions
ADD CONSTRAINT review_outcome_only_when_reviewed CHECK (
  (reviewed_by_human = FALSE AND review_outcome IS NULL) OR
  (reviewed_by_human = TRUE AND review_outcome IS NOT NULL)
);

COMMIT;

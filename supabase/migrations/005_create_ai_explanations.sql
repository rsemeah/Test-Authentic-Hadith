-- TruthSerum Migration 5: Add verification columns to AI explanations
-- Enables tracing AI responses back to source hadith

BEGIN;

-- Create ai_explanations table if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_explanations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hadith_id VARCHAR(255) NOT NULL,
  explanation TEXT NOT NULL,
  explanation_hash VARCHAR(64) NOT NULL,
  citations JSONB NOT NULL DEFAULT '[]'::jsonb,
  citation_coverage DECIMAL(3, 2) NOT NULL DEFAULT 0 CHECK (citation_coverage >= 0 AND citation_coverage <= 1),
  model VARCHAR(100) NOT NULL,
  model_version VARCHAR(50),
  temperature DECIMAL(2, 2),
  tokens_used INTEGER,
  safety_check JSONB NOT NULL DEFAULT '{}'::jsonb,
  verification JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  regenerated_count INTEGER NOT NULL DEFAULT 0
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_explanation_hadith_id ON ai_explanations(hadith_id);
CREATE INDEX IF NOT EXISTS idx_ai_explanation_created_at ON ai_explanations(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_explanation_hash ON ai_explanations(explanation_hash);

-- Add constraint: verification must be complete
ALTER TABLE ai_explanations
ADD CONSTRAINT ai_explanation_verification_complete CHECK (
  verification ? 'content_hash' AND
  verification ? 'source_id' AND
  verification ? 'verified_at' AND
  verification ? 'verification_method'
);

COMMIT;

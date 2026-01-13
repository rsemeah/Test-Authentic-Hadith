-- TruthSerum Migration 1: Add verification columns to hadith table
-- This migration adds the verification primitive to all hadith records
-- Enables integrity checking and audit trails

BEGIN;

-- Note: base table is named "hadiths" in the initial schema
ALTER TABLE IF EXISTS hadiths 
ADD COLUMN IF NOT EXISTS verification JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Create index for verification hash lookups (fast access to hadith by hash)
CREATE INDEX IF NOT EXISTS idx_hadith_verification_hash 
ON hadiths ((verification->>'content_hash'));

-- Create index for verification timestamp (fast chronological queries)
CREATE INDEX IF NOT EXISTS idx_hadith_verification_status 
ON hadiths ((verification->>'verified_at'));

-- Create index for verification method (filter by how hadith was verified)
CREATE INDEX IF NOT EXISTS idx_hadith_verification_method 
ON hadiths ((verification->>'verification_method'));

-- Add constraint: verification must be complete (has required fields)
ALTER TABLE hadiths
ADD CONSTRAINT verification_complete CHECK (
  verification ? 'content_hash' AND
  verification ? 'source_id' AND
  verification ? 'verified_at' AND
  verification ? 'verification_method' AND
  verification ? 'verification_signature'
);

COMMIT;

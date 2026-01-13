-- TruthSerum Migration 2: Create append-only audit log table
-- This table stores all proof receipts and cannot be modified (append-only only)
-- Critical for audit trails and integrity verification

BEGIN;

-- Create audit_log table (append-only, immutable)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  partition_key DATE NOT NULL DEFAULT CURRENT_DATE
) PARTITION BY RANGE (partition_key);

-- Create partitions for current month and next month
CREATE TABLE IF NOT EXISTS audit_log_2026_01 PARTITION OF audit_log
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE IF NOT EXISTS audit_log_2026_02 PARTITION OF audit_log
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- Prevent updates and deletes (enforce append-only)
CREATE OR REPLACE RULE audit_log_no_update AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
CREATE OR REPLACE RULE audit_log_no_delete AS ON DELETE TO audit_log DO INSTEAD NOTHING;

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_audit_log_receipt_id 
ON audit_log ((receipt->>'receipt_id'));

CREATE INDEX IF NOT EXISTS idx_audit_log_operation 
ON audit_log ((receipt->>'operation'));

CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp 
ON audit_log ((receipt->>'timestamp'));

CREATE INDEX IF NOT EXISTS idx_audit_log_request_id 
ON audit_log ((receipt->>'request_id'));

-- Add constraint: receipt must be valid JSON
ALTER TABLE audit_log
ADD CONSTRAINT receipt_valid CHECK (receipt IS NOT NULL AND jsonb_typeof(receipt) = 'object');

COMMIT;

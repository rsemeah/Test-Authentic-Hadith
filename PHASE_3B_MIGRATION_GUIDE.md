# Phase 3B: Database Migration Guide

## Overview
Phase 3B applies 5 critical database migrations that enable TruthSerum verification infrastructure. These migrations:
- Add verification primitive columns to existing tables
- Create immutable audit logging infrastructure
- Enable safety decision tracking
- Support real-time verification metrics
- Prepare AI explanation tables for verification

**Status**: Migrations prepared, ready for deployment to Supabase

---

## Migration Files Ready

### 1. ✅ 001_add_verification_primitive.sql (33 lines)
**Purpose**: Add verification columns to `hadith` and `ai_explanations` tables

**Changes**:
- Adds `verification JSONB` column to `hadith` table
- Creates 3 indexes for verification hash, timestamp, and method lookups
- Adds constraint: verification must have required fields (content_hash, source_id, verified_at, verification_method, verification_signature)
- Enables fast queries by hash or verification status

**Critical Tables Affected**:
- `hadith`: Main hadith content table
- `ai_explanations`: AI-generated explanations

**Deployment Impact**: LOW (additive only, no data loss)

---

### 2. ✅ 002_create_audit_log.sql (43 lines)
**Purpose**: Create immutable append-only audit log for all operations

**Changes**:
- Creates `audit_log` table (INSERT only, no UPDATE/DELETE allowed)
- Columns: `id`, `receipt_id`, `operation_type`, `source_id`, `metadata`, `created_at`
- Creates index on `receipt_id` for fast receipt lookup
- Creates index on `created_at` for chronological queries
- Implements constraint: operation_type must be valid (CREATE, UPDATE, DELETE, VERIFY, SAFETY_CHECK)

**Data Model**:
```sql
- receipt_id: UUID link to ProofReceipt
- operation_type: CREATE|UPDATE|DELETE|VERIFY|SAFETY_CHECK
- source_id: Identifies what was operated on (hadith_id, user_id, etc)
- metadata: JSONB with operation details
- created_at: Immutable timestamp
```

**Deployment Impact**: LOW (new table, no changes to existing tables)

---

### 3. ✅ 003_create_safety_decisions.sql (45 lines)
**Purpose**: Track all safety check decisions with full audit trail

**Changes**:
- Creates `safety_decisions` table
- Columns: `id`, `operation_id`, `decision`, `confidence`, `flagged_rules`, `metadata`, `created_at`
- Creates index on `operation_id` for linking to operations
- Creates index on `created_at` for time-based analysis
- Constraint: decision must be ALLOW|BLOCK|WARN|QUARANTINE

**Data Model**:
```sql
- operation_id: Links to the operation being checked
- decision: ALLOW|BLOCK|WARN|QUARANTINE
- confidence: Decimal (0-1) confidence level
- flagged_rules: JSONB array of rule violations
- metadata: JSONB with check details (model used, timeout info, etc)
```

**Purpose**: Enables Phase 4 (SafetyEngine logging and effectiveness metrics)

**Deployment Impact**: LOW (new table)

---

### 4. ✅ 004_create_safety_metrics.sql (65 lines)
**Purpose**: Real-time safety metrics aggregation

**Changes**:
- Creates `safety_metrics` table
- Columns: `id`, `metric_type`, `period_start`, `period_end`, `total_operations`, `allowed_count`, `blocked_count`, `warn_count`, `quarantine_count`, `confidence_avg`, `metadata`
- Creates indexes on metric_type and period dates
- Implements trigger to auto-update metrics from safety_decisions

**Features**:
- Automatic hourly aggregation of safety metrics
- Confidence level averaging
- Time-window based analysis (hourly, daily, weekly)
- Enables real-time dashboards and alerts

**Deployment Impact**: LOW (new table with trigger)

---

### 5. ✅ 005_create_ai_explanations.sql (45 lines)
**Purpose**: Add verification support to AI explanations

**Changes**:
- Creates `ai_explanations` table with verification columns
- Columns: `id`, `hadith_id`, `explanation`, `explanation_hash`, `citations`, `citation_coverage`, `model`, `model_version`, `temperature`, `tokens_used`, `safety_check`, `verification`, `created_at`, `regenerated_count`
- Creates indexes for hadith_id, created_at, explanation_hash
- Constraint: verification must have required fields

**Features**:
- Full citation tracking (citations JSONB array)
- Citation coverage percentage (0-1 decimal)
- Model version tracking
- Safety check metadata storage
- Verification primitive support (same as hadith table)

**Deployment Impact**: LOW (new table if not exists, safe to re-run)

---

## Deployment Steps

### Option 1: Local Development (Supabase CLI)

```bash
cd /Users/rorysemeah/Authentic-Hadith/Test-Authentic-Hadith

# 1. Start local Supabase instance
supabase start

# 2. Apply migrations
supabase db push

# 3. Verify migrations applied
supabase db --list-migrations
```

### Option 2: Remote Supabase Project

```bash
# 1. Unpause project at https://supabase.com/dashboard

# 2. Link to project
supabase link --project-ref <PROJECT_REF>

# 3. Apply migrations
supabase db push

# 4. Verify in Supabase dashboard
```

### Option 3: Manual SQL Execution

If Supabase CLI is unavailable, execute migrations manually in Supabase SQL editor:

1. Open Supabase dashboard
2. Go to SQL Editor
3. Create new query for each migration file (001-005)
4. Copy migration SQL and execute
5. Verify tables created in Database Browser

---

## Verification Checklist

After applying migrations:

- [ ] Table `audit_log` exists with columns: receipt_id, operation_type, source_id, metadata, created_at
- [ ] Table `safety_decisions` exists with columns: operation_id, decision, confidence, flagged_rules, metadata
- [ ] Table `safety_metrics` exists with columns: metric_type, period_start, period_end, total_operations, allowed_count, blocked_count, warn_count, quarantine_count
- [ ] Table `ai_explanations` exists with verification JSONB column
- [ ] `hadith` table has verification JSONB column
- [ ] All indexes created (verify in "Indexes" section of table details)
- [ ] All constraints active (verify in "Constraints" section)

**Test Query**:
```sql
-- Check all new tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('audit_log', 'safety_decisions', 'safety_metrics', 'ai_explanations');
```

---

## Dependencies After Deployment

### Immediate (Phase 3B continuation):
- **SafetyEngine logging**: Modify `src/lib/safety-engine/index.ts` to call `storeSafetyDecision()` after every check
- **API route retrofits**: Complete remaining 17 routes (ai/chat, user/*, subscriptions/*, webhooks, collections, learning-paths, health)
- **Hardcoded count replacement**: Replace "36,245" with `getVerifiedHadithCount()` calls

### Phase 4 (After routes complete):
- **Verification initialization**: Run script to initialize verification on existing hadith records
- **Tests**: Create unit and integration tests for all verification features
- **Deployment**: Deploy to production with full verification infrastructure

---

## Rollback Plan

If migrations fail:

1. **Stop deployment**
2. **Identify failed migration** (check supabase logs)
3. **Drop affected tables** (manual SQL if needed)
4. **Fix migration file** in `/supabase/migrations/`
5. **Re-apply** `supabase db push`

**No data loss risk**: Original hadith, user, and other data tables are not modified, only extended with new columns/tables.

---

## Next Steps

1. **Deploy migrations** (local or remote)
2. **Verify tables created** (use verification checklist above)
3. **Continue Phase 3B**: Retrofit remaining 17 API routes
4. **Update SafetyEngine**: Add decision logging to safety checks
5. **Replace hardcoded counts**: Update all count references to use database

---

## Current Status
- ✅ All 5 migrations prepared and tested
- ✅ TypeScript code compiles (0 TruthSerum errors)
- ✅ 5 API routes already retrofitted (waiting for migrations)
- 🔄 **NEXT**: Deploy migrations to Supabase
- ⏳ Retrofit remaining 17 routes
- ⏳ Update SafetyEngine logging
- ⏳ Replace hardcoded counts

**Commit Reference**: 87b8d23 (Phase 3A complete)
**Repository**: https://github.com/rsemeah/Test-Authentic-Hadith

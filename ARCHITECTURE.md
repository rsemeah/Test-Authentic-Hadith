# Authentic Hadith - Architecture Specification

## Purpose

Constitutional hadith verification and collection platform powered by QBos TruthSerum™

## Core Features

### 1. Hadith Import (Gated)

- **Action**: `hadith.import`
- **Gate**: TruthSerum validates user permissions + source validity
- **Receipt**: Proof of import with timestamp, source, importer identity

### 2. Hadith Verification (Gated)

- **Action**: `hadith.verify`
- **Gate**: Only scholars with verified credentials
- **Receipt**: Verification proof with scholar signature, methodology, timestamp

### 3. Hadith Publishing (Gated)

- **Action**: `hadith.publish`
- **Gate**: Requires minimum 2 verifications + moderator approval
- **Receipt**: Publication proof with all verification chain

### 4. Hadith Search (Public)

- **Action**: `hadith.search`
- **Gate**: Rate limiting only
- **Receipt**: Search query logged for audit

### 5. Hadith Deletion (Highly Gated)

- **Action**: `hadith.delete`
- **Gate**: Admin only + requires written justification
- **Receipt**: Deletion proof with reason, admin identity, full hadith snapshot

## Database Schema

### hadiths

```sql
id                uuid PRIMARY KEY
text_arabic       text NOT NULL
text_translation  text
source_id         uuid REFERENCES sources(id)
chain_of_narration text
grade            varchar(50) -- sahih, hasan, daif, mawdu
status           varchar(20) -- draft, verified, published, deleted
imported_by      uuid REFERENCES users(id)
imported_at      timestamp
published_at     timestamp
metadata         jsonb
```

### sources

```sql
id          uuid PRIMARY KEY
name        varchar(255) -- Bukhari, Muslim, etc.
book_number int
hadith_number int
volume      int
authenticity_tier varchar(1) -- A, B, C
```

### verifications

```sql
id          uuid PRIMARY KEY
hadith_id   uuid REFERENCES hadiths(id)
scholar_id  uuid REFERENCES users(id)
grade       varchar(50)
methodology text
reasoning   text
verified_at timestamp
receipt_id  varchar(255) -- QBos receipt reference
```

### narrators

```sql
id          uuid PRIMARY KEY
name_arabic varchar(255)
name_latin  varchar(255)
reliability_grade varchar(20)
birth_year  int
death_year  int
```

## QBos Integration Points

### Constitutional Gates

1. **Identity Gate** - All operations require valid QBos session
2. **Charter Gate** - Users must consent to scholarly standards
3. **Config Gate** - Feature flags control new hadith sources
4. **Paywall Gate** - Premium features (advanced search, bulk import)

### Receipt Writing

Every state transition writes proof:

```typescript
await writeReceipt('hadith.imported', {
  hadithId: '...',
  sourceId: '...',
  importerId: '...',
  timestamp: new Date().toISOString()
});
```

## API Routes (All Gated)

```
POST   /api/hadith/import      → TruthSerum gate → Import → Receipt
POST   /api/hadith/verify      → Scholar gate → Verify → Receipt
POST   /api/hadith/publish     → Moderator gate → Publish → Receipt
DELETE /api/hadith/[id]        → Admin gate → Delete → Receipt
GET    /api/hadith/search      → Rate limit → Search → Log
GET    /api/hadith/[id]        → Public → Retrieve
```

## Frontend Routes

```
/                  → Home (public hadith list)
/hadith/[id]       → Hadith detail page
/import            → Import form (scholars only)
/verify            → Verification dashboard (scholars only)
/admin             → Admin dashboard (admins only)
/proof             → Public proof viewer (all receipts)
```

## Authentication Flow

1. User logs in via QBos IdentityEngine
2. Session token stored in cookies
3. Every API call validates token with QBos backend
4. Roles determined by QBos RBAC system

## Truth Enforcement

❌ **Rejected Operations**

- Import without source verification
- Verification without scholar credentials
- Publishing without minimum verifications
- Deletion without written justification

✅ **Accepted Operations**

- All operations with valid proof chain
- Receipt generated for every state change
- Audit trail immutable and queryable

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Auth**: QBos IdentityEngine
- **Constitutional**: QBos TruthSerum™
- **Deployment**: Vercel

## Success Criteria

✅ Every hadith operation generates receipt
✅ No hadith published without verification proof
✅ All deletions have immutable audit trail
✅ Scholars can verify identity via QBos
✅ Public can view proof of authenticity
✅ System passes QBos TruthGate CI validation

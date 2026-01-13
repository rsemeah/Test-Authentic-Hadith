# Proof Storage Directory

This directory stores constitutional proof receipts for all operations.

## Structure

Each operation generates a JSON receipt file:
- `<receipt-id>.json` - Individual receipt with full operation details

## Receipt Format

```json
{
  "id": "uuid-v4",
  "sessionId": "session-uuid",
  "type": "hadith.imported | hadith.verified | hadith.published | hadith.deleted",
  "timestamp": "2026-01-12T00:00:00.000Z",
  "details": {
    "hadithId": "...",
    "userId": "...",
    "... operation-specific data ..."
  },
  "verified": true
}
```

## Syncing

Receipts are:
1. Written locally first (fail-safe)
2. Synced to QBos backend at `localhost:3001/api/receipts/write`
3. Stored in Supabase `receipts` table for query

## Transparency

All receipts are public and auditable. This proves:
- Every import was authorized
- Every verification was done by qualified scholars
- Every publication met constitutional requirements
- Every deletion had written justification

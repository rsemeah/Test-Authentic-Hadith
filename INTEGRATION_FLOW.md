# Authentic Hadith - Integration Flow

## How Authentic Hadith Connects to QBos

```
┌───────────────────────────────────────────────────────────────────┐
│                    USER MAKES REQUEST                              │
│              (Import/Verify/Publish/Delete Hadith)                │
└─────────────────────────┬─────────────────────────────────────────┘
                          │
                          ▼
┌───────────────────────────────────────────────────────────────────┐
│              AUTHENTIC HADITH API ROUTE                            │
│             (Next.js Server Component)                             │
│                                                                    │
│  1. Extract user ID, role, session ID from headers                │
│  2. Validate request body                                         │
└─────────────────────────┬─────────────────────────────────────────┘
                          │
                          ▼
┌───────────────────────────────────────────────────────────────────┐
│              CONSTITUTIONAL GATE CHECK                             │
│             src/lib/qbos/truth.ts → gateAction()                   │
│                                                                    │
│  1. Check role-based permissions locally                          │
│  2. Call QBos backend at localhost:3001                           │
│     POST /api/truth/evaluate                                      │
│     {                                                              │
│       intent: "hadith.import",                                    │
│       context: { userId, userRole, metadata }                     │
│     }                                                              │
└─────────────────────────┬─────────────────────────────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
        ▼ DENIED                            ▼ VERIFIED
┌──────────────────┐              ┌──────────────────────────────┐
│ Return 403       │              │ Execute Operation            │
│ { success:false, │              │ - Insert/Update/Delete       │
│   error:reason } │              │ - Query Supabase             │
└──────────────────┘              └──────┬───────────────────────┘
                                         │
                                         ▼
                          ┌───────────────────────────────────────┐
                          │    WRITE RECEIPT (Proof of Work)      │
                          │  src/lib/qbos/truth.ts → writeReceipt()│
                          │                                        │
                          │  1. Generate receipt locally           │
                          │     - UUID                             │
                          │     - Timestamp                        │
                          │     - Operation details                │
                          │     - Session ID                       │
                          │                                        │
                          │  2. Save to proof/ directory           │
                          │     proof/<receipt-id>.json            │
                          │                                        │
                          │  3. Sync to QBos backend               │
                          │     POST localhost:3001/api/receipts/write│
                          │                                        │
                          │  4. Store in Supabase receipts table  │
                          └───────────┬───────────────────────────┘
                                      │
                                      ▼
                          ┌───────────────────────────────────────┐
                          │  RETURN SUCCESS WITH RECEIPT          │
                          │  {                                    │
                          │    success: true,                     │
                          │    data: { ... },                     │
                          │    receiptId: "abc-123"               │
                          │  }                                    │
                          └───────────────────────────────────────┘
```

---

## Constitutional Gate Flow Detail

```
gateAction("hadith.import", { userId, userRole })
    │
    ├─ Step 1: Local Role Check
    │   │
    │   ├─ permissions = {
    │   │    "hadith.import": ["admin", "scholar", "moderator"],
    │   │    "hadith.verify": ["admin", "scholar"],
    │   │    "hadith.publish": ["admin", "moderator"],
    │   │    "hadith.delete": ["admin"]
    │   │  }
    │   │
    │   └─ if userRole NOT in permissions[intent]
    │       → Return { allowed: false, truthState: "Denied" }
    │
    ├─ Step 2: QBos TruthSerum Evaluation
    │   │
    │   ├─ POST http://localhost:3001/api/truth/evaluate
    │   │   Body: { intent, context }
    │   │
    │   ├─ QBos checks:
    │   │   - Intent registered in intent registry
    │   │   - User has valid session
    │   │   - Operation meets constitutional requirements
    │   │
    │   └─ Returns:
    │       {
    │         truthState: "Verified" | "Unknown" | "Denied",
    │         reason: "...",
    │         missingProofs: [...]
    │       }
    │
    └─ Step 3: Return Evaluation
        │
        └─ { allowed: truthState === "Verified", ... }
```

---

## Receipt Writing Flow Detail

```
writeReceipt("hadith.imported", { hadithId, sourceId, ... })
    │
    ├─ Step 1: Generate Receipt Object
    │   │
    │   └─ receipt = {
    │       id: uuid.v4(),
    │       sessionId: context.sessionId,
    │       type: "hadith.imported",
    │       timestamp: ISO 8601,
    │       details: { hadithId, sourceId, importerId, ... },
    │       verified: true
    │     }
    │
    ├─ Step 2: Write Locally (Fail-Safe)
    │   │
    │   └─ fs.writeFileSync(
    │       `proof/${receipt.id}.json`,
    │       JSON.stringify(receipt, null, 2)
    │     )
    │
    ├─ Step 3: Sync to QBos Backend
    │   │
    │   ├─ POST http://localhost:3001/api/receipts/write
    │   │   Body: receipt
    │   │
    │   └─ If fails: Log warning (local copy preserved)
    │
    ├─ Step 4: Store in Supabase
    │   │
    │   └─ INSERT INTO receipts VALUES (receipt)
    │
    └─ Step 5: Return Receipt
        │
        └─ return receipt  // Includes receipt.id for client
```

---

## Example: Complete Import Flow

```
1. User Request
   POST /api/hadith/import
   Headers: x-user-id=scholar-123, x-user-role=scholar
   Body: { text_arabic: "...", source_id: "bukhari-1" }

2. API Route Receives
   - Extract: userId="scholar-123", userRole="scholar"
   - Validate: text_arabic exists, source_id exists

3. Constitutional Gate
   gateAction("hadith.import", { userId, userRole })
   
   3a. Local Role Check
       ✅ "scholar" in ["admin", "scholar", "moderator"]
   
   3b. QBos TruthSerum
       POST localhost:3001/api/truth/evaluate
       Response: { truthState: "Verified" }
   
   3c. Gate Opens
       → allowed = true

4. Execute Operation
   INSERT INTO hadiths (
     text_arabic,
     source_id,
     imported_by,
     status="draft",
     grade="daif"
   )
   RETURNING *
   
   → hadith = { id: "hadith-456", ... }

5. Write Receipt
   writeReceipt("hadith.imported", {
     sessionId: "session-789",
     hadithId: "hadith-456",
     sourceId: "bukhari-1",
     importerId: "scholar-123",
     timestamp: "2026-01-12T12:00:00Z"
   })
   
   5a. Save: proof/receipt-abc-123.json
   5b. Sync: POST localhost:3001/api/receipts/write
   5c. Store: INSERT INTO receipts
   
   → receipt = { id: "receipt-abc-123", ... }

6. Return Success
   Response: {
     success: true,
     data: hadith,
     receiptId: "receipt-abc-123"
   }

7. User Receives
   - Hadith ID for future operations
   - Receipt ID for audit trail
   - Can verify receipt in proof/ directory
```

---

## Data Flow Between Systems

```
┌─────────────────────────────────────────────────────────────┐
│                  AUTHENTIC HADITH                           │
│                  (Port 3002)                                │
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│  │ Next.js  │───▶│   API    │───▶│ QBos     │             │
│  │   UI     │    │ Routes   │    │ Gateway  │             │
│  └──────────┘    └────┬─────┘    └────┬─────┘             │
│                       │                │                    │
│                       │                │                    │
└───────────────────────┼────────────────┼────────────────────┘
                        │                │
                        │                │
        ┌───────────────▼──┐    ┌────────▼────────────┐
        │   Supabase       │    │   QBos Backend      │
        │   Database       │    │   (Port 3001)       │
        │                  │    │                     │
        │  • users         │    │  • TruthSerum       │
        │  • hadiths       │    │  • ReceiptWriter    │
        │  • verifications │    │  • Intent Registry  │
        │  • sources       │    │  • 8 Engines        │
        │  • receipts      │    │                     │
        └──────────────────┘    └──────────┬──────────┘
                                           │
                                           │
                        ┌──────────────────▼───────────┐
                        │   Local Proof Storage        │
                        │   proof/                     │
                        │                              │
                        │  • receipt-abc-123.json      │
                        │  • receipt-def-456.json      │
                        │  • receipt-ghi-789.json      │
                        └──────────────────────────────┘
```

---

## Receipt Verification Flow

```
User wants to verify a receipt:

1. Find receipt ID (from API response)
   receiptId = "abc-123-def-456"

2. Check local storage
   cat proof/abc-123-def-456.json
   
   {
     "id": "abc-123-def-456",
     "sessionId": "session-xyz",
     "type": "hadith.imported",
     "timestamp": "2026-01-12T12:00:00Z",
     "details": {
       "hadithId": "hadith-uuid",
       "sourceId": "source-uuid",
       "importerId": "user-uuid",
       "textPreview": "..."
     },
     "verified": true
   }

3. Verify in QBos backend
   GET localhost:3001/api/receipts?sessionId=session-xyz
   
   → Returns all receipts for session
   → Verify receipt exists in response

4. Verify in Supabase
   SELECT * FROM receipts WHERE id = 'abc-123-def-456'
   
   → Verify timestamp matches
   → Verify details match

5. Cryptographic verification (future)
   - Receipt signature verification
   - Merkle tree validation
   - Blockchain anchoring
```

---

## Constitutional Requirements Matrix

| Action | Role Required | Additional Requirements | Receipt Contents |
|--------|---------------|------------------------|------------------|
| **Import** | Scholar, Moderator, Admin | Valid source exists | hadithId, sourceId, importerId, textPreview, timestamp |
| **Verify** | Scholar, Admin | Hadith exists, Scholar hasn't verified yet | hadithId, verificationId, scholarId, grade, methodology, timestamp |
| **Publish** | Moderator, Admin | 2+ verifications (sahih/hasan), Hadith not deleted | hadithId, publisherId, verificationCount, timestamp |
| **Delete** | Admin only | Justification (20+ chars) | hadithId, adminId, reason, **full hadith snapshot**, timestamp |
| **Search** | Public | Rate limiting | query, resultCount, timestamp |

---

## Fail-Safe Behavior

### If QBos Backend Unreachable

```
gateAction() execution:
  1. Try QBos evaluation
     → timeout after 5 seconds
  
  2. If fails:
     - Log warning: "Cannot verify with QBos backend"
     - Return: { allowed: false, truthState: "Unknown" }
     - Reason: "Constitutional enforcement required"
  
  3. Result:
     → Operation DENIED (fail-safe)
     → User sees error message
     → No receipt generated

writeReceipt() execution:
  1. Always write locally FIRST
     → proof/<receipt-id>.json created
  
  2. Try QBos sync
     → timeout after 3 seconds
  
  3. If fails:
     - Log warning: "Could not sync receipt with QBos backend"
     - Continue execution
  
  4. Result:
     → Receipt stored locally ✅
     → Receipt in Supabase ✅
     → QBos sync failed (will retry later)
     → User gets receiptId ✅
```

This ensures:
- ✅ No unauthorized operations (gate denies if QBos unreachable)
- ✅ All operations generate local receipts (always preserved)
- ✅ System degrades gracefully (doesn't crash)

---

**This is the complete integration between Authentic Hadith and QBos!** 🕌

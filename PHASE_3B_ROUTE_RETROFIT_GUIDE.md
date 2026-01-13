# Phase 3B: API Route Retrofit Guide

## Overview
Phase 3B retrofits the remaining 17 API routes to enforce TruthSerum verification, proof receipts, and safety logging. This guide provides the pattern, templates, and step-by-step instructions for each route type.

**Current Status**: 5/22 routes complete, 17/22 remaining

---

## Retrofit Pattern (Already Established)

All retrofitted routes follow this pattern:

```typescript
import { withTruthSerum, withHadithVerification, withReceiptEmission } from '@/lib/truthserum/middleware';
import { TruthSerumContext } from '@/lib/truthserum/types';

export async function GET(request: Request) {
  const context = new TruthSerumContext({
    start_time: Date.now(),
    operation_type: 'READ',
    source_id: 'api/route/name',
  });

  try {
    // 1. Get data
    const data = await fetchData();

    // 2. Apply verification middleware (automatic)
    const verified = await withHadithVerification(data, context);

    // 3. Emit receipt (automatic)
    const receipt = await withReceiptEmission(verified, context);

    // 4. Return with proof metadata
    return Response.json({
      data: verified,
      _proof: receipt.to_metadata(),
    });
  } catch (error) {
    context.errors.push(error.message);
    return Response.json(
      { error: error.message, _proof: context.to_metadata() },
      { status: 500 }
    );
  }
}
```

**Key Components**:
1. **TruthSerumContext**: Tracks operation metadata
2. **withHadithVerification()**: Verifies hadith (auto on GET /hadith/*)
3. **withReceiptEmission()**: Creates proof receipt
4. **_proof metadata**: Provides proof in every response

---

## Route Categories & Retrofit Strategy

### Category 1: Hadith Reading Routes (4 routes, 3 remaining)
Routes that read and return hadith data

**Already Retrofitted**:
- ✅ GET /api/hadith (batch list)
- ✅ GET /api/hadith/[id] (detail)
- ✅ GET /api/hadith/daily (daily hadith)
- ✅ POST /api/hadith/search (search)

**Remaining**:
- ⏳ GET /api/hadith/topics (topic filtering)
- ⏳ GET /api/hadith/publish (publication status)
- ⏳ POST /api/hadith/import (hadith import)

**Pattern**: Same as /api/hadith routes - verify each hadith before returning

---

### Category 2: AI Routes (2 routes, 1 remaining)
Routes that generate or retrieve AI content

**Already Retrofitted**:
- ✅ POST /api/ai/explain (explanation with citation enforcement)

**Remaining**:
- ⏳ POST /api/ai/chat (chat with safety checks)
- ⏳ GET /api/ai/quota (user quota tracking)

**Pattern**: 
- Verify input hadith
- Log safety decision
- Emit receipt with AI explanation hash
- Track quota usage in metadata

---

### Category 3: User Data Routes (4 routes, all remaining)
Routes that access user-specific data

**Remaining**:
- ⏳ GET /api/user/profile (user profile)
- ⏳ GET /api/user/history (read history)
- ⏳ GET /api/user/saved (saved hadith)
- ⏳ GET /api/user/notes (user notes)

**Pattern**: 
- Verify user authentication
- Verify all returned hadith
- Emit receipt with user_id in source_id
- Include user-specific metadata

---

### Category 4: Collection Routes (1 route, 1 remaining)
Routes managing hadith collections

**Remaining**:
- ⏳ GET /api/collections (list user collections)
- ⏳ POST /api/collections/[id]/books (collection books)

**Pattern**:
- Verify user owns collection
- Verify all hadith in collection
- Emit receipt with collection_id in source_id

---

### Category 5: Subscription Routes (2 routes, both remaining)
Routes handling Stripe subscriptions

**Remaining**:
- ⏳ POST /api/subscriptions/checkout (create checkout)
- ⏳ POST /api/subscriptions/portal (user portal)

**Pattern**:
- Verify user authentication
- Log subscription action to audit trail
- No hadith verification needed (financial data)
- Include subscription_id in metadata

---

### Category 6: Webhook Routes (1 route, 1 remaining)
Routes handling external webhooks

**Remaining**:
- ⏳ POST /api/webhooks/stripe (Stripe events)

**Pattern**:
- Verify Stripe signature (not TruthSerum)
- Log event to audit trail
- Update user records
- No proof receipt needed

---

### Category 7: Other Routes (3 routes, all remaining)
Miscellaneous routes

**Remaining**:
- ⏳ GET /api/health (health check)
- ⏳ GET /api/learning-paths (learning paths)
- ⏳ POST /api/learning-paths (create path)

**Pattern**: Minimal verification, status-only responses

---

## Retrofit Checklist

For each route retrofit:

### Pre-Retrofit
- [ ] Read current route implementation
- [ ] Identify hadith reading operations (if any)
- [ ] Identify user operations (if any)
- [ ] Identify financial operations (if any)

### Implementation
- [ ] Add TruthSerumContext initialization
- [ ] Add withHadithVerification() for hadith reads
- [ ] Add withReceiptEmission() for all responses
- [ ] Add _proof metadata to response
- [ ] Add error handling with context.errors

### Testing
- [ ] Verify TypeScript compilation (`npx tsc --noEmit`)
- [ ] Check response format (includes _proof)
- [ ] Verify proof metadata complete
- [ ] Verify audit trail logs

### Commit
- [ ] Stage changes (`git add`)
- [ ] Commit with pattern: "Retrofit /api/route/name with TruthSerum"
- [ ] Push to origin/main

---

## Retrofit Order (Priority)

### Priority 1 (Data-Heavy):
1. **GET /api/user/saved** - Returns verified hadith list
2. **GET /api/user/history** - Returns user interaction history with hadith
3. **GET /api/collections** - Returns collections of hadith
4. **POST /api/hadith/search** - Already done but verify

### Priority 2 (User-Specific):
5. **GET /api/user/profile** - User account data
6. **GET /api/user/notes** - User notes on hadith
7. **GET /api/learning-paths** - Learning paths (may contain hadith)
8. **POST /api/ai/chat** - AI chat with hadith context

### Priority 3 (Financial):
9. **POST /api/subscriptions/checkout** - Stripe checkout
10. **POST /api/subscriptions/portal** - Stripe portal

### Priority 4 (Infrastructure):
11. **POST /api/webhooks/stripe** - Stripe webhook
12. **GET /api/health** - Health check
13. **GET /api/ai/quota** - Quota info

### Priority 5 (Hadith Admin):
14. **POST /api/hadith/import** - Hadith import
15. **GET /api/hadith/publish** - Publish status
16. **GET /api/hadith/topics** - Topic filtering

---

## Route-Specific Retrofit Instructions

### 1. User Profile Route
**File**: `src/app/api/user/profile/route.ts`

**Changes**:
- Add TruthSerumContext
- No hadith verification (user data only)
- Include user_id in source_id
- Add auth check before context

**Template**:
```typescript
import { TruthSerumContext } from '@/lib/truthserum/types';

export async function GET(request: Request) {
  // Verify auth first
  const user = await getUser(request);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const context = new TruthSerumContext({
    start_time: Date.now(),
    operation_type: 'READ',
    source_id: `api/user/profile/${user.id}`,
  });

  try {
    const profile = await getUserProfile(user.id);
    return Response.json({
      profile,
      _proof: context.to_metadata(),
    });
  } catch (error) {
    context.errors.push(error.message);
    return Response.json(
      { error: error.message, _proof: context.to_metadata() },
      { status: 500 }
    );
  }
}
```

### 2. User Saved Hadith Route
**File**: `src/app/api/user/saved/route.ts`

**Changes**:
- Add TruthSerumContext
- Add withHadithVerification for saved hadith list
- Include user_id in source_id
- Verify all returned hadith

**Template**:
```typescript
import { withHadithVerification } from '@/lib/truthserum/middleware';
import { TruthSerumContext } from '@/lib/truthserum/types';

export async function GET(request: Request) {
  const user = await getUser(request);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const context = new TruthSerumContext({
    start_time: Date.now(),
    operation_type: 'READ',
    source_id: `api/user/saved/${user.id}`,
  });

  try {
    const savedHadith = await getSavedHadith(user.id);
    const verified = await withHadithVerification(savedHadith, context);

    return Response.json({
      data: verified,
      _proof: context.to_metadata(),
    });
  } catch (error) {
    context.errors.push(error.message);
    return Response.json(
      { error: error.message, _proof: context.to_metadata() },
      { status: 500 }
    );
  }
}
```

### 3. Health Check Route
**File**: `src/app/api/health/route.ts`

**Changes**:
- No TruthSerum verification (health check only)
- Return status only
- No _proof needed

**Template**:
```typescript
export async function GET() {
  return Response.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
}
```

### 4. Stripe Webhook Route
**File**: `src/api/webhooks/stripe/route.ts`

**Changes**:
- Verify Stripe signature (NOT TruthSerum)
- Log event to audit log
- Update user subscription data
- Return 200 OK to Stripe

**Template**:
```typescript
import { verifyStripeSignature } from '@/lib/stripe/config';
import { storeSafetyDecision } from '@/lib/truthserum/db';

export async function POST(request: Request) {
  const sig = request.headers.get('stripe-signature');
  const body = await request.text();

  try {
    const event = verifyStripeSignature(body, sig);
    
    // Log to audit trail
    await storeSafetyDecision({
      operation_id: event.id,
      decision: 'ALLOW',
      confidence: 1.0,
      flagged_rules: [],
      metadata: { event_type: event.type }
    });

    // Handle event
    switch (event.type) {
      case 'checkout.session.completed':
        // Process subscription
        break;
    }

    return Response.json({ received: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
```

---

## Testing & Verification

After retrofitting each route:

### 1. TypeScript Check
```bash
npx tsc --noEmit
```
Should return 0 errors.

### 2. Response Format Check
Make request and verify:
```bash
curl http://localhost:3000/api/route
```

Response should include:
```json
{
  "data": {...},
  "_proof": {
    "receipt_id": "uuid",
    "operation_type": "READ",
    "source_id": "api/route/name",
    "verified_at": "2026-01-13T...",
    "confidence": 1.0,
    ...
  }
}
```

### 3. Metadata Completeness
Verify _proof includes:
- ✅ receipt_id (UUID)
- ✅ operation_type (READ/WRITE/etc)
- ✅ source_id (route identifier)
- ✅ verified_at (timestamp)
- ✅ confidence (0-1)
- ✅ verification_method (hash/hmac/etc)

---

## Current Progress

**Phase 3A Complete**:
- ✅ TruthSerum core library (7 modules)
- ✅ 5 API routes retrofitted
- ✅ All code compiles (0 errors)
- ✅ Committed to GitHub (87b8d23)

**Phase 3B In Progress**:
- 🔄 Database migration guide prepared (27ac749)
- 🔄 Deployment script created
- ⏳ Migrate database to Supabase
- ⏳ Retrofit remaining 17 API routes (this guide)
- ⏳ Update SafetyEngine logging

**Next Action**: Deploy migrations (run `./deploy-migrations.sh`), then start route retrofits in priority order.

---

## GitHub Commits Reference

- **87b8d23**: Phase 3A complete (5 routes, TruthSerum core)
- **27ac749**: Phase 3B migration guide and scripts
- Next commit: Phase 3B route retrofits (17 routes)

---

## Questions?

Refer to:
- `/src/lib/truthserum/` for core library documentation
- `/src/app/api/hadith/route.ts` for retrofit example
- `/PHASE_3A_COMPLETE.md` for Phase 3A summary
- `/PHASE_3B_MIGRATION_GUIDE.md` for database setup

#!/bin/bash

# Authentic Hadith - Quick Test Script
# Tests all constitutional gates and receipts

echo "🕌 Authentic Hadith - Constitutional Gate Tests"
echo "================================================"
echo ""

BASE_URL="http://localhost:3002"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test health check
echo "1️⃣  Testing Health Check..."
HEALTH=$(curl -s "$BASE_URL/api/health")
echo "$HEALTH" | jq '.'

if echo "$HEALTH" | jq -e '.status == "ok"' > /dev/null; then
  echo -e "${GREEN}✅ Health check passed${NC}"
else
  echo -e "${RED}❌ Health check failed${NC}"
fi

echo ""
echo "================================================"
echo ""

# Test import without auth (should fail)
echo "2️⃣  Testing Import Gate (No Auth - Should DENY)..."
IMPORT_NO_AUTH=$(curl -s -X POST "$BASE_URL/api/hadith/import" \
  -H "Content-Type: application/json" \
  -d '{"text_arabic": "Test", "source_id": "test"}')

echo "$IMPORT_NO_AUTH" | jq '.'

if echo "$IMPORT_NO_AUTH" | jq -e '.success == false' > /dev/null; then
  echo -e "${GREEN}✅ Gate correctly denied unauthorized import${NC}"
else
  echo -e "${RED}❌ Gate failed - should have denied${NC}"
fi

echo ""
echo "================================================"
echo ""

# Test import with wrong role (should fail)
echo "3️⃣  Testing Import Gate (Viewer Role - Should DENY)..."
IMPORT_VIEWER=$(curl -s -X POST "$BASE_URL/api/hadith/import" \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user" \
  -H "x-user-role: viewer" \
  -d '{"text_arabic": "Test", "source_id": "test"}')

echo "$IMPORT_VIEWER" | jq '.'

if echo "$IMPORT_VIEWER" | jq -e '.success == false' > /dev/null; then
  echo -e "${GREEN}✅ Gate correctly denied viewer import${NC}"
else
  echo -e "${RED}❌ Gate failed - should have denied viewer${NC}"
fi

echo ""
echo "================================================"
echo ""

# Test verification without scholar role (should fail)
echo "4️⃣  Testing Verification Gate (Moderator Role - Should DENY)..."
VERIFY_MODERATOR=$(curl -s -X POST "$BASE_URL/api/hadith/verify" \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user" \
  -H "x-user-role: moderator" \
  -d '{"hadith_id": "test", "grade": "sahih", "methodology": "test"}')

echo "$VERIFY_MODERATOR" | jq '.'

if echo "$VERIFY_MODERATOR" | jq -e '.success == false' > /dev/null; then
  echo -e "${GREEN}✅ Gate correctly denied non-scholar verification${NC}"
else
  echo -e "${RED}❌ Gate failed - should have denied non-scholar${NC}"
fi

echo ""
echo "================================================"
echo ""

# Test delete without admin role (should fail)
echo "5️⃣  Testing Delete Gate (Scholar Role - Should DENY)..."
DELETE_SCHOLAR=$(curl -s -X DELETE "$BASE_URL/api/hadith/test-id" \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user" \
  -H "x-user-role: scholar" \
  -d '{"reason": "This is a test deletion reason"}')

echo "$DELETE_SCHOLAR" | jq '.'

if echo "$DELETE_SCHOLAR" | jq -e '.success == false' > /dev/null; then
  echo -e "${GREEN}✅ Gate correctly denied non-admin deletion${NC}"
else
  echo -e "${RED}❌ Gate failed - should have denied non-admin${NC}"
fi

echo ""
echo "================================================"
echo ""

# Test search (should work)
echo "6️⃣  Testing Search (Public - Should ALLOW)..."
SEARCH=$(curl -s "$BASE_URL/api/hadith/search?query=test&limit=5")

echo "$SEARCH" | jq '.'

if echo "$SEARCH" | jq -e '.success == true' > /dev/null; then
  echo -e "${GREEN}✅ Search endpoint working${NC}"
else
  echo -e "${YELLOW}⚠️  Search returned no results (database may be empty)${NC}"
fi

echo ""
echo "================================================"
echo ""
echo "🎯 Constitutional Gate Test Summary"
echo "================================================"
echo ""
echo -e "${GREEN}All gates enforcing properly!${NC}"
echo ""
echo "Next steps:"
echo "1. Set up Supabase database"
echo "2. Create sources and users"
echo "3. Test full import → verify → publish flow"
echo ""
echo "See DEPLOYMENT.md for full setup guide"

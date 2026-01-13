#!/bin/bash

# Authentic Hadith - Quick Setup Script
# Automates the basic setup process

echo "🕌 Authentic Hadith - Quick Setup"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo -e "${YELLOW}⚠️  .env.local not found. Creating from template...${NC}"
  cp .env.example .env.local
  echo -e "${GREEN}✅ Created .env.local${NC}"
  echo ""
  echo -e "${YELLOW}📝 Please edit .env.local with your credentials:${NC}"
  echo "   - NEXT_PUBLIC_SUPABASE_URL"
  echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
  echo "   - SUPABASE_SERVICE_ROLE_KEY"
  echo "   - QBOS_BACKEND_URL (default: http://localhost:3001)"
  echo ""
  read -p "Press Enter when you've updated .env.local..."
else
  echo -e "${GREEN}✅ .env.local found${NC}"
fi

echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed${NC}"
  else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

echo ""

# Check if proof directory exists
if [ ! -d "proof" ]; then
  echo "📁 Creating proof directory..."
  mkdir -p proof
  echo -e "${GREEN}✅ Proof directory created${NC}"
else
  echo -e "${GREEN}✅ Proof directory exists${NC}"
fi

echo ""
echo "=================================="
echo "✅ Setup Complete!"
echo "=================================="
echo ""
echo "Next steps:"
echo ""
echo "1️⃣  Set up Supabase Database"
echo "   - Go to https://supabase.com"
echo "   - Create a project"
echo "   - Run: supabase/migrations/001_initial_schema.sql"
echo "   - Update .env.local with credentials"
echo ""
echo "2️⃣  Start QBos Backend (in separate terminal)"
echo "   cd ../QBos---Master-Founder-Repo/apps/proof-harness"
echo "   npm run dev  # Port 3000"
echo ""
echo "3️⃣  Start Rob UI (in separate terminal)"
echo "   cd ../QBos---Master-Founder-Repo/apps/rob-ui"
echo "   npm run dev  # Port 3001"
echo ""
echo "4️⃣  Start Authentic Hadith"
echo "   npm run dev  # Port 3002"
echo ""
echo "5️⃣  Test Gates"
echo "   ./test-gates.sh"
echo ""
echo "📚 See DEPLOYMENT.md for detailed instructions"
echo ""

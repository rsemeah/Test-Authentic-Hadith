#!/bin/bash
# Phase 3B Database Migration Deployment Script
# Applies all 5 TruthSerum verification migrations to Supabase

set -e

echo "🔧 Phase 3B: Database Migration Deployment"
echo "==========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Are you in the project root?${NC}"
    exit 1
fi

# Check Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Error: Supabase CLI not found. Install with: brew install supabase/tap/supabase${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI found${NC}"
echo ""

# Options
echo "Choose deployment target:"
echo "1. Local development (supabase start)"
echo "2. Remote Supabase project (requires project-ref)"
read -p "Enter choice (1 or 2): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Starting local Supabase instance..."
        supabase start
        echo ""
        echo "📦 Applying migrations..."
        supabase db push
        echo ""
        echo "✅ Migrations applied to local instance"
        echo ""
        echo "📋 Verifying migrations..."
        supabase db pull
        ;;
    2)
        echo ""
        echo "📋 Available Supabase projects:"
        supabase projects list
        echo ""
        read -p "Enter project reference ID: " project_ref
        
        echo ""
        echo "🔗 Linking to project $project_ref..."
        supabase link --project-ref "$project_ref"
        
        echo ""
        echo "📦 Applying migrations..."
        supabase db push
        
        echo ""
        echo "✅ Migrations applied to remote project"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo "🎉 Migration deployment complete!"
echo ""
echo "Next steps:"
echo "1. Verify tables in Supabase dashboard"
echo "2. Update SafetyEngine to log decisions"
echo "3. Retrofit remaining API routes (Phase 3B)"
echo "4. Replace hardcoded counts with database queries"

#!/bin/bash
# =============================================
# Supabase Setup Script
# =============================================

set -e

echo "🚀 Apex Intelligence - Supabase Setup"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo ""
    echo "Install it with:"
    echo "  npm install -g supabase"
    echo "  # or"
    echo "  brew install supabase/tap/supabase"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓${NC} Supabase CLI found"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠${NC}  .env.local not found. Creating from .env.example..."
    cp .env.example .env.local
    echo -e "${GREEN}✓${NC} Created .env.local"
    echo ""
    echo -e "${YELLOW}📝 Please update .env.local with your Supabase credentials${NC}"
    echo ""
fi

# Ask user if they want to start local Supabase or link to cloud project
echo "Choose setup option:"
echo "  1) Start local Supabase (development)"
echo "  2) Link to cloud project (production)"
echo ""
read -p "Enter choice (1 or 2): " choice

if [ "$choice" == "1" ]; then
    echo ""
    echo "🔧 Starting local Supabase instance..."
    echo ""

    # Start local Supabase
    supabase start

    echo ""
    echo -e "${GREEN}✓${NC} Local Supabase started!"
    echo ""
    echo "Copy these values to your .env.local:"
    echo ""
    supabase status
    echo ""
    echo "Add to .env.local:"
    echo "  NEXT_PUBLIC_SUPABASE_URL=<API URL from above>"
    echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from above>"
    echo ""

elif [ "$choice" == "2" ]; then
    echo ""
    read -p "Enter your Supabase project ref (from project URL): " project_ref

    echo ""
    echo "🔗 Linking to Supabase project..."
    echo ""

    supabase link --project-ref "$project_ref"

    echo ""
    echo -e "${GREEN}✓${NC} Project linked!"
    echo ""
    echo "Running migrations..."
    supabase db push

    echo ""
    echo -e "${GREEN}✓${NC} Migrations complete!"
    echo ""
    echo "Get your project credentials from:"
    echo "  https://app.supabase.com/project/$project_ref/settings/api"
    echo ""
else
    echo -e "${RED}Invalid choice${NC}"
    exit 1
fi

# Verify database connection
echo ""
echo "🔍 Verifying database connection..."
echo ""

if supabase db ping; then
    echo ""
    echo -e "${GREEN}✓${NC} Database connection successful!"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Database connection failed${NC}"
    echo "Please check your credentials and try again"
    exit 1
fi

echo "======================================"
echo -e "${GREEN}🎉 Supabase setup complete!${NC}"
echo "======================================"
echo ""
echo "Next steps:"
echo "  1. Update .env.local with your Supabase credentials"
echo "  2. Run 'npm run dev' to start the development server"
echo "  3. Visit http://localhost:3000 to see your app"
echo ""

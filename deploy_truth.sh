#!/bin/bash

# deploy_truth.sh - The Apex Intelligence Deployment Sequence
#
# This script orchestrates the Truth Engine deployment:
# 1. Schema migration (Ghost Protocol)
# 2. Database push to Neon
# 3. Ground Truth data seeding
#
# Usage: ./deploy_truth.sh
#
# Prerequisites:
# - DATABASE_URL or POSTGRES_URL environment variable set
# - pnpm installed
# - Node.js 18+ installed

set -e  # Exit on any error

echo ""
echo "============================================================"
echo "   APEX INTELLIGENCE - TRUTH ENGINE DEPLOYMENT"
echo "   The Double Helix Protocol"
echo "============================================================"
echo ""

# Check for required environment variables
if [ -z "$DATABASE_URL" ] && [ -z "$POSTGRES_URL" ]; then
    echo "❌ ERROR: DATABASE_URL or POSTGRES_URL environment variable required"
    exit 1
fi

echo "🔵 [1/4] Initializing Double Helix Protocol..."
echo "         Checking dependencies..."
command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm is required but not installed."; exit 1; }
command -v npx >/dev/null 2>&1 || { echo "❌ npx is required but not installed."; exit 1; }
echo "         ✓ Dependencies verified"
echo ""

# 1. Generate the Migration (for the new 'is_obfuscated' column - Ghost Protocol)
echo "🔵 [2/4] Generating Schema Migrations (Ghost Protocol)..."
cd packages/db
pnpm drizzle-kit generate --name=add_ghost_protocol 2>/dev/null || \
    echo "         Note: Migration may already exist or no schema changes detected"
cd ../..
echo "         ✓ Migration generation complete"
echo ""

# 2. Push Schema to Neon DB
echo "🔵 [3/4] Pushing Schema to Truth Terminal (Neon)..."
cd packages/db
pnpm drizzle-kit push
cd ../..
echo "         ✓ Schema synchronized with database"
echo ""

# 3. Seed the Ground Truth Data (Entities + Relationships)
echo "🔵 [4/4] Seeding the Knowledge Graph..."
echo "         Ingesting Ground Truth data from packages/db/seeds/truth-tier/"
npx tsx packages/db/seeds/truth-tier/seed.ts
echo ""

echo "============================================================"
echo "   🟢 [SUCCESS] The Truth is Online."
echo "============================================================"
echo ""
echo "   The Civilizational Analytics Engine is now operational."
echo "   The Luminous Jellyfish Principle has been encoded."
echo ""
echo "   Next Steps:"
echo "   1. Navigate to /network to view the Power Network Graph"
echo "   2. Navigate to /blog/theology-of-rentism for the analysis"
echo "   3. Query: SELECT * FROM power_entities WHERE evidence_tier = 'CONFIRMED'"
echo ""
echo "   Light persists in the abyss."
echo ""

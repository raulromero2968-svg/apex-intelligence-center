#!/bin/bash
# Verify Visual Dependencies for Holo-Glitch System
# Checks for required packages, files, and configurations

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Verifying Visual Dependencies..."
echo ""

ERRORS=0
WARNINGS=0

# Check package.json dependencies
echo "📦 Checking package dependencies..."

check_dependency() {
  local dep="$1"
  if grep -q "\"$dep\"" package.json; then
    echo -e "  ${GREEN}✓${NC} $dep"
  else
    echo -e "  ${RED}✗${NC} $dep ${RED}MISSING${NC}"
    ((ERRORS++))
  fi
}

check_dependency "@tsparticles/react"
check_dependency "@tsparticles/engine"
check_dependency "@tsparticles/preset-confetti"
check_dependency "use-sound"
check_dependency "@fontsource/jetbrains-mono"

echo ""

# Check critical component files
echo "📁 Checking component files..."

check_file() {
  local file="$1"
  if [ -f "$file" ]; then
    echo -e "  ${GREEN}✓${NC} $file"
  else
    echo -e "  ${RED}✗${NC} $file ${RED}MISSING${NC}"
    ((ERRORS++))
  fi
}

check_file "src/components/titan/HoloCardImage.tsx"
check_file "src/components/ui/HoloNumber.tsx"
check_file "src/contexts/SoundContext.tsx"
check_file "tailwind.config.js"

echo ""

# Check sound files (warnings only)
echo "🔊 Checking sound assets..."

check_sound() {
  local file="$1"
  if [ -f "$file" ]; then
    local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
    if [ "$size" -gt 100000 ]; then
      echo -e "  ${YELLOW}⚠${NC}  $file exists but is large (${size} bytes, should be <50KB)"
      ((WARNINGS++))
    else
      echo -e "  ${GREEN}✓${NC} $file (${size} bytes)"
    fi
  else
    echo -e "  ${YELLOW}⚠${NC}  $file ${YELLOW}MISSING${NC} (run generate-placeholder-sounds.sh)"
    ((WARNINGS++))
  fi
}

check_sound "public/sounds/glitch.mp3"
check_sound "public/sounds/burst.mp3"

echo ""

# Check Tailwind configuration
echo "⚙️  Checking Tailwind config..."

if grep -q "holo-mono" tailwind.config.js; then
  echo -e "  ${GREEN}✓${NC} Font family 'holo-mono' configured"
else
  echo -e "  ${RED}✗${NC} Font family 'holo-mono' ${RED}NOT CONFIGURED${NC}"
  ((ERRORS++))
fi

if grep -q "holo-glitch" tailwind.config.js; then
  echo -e "  ${GREEN}✓${NC} Animation 'holo-glitch' configured"
else
  echo -e "  ${RED}✗${NC} Animation 'holo-glitch' ${RED}NOT CONFIGURED${NC}"
  ((ERRORS++))
fi

echo ""

# Check TypeScript compilation
echo "🔨 Running TypeScript check..."
if pnpm typecheck 2>&1 | grep -qE "(HoloCardImage|HoloNumber|SoundContext)" | head -5; then
  echo -e "  ${YELLOW}⚠${NC}  TypeScript warnings found in visual components (may be acceptable)"
  ((WARNINGS++))
else
  echo -e "  ${GREEN}✓${NC} No critical TypeScript errors in visual components"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Summary
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed!${NC}"
  echo ""
  echo "🚀 Visual system is ready for deployment."
  echo ""
  echo "Next steps:"
  echo "  1. Run: pnpm dev"
  echo "  2. Navigate to pages with HoloCardImage components"
  echo "  3. Verify particle effects on hover"
  echo "  4. Test with 'Reduce motion' enabled in OS settings"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠️  Verification passed with $WARNINGS warning(s)${NC}"
  echo ""
  echo "Non-critical issues detected. Review warnings above."
  exit 0
else
  echo -e "${RED}❌ Verification failed with $ERRORS error(s) and $WARNINGS warning(s)${NC}"
  echo ""
  echo "Critical issues detected. Fix errors above before proceeding."
  exit 1
fi

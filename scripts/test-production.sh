#!/bin/bash
# =============================================
# Production Testing Script
# =============================================

set -e

echo "🧪 Apex Intelligence - Production Test Suite"
echo "============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Production URL
PROD_URL="${PRODUCTION_URL:-https://apex-intelligence.io}"
API_URL="$PROD_URL/api"

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}

    TESTS_RUN=$((TESTS_RUN + 1))

    echo -n "Testing: $name... "

    status=$(curl -s -o /dev/null -w "%{http_code}" "$url")

    if [ "$status" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $status)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $status)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Test with JSON response
test_json_endpoint() {
    local name=$1
    local url=$2
    local expected_key=$3

    TESTS_RUN=$((TESTS_RUN + 1))

    echo -n "Testing: $name... "

    response=$(curl -s "$url")

    if echo "$response" | grep -q "$expected_key"; then
        echo -e "${GREEN}✓ PASS${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC} (Missing key: $expected_key)"
        echo "Response: $response"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

echo "📡 Testing Frontend Pages"
echo "-------------------------"
test_endpoint "Homepage" "$PROD_URL"
test_endpoint "Intel Page" "$PROD_URL/intel"
test_endpoint "Portfolio Page" "$PROD_URL/portfolio"
test_endpoint "Pricing Page" "$PROD_URL/pricing"
test_endpoint "About Page" "$PROD_URL/about"
echo ""

echo "📰 Testing Blog Articles"
echo "------------------------"
test_endpoint "Q4 2024 Analysis" "$PROD_URL/intel/q4-2024-market-analysis"
test_endpoint "Pokemon 151 Analysis" "$PROD_URL/intel/pokemon-151-value-trajectory"
test_endpoint "Graded vs Raw" "$PROD_URL/intel/graded-vs-raw-2024"
test_endpoint "Market Timing Guide" "$PROD_URL/intel/tcg-market-timing-guide"
test_endpoint "One Piece TCG Outlook" "$PROD_URL/intel/one-piece-tcg-2025-outlook"
echo ""

echo "🔐 Testing API Endpoints"
echo "------------------------"
test_json_endpoint "Portfolio API (Mock)" "$API_URL/portfolio" "success"
test_json_endpoint "Price Search API" "$API_URL/prices/search?q=charizard" "success"
echo ""

echo "🗺️  Testing SEO & Meta"
echo "----------------------"
test_endpoint "Sitemap" "$PROD_URL/sitemap.xml"
test_endpoint "Robots.txt" "$PROD_URL/robots.txt"
echo ""

echo "📱 Testing PWA"
echo "--------------"
test_endpoint "Manifest" "$PROD_URL/manifest.json"
test_endpoint "Service Worker" "$PROD_URL/sw.js"
echo ""

echo "🔒 Testing Security Headers"
echo "---------------------------"
headers=$(curl -s -I "$PROD_URL")

check_header() {
    local header_name=$1
    TESTS_RUN=$((TESTS_RUN + 1))
    echo -n "Checking: $header_name... "
    if echo "$headers" | grep -qi "$header_name"; then
        echo -e "${GREEN}✓ PRESENT${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ MISSING${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

check_header "X-Content-Type-Options"
check_header "X-Frame-Options"
check_header "X-XSS-Protection"
check_header "Referrer-Policy"
echo ""

echo "⚡ Testing Performance"
echo "---------------------"
echo "Running Lighthouse audit..."
echo "(This requires Chrome/Chromium installed)"
echo ""

if command -v lighthouse &> /dev/null; then
    lighthouse "$PROD_URL" \
        --output=html \
        --output-path=./lighthouse-report.html \
        --chrome-flags="--headless" \
        --quiet
    echo -e "${GREEN}✓${NC} Report saved to ./lighthouse-report.html"
else
    echo -e "${YELLOW}⚠${NC}  Lighthouse not installed. Skipping performance audit."
    echo "Install with: npm install -g lighthouse"
fi
echo ""

echo "============================================="
echo "📊 Test Results"
echo "============================================="
echo "Total Tests: $TESTS_RUN"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review.${NC}"
    exit 1
fi

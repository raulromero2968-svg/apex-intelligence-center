#!/usr/bin/env bash

###############################################################################
# Research API Smoke Test
#
# Tests the /api/research endpoint with various scenarios:
# - Stub mode (FEATURE_RESEARCH_STREAMING=0)
# - Streaming mode (FEATURE_RESEARCH_STREAMING=1)
# - Content-Type validation
# - Invalid requests
# - Rate limiting
#
# Usage:
#   ./scripts/smoke.sh                           # Test local dev server
#   ENDPOINT=https://preview.vercel.app ./scripts/smoke.sh  # Test preview
#   FEATURE_RESEARCH_STREAMING=1 ./scripts/smoke.sh         # Test streaming mode
#
# Exit Codes:
#   0: All tests passed
#   1: One or more tests failed
###############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENDPOINT="${ENDPOINT:-http://localhost:3000}"
FEATURE_RESEARCH_STREAMING="${FEATURE_RESEARCH_STREAMING:-0}"
TIMEOUT="${TIMEOUT:-10}"

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

###############################################################################
# Helper Functions
###############################################################################

log_info() {
  echo -e "${BLUE}ℹ ${NC}$1"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1"
}

log_error() {
  echo -e "${RED}✗${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

test_start() {
  TESTS_RUN=$((TESTS_RUN + 1))
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  log_info "Test $TESTS_RUN: $1"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

test_pass() {
  TESTS_PASSED=$((TESTS_PASSED + 1))
  log_success "$1"
}

test_fail() {
  TESTS_FAILED=$((TESTS_FAILED + 1))
  log_error "$1"
}

assert_equals() {
  local expected="$1"
  local actual="$2"
  local message="$3"

  if [[ "$actual" == "$expected" ]]; then
    test_pass "$message: '$actual'"
  else
    test_fail "$message: expected '$expected', got '$actual'"
  fi
}

assert_not_empty() {
  local value="$1"
  local message="$2"

  if [[ -n "$value" ]]; then
    test_pass "$message"
  else
    test_fail "$message: value is empty"
  fi
}

assert_contains() {
  local haystack="$1"
  local needle="$2"
  local message="$3"

  if echo "$haystack" | grep -q "$needle"; then
    test_pass "$message"
  else
    test_fail "$message: '$haystack' does not contain '$needle'"
  fi
}

###############################################################################
# Test Cases
###############################################################################

test_valid_stub_request() {
  test_start "Valid request in stub mode (FEATURE_RESEARCH_STREAMING=0)"

  local response
  local http_code
  local content_type

  response=$(curl -s -w "\n%{http_code}\n%{content_type}" \
    -X POST "${ENDPOINT}/api/research" \
    -H "Content-Type: application/json" \
    -d '{"query":"What is the best Pokemon card to invest in?"}' \
    --max-time "$TIMEOUT")

  # Parse response
  local body
  body=$(echo "$response" | head -n -2)
  http_code=$(echo "$response" | tail -n 2 | head -n 1)
  content_type=$(echo "$response" | tail -n 1)

  # Assertions
  assert_equals "200" "$http_code" "HTTP status code"
  assert_contains "$content_type" "application/json" "Content-Type header"

  # Parse JSON fields
  local ok
  local answer
  local request_id
  ok=$(echo "$body" | jq -r '.ok // "null"')
  answer=$(echo "$body" | jq -r '.answer // "null"')
  request_id=$(echo "$body" | jq -r '.requestId // "null"')

  assert_equals "true" "$ok" "Response 'ok' field"
  assert_not_empty "$answer" "Response 'answer' field is present"
  assert_not_empty "$request_id" "Response 'requestId' field is present"
  assert_contains "$answer" "Research queued for:" "Answer contains expected stub text"
}

test_invalid_empty_query() {
  test_start "Invalid request with empty query"

  local response
  local http_code

  response=$(curl -s -w "\n%{http_code}" \
    -X POST "${ENDPOINT}/api/research" \
    -H "Content-Type: application/json" \
    -d '{"query":""}' \
    --max-time "$TIMEOUT")

  local body
  body=$(echo "$response" | head -n -1)
  http_code=$(echo "$response" | tail -n 1)

  # Assertions
  assert_equals "400" "$http_code" "HTTP status code"

  local ok
  local error
  ok=$(echo "$body" | jq -r '.ok // "null"')
  error=$(echo "$body" | jq -r '.error // "null"')

  assert_equals "false" "$ok" "Response 'ok' field"
  assert_not_empty "$error" "Error message is present"
}

test_invalid_missing_body() {
  test_start "Invalid request with missing body"

  local response
  local http_code

  response=$(curl -s -w "\n%{http_code}" \
    -X POST "${ENDPOINT}/api/research" \
    -H "Content-Type: application/json" \
    --max-time "$TIMEOUT")

  local body
  body=$(echo "$response" | head -n -1)
  http_code=$(echo "$response" | tail -n 1)

  # Assertions
  assert_equals "400" "$http_code" "HTTP status code"

  local ok
  local error
  ok=$(echo "$body" | jq -r '.ok // "null"')
  error=$(echo "$body" | jq -r '.error // "null"')

  assert_equals "false" "$ok" "Response 'ok' field"
  assert_not_empty "$error" "Error message is present"
}

test_streaming_content_type() {
  test_start "Content-Type validation (streaming mode)"

  if [[ "$FEATURE_RESEARCH_STREAMING" != "1" ]]; then
    log_warning "Skipping streaming test (FEATURE_RESEARCH_STREAMING != 1)"
    # Don't count as pass or fail, just skip
    TESTS_RUN=$((TESTS_RUN - 1))
    return 0
  fi

  local http_code
  local content_type

  # Get headers only
  local response
  response=$(curl -s -I -X POST "${ENDPOINT}/api/research" \
    -H "Content-Type: application/json" \
    -d '{"query":"test"}' \
    --max-time "$TIMEOUT")

  http_code=$(echo "$response" | grep -i "^HTTP" | awk '{print $2}')
  content_type=$(echo "$response" | grep -i "^content-type:" | awk '{print $2}' | tr -d '\r\n')

  # Assertions
  assert_equals "200" "$http_code" "HTTP status code"

  # CRITICAL: When streaming is enabled, content-type MUST be text/event-stream
  if [[ "$content_type" != *"text/event-stream"* ]]; then
    test_fail "Content-Type MUST be 'text/event-stream' when FEATURE_RESEARCH_STREAMING=1, got: '$content_type'"
    log_error "CRITICAL: Streaming mode is broken! Expected SSE, got JSON."
    return 1
  else
    test_pass "Content-Type is 'text/event-stream' as expected"
  fi
}

test_streaming_response_format() {
  test_start "Streaming response format validation"

  if [[ "$FEATURE_RESEARCH_STREAMING" != "1" ]]; then
    log_warning "Skipping streaming test (FEATURE_RESEARCH_STREAMING != 1)"
    TESTS_RUN=$((TESTS_RUN - 1))
    return 0
  fi

  local response
  response=$(curl -s -N -X POST "${ENDPOINT}/api/research" \
    -H "Content-Type: application/json" \
    -d '{"query":"Pokemon cards"}' \
    --max-time "$TIMEOUT" 2>&1 || true)

  # Check for streaming markers
  if echo "$response" | grep -q "__SOURCES__"; then
    test_pass "Response contains '__SOURCES__' marker"
  else
    test_fail "Response missing '__SOURCES__' marker (streaming may be incomplete)"
  fi

  # Should not be a JSON object if streaming
  if echo "$response" | jq -e '.ok' >/dev/null 2>&1; then
    test_fail "Response is JSON format (expected SSE streaming)"
  else
    test_pass "Response is not JSON (SSE format as expected)"
  fi
}

test_json_schema_stub() {
  test_start "JSON schema validation (stub mode)"

  local response
  response=$(curl -s -X POST "${ENDPOINT}/api/research" \
    -H "Content-Type: application/json" \
    -d '{"query":"test"}' \
    --max-time "$TIMEOUT")

  # Validate required fields exist
  local ok
  local answer
  local sources
  local request_id

  ok=$(echo "$response" | jq -r '.ok // "null"')
  answer=$(echo "$response" | jq -r '.answer // "null"')
  sources=$(echo "$response" | jq -r '.sources // "null"')
  request_id=$(echo "$response" | jq -r '.requestId // "null"')

  assert_not_empty "$ok" "Field 'ok' exists"
  assert_not_empty "$answer" "Field 'answer' exists"
  assert_not_empty "$request_id" "Field 'requestId' exists"

  # Validate types
  if echo "$response" | jq -e '.ok == true or .ok == false' >/dev/null 2>&1; then
    test_pass "Field 'ok' is boolean"
  else
    test_fail "Field 'ok' is not boolean"
  fi

  if echo "$response" | jq -e '.sources | type == "array"' >/dev/null 2>&1; then
    test_pass "Field 'sources' is array"
  else
    test_fail "Field 'sources' is not array"
  fi
}

test_endpoint_availability() {
  test_start "Endpoint availability check"

  local http_code
  http_code=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "${ENDPOINT}/api/research" \
    -H "Content-Type: application/json" \
    -d '{"query":"test"}' \
    --max-time "$TIMEOUT")

  # Should not be 404 or 502
  if [[ "$http_code" == "404" ]]; then
    test_fail "Endpoint not found (404)"
  elif [[ "$http_code" == "502" ]]; then
    test_fail "Bad gateway (502) - service down"
  elif [[ "$http_code" == "503" ]]; then
    test_fail "Service unavailable (503)"
  else
    test_pass "Endpoint is reachable (HTTP $http_code)"
  fi
}

###############################################################################
# Main Execution
###############################################################################

main() {
  echo ""
  echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║${NC}         Research API Smoke Test Suite                      ${BLUE}║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  log_info "Endpoint: $ENDPOINT"
  log_info "Streaming mode: $FEATURE_RESEARCH_STREAMING"
  log_info "Timeout: ${TIMEOUT}s"
  echo ""

  # Check dependencies
  if ! command -v curl &>/dev/null; then
    log_error "curl is required but not installed"
    exit 1
  fi

  if ! command -v jq &>/dev/null; then
    log_error "jq is required but not installed"
    exit 1
  fi

  # Run tests
  test_endpoint_availability
  test_valid_stub_request
  test_invalid_empty_query
  test_invalid_missing_body
  test_json_schema_stub

  # Streaming-specific tests (only when enabled)
  if [[ "$FEATURE_RESEARCH_STREAMING" == "1" ]]; then
    test_streaming_content_type
    test_streaming_response_format
  fi

  # Summary
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}║${NC}                         Test Summary                          ${BLUE}║${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "  Total tests run:    $TESTS_RUN"
  echo -e "  ${GREEN}Passed:${NC}             $TESTS_PASSED"
  echo -e "  ${RED}Failed:${NC}             $TESTS_FAILED"
  echo ""

  if [[ $TESTS_FAILED -eq 0 ]]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}                  ✓ All tests passed!                        ${GREEN}║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    exit 0
  else
    echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║${NC}                  ✗ Some tests failed!                       ${RED}║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    exit 1
  fi
}

# Run main function
main "$@"

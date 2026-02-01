#!/bin/bash

#######################################################################
# Integration Test: Pricing Calculation Flow
# 
# Tests the database and repository layer with real Supabase connection.
# Requires: Backend server running, valid database connection.
#######################################################################

set -e

# Configuration
BASE_URL="${API_BASE_URL:-http://localhost:3000}"
API_V1="$BASE_URL/api/v1"
TEST_EMAIL="int_test_$(date +%s)@test.aurea.com"
TEST_PASSWORD="TestPass123!"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Counters
PASSED=0
FAILED=0
SKIPPED=0

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║       AUREA Pricing Engine - Integration Tests                ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "Base URL: $BASE_URL"
echo "Test Email: $TEST_EMAIL"
echo ""

#----------------------------------------------------------------------
# Helper Functions
#----------------------------------------------------------------------

test_pass() {
  echo -e "${GREEN}✓${NC} $1"
  ((PASSED++))
}

test_fail() {
  echo -e "${RED}✗${NC} $1"
  echo -e "  ${RED}Error: $2${NC}"
  ((FAILED++))
}

test_skip() {
  echo -e "${YELLOW}○${NC} $1 (skipped: $2)"
  ((SKIPPED++))
}

check_server() {
  echo "→ Checking server availability..."
  response=$(curl -s -o /dev/null -w "%{http_code}" "$API_V1/health" 2>/dev/null || echo "000")
  if [ "$response" = "200" ]; then
    test_pass "Server is running"
    return 0
  else
    test_fail "Server not responding" "HTTP $response"
    return 1
  fi
}

#----------------------------------------------------------------------
# Test: Database Connection
#----------------------------------------------------------------------

test_database_connection() {
  echo ""
  echo "━━━ Test: Database Connection ━━━"
  
  # Health endpoint should confirm DB connection
  response=$(curl -s "$API_V1/health")
  status=$(echo "$response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
  
  if [ "$status" = "healthy" ]; then
    test_pass "Database connection healthy"
  else
    test_fail "Database connection issue" "$response"
  fi
}

#----------------------------------------------------------------------
# Test: User Creation Flow
#----------------------------------------------------------------------

test_user_creation() {
  echo ""
  echo "━━━ Test: User Creation ━━━"
  
  # Create user
  response=$(curl -s -X POST "$BASE_URL/signup" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$TEST_EMAIL\",
      \"password\": \"$TEST_PASSWORD\",
      \"first_name\": \"Integration\",
      \"last_name\": \"Test\"
    }")
  
  # Check if user created or already exists
  if echo "$response" | grep -q '"user_id"'; then
    USER_ID=$(echo "$response" | grep -o '"user_id":[0-9]*' | cut -d':' -f2)
    test_pass "User created (ID: $USER_ID)"
    
    # Get OTP from response for verification
    OTP=$(echo "$response" | grep -o '"otp":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$OTP" ]; then
      echo "  → OTP received: $OTP"
    fi
  elif echo "$response" | grep -q "already exists"; then
    test_skip "User creation" "User already exists"
  else
    test_fail "User creation" "$response"
  fi
}

#----------------------------------------------------------------------
# Test: Onboarding Session
#----------------------------------------------------------------------

test_onboarding_session() {
  echo ""
  echo "━━━ Test: Onboarding Session ━━━"
  
  # This requires auth token, skip if not available
  if [ -z "$AUTH_TOKEN" ]; then
    test_skip "Onboarding session" "No auth token"
    return
  fi
  
  response=$(curl -s -X POST "$BASE_URL/onboarding/start" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN")
  
  if echo "$response" | grep -q '"session_id"'; then
    SESSION_ID=$(echo "$response" | grep -o '"session_id":"[^"]*"' | cut -d'"' -f4)
    test_pass "Onboarding session created (ID: $SESSION_ID)"
  else
    test_fail "Onboarding session" "$response"
  fi
}

#----------------------------------------------------------------------
# Test: Pricing Profile Repository
#----------------------------------------------------------------------

test_pricing_profile_operations() {
  echo ""
  echo "━━━ Test: Pricing Profile Operations ━━━"
  
  if [ -z "$AUTH_TOKEN" ]; then
    test_skip "Pricing profile operations" "No auth token"
    return
  fi
  
  # Get profile
  response=$(curl -s -X GET "$API_V1/pricing/profile" \
    -H "Authorization: Bearer $AUTH_TOKEN")
  
  if echo "$response" | grep -q '"pricing_profile_id"\|"base_hourly_rate"'; then
    test_pass "Pricing profile retrieved"
  elif echo "$response" | grep -q "not found\|No pricing profile"; then
    test_pass "Pricing profile not found (expected for new user)"
  else
    test_fail "Get pricing profile" "$response"
  fi
}

#----------------------------------------------------------------------
# Test: Market Benchmark Repository
#----------------------------------------------------------------------

test_market_benchmark() {
  echo ""
  echo "━━━ Test: Market Benchmark ━━━"
  
  if [ -z "$AUTH_TOKEN" ]; then
    test_skip "Market benchmark" "No auth token"
    return
  fi
  
  response=$(curl -s -X GET "$API_V1/pricing/benchmark" \
    -H "Authorization: Bearer $AUTH_TOKEN")
  
  if echo "$response" | grep -q '"min_rate"\|"max_rate"\|"median_rate"'; then
    test_pass "Market benchmark data retrieved"
  elif echo "$response" | grep -q "No pricing profile"; then
    test_pass "Benchmark requires profile (expected)"
  else
    test_fail "Market benchmark" "$response"
  fi
}

#----------------------------------------------------------------------
# Test: Rate Calculation with Real Data
#----------------------------------------------------------------------

test_rate_calculation() {
  echo ""
  echo "━━━ Test: Rate Calculation ━━━"
  
  if [ -z "$AUTH_TOKEN" ]; then
    test_skip "Rate calculation" "No auth token"
    return
  fi
  
  # Calculate base rate
  response=$(curl -s -X POST "$API_V1/pricing/calculate/base-rate" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d '{}')
  
  if echo "$response" | grep -q '"base_hourly_rate"'; then
    rate=$(echo "$response" | grep -o '"base_hourly_rate":[0-9.]*' | cut -d':' -f2)
    test_pass "Base rate calculated: \$$rate/hr"
  elif echo "$response" | grep -q "No pricing profile\|complete onboarding"; then
    test_pass "Base rate requires onboarding (expected)"
  else
    test_fail "Base rate calculation" "$response"
  fi
}

#----------------------------------------------------------------------
# Test: Data Persistence
#----------------------------------------------------------------------

test_data_persistence() {
  echo ""
  echo "━━━ Test: Data Persistence ━━━"
  
  if [ -z "$AUTH_TOKEN" ]; then
    test_skip "Data persistence" "No auth token"
    return
  fi
  
  # Update profile
  response=$(curl -s -X PUT "$API_V1/pricing/profile" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d '{
      "profit_margin": 0.18,
      "billable_hours_per_month": 110
    }')
  
  if echo "$response" | grep -q '"profit_margin"\|updated'; then
    test_pass "Profile update persisted"
    
    # Verify persistence by re-reading
    verify=$(curl -s -X GET "$API_V1/pricing/profile" \
      -H "Authorization: Bearer $AUTH_TOKEN")
    
    if echo "$verify" | grep -q '0.18\|110'; then
      test_pass "Data verified after re-read"
    else
      test_fail "Data verification" "Values not persisted correctly"
    fi
  elif echo "$response" | grep -q "No pricing profile"; then
    test_skip "Profile update" "No profile exists"
  else
    test_fail "Profile update" "$response"
  fi
}

#----------------------------------------------------------------------
# Main Execution
#----------------------------------------------------------------------

main() {
  # Check server first
  if ! check_server; then
    echo ""
    echo -e "${RED}Cannot run integration tests - server not available${NC}"
    echo "Start the server with: npm run dev"
    exit 1
  fi
  
  # Run tests
  test_database_connection
  test_user_creation
  test_onboarding_session
  test_pricing_profile_operations
  test_market_benchmark
  test_rate_calculation
  test_data_persistence
  
  # Summary
  echo ""
  echo "═══════════════════════════════════════════════════════════════"
  echo "                    Integration Test Summary"
  echo "═══════════════════════════════════════════════════════════════"
  echo -e "  ${GREEN}Passed:${NC}  $PASSED"
  echo -e "  ${RED}Failed:${NC}  $FAILED"
  echo -e "  ${YELLOW}Skipped:${NC} $SKIPPED"
  echo ""
  
  if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Integration tests failed!${NC}"
    exit 1
  else
    echo -e "${GREEN}Integration tests passed!${NC}"
    exit 0
  fi
}

main "$@"

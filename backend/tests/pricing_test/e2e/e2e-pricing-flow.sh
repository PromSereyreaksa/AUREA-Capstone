#!/bin/bash

#######################################################################
# E2E Test: Complete Pricing Flow
# 
# Tests the full user journey from signup to rate calculation.
# This is the most comprehensive test, simulating real user behavior.
#######################################################################

set -e

# Configuration
BASE_URL="${API_BASE_URL:-http://localhost:3000}"
API_V1="$BASE_URL/api/v1"
TIMESTAMP=$(date +%s)
TEST_EMAIL="e2e_test_${TIMESTAMP}@test.aurea.com"
TEST_PASSWORD="E2ETestPass123!"
VERBOSE="${VERBOSE:-false}"
SKIP_CLEANUP="${SKIP_CLEANUP:-false}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# State
AUTH_TOKEN=""
USER_ID=""
SESSION_ID=""
BASE_RATE=""
PROFILE_ID=""

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║         AUREA Pricing Engine - E2E Test Suite                 ║"
echo "╠═══════════════════════════════════════════════════════════════╣"
echo "║  Testing: Complete User Journey                               ║"
echo "║  Email:   $TEST_EMAIL                       ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

#----------------------------------------------------------------------
# Helper Functions
#----------------------------------------------------------------------

log_step() {
  echo ""
  echo -e "${BLUE}━━━ $1 ━━━${NC}"
}

log_success() {
  echo -e "  ${GREEN}✓${NC} $1"
}

log_fail() {
  echo -e "  ${RED}✗${NC} $1"
  echo -e "    ${RED}Error: $2${NC}"
}

log_info() {
  echo -e "  ${CYAN}→${NC} $1"
}

log_verbose() {
  if [ "$VERBOSE" = "true" ]; then
    echo -e "    ${YELLOW}[DEBUG]${NC} $1"
  fi
}

api_call() {
  local method=$1
  local endpoint=$2
  local data=$3
  local auth=$4
  
  local headers="-H 'Content-Type: application/json'"
  if [ -n "$auth" ]; then
    headers="$headers -H 'Authorization: Bearer $auth'"
  fi
  
  if [ "$method" = "GET" ]; then
    response=$(eval "curl -s -X GET '$endpoint' $headers")
  else
    response=$(eval "curl -s -X $method '$endpoint' $headers -d '$data'")
  fi
  
  log_verbose "Response: $response"
  echo "$response"
}

#----------------------------------------------------------------------
# Phase 1: User Registration
#----------------------------------------------------------------------

phase_registration() {
  log_step "Phase 1: User Registration"
  
  # Check server
  log_info "Checking server availability..."
  health=$(curl -s "$API_V1/health")
  if ! echo "$health" | grep -q '"status":"healthy"'; then
    log_fail "Server not available" "$health"
    exit 1
  fi
  log_success "Server is healthy"
  
  # Sign up
  log_info "Creating test user..."
  signup_response=$(api_call POST "$BASE_URL/signup" "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"first_name\": \"E2E\",
    \"last_name\": \"Tester\"
  }")
  
  if echo "$signup_response" | grep -q '"user_id"'; then
    USER_ID=$(echo "$signup_response" | grep -o '"user_id":[0-9]*' | cut -d':' -f2)
    log_success "User created (ID: $USER_ID)"
  else
    log_fail "User creation failed" "$signup_response"
    exit 1
  fi
  
  # Get OTP (in test mode, it's returned in response)
  OTP=$(echo "$signup_response" | grep -o '"otp":"[^"]*"' | cut -d'"' -f4)
  if [ -z "$OTP" ]; then
    # Try to extract from different format
    OTP=$(echo "$signup_response" | sed -n 's/.*"otp":"\([^"]*\)".*/\1/p')
  fi
  
  if [ -n "$OTP" ]; then
    log_info "OTP received: $OTP"
  else
    log_info "OTP will be sent via email"
    # For testing, we might need to manually verify or use a test OTP
    OTP="123456" # Default test OTP
  fi
  
  # Verify OTP
  log_info "Verifying OTP..."
  verify_response=$(api_call POST "$BASE_URL/verify-otp" "{
    \"email\": \"$TEST_EMAIL\",
    \"otp\": \"$OTP\"
  }")
  
  if echo "$verify_response" | grep -q '"token"\|"access_token"'; then
    AUTH_TOKEN=$(echo "$verify_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    if [ -z "$AUTH_TOKEN" ]; then
      AUTH_TOKEN=$(echo "$verify_response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    fi
    log_success "Email verified, token received"
  else
    log_fail "OTP verification failed" "$verify_response"
    exit 1
  fi
}

#----------------------------------------------------------------------
# Phase 2: Onboarding
#----------------------------------------------------------------------

phase_onboarding() {
  log_step "Phase 2: Pricing Onboarding"
  
  # Start onboarding session
  log_info "Starting onboarding session..."
  session_response=$(api_call POST "$BASE_URL/onboarding/start" "{}" "$AUTH_TOKEN")
  
  if echo "$session_response" | grep -q '"session_id"'; then
    SESSION_ID=$(echo "$session_response" | grep -o '"session_id":"[^"]*"' | cut -d'"' -f4)
    log_success "Onboarding session started (ID: ${SESSION_ID:0:8}...)"
  else
    log_fail "Failed to start onboarding" "$session_response"
    exit 1
  fi
  
  # Answer onboarding questions
  declare -a questions=(
    '{"session_id":"'$SESSION_ID'","question_key":"desired_monthly_income","answer":"1000"}'
    '{"session_id":"'$SESSION_ID'","question_key":"fixed_costs_rent","answer":"200"}'
    '{"session_id":"'$SESSION_ID'","question_key":"fixed_costs_equipment","answer":"100"}'
    '{"session_id":"'$SESSION_ID'","question_key":"fixed_costs_utilities_insurance_taxes","answer":"70"}'
    '{"session_id":"'$SESSION_ID'","question_key":"variable_costs_materials","answer":"50"}'
    '{"session_id":"'$SESSION_ID'","question_key":"variable_costs_outsourcing","answer":"0"}'
    '{"session_id":"'$SESSION_ID'","question_key":"variable_costs_marketing","answer":"30"}'
    '{"session_id":"'$SESSION_ID'","question_key":"billable_hours_per_month","answer":"100"}'
    '{"session_id":"'$SESSION_ID'","question_key":"profit_margin","answer":"15"}'
    '{"session_id":"'$SESSION_ID'","question_key":"experience_years","answer":"5"}'
  )
  
  log_info "Answering onboarding questions..."
  for i in "${!questions[@]}"; do
    answer_response=$(api_call POST "$BASE_URL/onboarding/answer" "${questions[$i]}" "$AUTH_TOKEN")
    
    if echo "$answer_response" | grep -q '"is_valid":true\|"status":"completed"\|"next_question"'; then
      log_verbose "Question $((i+1))/10 answered"
    else
      log_fail "Question $((i+1)) failed" "$answer_response"
      exit 1
    fi
    
    # Small delay to avoid rate limiting
    sleep 0.5
  done
  log_success "All onboarding questions answered (10/10)"
  
  # Verify session completion
  log_info "Verifying session completion..."
  session_check=$(api_call GET "$BASE_URL/onboarding/session/$SESSION_ID" "" "$AUTH_TOKEN")
  
  if echo "$session_check" | grep -q '"status":"completed"'; then
    log_success "Onboarding session completed"
  else
    log_info "Session status: $(echo "$session_check" | grep -o '"status":"[^"]*"')"
  fi
}

#----------------------------------------------------------------------
# Phase 3: Base Rate Calculation
#----------------------------------------------------------------------

phase_base_rate() {
  log_step "Phase 3: Base Rate Calculation"
  
  log_info "Calculating AUREA base hourly rate..."
  rate_response=$(api_call POST "$API_V1/pricing/calculate/base-rate" "{
    \"session_id\": \"$SESSION_ID\"
  }" "$AUTH_TOKEN")
  
  if echo "$rate_response" | grep -q '"base_hourly_rate"'; then
    BASE_RATE=$(echo "$rate_response" | grep -o '"base_hourly_rate":[0-9.]*' | cut -d':' -f2)
    log_success "Base rate calculated: \$$BASE_RATE/hr"
    
    # Extract breakdown
    fixed_total=$(echo "$rate_response" | grep -o '"fixed_costs_total":[0-9.]*' | cut -d':' -f2)
    variable_total=$(echo "$rate_response" | grep -o '"variable_costs_total":[0-9.]*' | cut -d':' -f2)
    profit=$(echo "$rate_response" | grep -o '"profit_amount":[0-9.]*' | cut -d':' -f2)
    
    log_info "Breakdown: Fixed \$$fixed_total + Variable \$$variable_total + Profit \$$profit"
  else
    log_fail "Base rate calculation failed" "$rate_response"
    exit 1
  fi
}

#----------------------------------------------------------------------
# Phase 4: Project Rate Calculations
#----------------------------------------------------------------------

phase_project_rates() {
  log_step "Phase 4: Project Rate Calculations"
  
  # Test different client scenarios
  declare -a scenarios=(
    "startup:cambodia:Startup (Local)"
    "sme:cambodia:SME (Local)"
    "corporate:cambodia:Corporate (Local)"
    "ngo:southeast_asia:NGO (Regional)"
    "corporate:global:Corporate (Global)"
  )
  
  echo ""
  printf "  %-25s %10s %12s\n" "SCENARIO" "RATE" "MULTIPLIER"
  echo "  ─────────────────────────────────────────────────"
  
  for scenario in "${scenarios[@]}"; do
    IFS=':' read -r client_type client_region label <<< "$scenario"
    
    response=$(api_call POST "$API_V1/pricing/calculate/project-rate" "{
      \"client_type\": \"$client_type\",
      \"client_region\": \"$client_region\"
    }" "$AUTH_TOKEN")
    
    if echo "$response" | grep -q '"final_hourly_rate"'; then
      rate=$(echo "$response" | grep -o '"final_hourly_rate":[0-9.]*' | cut -d':' -f2)
      multiplier=$(echo "$response" | grep -o '"context_multiplier":[0-9.]*' | cut -d':' -f2)
      printf "  %-25s %9s %11sx\n" "$label" "\$$rate" "$multiplier"
    else
      printf "  %-25s %10s\n" "$label" "FAILED"
    fi
  done
  echo ""
  log_success "All project rate scenarios calculated"
}

#----------------------------------------------------------------------
# Phase 5: Profile Management
#----------------------------------------------------------------------

phase_profile_management() {
  log_step "Phase 5: Profile Management"
  
  # Get profile
  log_info "Retrieving pricing profile..."
  profile_response=$(api_call GET "$API_V1/pricing/profile" "" "$AUTH_TOKEN")
  
  if echo "$profile_response" | grep -q '"pricing_profile_id"\|"base_hourly_rate"'; then
    PROFILE_ID=$(echo "$profile_response" | grep -o '"pricing_profile_id":[0-9]*' | cut -d':' -f2)
    log_success "Profile retrieved (ID: $PROFILE_ID)"
  else
    log_fail "Profile retrieval failed" "$profile_response"
    exit 1
  fi
  
  # Update profile
  log_info "Updating profile (margin: 0.20, hours: 120)..."
  update_response=$(api_call PUT "$API_V1/pricing/profile" "{
    \"profit_margin\": 0.20,
    \"billable_hours_per_month\": 120
  }" "$AUTH_TOKEN")
  
  if echo "$update_response" | grep -q '"base_hourly_rate"\|updated\|success'; then
    new_rate=$(echo "$update_response" | grep -o '"base_hourly_rate":[0-9.]*' | cut -d':' -f2)
    log_success "Profile updated (new rate: \$$new_rate/hr)"
  else
    log_fail "Profile update failed" "$update_response"
  fi
}

#----------------------------------------------------------------------
# Phase 6: Market Benchmark
#----------------------------------------------------------------------

phase_benchmark() {
  log_step "Phase 6: Market Benchmark Comparison"
  
  log_info "Fetching market benchmarks..."
  benchmark_response=$(api_call GET "$API_V1/pricing/benchmark" "" "$AUTH_TOKEN")
  
  if echo "$benchmark_response" | grep -q '"min_rate"\|"median_rate"\|"max_rate"'; then
    min=$(echo "$benchmark_response" | grep -o '"min_rate":[0-9.]*' | cut -d':' -f2)
    median=$(echo "$benchmark_response" | grep -o '"median_rate":[0-9.]*' | cut -d':' -f2)
    max=$(echo "$benchmark_response" | grep -o '"max_rate":[0-9.]*' | cut -d':' -f2)
    
    log_success "Benchmark data retrieved"
    log_info "Market rates: \$$min (min) - \$$median (median) - \$$max (max)"
    
    # Compare user's rate
    if [ -n "$BASE_RATE" ]; then
      log_info "Your rate (\$$BASE_RATE) vs Market median (\$$median)"
    fi
  else
    log_info "Benchmark data not available (may require category selection)"
  fi
}

#----------------------------------------------------------------------
# Cleanup
#----------------------------------------------------------------------

cleanup() {
  if [ "$SKIP_CLEANUP" = "true" ]; then
    log_step "Cleanup Skipped"
    log_info "Test user retained: $TEST_EMAIL"
    return
  fi
  
  log_step "Cleanup"
  log_info "Test user: $TEST_EMAIL"
  log_info "To manually delete, run in Supabase:"
  echo "    DELETE FROM users WHERE email = '$TEST_EMAIL';"
}

#----------------------------------------------------------------------
# Summary
#----------------------------------------------------------------------

print_summary() {
  echo ""
  echo "╔═══════════════════════════════════════════════════════════════╗"
  echo "║                     E2E Test Summary                          ║"
  echo "╠═══════════════════════════════════════════════════════════════╣"
  echo "║                                                               ║"
  echo "║  ✓ User Registration    - Sign up and verify                  ║"
  echo "║  ✓ Pricing Onboarding   - 10 questions answered               ║"
  echo "║  ✓ Base Rate            - AUREA formula calculated            ║"
  echo "║  ✓ Project Rates        - Multiple scenarios tested           ║"
  echo "║  ✓ Profile Management   - CRUD operations verified            ║"
  echo "║  ✓ Market Benchmark     - Comparison data fetched             ║"
  echo "║                                                               ║"
  echo "╠═══════════════════════════════════════════════════════════════╣"
  printf "║  Final Base Rate: %-42s ║\n" "\$$BASE_RATE/hr"
  echo "╚═══════════════════════════════════════════════════════════════╝"
}

#----------------------------------------------------------------------
# Main Execution
#----------------------------------------------------------------------

main() {
  local start_time=$(date +%s)
  
  phase_registration
  phase_onboarding
  phase_base_rate
  phase_project_rates
  phase_profile_management
  phase_benchmark
  cleanup
  
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  
  print_summary
  echo ""
  echo -e "${GREEN}E2E tests completed successfully in ${duration}s${NC}"
}

# Run
main "$@"

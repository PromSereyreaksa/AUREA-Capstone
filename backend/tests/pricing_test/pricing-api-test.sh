#!/bin/bash

# AAUREA Pricing Calculator API Test Script
# Tests the complete AUREA onboarding flow and pricing calculations

# Don't use set -e as it interferes with arithmetic operations and test flow
# We handle errors explicitly instead

BASE_URL="${API_BASE_URL:-http://localhost:3000/api/v1}"
TEST_EMAIL="pricing_test_$(date +%s)@test.com"
TEST_PASSWORD="TestPassword123!"

# Track test results
TESTS_PASSED=0
TESTS_FAILED=0
FAILED_TESTS=()

echo "╔══════════════════════════════════════════════╗"
echo "║   AAUREA Pricing Calculator API Tests         ║"
echo "║   AUREA Framework Integration                 ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "Base URL: $BASE_URL"
echo "Test Email: $TEST_EMAIL"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print success
success() {
    echo -e "${GREEN}✓ $1${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

# Function to print error (non-fatal)
fail() {
    echo -e "${RED}✗ $1${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    FAILED_TESTS+=("$1")
}

# Function to print info
info() {
    echo -e "${YELLOW}→ $1${NC}"
}

# Function to print section header
section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Check if server is running
check_server() {
    info "Checking if server is running..."
    if ! curl -s "$BASE_URL/health" > /dev/null 2>&1; then
        echo -e "${RED}Error: Server is not running at $BASE_URL${NC}"
        echo "Please start the server with: npm run dev"
        exit 1
    fi
    success "Server is running"
}

# ============================================
# SECTION 1: Authentication Setup
# ============================================
section "1. AUTHENTICATION SETUP"

check_server

# Test 1.1: Sign up a new user
info "Test 1.1: Signing up new user..."
SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/users/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"user_name\": \"Pricing Test User\",
    \"role\": \"designer\"
  }" 2>/dev/null || echo '{"success":false}')

if echo "$SIGNUP_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    USER_ID=$(echo "$SIGNUP_RESPONSE" | jq -r '.data.user.user_id // .data.user_id // .data.userId // empty')
    # Get the OTP from the signup response (for testing purposes)
    SIGNUP_OTP=$(echo "$SIGNUP_RESPONSE" | jq -r '.data.otp // empty')
    if [ -n "$USER_ID" ]; then
        success "User signed up (ID: $USER_ID)"
        if [ -n "$SIGNUP_OTP" ]; then
            info "OTP received: $SIGNUP_OTP"
        fi
    else
        fail "Test 1.1: User ID not returned"
        echo "$SIGNUP_RESPONSE" | jq '.' 2>/dev/null || echo "$SIGNUP_RESPONSE"
    fi
else
    fail "Test 1.1: Failed to sign up user"
    echo "$SIGNUP_RESPONSE" | jq '.' 2>/dev/null || echo "$SIGNUP_RESPONSE"
fi

# Test 1.2: Verify OTP
# Use the OTP from signup response, or fallback to test OTP
OTP_TO_USE="${SIGNUP_OTP:-123456}"
info "Test 1.2: Verifying OTP (using OTP: $OTP_TO_USE)..."
VERIFY_RESPONSE=$(curl -s -X POST "$BASE_URL/users/verify-otp" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"otp\": \"$OTP_TO_USE\"
  }" 2>/dev/null || echo '{"success":false}')

if echo "$VERIFY_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    AUTH_TOKEN=$(echo "$VERIFY_RESPONSE" | jq -r '.data.token // empty')
    if [ -n "$AUTH_TOKEN" ]; then
        success "OTP verified, token received"
    else
        fail "Test 1.2: Token not returned"
    fi
else
    fail "Test 1.2: Failed to verify OTP"
    echo "$VERIFY_RESPONSE" | jq '.' 2>/dev/null || echo "$VERIFY_RESPONSE"
fi

# Exit if no auth token (can't continue tests)
if [ -z "$AUTH_TOKEN" ]; then
    echo -e "${RED}Cannot continue without authentication. Exiting.${NC}"
    exit 1
fi

# ============================================
# SECTION 2: Pricing Onboarding Flow
# ============================================
section "2. PRICING ONBOARDING FLOW"

# Test 2.1: Start pricing onboarding
info "Test 2.1: Starting pricing onboarding..."
ONBOARDING_RESPONSE=$(curl -s -X POST "$BASE_URL/pricing/onboarding/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{\"user_id\": $USER_ID}" 2>/dev/null || echo '{"success":false}')

if echo "$ONBOARDING_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    SESSION_ID=$(echo "$ONBOARDING_RESPONSE" | jq -r '.data.session_id // empty')
    FIRST_QUESTION=$(echo "$ONBOARDING_RESPONSE" | jq -r '.data.first_question // .data.current_question.question_text // "N/A"')
    if [ -n "$SESSION_ID" ]; then
        success "Onboarding started (Session: ${SESSION_ID:0:8}...)"
        info "First question: $FIRST_QUESTION"
    else
        fail "Test 2.1: Session ID not returned"
    fi
else
    fail "Test 2.1: Failed to start onboarding"
    echo "$ONBOARDING_RESPONSE" | jq '.' 2>/dev/null || echo "$ONBOARDING_RESPONSE"
fi

# Test 2.2: Answer onboarding questions
info "Test 2.2: Answering onboarding questions..."

# Answers for the 10 AUREA onboarding questions
# Order matches OnboardingSession.createDefaultQuestions():
declare -A ANSWERS=(
    [1]="150"       # Monthly rent/office costs (USD)
    [2]="150"       # Equipment, software, subscriptions (USD)
    [3]="70"       # Utilities, insurance, taxes (USD)
    [4]="50"        # Materials per project (USD)
    [5]="800"      # Desired monthly income (USD)
    [6]="100"       # Billable hours per month
    [7]="0.15"      # Profit margin (15%)
    [8]="2"         # Years of experience
    [9]="Logo Design"  # Skills (comma-separated services)
    [10]="mid"   # Seniority level (junior|mid|senior|expert)
)

ONBOARDING_COMPLETE=false
for i in {1..10}; do
    ANSWER="${ANSWERS[$i]}"
    
    ANSWER_RESPONSE=$(curl -s -X POST "$BASE_URL/pricing/onboarding/answer" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -d "{
        \"session_id\": \"$SESSION_ID\",
        \"answer\": \"$ANSWER\"
      }" 2>/dev/null || echo '{"success":false}')
    
    if echo "$ANSWER_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        IS_VALID=$(echo "$ANSWER_RESPONSE" | jq -r '.data.is_valid // true')
        IS_COMPLETE=$(echo "$ANSWER_RESPONSE" | jq -r '.data.onboarding_complete // .data.is_complete // false')
        
        if [ "$IS_VALID" = "false" ]; then
            VALIDATION_ERROR=$(echo "$ANSWER_RESPONSE" | jq -r '.data.validation_error // "Unknown error"')
            info "  Q$i: Answer '$ANSWER' invalid - $VALIDATION_ERROR"
        else
            echo -e "  ${GREEN}Q$i:${NC} Answered with '$ANSWER'"
        fi
        
        if [ "$IS_COMPLETE" = "true" ]; then
            ONBOARDING_COMPLETE=true
            success "All questions answered - Onboarding complete!"
            break
        fi
    else
        fail "Test 2.2: Failed to answer question $i"
        echo "$ANSWER_RESPONSE" | jq '.' 2>/dev/null || echo "$ANSWER_RESPONSE"
        break
    fi
    
    sleep 0.5
done

if [ "$ONBOARDING_COMPLETE" = "true" ]; then
    success "Test 2.2: Onboarding flow completed"
else
    info "Onboarding may have partial completion (expected 10 questions)"
fi

# Test 2.3: Get session status
info "Test 2.3: Checking session status..."
SESSION_RESPONSE=$(curl -s -X GET "$BASE_URL/pricing/onboarding/session/$SESSION_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN" 2>/dev/null || echo '{"success":false}')

if echo "$SESSION_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    STATUS=$(echo "$SESSION_RESPONSE" | jq -r '.data.status // "unknown"')
    PROGRESS=$(echo "$SESSION_RESPONSE" | jq -r '.data.progress.percentage // 0')
    success "Session status: $STATUS (${PROGRESS}% complete)"
else
    fail "Test 2.3: Failed to get session status"
fi

# ============================================
# SECTION 3: Rate Calculations
# ============================================
section "3. AUREA RATE CALCULATIONS"

# Test 3.1: Calculate base rate
info "Test 3.1: Calculating AUREA base hourly rate..."
BASE_RATE_RESPONSE=$(curl -s -X POST "$BASE_URL/pricing/calculate/base-rate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{
    \"user_id\": $USER_ID,
    \"session_id\": \"$SESSION_ID\"
  }" 2>/dev/null || echo '{"success":false}')

if echo "$BASE_RATE_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    BASE_RATE=$(echo "$BASE_RATE_RESPONSE" | jq -r '.data.base_hourly_rate // 0')
    CREATED=$(echo "$BASE_RATE_RESPONSE" | jq -r '.data.created_profile // false')
    
    if [ "$BASE_RATE" != "0" ] && [ "$BASE_RATE" != "null" ]; then
        success "Base rate calculated: \$${BASE_RATE}/hr (Profile created: $CREATED)"
        
        # Show breakdown if available
        FIXED_COSTS=$(echo "$BASE_RATE_RESPONSE" | jq -r '.data.breakdown.fixed_costs_total // "N/A"')
        TOTAL_REQUIRED=$(echo "$BASE_RATE_RESPONSE" | jq -r '.data.breakdown.total_required // "N/A"')
        info "  Fixed costs: \$$FIXED_COSTS | Total required: \$$TOTAL_REQUIRED"
    else
        fail "Test 3.1: Base rate is zero or null"
    fi
else
    fail "Test 3.1: Failed to calculate base rate"
    echo "$BASE_RATE_RESPONSE" | jq '.' 2>/dev/null || echo "$BASE_RATE_RESPONSE"
fi

# Test 3.2: Calculate project rate with client context
info "Test 3.2: Calculating project rate (SME client in Cambodia)..."
PROJECT_RATE_RESPONSE=$(curl -s -X POST "$BASE_URL/pricing/calculate/project-rate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{
    \"user_id\": $USER_ID,
    \"client_type\": \"sme\",
    \"client_region\": \"cambodia\"
  }" 2>/dev/null || echo '{"success":false}')

if echo "$PROJECT_RATE_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    FINAL_RATE=$(echo "$PROJECT_RATE_RESPONSE" | jq -r '.data.final_hourly_rate // 0')
    SENIORITY_MULT=$(echo "$PROJECT_RATE_RESPONSE" | jq -r '.data.seniority_multiplier // 1')
    CONTEXT_MULT=$(echo "$PROJECT_RATE_RESPONSE" | jq -r '.data.context_multiplier // 1')
    MONTHLY_REV=$(echo "$PROJECT_RATE_RESPONSE" | jq -r '.data.monthly_revenue_estimate // 0')
    
    success "Project rate: \$${FINAL_RATE}/hr"
    info "  Seniority: ${SENIORITY_MULT}x | Context: ${CONTEXT_MULT}x | Monthly: \$$MONTHLY_REV"
else
    fail "Test 3.2: Failed to calculate project rate"
    echo "$PROJECT_RATE_RESPONSE" | jq '.' 2>/dev/null || echo "$PROJECT_RATE_RESPONSE"
fi

# Test 3.3: Test different client scenarios
info "Test 3.3: Testing multiple client scenarios..."

declare -A CLIENT_SCENARIOS=(
    ["startup:cambodia"]="Startup in Cambodia"
    ["corporate:southeast_asia"]="Corporate in SE Asia"
    ["government:cambodia"]="Government in Cambodia"
    ["ngo:global"]="NGO Global"
)

echo ""
printf "  %-25s %12s %12s\n" "SCENARIO" "RATE" "MULTIPLIER"
printf "  %-25s %12s %12s\n" "-------------------------" "------------" "------------"

for scenario in "${!CLIENT_SCENARIOS[@]}"; do
    IFS=':' read -r CLIENT_TYPE CLIENT_REGION <<< "$scenario"
    LABEL="${CLIENT_SCENARIOS[$scenario]}"
    
    SCENARIO_RESPONSE=$(curl -s -X POST "$BASE_URL/pricing/calculate/project-rate" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -d "{
        \"user_id\": $USER_ID,
        \"client_type\": \"$CLIENT_TYPE\",
        \"client_region\": \"$CLIENT_REGION\"
      }" 2>/dev/null || echo '{"success":false}')
    
    if echo "$SCENARIO_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        RATE=$(echo "$SCENARIO_RESPONSE" | jq -r '.data.final_hourly_rate // 0')
        MULT=$(echo "$SCENARIO_RESPONSE" | jq -r '.data.context_multiplier // 1')
        printf "  %-25s %12s %12s\n" "$LABEL" "\$$RATE/hr" "${MULT}x"
    else
        printf "  %-25s %12s %12s\n" "$LABEL" "FAILED" "-"
    fi
done
echo ""
success "Test 3.3: Client scenarios tested"

# ============================================
# SECTION 4: Market Benchmarks
# ============================================
section "4. MARKET BENCHMARKS"

# Test 4.1: Get market benchmarks
info "Test 4.1: Fetching Cambodia market benchmarks..."
BENCHMARK_RESPONSE=$(curl -s -X GET "$BASE_URL/pricing/benchmark?user_id=$USER_ID&seniority_level=senior" \
  -H "Authorization: Bearer $AUTH_TOKEN" 2>/dev/null || echo '{"success":false}')

if echo "$BENCHMARK_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    HAS_PROFILE=$(echo "$BENCHMARK_RESPONSE" | jq -r '.data.has_pricing_profile // false')
    POSITION=$(echo "$BENCHMARK_RESPONSE" | jq -r '.data.market_analysis.your_position_summary // "N/A"')
    AVG_MEDIAN=$(echo "$BENCHMARK_RESPONSE" | jq -r '.data.market_analysis.average_median_rate // "N/A"')
    BENCHMARK_COUNT=$(echo "$BENCHMARK_RESPONSE" | jq -r '.data.benchmarks | length // 0')
    
    success "Market benchmarks retrieved ($BENCHMARK_COUNT categories)"
    info "  Average median: \$$AVG_MEDIAN/hr | Position: $POSITION"
else
    fail "Test 4.1: Failed to get market benchmarks"
    echo "$BENCHMARK_RESPONSE" | jq '.' 2>/dev/null || echo "$BENCHMARK_RESPONSE"
fi

# ============================================
# SECTION 5: Profile Management
# ============================================
section "5. PROFILE MANAGEMENT"

# Test 5.1: Get pricing profile
info "Test 5.1: Retrieving pricing profile..."
PROFILE_RESPONSE=$(curl -s -X GET "$BASE_URL/pricing/profile?user_id=$USER_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN" 2>/dev/null || echo '{"success":false}')

if echo "$PROFILE_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    PROFILE_RATE=$(echo "$PROFILE_RESPONSE" | jq -r '.data.base_hourly_rate // 0')
    HOURS=$(echo "$PROFILE_RESPONSE" | jq -r '.data.billable_hours_per_month // 0')
    MARGIN=$(echo "$PROFILE_RESPONSE" | jq -r '.data.profit_margin // 0')
    
    success "Pricing profile retrieved"
    info "  Rate: \$$PROFILE_RATE/hr | Hours: $HOURS/mo | Margin: ${MARGIN}"
else
    fail "Test 5.1: Failed to get pricing profile"
fi

# Test 5.2: Update pricing profile
info "Test 5.2: Updating pricing profile..."
UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/pricing/profile?user_id=$USER_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{
    \"profit_margin\": 0.20,
    \"billable_hours_per_month\": 120
  }" 2>/dev/null || echo '{"success":false}')

if echo "$UPDATE_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    NEW_MARGIN=$(echo "$UPDATE_RESPONSE" | jq -r '.data.profit_margin // 0')
    NEW_HOURS=$(echo "$UPDATE_RESPONSE" | jq -r '.data.billable_hours_per_month // 0')
    success "Profile updated (margin: $NEW_MARGIN, hours: $NEW_HOURS)"
else
    fail "Test 5.2: Failed to update pricing profile"
    echo "$UPDATE_RESPONSE" | jq '.' 2>/dev/null || echo "$UPDATE_RESPONSE"
fi

# ============================================
# SECTION 6: Validation Tests
# ============================================
section "6. VALIDATION TESTS"

# Test 6.1: Missing authentication (should fail)
info "Test 6.1: Testing missing authentication..."
INVALID_RESPONSE=$(curl -s -X POST "$BASE_URL/pricing/onboarding/start" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\": 1}" 2>/dev/null || echo '{"success":false}')

if echo "$INVALID_RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
    success "Missing authentication correctly rejected"
else
    fail "Test 6.1: Missing authentication should be rejected"
fi

# Test 6.2: Invalid client_type
info "Test 6.2: Testing invalid client_type validation..."
INVALID_RESPONSE=$(curl -s -X POST "$BASE_URL/pricing/calculate/project-rate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{
    \"user_id\": $USER_ID,
    \"client_type\": \"invalid_type\",
    \"client_region\": \"cambodia\"
  }" 2>/dev/null || echo '{"success":false}')

if echo "$INVALID_RESPONSE" | jq -e '.success == false' > /dev/null 2>&1; then
    success "Invalid client_type correctly rejected"
else
    fail "Test 6.2: Invalid client_type should be rejected"
fi

# Test 6.3: Missing required fields
info "Test 6.3: Testing missing required fields..."
INVALID_RESPONSE=$(curl -s -X POST "$BASE_URL/pricing/calculate/project-rate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{\"user_id\": $USER_ID}" 2>/dev/null || echo '{"success":false}')

if echo "$INVALID_RESPONSE" | jq -e '.success == false' > /dev/null 2>&1; then
    success "Missing fields correctly rejected"
else
    fail "Test 6.3: Missing fields should be rejected"
fi

# ============================================
# TEST RESULTS SUMMARY
# ============================================
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║            TEST RESULTS SUMMARY              ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo -e "  ${GREEN}Passed:${NC} $TESTS_PASSED"
echo -e "  ${RED}Failed:${NC} $TESTS_FAILED"
echo ""

if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
    echo -e "${RED}Failed Tests:${NC}"
    for test in "${FAILED_TESTS[@]}"; do
        echo -e "  - $test"
    done
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test Data Summary:"
echo "  User ID:      $USER_ID"
echo "  Session ID:   ${SESSION_ID:0:8}..."
echo "  Base Rate:    \$${BASE_RATE:-N/A}/hr"
echo "  Final Rate:   \$${FINAL_RATE:-N/A}/hr"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please check the output above.${NC}"
    exit 1
fi

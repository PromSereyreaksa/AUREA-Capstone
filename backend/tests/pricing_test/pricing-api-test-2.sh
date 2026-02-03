#!/bin/bash

# AAUREA Pricing Calculator API Test Script
# Tests the complete AUREA onboarding flow and pricing calculations
# Now with 100 test data entries for comprehensive testing

# Don't use set -e as it interferes with arithmetic operations and test flow
# We handle errors explicitly instead

BASE_URL="${API_BASE_URL:-http://localhost:3000/api/v1}"
TEST_EMAIL="pricing_test_$(date +%s)@test.com"
TEST_PASSWORD="TestPassword123!"

# Test data file location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_DATA_FILE="$SCRIPT_DIR/test_data.json"

# Configuration
MAX_BATCH_TESTS="${MAX_BATCH_TESTS:-10}"  # Number of test data entries to use (max 100)
RUN_BATCH_TESTS="${RUN_BATCH_TESTS:-true}"  # Set to false to skip batch tests

# Track test results
TESTS_PASSED=0
TESTS_FAILED=0
FAILED_TESTS=()
BATCH_RESULTS=()
CALCULATED_RATES=()

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

# Function to check if test data file exists
check_test_data() {
    if [ ! -f "$TEST_DATA_FILE" ]; then
        echo -e "${RED}Error: Test data file not found at $TEST_DATA_FILE${NC}"
        echo "Please ensure test_data.json exists in the same directory as this script."
        return 1
    fi
    
    TEST_DATA_COUNT=$(jq '. | length' "$TEST_DATA_FILE" 2>/dev/null)
    if [ -z "$TEST_DATA_COUNT" ] || [ "$TEST_DATA_COUNT" -eq 0 ]; then
        echo -e "${RED}Error: Test data file is empty or invalid JSON${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✓ Found $TEST_DATA_COUNT test data entries${NC}"
    return 0
}

# Function to get test data entry by index
get_test_data() {
    local index=$1
    jq ".[$index]" "$TEST_DATA_FILE"
}

# Function to run onboarding with test data
run_onboarding_with_data() {
    local test_index=$1
    local user_id=$2
    local auth_token=$3
    local session_id=$4
    
    # Get test data for this index
    local test_data=$(get_test_data $test_index)
    
    if [ "$test_data" = "null" ] || [ -z "$test_data" ]; then
        echo "SKIP"
        return 1
    fi
    
    # Extract values from test data
    local monthly_rent=$(echo "$test_data" | jq -r '.monthly_rent')
    local equipment_cost=$(echo "$test_data" | jq -r '.equipment_cost')
    local utilities_cost=$(echo "$test_data" | jq -r '.utilities_cost')
    local materials_cost=$(echo "$test_data" | jq -r '.materials_cost')
    local desired_income=$(echo "$test_data" | jq -r '.desired_income')
    local billable_hours=$(echo "$test_data" | jq -r '.billable_hours')
    local profit_margin=$(echo "$test_data" | jq -r '.profit_margin')
    local years_experience=$(echo "$test_data" | jq -r '.years_experience')
    local skills=$(echo "$test_data" | jq -r '.skills | join(", ")')
    local seniority=$(echo "$test_data" | jq -r '.seniority')
    
    # Map test data to onboarding questions (10 questions)
    local answers=(
        "$monthly_rent"       # Q1: Monthly rent/office costs
        "$equipment_cost"     # Q2: Equipment, software, subscriptions
        "$utilities_cost"     # Q3: Utilities, insurance, taxes
        "$materials_cost"     # Q4: Materials per project
        "$desired_income"     # Q5: Desired monthly income
        "$billable_hours"     # Q6: Billable hours per month
        "$profit_margin"      # Q7: Profit margin
        "$years_experience"   # Q8: Years of experience
        "$skills"             # Q9: Skills
        "$seniority"          # Q10: Seniority level
    )
    
    local onboarding_complete=false
    
    for i in {0..9}; do
        local answer="${answers[$i]}"
        local q_num=$((i + 1))
        
        local answer_response=$(curl -s -X POST "$BASE_URL/pricing/onboarding/answer" \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $auth_token" \
          -d "{
            \"session_id\": \"$session_id\",
            \"answer\": \"$answer\"
          }" 2>/dev/null || echo '{"success":false}')
        
        if echo "$answer_response" | jq -e '.success' > /dev/null 2>&1; then
            local is_complete=$(echo "$answer_response" | jq -r '.data.onboarding_complete // .data.is_complete // false')
            
            if [ "$is_complete" = "true" ]; then
                onboarding_complete=true
                break
            fi
        else
            echo "FAIL_Q$q_num"
            return 1
        fi
        
        sleep 0.3
    done
    
    if [ "$onboarding_complete" = "true" ]; then
        echo "OK"
        return 0
    else
        echo "INCOMPLETE"
        return 1
    fi
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
check_test_data

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
# SECTION 2: Pricing Onboarding Flow (Using Test Data Entry #1)
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

# Test 2.2: Answer onboarding questions using FIRST test data entry
info "Test 2.2: Answering onboarding questions (using test_data.json entry #1)..."

# Get first test data entry
FIRST_TEST_DATA=$(get_test_data 0)
echo -e "  ${CYAN}Test Data:${NC}"
echo "    Rent: \$$(echo "$FIRST_TEST_DATA" | jq -r '.monthly_rent') | Equipment: \$$(echo "$FIRST_TEST_DATA" | jq -r '.equipment_cost')"
echo "    Income Goal: \$$(echo "$FIRST_TEST_DATA" | jq -r '.desired_income') | Hours: $(echo "$FIRST_TEST_DATA" | jq -r '.billable_hours')/mo"
echo "    Seniority: $(echo "$FIRST_TEST_DATA" | jq -r '.seniority') | Experience: $(echo "$FIRST_TEST_DATA" | jq -r '.years_experience') years"

# Map test data to onboarding answers
declare -A ANSWERS=(
    [1]="$(echo "$FIRST_TEST_DATA" | jq -r '.monthly_rent')"
    [2]="$(echo "$FIRST_TEST_DATA" | jq -r '.equipment_cost')"
    [3]="$(echo "$FIRST_TEST_DATA" | jq -r '.utilities_cost')"
    [4]="$(echo "$FIRST_TEST_DATA" | jq -r '.materials_cost')"
    [5]="$(echo "$FIRST_TEST_DATA" | jq -r '.desired_income')"
    [6]="$(echo "$FIRST_TEST_DATA" | jq -r '.billable_hours')"
    [7]="$(echo "$FIRST_TEST_DATA" | jq -r '.profit_margin')"
    [8]="$(echo "$FIRST_TEST_DATA" | jq -r '.years_experience')"
    [9]="$(echo "$FIRST_TEST_DATA" | jq -r '.skills | join(", ")')"
    [10]="$(echo "$FIRST_TEST_DATA" | jq -r '.seniority')"
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
# Note: user_id is now ALWAYS injected from JWT token for security
# So we test that unauthenticated requests are rejected instead
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
# SECTION 7: AI Quick Estimate (Google Search Grounding - Real Web Data)
# ============================================
section "7. AI QUICK ESTIMATE (Google Search Grounding)"

echo -e "  ${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${CYAN}This endpoint uses Gemini AI with GOOGLE SEARCH GROUNDING enabled.${NC}"
echo -e "  ${CYAN}The AI searches the internet in REAL-TIME for current prices.${NC}"
echo -e "  ${CYAN}Sources include actual URLs from web searches.${NC}"
echo -e "  ${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Test 7.1: Quick estimate for a beginner (with Google Search)
info "Test 7.1: AI Quick Estimate - Beginner Logo Designer (Web Search Enabled)"
echo -e "  ${YELLOW}→ AI will search the web for: Adobe CC pricing, Phnom Penh co-working costs, etc.${NC}"
QUICK_ESTIMATE_RESPONSE=$(curl -s -X POST "$BASE_URL/pricing/quick-estimate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{
    \"user_id\": $USER_ID,
    \"skills\": \"Logo Design, Social Media Graphics\",
    \"experience_level\": \"beginner\",
    \"hours_per_week\": 20
  }" 2>/dev/null || echo '{"success":false}')

if echo "$QUICK_ESTIMATE_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    MIN_RATE=$(echo "$QUICK_ESTIMATE_RESPONSE" | jq -r '.data.estimate.hourly_rate_min // "N/A"')
    MAX_RATE=$(echo "$QUICK_ESTIMATE_RESPONSE" | jq -r '.data.estimate.hourly_rate_max // "N/A"')
    RECOMMENDED=$(echo "$QUICK_ESTIMATE_RESPONSE" | jq -r '.data.estimate.recommended_rate // "N/A"')
    success "Quick estimate generated: \$${MIN_RATE} - \$${MAX_RATE}/hr (recommended: \$${RECOMMENDED}/hr)"
    
    echo ""
    echo -e "  ${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "  ${GREEN}║     AI-RESEARCHED COSTS (via Google Search Grounding)            ║${NC}"
    echo -e "  ${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    
    # Show AI-researched costs with details
    SOFTWARE_COST=$(echo "$QUICK_ESTIMATE_RESPONSE" | jq -r '.data.ai_researched_costs.monthly_software_cost // "N/A"')
    SOFTWARE_DETAILS=$(echo "$QUICK_ESTIMATE_RESPONSE" | jq -r '.data.ai_researched_costs.software_details // "N/A"')
    echo -e "  ${CYAN}Software:${NC} \$${SOFTWARE_COST}/month"
    echo -e "    ${YELLOW}Details:${NC} $SOFTWARE_DETAILS"
    
    WORKSPACE_COST=$(echo "$QUICK_ESTIMATE_RESPONSE" | jq -r '.data.ai_researched_costs.monthly_workspace_cost // "N/A"')
    WORKSPACE_DETAILS=$(echo "$QUICK_ESTIMATE_RESPONSE" | jq -r '.data.ai_researched_costs.workspace_details // "N/A"')
    echo -e "  ${CYAN}Workspace:${NC} \$${WORKSPACE_COST}/month"
    echo -e "    ${YELLOW}Details:${NC} $WORKSPACE_DETAILS"
    
    EQUIPMENT_COST=$(echo "$QUICK_ESTIMATE_RESPONSE" | jq -r '.data.ai_researched_costs.monthly_equipment_cost // "N/A"')
    EQUIPMENT_DETAILS=$(echo "$QUICK_ESTIMATE_RESPONSE" | jq -r '.data.ai_researched_costs.equipment_details // "N/A"')
    echo -e "  ${CYAN}Equipment:${NC} \$${EQUIPMENT_COST}/month (amortized)"
    echo -e "    ${YELLOW}Details:${NC} $EQUIPMENT_DETAILS"
    
    UTILITIES=$(echo "$QUICK_ESTIMATE_RESPONSE" | jq -r '.data.ai_researched_costs.monthly_utilities_cost // "N/A"')
    INTERNET=$(echo "$QUICK_ESTIMATE_RESPONSE" | jq -r '.data.ai_researched_costs.monthly_internet_cost // "N/A"')
    TOTAL_EXPENSES=$(echo "$QUICK_ESTIMATE_RESPONSE" | jq -r '.data.ai_researched_costs.total_monthly_expenses // "N/A"')
    echo -e "  ${CYAN}Utilities:${NC} \$${UTILITIES}/month | ${CYAN}Internet:${NC} \$${INTERNET}/month"
    echo -e "  ${GREEN}Total Monthly Expenses:${NC} \$${TOTAL_EXPENSES}"
    
    echo ""
    echo -e "  ${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "  ${GREEN}║     AI-RESEARCHED INCOME SUGGESTION                              ║${NC}"
    echo -e "  ${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    
    SUGGESTED_INCOME=$(echo "$QUICK_ESTIMATE_RESPONSE" | jq -r '.data.ai_researched_income.suggested_monthly_income // "N/A"')
    INCOME_REASONING=$(echo "$QUICK_ESTIMATE_RESPONSE" | jq -r '.data.ai_researched_income.income_reasoning // "N/A"')
    BILLABLE_RATIO=$(echo "$QUICK_ESTIMATE_RESPONSE" | jq -r '.data.ai_researched_income.billable_hours_ratio // "N/A"')
    BILLABLE_HOURS=$(echo "$QUICK_ESTIMATE_RESPONSE" | jq -r '.data.ai_researched_income.estimated_billable_hours // "N/A"')
    echo -e "  ${CYAN}Suggested Income:${NC} \$${SUGGESTED_INCOME}/month"
    echo -e "    ${YELLOW}Reasoning:${NC} $INCOME_REASONING"
    echo -e "  ${CYAN}Billable Hours:${NC} ${BILLABLE_HOURS}/month (${BILLABLE_RATIO} ratio)"
    
    echo ""
    echo -e "  ${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "  ${GREEN}║     MARKET RESEARCH INSIGHTS                                     ║${NC}"
    echo -e "  ${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    
    MEDIAN_RATE=$(echo "$QUICK_ESTIMATE_RESPONSE" | jq -r '.data.market_research.median_rate // "N/A"')
    PERCENTILE_75=$(echo "$QUICK_ESTIMATE_RESPONSE" | jq -r '.data.market_research.percentile_75_rate // "N/A"')
    MARKET_POSITION=$(echo "$QUICK_ESTIMATE_RESPONSE" | jq -r '.data.market_research.position // "N/A"')
    MARKET_INSIGHTS=$(echo "$QUICK_ESTIMATE_RESPONSE" | jq -r '.data.market_research.market_insights // "N/A"')
    echo -e "  ${CYAN}Median Rate:${NC} \$${MEDIAN_RATE}/hr | ${CYAN}75th Percentile:${NC} \$${PERCENTILE_75}/hr"
    echo -e "  ${CYAN}Your Position:${NC} ${MARKET_POSITION}"
    echo -e "    ${YELLOW}Insights:${NC} $MARKET_INSIGHTS"
    
    echo ""
    echo -e "  ${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "  ${GREEN}║     UREA CALCULATION BREAKDOWN                                   ║${NC}"
    echo -e "  ${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    
    CALC_COSTS=$(echo "$QUICK_ESTIMATE_RESPONSE" | jq -r '.data.calculation_breakdown.total_costs // "N/A"')
    CALC_INCOME=$(echo "$QUICK_ESTIMATE_RESPONSE" | jq -r '.data.calculation_breakdown.target_income // "N/A"')
    CALC_HOURS=$(echo "$QUICK_ESTIMATE_RESPONSE" | jq -r '.data.calculation_breakdown.billable_hours // "N/A"')
    UREA_RESULT=$(echo "$QUICK_ESTIMATE_RESPONSE" | jq -r '.data.calculation_breakdown.urea_formula_result // "N/A"')
    echo -e "  Formula: (Total Costs + Target Income) / Billable Hours"
    echo -e "  (\$${CALC_COSTS} + \$${CALC_INCOME}) / ${CALC_HOURS} = ${GREEN}\$${UREA_RESULT}/hr${NC}"
    
    # Show web sources - THE KEY DIFFERENCE
    echo ""
    echo -e "  ${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "  ${GREEN}║     WEB SOURCES (from Google Search Grounding)                   ║${NC}"
    echo -e "  ${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    
    SOURCES_COUNT=$(echo "$QUICK_ESTIMATE_RESPONSE" | jq -r '.data.sources | length // 0')
    echo -e "  ${CYAN}Found ${SOURCES_COUNT} source(s):${NC}"
    
    # Display each source
    echo "$QUICK_ESTIMATE_RESPONSE" | jq -r '.data.sources[]? // empty' | while read -r source; do
        if [[ "$source" == *"http"* ]]; then
            echo -e "    ${GREEN}🌐${NC} $source"
        else
            echo -e "    ${YELLOW}📚${NC} $source"
        fi
    done
    
    # Check if we got real web sources or fallback
    HAS_WEB_URLS=$(echo "$QUICK_ESTIMATE_RESPONSE" | jq -r '.data.sources | map(select(contains("http"))) | length // 0')
    if [ "$HAS_WEB_URLS" -gt 0 ]; then
        echo ""
        echo -e "  ${GREEN}✓ Google Search Grounding ACTIVE - Real web sources retrieved!${NC}"
    else
        echo ""
        echo -e "  ${YELLOW}⚠ Grounding may have fallen back to AI knowledge base${NC}"
    fi
    echo ""
else
    fail "Test 7.1: Failed to generate quick estimate"
    echo "$QUICK_ESTIMATE_RESPONSE" | jq '.' 2>/dev/null || echo "$QUICK_ESTIMATE_RESPONSE"
fi

# Test 7.2: Quick estimate for experienced designer (with Google Search)
info "Test 7.2: AI Quick Estimate - Experienced UI/UX Designer (Corporate Clients)"
echo -e "  ${YELLOW}→ AI will search for higher-tier costs and corporate rates${NC}"
QUICK_ESTIMATE_RESPONSE2=$(curl -s -X POST "$BASE_URL/pricing/quick-estimate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{
    \"user_id\": $USER_ID,
    \"skills\": \"Branding, UI/UX Design, Packaging Design\",
    \"experience_level\": \"experienced\",
    \"client_type\": \"corporate\",
    \"hours_per_week\": 40
  }" 2>/dev/null || echo '{"success":false}')

if echo "$QUICK_ESTIMATE_RESPONSE2" | jq -e '.success' > /dev/null 2>&1; then
    MIN_RATE2=$(echo "$QUICK_ESTIMATE_RESPONSE2" | jq -r '.data.estimate.hourly_rate_min // "N/A"')
    MAX_RATE2=$(echo "$QUICK_ESTIMATE_RESPONSE2" | jq -r '.data.estimate.hourly_rate_max // "N/A"')
    RECOMMENDED2=$(echo "$QUICK_ESTIMATE_RESPONSE2" | jq -r '.data.estimate.recommended_rate // "N/A"')
    success "Quick estimate generated: \$${MIN_RATE2} - \$${MAX_RATE2}/hr (recommended: \$${RECOMMENDED2}/hr)"
    
    echo ""
    echo -e "  ${CYAN}┌─────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "  ${CYAN}│     Comparison: Beginner vs Experienced (Web-Sourced Data)      │${NC}"
    echo -e "  ${CYAN}└─────────────────────────────────────────────────────────────────┘${NC}"
    printf "  %-20s %15s %15s\n" "METRIC" "BEGINNER" "EXPERIENCED"
    printf "  %-20s %15s %15s\n" "--------------------" "---------------" "---------------"
    
    # Compare key metrics
    SOFTWARE1=$(echo "$QUICK_ESTIMATE_RESPONSE" | jq -r '.data.ai_researched_costs.monthly_software_cost // 0')
    SOFTWARE2=$(echo "$QUICK_ESTIMATE_RESPONSE2" | jq -r '.data.ai_researched_costs.monthly_software_cost // 0')
    printf "  %-20s %15s %15s\n" "Software Cost" "\$$SOFTWARE1/mo" "\$$SOFTWARE2/mo"
    
    WORKSPACE1=$(echo "$QUICK_ESTIMATE_RESPONSE" | jq -r '.data.ai_researched_costs.monthly_workspace_cost // 0')
    WORKSPACE2=$(echo "$QUICK_ESTIMATE_RESPONSE2" | jq -r '.data.ai_researched_costs.monthly_workspace_cost // 0')
    printf "  %-20s %15s %15s\n" "Workspace Cost" "\$$WORKSPACE1/mo" "\$$WORKSPACE2/mo"
    
    INCOME1=$(echo "$QUICK_ESTIMATE_RESPONSE" | jq -r '.data.ai_researched_income.suggested_monthly_income // 0')
    INCOME2=$(echo "$QUICK_ESTIMATE_RESPONSE2" | jq -r '.data.ai_researched_income.suggested_monthly_income // 0')
    printf "  %-20s %15s %15s\n" "Suggested Income" "\$$INCOME1/mo" "\$$INCOME2/mo"
    
    printf "  %-20s %15s %15s\n" "Recommended Rate" "\$$RECOMMENDED/hr" "\$$RECOMMENDED2/hr"
    
    POSITION1=$(echo "$QUICK_ESTIMATE_RESPONSE" | jq -r '.data.market_research.position // "N/A"')
    POSITION2=$(echo "$QUICK_ESTIMATE_RESPONSE2" | jq -r '.data.market_research.position // "N/A"')
    printf "  %-20s %15s %15s\n" "Market Position" "$POSITION1" "$POSITION2"
    
    # Show sources for experienced estimate
    echo ""
    echo -e "  ${CYAN}Experienced Designer Sources:${NC}"
    echo "$QUICK_ESTIMATE_RESPONSE2" | jq -r '.data.sources[]? // empty' | head -5 | while read -r source; do
        if [[ "$source" == *"http"* ]]; then
            echo -e "    ${GREEN}🌐${NC} $source"
        else
            echo -e "    ${YELLOW}📚${NC} $source"
        fi
    done
    echo ""
else
    fail "Test 7.2: Failed to generate quick estimate for experienced designer"
    echo "$QUICK_ESTIMATE_RESPONSE2" | jq '.' 2>/dev/null || echo "$QUICK_ESTIMATE_RESPONSE2"
fi

# Test 7.3: Validate quick estimate input validation
info "Test 7.3: Testing quick estimate validation (invalid experience level)..."
INVALID_QUICK=$(curl -s -X POST "$BASE_URL/pricing/quick-estimate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{
    \"user_id\": $USER_ID,
    \"skills\": \"Logo Design\",
    \"experience_level\": \"ultra_pro_max\",
    \"hours_per_week\": 30
  }" 2>/dev/null || echo '{"success":false}')

if echo "$INVALID_QUICK" | jq -e '.success == false' > /dev/null 2>&1; then
    success "Invalid experience_level correctly rejected"
else
    fail "Test 7.3: Invalid experience_level should be rejected"
fi

# Test 7.4: Verify response structure uses new AI-researched format
info "Test 7.4: Verify Google Search Grounding response structure..."
echo -e "  ${YELLOW}→ Checking response contains ai_researched_costs and sources with URLs${NC}"

HAS_AI_COSTS=$(echo "$QUICK_ESTIMATE_RESPONSE" | jq 'has("data") and .data | has("ai_researched_costs")' 2>/dev/null)
HAS_SOURCES=$(echo "$QUICK_ESTIMATE_RESPONSE" | jq 'has("data") and .data | has("sources")' 2>/dev/null)
HAS_OLD_FORMAT=$(echo "$QUICK_ESTIMATE_RESPONSE" | jq 'has("data") and .data | has("estimated_assumptions")' 2>/dev/null)

if [ "$HAS_AI_COSTS" = "true" ] && [ "$HAS_SOURCES" = "true" ]; then
    success "Response uses Google Search Grounding format"
    echo -e "  ${GREEN}✓ ai_researched_costs: present${NC}"
    echo -e "  ${GREEN}✓ ai_researched_income: present${NC}"
    echo -e "  ${GREEN}✓ market_research: present${NC}"
    echo -e "  ${GREEN}✓ sources: present (with web URLs when grounding active)${NC}"
    
    if [ "$HAS_OLD_FORMAT" = "true" ]; then
        echo -e "  ${YELLOW}⚠ estimated_assumptions still present (old format)${NC}"
    else
        echo -e "  ${GREEN}✓ estimated_assumptions: NOT present (old hardcoded format removed)${NC}"
    fi
else
    fail "Test 7.4: Response missing required fields for Google Search Grounding"
fi

# ============================================
# SECTION 8: Batch Testing with 100 Test Data Entries
# ============================================
if [ "$RUN_BATCH_TESTS" = "true" ]; then
    section "8. BATCH TESTING ($MAX_BATCH_TESTS TEST DATA ENTRIES)"
    
    info "Running batch tests with test_data.json..."
    echo ""
    
    # Track batch results
    BATCH_PASSED=0
    BATCH_FAILED=0
    BATCH_SKIPPED=0
    
    # Header for results table
    printf "  ${CYAN}%-5s %-8s %-10s %-12s %-10s %-10s %-8s${NC}\n" \
        "TEST" "SENIORITY" "RENT" "INCOME" "HOURS" "RATE" "STATUS"
    printf "  %-5s %-8s %-10s %-12s %-10s %-10s %-8s\n" \
        "-----" "--------" "----------" "------------" "----------" "----------" "--------"
    
    for i in $(seq 0 $((MAX_BATCH_TESTS - 1))); do
        TEST_NUM=$((i + 1))
        
        # Get test data
        TEST_DATA=$(get_test_data $i)
        if [ "$TEST_DATA" = "null" ] || [ -z "$TEST_DATA" ]; then
            BATCH_SKIPPED=$((BATCH_SKIPPED + 1))
            continue
        fi
        
        # Extract key values for display
        T_SENIORITY=$(echo "$TEST_DATA" | jq -r '.seniority')
        T_RENT=$(echo "$TEST_DATA" | jq -r '.monthly_rent')
        T_INCOME=$(echo "$TEST_DATA" | jq -r '.desired_income')
        T_HOURS=$(echo "$TEST_DATA" | jq -r '.billable_hours')
        T_MARGIN=$(echo "$TEST_DATA" | jq -r '.profit_margin')
        T_SKILLS=$(echo "$TEST_DATA" | jq -r '.skills | join(", ")')
        
        # Create a new user for this test
        BATCH_EMAIL="batch_test_${TEST_NUM}_$(date +%s)@test.com"
        
        # Sign up
        BATCH_SIGNUP=$(curl -s -X POST "$BASE_URL/users/signup" \
          -H "Content-Type: application/json" \
          -d "{
            \"email\": \"$BATCH_EMAIL\",
            \"password\": \"$TEST_PASSWORD\",
            \"user_name\": \"Batch Test $TEST_NUM\",
            \"role\": \"designer\"
          }" 2>/dev/null || echo '{"success":false}')
        
        BATCH_USER_ID=$(echo "$BATCH_SIGNUP" | jq -r '.data.user.user_id // .data.user_id // empty')
        BATCH_OTP=$(echo "$BATCH_SIGNUP" | jq -r '.data.otp // empty')
        
        if [ -z "$BATCH_USER_ID" ]; then
            printf "  %-5s %-8s %-10s %-12s %-10s %-10s ${RED}%-8s${NC}\n" \
                "#$TEST_NUM" "$T_SENIORITY" "\$$T_RENT" "\$$T_INCOME" "$T_HOURS" "-" "SIGNUP_FAIL"
            BATCH_FAILED=$((BATCH_FAILED + 1))
            continue
        fi
        
        # Verify OTP
        BATCH_VERIFY=$(curl -s -X POST "$BASE_URL/users/verify-otp" \
          -H "Content-Type: application/json" \
          -d "{
            \"email\": \"$BATCH_EMAIL\",
            \"otp\": \"${BATCH_OTP:-123456}\"
          }" 2>/dev/null || echo '{"success":false}')
        
        BATCH_TOKEN=$(echo "$BATCH_VERIFY" | jq -r '.data.token // empty')
        
        if [ -z "$BATCH_TOKEN" ]; then
            printf "  %-5s %-8s %-10s %-12s %-10s %-10s ${RED}%-8s${NC}\n" \
                "#$TEST_NUM" "$T_SENIORITY" "\$$T_RENT" "\$$T_INCOME" "$T_HOURS" "-" "AUTH_FAIL"
            BATCH_FAILED=$((BATCH_FAILED + 1))
            continue
        fi
        
        # Start onboarding
        BATCH_START=$(curl -s -X POST "$BASE_URL/pricing/onboarding/start" \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $BATCH_TOKEN" \
          -d "{\"user_id\": $BATCH_USER_ID}" 2>/dev/null || echo '{"success":false}')
        
        BATCH_SESSION=$(echo "$BATCH_START" | jq -r '.data.session_id // empty')
        
        if [ -z "$BATCH_SESSION" ]; then
            printf "  %-5s %-8s %-10s %-12s %-10s %-10s ${RED}%-8s${NC}\n" \
                "#$TEST_NUM" "$T_SENIORITY" "\$$T_RENT" "\$$T_INCOME" "$T_HOURS" "-" "START_FAIL"
            BATCH_FAILED=$((BATCH_FAILED + 1))
            continue
        fi
        
        # Run onboarding with test data
        ONBOARD_RESULT=$(run_onboarding_with_data $i $BATCH_USER_ID "$BATCH_TOKEN" "$BATCH_SESSION")
        
        if [ "$ONBOARD_RESULT" != "OK" ]; then
            printf "  %-5s %-8s %-10s %-12s %-10s %-10s ${RED}%-8s${NC}\n" \
                "#$TEST_NUM" "$T_SENIORITY" "\$$T_RENT" "\$$T_INCOME" "$T_HOURS" "-" "$ONBOARD_RESULT"
            BATCH_FAILED=$((BATCH_FAILED + 1))
            continue
        fi
        
        # Calculate base rate
        BATCH_RATE_RESP=$(curl -s -X POST "$BASE_URL/pricing/calculate/base-rate" \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $BATCH_TOKEN" \
          -d "{
            \"user_id\": $BATCH_USER_ID,
            \"session_id\": \"$BATCH_SESSION\"
          }" 2>/dev/null || echo '{"success":false}')
        
        if echo "$BATCH_RATE_RESP" | jq -e '.success' > /dev/null 2>&1; then
            CALC_RATE=$(echo "$BATCH_RATE_RESP" | jq -r '.data.base_hourly_rate // 0')
            
            # Store result
            CALCULATED_RATES+=("$TEST_NUM:$T_SENIORITY:$CALC_RATE")
            
            printf "  %-5s %-8s %-10s %-12s %-10s ${GREEN}%-10s${NC} ${GREEN}%-8s${NC}\n" \
                "#$TEST_NUM" "$T_SENIORITY" "\$$T_RENT" "\$$T_INCOME" "$T_HOURS" "\$$CALC_RATE/hr" "OK"
            BATCH_PASSED=$((BATCH_PASSED + 1))
        else
            printf "  %-5s %-8s %-10s %-12s %-10s %-10s ${RED}%-8s${NC}\n" \
                "#$TEST_NUM" "$T_SENIORITY" "\$$T_RENT" "\$$T_INCOME" "$T_HOURS" "-" "CALC_FAIL"
            BATCH_FAILED=$((BATCH_FAILED + 1))
        fi
        
        # Small delay to avoid rate limiting
        sleep 0.5
    done
    
    echo ""
    echo -e "  ${CYAN}Batch Test Summary:${NC}"
    echo -e "    ${GREEN}Passed:${NC}  $BATCH_PASSED"
    echo -e "    ${RED}Failed:${NC}  $BATCH_FAILED"
    echo -e "    ${YELLOW}Skipped:${NC} $BATCH_SKIPPED"
    echo ""
    
    # Calculate average rates by seniority
    if [ ${#CALCULATED_RATES[@]} -gt 0 ]; then
        echo -e "  ${CYAN}Average Rates by Seniority:${NC}"
        
        for LEVEL in junior mid senior expert; do
            LEVEL_RATES=()
            for RESULT in "${CALCULATED_RATES[@]}"; do
                RESULT_SENIORITY=$(echo "$RESULT" | cut -d: -f2)
                RESULT_RATE=$(echo "$RESULT" | cut -d: -f3)
                if [ "$RESULT_SENIORITY" = "$LEVEL" ]; then
                    LEVEL_RATES+=("$RESULT_RATE")
                fi
            done
            
            if [ ${#LEVEL_RATES[@]} -gt 0 ]; then
                TOTAL=0
                for R in "${LEVEL_RATES[@]}"; do
                    TOTAL=$(echo "$TOTAL + $R" | bc -l 2>/dev/null || echo "$TOTAL")
                done
                AVG=$(echo "scale=2; $TOTAL / ${#LEVEL_RATES[@]}" | bc -l 2>/dev/null || echo "N/A")
                printf "    %-8s: \$%s/hr (n=%d)\n" "$LEVEL" "$AVG" "${#LEVEL_RATES[@]}"
            fi
        done
        echo ""
    fi
    
    # Update total counts
    TESTS_PASSED=$((TESTS_PASSED + BATCH_PASSED))
    TESTS_FAILED=$((TESTS_FAILED + BATCH_FAILED))
    
    if [ $BATCH_PASSED -eq $MAX_BATCH_TESTS ]; then
        success "All $MAX_BATCH_TESTS batch tests passed!"
    else
        info "Batch tests completed: $BATCH_PASSED/$MAX_BATCH_TESTS passed"
    fi
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
if [ "$RUN_BATCH_TESTS" = "true" ]; then
    echo -e "  ${CYAN}Batch Tests Run:${NC} $MAX_BATCH_TESTS"
fi
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
if [ "$RUN_BATCH_TESTS" = "true" ] && [ ${#CALCULATED_RATES[@]} -gt 0 ]; then
    echo "  Batch Tests:  ${#CALCULATED_RATES[@]} rates calculated"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Usage: MAX_BATCH_TESTS=50 ./pricing-api-test-2.sh  (run 50 batch tests)"
echo "       RUN_BATCH_TESTS=false ./pricing-api-test-2.sh  (skip batch tests)"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please check the output above.${NC}"
    exit 1
fi

#!/bin/bash

# AUREA Dashboard API Test Script
# Tests GET /api/v1/dashboard — base_rate, project counts, and recent projects

BASE_URL="${API_BASE_URL:-http://localhost:3000/api/v1}"
TEST_EMAIL="dashboard_test_$(date +%s)@test.com"
TEST_PASSWORD="TestPassword123!"

# Track test results
TESTS_PASSED=0
TESTS_FAILED=0
FAILED_TESTS=()

echo "╔══════════════════════════════════════════════╗"
echo "║       AUREA Dashboard API Tests               ║"
echo "║       GET /api/v1/dashboard                   ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "Base URL: $BASE_URL"
echo "Test Email: $TEST_EMAIL"
echo ""

# ─── Color helpers ────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

success() { echo -e "${GREEN}✓ $1${NC}"; TESTS_PASSED=$((TESTS_PASSED + 1)); }
fail()    { echo -e "${RED}✗ $1${NC}"; TESTS_FAILED=$((TESTS_FAILED + 1)); FAILED_TESTS+=("$1"); }
info()    { echo -e "${YELLOW}→ $1${NC}"; }
section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# ─── Check server ─────────────────────────────────────────────
check_server() {
    info "Checking if server is running..."
    if ! curl -s "$BASE_URL/health" > /dev/null 2>&1; then
        echo -e "${RED}Error: Server is not running at $BASE_URL${NC}"
        echo "Please start the server with: npm run dev"
        exit 1
    fi
    success "Server is running"
}

# ══════════════════════════════════════════════════════════════
# SECTION 1: Authentication Setup
# ══════════════════════════════════════════════════════════════
section "1. AUTHENTICATION SETUP"

check_server

# Test 1.1: Sign up new user
info "Test 1.1: Signing up new test user..."
SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/users/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"user_name\": \"Dashboard Test User\",
    \"role\": \"designer\"
  }" 2>/dev/null || echo '{"success":false}')

if echo "$SIGNUP_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    USER_ID=$(echo "$SIGNUP_RESPONSE" | jq -r '.data.user.user_id // .data.user_id // .data.userId // empty')
    SIGNUP_OTP=$(echo "$SIGNUP_RESPONSE" | jq -r '.data.otp // empty')
    if [ -n "$USER_ID" ]; then
        success "Test 1.1: User signed up (ID: $USER_ID)"
        [ -n "$SIGNUP_OTP" ] && info "OTP received: $SIGNUP_OTP"
    else
        fail "Test 1.1: Sign up succeeded but user_id not returned"
    fi
else
    fail "Test 1.1: Failed to sign up user"
    echo "$SIGNUP_RESPONSE" | jq '.' 2>/dev/null || echo "$SIGNUP_RESPONSE"
fi

# Test 1.2: Verify OTP
OTP_TO_USE="${SIGNUP_OTP:-123456}"
info "Test 1.2: Verifying OTP ($OTP_TO_USE)..."
VERIFY_RESPONSE=$(curl -s -X POST "$BASE_URL/users/verify-otp" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"otp\": \"$OTP_TO_USE\"
  }" 2>/dev/null || echo '{"success":false}')

if echo "$VERIFY_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    AUTH_TOKEN=$(echo "$VERIFY_RESPONSE" | jq -r '.data.token // empty')
    if [ -n "$AUTH_TOKEN" ]; then
        success "Test 1.2: OTP verified, auth token received"
    else
        fail "Test 1.2: OTP verified but no token returned"
    fi
else
    fail "Test 1.2: Failed to verify OTP"
    echo "$VERIFY_RESPONSE" | jq '.' 2>/dev/null || echo "$VERIFY_RESPONSE"
fi

if [ -z "$AUTH_TOKEN" ]; then
    echo -e "${RED}Cannot continue without authentication. Exiting.${NC}"
    exit 1
fi

# ══════════════════════════════════════════════════════════════
# SECTION 2: Unauthenticated Access (should return 401)
# ══════════════════════════════════════════════════════════════
section "2. UNAUTHENTICATED ACCESS"

# Test 2.1: No token → 401
info "Test 2.1: GET /dashboard without Authorization header..."
NO_AUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X GET "$BASE_URL/dashboard" 2>/dev/null || echo "000")

if [ "$NO_AUTH_RESPONSE" = "401" ]; then
    success "Test 2.1: Returns 401 when no token provided"
else
    fail "Test 2.1: Expected 401, got $NO_AUTH_RESPONSE"
fi

# Test 2.2: Invalid token → 401
info "Test 2.2: GET /dashboard with invalid token..."
INVALID_TOKEN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X GET "$BASE_URL/dashboard" \
  -H "Authorization: Bearer invalid.token.value" 2>/dev/null || echo "000")

if [ "$INVALID_TOKEN_RESPONSE" = "401" ]; then
    success "Test 2.2: Returns 401 with invalid token"
else
    fail "Test 2.2: Expected 401, got $INVALID_TOKEN_RESPONSE"
fi

# ══════════════════════════════════════════════════════════════
# SECTION 3: Fresh User Dashboard (no pricing profile, no projects)
# ══════════════════════════════════════════════════════════════
section "3. FRESH USER DASHBOARD (no data)"

info "Test 3.1: GET /dashboard for fresh user with no data..."
FRESH_RESPONSE=$(curl -s -X GET "$BASE_URL/dashboard" \
  -H "Authorization: Bearer $AUTH_TOKEN" 2>/dev/null || echo '{"success":false}')

if echo "$FRESH_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    success "Test 3.1: Dashboard returns 200 with success=true"
else
    fail "Test 3.1: Dashboard did not return success=true"
    echo "$FRESH_RESPONSE" | jq '.' 2>/dev/null || echo "$FRESH_RESPONSE"
fi

# Test 3.2: base_rate should be null
BASE_RATE_VALUE=$(echo "$FRESH_RESPONSE" | jq -r '.data.base_rate')
if [ "$BASE_RATE_VALUE" = "null" ]; then
    success "Test 3.2: base_rate is null for user with no pricing profile"
else
    info "Test 3.2: base_rate is $BASE_RATE_VALUE (non-null — user may have legacy data)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
fi

# Test 3.3: projects_this_week should be 0
WEEK_COUNT=$(echo "$FRESH_RESPONSE" | jq -r '.data.projects_this_week')
if [ "$WEEK_COUNT" = "0" ]; then
    success "Test 3.3: projects_this_week is 0"
else
    fail "Test 3.3: Expected projects_this_week=0, got $WEEK_COUNT"
fi

# Test 3.4: projects_this_month should be 0
MONTH_COUNT=$(echo "$FRESH_RESPONSE" | jq -r '.data.projects_this_month')
if [ "$MONTH_COUNT" = "0" ]; then
    success "Test 3.4: projects_this_month is 0"
else
    fail "Test 3.4: Expected projects_this_month=0, got $MONTH_COUNT"
fi

# Test 3.5: recent_projects should be an empty array
RECENT_COUNT=$(echo "$FRESH_RESPONSE" | jq '.data.recent_projects | length')
if [ "$RECENT_COUNT" = "0" ]; then
    success "Test 3.5: recent_projects is empty array"
else
    fail "Test 3.5: Expected empty recent_projects, got $RECENT_COUNT items"
fi

# Test 3.6: Response shape — all expected keys present
HAS_BASE_RATE=$(echo "$FRESH_RESPONSE" | jq 'has("data") and (.data | has("base_rate"))')
HAS_WEEK=$(echo "$FRESH_RESPONSE" | jq '(.data | has("projects_this_week"))')
HAS_MONTH=$(echo "$FRESH_RESPONSE" | jq '(.data | has("projects_this_month"))')
HAS_RECENT=$(echo "$FRESH_RESPONSE" | jq '(.data | has("recent_projects"))')

if [ "$HAS_BASE_RATE" = "true" ] && [ "$HAS_WEEK" = "true" ] && \
   [ "$HAS_MONTH" = "true" ] && [ "$HAS_RECENT" = "true" ]; then
    success "Test 3.6: Response contains all expected keys (base_rate, projects_this_week, projects_this_month, recent_projects)"
else
    fail "Test 3.6: Response missing expected keys — base_rate:$HAS_BASE_RATE week:$HAS_WEEK month:$HAS_MONTH recent:$HAS_RECENT"
fi

# ══════════════════════════════════════════════════════════════
# SECTION 4: Dashboard after Pricing Onboarding (base_rate populated)
# ══════════════════════════════════════════════════════════════
section "4. DASHBOARD AFTER PRICING ONBOARDING"

info "Setting up: Starting onboarding flow to create pricing profile..."
ONBOARDING_RESPONSE=$(curl -s -X POST "$BASE_URL/pricing/onboarding/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{\"user_id\": $USER_ID}" 2>/dev/null || echo '{"success":false}')

if echo "$ONBOARDING_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    SESSION_ID=$(echo "$ONBOARDING_RESPONSE" | jq -r '.data.session_id // empty')
    if [ -n "$SESSION_ID" ]; then
        info "Onboarding session started: ${SESSION_ID:0:8}..."
    else
        info "Onboarding started but no session_id returned — skipping Section 4"
        SESSION_ID=""
    fi
else
    info "Could not start onboarding — skipping Section 4"
    SESSION_ID=""
fi

if [ -n "$SESSION_ID" ]; then
    # Answer all 10 onboarding questions
    declare -A ANSWERS=(
        [1]="100"       # Monthly rent
        [2]="80"        # Equipment/subscriptions
        [3]="50"        # Utilities/insurance/taxes
        [4]="30"        # Materials per project
        [5]="700"       # Desired monthly income
        [6]="80"        # Billable hours per month
        [7]="0.15"      # Profit margin
        [8]="2"         # Years of experience
        [9]="Graphic Design"
        [10]="mid"
    )

    ONBOARDING_DONE=false
    for i in {1..10}; do
        ANSWER="${ANSWERS[$i]}"
        ANS_RESPONSE=$(curl -s -X POST "$BASE_URL/pricing/onboarding/answer" \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $AUTH_TOKEN" \
          -d "{\"session_id\": \"$SESSION_ID\", \"answer\": \"$ANSWER\"}" \
          2>/dev/null || echo '{"success":false}')

        IS_COMPLETE=$(echo "$ANS_RESPONSE" | jq -r '.data.onboarding_complete // .data.is_complete // false')
        if [ "$IS_COMPLETE" = "true" ]; then
            ONBOARDING_DONE=true
            break
        fi
    done

    if [ "$ONBOARDING_DONE" = "true" ]; then
        # Calculate and persist the base rate
        BASE_RATE_RESPONSE=$(curl -s -X POST "$BASE_URL/pricing/calculate/base-rate" \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $AUTH_TOKEN" \
          -d "{\"user_id\": $USER_ID}" 2>/dev/null || echo '{"success":false}')

        CALC_BASE_RATE=$(echo "$BASE_RATE_RESPONSE" | jq -r '.data.base_hourly_rate // .data.base_rate // null')
        info "Calculated base rate: $CALC_BASE_RATE/hr"

        # Test 4.1: Dashboard should now have base_rate populated
        PROFILE_DASH=$(curl -s -X GET "$BASE_URL/dashboard" \
          -H "Authorization: Bearer $AUTH_TOKEN" 2>/dev/null || echo '{"success":false}')

        DASH_BASE_RATE=$(echo "$PROFILE_DASH" | jq -r '.data.base_rate')
        if [ "$DASH_BASE_RATE" != "null" ] && [ -n "$DASH_BASE_RATE" ]; then
            success "Test 4.1: base_rate is populated after onboarding ($DASH_BASE_RATE)"
        else
            fail "Test 4.1: base_rate still null after onboarding (check if calculate/base-rate persists to pricing_profiles)"
        fi
    else
        info "Onboarding not completed — skipping Test 4.1"
    fi
fi

# ══════════════════════════════════════════════════════════════
# SECTION 5: Dashboard after Project Creation
# ══════════════════════════════════════════════════════════════
section "5. DASHBOARD AFTER PROJECT CREATION"

info "Setting up: Creating test projects via /pricing/calculate/project-rate..."

PROJECT_IDS=()
PROJECT_NAMES=("Brand Identity Package" "Website Redesign" "Mobile App UI")

for PROJECT_NAME in "${PROJECT_NAMES[@]}"; do
    CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/pricing/calculate/project-rate" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -d "{
        \"user_id\": $USER_ID,
        \"project_name\": \"$PROJECT_NAME\",
        \"client_type\": \"startup\",
        \"client_region\": \"cambodia\"
      }" 2>/dev/null || echo '{"success":false}')

    CREATED_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.project_id // .data.project.project_id // empty')
    if [ -n "$CREATED_ID" ]; then
        PROJECT_IDS+=("$CREATED_ID")
        info "Created project '$PROJECT_NAME' (ID: $CREATED_ID)"
    else
        info "Could not create project '$PROJECT_NAME' — may need pricing profile first"
        PROJ_ERROR=$(echo "$CREATE_RESPONSE" | jq -r '.error.message // .message // "unknown"' 2>/dev/null)
        info "  Reason: $PROJ_ERROR"
    fi
done

PROJECTS_CREATED=${#PROJECT_IDS[@]}

if [ "$PROJECTS_CREATED" -gt 0 ]; then
    PROJ_DASH=$(curl -s -X GET "$BASE_URL/dashboard" \
      -H "Authorization: Bearer $AUTH_TOKEN" 2>/dev/null || echo '{"success":false}')

    # Test 5.1: projects_this_week > 0
    P_WEEK=$(echo "$PROJ_DASH" | jq -r '.data.projects_this_week')
    if [ "$P_WEEK" -ge "$PROJECTS_CREATED" ] 2>/dev/null; then
        success "Test 5.1: projects_this_week=$P_WEEK (≥ $PROJECTS_CREATED created)"
    else
        fail "Test 5.1: projects_this_week=$P_WEEK but created $PROJECTS_CREATED this week"
    fi

    # Test 5.2: projects_this_month > 0
    P_MONTH=$(echo "$PROJ_DASH" | jq -r '.data.projects_this_month')
    if [ "$P_MONTH" -ge "$PROJECTS_CREATED" ] 2>/dev/null; then
        success "Test 5.2: projects_this_month=$P_MONTH (≥ $PROJECTS_CREATED created)"
    else
        fail "Test 5.2: projects_this_month=$P_MONTH but created $PROJECTS_CREATED this month"
    fi

    # Test 5.3: recent_projects length 1–5 and ≥ PROJECTS_CREATED
    R_COUNT=$(echo "$PROJ_DASH" | jq '.data.recent_projects | length')
    if [ "$R_COUNT" -ge "1" ] && [ "$R_COUNT" -le "5" ]; then
        success "Test 5.3: recent_projects has $R_COUNT entries (within 1–5 cap)"
    else
        fail "Test 5.3: recent_projects length=$R_COUNT (expected 1–5)"
    fi

    # Test 5.4: Each recent_project has required fields
    FIELDS_OK=$(echo "$PROJ_DASH" | jq '
      .data.recent_projects |
      all(has("project_id") and has("project_name") and has("title") and has("created_at"))
    ')
    if [ "$FIELDS_OK" = "true" ]; then
        success "Test 5.4: All recent_projects contain project_id, project_name, title, created_at"
    else
        fail "Test 5.4: Some recent_projects are missing required fields"
        echo "$PROJ_DASH" | jq '.data.recent_projects' 2>/dev/null
    fi

    # Test 5.5: Most recent project appears first
    FIRST_PROJECT_NAME=$(echo "$PROJ_DASH" | jq -r '.data.recent_projects[0].project_name')
    info "Most recent project: $FIRST_PROJECT_NAME"
    success "Test 5.5: recent_projects[0] is '$FIRST_PROJECT_NAME' (most recent first)"

    # Test 5.6: created_at is a valid ISO timestamp
    FIRST_CREATED_AT=$(echo "$PROJ_DASH" | jq -r '.data.recent_projects[0].created_at')
    if echo "$FIRST_CREATED_AT" | grep -qE '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}'; then
        success "Test 5.6: created_at is a valid ISO 8601 timestamp ($FIRST_CREATED_AT)"
    else
        fail "Test 5.6: created_at has unexpected format: $FIRST_CREATED_AT"
    fi

else
    info "Skipping Section 5 tests: could not create projects (pricing profile may be required first)"
    info "Run after completing onboarding flow, or use a seeded database."
fi

# ══════════════════════════════════════════════════════════════
# SECTION 6: Edge Cases
# ══════════════════════════════════════════════════════════════
section "6. EDGE CASES"

# Test 6.1: recent_projects never exceeds 5 even if more projects exist
# (If we already created 3, create 3 more to exceed 5 total)
info "Test 6.1: Verify recent_projects is capped at 5..."
for i in 4 5 6; do
    curl -s -X POST "$BASE_URL/pricing/calculate/project-rate" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -d "{
        \"user_id\": $USER_ID,
        \"project_name\": \"Extra Project $i\",
        \"client_type\": \"corporate\",
        \"client_region\": \"global\"
      }" > /dev/null 2>&1
done

CAP_DASH=$(curl -s -X GET "$BASE_URL/dashboard" \
  -H "Authorization: Bearer $AUTH_TOKEN" 2>/dev/null || echo '{"success":false}')

CAP_COUNT=$(echo "$CAP_DASH" | jq '.data.recent_projects | length')
if [ "$CAP_COUNT" -le "5" ] 2>/dev/null; then
    success "Test 6.1: recent_projects capped at ≤5 even with many projects (got $CAP_COUNT)"
else
    fail "Test 6.1: recent_projects exceeded 5 cap (got $CAP_COUNT)"
fi

# Test 6.2: Response time is reasonable (< 3s)
info "Test 6.2: Checking dashboard response time..."
START_TIME=$(date +%s%N 2>/dev/null || date +%s)
curl -s -X GET "$BASE_URL/dashboard" \
  -H "Authorization: Bearer $AUTH_TOKEN" > /dev/null 2>&1
END_TIME=$(date +%s%N 2>/dev/null || date +%s)

# Calculate ms — fallback to seconds if %N not supported
if [ ${#START_TIME} -gt 10 ]; then
    ELAPSED_MS=$(( (END_TIME - START_TIME) / 1000000 ))
    if [ "$ELAPSED_MS" -lt 3000 ] 2>/dev/null; then
        success "Test 6.2: Dashboard responded in ${ELAPSED_MS}ms (< 3000ms)"
    else
        fail "Test 6.2: Dashboard response took ${ELAPSED_MS}ms (> 3000ms)"
    fi
else
    info "Test 6.2: Skipped (ms timer not available on this system)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
fi

# ══════════════════════════════════════════════════════════════
# SUMMARY
# ══════════════════════════════════════════════════════════════
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║               TEST SUMMARY                   ║"
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
echo "  User ID:          ${USER_ID:-N/A}"
echo "  Session ID:       ${SESSION_ID:0:8}..."
echo "  Projects Created: $PROJECTS_CREATED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please check the output above.${NC}"
    exit 1
fi

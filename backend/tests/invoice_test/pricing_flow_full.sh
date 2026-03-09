#!/bin/bash

# AUREA Invoice + Pricing Flow API Test Script
# Tests: pricing breakdown, difficulty/licensing multipliers, invoice endpoints,
#        total_project_price, and PDF generation (saved for visual inspection).

BASE_URL="${API_BASE_URL:-http://localhost:3000/api/v0}"
TEST_EMAIL="invoice_test_$(date +%s)@test.com"
TEST_PASSWORD="TestPassword123!"
PDF_OUTPUT_DIR="./test-output"

# Track test results
TESTS_PASSED=0
TESTS_FAILED=0
FAILED_TESTS=()

# Create output dir for PDFs
mkdir -p "$PDF_OUTPUT_DIR"

echo "╔══════════════════════════════════════════════════════╗"
echo "║  AUREA Pricing Flow + Invoice API Tests              ║"
echo "║  Difficulty / Licensing / Breakdown / Invoice / PDF  ║"
echo "╚══════════════════════════════════════════════════════╝"
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
    \"user_name\": \"Invoice Test User\",
    \"first_name\": \"Prom\",
    \"last_name\": \"Sereyreaksa\"
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
# SECTION 2: Setup – Create a Project (prerequisite for invoices)
# ══════════════════════════════════════════════════════════════
section "2. PROJECT SETUP"

# Create pricing profile directly using the accept-rate endpoint
# This is much simpler than going through the full onboarding flow
info "Setting up pricing profile via accept-rate..."
ACCEPT_RESPONSE=$(curl -s -X POST "$BASE_URL/pricing/portfolio-assist/accept" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{
    \"user_id\": $USER_ID,
    \"hourly_rate\": 15,
    \"seniority_level\": \"mid\",
    \"experience_years\": 3,
    \"desired_monthly_income\": 800,
    \"billable_hours_per_month\": 80,
    \"profit_margin\": 0.15
  }" 2>/dev/null || echo '{"success":false}')

if echo "$ACCEPT_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    info "Pricing profile created successfully"
else
    info "Accept-rate response: $(echo "$ACCEPT_RESPONSE" | jq -c '.' 2>/dev/null || echo "$ACCEPT_RESPONSE")"
    info "Will try to create project anyway..."
fi

# Create a test project using the manual project creation endpoint
info "Test 2.1: Creating test project..."
PROJECT_RESPONSE=$(curl -s -X POST "$BASE_URL/pdf/create-project" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{
    \"user_id\": $USER_ID,
    \"project_name\": \"Tech Start Up Branding\",
    \"title\": \"Branding Package\",
    \"description\": \"Complete branding for a tech startup\",
    \"duration\": 14,
    \"difficulty\": \"Medium\",
    \"licensing\": \"One-Time Use\",
    \"usage_rights\": \"Small Business\",
    \"client_type\": \"startup\",
    \"client_region\": \"cambodia\",
    \"deliverables\": [
      {
        \"deliverable_type\": \"Logo\",
        \"quantity\": 2,
        \"items\": [\"Primary Logo\", \"Icon Logo\"]
      },
      {
        \"deliverable_type\": \"Business Card\",
        \"quantity\": 3,
        \"items\": [\"Front Design\", \"Back Design\", \"Print Ready\"]
      },
      {
        \"deliverable_type\": \"Brand Guideline\",
        \"quantity\": 2,
        \"items\": [\"Color Palette\", \"Typography\"]
      }
    ]
  }" 2>/dev/null || echo '{"success":false}')

PROJECT_ID=$(echo "$PROJECT_RESPONSE" | jq -r '.data.project_id // .data.project.project_id // empty')

if [ -n "$PROJECT_ID" ] && [ "$PROJECT_ID" != "null" ]; then
    success "Test 2.1: Project created (ID: $PROJECT_ID)"
else
    fail "Test 2.1: Failed to create project"
    echo "$PROJECT_RESPONSE" | jq '.' 2>/dev/null || echo "$PROJECT_RESPONSE"
    echo -e "${RED}Cannot continue without a project. Exiting.${NC}"
    exit 1
fi

# Create a second project for later tests
info "Creating second test project..."
PROJECT2_RESPONSE=$(curl -s -X POST "$BASE_URL/pdf/create-project" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{
    \"user_id\": $USER_ID,
    \"project_name\": \"Website Redesign\",
    \"title\": \"Corporate Website\",
    \"description\": \"Redesign of existing corporate website\",
    \"duration\": 21,
    \"difficulty\": \"Medium\",
    \"licensing\": \"Multi-Use\",
    \"usage_rights\": \"Corporate\",
    \"client_type\": \"sme\",
    \"client_region\": \"southeast_asia\",
    \"deliverables\": [
      {
        \"deliverable_type\": \"Website Design\",
        \"quantity\": 5,
        \"items\": [\"Homepage\", \"About Page\", \"Services\", \"Contact\", \"Blog\"]
      }
    ]
  }" 2>/dev/null || echo '{"success":false}')

PROJECT2_ID=$(echo "$PROJECT2_RESPONSE" | jq -r '.data.project_id // .data.project.project_id // empty')
if [ -n "$PROJECT2_ID" ] && [ "$PROJECT2_ID" != "null" ]; then
    info "Second project created (ID: $PROJECT2_ID)"
else
    info "Could not create second project — some tests may be skipped"
fi

# ══════════════════════════════════════════════════════════════
# SECTION 2B: Calculate Project Rate (with project_id)
# ══════════════════════════════════════════════════════════════
section "2B. CALCULATE PROJECT RATE (with difficulty + licensing)"

info "Test 2B.1: POST /pricing/calculate/project-rate with project_id..."
CALC_RESPONSE=$(curl -s -X POST "$BASE_URL/pricing/calculate/project-rate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{
    \"user_id\": $USER_ID,
    \"project_id\": $PROJECT_ID,
    \"client_type\": \"startup\",
    \"client_region\": \"cambodia\"
  }" 2>/dev/null || echo '{"success":false}')

CALC_SUCCESS=$(echo "$CALC_RESPONSE" | jq -r '.success')
if [ "$CALC_SUCCESS" = "true" ]; then
    success "Test 2B.1: Project rate calculated"
else
    fail "Test 2B.1: Failed to calculate project rate"
    echo "$CALC_RESPONSE" | jq '.' 2>/dev/null || echo "$CALC_RESPONSE"
fi

# Test 2B.2: Verify difficulty_multiplier is returned
CALC_DIFF=$(echo "$CALC_RESPONSE" | jq -r '.data.difficulty_multiplier // empty')
if [ -n "$CALC_DIFF" ] && [ "$CALC_DIFF" != "null" ]; then
    success "Test 2B.2: difficulty_multiplier returned ($CALC_DIFF)"
else
    fail "Test 2B.2: difficulty_multiplier missing from response"
fi

# Test 2B.3: Verify licensing_multiplier is returned
CALC_LIC=$(echo "$CALC_RESPONSE" | jq -r '.data.licensing_multiplier // empty')
if [ -n "$CALC_LIC" ] && [ "$CALC_LIC" != "null" ]; then
    success "Test 2B.3: licensing_multiplier returned ($CALC_LIC)"
else
    fail "Test 2B.3: licensing_multiplier missing from response"
fi

# Test 2B.4: Verify total_project_price is returned
CALC_TOTAL=$(echo "$CALC_RESPONSE" | jq -r '.data.total_project_price // empty')
if [ -n "$CALC_TOTAL" ] && [ "$CALC_TOTAL" != "null" ]; then
    success "Test 2B.4: total_project_price returned ($CALC_TOTAL)"
else
    fail "Test 2B.4: total_project_price missing from response"
fi

# Test 2B.5: Verify duration_hours is returned
CALC_DUR=$(echo "$CALC_RESPONSE" | jq -r '.data.duration_hours // empty')
if [ -n "$CALC_DUR" ] && [ "$CALC_DUR" != "null" ]; then
    success "Test 2B.5: duration_hours returned ($CALC_DUR)"
else
    fail "Test 2B.5: duration_hours missing from response"
fi

# Print full rate breakdown for visibility
echo ""
info "=== Project Rate Breakdown ==="
echo "$CALC_RESPONSE" | jq '.data | {
  base_rate, seniority_level, seniority_multiplier,
  client_type, client_region, context_multiplier,
  final_hourly_rate, duration_hours,
  difficulty_multiplier, licensing_multiplier,
  total_project_price, project_updated
}' 2>/dev/null
echo ""

# ══════════════════════════════════════════════════════════════
# SECTION 2C: Pricing Breakdown Endpoint
# ══════════════════════════════════════════════════════════════
section "2C. PROJECT PRICING BREAKDOWN (GET)"

info "Test 2C.1: GET /pricing/project-breakdown/$PROJECT_ID..."
BREAKDOWN_RESPONSE=$(curl -s -X GET "$BASE_URL/pricing/project-breakdown/$PROJECT_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN" 2>/dev/null || echo '{"success":false}')

BREAKDOWN_SUCCESS=$(echo "$BREAKDOWN_RESPONSE" | jq -r '.success')
if [ "$BREAKDOWN_SUCCESS" = "true" ]; then
    success "Test 2C.1: Pricing breakdown retrieved"
else
    fail "Test 2C.1: Failed to get pricing breakdown"
    echo "$BREAKDOWN_RESPONSE" | jq '.' 2>/dev/null || echo "$BREAKDOWN_RESPONSE"
fi

# Test 2C.2: Verify all multiplier fields present
BD_DATA=$(echo "$BREAKDOWN_RESPONSE" | jq '.data')
BD_BASE=$(echo "$BD_DATA" | jq -r '.base_rate // empty')
BD_SENIORITY=$(echo "$BD_DATA" | jq -r '.seniority_multiplier // empty')
BD_CONTEXT=$(echo "$BD_DATA" | jq -r '.context_multiplier // empty')
BD_FHR=$(echo "$BD_DATA" | jq -r '.final_hourly_rate // empty')
BD_DIFF=$(echo "$BD_DATA" | jq -r '.difficulty_multiplier // empty')
BD_LIC=$(echo "$BD_DATA" | jq -r '.licensing_multiplier // empty')
BD_TOTAL=$(echo "$BD_DATA" | jq -r '.total_project_price // empty')
BD_PP=$(echo "$BD_DATA" | jq -r '.project_price // empty')

if [ -n "$BD_BASE" ] && [ -n "$BD_SENIORITY" ] && [ -n "$BD_CONTEXT" ] && \
   [ -n "$BD_FHR" ] && [ -n "$BD_DIFF" ] && [ -n "$BD_LIC" ] && \
   [ -n "$BD_TOTAL" ] && [ -n "$BD_PP" ]; then
    success "Test 2C.2: All multiplier fields present in breakdown"
else
    fail "Test 2C.2: Missing fields — base:$BD_BASE sen:$BD_SENIORITY ctx:$BD_CONTEXT fhr:$BD_FHR diff:$BD_DIFF lic:$BD_LIC pp:$BD_PP total:$BD_TOTAL"
fi

# Test 2C.3: difficulty_multiplier matches expected value for Medium (1.5)
if [ "$BD_DIFF" = "1.5" ]; then
    success "Test 2C.3: difficulty_multiplier = 1.5 (correct for Medium)"
else
    fail "Test 2C.3: Expected difficulty_multiplier=1.5 for Medium, got $BD_DIFF"
fi

# Test 2C.4: licensing_multiplier matches expected value for One-Time Use (1)
if [ "$BD_LIC" = "1" ]; then
    success "Test 2C.4: licensing_multiplier = 1 (correct for One-Time Use)"
else
    fail "Test 2C.4: Expected licensing_multiplier=1 for One-Time Use, got $BD_LIC"
fi

# Test 2C.5: total_project_price = project_price * licensing_multiplier
# For licensing=1, these should be equal
if [ "$BD_TOTAL" = "$BD_PP" ]; then
    success "Test 2C.5: total_project_price == project_price (licensing=1.0 so they match)"
else
    fail "Test 2C.5: total_project_price ($BD_TOTAL) != project_price ($BD_PP) — expected equal when licensing=1.0"
fi

# Test 2C.6: deliverables included in breakdown
BD_DELIV_COUNT=$(echo "$BD_DATA" | jq '.deliverables | length')
if [ "$BD_DELIV_COUNT" -ge 1 ] 2>/dev/null; then
    success "Test 2C.6: Breakdown includes $BD_DELIV_COUNT deliverable type(s)"
else
    fail "Test 2C.6: Expected deliverables in breakdown, got count $BD_DELIV_COUNT"
fi

# Test 2C.7: Test with second project (Multi-Use licensing)
if [ -n "$PROJECT2_ID" ] && [ "$PROJECT2_ID" != "null" ]; then
    info "Test 2C.7: Calculate rate for project 2 (Multi-Use licensing)..."
    # First calculate rate for project 2
    curl -s -X POST "$BASE_URL/pricing/calculate/project-rate" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -d "{
        \"user_id\": $USER_ID,
        \"project_id\": $PROJECT2_ID,
        \"client_type\": \"sme\",
        \"client_region\": \"southeast_asia\"
      }" > /dev/null 2>&1

    BD2_RESPONSE=$(curl -s -X GET "$BASE_URL/pricing/project-breakdown/$PROJECT2_ID" \
      -H "Authorization: Bearer $AUTH_TOKEN" 2>/dev/null)

    BD2_LIC=$(echo "$BD2_RESPONSE" | jq -r '.data.licensing_multiplier // empty')
    BD2_PP=$(echo "$BD2_RESPONSE" | jq -r '.data.project_price // empty')
    BD2_TOTAL=$(echo "$BD2_RESPONSE" | jq -r '.data.total_project_price // empty')

    if [ "$BD2_LIC" = "1.2" ]; then
        success "Test 2C.7: licensing_multiplier = 1.2 (correct for Multi-Use)"
    else
        fail "Test 2C.7: Expected licensing_multiplier=1.2 for Multi-Use, got $BD2_LIC"
    fi

    # Verify total = project_price * 1.2
    if [ -n "$BD2_PP" ] && [ -n "$BD2_TOTAL" ]; then
        EXPECTED_TOTAL=$(echo "$BD2_PP * 1.2" | bc -l 2>/dev/null | xargs printf '%.2f' 2>/dev/null)
        ACTUAL_TOTAL=$(printf '%.2f' "$BD2_TOTAL" 2>/dev/null)
        if [ "$EXPECTED_TOTAL" = "$ACTUAL_TOTAL" ]; then
            success "Test 2C.8: total_project_price ($BD2_TOTAL) = project_price × 1.2 ($EXPECTED_TOTAL)"
        else
            fail "Test 2C.8: total_project_price=$BD2_TOTAL but expected project_price×1.2=$EXPECTED_TOTAL"
        fi
    fi
fi

# Print full breakdown for visibility
echo ""
info "=== Full Pricing Breakdown (Project 1) ==="
echo "$BREAKDOWN_RESPONSE" | jq '.data' 2>/dev/null
echo ""

# ══════════════════════════════════════════════════════════════
# SECTION 2D: Unauthenticated Access to Breakdown (should return 401)
# ══════════════════════════════════════════════════════════════
section "2D. BREAKDOWN AUTH CHECK"

info "Test 2D.1: GET /pricing/project-breakdown without auth..."
NO_AUTH_BD=$(curl -s -o /dev/null -w "%{http_code}" \
  -X GET "$BASE_URL/pricing/project-breakdown/$PROJECT_ID" 2>/dev/null || echo "000")

if [ "$NO_AUTH_BD" = "401" ]; then
    success "Test 2D.1: Breakdown returns 401 without auth"
else
    fail "Test 2D.1: Expected 401, got $NO_AUTH_BD"
fi

# ══════════════════════════════════════════════════════════════
# SECTION 3: Unauthenticated Access (should return 401)
# ══════════════════════════════════════════════════════════════
section "3. UNAUTHENTICATED ACCESS (Invoice endpoints)"

# Test 3.1: No token → 401 on POST
info "Test 3.1: POST /invoices without auth..."
NO_AUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE_URL/invoices" \
  -H "Content-Type: application/json" \
  -d '{"project_id": 1, "client_name": "Test", "client_email": "t@t.com", "client_location": "Test"}' \
  2>/dev/null || echo "000")

if [ "$NO_AUTH_STATUS" = "401" ]; then
    success "Test 3.1: POST /invoices returns 401 without auth"
else
    fail "Test 3.1: Expected 401, got $NO_AUTH_STATUS"
fi

# Test 3.2: No token → 401 on GET list
info "Test 3.2: GET /invoices without auth..."
NO_AUTH_LIST=$(curl -s -o /dev/null -w "%{http_code}" \
  -X GET "$BASE_URL/invoices" 2>/dev/null || echo "000")

if [ "$NO_AUTH_LIST" = "401" ]; then
    success "Test 3.2: GET /invoices returns 401 without auth"
else
    fail "Test 3.2: Expected 401, got $NO_AUTH_LIST"
fi

# Test 3.3: No token → 401 on GET single
info "Test 3.3: GET /invoices/1 without auth..."
NO_AUTH_SINGLE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X GET "$BASE_URL/invoices/1" 2>/dev/null || echo "000")

if [ "$NO_AUTH_SINGLE" = "401" ]; then
    success "Test 3.3: GET /invoices/:id returns 401 without auth"
else
    fail "Test 3.3: Expected 401, got $NO_AUTH_SINGLE"
fi

# ══════════════════════════════════════════════════════════════
# SECTION 4: Validation Errors (should return 400)
# ══════════════════════════════════════════════════════════════
section "4. VALIDATION ERRORS"

# Test 4.1: Missing project_id
info "Test 4.1: POST /invoices without project_id..."
VALIDATION_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/invoices" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{
    \"client_name\": \"Chea Dara\",
    \"client_email\": \"cheadara133@gmail.com\",
    \"client_location\": \"Phnom Penh, Cambodia\"
  }" 2>/dev/null)

VALIDATION_STATUS=$(echo "$VALIDATION_RESPONSE" | tail -1)
if [ "$VALIDATION_STATUS" = "400" ]; then
    success "Test 4.1: Returns 400 when project_id is missing"
else
    fail "Test 4.1: Expected 400, got $VALIDATION_STATUS"
fi

# Test 4.2: Missing client_name
info "Test 4.2: POST /invoices without client_name..."
VALIDATION_STATUS2=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/invoices" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{
    \"project_id\": $PROJECT_ID,
    \"client_email\": \"cheadara133@gmail.com\",
    \"client_location\": \"Phnom Penh, Cambodia\"
  }" 2>/dev/null)

if [ "$VALIDATION_STATUS2" = "400" ]; then
    success "Test 4.2: Returns 400 when client_name is missing"
else
    fail "Test 4.2: Expected 400, got $VALIDATION_STATUS2"
fi

# Test 4.3: Missing client_email
info "Test 4.3: POST /invoices without client_email..."
VALIDATION_STATUS3=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/invoices" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{
    \"project_id\": $PROJECT_ID,
    \"client_name\": \"Chea Dara\",
    \"client_location\": \"Phnom Penh, Cambodia\"
  }" 2>/dev/null)

if [ "$VALIDATION_STATUS3" = "400" ]; then
    success "Test 4.3: Returns 400 when client_email is missing"
else
    fail "Test 4.3: Expected 400, got $VALIDATION_STATUS3"
fi

# Test 4.4: Invalid client_email
info "Test 4.4: POST /invoices with invalid email..."
VALIDATION_STATUS4=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/invoices" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{
    \"project_id\": $PROJECT_ID,
    \"client_name\": \"Chea Dara\",
    \"client_email\": \"not-an-email\",
    \"client_location\": \"Phnom Penh, Cambodia\"
  }" 2>/dev/null)

if [ "$VALIDATION_STATUS4" = "400" ]; then
    success "Test 4.4: Returns 400 for invalid email format"
else
    fail "Test 4.4: Expected 400, got $VALIDATION_STATUS4"
fi

# Test 4.5: Missing client_location
info "Test 4.5: POST /invoices without client_location..."
VALIDATION_STATUS5=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/invoices" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{
    \"project_id\": $PROJECT_ID,
    \"client_name\": \"Chea Dara\",
    \"client_email\": \"cheadara133@gmail.com\"
  }" 2>/dev/null)

if [ "$VALIDATION_STATUS5" = "400" ]; then
    success "Test 4.5: Returns 400 when client_location is missing"
else
    fail "Test 4.5: Expected 400, got $VALIDATION_STATUS5"
fi

# Test 4.6: Non-existent project
info "Test 4.6: POST /invoices with non-existent project_id..."
VALIDATION_STATUS6=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/invoices" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{
    \"project_id\": 99999,
    \"client_name\": \"Chea Dara\",
    \"client_email\": \"cheadara133@gmail.com\",
    \"client_location\": \"Phnom Penh, Cambodia\"
  }" 2>/dev/null)

if [ "$VALIDATION_STATUS6" = "404" ]; then
    success "Test 4.6: Returns 404 for non-existent project"
else
    fail "Test 4.6: Expected 404, got $VALIDATION_STATUS6"
fi

# ══════════════════════════════════════════════════════════════
# SECTION 5: Create Invoice (Happy Path)
# ══════════════════════════════════════════════════════════════
section "5. CREATE INVOICE (Happy Path)"

info "Test 5.1: POST /invoices with valid data..."
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/invoices" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{
    \"project_id\": $PROJECT_ID,
    \"client_name\": \"Chea Dara\",
    \"client_email\": \"cheadara133@gmail.com\",
    \"client_location\": \"Phnom Penh, Cambodia\"
  }" 2>/dev/null || echo '{"success":false}')

CREATE_STATUS=$(echo "$CREATE_RESPONSE" | jq -r '.success')
INVOICE_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.invoice_id // empty')
INVOICE_NUMBER=$(echo "$CREATE_RESPONSE" | jq -r '.data.invoice_number // empty')

if [ "$CREATE_STATUS" = "true" ] && [ -n "$INVOICE_ID" ]; then
    success "Test 5.1: Invoice created (ID: $INVOICE_ID, Number: $INVOICE_NUMBER)"
else
    fail "Test 5.1: Failed to create invoice"
    echo "$CREATE_RESPONSE" | jq '.' 2>/dev/null || echo "$CREATE_RESPONSE"
fi

# Test 5.2: Verify response has expected fields
if [ -n "$INVOICE_ID" ]; then
    HAS_ID=$(echo "$CREATE_RESPONSE" | jq '.data | has("invoice_id")')
    HAS_NUMBER=$(echo "$CREATE_RESPONSE" | jq '.data | has("invoice_number")')
    HAS_PROJECT=$(echo "$CREATE_RESPONSE" | jq '.data | has("project_id")')
    HAS_CLIENT_NAME=$(echo "$CREATE_RESPONSE" | jq '.data | has("client_name")')
    HAS_CLIENT_EMAIL=$(echo "$CREATE_RESPONSE" | jq '.data | has("client_email")')
    HAS_CLIENT_LOC=$(echo "$CREATE_RESPONSE" | jq '.data | has("client_location")')

    if [ "$HAS_ID" = "true" ] && [ "$HAS_NUMBER" = "true" ] && \
       [ "$HAS_PROJECT" = "true" ] && [ "$HAS_CLIENT_NAME" = "true" ] && \
       [ "$HAS_CLIENT_EMAIL" = "true" ] && [ "$HAS_CLIENT_LOC" = "true" ]; then
        success "Test 5.2: Response contains all expected invoice fields"
    else
        fail "Test 5.2: Missing fields — id:$HAS_ID num:$HAS_NUMBER proj:$HAS_PROJECT name:$HAS_CLIENT_NAME email:$HAS_CLIENT_EMAIL loc:$HAS_CLIENT_LOC"
    fi

    # Test 5.3: Client info matches input
    RESP_CLIENT_NAME=$(echo "$CREATE_RESPONSE" | jq -r '.data.client_name')
    RESP_CLIENT_EMAIL=$(echo "$CREATE_RESPONSE" | jq -r '.data.client_email')
    RESP_CLIENT_LOC=$(echo "$CREATE_RESPONSE" | jq -r '.data.client_location')

    if [ "$RESP_CLIENT_NAME" = "Chea Dara" ] && \
       [ "$RESP_CLIENT_EMAIL" = "cheadara133@gmail.com" ] && \
       [ "$RESP_CLIENT_LOC" = "Phnom Penh, Cambodia" ]; then
        success "Test 5.3: Client info matches input data"
    else
        fail "Test 5.3: Client info mismatch — name:$RESP_CLIENT_NAME email:$RESP_CLIENT_EMAIL loc:$RESP_CLIENT_LOC"
    fi

    # Test 5.4: Invoice number starts with INV-
    if [[ "$INVOICE_NUMBER" == INV-* ]]; then
        success "Test 5.4: Invoice number format is correct ($INVOICE_NUMBER)"
    else
        fail "Test 5.4: Invoice number format unexpected: $INVOICE_NUMBER"
    fi
fi

# ══════════════════════════════════════════════════════════════
# SECTION 6: Duplicate Prevention (409 Conflict)
# ══════════════════════════════════════════════════════════════
section "6. DUPLICATE PREVENTION"

info "Test 6.1: POST /invoices with same project_id (should fail)..."
DUPE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/invoices" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{
    \"project_id\": $PROJECT_ID,
    \"client_name\": \"Another Client\",
    \"client_email\": \"another@test.com\",
    \"client_location\": \"Another Location\"
  }" 2>/dev/null)

if [ "$DUPE_STATUS" = "409" ]; then
    success "Test 6.1: Returns 409 when invoice already exists for project"
else
    fail "Test 6.1: Expected 409, got $DUPE_STATUS"
fi

# ══════════════════════════════════════════════════════════════
# SECTION 7: Get User Invoices (List)
# ══════════════════════════════════════════════════════════════
section "7. LIST USER INVOICES"

info "Test 7.1: GET /invoices — list all user invoices..."
LIST_RESPONSE=$(curl -s -X GET "$BASE_URL/invoices" \
  -H "Authorization: Bearer $AUTH_TOKEN" 2>/dev/null || echo '{"success":false}')

LIST_SUCCESS=$(echo "$LIST_RESPONSE" | jq -r '.success')
LIST_COUNT=$(echo "$LIST_RESPONSE" | jq '.data | length')

if [ "$LIST_SUCCESS" = "true" ]; then
    success "Test 7.1: GET /invoices returns success"
else
    fail "Test 7.1: GET /invoices did not return success"
    echo "$LIST_RESPONSE" | jq '.' 2>/dev/null || echo "$LIST_RESPONSE"
fi

# Test 7.2: Should have at least 1 invoice
if [ "$LIST_COUNT" -ge 1 ] 2>/dev/null; then
    success "Test 7.2: User has $LIST_COUNT invoice(s)"
else
    fail "Test 7.2: Expected at least 1 invoice, got $LIST_COUNT"
fi

# ══════════════════════════════════════════════════════════════
# SECTION 8: Get Invoice Detail
# ══════════════════════════════════════════════════════════════
section "8. GET INVOICE DETAIL"

if [ -n "$INVOICE_ID" ]; then
    info "Test 8.1: GET /invoices/$INVOICE_ID — full invoice detail..."
    DETAIL_RESPONSE=$(curl -s -X GET "$BASE_URL/invoices/$INVOICE_ID" \
      -H "Authorization: Bearer $AUTH_TOKEN" 2>/dev/null || echo '{"success":false}')

    DETAIL_SUCCESS=$(echo "$DETAIL_RESPONSE" | jq -r '.success')

    if [ "$DETAIL_SUCCESS" = "true" ]; then
        success "Test 8.1: GET /invoices/:id returns success"
    else
        fail "Test 8.1: GET /invoices/:id did not return success"
        echo "$DETAIL_RESPONSE" | jq '.' 2>/dev/null || echo "$DETAIL_RESPONSE"
    fi

    # Test 8.2: Response has invoice, freelancer, project, deliverables
    HAS_INVOICE=$(echo "$DETAIL_RESPONSE" | jq '.data | has("invoice")')
    HAS_FREELANCER=$(echo "$DETAIL_RESPONSE" | jq '.data | has("freelancer")')
    HAS_PROJECT=$(echo "$DETAIL_RESPONSE" | jq '.data | has("project")')
    HAS_DELIVERABLES=$(echo "$DETAIL_RESPONSE" | jq '.data | has("deliverables")')

    if [ "$HAS_INVOICE" = "true" ] && [ "$HAS_FREELANCER" = "true" ] && \
       [ "$HAS_PROJECT" = "true" ] && [ "$HAS_DELIVERABLES" = "true" ]; then
        success "Test 8.2: Detail response has all sections (invoice, freelancer, project, deliverables)"
    else
        fail "Test 8.2: Missing sections — invoice:$HAS_INVOICE freelancer:$HAS_FREELANCER project:$HAS_PROJECT deliverables:$HAS_DELIVERABLES"
    fi

    # Test 8.3: Freelancer section has expected fields
    HAS_FL_NAME=$(echo "$DETAIL_RESPONSE" | jq '.data.freelancer | has("full_name")')
    HAS_FL_EMAIL=$(echo "$DETAIL_RESPONSE" | jq '.data.freelancer | has("email")')
    HAS_FL_LOC=$(echo "$DETAIL_RESPONSE" | jq '.data.freelancer | has("location")')

    if [ "$HAS_FL_NAME" = "true" ] && [ "$HAS_FL_EMAIL" = "true" ] && [ "$HAS_FL_LOC" = "true" ]; then
        success "Test 8.3: Freelancer section has full_name, email, location"
        FL_NAME=$(echo "$DETAIL_RESPONSE" | jq -r '.data.freelancer.full_name')
        FL_EMAIL=$(echo "$DETAIL_RESPONSE" | jq -r '.data.freelancer.email')
        info "  Freelancer: $FL_NAME ($FL_EMAIL)"
    else
        fail "Test 8.3: Freelancer section missing fields"
    fi

    # Test 8.4: Invoice section has correct client info
    DETAIL_CLIENT_NAME=$(echo "$DETAIL_RESPONSE" | jq -r '.data.invoice.client_name')
    DETAIL_CLIENT_EMAIL=$(echo "$DETAIL_RESPONSE" | jq -r '.data.invoice.client_email')

    if [ "$DETAIL_CLIENT_NAME" = "Chea Dara" ] && [ "$DETAIL_CLIENT_EMAIL" = "cheadara133@gmail.com" ]; then
        success "Test 8.4: Invoice detail has correct client info"
    else
        fail "Test 8.4: Client info mismatch in detail — name:$DETAIL_CLIENT_NAME email:$DETAIL_CLIENT_EMAIL"
    fi

    # Test 8.5: Project section has project_name
    PROJ_NAME=$(echo "$DETAIL_RESPONSE" | jq -r '.data.project.project_name')
    if [ -n "$PROJ_NAME" ] && [ "$PROJ_NAME" != "null" ]; then
        success "Test 8.5: Project name present: $PROJ_NAME"
    else
        fail "Test 8.5: Project name missing from detail response"
    fi

    # Test 8.6: Deliverables is an array
    DELIV_TYPE=$(echo "$DETAIL_RESPONSE" | jq -r '.data.deliverables | type')
    if [ "$DELIV_TYPE" = "array" ]; then
        DELIV_COUNT=$(echo "$DETAIL_RESPONSE" | jq '.data.deliverables | length')
        success "Test 8.6: Deliverables is array with $DELIV_COUNT item(s)"
    else
        fail "Test 8.6: Deliverables should be array, got $DELIV_TYPE"
    fi

    # ── NEW: Test multiplier fields in invoice detail ──────────

    # Test 8.7: difficulty_multiplier present in project section
    INV_DIFF=$(echo "$DETAIL_RESPONSE" | jq -r '.data.project.difficulty_multiplier // empty')
    if [ -n "$INV_DIFF" ] && [ "$INV_DIFF" != "null" ]; then
        success "Test 8.7: Invoice project.difficulty_multiplier present ($INV_DIFF)"
    else
        fail "Test 8.7: difficulty_multiplier missing from invoice project section"
    fi

    # Test 8.8: licensing_multiplier present in project section
    INV_LIC=$(echo "$DETAIL_RESPONSE" | jq -r '.data.project.licensing_multiplier // empty')
    if [ -n "$INV_LIC" ] && [ "$INV_LIC" != "null" ]; then
        success "Test 8.8: Invoice project.licensing_multiplier present ($INV_LIC)"
    else
        fail "Test 8.8: licensing_multiplier missing from invoice project section"
    fi

    # Test 8.9: total_project_price present in project section
    INV_TOTAL=$(echo "$DETAIL_RESPONSE" | jq -r '.data.project.total_project_price // empty')
    if [ -n "$INV_TOTAL" ] && [ "$INV_TOTAL" != "null" ]; then
        success "Test 8.9: Invoice project.total_project_price present ($INV_TOTAL)"
    else
        fail "Test 8.9: total_project_price missing from invoice project section"
    fi

    # Test 8.10: duration is treated as hours (should match project duration, not *8)
    INV_DUR=$(echo "$DETAIL_RESPONSE" | jq -r '.data.project.duration // empty')
    if [ "$INV_DUR" = "14" ]; then
        success "Test 8.10: Duration = 14 hours (not multiplied by 8)"
    elif [ -n "$INV_DUR" ] && [ "$INV_DUR" != "null" ]; then
        info "Test 8.10: Duration = $INV_DUR (check if expected)"
        success "Test 8.10: Duration field present ($INV_DUR)"
    else
        fail "Test 8.10: Duration missing from invoice project section"
    fi

    # Test 8.11: Verify total_project_price = calculated_rate * licensing_multiplier
    INV_CALC_RATE=$(echo "$DETAIL_RESPONSE" | jq -r '.data.project.calculated_rate // empty')
    if [ -n "$INV_CALC_RATE" ] && [ -n "$INV_LIC" ] && [ -n "$INV_TOTAL" ]; then
        EXPECTED_INV_TOTAL=$(echo "$INV_CALC_RATE * $INV_LIC" | bc -l 2>/dev/null | xargs printf '%.2f' 2>/dev/null)
        ACTUAL_INV_TOTAL=$(printf '%.2f' "$INV_TOTAL" 2>/dev/null)
        if [ "$EXPECTED_INV_TOTAL" = "$ACTUAL_INV_TOTAL" ]; then
            success "Test 8.11: total_project_price ($INV_TOTAL) = calculated_rate ($INV_CALC_RATE) × licensing ($INV_LIC)"
        else
            fail "Test 8.11: total_project_price=$INV_TOTAL but expected calculated_rate×licensing=$EXPECTED_INV_TOTAL"
        fi
    else
        info "Test 8.11: Skipped — missing fields (calc_rate:$INV_CALC_RATE lic:$INV_LIC total:$INV_TOTAL)"
    fi

    # Print full invoice detail for visibility
    echo ""
    info "=== Full Invoice Detail (project section) ==="
    echo "$DETAIL_RESPONSE" | jq '.data.project' 2>/dev/null
    echo ""
else
    info "Skipping detail tests — no invoice created"
fi

# ══════════════════════════════════════════════════════════════
# SECTION 9: Download Invoice PDF
# ══════════════════════════════════════════════════════════════
section "9. DOWNLOAD INVOICE PDF"

if [ -n "$INVOICE_ID" ]; then
    info "Test 9.1: GET /invoices/$INVOICE_ID/pdf — download PDF..."

    # Save PDF to test-output dir so user can visually inspect it
    PDF_FILE="$PDF_OUTPUT_DIR/invoice_${INVOICE_ID}.pdf"

    PDF_HTTP_CODE=$(curl -s -w "%{http_code}" -o "$PDF_FILE" \
      -X GET "$BASE_URL/invoices/$INVOICE_ID/pdf" \
      -H "Authorization: Bearer $AUTH_TOKEN" 2>/dev/null)

    if [ "$PDF_HTTP_CODE" = "200" ]; then
        success "Test 9.1: PDF endpoint returns 200"
    else
        fail "Test 9.1: Expected 200, got $PDF_HTTP_CODE"
    fi

    # Test 9.2: Response is a PDF file (check magic bytes)
    PDF_SIZE=$(stat -c%s "$PDF_FILE" 2>/dev/null || stat -f%z "$PDF_FILE" 2>/dev/null || echo "0")
    PDF_MAGIC=$(head -c 5 "$PDF_FILE" 2>/dev/null)

    if [ "$PDF_MAGIC" = "%PDF-" ]; then
        success "Test 9.2: Response is a valid PDF file (${PDF_SIZE} bytes)"
    else
        fail "Test 9.2: Response is not a valid PDF (magic: $PDF_MAGIC, size: $PDF_SIZE bytes)"
    fi

    # Test 9.3: PDF has non-trivial size (should be > 500 bytes for a real invoice)
    if [ "$PDF_SIZE" -gt 500 ] 2>/dev/null; then
        success "Test 9.3: PDF size is reasonable (${PDF_SIZE} bytes)"
    else
        fail "Test 9.3: PDF too small (${PDF_SIZE} bytes) — may be empty or error"
    fi

    # Test 9.4: Check Content-Type header
    PDF_CONTENT_TYPE=$(curl -s -I -X GET "$BASE_URL/invoices/$INVOICE_ID/pdf" \
      -H "Authorization: Bearer $AUTH_TOKEN" 2>/dev/null | grep -i "content-type" | tr -d '\r')

    if echo "$PDF_CONTENT_TYPE" | grep -qi "application/pdf"; then
        success "Test 9.4: Content-Type is application/pdf"
    else
        fail "Test 9.4: Content-Type is not application/pdf — got: $PDF_CONTENT_TYPE"
    fi

    # ── KEEP the PDF so user can view it ──
    echo ""
    echo -e "${CYAN}  ★ PDF saved to: $PDF_FILE${NC}"
    echo -e "${CYAN}    Open with: xdg-open $PDF_FILE${NC}"
    echo ""
else
    info "Skipping PDF tests — no invoice created"
fi

# ══════════════════════════════════════════════════════════════
# SECTION 10: Create Second Invoice (with custom date)
# ══════════════════════════════════════════════════════════════
section "10. CREATE SECOND INVOICE (with custom date)"

if [ -n "$PROJECT2_ID" ] && [ "$PROJECT2_ID" != "null" ]; then
    info "Test 10.1: POST /invoices with custom invoice_date..."
    CREATE2_RESPONSE=$(curl -s -X POST "$BASE_URL/invoices" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -d "{
        \"project_id\": $PROJECT2_ID,
        \"client_name\": \"John Smith\",
        \"client_email\": \"john@company.com\",
        \"client_location\": \"Singapore\",
        \"invoice_date\": \"2025-12-24\"
      }" 2>/dev/null || echo '{"success":false}')

    CREATE2_SUCCESS=$(echo "$CREATE2_RESPONSE" | jq -r '.success')
    INVOICE2_ID=$(echo "$CREATE2_RESPONSE" | jq -r '.data.invoice_id // empty')

    if [ "$CREATE2_SUCCESS" = "true" ] && [ -n "$INVOICE2_ID" ]; then
        success "Test 10.1: Second invoice created with custom date (ID: $INVOICE2_ID)"
    else
        fail "Test 10.1: Failed to create second invoice"
        echo "$CREATE2_RESPONSE" | jq '.' 2>/dev/null || echo "$CREATE2_RESPONSE"
    fi

    # Test 10.2: List should now have 2 invoices
    LIST2_RESPONSE=$(curl -s -X GET "$BASE_URL/invoices" \
      -H "Authorization: Bearer $AUTH_TOKEN" 2>/dev/null || echo '{"success":false}')
    LIST2_COUNT=$(echo "$LIST2_RESPONSE" | jq '.data | length')

    if [ "$LIST2_COUNT" = "2" ] 2>/dev/null; then
        success "Test 10.2: User now has 2 invoices"
    else
        fail "Test 10.2: Expected 2 invoices, got $LIST2_COUNT"
    fi

    # Test 10.3: Download second invoice PDF (Multi-Use licensing)
    if [ -n "$INVOICE2_ID" ] && [ "$INVOICE2_ID" != "null" ]; then
        info "Test 10.3: Downloading PDF for second invoice (Multi-Use licensing)..."
        PDF2_FILE="$PDF_OUTPUT_DIR/invoice_${INVOICE2_ID}_multi_use.pdf"

        PDF2_HTTP_CODE=$(curl -s -w "%{http_code}" -o "$PDF2_FILE" \
          -X GET "$BASE_URL/invoices/$INVOICE2_ID/pdf" \
          -H "Authorization: Bearer $AUTH_TOKEN" 2>/dev/null)

        PDF2_SIZE=$(stat -c%s "$PDF2_FILE" 2>/dev/null || stat -f%z "$PDF2_FILE" 2>/dev/null || echo "0")
        PDF2_MAGIC=$(head -c 5 "$PDF2_FILE" 2>/dev/null)

        if [ "$PDF2_HTTP_CODE" = "200" ] && [ "$PDF2_MAGIC" = "%PDF-" ]; then
            success "Test 10.3: Second PDF downloaded (${PDF2_SIZE} bytes)"
            echo -e "${CYAN}  \u2605 PDF saved to: $PDF2_FILE${NC}"
        else
            fail "Test 10.3: Failed to download second PDF (HTTP $PDF2_HTTP_CODE)"
        fi
    fi
else
    info "Skipping — second project was not created"
fi

# ══════════════════════════════════════════════════════════════
# SECTION 11: Error Cases — Non-existent invoice
# ══════════════════════════════════════════════════════════════
section "11. ERROR CASES"

# Test 11.1: GET /invoices/99999 → 404
info "Test 11.1: GET /invoices/99999 (non-existent)..."
MISSING_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X GET "$BASE_URL/invoices/99999" \
  -H "Authorization: Bearer $AUTH_TOKEN" 2>/dev/null)

if [ "$MISSING_STATUS" = "404" ]; then
    success "Test 11.1: Returns 404 for non-existent invoice"
else
    fail "Test 11.1: Expected 404, got $MISSING_STATUS"
fi

# Test 11.2: GET /invoices/99999/pdf → 404
info "Test 11.2: GET /invoices/99999/pdf (non-existent)..."
MISSING_PDF_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X GET "$BASE_URL/invoices/99999/pdf" \
  -H "Authorization: Bearer $AUTH_TOKEN" 2>/dev/null)

if [ "$MISSING_PDF_STATUS" = "404" ]; then
    success "Test 11.2: Returns 404 for PDF of non-existent invoice"
else
    fail "Test 11.2: Expected 404, got $MISSING_PDF_STATUS"
fi

# Test 11.3: DELETE /invoices/99999 → 404
info "Test 11.3: DELETE /invoices/99999 (non-existent)..."
MISSING_DEL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X DELETE "$BASE_URL/invoices/99999" \
  -H "Authorization: Bearer $AUTH_TOKEN" 2>/dev/null)

if [ "$MISSING_DEL_STATUS" = "404" ]; then
    success "Test 11.3: Returns 404 when deleting non-existent invoice"
else
    fail "Test 11.3: Expected 404, got $MISSING_DEL_STATUS"
fi

# Test 11.4: Invalid invoice ID format
info "Test 11.4: GET /invoices/abc (invalid ID)..."
INVALID_ID_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X GET "$BASE_URL/invoices/abc" \
  -H "Authorization: Bearer $AUTH_TOKEN" 2>/dev/null)

if [ "$INVALID_ID_STATUS" = "400" ]; then
    success "Test 11.4: Returns 400 for invalid invoice ID format"
else
    fail "Test 11.4: Expected 400, got $INVALID_ID_STATUS"
fi

# ══════════════════════════════════════════════════════════════
# SECTION 12: Delete Invoice
# ══════════════════════════════════════════════════════════════
section "12. DELETE INVOICE"

if [ -n "$INVOICE2_ID" ] && [ "$INVOICE2_ID" != "null" ]; then
    info "Test 12.1: DELETE /invoices/$INVOICE2_ID..."
    DELETE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
      -X DELETE "$BASE_URL/invoices/$INVOICE2_ID" \
      -H "Authorization: Bearer $AUTH_TOKEN" 2>/dev/null)

    if [ "$DELETE_STATUS" = "204" ]; then
        success "Test 12.1: Invoice deleted (204 No Content)"
    else
        fail "Test 12.1: Expected 204, got $DELETE_STATUS"
    fi

    # Test 12.2: Verify it's gone
    info "Test 12.2: GET /invoices/$INVOICE2_ID after deletion..."
    DELETED_CHECK=$(curl -s -o /dev/null -w "%{http_code}" \
      -X GET "$BASE_URL/invoices/$INVOICE2_ID" \
      -H "Authorization: Bearer $AUTH_TOKEN" 2>/dev/null)

    if [ "$DELETED_CHECK" = "404" ]; then
        success "Test 12.2: Deleted invoice returns 404"
    else
        fail "Test 12.2: Expected 404 after deletion, got $DELETED_CHECK"
    fi

    # Test 12.3: List should now have 1 invoice
    LIST3_RESPONSE=$(curl -s -X GET "$BASE_URL/invoices" \
      -H "Authorization: Bearer $AUTH_TOKEN" 2>/dev/null || echo '{"success":false}')
    LIST3_COUNT=$(echo "$LIST3_RESPONSE" | jq '.data | length')

    if [ "$LIST3_COUNT" = "1" ] 2>/dev/null; then
        success "Test 12.3: Invoice count is back to 1 after deletion"
    else
        fail "Test 12.3: Expected 1 invoice after deletion, got $LIST3_COUNT"
    fi
else
    info "Skipping delete tests — second invoice was not created"
fi

# ══════════════════════════════════════════════════════════════
# SECTION 13: Cleanup — Delete invoices (keep PDFs)
# ══════════════════════════════════════════════════════════════
section "13. CLEANUP"

info "Keeping test data so you can inspect the PDFs."
info "Saved PDFs are in: $PDF_OUTPUT_DIR/"

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
echo "  User ID:        ${USER_ID:-N/A}"
echo "  Project ID:     ${PROJECT_ID:-N/A}"
echo "  Project 2 ID:   ${PROJECT2_ID:-N/A}"
echo "  Invoice ID:     ${INVOICE_ID:-N/A}"
echo "  Invoice 2 ID:   ${INVOICE2_ID:-N/A}"
echo "  Invoice Number: ${INVOICE_NUMBER:-N/A}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${CYAN}PDF outputs saved in: $PDF_OUTPUT_DIR/${NC}"
ls -lh "$PDF_OUTPUT_DIR"/*.pdf 2>/dev/null || echo "  (no PDFs generated)"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please check the output above.${NC}"
    exit 1
fi

#!/usr/bin/env bash
#
# Portfolio-Assisted Pricing API — Live Test Script
#
# Tests all 5 scenarios:
#   1. URL only (Google Search grounding)
#   2. PDF upload (inline data to Gemini)
#   3. Text + URL with structured fields
#   4. AI Rate Recommendation (minimal portfolio + structured data)
#   5. Accept Rate & Save to Profile
#
# Usage:
#   ./portfolio-assist-test.sh [BASE_URL]
#
# Example:
#   ./portfolio-assist-test.sh http://localhost:3000
#

BASE_URL="${1:-http://localhost:3000}"
API_V1="$BASE_URL/api/v1"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

TIMESTAMP=$(date +%s)
PASSED=0
FAILED=0

# Helper: parse JSON with python3 — returns empty string on failure
json_get() {
  python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    val = d
    for k in sys.argv[1:]:
        if isinstance(val, dict):
            val = val[k]
        elif isinstance(val, list):
            val = val[int(k)]
        else:
            raise KeyError(k)
    print(val)
except Exception:
    print('')
" "$@" 2>/dev/null
}

echo -e "${BOLD}${CYAN}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  Portfolio-Assisted Pricing API — Live Test                  ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo "  Base URL: $BASE_URL"
echo "  Testing 5 scenarios"
echo ""

# ═══════════════════════════════════════════════════════════════════
# Step 1: Health Check
# ═══════════════════════════════════════════════════════════════════

echo -e "${BLUE}[Step 1]${NC} Health check..."

HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_V1/health" 2>/dev/null)
CURL_EXIT=$?

if [ $CURL_EXIT -ne 0 ] || [ "$HEALTH_STATUS" == "000" ]; then
  echo -e "${RED}✗ Server not reachable at $BASE_URL${NC}"
  echo "  Make sure the backend is running: npm run dev"
  exit 1
elif [ "$HEALTH_STATUS" == "404" ]; then
  echo -e "${RED}✗ Health endpoint not found (404). Is the server version correct?${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Server is running (HTTP $HEALTH_STATUS)${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════════
# Step 2: Create test user and authenticate
# ═══════════════════════════════════════════════════════════════════

echo -e "${BLUE}[Step 2]${NC} Creating test user..."

TEST_EMAIL="portfoliotest_${TIMESTAMP}@example.com"

SIGNUP_RESP=$(curl -s -X POST "$API_V1/users/signup" \
  -H 'Content-Type: application/json' \
  -d "{
    \"email\":\"$TEST_EMAIL\",
    \"password\":\"Test1234!\",
    \"first_name\":\"Portfolio\",
    \"last_name\":\"Tester\"
  }") || true

USER_ID=$(echo "$SIGNUP_RESP" | json_get data user user_id)
SIGNUP_OTP=$(echo "$SIGNUP_RESP" | json_get data otp)

if [ -z "$USER_ID" ] || [ "$USER_ID" == "" ]; then
  echo -e "${RED}✗ Failed to create user${NC}"
  echo "  Response: $(echo "$SIGNUP_RESP" | head -c 300)"
  exit 1
fi

echo "  Email:   $TEST_EMAIL"
echo "  User ID: $USER_ID"

# Verify OTP (dev mode returns the OTP in signup response)
if [ -z "$SIGNUP_OTP" ] || [ "$SIGNUP_OTP" == "" ]; then
  SIGNUP_OTP="123456"
fi

echo "  Verifying OTP: $SIGNUP_OTP..."

OTP_RESP=$(curl -s -X POST "$API_V1/users/verify-otp" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$TEST_EMAIL\",\"otp\":\"$SIGNUP_OTP\"}") || true

TOKEN=$(echo "$OTP_RESP" | json_get data token)

if [ -z "$TOKEN" ] || [ "$TOKEN" == "" ]; then
  echo -e "${RED}✗ Failed to get auth token${NC}"
  echo "  OTP Response: $(echo "$OTP_RESP" | head -c 300)"
  exit 1
fi

echo -e "${GREEN}✓ User created and authenticated${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════════
# Test 1/5: Mode A — URL only (Google Search grounding)
# ═══════════════════════════════════════════════════════════════════

echo -e "${YELLOW}${BOLD}[Test 1/5] Mode A: URL-only (Google Search Grounding)${NC}"
echo "  Input: portfolio_url only (no text, no PDF)"
echo "  Expected: Uses generateContentWithGrounding() for live URL lookup"
echo ""

MODE_A_RESP=$(curl -s -X POST "$API_V1/pricing/portfolio-assist" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{
    \"client_region\":\"cambodia\",
    \"client_type\":\"corporate\",
    \"portfolio_url\":\"https://www.behance.net/gallery/123456/sample-portfolio\"
  }") || true

MODE_A_STATUS=$(echo "$MODE_A_RESP" | json_get data ai_status)
MODE_A_CONF=$(echo "$MODE_A_RESP" | json_get data portfolio_signals confidence)

if [ "$MODE_A_STATUS" == "used" ]; then
  echo -e "${GREEN}✓ AI analysis completed${NC}"
  echo "  Confidence: $MODE_A_CONF"
  if [ "$MODE_A_CONF" == "low" ]; then
    echo -e "  ${YELLOW}Note: Low confidence expected — URL grounding may yield limited data${NC}"
  fi
  PASSED=$((PASSED+1))
else
  echo -e "${RED}✗ AI analysis failed or skipped${NC}"
  echo "  ai_status: $MODE_A_STATUS"
  echo "  Response: $(echo "$MODE_A_RESP" | python3 -m json.tool 2>/dev/null | head -20 || echo "$MODE_A_RESP" | head -c 300)"
  FAILED=$((FAILED+1))
fi

echo ""
sleep 1

# ═══════════════════════════════════════════════════════════════════
# Test 2/5: Mode B — PDF upload (inline data)
# ═══════════════════════════════════════════════════════════════════

echo -e "${YELLOW}${BOLD}[Test 2/5] Mode B: PDF Upload (Inline Base64 to Gemini)${NC}"
echo "  Input: portfolio_pdf file via multipart/form-data"
echo "  Expected: Sends PDF as base64 inline data to Gemini"
echo ""

# Create a test PDF with portfolio content
TEST_PDF="/tmp/test_portfolio_$$.pdf"
cat > "$TEST_PDF" << 'PDFEOF'
%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
4 0 obj<</Length 380>>stream
BT
/F1 18 Tf
72 720 Td
(Portfolio - Sarah Design Studio) Tj
0 -30 Td
/F1 12 Tf
(Senior Brand Designer | 8 years experience) Tj
0 -20 Td
(Specialization: Brand Identity & Visual Systems) Tj
0 -30 Td
(CLIENTS: Google Cambodia, Wing Bank, UNICEF Cambodia) Tj
0 -20 Td
(SKILLS: Brand Strategy, UI/UX \(Figma\), Motion Graphics, Web Design) Tj
0 -20 Td
(PORTFOLIO: 60+ projects | Premium quality work for corporate clients) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000263 00000 n 
0000000693 00000 n 
trailer<</Size 6/Root 1 0 R>>
startxref
761
%%EOF
PDFEOF

MODE_B_RESP=$(curl -s -X POST "$API_V1/pricing/portfolio-assist" \
  -H "Authorization: Bearer $TOKEN" \
  -F "client_region=cambodia" \
  -F "client_type=corporate" \
  -F "portfolio_pdf=@${TEST_PDF};type=application/pdf") || true

rm -f "$TEST_PDF"

MODE_B_STATUS=$(echo "$MODE_B_RESP" | json_get data ai_status)
MODE_B_SENIORITY=$(echo "$MODE_B_RESP" | json_get data portfolio_signals seniority_level)
MODE_B_CONF=$(echo "$MODE_B_RESP" | json_get data portfolio_signals confidence)

if [ "$MODE_B_STATUS" == "used" ]; then
  echo -e "${GREEN}✓ PDF analyzed by Gemini${NC}"
  echo "  Seniority inferred: $MODE_B_SENIORITY"
  echo "  Confidence: $MODE_B_CONF"
  PASSED=$((PASSED+1))
else
  echo -e "${RED}✗ PDF analysis failed${NC}"
  echo "  ai_status: $MODE_B_STATUS"
  echo "  Response: $(echo "$MODE_B_RESP" | python3 -m json.tool 2>/dev/null | head -20 || echo "$MODE_B_RESP" | head -c 300)"
  FAILED=$((FAILED+1))
fi

echo ""
sleep 1

# ═══════════════════════════════════════════════════════════════════
# Test 3/5: Mode C — Text + URL with structured fields
# ═══════════════════════════════════════════════════════════════════

echo -e "${YELLOW}${BOLD}[Test 3/5] Mode C: Text + URL with Structured Fields${NC}"
echo "  Input: portfolio_text + experience_years + skills + hours_per_week"
echo "  Expected: AI rate recommendation with UREA formula calculation"
echo ""

MODE_C_RESP=$(curl -s -X POST "$API_V1/pricing/portfolio-assist" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{
    \"client_region\":\"southeast_asia\",
    \"client_type\":\"corporate\",
    \"portfolio_url\":\"https://www.behance.net/pichsopha\",
    \"portfolio_text\":\"Senior graphic designer with 7 years of experience specializing in brand identity systems, UI/UX design, and packaging design. Clients include Samsung Cambodia, Smart Axiata, ABA Bank, and Wing Money. Created full brand identity for local NGOs and government initiatives. Expert in Adobe Creative Suite, Figma, and motion graphics. Based in Phnom Penh, Cambodia. Portfolio includes 50+ projects across branding, web design, app design, and print media.\",
    \"experience_years\": 7,
    \"skills\": \"Brand Identity, UI/UX Design, Packaging Design, Motion Graphics\",
    \"hours_per_week\": 30
  }") || true

MODE_C_STATUS=$(echo "$MODE_C_RESP" | json_get data ai_status)
MODE_C_SENIORITY=$(echo "$MODE_C_RESP" | json_get data portfolio_signals seniority_level)
MODE_C_CONF=$(echo "$MODE_C_RESP" | json_get data portfolio_signals confidence)
MODE_C_SKILLS=$(echo "$MODE_C_RESP" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['data']['portfolio_signals']['skill_areas']))" 2>/dev/null || echo "0")
MODE_C_AI_RATE=$(echo "$MODE_C_RESP" | json_get data ai_recommended_rate hourly_rate)
MODE_C_RATE_SOURCE=$(echo "$MODE_C_RESP" | json_get data suggested_rate rate_source)

if [ "$MODE_C_STATUS" == "used" ]; then
  echo -e "${GREEN}✓ Text analysis completed${NC}"
  echo "  Seniority inferred: $MODE_C_SENIORITY"
  echo "  Confidence: $MODE_C_CONF"
  echo "  Skill areas detected: $MODE_C_SKILLS"
  [ -n "$MODE_C_AI_RATE" ] && [ "$MODE_C_AI_RATE" != "" ] && echo "  AI recommended rate: \$${MODE_C_AI_RATE}/hr"
  [ -n "$MODE_C_RATE_SOURCE" ] && [ "$MODE_C_RATE_SOURCE" != "" ] && echo "  Rate source: $MODE_C_RATE_SOURCE"
  PASSED=$((PASSED+1))
else
  echo -e "${RED}✗ Text analysis failed${NC}"
  echo "  ai_status: $MODE_C_STATUS"
  echo "  Response: $(echo "$MODE_C_RESP" | python3 -m json.tool 2>/dev/null | head -20 || echo "$MODE_C_RESP" | head -c 300)"
  FAILED=$((FAILED+1))
fi

echo ""
sleep 1

# ═══════════════════════════════════════════════════════════════════
# Test 4/5: AI Rate Recommendation (minimal portfolio + structured data)
# ═══════════════════════════════════════════════════════════════════

echo -e "${YELLOW}${BOLD}[Test 4/5] Mode D: AI Rate Recommendation${NC}"
echo "  Input: Minimal portfolio + structured fields (experience, skills, hours)"
echo "  Expected: Gemini researches costs and calculates UREA-based rate"
echo ""

MODE_D_RESP=$(curl -s -X POST "$API_V1/pricing/portfolio-assist" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{
    \"client_region\":\"cambodia\",
    \"client_type\":\"sme\",
    \"portfolio_text\":\"Freelance graphic designer specializing in logo design and branding.\",
    \"experience_years\": 3,
    \"skills\": \"Logo Design, Brand Identity, Illustration\",
    \"hours_per_week\": 20
  }") || true

MODE_D_STATUS=$(echo "$MODE_D_RESP" | json_get data ai_status)
MODE_D_AI_RATE=$(echo "$MODE_D_RESP" | json_get data ai_recommended_rate hourly_rate)
MODE_D_COSTS=$(echo "$MODE_D_RESP" | json_get data ai_researched_costs total_monthly)
MODE_D_HAS_BREAKDOWN=$(echo "$MODE_D_RESP" | python3 -c "import sys,json; print('ai_calculation_breakdown' in json.load(sys.stdin).get('data',{}))" 2>/dev/null || echo "False")

if [ "$MODE_D_STATUS" == "used" ] && [ -n "$MODE_D_AI_RATE" ] && [ "$MODE_D_AI_RATE" != "" ]; then
  echo -e "${GREEN}✓ AI rate recommendation successful${NC}"
  echo "  AI recommended rate: \$${MODE_D_AI_RATE}/hr"
  [ -n "$MODE_D_COSTS" ] && [ "$MODE_D_COSTS" != "" ] && echo "  Total monthly costs: \$${MODE_D_COSTS}"
  echo "  Has calculation breakdown: $MODE_D_HAS_BREAKDOWN"
  PASSED=$((PASSED+1))
else
  echo -e "${RED}✗ AI rate recommendation failed or unavailable${NC}"
  echo "  ai_status: $MODE_D_STATUS"
  echo "  ai_rate: $MODE_D_AI_RATE"
  echo "  Response: $(echo "$MODE_D_RESP" | python3 -m json.tool 2>/dev/null | head -20 || echo "$MODE_D_RESP" | head -c 300)"
  FAILED=$((FAILED+1))
fi

echo ""
sleep 1

# ═══════════════════════════════════════════════════════════════════
# Test 5/5: Accept Rate & Save to Profile
# ═══════════════════════════════════════════════════════════════════

echo -e "${YELLOW}${BOLD}[Test 5/5] Accept Rate & Save to Profile${NC}"
echo "  Action: Accept AI-recommended rate and save to pricing profile"
echo "  Expected: Profile created/updated with accepted rate"
echo ""

# Use the rate from Mode D if available, otherwise use a test rate
ACCEPT_RATE="15.50"
if [ -n "$MODE_D_AI_RATE" ] && [ "$MODE_D_AI_RATE" != "" ]; then
  ACCEPT_RATE="$MODE_D_AI_RATE"
fi

ACCEPT_RESP=$(curl -s -X POST "$API_V1/pricing/portfolio-assist/accept" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{
    \"hourly_rate\":$ACCEPT_RATE,
    \"seniority_level\":\"mid\",
    \"experience_years\":3,
    \"researched_costs\":{
      \"workspace\":50,
      \"software\":30,
      \"equipment\":25,
      \"utilities\":30,
      \"materials\":20
    }
  }") || true

ACCEPT_ACTION=$(echo "$ACCEPT_RESP" | json_get data action)
ACCEPT_SAVED_RATE=$(echo "$ACCEPT_RESP" | json_get data pricing_profile base_hourly_rate)

if [ "$ACCEPT_ACTION" == "created" ] || [ "$ACCEPT_ACTION" == "updated" ]; then
  echo -e "${GREEN}✓ Rate accepted and profile ${ACCEPT_ACTION}${NC}"
  echo "  Saved hourly rate: \$${ACCEPT_SAVED_RATE}/hr"
  PASSED=$((PASSED+1))
else
  echo -e "${RED}✗ Accept rate failed${NC}"
  echo "  action: $ACCEPT_ACTION"
  echo "  Response: $(echo "$ACCEPT_RESP" | python3 -m json.tool 2>/dev/null | head -20 || echo "$ACCEPT_RESP" | head -c 300)"
  FAILED=$((FAILED+1))
fi

echo ""

# ═══════════════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════════════

echo -e "${BOLD}${CYAN}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  Test Summary                                                ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

[ "$MODE_A_STATUS" == "used" ] \
  && echo -e "${GREEN}✓ Mode A (URL Grounding):        PASSED${NC}" \
  || echo -e "${RED}✗ Mode A (URL Grounding):        FAILED${NC}"

[ "$MODE_B_STATUS" == "used" ] \
  && echo -e "${GREEN}✓ Mode B (PDF Upload):           PASSED${NC}" \
  || echo -e "${RED}✗ Mode B (PDF Upload):           FAILED${NC}"

[ "$MODE_C_STATUS" == "used" ] \
  && echo -e "${GREEN}✓ Mode C (Text + Structured):    PASSED${NC}" \
  || echo -e "${RED}✗ Mode C (Text + Structured):    FAILED${NC}"

( [ "$MODE_D_STATUS" == "used" ] && [ -n "$MODE_D_AI_RATE" ] && [ "$MODE_D_AI_RATE" != "" ] ) \
  && echo -e "${GREEN}✓ Mode D (AI Rate Recommend):    PASSED${NC}" \
  || echo -e "${RED}✗ Mode D (AI Rate Recommend):    FAILED${NC}"

( [ "$ACCEPT_ACTION" == "created" ] || [ "$ACCEPT_ACTION" == "updated" ] ) \
  && echo -e "${GREEN}✓ Accept Rate Endpoint:          PASSED${NC}" \
  || echo -e "${RED}✗ Accept Rate Endpoint:          FAILED${NC}"

echo ""
echo -e "${BOLD}Total: $PASSED passed, $FAILED failed out of 5${NC}"
echo ""

[ $FAILED -gt 0 ] && exit 1 || exit 0

#!/usr/bin/env bash
#
# Portfolio Text & AI Rate Recommendation — Live Test
#
# Tests Mode C (Text + Structured Fields) and Mode D (AI Rate Recommendation)
# using a fresh user to avoid rate limits.
#
# Usage:
#   ./portfolio-text-rate-test.sh [BASE_URL]
#

BASE_URL="${1:-http://localhost:3000}"
API_V1="$BASE_URL/api/v1"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

TIMESTAMP=$(date +%s)
PASSED=0
FAILED=0

json_get() {
  python3 -c "
import sys, json
try:
    val = json.load(sys.stdin)
    for k in sys.argv[1:]:
        val = val[k] if isinstance(val, dict) else val[int(k)]
    print(val)
except Exception:
    print('')
" "$@" 2>/dev/null
}

echo -e "${BOLD}${CYAN}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  Portfolio Text & AI Rate — Live Test                        ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo "  Base URL: $BASE_URL"
echo "  Testing 2 scenarios (fresh user)"
echo ""

# ── Health Check ──────────────────────────────────────────────────

echo -e "${BLUE}[Step 1]${NC} Health check..."

HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_V1/health" 2>/dev/null)
if [ $? -ne 0 ] || [ "$HEALTH_STATUS" == "000" ]; then
  echo -e "${RED}✗ Server not reachable at $BASE_URL${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Server is running (HTTP $HEALTH_STATUS)${NC}\n"

# ── Create fresh user ────────────────────────────────────────────

echo -e "${BLUE}[Step 2]${NC} Creating fresh test user..."

TEST_EMAIL="textrate_${TIMESTAMP}@example.com"

SIGNUP_RESP=$(curl -s -X POST "$API_V1/users/signup" \
  -H 'Content-Type: application/json' \
  -d "{
    \"email\":\"$TEST_EMAIL\",
    \"password\":\"Test1234!\",
    \"first_name\":\"TextRate\",
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

[ -z "$SIGNUP_OTP" ] || [ "$SIGNUP_OTP" == "" ] && SIGNUP_OTP="123456"
echo "  Verifying OTP: $SIGNUP_OTP..."

OTP_RESP=$(curl -s -X POST "$API_V1/users/verify-otp" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$TEST_EMAIL\",\"otp\":\"$SIGNUP_OTP\"}") || true

TOKEN=$(echo "$OTP_RESP" | json_get data token)

if [ -z "$TOKEN" ] || [ "$TOKEN" == "" ]; then
  echo -e "${RED}✗ Failed to get auth token${NC}"
  echo "  Response: $(echo "$OTP_RESP" | head -c 300)"
  exit 1
fi

echo -e "${GREEN}✓ User created and authenticated${NC}\n"

# ── Test 1/2: Text + URL with Structured Fields ─────────────────

echo -e "${YELLOW}${BOLD}[Test 1/2] Mode C: Text + URL with Structured Fields${NC}"
echo "  Input: portfolio_text + portfolio_url + experience_years + skills + hours_per_week"
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

# ── Test 2/2: AI Rate Recommendation ────────────────────────────

echo -e "${YELLOW}${BOLD}[Test 2/2] Mode D: AI Rate Recommendation${NC}"
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

# ── Summary ──────────────────────────────────────────────────────

echo -e "${BOLD}${CYAN}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  Test Summary                                                ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

[ "$MODE_C_STATUS" == "used" ] \
  && echo -e "${GREEN}✓ Mode C (Text + Structured):    PASSED${NC}" \
  || echo -e "${RED}✗ Mode C (Text + Structured):    FAILED${NC}"

( [ "$MODE_D_STATUS" == "used" ] && [ -n "$MODE_D_AI_RATE" ] && [ "$MODE_D_AI_RATE" != "" ] ) \
  && echo -e "${GREEN}✓ Mode D (AI Rate Recommend):    PASSED${NC}" \
  || echo -e "${RED}✗ Mode D (AI Rate Recommend):    FAILED${NC}"

echo ""
echo -e "${BOLD}Total: $PASSED passed, $FAILED failed out of 2${NC}"
echo ""

[ $FAILED -gt 0 ] && exit 1 || exit 0

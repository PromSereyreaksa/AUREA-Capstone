#!/usr/bin/env bash
#
# Quick PDF Portfolio Test
# Tests portfolio-assist with a specific PDF file
# No onboarding or pricing profile required — portfolio content only.
#
# Usage: ./test-single-pdf.sh [path/to/portfolio.pdf]
#

set -e

PDF_FILE="${1:-../test-portfolio-pdf/Daniel Gallego.pdf}"
BASE_URL="${2:-http://localhost:3000}"
API_V1="$BASE_URL/api/v1"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  Portfolio PDF Analysis Test (Portfolio-Only Mode)${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if PDF exists
if [ ! -f "$PDF_FILE" ]; then
  echo -e "${RED}✗ PDF file not found: $PDF_FILE${NC}"
  exit 1
fi

PDF_SIZE=$(stat -f%z "$PDF_FILE" 2>/dev/null || stat -c%s "$PDF_FILE" 2>/dev/null)
echo -e "${BLUE}PDF File:${NC} $PDF_FILE"
echo -e "${BLUE}Size:${NC} $(echo "scale=2; $PDF_SIZE/1024/1024" | bc) MB (max 20 MB)"
echo ""

# Step 1: Create test user
echo -e "${YELLOW}[1/3]${NC} Creating test user..."
TIMESTAMP=$(date +%s)
TEST_EMAIL="pdftest_${TIMESTAMP}@test.com"

SIGNUP_RESP=$(curl -s -X POST "$API_V1/users/signup" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"Test1234!\",\"role\":\"designer\"}")

USER_ID=$(echo "$SIGNUP_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['user']['user_id'])" 2>/dev/null || echo "0")

if [ "$USER_ID" == "0" ]; then
  echo -e "${RED}✗ Failed to create user${NC}"
  echo "Response: $SIGNUP_RESP"
  exit 1
fi

echo -e "${GREEN}✓ User created (ID: $USER_ID)${NC}"

# Step 2: Verify OTP
echo -e "${YELLOW}[2/3]${NC} Verifying OTP..."
SIGNUP_OTP=$(echo "$SIGNUP_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data'].get('otp', '123456'))" 2>/dev/null || echo "123456")

OTP_RESP=$(curl -s -X POST "$API_V1/users/verify-otp" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$TEST_EMAIL\",\"otp\":\"$SIGNUP_OTP\"}")

TOKEN=$(echo "$OTP_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null || echo "")

if [ -z "$TOKEN" ]; then
  echo -e "${RED}✗ Failed to get auth token${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Authenticated${NC}"
echo ""

# Step 3: Analyze PDF portfolio (no onboarding or base rate needed)
echo -e "${YELLOW}[3/3]${NC} Analyzing PDF portfolio..."
echo ""

PDF_RESP=$(curl -s -w "\n%{http_code}" -X POST "$API_V1/pricing/portfolio-assist" \
  -H "Authorization: Bearer $TOKEN" \
  -F "user_id=$USER_ID" \
  -F "client_region=global" \
  -F "portfolio_pdf=@$PDF_FILE;type=application/pdf")

HTTP_CODE=$(echo "$PDF_RESP" | tail -1)
BODY=$(echo "$PDF_RESP" | sed '$d')

if [ "$HTTP_CODE" != "200" ]; then
  echo -e "${RED}✗ Request failed (HTTP $HTTP_CODE)${NC}"
  echo ""
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
  exit 1
fi

# Parse results
AI_STATUS=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['ai_status'])" 2>/dev/null || echo "failed")
SENIORITY=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['portfolio_signals']['seniority_level'])" 2>/dev/null || echo "N/A")
CONFIDENCE=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['portfolio_signals']['confidence'])" 2>/dev/null || echo "N/A")
SKILLS=$(echo "$BODY" | python3 -c "import sys,json; print(', '.join(json.load(sys.stdin)['data']['portfolio_signals']['skill_areas'][:5]))" 2>/dev/null || echo "N/A")
SPECIALIZATION=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['portfolio_signals'].get('specialization') or 'N/A')" 2>/dev/null || echo "N/A")
QUALITY=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['portfolio_signals'].get('portfolio_quality_tier') or 'N/A')" 2>/dev/null || echo "N/A")
SUMMARY=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['portfolio_signals'].get('summary') or 'N/A')" 2>/dev/null || echo "N/A")

# Follow-up questions
FOLLOW_UPS=$(echo "$BODY" | python3 -c "
import sys, json
data = json.load(sys.stdin)['data']
qs = data.get('follow_up_questions', [])
if qs:
    for q in qs:
        print(f'  - {q}')
else:
    print('  (none)')
" 2>/dev/null || echo "  (none)")

if [ "$AI_STATUS" == "used" ]; then
  echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  Portfolio Analysis Results                                    ║${NC}"
  echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${CYAN}Seniority Level:${NC}       $SENIORITY"
  echo -e "${CYAN}Confidence:${NC}            $CONFIDENCE"
  echo -e "${CYAN}Portfolio Quality:${NC}     $QUALITY"
  echo -e "${CYAN}Specialization:${NC}        $SPECIALIZATION"
  echo -e "${CYAN}Key Skills:${NC}            $SKILLS"
  echo -e "${CYAN}Summary:${NC}               $SUMMARY"
  echo ""
  echo -e "${CYAN}Follow-up Questions:${NC}"
  echo -e "$FOLLOW_UPS"
  echo ""
  
  # Show full response
  echo -e "${BLUE}Full Response:${NC}"
  echo "$BODY" | python3 -m json.tool
  
else
  echo -e "${RED}✗ AI analysis status: $AI_STATUS${NC}"
  echo ""
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
  exit 1
fi

echo ""
echo -e "${GREEN}✓ Test completed successfully!${NC}"

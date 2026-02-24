#!/bin/bash

# AUREA Backend Dashboard API Test Script
# Tests all three dashboard endpoints:
#   GET /api/v1/dashboard/stats
#   GET /api/v1/dashboard/recent-projects
#   GET /api/v1/dashboard

# ─── Configuration ─────────────────────────────────────────────────────────────
API_URL="http://localhost:3000/ /v1"

# Option A: Pass a token directly as an env variable:
#   TOKEN=your_jwt_here bash dashboard-api-test.sh
# Option B: Script auto-signs in using these credentials:
AUTH_EMAIL="${DASHBOARD_TEST_EMAIL:-your_test_email@example.com}"
AUTH_PASSWORD="${DASHBOARD_TEST_PASSWORD:-your_test_password}"

# ─── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# ─── Counters ──────────────────────────────────────────────────────────────────
PASSED=0
FAILED=0

echo "=========================================="
echo "  AUREA Dashboard API Test Suite"
echo "=========================================="
echo ""

# ─── Step 0: Health Check ──────────────────────────────────────────────────────
echo -e "${CYAN}Step 0: Checking if server is running...${NC}"
if ! curl -s "$API_URL/health" > /dev/null 2>&1; then
    echo -e "${RED}✗ Server is not running. Start it with: npm run dev${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Server is up${NC}"
echo ""

# ─── Step 1: Obtain JWT Token ──────────────────────────────────────────────────
if [ -n "$TOKEN" ]; then
    JWT_TOKEN="$TOKEN"
    echo -e "${GREEN}✓ Using TOKEN from environment variable${NC}"
    echo ""
else
    echo -e "${CYAN}Step 1: Signing in to get JWT token...${NC}"
    echo "  Email: $AUTH_EMAIL"
    echo ""

    SIGNIN_RESPONSE=$(curl -s -X POST "$API_URL/users/signin" \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"$AUTH_EMAIL\",
        \"password\": \"$AUTH_PASSWORD\"
      }")

    echo "Response:"
    echo "$SIGNIN_RESPONSE"
    echo ""

    JWT_TOKEN=$(echo "$SIGNIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

    if [ -z "$JWT_TOKEN" ]; then
        echo -e "${RED}✗ Sign-in failed — could not extract token.${NC}"
        echo -e "${YELLOW}  Tip: Set AUTH credentials at the top of the script or pass TOKEN=<jwt> as an env var.${NC}"
        exit 1
    fi

    echo -e "${GREEN}✓ Sign-in successful. Token received.${NC}"
    echo "  Token (first 60 chars): ${JWT_TOKEN:0:60}..."
    ((PASSED++))
    echo ""
fi

# ─── Step 2: GET /dashboard/stats ─────────────────────────────────────────────
echo "=========================================="
echo -e "${CYAN}Step 2: GET /dashboard/stats${NC}"
echo "  Lightweight overview: base rate, project counts, completeness"
echo "=========================================="
echo ""

STATS_RESPONSE=$(curl -s -X GET "$API_URL/dashboard/stats" \
  -H "Authorization: Bearer $JWT_TOKEN")

echo "Response:"
echo "$STATS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$STATS_RESPONSE"
echo ""

if echo "$STATS_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ /dashboard/stats returned success${NC}"

    # Spot-check expected fields
    for field in totalProjects projectsThisWeek projectsThisMonth baseHourlyRate profileCompleteness; do
        if echo "$STATS_RESPONSE" | grep -q "\"$field\""; then
            echo -e "${GREEN}  ✓ Field present: $field${NC}"
        else
            echo -e "${YELLOW}  ⚠ Field missing: $field${NC}"
        fi
    done
    ((PASSED++))
else
    echo -e "${RED}✗ /dashboard/stats failed${NC}"
    ((FAILED++))
fi
echo ""

# ─── Step 3: GET /dashboard/recent-projects (default limit=5) ─────────────────
echo "=========================================="
echo -e "${CYAN}Step 3: GET /dashboard/recent-projects (default limit 5)${NC}"
echo "  Returns recent projects with client name"
echo "=========================================="
echo ""

RECENT_RESPONSE=$(curl -s -X GET "$API_URL/dashboard/recent-projects" \
  -H "Authorization: Bearer $JWT_TOKEN")

echo "Response:"
echo "$RECENT_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RECENT_RESPONSE"
echo ""

if echo "$RECENT_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ /dashboard/recent-projects returned success${NC}"

    # Count how many projects came back
    PROJECT_COUNT=$(echo "$RECENT_RESPONSE" | grep -o '"project_id"' | wc -l)
    echo -e "${GREEN}  ✓ Projects returned: $PROJECT_COUNT${NC}"

    # Check client_name field is present
    if echo "$RECENT_RESPONSE" | grep -q '"client_name"'; then
        echo -e "${GREEN}  ✓ client_name field is present${NC}"
    else
        echo -e "${YELLOW}  ⚠ client_name field missing (may be null for all projects)${NC}"
    fi
    ((PASSED++))
else
    echo -e "${RED}✗ /dashboard/recent-projects failed${NC}"
    ((FAILED++))
fi
echo ""

# ─── Step 4: GET /dashboard/recent-projects?limit=3 ───────────────────────────
echo "=========================================="
echo -e "${CYAN}Step 4: GET /dashboard/recent-projects?limit=3${NC}"
echo "  Should return at most 3 projects"
echo "=========================================="
echo ""

RECENT_LIMIT_RESPONSE=$(curl -s -X GET "$API_URL/dashboard/recent-projects?limit=3" \
  -H "Authorization: Bearer $JWT_TOKEN")

echo "Response:"
echo "$RECENT_LIMIT_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RECENT_LIMIT_RESPONSE"
echo ""

if echo "$RECENT_LIMIT_RESPONSE" | grep -q '"success":true'; then
    LIMIT_COUNT=$(echo "$RECENT_LIMIT_RESPONSE" | grep -o '"project_id"' | wc -l)
    if [ "$LIMIT_COUNT" -le 3 ]; then
        echo -e "${GREEN}✓ Limit respected — got $LIMIT_COUNT project(s) (max 3)${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ Limit NOT respected — got $LIMIT_COUNT projects (expected ≤ 3)${NC}"
        ((FAILED++))
    fi
else
    echo -e "${RED}✗ /dashboard/recent-projects?limit=3 failed${NC}"
    ((FAILED++))
fi
echo ""

# ─── Step 5: GET /dashboard (full) ────────────────────────────────────────────
echo "=========================================="
echo -e "${CYAN}Step 5: GET /dashboard (full aggregated data)${NC}"
echo "  overview + recentProjects + pricingProfile + marketComparison + portfolio"
echo "=========================================="
echo ""

FULL_RESPONSE=$(curl -s -X GET "$API_URL/dashboard" \
  -H "Authorization: Bearer $JWT_TOKEN")

echo "Response:"
echo "$FULL_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$FULL_RESPONSE"
echo ""

if echo "$FULL_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ /dashboard (full) returned success${NC}"

    for section in overview recentProjects pricingProfile marketComparison portfolio; do
        if echo "$FULL_RESPONSE" | grep -q "\"$section\""; then
            echo -e "${GREEN}  ✓ Section present: $section${NC}"
        else
            echo -e "${YELLOW}  ⚠ Section missing: $section${NC}"
        fi
    done
    ((PASSED++))
else
    echo -e "${RED}✗ /dashboard (full) failed${NC}"
    ((FAILED++))
fi
echo ""

# ─── Step 6: Unauthorized access check ────────────────────────────────────────
echo "=========================================="
echo -e "${CYAN}Step 6: Unauthorized access (no token)${NC}"
echo "  All endpoints should return 401"
echo "=========================================="
echo ""

for endpoint in "dashboard/stats" "dashboard/recent-projects" "dashboard"; do
    UNAUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/$endpoint")
    if [ "$UNAUTH_RESPONSE" = "401" ]; then
        echo -e "${GREEN}  ✓ $endpoint → 401 Unauthorized (correct)${NC}"
        ((PASSED++))
    else
        echo -e "${RED}  ✗ $endpoint → $UNAUTH_RESPONSE (expected 401)${NC}"
        ((FAILED++))
    fi
done
echo ""

# ─── Summary ───────────────────────────────────────────────────────────────────
echo "=========================================="
echo "  TEST SUMMARY"
echo "=========================================="
echo -e "${GREEN}  PASSED: $PASSED${NC}"
echo -e "${RED}  FAILED: $FAILED${NC}"
echo "=========================================="

if [ "$FAILED" -eq 0 ]; then
    echo -e "${GREEN}  All dashboard tests passed!${NC}"
    exit 0
else
    echo -e "${RED}  Some tests failed. Check the output above.${NC}"
    exit 1
fi

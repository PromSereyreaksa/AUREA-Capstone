#!/bin/bash

# Quick Estimate API Test Script
# Tests the quick estimate endpoint with and without Google Search Grounding
# Saves results to JSON files for comparison

BASE_URL="${API_BASE_URL:-http://localhost:3000/api/v1}"
TEST_EMAIL="quick_est_$(date +%s)@test.com"
TEST_PASSWORD="TestPassword123!"

# Output directory and files
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Result files
WITH_GROUNDING_FILE="$OUTPUT_DIR/with_grounding_${TIMESTAMP}.json"
WITHOUT_GROUNDING_FILE="$OUTPUT_DIR/without_grounding_${TIMESTAMP}.json"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

success() { echo -e "${GREEN}✓ $1${NC}"; }
fail() { echo -e "${RED}✗ $1${NC}"; }
info() { echo -e "${YELLOW}→ $1${NC}"; }

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     Quick Estimate: With vs Without Google Search Test       ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Base URL: $BASE_URL"
echo "Output Directory: $OUTPUT_DIR"
echo ""

# ============================================
# SETUP: Create user and get auth token
# ============================================
info "Setting up test user..."

# Sign up
SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/users/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"user_name\": \"Quick Estimate Test\",
    \"role\": \"designer\"
  }" 2>/dev/null)

USER_ID=$(echo "$SIGNUP_RESPONSE" | jq -r '.data.user.user_id // .data.user_id // empty')
SIGNUP_OTP=$(echo "$SIGNUP_RESPONSE" | jq -r '.data.otp // empty')

if [ -z "$USER_ID" ]; then
    fail "Failed to create user"
    echo "$SIGNUP_RESPONSE" | jq '.'
    exit 1
fi
success "User created (ID: $USER_ID)"

# Verify OTP
VERIFY_RESPONSE=$(curl -s -X POST "$BASE_URL/users/verify-otp" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"otp\": \"${SIGNUP_OTP:-123456}\"
  }" 2>/dev/null)

AUTH_TOKEN=$(echo "$VERIFY_RESPONSE" | jq -r '.data.token // empty')

if [ -z "$AUTH_TOKEN" ]; then
    fail "Failed to get auth token"
    exit 1
fi
success "Authentication complete"
echo ""

# ============================================
# Test scenarios to run
# ============================================
declare -a TEST_SCENARIOS=(
    "beginner|Logo Design, Social Media Graphics|20|sme"
    "intermediate|Branding, Print Design|30|startup"
    "experienced|UI/UX Design, Web Design|40|corporate"
    "expert|Brand Strategy, Motion Graphics|35|corporate"
)

# ============================================
# TEST 1: WITH Google Search Grounding
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  TEST 1: Quick Estimate WITH Google Search Grounding${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Initialize JSON file
echo "{" > "$WITH_GROUNDING_FILE"
echo "  \"test_type\": \"with_google_search_grounding\"," >> "$WITH_GROUNDING_FILE"
echo "  \"timestamp\": \"$(date -Iseconds)\"," >> "$WITH_GROUNDING_FILE"
echo "  \"results\": [" >> "$WITH_GROUNDING_FILE"

FIRST_RESULT=true
for scenario in "${TEST_SCENARIOS[@]}"; do
    IFS='|' read -r exp_level skills hours client_type <<< "$scenario"
    
    info "Testing: $exp_level ($skills)"
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/pricing/quick-estimate" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -d "{
        \"user_id\": $USER_ID,
        \"skills\": \"$skills\",
        \"experience_level\": \"$exp_level\",
        \"client_type\": \"$client_type\",
        \"hours_per_week\": $hours
      }" 2>/dev/null)
    
    if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        RATE=$(echo "$RESPONSE" | jq -r '.data.estimate.recommended_rate // "N/A"')
        SOURCES_COUNT=$(echo "$RESPONSE" | jq -r '.data.sources | length // 0')
        HAS_URLS=$(echo "$RESPONSE" | jq -r '[.data.sources[]? | select(contains("http"))] | length // 0')
        
        success "  Rate: \$${RATE}/hr | Sources: $SOURCES_COUNT ($HAS_URLS with URLs)"
        
        # Add to JSON file
        if [ "$FIRST_RESULT" = false ]; then
            echo "," >> "$WITH_GROUNDING_FILE"
        fi
        FIRST_RESULT=false
        
        # Extract and save result
        echo "$RESPONSE" | jq "{
            experience_level: \"$exp_level\",
            skills: \"$skills\",
            hours_per_week: $hours,
            client_type: \"$client_type\",
            success: .success,
            estimate: .data.estimate,
            ai_researched_costs: .data.ai_researched_costs,
            ai_researched_income: .data.ai_researched_income,
            market_research: .data.market_research,
            calculation_breakdown: .data.calculation_breakdown,
            sources: .data.sources,
            sources_count: (.data.sources | length),
            has_web_urls: ([.data.sources[]? | select(contains(\"http\"))] | length > 0)
        }" >> "$WITH_GROUNDING_FILE"
    else
        fail "  Failed for $exp_level"
        
        if [ "$FIRST_RESULT" = false ]; then
            echo "," >> "$WITH_GROUNDING_FILE"
        fi
        FIRST_RESULT=false
        
        echo "{\"experience_level\": \"$exp_level\", \"success\": false, \"error\": $(echo "$RESPONSE" | jq '.message // "Unknown error"')}" >> "$WITH_GROUNDING_FILE"
    fi
    
    sleep 1  # Rate limiting
done

echo "" >> "$WITH_GROUNDING_FILE"
echo "  ]" >> "$WITH_GROUNDING_FILE"
echo "}" >> "$WITH_GROUNDING_FILE"

success "Results saved to: $WITH_GROUNDING_FILE"
echo ""

# ============================================
# TEST 2: WITHOUT Google Search Grounding (Simulated)
# For this test, we'll call a different endpoint or add a parameter
# Since we don't have a separate endpoint, we'll document what the 
# "without grounding" would look like based on AI knowledge only
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  TEST 2: Quick Estimate WITHOUT Google Search (Knowledge Only)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

info "Note: Testing with ?use_grounding=false parameter"
echo ""

# Initialize JSON file
echo "{" > "$WITHOUT_GROUNDING_FILE"
echo "  \"test_type\": \"without_google_search_grounding\"," >> "$WITHOUT_GROUNDING_FILE"
echo "  \"timestamp\": \"$(date -Iseconds)\"," >> "$WITHOUT_GROUNDING_FILE"
echo "  \"results\": [" >> "$WITHOUT_GROUNDING_FILE"

FIRST_RESULT=true
for scenario in "${TEST_SCENARIOS[@]}"; do
    IFS='|' read -r exp_level skills hours client_type <<< "$scenario"
    
    info "Testing: $exp_level ($skills)"
    
    # Add use_grounding=false parameter to disable grounding
    RESPONSE=$(curl -s -X POST "$BASE_URL/pricing/quick-estimate?use_grounding=false" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -d "{
        \"user_id\": $USER_ID,
        \"skills\": \"$skills\",
        \"experience_level\": \"$exp_level\",
        \"client_type\": \"$client_type\",
        \"hours_per_week\": $hours
      }" 2>/dev/null)
    
    if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        RATE=$(echo "$RESPONSE" | jq -r '.data.estimate.recommended_rate // "N/A"')
        SOURCES_COUNT=$(echo "$RESPONSE" | jq -r '.data.sources | length // 0')
        HAS_URLS=$(echo "$RESPONSE" | jq -r '[.data.sources[]? | select(contains("http"))] | length // 0')
        
        success "  Rate: \$${RATE}/hr | Sources: $SOURCES_COUNT ($HAS_URLS with URLs)"
        
        # Add to JSON file
        if [ "$FIRST_RESULT" = false ]; then
            echo "," >> "$WITHOUT_GROUNDING_FILE"
        fi
        FIRST_RESULT=false
        
        # Extract and save result
        echo "$RESPONSE" | jq "{
            experience_level: \"$exp_level\",
            skills: \"$skills\",
            hours_per_week: $hours,
            client_type: \"$client_type\",
            success: .success,
            estimate: .data.estimate,
            ai_researched_costs: .data.ai_researched_costs,
            ai_researched_income: .data.ai_researched_income,
            market_research: .data.market_research,
            calculation_breakdown: .data.calculation_breakdown,
            sources: .data.sources,
            sources_count: (.data.sources | length),
            has_web_urls: ([.data.sources[]? | select(contains(\"http\"))] | length > 0)
        }" >> "$WITHOUT_GROUNDING_FILE"
    else
        fail "  Failed for $exp_level"
        
        if [ "$FIRST_RESULT" = false ]; then
            echo "," >> "$WITHOUT_GROUNDING_FILE"
        fi
        FIRST_RESULT=false
        
        echo "{\"experience_level\": \"$exp_level\", \"success\": false, \"error\": $(echo "$RESPONSE" | jq '.message // "Unknown error"')}" >> "$WITHOUT_GROUNDING_FILE"
    fi
    
    sleep 1  # Rate limiting
done

echo "" >> "$WITHOUT_GROUNDING_FILE"
echo "  ]" >> "$WITHOUT_GROUNDING_FILE"
echo "}" >> "$WITHOUT_GROUNDING_FILE"

success "Results saved to: $WITHOUT_GROUNDING_FILE"
echo ""

# ============================================
# Summary
# ============================================
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    TEST COMPLETE                             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Output Files:"
echo "  WITH Grounding:    $WITH_GROUNDING_FILE"
echo "  WITHOUT Grounding: $WITHOUT_GROUNDING_FILE"
echo ""
echo "To compare results, run:"
echo "  python3 $SCRIPT_DIR/compare_results.py \\"
echo "    $WITH_GROUNDING_FILE \\"
echo "    $WITHOUT_GROUNDING_FILE"
echo ""

# Also create symlinks to latest results
ln -sf "$WITH_GROUNDING_FILE" "$OUTPUT_DIR/latest_with_grounding.json"
ln -sf "$WITHOUT_GROUNDING_FILE" "$OUTPUT_DIR/latest_without_grounding.json"

echo "Latest results linked to:"
echo "  $OUTPUT_DIR/latest_with_grounding.json"
echo "  $OUTPUT_DIR/latest_without_grounding.json"
echo ""

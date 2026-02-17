#!/bin/bash

# Test script for PDF extraction with pricing integration
# Tests the new auto-pricing feature with sample client briefs

set -e

echo "🧪 AUREA Project Extraction + Pricing Integration Tests"
echo "======================================================"
echo ""

API_URL="http://localhost:3000/api/v0/pdf"
USER_ID=88  # Test user ID (created by test-complete.sh)

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if backend is running
echo "Checking if backend is running..."
if ! curl -s -o /dev/null -w "%{http_code}" "$API_URL/test-gemini" | grep -q "200\|401"; then
    echo -e "${RED}❌ Backend is not running!${NC}"
    echo "Please start the backend server first: cd backend && npm run dev"
    exit 1
fi
echo -e "${GREEN}✅ Backend is running${NC}"
echo ""

# Function to test extraction with pricing
test_extraction_with_pricing() {
    local file_path=$1
    local test_name=$2
    local use_grounding=${3:-true}
    
    echo -e "${YELLOW}📄 Testing: $test_name${NC}"
    echo "File: $file_path"
    echo "Grounding: $use_grounding"
    echo ""
    
    # Note: This script expects TEXT files, not PDFs
    # In real scenario, you'd need actual PDF files
    # For now, this demonstrates the API call structure
    
    response=$(timeout 45 curl -s -X POST \
        "$API_URL/extract?calculate_pricing=true&use_grounding=$use_grounding" \
        -F "pdf=@$file_path" \
        -F "user_id=$USER_ID" \
        2>&1)
    
    # Check if successful
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ Extraction successful${NC}"
        
        # Extract key pricing info
        hourly_rate=$(echo "$response" | grep -o '"final_hourly_rate":[0-9.]*' | head -1 | cut -d':' -f2)
        project_total=$(echo "$response" | grep -o '"project_total_estimate":[0-9.]*' | head -1 | cut -d':' -f2)
        estimated_hours=$(echo "$response" | grep -o '"estimated_hours":[0-9]*' | head -1 | cut -d':' -f2)
        client_type=$(echo "$response" | grep -o '"client_type":"[^"]*"' | head -1 | cut -d'"' -f4)
        urgency=$(echo "$response" | grep -o '"urgency":"[^"]*"' | head -1 | cut -d'"' -f4)
        
        echo "  💰 Hourly Rate: \$$hourly_rate"
        echo "  📊 Project Total: \$$project_total"
        echo "  ⏱️  Estimated Hours: $estimated_hours"
        echo "  🏢 Client Type: $client_type"
        echo "  ⚡ Urgency: $urgency"
        
        # Save full response for review
        echo "$response" | jq '.' > "test_result_$(date +%s).json" 2>/dev/null || true
        echo ""
        return 0
    else
        echo -e "${RED}❌ Test failed${NC}"
        echo "Response: $response"
        echo ""
        return 1
    fi
}

# Test 1: Startup with urgent deadline
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 1: Startup Client with Rush Timeline"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Expected: Lower base rate (startup), urgency multiplier applied"
echo ""

test_extraction_with_pricing \
    "./samples/pdf/PRICING_TEST_01-STARTUP_RUSH.pdf" \
sleep 2

# Test 2: Corporate client with many deliverables
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 2: Corporate Client with Detailed Scope"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Expected: Higher rate (corporate), many deliverables, higher hours"
echo ""

test_extraction_with_pricing \
    "./samples/pdf/PRICING_TEST_02-CORPORATE_DETAILED.pdf" \
    "Corporate Detailed Project" \
    "true"

echo ""
sleep 2

# Test 3: Same project without grounding (AI knowledge only)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 3: Without Google Search Grounding"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Expected: Faster response, AI knowledge only (no web sources)"
echo ""

test_extraction_with_pricing \
    "./samples/pdf/PRICING_TEST_01-STARTUP_RUSH.pdf" \
    "Startup (No Grounding)" \
    "false"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ All tests completed!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Notes:"
echo "  - Results saved to test_result_*.json files"
echo "  - Review full responses for detailed pricing breakdowns"
echo "  - Check for Google Search sources in grounded responses"
echo "  - Compare pricing differences between client types"
echo ""
echo "🔍 Manual verification checklist:"
echo "  [ ] Startup rate < Corporate rate?"
echo "  [ ] Urgency multiplier applied correctly?"
echo "  [ ] Hours estimation reasonable for deliverables?"
echo "  [ ] Client type detected correctly?"
echo "  [ ] Web sources included (when grounding enabled)?"
echo ""

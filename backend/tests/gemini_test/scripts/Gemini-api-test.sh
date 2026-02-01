#!/bin/bash

# AUREA Backend PDF Extraction and Project Management API Test Script
# Tests PDF extraction, project creation, and CRUD operations

# Configuration
API_URL="http://localhost:3000/api/v1"
PDF_FILE="PROJECT PROPOSAL DOCUMENT.pdf"
USER_ID="2"

echo "=========================================="
echo "AUREA PDF Extraction & Project API Test"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test tracking
PASSED=0
FAILED=0
SKIPPED=0
JWT_TOKEN=""

# Step 1: Check if server is running
echo "Step 1: Checking if server is running..."
if curl -s "$API_URL/health" > /dev/null 2>&1; then
    HEALTH=$(curl -s "$API_URL/health")
    echo -e "${GREEN}✓ Server is running${NC}"
    echo "  Response: $HEALTH"
    ((PASSED++))
    echo ""
else
    echo -e "${RED}✗ Server is not running. Start it with: npm run dev${NC}"
    ((FAILED++))
    echo ""
    exit 1
fi

# Step 2: Authenticate and get JWT token
echo "Step 2: Authenticating user and getting JWT token..."
TIMESTAMP=$(date +%s%N | cut -b1-13)
TEST_EMAIL="geminitest_${TIMESTAMP}@example.com"

SIGNUP=$(curl -s -X POST "$API_URL/users/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"Test123456!\",
    \"role\": \"client\"
  }")

OTP=$(echo "$SIGNUP" | grep -o '"otp":"[^"]*"' | cut -d'"' -f4)

if [ -n "$OTP" ]; then
    echo -e "${GREEN}✓ User created with email: $TEST_EMAIL${NC}"
    echo "  OTP: $OTP"
    ((PASSED++))
else
    echo -e "${RED}✗ Failed to create test user${NC}"
    ((FAILED++))
    exit 1
fi
echo ""

# Verify OTP and get token
echo "Step 3: Verifying OTP and getting JWT token..."
VERIFY=$(curl -s -X POST "$API_URL/users/verify-otp" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"otp\": \"$OTP\"
  }")

JWT_TOKEN=$(echo "$VERIFY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$JWT_TOKEN" ]; then
    echo -e "${GREEN}✓ JWT Token obtained${NC}"
    echo "  Token (first 50 chars): ${JWT_TOKEN:0:50}..."
    ((PASSED++))
else
    echo -e "${RED}✗ Failed to get JWT token${NC}"
    ((FAILED++))
    exit 1
fi
echo ""

# Step 4: Check if PDF file exists
echo "Step 4: Checking if PDF file exists..."
if [ ! -f "$PDF_FILE" ]; then
    echo -e "${YELLOW}⚠ PDF file not found: $PDF_FILE${NC}"
    echo "  Skipping PDF extraction test."
    ((SKIPPED++))
    echo ""
else
    echo -e "${GREEN}✓ PDF file found: $PDF_FILE${NC}"
    ((PASSED++))
    echo ""
fi

# ==========================================
# GEMINI AI INTEGRATION TESTS
# ==========================================
echo "=========================================="
echo "GEMINI AI INTEGRATION TESTS"
echo "=========================================="
echo ""

# Step 5: Test Gemini connection (with JWT token)
echo "Step 5: Testing Gemini connection..."
echo "Request: GET $API_URL/pdf/test-gemini"
echo "Auth: Bearer <JWT_TOKEN>"
echo ""

GEMINI_TEST=$(curl -s "$API_URL/pdf/test-gemini" \
  -H "Authorization: Bearer $JWT_TOKEN")
if echo "$GEMINI_TEST" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Gemini connection successful${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Gemini connection failed${NC}"
    ((FAILED++))
fi
echo "Response:"
echo "$GEMINI_TEST" | head -c 500
echo ""
echo ""

# Step 6: Upload and extract PDF
if [ -f "$PDF_FILE" ]; then
    echo "Step 6: Uploading and extracting PDF..."
    echo "Request: POST $API_URL/pdf/extract"
    echo "  - pdf file: $PDF_FILE"
    echo "  - user_id: $USER_ID"
    echo "Auth: Bearer <JWT_TOKEN>"
    echo ""

    EXTRACT_RESPONSE=$(curl -s -X POST "$API_URL/pdf/extract" \
      -H "Authorization: Bearer $JWT_TOKEN" \
      -F "pdf=@$PDF_FILE" \
      -F "user_id=$USER_ID")

    if echo "$EXTRACT_RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ PDF extraction successful${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ PDF extraction failed${NC}"
        ((FAILED++))
    fi
    echo "Response (first 500 chars):"
    echo "$EXTRACT_RESPONSE" | head -c 500
    echo "..."
    echo ""
else
    echo "Step 4: Skipping PDF extraction (file not found)"
    ((SKIPPED++))
    echo ""
fi

# ==========================================
# PROJECT MANAGEMENT TESTS
# ==========================================
echo "=========================================="
echo "PROJECT MANAGEMENT API TESTS"
echo "=========================================="
echo ""

# Step 7: Test manual project creation
echo "Step 7: Testing manual project creation..."
echo "Request: POST $API_URL/pdf/create-project"
echo "Auth: Bearer <JWT_TOKEN>"
echo ""

MANUAL_RESPONSE=$(curl -s -X POST "$API_URL/pdf/create-project" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": '"$USER_ID"',
    "project_name": "Test Manual Project",
    "title": "Manual Input Test",
    "description": "Testing manual project creation",
    "duration": 30,
    "difficulty": "Easy",
    "licensing": "One-Time Used",
    "usage_rights": "Personal Use",
    "result": "Test deliverable",
    "deliverables": [
      { "deliverable_type": "Logo Design", "quantity": 1 },
      { "deliverable_type": "Brand Guidelines", "quantity": 2 }
    ]
  }')

if echo "$MANUAL_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Manual project creation successful${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Manual project creation failed${NC}"
    ((FAILED++))
fi
echo "Response:"
echo "$MANUAL_RESPONSE"
echo ""

# Step 8: Fetch project history for user
echo "Step 8: Fetching project history for user $USER_ID..."
echo "Request: GET $API_URL/pdf/projects/$USER_ID"
echo "Auth: Bearer <JWT_TOKEN>"
echo ""

HISTORY=$(curl -s "$API_URL/pdf/projects/$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN")
if echo "$HISTORY" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Project history retrieved successfully${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Failed to retrieve project history${NC}"
    ((FAILED++))
fi
echo "Response (first 500 chars):"
echo "$HISTORY" | head -c 500
echo "..."
echo ""

# Extract first project ID from history
PROJECT_ID=$(echo "$HISTORY" | grep -o '"project_id":[0-9]*' | head -1 | grep -o '[0-9]*')

# Step 9: Get single project details
echo "Step 9: Getting single project details..."
if [ -n "$PROJECT_ID" ]; then
    echo "Request: GET $API_URL/pdf/projects/$USER_ID/$PROJECT_ID"
    echo "Auth: Bearer <JWT_TOKEN>"
    echo ""
    
    SINGLE_PROJECT=$(curl -s "$API_URL/pdf/projects/$USER_ID/$PROJECT_ID" \
      -H "Authorization: Bearer $JWT_TOKEN")
    if echo "$SINGLE_PROJECT" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ Single project retrieved successfully${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ Failed to retrieve single project${NC}"
        ((FAILED++))
    fi
    echo "Response (first 500 chars):"
    echo "$SINGLE_PROJECT" | head -c 500
    echo "..."
    echo ""
else
    echo -e "${YELLOW}⚠ No projects found to test GET single project${NC}"
    ((SKIPPED++))
    echo ""
fi

# Step 10: Update project
echo "Step 10: Testing update project..."
if [ -n "$PROJECT_ID" ]; then
    echo "Request: PUT $API_URL/pdf/projects/$USER_ID/$PROJECT_ID"
    echo "Auth: Bearer <JWT_TOKEN>"
    echo ""
    
    UPDATE_RESPONSE=$(curl -s -X PUT "$API_URL/pdf/projects/$USER_ID/$PROJECT_ID" \
      -H "Authorization: Bearer $JWT_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "title": "Updated Test Project",
        "description": "Updated description after testing",
        "difficulty": "Medium",
        "duration": 45
      }')
    
    if echo "$UPDATE_RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ Project updated successfully${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ Failed to update project${NC}"
        ((FAILED++))
    fi
    echo "Response:"
    echo "$UPDATE_RESPONSE" | head -c 500
    echo "..."
    echo ""
else
    echo -e "${YELLOW}⚠ No projects found to test update${NC}"
    ((SKIPPED++))
    echo ""
fi

# Step 11: Delete project
echo "Step 11: Testing delete project..."
if [ -n "$PROJECT_ID" ]; then
    echo "Request: DELETE $API_URL/pdf/projects/$USER_ID/$PROJECT_ID"
    echo "Auth: Bearer <JWT_TOKEN>"
    echo ""
    
    DELETE_RESPONSE=$(curl -s -X DELETE "$API_URL/pdf/projects/$USER_ID/$PROJECT_ID" \
      -H "Authorization: Bearer $JWT_TOKEN")
    if echo "$DELETE_RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ Project deleted successfully${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ Failed to delete project${NC}"
        ((FAILED++))
    fi
    echo "Response:"
    echo "$DELETE_RESPONSE"
    echo ""
else
    echo -e "${YELLOW}⚠ No projects found to test delete${NC}"
    ((SKIPPED++))
    echo ""
fi

# Calculate totals
TOTAL=$((PASSED + FAILED + SKIPPED))

echo "=========================================="
echo "PDF Extraction & Project API Test Complete!"
echo "=========================================="
echo ""
echo "TEST RESULTS:"
echo ""
echo -e "  ${GREEN}✓ Passed:  $PASSED${NC}"
echo -e "  ${RED}✗ Failed:  $FAILED${NC}"
echo -e "  ${YELLOW}⚠ Skipped: $SKIPPED${NC}"
echo "  ─────────────"
echo "  Total:    $TOTAL"
echo ""
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
else
    echo -e "${RED}⚠️  Some tests failed. Please review the output above.${NC}"
fi
echo ""
echo "Summary:"
echo "  - Test User Email: $TEST_EMAIL"
echo "  - Test User ID: $USER_ID"
echo "  - Last Project ID: $PROJECT_ID"
echo ""
echo "=========================================="

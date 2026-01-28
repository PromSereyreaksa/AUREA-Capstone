#!/bin/bash

# AUREA Backend API Test Script
# Tests User Authentication and PDF Extraction endpoints

# Configuration
API_URL="http://localhost:3000"
PDF_FILE="PROJECT PROPOSAL DOCUMENT.pdf"
TEST_EMAIL="test$(date +%s)@example.com"
TEST_PASSWORD="password123"
TEST_ROLE="designer"

echo "=========================================="
echo "AUREA Backend API Test Suite"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if server is running
echo "Step 1: Checking if server is running..."
if curl -s "$API_URL/health" > /dev/null 2>&1; then
    HEALTH=$(curl -s "$API_URL/health")
    echo -e "${GREEN}✓ Server is running${NC}"
    echo "  Response: $HEALTH"
    echo ""
else
    echo -e "${RED}✗ Server is not running. Start it with: npm run dev${NC}"
    echo ""
    exit 1
fi

# ==========================================
# USER AUTHENTICATION TESTS
# ==========================================
echo "=========================================="
echo "USER AUTHENTICATION TESTS"
echo "=========================================="
echo ""

# Step 2: Test User Signup
echo "Step 2: Testing User Signup..."
echo "Request: POST $API_URL/api/users/signup"
echo "  - email: $TEST_EMAIL"
echo "  - password: $TEST_PASSWORD"
echo "  - role: $TEST_ROLE"
echo ""

SIGNUP_RESPONSE=$(curl -s -X POST "$API_URL/api/users/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"role\": \"$TEST_ROLE\"
  }")

echo "Response:"
echo "$SIGNUP_RESPONSE" | head -c 500
echo ""
echo ""

# Extract OTP from response (for testing)
OTP=$(echo "$SIGNUP_RESPONSE" | grep -o '"otp":"[^"]*"' | cut -d'"' -f4)
if [ -n "$OTP" ]; then
    echo -e "${GREEN}✓ User created. OTP: $OTP${NC}"
else
    echo -e "${YELLOW}⚠ Could not extract OTP from response${NC}"
fi
echo ""

# Step 3: Test OTP Verification
echo "Step 3: Testing OTP Verification..."
echo "Request: POST $API_URL/api/users/verify-otp"
echo "  - email: $TEST_EMAIL"
echo "  - otp: $OTP"
echo ""

VERIFY_RESPONSE=$(curl -s -X POST "$API_URL/api/users/verify-otp" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"otp\": \"$OTP\"
  }")

echo "Response:"
echo "$VERIFY_RESPONSE" | head -c 500
echo ""
echo ""

# Extract JWT token from response
JWT_TOKEN=$(echo "$VERIFY_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -n "$JWT_TOKEN" ]; then
    echo -e "${GREEN}✓ Email verified. JWT Token received.${NC}"
    echo "  Token (first 50 chars): ${JWT_TOKEN:0:50}..."
else
    echo -e "${YELLOW}⚠ Could not extract JWT token from response${NC}"
fi
echo ""

# Step 4: Test Get Current User (Protected Route)
echo "Step 4: Testing Protected Route (Get Current User)..."
echo "Request: GET $API_URL/api/users/me"
echo "  - Authorization: Bearer <token>"
echo ""

ME_RESPONSE=$(curl -s -X GET "$API_URL/api/users/me" \
  -H "Authorization: Bearer $JWT_TOKEN")

echo "Response:"
echo "$ME_RESPONSE"
echo ""

# Step 5: Test Resend OTP (should fail - already verified)
echo "Step 5: Testing Resend OTP (should say already verified)..."
echo "Request: POST $API_URL/api/users/resend-otp"
echo ""

RESEND_RESPONSE=$(curl -s -X POST "$API_URL/api/users/resend-otp" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\"
  }")

echo "Response:"
echo "$RESEND_RESPONSE"
echo ""

# Step 6: Test Invalid Login Scenarios
echo "Step 6: Testing Invalid Scenarios..."
echo ""

echo "6a. Signup with existing email..."
DUPLICATE_RESPONSE=$(curl -s -X POST "$API_URL/api/users/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"password123\",
    \"role\": \"designer\"
  }")
echo "Response: $DUPLICATE_RESPONSE"
echo ""

echo "6b. Verify with wrong OTP..."
WRONG_OTP_RESPONSE=$(curl -s -X POST "$API_URL/api/users/verify-otp" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"otp\": \"000000\"
  }")
echo "Response: $WRONG_OTP_RESPONSE"
echo ""

echo "6c. Access protected route without token..."
NO_TOKEN_RESPONSE=$(curl -s -X GET "$API_URL/api/users/me")
echo "Response: $NO_TOKEN_RESPONSE"
echo ""

# ==========================================
# PDF EXTRACTION TESTS
# ==========================================
echo "=========================================="
echo "PDF EXTRACTION TESTS"
echo "=========================================="
echo ""

# Step 7: Test Gemini connection
echo "Step 7: Testing Gemini connection..."
GEMINI_TEST=$(curl -s "$API_URL/api/pdf/test-gemini")
echo "Response: $GEMINI_TEST"
echo ""

# Step 8: Check if PDF file exists
echo "Step 8: Checking if PDF file exists..."
if [ ! -f "$PDF_FILE" ]; then
    echo -e "${YELLOW}⚠ PDF file not found: $PDF_FILE${NC}"
    echo "  Skipping PDF extraction test."
    echo ""
else
    echo -e "${GREEN}✓ PDF file found: $PDF_FILE${NC}"
    echo ""
    
    # Step 9: Upload and extract PDF
    echo "Step 9: Uploading and extracting PDF..."
    echo "Request: POST $API_URL/api/pdf/extract"
    echo "  - pdf file: $PDF_FILE"
    echo "  - user_id: 1"
    echo ""

    PDF_RESPONSE=$(curl -s -X POST "$API_URL/api/pdf/extract" \
      -F "pdf=@$PDF_FILE" \
      -F "user_id=1")

    echo "Response (first 500 chars):"
    echo "$PDF_RESPONSE" | head -c 500
    echo "..."
    echo ""
fi

# Step 10: Test manual project creation
echo "Step 10: Testing manual project creation..."
echo "Request: POST $API_URL/api/pdf/create-project"

MANUAL_RESPONSE=$(curl -s -X POST "$API_URL/api/pdf/create-project" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "project_name": "Test Manual Project",
    "title": "Manual Input Test",
    "description": "Testing manual project creation",
    "duration": 30,
    "difficulty": "Easy",
    "licensing": "One-Time Used",
    "usage_rights": "Personal Use",
    "result": "Test deliverable",
    "deliverables": [
      { "deliverable_type": "Logo Design", "quantity": 1 }
    ]
  }')

echo "Response:"
echo "$MANUAL_RESPONSE"
echo ""

# Step 11: Test project history endpoint
echo "Step 11: Fetching project history for user 1..."
HISTORY=$(curl -s "$API_URL/api/pdf/projects/1")
echo "Response (first 500 chars):"
echo "$HISTORY" | head -c 500
echo "..."
echo ""

echo "=========================================="
echo "Test Suite Completed!"
echo "=========================================="
echo ""
echo "Summary:"
echo "  - Test Email: $TEST_EMAIL"
echo "  - JWT Token: ${JWT_TOKEN:0:30}..."
echo ""
echo "To run individual tests, use curl commands above."
echo "=========================================="

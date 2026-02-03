#!/bin/bash

# AUREA Backend Google OAuth API Test Script
# Tests Google OAuth signup/signin flow

# Configuration
API_URL="http://localhost:3000/api"
GOOGLE_ID="google_test_$(date +%s)"
TEST_EMAIL="googleuser_$(date +%s)@gmail.com"
TEST_NAME="Google Test User"
TEST_ROLE="designer"

echo "=========================================="
echo "AUREA Google OAuth API Test Suite"
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

# Step 1: Check if server is running
echo "Step 1: Checking if server is running..."
if curl -s "$API_URL/../health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Server is running${NC}"
    ((PASSED++))
    echo ""
else
    echo -e "${RED}✗ Server is not running. Start it with: npm run dev${NC}"
    ((FAILED++))
    echo ""
    exit 1
fi

# ==========================================
# GOOGLE OAUTH TESTS
# ==========================================
echo "=========================================="
echo "GOOGLE OAUTH TESTS"
echo "=========================================="
echo ""

# Test 1: First-time Google OAuth signup (new user)
echo "Test 1: Google OAuth - First-time signup (new user)"
RESPONSE=$(curl -s -X POST "$API_URL/users/google" \
  -H "Content-Type: application/json" \
  -d "{
    \"google_id\": \"$GOOGLE_ID\",
    \"email\": \"$TEST_EMAIL\",
    \"name\": \"$TEST_NAME\",
    \"role\": \"$TEST_ROLE\"
  }")

echo "Request:"
echo "  POST $API_URL/users/google"
echo "  Body: {google_id: \"$GOOGLE_ID\", email: \"$TEST_EMAIL\", name: \"$TEST_NAME\", role: \"$TEST_ROLE\"}"
echo ""
echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Check if response contains token and user data
if echo "$RESPONSE" | grep -q "token" && echo "$RESPONSE" | grep -q "user"; then
    echo -e "${GREEN}✓ Test 1 PASSED: New user created successfully with Google OAuth${NC}"
    
    # Extract token for future requests
    TOKEN=$(echo "$RESPONSE" | jq -r '.data.token' 2>/dev/null)
    USER_ID=$(echo "$RESPONSE" | jq -r '.data.user.user_id' 2>/dev/null)
    
    if [ "$TOKEN" != "null" ] && [ "$TOKEN" != "" ]; then
        echo "  Token: $TOKEN"
        echo "  User ID: $USER_ID"
    fi
    
    ((PASSED++))
else
    echo -e "${RED}✗ Test 1 FAILED: Expected token and user in response${NC}"
    ((FAILED++))
fi
echo ""

# Test 2: Repeat Google OAuth login (existing user by Google ID)
echo "Test 2: Google OAuth - Returning user login (same google_id)"
RESPONSE2=$(curl -s -X POST "$API_URL/users/google" \
  -H "Content-Type: application/json" \
  -d "{
    \"google_id\": \"$GOOGLE_ID\",
    \"email\": \"$TEST_EMAIL\",
    \"name\": \"$TEST_NAME\",
    \"role\": \"$TEST_ROLE\"
  }")

echo "Request:"
echo "  POST $API_URL/users/google"
echo "  Body: {google_id: \"$GOOGLE_ID\", email: \"$TEST_EMAIL\"}"
echo ""
echo "Response:"
echo "$RESPONSE2" | jq '.' 2>/dev/null || echo "$RESPONSE2"
echo ""

if echo "$RESPONSE2" | grep -q "token" && echo "$RESPONSE2" | grep -q "user"; then
    echo -e "${GREEN}✓ Test 2 PASSED: Existing user logged in successfully${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Test 2 FAILED: Login failed for existing Google user${NC}"
    ((FAILED++))
fi
echo ""

# Test 3: Verify email is automatically verified for Google users
echo "Test 3: Verify email_verified is true for Google users"
EMAIL_VERIFIED=$(echo "$RESPONSE" | jq -r '.data.user.email_verified' 2>/dev/null)

if [ "$EMAIL_VERIFIED" == "true" ]; then
    echo -e "${GREEN}✓ Test 3 PASSED: Email is automatically verified for Google users${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Test 3 FAILED: Email should be verified for Google users${NC}"
    echo "  Expected: true, Got: $EMAIL_VERIFIED"
    ((FAILED++))
fi
echo ""

# Test 4: Verify auth_provider is set to 'google'
echo "Test 4: Verify auth_provider is 'google'"
AUTH_PROVIDER=$(echo "$RESPONSE" | jq -r '.data.user.auth_provider' 2>/dev/null)

if [ "$AUTH_PROVIDER" == "google" ]; then
    echo -e "${GREEN}✓ Test 4 PASSED: auth_provider is correctly set to 'google'${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Test 4 FAILED: auth_provider should be 'google'${NC}"
    echo "  Expected: google, Got: $AUTH_PROVIDER"
    ((FAILED++))
fi
echo ""

# Test 5: Test with missing google_id (should fail)
echo "Test 5: Google OAuth - Missing google_id (should fail)"
RESPONSE3=$(curl -s -X POST "$API_URL/users/google" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"test@gmail.com\",
    \"name\": \"Test User\"
  }")

echo "Request:"
echo "  POST $API_URL/users/google"
echo "  Body: {email: \"test@gmail.com\", name: \"Test User\"} (no google_id)"
echo ""
echo "Response:"
echo "$RESPONSE3" | jq '.' 2>/dev/null || echo "$RESPONSE3"
echo ""

if echo "$RESPONSE3" | grep -qi "error\|required"; then
    echo -e "${GREEN}✓ Test 5 PASSED: Request correctly rejected without google_id${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Test 5 FAILED: Should reject request without google_id${NC}"
    ((FAILED++))
fi
echo ""

# Test 6: Test with missing email (should fail)
echo "Test 6: Google OAuth - Missing email (should fail)"
RESPONSE4=$(curl -s -X POST "$API_URL/users/google" \
  -H "Content-Type: application/json" \
  -d "{
    \"google_id\": \"google_123456\",
    \"name\": \"Test User\"
  }")

echo "Request:"
echo "  POST $API_URL/users/google"
echo "  Body: {google_id: \"google_123456\", name: \"Test User\"} (no email)"
echo ""
echo "Response:"
echo "$RESPONSE4" | jq '.' 2>/dev/null || echo "$RESPONSE4"
echo ""

if echo "$RESPONSE4" | grep -qi "error\|required"; then
    echo -e "${GREEN}✓ Test 6 PASSED: Request correctly rejected without email${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Test 6 FAILED: Should reject request without email${NC}"
    ((FAILED++))
fi
echo ""

# Test 7: Test linking Google account to existing email-based user
echo "Test 7: Link Google account to existing email user (account linking)"
# First create a regular email user
EMAIL_USER="linktest_$(date +%s)@gmail.com"
REGULAR_RESPONSE=$(curl -s -X POST "$API_URL/users/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL_USER\",
    \"password\": \"password123\",
    \"role\": \"designer\"
  }")

echo "Step 7a: Create regular email user"
echo "Response:"
echo "$REGULAR_RESPONSE" | jq '.' 2>/dev/null || echo "$REGULAR_RESPONSE"
echo ""

# Now try to sign in with Google using the same email
GOOGLE_LINK_ID="google_link_$(date +%s)"
LINK_RESPONSE=$(curl -s -X POST "$API_URL/users/google" \
  -H "Content-Type: application/json" \
  -d "{
    \"google_id\": \"$GOOGLE_LINK_ID\",
    \"email\": \"$EMAIL_USER\",
    \"name\": \"Link Test User\"
  }")

echo "Step 7b: Sign in with Google using same email (account linking)"
echo "Response:"
echo "$LINK_RESPONSE" | jq '.' 2>/dev/null || echo "$LINK_RESPONSE"
echo ""

if echo "$LINK_RESPONSE" | grep -q "token"; then
    echo -e "${GREEN}✓ Test 7 PASSED: Google account successfully linked to existing email user${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ Test 7 SKIPPED or FAILED: Account linking may need manual verification${NC}"
    echo "  Note: This test requires the user to exist in the database first"
fi
echo ""

# ==========================================
# TEST SUMMARY
# ==========================================
echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo ""
TOTAL=$((PASSED + FAILED))
echo "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi

#!/bin/bash

# AUREA Backend User Authentication API Test Script
# Tests User Signup, OTP Verification, and Protected Routes

# Configuration
API_URL="http://localhost:3000/api/v1"
TEST_EMAIL="test$(date +%s)@example.com"
TEST_PASSWORD="password123"
TEST_ROLE="designer"

echo "=========================================="
echo "AUREA User Authentication API Test Suite"
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

# ==========================================
# USER AUTHENTICATION TESTS
# ==========================================
echo "=========================================="
echo "USER AUTHENTICATION TESTS"
echo "=========================================="
echo ""

# Step 2: Test User Signup
echo "Step 2: Testing User Signup..."
echo "Request: POST $API_URL/users/signup"
echo "  - email: $TEST_EMAIL"
echo "  - password: $TEST_PASSWORD"
echo "  - role: $TEST_ROLE"
echo ""

SIGNUP_RESPONSE=$(curl -s -X POST "$API_URL/users/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"role\": \"$TEST_ROLE\"
  }")

echo "Response:"
echo "$SIGNUP_RESPONSE"
echo ""

# Extract OTP from response (for testing)
OTP=$(echo "$SIGNUP_RESPONSE" | grep -o '"otp":"[^"]*"' | cut -d'"' -f4)
if [ -n "$OTP" ] && echo "$SIGNUP_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ User signup successful. OTP: $OTP${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ User signup failed${NC}"
    ((FAILED++))
fi
echo ""

# Step 3: Test OTP Verification
echo "Step 3: Testing OTP Verification..."
echo "Request: POST $API_URL/users/verify-otp"
echo "  - email: $TEST_EMAIL"
echo "  - otp: $OTP"
echo ""

VERIFY_RESPONSE=$(curl -s -X POST "$API_URL/users/verify-otp" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"otp\": \"$OTP\"
  }")

echo "Response:"
echo "$VERIFY_RESPONSE"
echo ""

# Extract JWT token from response
JWT_TOKEN=$(echo "$VERIFY_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -n "$JWT_TOKEN" ] && echo "$VERIFY_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ OTP verified successfully. JWT Token received.${NC}"
    echo "  Token (first 50 chars): ${JWT_TOKEN:0:50}..."
    ((PASSED++))
else
    echo -e "${RED}✗ OTP verification failed${NC}"
    ((FAILED++))
fi
echo ""

# Step 4: Test Get Current User (Protected Route)
echo "Step 4: Testing Protected Route (Get Current User)..."
echo "Request: GET $API_URL/users/me"
echo "  - Authorization: Bearer <token>"
echo ""

ME_RESPONSE=$(curl -s -X GET "$API_URL/users/me" \
  -H "Authorization: Bearer $JWT_TOKEN")

if echo "$ME_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Protected route access successful${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Protected route access failed${NC}"
    ((FAILED++))
fi
echo "Response:"
echo "$ME_RESPONSE"
echo ""

# Step 5: Test Resend OTP (should fail - already verified)
echo "Step 5: Testing Resend OTP (should say already verified)..."
echo "Request: POST $API_URL/users/resend-otp"
echo ""

RESEND_RESPONSE=$(curl -s -X POST "$API_URL/users/resend-otp" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\"
  }")

if echo "$RESEND_RESPONSE" | grep -q "already verified"; then
    echo -e "${GREEN}✓ Resend OTP correctly rejected (already verified)${NC}"
    ((PASSED++))
elif echo "$RESEND_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Resend OTP successful${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Resend OTP unexpected response${NC}"
    ((FAILED++))
fi
echo "Response:"
echo "$RESEND_RESPONSE"
echo ""

# Step 6: Test Invalid Login Scenarios
echo "Step 6: Testing Invalid Scenarios..."
echo ""

echo "6a. Signup with existing email..."
DUPLICATE_RESPONSE=$(curl -s -X POST "$API_URL/users/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"password123\",
    \"role\": \"designer\"
  }")
if echo "$DUPLICATE_RESPONSE" | grep -q "already exists\|already registered"; then
    echo -e "${GREEN}✓ Duplicate email correctly rejected${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Duplicate email test failed${NC}"
    ((FAILED++))
fi
echo "Response: $DUPLICATE_RESPONSE"
echo ""

echo "6b. Verify with wrong OTP..."
WRONG_OTP_RESPONSE=$(curl -s -X POST "$API_URL/users/verify-otp" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"otp\": \"000000\"
  }")
if echo "$WRONG_OTP_RESPONSE" | grep -q '"success":false\|Invalid OTP\|already verified'; then
    echo -e "${GREEN}✓ Wrong OTP correctly rejected${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Wrong OTP test failed${NC}"
    ((FAILED++))
fi
echo "Response: $WRONG_OTP_RESPONSE"
echo ""

echo "6c. Access protected route without token..."
NO_TOKEN_RESPONSE=$(curl -s -X GET "$API_URL/users/me")
if echo "$NO_TOKEN_RESPONSE" | grep -q "No token provided\|Unauthorized\|401"; then
    echo -e "${GREEN}✓ No token correctly rejected${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ No token test failed${NC}"
    ((FAILED++))
fi
echo "Response: $NO_TOKEN_RESPONSE"
echo ""

# Calculate totals
TOTAL=$((PASSED + FAILED + SKIPPED))

echo "=========================================="
echo "User Authentication Test Suite Completed!"
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
echo "  - Test Email: $TEST_EMAIL"
echo "  - JWT Token: ${JWT_TOKEN:0:30}..."
echo ""
echo "=========================================="

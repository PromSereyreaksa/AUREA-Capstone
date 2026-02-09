#!/bin/bash

# AUREA Backend Password Recovery & User Names API Test Script
# Tests: Signup with names, Forgot Password, Reset Password flow

# Configuration
API_URL="http://localhost:3000/api/v1"
TIMESTAMP=$(date +%s)
TEST_EMAIL="reset_test_${TIMESTAMP}@test.com"
TEST_PASSWORD="password123"
NEW_PASSWORD="newSecurePass456"
TEST_FIRST_NAME="Test"
TEST_LAST_NAME="User"

echo "=========================================="
echo "AUREA Password Recovery & Names Test Suite"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test tracking
PASSED=0
FAILED=0
SKIPPED=0

# ==========================================
# STEP 1: Health Check
# ==========================================
echo -e "${CYAN}Step 1: Checking if server is running...${NC}"
if curl -s "$API_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Server is running${NC}"
    ((PASSED++))
    echo ""
else
    echo -e "${RED}✗ Server is not running. Start it with: npm run dev${NC}"
    ((FAILED++))
    exit 1
fi

# ==========================================
# PART A: SIGNUP WITH FIRST_NAME / LAST_NAME
# ==========================================
echo "=========================================="
echo "PART A: SIGNUP WITH USER NAMES"
echo "=========================================="
echo ""

# Step 2: Test Signup with first_name and last_name
echo -e "${CYAN}Step 2: Testing Signup with first_name and last_name...${NC}"
echo "  POST $API_URL/users/signup"
echo "  email: $TEST_EMAIL"
echo "  first_name: $TEST_FIRST_NAME"
echo "  last_name: $TEST_LAST_NAME"
echo ""

SIGNUP_RESPONSE=$(curl -s -X POST "$API_URL/users/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"first_name\": \"$TEST_FIRST_NAME\",
    \"last_name\": \"$TEST_LAST_NAME\"
  }")

echo "Response:"
echo "$SIGNUP_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$SIGNUP_RESPONSE"
echo ""

# Check for first_name in response
if echo "$SIGNUP_RESPONSE" | grep -q '"first_name"' && echo "$SIGNUP_RESPONSE" | grep -q '"last_name"'; then
    echo -e "${GREEN}✓ Signup response includes first_name and last_name${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Signup response missing first_name or last_name${NC}"
    ((FAILED++))
fi

# Extract OTP
OTP=$(echo "$SIGNUP_RESPONSE" | grep -o '"otp":"[^"]*"' | cut -d'"' -f4)
echo ""

# Step 3: Test Signup without first_name (should fail validation)
echo -e "${CYAN}Step 3: Testing Signup without first_name (should fail)...${NC}"
NO_NAME_RESPONSE=$(curl -s -X POST "$API_URL/users/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"noname_${TIMESTAMP}@test.com\",
    \"password\": \"$TEST_PASSWORD\"
  }")

if echo "$NO_NAME_RESPONSE" | grep -q '"success":false\|First name is required'; then
    echo -e "${GREEN}✓ Signup correctly rejected without first_name${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Signup should have rejected missing first_name${NC}"
    ((FAILED++))
fi
echo "Response: $NO_NAME_RESPONSE"
echo ""

# Step 4: Verify OTP to get a working account
echo -e "${CYAN}Step 4: Verifying OTP...${NC}"
if [ -n "$OTP" ]; then
    VERIFY_RESPONSE=$(curl -s -X POST "$API_URL/users/verify-otp" \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"$TEST_EMAIL\",
        \"otp\": \"$OTP\"
      }")

    JWT_TOKEN=$(echo "$VERIFY_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$JWT_TOKEN" ]; then
        echo -e "${GREEN}✓ OTP verified. JWT received.${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ OTP verification failed${NC}"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠ No OTP available, skipping verification${NC}"
    ((SKIPPED++))
fi
echo ""

# Step 5: Get current user - check names are returned
echo -e "${CYAN}Step 5: Testing GET /me includes first_name and last_name...${NC}"
if [ -n "$JWT_TOKEN" ]; then
    ME_RESPONSE=$(curl -s -X GET "$API_URL/users/me" \
      -H "Authorization: Bearer $JWT_TOKEN")

    echo "Response:"
    echo "$ME_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$ME_RESPONSE"
    echo ""

    if echo "$ME_RESPONSE" | grep -q "\"first_name\":\"$TEST_FIRST_NAME\""; then
        echo -e "${GREEN}✓ GET /me returns correct first_name${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ GET /me missing or wrong first_name${NC}"
        ((FAILED++))
    fi

    if echo "$ME_RESPONSE" | grep -q "\"last_name\":\"$TEST_LAST_NAME\""; then
        echo -e "${GREEN}✓ GET /me returns correct last_name${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ GET /me missing or wrong last_name${NC}"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠ No JWT token, skipping /me test${NC}"
    ((SKIPPED++))
    ((SKIPPED++))
fi
echo ""

# Step 6: Test Sign In returns names
echo -e "${CYAN}Step 6: Testing Sign In includes first_name and last_name...${NC}"
SIGNIN_RESPONSE=$(curl -s -X POST "$API_URL/users/signin" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

echo "Response:"
echo "$SIGNIN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$SIGNIN_RESPONSE"
echo ""

if echo "$SIGNIN_RESPONSE" | grep -q '"first_name"' && echo "$SIGNIN_RESPONSE" | grep -q '"last_name"'; then
    echo -e "${GREEN}✓ Sign In response includes first_name and last_name${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Sign In response missing first_name or last_name${NC}"
    ((FAILED++))
fi
echo ""

# ==========================================
# PART B: FORGOT PASSWORD FLOW
# ==========================================
echo "=========================================="
echo "PART B: FORGOT PASSWORD FLOW"
echo "=========================================="
echo ""

# Step 7: Test Forgot Password with valid email
echo -e "${CYAN}Step 7: Testing Forgot Password with valid email...${NC}"
echo "  POST $API_URL/users/forgot-password"
echo "  email: $TEST_EMAIL"
echo ""

FORGOT_RESPONSE=$(curl -s -X POST "$API_URL/users/forgot-password" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\"
  }")

echo "Response:"
echo "$FORGOT_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$FORGOT_RESPONSE"
echo ""

if echo "$FORGOT_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Forgot password request successful${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Forgot password request failed${NC}"
    ((FAILED++))
fi
echo ""

# Step 8: Test Forgot Password with non-existent email (should still return success for security)
echo -e "${CYAN}Step 8: Testing Forgot Password with non-existent email (should still succeed)...${NC}"
FORGOT_FAKE_RESPONSE=$(curl -s -X POST "$API_URL/users/forgot-password" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"nonexistent_${TIMESTAMP}@fake.com\"
  }")

if echo "$FORGOT_FAKE_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Returns success for non-existent email (prevents email enumeration)${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Should return success even for non-existent email${NC}"
    ((FAILED++))
fi
echo "Response: $FORGOT_FAKE_RESPONSE"
echo ""

# Step 9: Test Forgot Password with invalid email format
echo -e "${CYAN}Step 9: Testing Forgot Password with invalid email format...${NC}"
FORGOT_INVALID_RESPONSE=$(curl -s -X POST "$API_URL/users/forgot-password" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"not-an-email\"
  }")

if echo "$FORGOT_INVALID_RESPONSE" | grep -q '"success":false\|Invalid email'; then
    echo -e "${GREEN}✓ Invalid email format correctly rejected${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Should reject invalid email format${NC}"
    ((FAILED++))
fi
echo "Response: $FORGOT_INVALID_RESPONSE"
echo ""

# Step 10: Test Forgot Password with empty email
echo -e "${CYAN}Step 10: Testing Forgot Password with empty email...${NC}"
FORGOT_EMPTY_RESPONSE=$(curl -s -X POST "$API_URL/users/forgot-password" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"\"
  }")

if echo "$FORGOT_EMPTY_RESPONSE" | grep -q '"success":false\|Email is required'; then
    echo -e "${GREEN}✓ Empty email correctly rejected${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Should reject empty email${NC}"
    ((FAILED++))
fi
echo "Response: $FORGOT_EMPTY_RESPONSE"
echo ""

# ==========================================
# PART C: RESET PASSWORD FLOW
# ==========================================
echo "=========================================="
echo "PART C: RESET PASSWORD VALIDATION"
echo "=========================================="
echo ""

# Step 11: Test Reset Password with invalid token
echo -e "${CYAN}Step 11: Testing Reset Password with invalid token...${NC}"
RESET_INVALID_RESPONSE=$(curl -s -X POST "$API_URL/users/reset-password" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"token\": \"invalid-token-12345\",
    \"new_password\": \"$NEW_PASSWORD\",
    \"confirm_password\": \"$NEW_PASSWORD\"
  }")

if echo "$RESET_INVALID_RESPONSE" | grep -q '"success":false\|Invalid\|expired'; then
    echo -e "${GREEN}✓ Invalid token correctly rejected${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Should reject invalid token${NC}"
    ((FAILED++))
fi
echo "Response: $RESET_INVALID_RESPONSE"
echo ""

# Step 12: Test Reset Password with mismatched passwords
echo -e "${CYAN}Step 12: Testing Reset Password with mismatched passwords...${NC}"
RESET_MISMATCH_RESPONSE=$(curl -s -X POST "$API_URL/users/reset-password" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"token\": \"sometoken\",
    \"new_password\": \"password1\",
    \"confirm_password\": \"password2\"
  }")

if echo "$RESET_MISMATCH_RESPONSE" | grep -q '"success":false\|do not match'; then
    echo -e "${GREEN}✓ Mismatched passwords correctly rejected${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Should reject mismatched passwords${NC}"
    ((FAILED++))
fi
echo "Response: $RESET_MISMATCH_RESPONSE"
echo ""

# Step 13: Test Reset Password with short password
echo -e "${CYAN}Step 13: Testing Reset Password with short password...${NC}"
RESET_SHORT_RESPONSE=$(curl -s -X POST "$API_URL/users/reset-password" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"token\": \"sometoken\",
    \"new_password\": \"12345\",
    \"confirm_password\": \"12345\"
  }")

if echo "$RESET_SHORT_RESPONSE" | grep -q '"success":false\|at least 6'; then
    echo -e "${GREEN}✓ Short password correctly rejected${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Should reject short password${NC}"
    ((FAILED++))
fi
echo "Response: $RESET_SHORT_RESPONSE"
echo ""

# Step 14: Test Reset Password with missing fields
echo -e "${CYAN}Step 14: Testing Reset Password with missing fields...${NC}"
RESET_MISSING_RESPONSE=$(curl -s -X POST "$API_URL/users/reset-password" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\"
  }")

if echo "$RESET_MISSING_RESPONSE" | grep -q '"success":false\|required'; then
    echo -e "${GREEN}✓ Missing fields correctly rejected${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Should reject missing fields${NC}"
    ((FAILED++))
fi
echo "Response: $RESET_MISSING_RESPONSE"
echo ""

# ==========================================
# RESULTS SUMMARY
# ==========================================
TOTAL=$((PASSED + FAILED + SKIPPED))

echo "=========================================="
echo "Password Recovery & Names Test Completed!"
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
echo "  - Note: Full end-to-end password reset requires checking email for the token"
echo "    The forgot-password endpoint sends an email with a reset link."
echo "    To test the complete flow manually:"
echo "    1. Call POST /users/forgot-password with a real email"
echo "    2. Check email inbox for the reset link"
echo "    3. Extract the token from the link URL"
echo "    4. Call POST /users/reset-password with the token"
echo ""
echo "=========================================="

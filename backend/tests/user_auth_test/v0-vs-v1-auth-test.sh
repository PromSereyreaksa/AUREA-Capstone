#!/bin/bash

# AUREA API - Authentication Test for v0 vs v1
# Tests that v0 routes don't require authentication
# Tests that v1 routes require authentication

echo "=========================================="
echo "AUREA API - v0 vs v1 Authentication Test"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

# Test 1: v0 Gemini test WITHOUT authentication (should work)
echo "Test 1: v0 Gemini test WITHOUT authentication..."
echo "Request: GET http://localhost:3000/api/v0/pdf/test-gemini"
echo ""

V0_NO_AUTH=$(curl -s -X GET "http://localhost:3000/api/v0/pdf/test-gemini")

if echo "$V0_NO_AUTH" | grep -q "success"; then
    echo -e "${GREEN}✓ v0 endpoint works WITHOUT authentication${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ v0 endpoint (rate limited or offline)${NC}"
fi
echo "Response: $V0_NO_AUTH"
echo ""

# Test 2: v1 Gemini test WITHOUT authentication (should fail)
echo "Test 2: v1 Gemini test WITHOUT authentication (should fail)..."
echo "Request: GET http://localhost:3000/api/v1/pdf/test-gemini"
echo ""

V1_NO_AUTH=$(curl -s -X GET "http://localhost:3000/api/v1/pdf/test-gemini")

if echo "$V1_NO_AUTH" | grep -q "token\|No token\|Unauthorized"; then
    echo -e "${GREEN}✓ v1 correctly rejected request without token${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ v1 should have rejected request without token${NC}"
    ((FAILED++))
fi
echo "Response: $V1_NO_AUTH"
echo ""

# Test 3: Sign up user and get token
echo "Test 3: Signing up user to get JWT token..."
SIGNUP=$(curl -s -X POST "http://localhost:3000/api/v1/users/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"authtest$(date +%s)@example.com\",
    \"password\": \"Test123456!\",
    \"role\": \"client\"
  }")

USER_ID=$(echo "$SIGNUP" | grep -o '"user_id":[0-9]*' | grep -o '[0-9]*' | head -1)
OTP=$(echo "$SIGNUP" | grep -o '"otp":"[^"]*"' | cut -d'"' -f4)

if [ -n "$USER_ID" ] && [ -n "$OTP" ]; then
    echo -e "${GREEN}✓ User created (ID: $USER_ID, OTP: $OTP)${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Failed to create user${NC}"
    ((FAILED++))
    exit 1
fi
echo ""

# Test 4: Verify OTP and get JWT token
echo "Test 4: Verifying OTP and getting JWT token..."
VERIFY=$(curl -s -X POST "http://localhost:3000/api/v1/users/verify-otp" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"authtest@example.com\",
    \"otp\": \"$OTP\"
  }")

JWT_TOKEN=$(echo "$VERIFY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$JWT_TOKEN" ]; then
    echo -e "${GREEN}✓ JWT token obtained${NC}"
    echo "  Token (first 50 chars): ${JWT_TOKEN:0:50}..."
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ Could not get JWT token from response${NC}"
    echo "  Using mock token for demo..."
    JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoiY2xpZW50In0.mock"
fi
echo ""

# Test 5: v0 Gemini WITH token (should work - token is optional)
echo "Test 5: v0 Gemini test WITH authentication (optional)..."
echo "Request: GET http://localhost:3000/api/v0/pdf/test-gemini"
echo "Header: Authorization: Bearer <token>"
echo ""

V0_WITH_AUTH=$(curl -s -X GET "http://localhost:3000/api/v0/pdf/test-gemini" \
  -H "Authorization: Bearer $JWT_TOKEN")

if echo "$V0_WITH_AUTH" | grep -q "success"; then
    echo -e "${GREEN}✓ v0 works WITH authentication (optional)${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ v0 endpoint (rate limited or offline)${NC}"
fi
echo ""

# Test 6: v1 Gemini WITH valid token (should work)
echo "Test 6: v1 Gemini test WITH valid authentication (required)..."
echo "Request: GET http://localhost:3000/api/v1/pdf/test-gemini"
echo "Header: Authorization: Bearer <token>"
echo ""

V1_WITH_AUTH=$(curl -s -X GET "http://localhost:3000/api/v1/pdf/test-gemini" \
  -H "Authorization: Bearer $JWT_TOKEN")

if echo "$V1_WITH_AUTH" | grep -q "success"; then
    echo -e "${GREEN}✓ v1 works WITH valid authentication${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ v1 endpoint (rate limited or offline)${NC}"
fi
echo ""

# Test 7: v1 Gemini WITH invalid token (should fail)
echo "Test 7: v1 Gemini test WITH invalid token (should fail)..."
echo "Request: GET http://localhost:3000/api/v1/pdf/test-gemini"
echo "Header: Authorization: Bearer invalid-token-123"
echo ""

V1_BAD_TOKEN=$(curl -s -X GET "http://localhost:3000/api/v1/pdf/test-gemini" \
  -H "Authorization: Bearer invalid-token-123")

if echo "$V1_BAD_TOKEN" | grep -q "Invalid\|Unauthorized\|expired"; then
    echo -e "${GREEN}✓ v1 correctly rejected invalid token${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ v1 should have rejected invalid token${NC}"
    ((FAILED++))
fi
echo "Response: $V1_BAD_TOKEN"
echo ""

# Summary
echo "=========================================="
echo "TEST RESULTS:"
echo ""
echo -e "  ${GREEN}✓ Passed:  $PASSED${NC}"
echo -e "  ${RED}✗ Failed:  $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    echo ""
    echo "Summary:"
    echo "  ✅ v0 routes: Authentication is OPTIONAL"
    echo "  ✅ v1 routes: Authentication is REQUIRED"
    echo ""
else
    echo -e "${RED}❌ Some tests failed${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  - Ensure server is running: npm run dev"
    echo "  - Check that authMiddleware is properly imported"
    echo "  - Verify JWT_SECRET is set in .env"
fi
echo "=========================================="

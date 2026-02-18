#!/bin/bash
# Portfolio API Test Script

# Configuration
BASE_URL="http://localhost:3000/api/v0/portfolio"
TOKEN="YOUR_JWT_TOKEN_HERE"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "============================================"
echo "Portfolio API Test"
echo "============================================"
echo ""

# Check if token is provided as argument
if [ -n "$1" ]; then
    TOKEN="$1"
fi

if [ "$TOKEN" == "YOUR_JWT_TOKEN_HERE" ]; then
    echo -e "${YELLOW}Warning: Using default token. Pass your JWT token as first argument:${NC}"
    echo "  ./test-portfolio.sh <your-jwt-token> [pdf-file-path]"
    echo ""
fi

# ============================================
# Test 1: Get Portfolio
# ============================================
echo -e "${YELLOW}Test 1: GET /portfolio${NC}"
echo "Getting current user's portfolio..."
echo ""

curl -s -X GET "$BASE_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" \
  | jq .

echo ""
echo "============================================"

# ============================================
# Test 2: Upload Portfolio PDF
# ============================================
echo -e "${YELLOW}Test 2: POST /portfolio/pdf${NC}"

PDF_FILE="${2:-}"

if [ -z "$PDF_FILE" ]; then
    echo "Skipping PDF upload test - no PDF file provided"
    echo "Usage: ./test-portfolio.sh <jwt-token> <pdf-file-path>"
else
    if [ ! -f "$PDF_FILE" ]; then
        echo -e "${RED}Error: File not found: $PDF_FILE${NC}"
    else
        echo "Uploading portfolio PDF: $PDF_FILE"
        echo ""
        
        curl -s -X POST "$BASE_URL/pdf" \
          -F "pdf=@$PDF_FILE" \
          -H "Authorization: Bearer $TOKEN" \
          -H "Accept: application/json" \
          | jq .
    fi
fi

echo ""
echo "============================================"

# ============================================
# Test 3: Update Portfolio (is_public)
# ============================================
echo -e "${YELLOW}Test 3: PUT /portfolio${NC}"
echo "Updating portfolio is_public to true..."
echo ""

curl -s -X PUT "$BASE_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"is_public": true}' \
  | jq .

echo ""
echo "============================================"

# ============================================
# Test 4: Get Portfolio Again (verify update)
# ============================================
echo -e "${YELLOW}Test 4: GET /portfolio (verify update)${NC}"
echo "Verifying portfolio update..."
echo ""

curl -s -X GET "$BASE_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" \
  | jq .

echo ""
echo "============================================"
echo -e "${GREEN}Portfolio API Tests Complete!${NC}"
echo "============================================"

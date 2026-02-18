#!/bin/bash
# Simple Portfolio PDF upload test script

# Configuration
API_URL="http://localhost:3000/api/v0/portfolio/pdf"
TOKEN="YOUR_JWT_TOKEN_HERE"

# Check if PDF file is provided
if [ -z "$1" ]; then
    echo "Usage: ./test-portfolio-upload.sh <path-to-pdf> [jwt-token]"
    echo "Example: ./test-portfolio-upload.sh ./my-portfolio.pdf eyJhbGciOiJI..."
    exit 1
fi

PDF_FILE="$1"

# Use provided token or default
if [ -n "$2" ]; then
    TOKEN="$2"
fi

# Check if file exists
if [ ! -f "$PDF_FILE" ]; then
    echo "Error: File not found: $PDF_FILE"
    exit 1
fi

echo "============================================"
echo "Portfolio PDF Upload Test"
echo "============================================"
echo "PDF: $PDF_FILE"
echo "Endpoint: $API_URL"
echo "============================================"
echo ""

# Make the request
echo "Uploading Portfolio PDF..."
echo ""

curl -X POST "$API_URL" \
  -F "pdf=@$PDF_FILE" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" \
  | jq .

echo ""
echo "============================================"
echo "Done!"
echo "============================================"

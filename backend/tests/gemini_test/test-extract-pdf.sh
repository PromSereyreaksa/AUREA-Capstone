#!/bin/bash
# Simple PDF extraction test script

# Configuration
API_URL="http://localhost:3000/api/v0/pdf/extract"
USER_ID=80

# Check if PDF file is provided
if [ -z "$1" ]; then
    echo "Usage: ./test-extract-pdf.sh <path-to-pdf>"
    echo "Example: ./test-extract-pdf.sh ./samples/sample1.pdf"
    exit 1
fi

PDF_FILE="$1"

# Check if file exists
if [ ! -f "$PDF_FILE" ]; then
    echo "Error: File not found: $PDF_FILE"
    exit 1
fi

echo "============================================"
echo "PDF Extraction Test"
echo "============================================"
echo "PDF: $PDF_FILE"
echo "User ID: $USER_ID"
echo "Endpoint: $API_URL"
echo "============================================"
echo ""

# Make the request
echo "Extracting PDF..."
echo ""

curl -X POST "$API_URL" \
  -F "pdf=@$PDF_FILE" \
  -F "user_id=$USER_ID" \
  -H "Accept: application/json" \
  | jq .

echo ""
echo "============================================"
echo "Done!"
echo "============================================"

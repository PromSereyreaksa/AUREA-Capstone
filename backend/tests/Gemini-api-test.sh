#!/bin/bash

# Simple PDF Extraction API Test Script
# This script tests the PDF extraction endpoint without requiring jq

# Configuration
API_URL="http://localhost:3000"
PDF_FILE="PROJECT PROPOSAL DOCUMENT.pdf"
USER_ID="1"

echo "=========================================="
echo "PDF Extraction API Test"
echo "=========================================="
echo ""

# Step 1: Check if server is running
echo "Step 1: Checking if server is running..."
if curl -s "$API_URL/health" > /dev/null 2>&1; then
    HEALTH=$(curl -s "$API_URL/health")
    echo "✓ Server is running"
    echo "  Response: $HEALTH"
    echo ""
else
    echo "✗ Server is not running. Start it with: npm run dev"
    echo ""
    exit 1
fi

# Step 2: Check if PDF file exists
echo "Step 2: Checking if PDF file exists..."
if [ ! -f "$PDF_FILE" ]; then
    echo "✗ PDF file not found: $PDF_FILE"
    echo ""
    echo "Convert sample_project.txt to PDF using one of these commands:"
    echo "  libreoffice --headless --convert-to pdf sample_project.txt"
    echo "  pandoc sample_project.txt -o sample_project.pdf"
    echo "  text2pdf sample_project.txt > sample_project.pdf"
    echo ""
    exit 1
fi
echo "✓ PDF file found: $PDF_FILE"
echo ""

# Step 3: Test Gemini connection
echo "Step 3: Testing Gemini connection..."
GEMINI_TEST=$(curl -s "$API_URL/api/pdf/test-gemini")
echo "Response: $GEMINI_TEST"
echo ""

# Step 4: Upload and extract PDF
echo "Step 4: Uploading and extracting PDF..."
echo "Request: POST $API_URL/api/pdf/extract"
echo "  - pdf file: $PDF_FILE"
echo "  - user_id: $USER_ID"
echo ""

RESPONSE=$(curl -s -X POST "$API_URL/api/pdf/extract" \
  -F "pdf=@$PDF_FILE" \
  -F "user_id=$USER_ID")

echo "Response:"
echo "$RESPONSE" | head -c 500
echo "..."
echo ""

# Step 4: Test manual project creation
echo "Step 4: Testing manual project creation..."
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

# Step 5: Test project history endpoint
echo "Step 5: Fetching project history for user $USER_ID..."
HISTORY=$(curl -s "$API_URL/api/pdf/projects/$USER_ID")
echo "Response (first 500 chars):"
echo "$HISTORY" | head -c 500
echo "..."
echo ""

echo "=========================================="
echo "Test completed!"
echo "=========================================="

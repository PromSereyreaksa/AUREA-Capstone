#!/bin/bash

# Quick test to verify the pricing integration is working
# Usage: ./quick-test.sh

echo "🔍 Quick Pricing Integration Test"
echo "=================================="
echo ""

# Test if backend is running
echo "1. Testing backend connection..."
response=$(curl -s http://localhost:3000/api/v0/pdf/test-gemini)

if echo "$response" | grep -q "success"; then
    echo "   ✅ Backend is running and Gemini is connected"
else
    echo "   ❌ Backend not responding correctly"
    echo "   Response: $response"
    exit 1
fi

echo ""
echo "2. Testing project extraction with pricing..."
echo "   (This will take ~10-15 seconds)"
echo ""

# Test extraction with proper timeout
response=$(timeout 45 curl -s -X POST \
    "http://localhost:3000/api/v0/pdf/extract?calculate_pricing=true&use_grounding=false" \
    -F "pdf=@samples/pdf/PRICING_TEST_01-STARTUP_RUSH.pdf" \
    -F "user_id=88")

# Check for success
if echo "$response" | grep -q '"success":true'; then
    echo "   ✅ Extraction successful!"
    echo ""
    
    # Extract key info
    echo "📊 Results:"
    echo "$response" | jq -r '
        "   Project: " + (.data.project.project_name // "N/A"),
        "   Client Type: " + (.data.clientContext.client_type // "N/A"),
        "   Urgency: " + (.data.clientContext.urgency // "N/A"),
        "   Estimated Hours: " + (.data.clientContext.estimated_project_hours // "N/A" | tostring),
        "",
        "💰 Pricing:",
        "   Hourly Rate: $" + (.data.pricing.final_hourly_rate // 0 | tostring),
        "   Project Total: $" + (.data.pricing.project_total_estimate // 0 | tostring),
        "   Estimated Hours: " + (.data.pricing.estimated_hours // 0 | tostring),
        "",
        "🔍 Sources: " + ((.data.pricing.sources // []) | length | tostring) + " sources found"
    ' 2>/dev/null || echo "$response" | grep -o '"final_hourly_rate":[0-9.]*' | head -1
    
    echo ""
    echo "✅ Integration is working!"
else
    echo "   ❌ Test failed"
    echo "   Error: $(echo "$response" | jq -r '.error.message' 2>/dev/null || echo "$response")"
    exit 1
fi

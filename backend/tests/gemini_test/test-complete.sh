#!/bin/bash

# Complete test workflow: Create user → Test extraction with pricing
# This script handles the full end-to-end test

set -e

echo "🚀 Complete Pricing Integration Test"
echo "===================================="
echo ""

API_BASE="http://localhost:3000/api/v0"
TEST_EMAIL="pricingtest@aurea.com"
TEST_PASSWORD="TestPass123!"

# Step 1: Create test user (or use existing)
echo "1️⃣  Creating test user..."
signup_response=$(curl -s -X POST "$API_BASE/users/signup" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"first_name\":\"Pricing\",\"last_name\":\"Test\"}")

if echo "$signup_response" | grep -q '"success":true'; then
    echo "   ✅ Test user created"
    temp_user_id=$(echo "$signup_response" | grep -o '"user_id":[0-9]*' | cut -d':' -f2)
    echo "   User ID: $temp_user_id"
elif echo "$signup_response" | grep -q "already exists"; then
    echo "   ℹ️  User already exists, signing in..."
    
    # Sign in to get user_id
    signin_response=$(curl -s -X POST "$API_BASE/users/signin" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
    
    if echo "$signin_response" | grep -q '"success":true'; then
        temp_user_id=$(echo "$signin_response" | grep -o '"user_id":[0-9]*' | cut -d':' -f2)
        echo "   ✅ Signed in successfully"
        echo "   User ID: $temp_user_id"
    else
        echo "   ❌ Failed to sign in"
        echo "   Creating new unique user..."
        random_email="test$(date +%s)@aurea.com"
        signup_response=$(curl -s -X POST "$API_BASE/users/signup" \
            -H "Content-Type: application/json" \
            -d "{\"email\":\"$random_email\",\"password\":\"$TEST_PASSWORD\",\"first_name\":\"Test\",\"last_name\":\"User\"}")
        temp_user_id=$(echo "$signup_response" | grep -o '"user_id":[0-9]*' | cut -d':' -f2)
        echo "   ✅ New user created with email: $random_email"
        echo "   User ID: $temp_user_id"
    fi
else
    echo "   ⚠️  Unexpected response: $signup_response"
    echo "   Trying with random email..."
    random_email="test$(date +%s)@aurea.com"
    signup_response=$(curl -s -X POST "$API_BASE/users/signup" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$random_email\",\"password\":\"$TEST_PASSWORD\",\"first_name\":\"Test\",\"last_name\":\"User\"}")
    temp_user_id=$(echo "$signup_response" | grep -o '"user_id":[0-9]*' | cut -d':' -f2)
    echo "   ✅ User created: $random_email"
    echo "   User ID: $temp_user_id"
fi

echo ""

# Step 2: Test extraction with pricing
echo "2️⃣  Testing PDF extraction with pricing..."
echo "   File: PRICING_TEST_01-STARTUP_RUSH.pdf"
echo "   (This will take 10-20 seconds with Google Search)"
echo ""

response=$(curl -s -X POST \
    "$API_BASE/pdf/extract?calculate_pricing=true&use_grounding=true" \
    -F "pdf=@samples/pdf/PRICING_TEST_01-STARTUP_RUSH.pdf" \
    -F "user_id=$temp_user_id")

# Check for success
if echo "$response" | grep -q '"success":true'; then
    echo "   ✅ Extraction and pricing successful!"
    echo ""
    
    # Save full response
    response_file="test_result_$(date +%s).json"
    echo "$response" > "$response_file"
    echo "   📄 Full response saved to: $response_file"
    echo ""
    
    # Extract and display key metrics
    echo "📊 EXTRACTION RESULTS"
    echo "===================="
    project_name=$(echo "$response" | grep -o '"project_name":"[^"]*"' | head -1 | cut -d'"' -f4)
    client_type=$(echo "$response" | grep -o '"client_type":"[^"]*"' | head -1 | cut -d'"' -f4)
    urgency=$(echo "$response" | grep -o '"urgency":"[^"]*"' | head -1 | cut -d'"' -f4)
    deliverable_count=$(echo "$response" | grep -o '"deliverables":\[' | wc -l)
    
    echo "Project Name: $project_name"
    echo "Client Type: $client_type"
    echo "Urgency: $urgency"
    echo ""
    
    echo "💰 PRICING RESULTS"
    echo "=================="
    hourly_rate=$(echo "$response" | grep -o '"final_hourly_rate":[0-9.]*' | head -1 | cut -d':' -f2)
    project_total=$(echo "$response" | grep -o '"project_total_estimate":[0-9.]*' | head -1 | cut -d':' -f2)
    estimated_hours=$(echo "$response" | grep -o '"estimated_hours":[0-9]*' | head -1 | cut -d':' -f2)
    sources_count=$(echo "$response" | grep -o '"sources":\[' | head -1 | wc -l)
    
    echo "Hourly Rate: \$$hourly_rate/hr"
    echo "Project Total: \$$project_total"
    echo "Estimated Hours: ${estimated_hours}hrs"
    echo "Research Sources: $(echo "$response" | grep -o '"uri":"[^"]*"' | wc -l) web sources found"
    echo ""
    
    # Extract adjustments
    echo "🔧 ADJUSTMENTS APPLIED"
    echo "====================="
    echo "$response" | grep -o '"reason":"[^"]*"' | cut -d'"' -f4 | while read line; do
        echo "  • $line"
    done
    echo ""
    
    echo "✅ SUCCESS! The integration is working correctly."
    echo ""
    echo "📝 Review the full JSON response in: $response_file"
    
else
    echo "   ❌ Test failed"
    error_msg=$(echo "$response" | grep -o '"message":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "   Error: $error_msg"
    echo ""
    echo "   Full response:"
    echo "$response" | head -20
    exit 1
fi

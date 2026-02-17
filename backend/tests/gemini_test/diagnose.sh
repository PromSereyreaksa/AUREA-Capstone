#!/bin/bash

# Simple diagnostic test
set -e

echo "🔍 Diagnostic Test"
echo "=================="
echo ""

cd /home/sou/Desktop/AUREA-Capstone/backend/tests/gemini_test

# Test 1: Server health
echo "1️⃣  Server health check..."
if curl -s http://localhost:3000/api/v0/health | grep -q '"success":true'; then
    echo "   ✅ Server is healthy"
else
    echo "   ❌ Server health check failed"
    exit 1
fi

# Test 2: Simple extraction (no pricing)
echo ""
echo "2️⃣  Testing simple PDF extraction (no pricing)..."
echo "   This should take ~5-10 seconds"

timeout 30 curl -s -X POST \
    "http://localhost:3000/api/v0/pdf/extract?calculate_pricing=false" \
    -F "pdf=@samples/pdf/PRICING_TEST_01-STARTUP_RUSH.pdf" \
    -F "user_id=88" \
    -o /tmp/extract_only.json

if [ -f /tmp/extract_only.json ]; then
    if cat /tmp/extract_only.json | grep -q '"success":true'; then
        echo "   ✅ Extraction successful"
        project_name=$(cat /tmp/extract_only.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('data',{}).get('project',{}).get('project_name','N/A'))" 2>/dev/null || echo "N/A")
        deliverables=$(cat /tmp/extract_only.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('data',{}).get('deliverables',[])))" 2>/dev/null || echo "0")
        echo "   Project: $project_name"
        echo "   Deliverables: $deliverables"
    else
        echo "   ❌ Extraction failed"
        cat /tmp/extract_only.json | head -20
        exit 1
    fi
else
    echo "   ❌ No response received (timeout)"
    exit 1
fi

# Test 3: Extraction WITH pricing but NO grounding
echo ""
echo "3️⃣  Testing extraction WITH pricing (no Google Search)..."
echo "   This should take ~10-15 seconds"

timeout 40 curl -s -X POST \
    "http://localhost:3000/api/v0/pdf/extract?calculate_pricing=true&use_grounding=false" \
    -F "pdf=@samples/pdf/PRICING_TEST_01-STARTUP_RUSH.pdf" \
    -F "user_id=88" \
    -o /tmp/extract_pricing.json

if [ -f /tmp/extract_pricing.json ]; then
    if cat /tmp/extract_pricing.json | grep -q '"success":true'; then
        echo "   ✅ Pricing calculation successful"
        
        hourly_rate=$(cat /tmp/extract_pricing.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('data',{}).get('pricing',{}).get('final_hourly_rate','N/A'))" 2>/dev/null || echo "N/A")
        project_total=$(cat /tmp/extract_pricing.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('data',{}).get('pricing',{}).get('project_total_estimate','N/A'))" 2>/dev/null || echo "N/A")
        
        echo "   Hourly Rate: \$$hourly_rate/hr"
        echo "   Project Total: \$$project_total"
        echo ""
        echo "   📄 Full response saved to: /tmp/extract_pricing.json"
    else
        echo "   ❌ Pricing calculation failed"
        cat /tmp/extract_pricing.json | head -20
        exit 1
    fi
else
    echo "   ❌ No response received (timeout)"
    exit 1
fi

echo ""
echo "✅ All diagnostic tests passed!"
echo ""
echo "📝 Response files:"
echo "   - /tmp/extract_only.json (extraction only)"
echo "   - /tmp/extract_pricing.json (with pricing)"

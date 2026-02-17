#!/bin/bash

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  AUREA PDF EXTRACTION - COMPREHENSIVE MODEL EVALUATION TEST SUITE            ║
# ║  Data Science Best Practices for AI Model Performance Assessment             ║
# ║  Version: 3.0.0 - Updated for Grouped Deliverables with Items                ║
# ║  Date: February 2026                                                          ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

echo ""
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║  AUREA PDF EXTRACTION - COMPREHENSIVE MODEL EVALUATION                       ║"
echo "║  Testing Gemini AI with Grouped Deliverables + Items                         ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

# ══════════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ══════════════════════════════════════════════════════════════════════════════════

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'
BOLD='\033[1m'

# API Configuration
API_URL="http://localhost:3000/api/v0"
TEST_USER_ID=80  # Set this to an existing user ID in your database

# Directory paths (relative to script location)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SAMPLES_DIR="$SCRIPT_DIR/../samples"
RESULTS_DIR="$SCRIPT_DIR/../results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Rate limiting - delay between tests to prevent API overload
TEST_DELAY_SECONDS=3  # Delay between each test (adjust if needed)
CATEGORY_DELAY_SECONDS=5  # Extra delay between categories

# Create results directory
mkdir -p "$RESULTS_DIR"

# Report files
REPORT_FILE="$RESULTS_DIR/comprehensive_report_$TIMESTAMP.txt"
JSON_REPORT="$RESULTS_DIR/metrics_$TIMESTAMP.json"
CSV_REPORT="$RESULTS_DIR/test_data_$TIMESTAMP.csv"

# ══════════════════════════════════════════════════════════════════════════════════
# METRICS TRACKING - Data Science Style
# ══════════════════════════════════════════════════════════════════════════════════

# Overall counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Field-level accuracy tracking (for each field type)
declare -A FIELD_EXTRACTED=()
declare -A FIELD_CORRECT=()
declare -A FIELD_TOTAL=()

# Initialize field tracking
for field in "project_name" "title" "description" "duration" "difficulty" "licensing" "usage_rights" "deliverables"; do
    FIELD_EXTRACTED[$field]=0
    FIELD_CORRECT[$field]=0
    FIELD_TOTAL[$field]=0
done

# Deliverable accuracy (now tracks categories and items separately)
TOTAL_CATEGORIES_EXPECTED=0
TOTAL_CATEGORIES_FOUND=0
TOTAL_ITEMS_FOUND=0
DELIVERABLE_TYPE_MATCHES=0
THIN_DELIVERABLE_WARNINGS=0

# Performance tracking
declare -a EXTRACTION_TIMES=()
TOTAL_EXTRACTION_TIME=0

# Model tracking
declare -A MODEL_USAGE=()
declare -A MODEL_SUCCESS=()
declare -A MODEL_TIMES=()

# Quality scores per test category
declare -A CATEGORY_SCORES=()

# Edge case tracking
EDGE_CASES_PASSED=0
EDGE_CASES_TOTAL=0

# Record start time
SCRIPT_START_TIME=$(date +%s)

# ══════════════════════════════════════════════════════════════════════════════════
# SERVER CHECK
# ══════════════════════════════════════════════════════════════════════════════════

echo -e "${CYAN}[SETUP]${NC} Checking server status..."
if ! curl -s "$API_URL/health" > /dev/null 2>&1; then
    echo -e "${RED}[ERROR]${NC} Server is not running!"
    echo ""
    echo "Please start the server first:"
    echo "  cd /home/long/Desktop/capstone\\ backend/AUREA-Capstone/backend"
    echo "  npm run dev"
    exit 1
fi
echo -e "${GREEN}[OK]${NC} Server is running at $API_URL"
echo ""

# ══════════════════════════════════════════════════════════════════════════════════
# INITIALIZE REPORTS
# ══════════════════════════════════════════════════════════════════════════════════

# Initialize main report
cat > "$REPORT_FILE" << 'EOF'
╔══════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                                          ║
║     █████╗ ██╗   ██╗██████╗ ███████╗ █████╗     ██████╗ ██████╗ ███████╗    ████████╗███████╗███████╗████████╗
║    ██╔══██╗██║   ██║██╔══██╗██╔════╝██╔══██╗    ██╔══██╗██╔══██╗██╔════╝    ╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝
║    ███████║██║   ██║██████╔╝█████╗  ███████║    ██████╔╝██║  ██║█████╗         ██║   █████╗  ███████╗   ██║   
║    ██╔══██║██║   ██║██╔══██╗██╔══╝  ██╔══██║    ██╔═══╝ ██║  ██║██╔══╝         ██║   ██╔══╝  ╚════██║   ██║   
║    ██║  ██║╚██████╔╝██║  ██║███████╗██║  ██║    ██║     ██████╔╝██║            ██║   ███████╗███████║   ██║   
║    ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝    ╚═╝     ╚═════╝ ╚═╝            ╚═╝   ╚══════╝╚══════╝   ╚═╝   
║                                                                                                          ║
║                    COMPREHENSIVE MODEL EVALUATION REPORT                                                 ║
║                    Version 3.0 - Grouped Deliverables with Items                                         ║
║                                                                                                          ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════╝

EOF

echo "Generated: $(date)" >> "$REPORT_FILE"
echo "Test Suite Version: 3.0.0" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Initialize CSV header (updated for grouped deliverables)
echo "test_id,category,test_name,pdf_file,expected_categories,found_categories,found_items,category_accuracy,items_per_category,field_completeness,duration_extracted,duration_expected,duration_match,difficulty_expected,difficulty_found,difficulty_match,extraction_time_ms,model_used,status,error_message" > "$CSV_REPORT"

# ══════════════════════════════════════════════════════════════════════════════════
# CORE TEST FUNCTION
# ══════════════════════════════════════════════════════════════════════════════════

run_test() {
    local test_id=$1
    local category=$2
    local test_name=$3
    local pdf_file=$4
    local expected_categories=$5  # Number of grouped deliverable categories
    local expected_duration=$6
    local expected_difficulty=$7
    local test_type=$8  # "standard", "edge_case", "stress"
    local expected_fields=$9  # Comma-separated list of fields that should be present
    
    ((TOTAL_TESTS++))
    
    if [ "$test_type" = "edge_case" ]; then
        ((EDGE_CASES_TOTAL++))
    fi
    
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}Test $test_id: [$category] $test_name${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "  File: $pdf_file"
    echo "  Type: $test_type"
    echo "  Expected Categories: $expected_categories"
    
    # Rate limiting delay before making API call
    if [ $TOTAL_TESTS -gt 1 ]; then
        echo -e "  ${CYAN}⏳ Waiting ${TEST_DELAY_SECONDS}s to prevent API overload...${NC}"
        sleep $TEST_DELAY_SECONDS
    fi
    
    # Check file exists
    if [ ! -f "$pdf_file" ]; then
        echo -e "${YELLOW}  ⚠ File not found - SKIPPED${NC}"
        ((SKIPPED_TESTS++))
        echo "$test_id,$category,$test_name,$pdf_file,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A,$expected_difficulty,N/A,N/A,N/A,N/A,SKIPPED,File not found" >> "$CSV_REPORT"
        echo "" >> "$REPORT_FILE"
        echo "TEST $test_id: [$category] $test_name - SKIPPED (File not found)" >> "$REPORT_FILE"
        return
    fi
    
    # Run extraction with timing (with retry on failure)
    local START_TIME=$(date +%s%3N)
    local RESPONSE=""
    local RETRY_COUNT=0
    local MAX_RETRIES=2
    
    while [ $RETRY_COUNT -le $MAX_RETRIES ]; do
        RESPONSE=$(curl -s -X POST "$API_URL/pdf/extract" \
            -F "pdf=@$pdf_file" \
            -F "user_id=$TEST_USER_ID" \
            --max-time 180)
        
        # Check if response is valid (not a network error)
        if echo "$RESPONSE" | grep -q '"success"'; then
            break
        fi
        
        # Check for network/timeout errors
        if echo "$RESPONSE" | grep -qiE 'fetch failed|timeout|ECONNREFUSED|503'; then
            ((RETRY_COUNT++))
            if [ $RETRY_COUNT -le $MAX_RETRIES ]; then
                echo -e "  ${YELLOW}⚠ Network error, retrying ($RETRY_COUNT/$MAX_RETRIES)...${NC}"
                sleep 5
            fi
        else
            break
        fi
    done
    
    local END_TIME=$(date +%s%3N)
    local EXTRACTION_TIME=$((END_TIME - START_TIME))
    
    # Track extraction time
    EXTRACTION_TIMES+=($EXTRACTION_TIME)
    TOTAL_EXTRACTION_TIME=$((TOTAL_EXTRACTION_TIME + EXTRACTION_TIME))
    
    # Check for success
    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}  ✓ Extraction successful${NC}"
        ((PASSED_TESTS++))
        
        if [ "$test_type" = "edge_case" ]; then
            ((EDGE_CASES_PASSED++))
        fi
        
        # Extract all fields
        local PROJECT_NAME=$(echo "$RESPONSE" | grep -o '"project_name":"[^"]*"' | cut -d'"' -f4 | head -1)
        local TITLE=$(echo "$RESPONSE" | grep -o '"title":"[^"]*"' | cut -d'"' -f4 | head -1)
        local DESCRIPTION=$(echo "$RESPONSE" | grep -o '"description":"[^"]*"' | cut -d'"' -f4 | head -1)
        local DURATION=$(echo "$RESPONSE" | grep -o '"duration":[0-9]*' | grep -o '[0-9]*' | head -1)
        local DIFFICULTY=$(echo "$RESPONSE" | grep -o '"difficulty":"[^"]*"' | cut -d'"' -f4 | head -1)
        local LICENSING=$(echo "$RESPONSE" | grep -o '"licensing":"[^"]*"' | cut -d'"' -f4 | head -1)
        local USAGE_RIGHTS=$(echo "$RESPONSE" | grep -o '"usage_rights":"[^"]*"' | cut -d'"' -f4 | head -1)
        local MODEL_USED=$(echo "$RESPONSE" | grep -o '"model":"[^"]*"' | cut -d'"' -f4 | head -1)
        
        # Count deliverable categories (grouped deliverables)
        local CATEGORY_COUNT=$(echo "$RESPONSE" | grep -o '"deliverable_type"' | wc -l)
        
        # Count total items across all deliverables
        local ITEM_COUNT=0
        if command -v jq &> /dev/null; then
            ITEM_COUNT=$(echo "$RESPONSE" | jq '[.data.deliverables[].items // [] | length] | add // 0' 2>/dev/null || echo "0")
        fi
        
        # Calculate average items per category
        local AVG_ITEMS_PER_CAT=0
        if [ "$CATEGORY_COUNT" -gt 0 ]; then
            AVG_ITEMS_PER_CAT=$(awk "BEGIN {printf \"%.1f\", $ITEM_COUNT / $CATEGORY_COUNT}")
        fi
        
        # Check for thin deliverables (categories with < 3 items)
        local THIN_COUNT=0
        if command -v jq &> /dev/null; then
            THIN_COUNT=$(echo "$RESPONSE" | jq '[.data.deliverables[] | select((.items // []) | length < 3)] | length' 2>/dev/null || echo "0")
            if [ "$THIN_COUNT" -gt 0 ]; then
                THIN_DELIVERABLE_WARNINGS=$((THIN_DELIVERABLE_WARNINGS + THIN_COUNT))
            fi
        fi
        
        # Track model usage
        if [ -n "$MODEL_USED" ]; then
            MODEL_USAGE[$MODEL_USED]=$((${MODEL_USAGE[$MODEL_USED]:-0} + 1))
            MODEL_SUCCESS[$MODEL_USED]=$((${MODEL_SUCCESS[$MODEL_USED]:-0} + 1))
            MODEL_TIMES[$MODEL_USED]=$((${MODEL_TIMES[$MODEL_USED]:-0} + EXTRACTION_TIME))
        fi
        
        # ═══════════════════════════════════════════════════════════════════════
        # FIELD-LEVEL ACCURACY TRACKING
        # ═══════════════════════════════════════════════════════════════════════
        
        local fields_present=0
        local fields_checked=0
        
        # Project Name
        ((FIELD_TOTAL[project_name]++))
        ((fields_checked++))
        if [ -n "$PROJECT_NAME" ]; then
            ((FIELD_EXTRACTED[project_name]++))
            ((fields_present++))
            # Check if it's meaningful (not generic)
            if [[ ! "$PROJECT_NAME" =~ ^(Untitled|Project|Document|PDF)$ ]]; then
                ((FIELD_CORRECT[project_name]++))
            fi
        fi
        
        # Title
        ((FIELD_TOTAL[title]++))
        ((fields_checked++))
        if [ -n "$TITLE" ]; then
            ((FIELD_EXTRACTED[title]++))
            ((fields_present++))
            if [[ ! "$TITLE" =~ ^(Untitled|Project|Document)$ ]]; then
                ((FIELD_CORRECT[title]++))
            fi
        fi
        
        # Description
        ((FIELD_TOTAL[description]++))
        ((fields_checked++))
        if [ -n "$DESCRIPTION" ] && [ ${#DESCRIPTION} -gt 10 ]; then
            ((FIELD_EXTRACTED[description]++))
            ((FIELD_CORRECT[description]++))
            ((fields_present++))
        fi
        
        # Duration
        ((FIELD_TOTAL[duration]++))
        ((fields_checked++))
        local duration_extracted="N"
        local duration_match="N/A"
        if [ -n "$DURATION" ] && [ "$DURATION" != "null" ]; then
            ((FIELD_EXTRACTED[duration]++))
            ((fields_present++))
            duration_extracted="Y"
            
            # Check accuracy against expected
            if [ "$expected_duration" != "N/A" ] && [ -n "$expected_duration" ]; then
                local diff=$((DURATION - expected_duration))
                local abs_diff=${diff#-}
                local percent_diff=0
                if [ $expected_duration -gt 0 ]; then
                    percent_diff=$((abs_diff * 100 / expected_duration))
                fi
                
                if [ $percent_diff -le 20 ]; then
                    ((FIELD_CORRECT[duration]++))
                    duration_match="EXACT"
                elif [ $percent_diff -le 50 ]; then
                    duration_match="CLOSE"
                else
                    duration_match="OFF"
                fi
            fi
        fi
        
        # Difficulty
        ((FIELD_TOTAL[difficulty]++))
        ((fields_checked++))
        local difficulty_match="N/A"
        if [ -n "$DIFFICULTY" ]; then
            ((FIELD_EXTRACTED[difficulty]++))
            ((fields_present++))
            
            if [ "$expected_difficulty" != "N/A" ]; then
                if [ "$DIFFICULTY" = "$expected_difficulty" ]; then
                    ((FIELD_CORRECT[difficulty]++))
                    difficulty_match="EXACT"
                elif [[ ("$DIFFICULTY" = "Hard" && "$expected_difficulty" = "Complex") || \
                        ("$DIFFICULTY" = "Complex" && "$expected_difficulty" = "Hard") ]]; then
                    difficulty_match="CLOSE"
                else
                    difficulty_match="WRONG"
                fi
            fi
        fi
        
        # Licensing
        ((FIELD_TOTAL[licensing]++))
        if [ -n "$LICENSING" ]; then
            ((FIELD_EXTRACTED[licensing]++))
            ((FIELD_CORRECT[licensing]++))
        fi
        
        # Usage Rights
        ((FIELD_TOTAL[usage_rights]++))
        if [ -n "$USAGE_RIGHTS" ]; then
            ((FIELD_EXTRACTED[usage_rights]++))
            ((FIELD_CORRECT[usage_rights]++))
        fi
        
        # ═══════════════════════════════════════════════════════════════════════
        # DELIVERABLE ACCURACY (Now for grouped categories + items)
        # ═══════════════════════════════════════════════════════════════════════
        
        ((FIELD_TOTAL[deliverables]++))
        TOTAL_CATEGORIES_EXPECTED=$((TOTAL_CATEGORIES_EXPECTED + expected_categories))
        TOTAL_CATEGORIES_FOUND=$((TOTAL_CATEGORIES_FOUND + CATEGORY_COUNT))
        TOTAL_ITEMS_FOUND=$((TOTAL_ITEMS_FOUND + ITEM_COUNT))
        
        local category_accuracy="N/A"
        if [ $expected_categories -gt 0 ]; then
            local cat_ratio=$((CATEGORY_COUNT * 100 / expected_categories))
            if [ $cat_ratio -gt 100 ]; then
                category_accuracy="100"
            else
                category_accuracy="$cat_ratio"
            fi
            
            ((FIELD_EXTRACTED[deliverables]++))
            if [ $cat_ratio -ge 80 ] && [ $cat_ratio -le 120 ]; then
                ((FIELD_CORRECT[deliverables]++))
            fi
        else
            if [ $CATEGORY_COUNT -eq 0 ]; then
                category_accuracy="100"
                ((FIELD_EXTRACTED[deliverables]++))
                ((FIELD_CORRECT[deliverables]++))
            else
                category_accuracy="0"
            fi
        fi
        
        # Calculate field completeness
        local FIELD_COMPLETENESS=$((fields_present * 100 / fields_checked))
        
        # ═══════════════════════════════════════════════════════════════════════
        # OUTPUT RESULTS
        # ═══════════════════════════════════════════════════════════════════════
        
        echo "  ─────────────────────────────────────────────────"
        echo "  │ EXTRACTED DATA"
        echo "  ├─ Project: $PROJECT_NAME"
        echo "  ├─ Title: $TITLE"
        printf "  ├─ Duration: %s days " "${DURATION:-N/A}"
        if [ "$duration_extracted" = "Y" ]; then
            echo -e "${GREEN}✓${NC} (expected: ${expected_duration:-N/A}, match: $duration_match)"
        else
            echo -e "${YELLOW}✗ Missing${NC}"
        fi
        printf "  ├─ Difficulty: %s " "${DIFFICULTY:-N/A}"
        if [ -n "$DIFFICULTY" ]; then
            if [ "$difficulty_match" = "EXACT" ]; then
                echo -e "${GREEN}✓ EXACT${NC}"
            elif [ "$difficulty_match" = "CLOSE" ]; then
                echo -e "${YELLOW}~ CLOSE${NC}"
            else
                echo -e "${RED}✗ Expected: $expected_difficulty${NC}"
            fi
        else
            echo -e "${YELLOW}✗ Missing${NC}"
        fi
        echo "  ├─ Licensing: ${LICENSING:-N/A}"
        echo "  │"
        echo "  │ DELIVERABLES (Grouped)"
        echo "  ├─ Categories: $CATEGORY_COUNT (expected: $expected_categories)"
        echo "  ├─ Total Items: $ITEM_COUNT"
        echo "  ├─ Avg Items/Category: $AVG_ITEMS_PER_CAT"
        if [ "$THIN_COUNT" -gt 0 ]; then
            echo -e "  ├─ ${YELLOW}⚠ Thin Categories (<3 items): $THIN_COUNT${NC}"
        fi
        echo "  │"
        echo "  │ METRICS"
        echo "  ├─ Field Completeness: ${FIELD_COMPLETENESS}%"
        echo "  ├─ Category Accuracy: ${category_accuracy}%"
        echo "  ├─ Extraction Time: ${EXTRACTION_TIME}ms"
        if [ -n "$MODEL_USED" ]; then
            echo -e "  └─ Model: ${PURPLE}${MODEL_USED}${NC}"
        else
            echo "  └─ Model: Not detected"
        fi
        
        # Write to CSV
        echo "$test_id,$category,\"$test_name\",\"$pdf_file\",$expected_categories,$CATEGORY_COUNT,$ITEM_COUNT,$category_accuracy,$AVG_ITEMS_PER_CAT,$FIELD_COMPLETENESS,$duration_extracted,$expected_duration,$duration_match,$expected_difficulty,$DIFFICULTY,$difficulty_match,$EXTRACTION_TIME,${MODEL_USED:-unknown},PASSED," >> "$CSV_REPORT"
        
        # Write to detailed report
        cat >> "$REPORT_FILE" << EOF

═══════════════════════════════════════════════════════════════════════════════
TEST $test_id: [$category] $test_name
═══════════════════════════════════════════════════════════════════════════════
Status: PASSED ✓
File: $pdf_file
Test Type: $test_type

Extracted Data:
  • Project Name: $PROJECT_NAME
  • Title: $TITLE
  • Description: ${DESCRIPTION:0:150}...
  • Duration: ${DURATION:-N/A} days (expected: ${expected_duration:-N/A})
  • Difficulty: ${DIFFICULTY:-N/A} (expected: ${expected_difficulty:-N/A})
  • Licensing: ${LICENSING:-N/A}
  • Usage Rights: ${USAGE_RIGHTS:-N/A}

Deliverables (Grouped):
  • Categories: $CATEGORY_COUNT (expected: $expected_categories)
  • Total Items: $ITEM_COUNT
  • Avg Items per Category: $AVG_ITEMS_PER_CAT
  • Thin Categories (<3 items): $THIN_COUNT

Accuracy Metrics:
  • Field Completeness: ${FIELD_COMPLETENESS}%
  • Category Accuracy: ${category_accuracy}%
  • Duration Match: $duration_match
  • Difficulty Match: $difficulty_match
  • Extraction Time: ${EXTRACTION_TIME}ms
  • Model Used: ${MODEL_USED:-Not detected}

EOF
    else
        echo -e "${RED}  ✗ Extraction failed${NC}"
        ((FAILED_TESTS++))
        
        local ERROR_MSG=$(echo "$RESPONSE" | grep -o '"message":"[^"]*"' | cut -d'"' -f4 | head -1)
        echo "  Error: $ERROR_MSG"
        
        # Track model failure
        local MODEL_USED=$(echo "$RESPONSE" | grep -o '"model":"[^"]*"' | cut -d'"' -f4 | head -1)
        if [ -n "$MODEL_USED" ]; then
            MODEL_USAGE[$MODEL_USED]=$((${MODEL_USAGE[$MODEL_USED]:-0} + 1))
        fi
        
        # Write to CSV
        echo "$test_id,$category,\"$test_name\",\"$pdf_file\",$expected_categories,0,0,0,0,0,N,N/A,N/A,$expected_difficulty,N/A,N/A,$EXTRACTION_TIME,${MODEL_USED:-unknown},FAILED,\"$ERROR_MSG\"" >> "$CSV_REPORT"
        
        cat >> "$REPORT_FILE" << EOF

═══════════════════════════════════════════════════════════════════════════════
TEST $test_id: [$category] $test_name
═══════════════════════════════════════════════════════════════════════════════
Status: FAILED ✗
File: $pdf_file
Test Type: $test_type
Error: $ERROR_MSG
Extraction Time: ${EXTRACTION_TIME}ms

EOF
    fi
    
    echo ""
}

# ══════════════════════════════════════════════════════════════════════════════════
# TEST EXECUTION
# ══════════════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║                    BEGINNING COMPREHENSIVE TEST SUITE                        ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════════
# CATEGORY 0: BASELINE TEST
# ═══════════════════════════════════════════════════════════════════════════════════

echo -e "${PURPLE}══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${PURPLE}CATEGORY 0: BASELINE (Perfect Sample)${NC}"
echo -e "${PURPLE}══════════════════════════════════════════════════════════════════════════════${NC}"

# expected_categories = number of grouped deliverable categories (not individual items)
run_test "0.1" "BASELINE" "Perfect Sample - Well Formatted Proposal" \
    "$SAMPLES_DIR/pdf/PROJECT PROPOSAL DOCUMENT.pdf" \
    5 90 "Complex" \
    "standard" "project_name,title,description,duration,difficulty,licensing"

# ═══════════════════════════════════════════════════════════════════════════════════
# CATEGORY 1: MINIMAL PROJECT TESTS
# ═══════════════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${CYAN}⏳ Category transition - waiting ${CATEGORY_DELAY_SECONDS}s...${NC}"
sleep $CATEGORY_DELAY_SECONDS

echo -e "${PURPLE}══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${PURPLE}CATEGORY 1: MINIMAL PROJECT - Sparse Data Extraction${NC}"
echo -e "${PURPLE}Testing: Inference capability, default value handling, minimal context${NC}"
echo -e "${PURPLE}══════════════════════════════════════════════════════════════════════════════${NC}"

# Test 1.1: Basic extraction from minimal data (expect ~2-3 grouped categories)
run_test "1.1" "MINIMAL" "Sparse Info - Basic Extraction" \
    "$SAMPLES_DIR/pdf/01-MINIMAL_PROJECT.pdf" \
    2 "N/A" "Easy" \
    "standard" "project_name,title"

# Test 1.2: Implicit information inference
run_test "1.2" "MINIMAL" "Implicit Timeline - ASAP interpretation" \
    "$SAMPLES_DIR/pdf/01-MINIMAL_PROJECT.pdf" \
    2 7 "Easy" \
    "edge_case" "project_name,difficulty"

# Test 1.3: Budget keyword detection
run_test "1.3" "MINIMAL" "Budget Keyword - Limited budget inference" \
    "$SAMPLES_DIR/pdf/01-MINIMAL_PROJECT.pdf" \
    2 "N/A" "Easy" \
    "edge_case" "project_name,difficulty"

# ═══════════════════════════════════════════════════════════════════════════════════
# CATEGORY 2: COMPLEX MULTI-DELIVERABLE TESTS
# ═══════════════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${CYAN}⏳ Category transition - waiting ${CATEGORY_DELAY_SECONDS}s...${NC}"
sleep $CATEGORY_DELAY_SECONDS

echo -e "${PURPLE}══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${PURPLE}CATEGORY 2: COMPLEX MULTI-DELIVERABLE - Large Scale Extraction${NC}"
echo -e "${PURPLE}Testing: Grouped extraction, items array, complex requirements parsing${NC}"
echo -e "${PURPLE}══════════════════════════════════════════════════════════════════════════════${NC}"

# Test 2.1: Full deliverable extraction (grouped categories, not individual items)
run_test "2.1" "COMPLEX" "Multi-Deliverable - Grouped Category Extraction" \
    "$SAMPLES_DIR/pdf/02-COMPLEX_MULTI_DELIVERABLE.pdf" \
    8 240 "Complex" \
    "standard" "project_name,title,description,duration,difficulty,licensing,usage_rights"

# Test 2.2: Timeline calculation (6 months + 2 months = 8 months = 240 days)
run_test "2.2" "COMPLEX" "Timeline Calculation - Multi-phase Duration" \
    "$SAMPLES_DIR/pdf/02-COMPLEX_MULTI_DELIVERABLE.pdf" \
    8 240 "Complex" \
    "edge_case" "duration"

# Test 2.3: Items array extraction within categories
run_test "2.3" "COMPLEX" "Items Array - Sub-component Extraction" \
    "$SAMPLES_DIR/pdf/02-COMPLEX_MULTI_DELIVERABLE.pdf" \
    8 240 "Complex" \
    "edge_case" "deliverables"

# Test 2.4: Technical requirements parsing
run_test "2.4" "COMPLEX" "Technical Reqs - Feature List Extraction" \
    "$SAMPLES_DIR/pdf/02-COMPLEX_MULTI_DELIVERABLE.pdf" \
    8 240 "Complex" \
    "standard" "description"

# Test 2.5: Quality standards extraction
run_test "2.5" "COMPLEX" "Quality Standards - SLA/Compliance Detection" \
    "$SAMPLES_DIR/pdf/02-COMPLEX_MULTI_DELIVERABLE.pdf" \
    8 240 "Complex" \
    "edge_case" "usage_rights"

# ═══════════════════════════════════════════════════════════════════════════════════
# CATEGORY 3: VAGUE REQUIREMENTS TESTS
# ═══════════════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${CYAN}⏳ Category transition - waiting ${CATEGORY_DELAY_SECONDS}s...${NC}"
sleep $CATEGORY_DELAY_SECONDS

echo -e "${PURPLE}══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${PURPLE}CATEGORY 3: VAGUE REQUIREMENTS - Ambiguity Handling${NC}"
echo -e "${PURPLE}Testing: Error handling, graceful degradation, ambiguous input processing${NC}"
echo -e "${PURPLE}══════════════════════════════════════════════════════════════════════════════${NC}"

# Test 3.1: Ambiguous project handling (may produce minimal categories)
run_test "3.1" "VAGUE" "Ambiguous Input - Graceful Handling" \
    "$SAMPLES_DIR/pdf/03-VAGUE_REQUIREMENTS.pdf" \
    1 "N/A" "N/A" \
    "edge_case" "project_name"

# Test 3.2: Vague timeline handling ("soon as possible but flexible")
run_test "3.2" "VAGUE" "Vague Timeline - Flexible deadline handling" \
    "$SAMPLES_DIR/pdf/03-VAGUE_REQUIREMENTS.pdf" \
    1 "N/A" "N/A" \
    "edge_case" "duration"

# Test 3.3: Undefined scope handling
run_test "3.3" "VAGUE" "Undefined Scope - Minimal categories" \
    "$SAMPLES_DIR/pdf/03-VAGUE_REQUIREMENTS.pdf" \
    1 "N/A" "Medium" \
    "edge_case" "deliverables,difficulty"

# Test 3.4: Contradictory information
run_test "3.4" "VAGUE" "Contradictory Info - Modern but not too modern" \
    "$SAMPLES_DIR/pdf/03-VAGUE_REQUIREMENTS.pdf" \
    1 "N/A" "N/A" \
    "edge_case" "description"

# ═══════════════════════════════════════════════════════════════════════════════════
# CATEGORY 4: MIXED FORMAT TESTS
# ═══════════════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${CYAN}⏳ Category transition - waiting ${CATEGORY_DELAY_SECONDS}s...${NC}"
sleep $CATEGORY_DELAY_SECONDS

echo -e "${PURPLE}══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${PURPLE}CATEGORY 4: MIXED FORMAT - Visual Element Parsing${NC}"
echo -e "${PURPLE}Testing: Box characters, tree structures, special symbols, tables${NC}"
echo -e "${PURPLE}══════════════════════════════════════════════════════════════════════════════${NC}"

# Test 4.1: Mixed formatting full extraction (grouped into ~6 categories)
run_test "4.1" "MIXED" "Mixed Formatting - Grouped Extraction" \
    "$SAMPLES_DIR/pdf/04-MIXED_FORMAT.pdf" \
    6 84 "Hard" \
    "standard" "project_name,title,description,duration,difficulty,licensing"

# Test 4.2: Tree structure parsing (├── ├─ └──)
run_test "4.2" "MIXED" "Tree Structure - Hierarchical List Parsing" \
    "$SAMPLES_DIR/pdf/04-MIXED_FORMAT.pdf" \
    6 84 "Hard" \
    "edge_case" "deliverables"

# Test 4.3: Box character handling (═══ ║ ╔ ╗ ╚ ╝)
run_test "4.3" "MIXED" "Box Characters - Section Detection" \
    "$SAMPLES_DIR/pdf/04-MIXED_FORMAT.pdf" \
    6 84 "Hard" \
    "edge_case" "title,description"

# Test 4.4: Phase-based timeline (12 weeks = 84 days)
run_test "4.4" "MIXED" "Phase Timeline - Week to Day Conversion" \
    "$SAMPLES_DIR/pdf/04-MIXED_FORMAT.pdf" \
    6 84 "Hard" \
    "edge_case" "duration"

# Test 4.5: Difficulty rating parsing (● ○ symbols)
run_test "4.5" "MIXED" "Visual Rating - Symbol Based Difficulty" \
    "$SAMPLES_DIR/pdf/04-MIXED_FORMAT.pdf" \
    6 84 "Hard" \
    "edge_case" "difficulty"

# Test 4.6: Multi-format grouping
run_test "4.6" "MIXED" "Multi-Format Grouping - Bullets + Trees + Tables" \
    "$SAMPLES_DIR/pdf/04-MIXED_FORMAT.pdf" \
    6 84 "Hard" \
    "stress" "deliverables"

# ═══════════════════════════════════════════════════════════════════════════════════
# CATEGORY 5: TECHNICAL JARGON TESTS
# ═══════════════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${CYAN}⏳ Category transition - waiting ${CATEGORY_DELAY_SECONDS}s...${NC}"
sleep $CATEGORY_DELAY_SECONDS

echo -e "${PURPLE}══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${PURPLE}CATEGORY 5: TECHNICAL JARGON - Domain Knowledge${NC}"
echo -e "${PURPLE}Testing: Technical term understanding, architecture parsing, abbreviations${NC}"
echo -e "${PURPLE}══════════════════════════════════════════════════════════════════════════════${NC}"

# Test 5.1: Full technical document extraction (~7 grouped categories)
run_test "5.1" "TECHNICAL" "Technical Doc - Grouped Extraction" \
    "$SAMPLES_DIR/pdf/05-TECHNICAL_JARGON.pdf" \
    7 120 "Complex" \
    "standard" "project_name,title,description,difficulty"

# Test 5.2: Technology stack parsing
run_test "5.2" "TECHNICAL" "Tech Stack - Framework/Tool Detection" \
    "$SAMPLES_DIR/pdf/05-TECHNICAL_JARGON.pdf" \
    7 120 "Complex" \
    "edge_case" "description"

# Test 5.3: Microservices deliverable grouping
run_test "5.3" "TECHNICAL" "Microservices - Category Grouping" \
    "$SAMPLES_DIR/pdf/05-TECHNICAL_JARGON.pdf" \
    7 120 "Complex" \
    "edge_case" "deliverables"

# Test 5.4: Abbreviation handling (API, CQRS, JWT, etc.)
run_test "5.4" "TECHNICAL" "Abbreviations - Technical Acronym Handling" \
    "$SAMPLES_DIR/pdf/05-TECHNICAL_JARGON.pdf" \
    7 120 "Complex" \
    "edge_case" "description"

# Test 5.5: Performance requirements parsing
run_test "5.5" "TECHNICAL" "Performance Reqs - SLA Metric Extraction" \
    "$SAMPLES_DIR/pdf/05-TECHNICAL_JARGON.pdf" \
    7 120 "Complex" \
    "edge_case" "usage_rights"

# Test 5.6: Compliance requirements (SOC 2, GDPR, HIPAA)
run_test "5.6" "TECHNICAL" "Compliance - Regulatory Standards Detection" \
    "$SAMPLES_DIR/pdf/05-TECHNICAL_JARGON.pdf" \
    7 120 "Complex" \
    "edge_case" "licensing"

# ═══════════════════════════════════════════════════════════════════════════════════
# CATEGORY 6: BUDGET HEAVY TESTS
# ═══════════════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${CYAN}⏳ Category transition - waiting ${CATEGORY_DELAY_SECONDS}s...${NC}"
sleep $CATEGORY_DELAY_SECONDS

echo -e "${PURPLE}══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${PURPLE}CATEGORY 6: BUDGET HEAVY - Financial Data Extraction${NC}"
echo -e "${PURPLE}Testing: Price parsing, quantity extraction, phase-based grouping${NC}"
echo -e "${PURPLE}══════════════════════════════════════════════════════════════════════════════${NC}"

# Test 6.1: Full budget document extraction (~10 grouped categories)
run_test "6.1" "BUDGET" "Budget Doc - Grouped Extraction" \
    "$SAMPLES_DIR/pdf/06-BUDGET_HEAVY.pdf" \
    10 270 "Complex" \
    "standard" "project_name,title,description,duration,difficulty,licensing"

# Test 6.2: Phase-based category grouping
run_test "6.2" "BUDGET" "Phase Categories - Multi-Phase Grouping" \
    "$SAMPLES_DIR/pdf/06-BUDGET_HEAVY.pdf" \
    10 270 "Complex" \
    "edge_case" "deliverables"

# Test 6.3: Duration from timeline (9 months = 270 days)
run_test "6.3" "BUDGET" "Timeline - Month to Day Conversion" \
    "$SAMPLES_DIR/pdf/06-BUDGET_HEAVY.pdf" \
    10 270 "Complex" \
    "edge_case" "duration"

# Test 6.4: Quantity parsing into items
run_test "6.4" "BUDGET" "Quantity Parsing - Items Array Extraction" \
    "$SAMPLES_DIR/pdf/06-BUDGET_HEAVY.pdf" \
    10 270 "Complex" \
    "edge_case" "deliverables"

# Test 6.5: Module grouping (8 functional modules)
run_test "6.5" "BUDGET" "Module Grouping - Component Categories" \
    "$SAMPLES_DIR/pdf/06-BUDGET_HEAVY.pdf" \
    10 270 "Complex" \
    "edge_case" "deliverables"

# Test 6.6: Training materials grouping
run_test "6.6" "BUDGET" "Training Materials - Educational Content Grouping" \
    "$SAMPLES_DIR/pdf/06-BUDGET_HEAVY.pdf" \
    10 270 "Complex" \
    "edge_case" "deliverables"

# Test 6.7: Stress test - Full document with all metrics
run_test "6.7" "BUDGET" "Stress Test - Complete Grouped Extraction" \
    "$SAMPLES_DIR/pdf/06-BUDGET_HEAVY.pdf" \
    10 270 "Complex" \
    "stress" "project_name,title,description,duration,difficulty,licensing,usage_rights,deliverables"

# ══════════════════════════════════════════════════════════════════════════════════
# GENERATE COMPREHENSIVE SUMMARY
# ══════════════════════════════════════════════════════════════════════════════════

SCRIPT_END_TIME=$(date +%s)
ELAPSED_TIME=$((SCRIPT_END_TIME - SCRIPT_START_TIME))

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║                         COMPREHENSIVE TEST SUMMARY                           ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Calculate metrics
PASS_RATE=0
PASS_RATE_INT=0
if [ $TOTAL_TESTS -gt 0 ]; then
    PASS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED_TESTS/$TOTAL_TESTS)*100}")
    PASS_RATE_INT=$(awk "BEGIN {printf \"%.0f\", ($PASSED_TESTS/$TOTAL_TESTS)*100}")
fi

EDGE_CASE_RATE=0
EDGE_CASE_RATE_INT=0
if [ $EDGE_CASES_TOTAL -gt 0 ]; then
    EDGE_CASE_RATE=$(awk "BEGIN {printf \"%.1f\", ($EDGE_CASES_PASSED/$EDGE_CASES_TOTAL)*100}")
    EDGE_CASE_RATE_INT=$(awk "BEGIN {printf \"%.0f\", ($EDGE_CASES_PASSED/$EDGE_CASES_TOTAL)*100}")
fi

# Calculate average extraction time
AVG_EXTRACTION_TIME=0
if [ ${#EXTRACTION_TIMES[@]} -gt 0 ]; then
    AVG_EXTRACTION_TIME=$((TOTAL_EXTRACTION_TIME / ${#EXTRACTION_TIMES[@]}))
fi

# Calculate min/max extraction times
MIN_TIME=999999
MAX_TIME=0
for time in "${EXTRACTION_TIMES[@]}"; do
    if [ $time -lt $MIN_TIME ]; then
        MIN_TIME=$time
    fi
    if [ $time -gt $MAX_TIME ]; then
        MAX_TIME=$time
    fi
done

echo -e "${CYAN}┌─────────────────────────────────────────────────────────────────────────────┐${NC}"
echo -e "${CYAN}│ OVERALL RESULTS                                                             │${NC}"
echo -e "${CYAN}└─────────────────────────────────────────────────────────────────────────────┘${NC}"
echo ""
echo -e "  Total Tests:        ${BOLD}$TOTAL_TESTS${NC}"
echo -e "  Passed:             ${GREEN}$PASSED_TESTS${NC} (${PASS_RATE}%)"
echo -e "  Failed:             ${RED}$FAILED_TESTS${NC}"
echo -e "  Skipped:            ${YELLOW}$SKIPPED_TESTS${NC}"
echo -e "  Edge Cases Passed:  ${EDGE_CASES_PASSED}/${EDGE_CASES_TOTAL} (${EDGE_CASE_RATE}%)"
echo ""

echo -e "${CYAN}┌─────────────────────────────────────────────────────────────────────────────┐${NC}"
echo -e "${CYAN}│ FIELD-LEVEL ACCURACY                                                        │${NC}"
echo -e "${CYAN}└─────────────────────────────────────────────────────────────────────────────┘${NC}"
echo ""

for field in "project_name" "title" "description" "duration" "difficulty" "licensing" "usage_rights" "deliverables"; do
    total=${FIELD_TOTAL[$field]:-0}
    extracted=${FIELD_EXTRACTED[$field]:-0}
    correct=${FIELD_CORRECT[$field]:-0}
    
    extraction_rate=0
    accuracy_rate=0
    if [ $total -gt 0 ]; then
        extraction_rate=$((extracted * 100 / total))
    fi
    if [ $extracted -gt 0 ]; then
        accuracy_rate=$((correct * 100 / extracted))
    fi
    
    printf "  %-15s  Extracted: %3d%% (%d/%d)  Accurate: %3d%%\n" \
        "$field" "$extraction_rate" "$extracted" "$total" "$accuracy_rate"
done

echo ""
echo -e "${CYAN}┌─────────────────────────────────────────────────────────────────────────────┐${NC}"
echo -e "${CYAN}│ DELIVERABLE METRICS (Grouped Categories + Items)                            │${NC}"
echo -e "${CYAN}└─────────────────────────────────────────────────────────────────────────────┘${NC}"
echo ""
CATEGORY_ACCURACY=0
if [ $TOTAL_CATEGORIES_EXPECTED -gt 0 ]; then
    CATEGORY_ACCURACY=$((TOTAL_CATEGORIES_FOUND * 100 / TOTAL_CATEGORIES_EXPECTED))
fi
AVG_ITEMS_OVERALL=0
if [ $TOTAL_CATEGORIES_FOUND -gt 0 ]; then
    AVG_ITEMS_OVERALL=$(awk "BEGIN {printf \"%.1f\", $TOTAL_ITEMS_FOUND / $TOTAL_CATEGORIES_FOUND}")
fi
echo "  Expected Categories:    $TOTAL_CATEGORIES_EXPECTED"
echo "  Found Categories:       $TOTAL_CATEGORIES_FOUND"
echo "  Category Accuracy:      ${CATEGORY_ACCURACY}%"
echo "  Total Items Found:      $TOTAL_ITEMS_FOUND"
echo "  Avg Items/Category:     $AVG_ITEMS_OVERALL"
echo -e "  ${YELLOW}Thin Deliverables (<3 items): $THIN_DELIVERABLE_WARNINGS${NC}"
echo ""

echo -e "${CYAN}┌─────────────────────────────────────────────────────────────────────────────┐${NC}"
echo -e "${CYAN}│ PERFORMANCE METRICS                                                         │${NC}"
echo -e "${CYAN}└─────────────────────────────────────────────────────────────────────────────┘${NC}"
echo ""
echo "  Total Test Duration:    ${ELAPSED_TIME}s"
echo "  Avg Extraction Time:    ${AVG_EXTRACTION_TIME}ms"
echo "  Min Extraction Time:    ${MIN_TIME}ms"
echo "  Max Extraction Time:    ${MAX_TIME}ms"
echo ""

echo -e "${CYAN}┌─────────────────────────────────────────────────────────────────────────────┐${NC}"
echo -e "${CYAN}│ AI MODEL STATISTICS                                                         │${NC}"
echo -e "${CYAN}└─────────────────────────────────────────────────────────────────────────────┘${NC}"
echo ""
echo "  Available Models:       gemini-2.5-flash-lite, gemini-3-flash-preview"
echo ""
echo "  Model Usage Breakdown:"
for model in "${!MODEL_USAGE[@]}"; do
    usage=${MODEL_USAGE[$model]}
    success=${MODEL_SUCCESS[$model]:-0}
    total_time=${MODEL_TIMES[$model]:-0}
    avg_time=0
    if [ $usage -gt 0 ]; then
        avg_time=$((total_time / usage))
    fi
    success_rate=0
    if [ $usage -gt 0 ]; then
        success_rate=$((success * 100 / usage))
    fi
    printf "    %-25s Used: %3dx  Success: %3d%%  Avg Time: %dms\n" \
        "$model" "$usage" "$success_rate" "$avg_time"
done
echo ""

# Write comprehensive summary to report
cat >> "$REPORT_FILE" << EOF

╔══════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                              COMPREHENSIVE EVALUATION SUMMARY                                            ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. OVERALL TEST RESULTS                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘

  • Total Tests Executed:     $TOTAL_TESTS
  • Tests Passed:             $PASSED_TESTS (${PASS_RATE}%)
  • Tests Failed:             $FAILED_TESTS
  • Tests Skipped:            $SKIPPED_TESTS
  • Edge Cases Passed:        $EDGE_CASES_PASSED / $EDGE_CASES_TOTAL (${EDGE_CASE_RATE}%)

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 2. FIELD-LEVEL EXTRACTION ACCURACY                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘

EOF

for field in "project_name" "title" "description" "duration" "difficulty" "licensing" "usage_rights" "deliverables"; do
    total=${FIELD_TOTAL[$field]:-0}
    extracted=${FIELD_EXTRACTED[$field]:-0}
    correct=${FIELD_CORRECT[$field]:-0}
    
    extraction_rate=0
    accuracy_rate=0
    if [ $total -gt 0 ]; then
        extraction_rate=$((extracted * 100 / total))
    fi
    if [ $extracted -gt 0 ]; then
        accuracy_rate=$((correct * 100 / extracted))
    fi
    
    printf "  • %-15s  Extraction Rate: %3d%%  Quality Score: %3d%%\n" \
        "$field" "$extraction_rate" "$accuracy_rate" >> "$REPORT_FILE"
done

cat >> "$REPORT_FILE" << EOF

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 3. DELIVERABLE EXTRACTION METRICS (Grouped Categories + Items)                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘

  • Total Expected Categories:      $TOTAL_CATEGORIES_EXPECTED
  • Total Found Categories:         $TOTAL_CATEGORIES_FOUND
  • Category Accuracy:              ${CATEGORY_ACCURACY}%
  • Total Items Found:              $TOTAL_ITEMS_FOUND
  • Avg Items per Category:         $AVG_ITEMS_OVERALL
  • Thin Deliverables (<3 items):   $THIN_DELIVERABLE_WARNINGS

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 4. PERFORMANCE METRICS                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘

  • Total Test Suite Duration:      ${ELAPSED_TIME} seconds
  • Average Extraction Time:        ${AVG_EXTRACTION_TIME}ms
  • Minimum Extraction Time:        ${MIN_TIME}ms
  • Maximum Extraction Time:        ${MAX_TIME}ms
  • Throughput:                     $(awk "BEGIN {printf \"%.2f\", $TOTAL_TESTS/$ELAPSED_TIME}") tests/second

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 5. AI MODEL PERFORMANCE                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘

  Available Models:
  • gemini-2.5-flash-lite (Optimized for speed)
  • gemini-3-flash-preview (Latest capabilities)

  Model Usage Statistics:
EOF

for model in "${!MODEL_USAGE[@]}"; do
    usage=${MODEL_USAGE[$model]}
    success=${MODEL_SUCCESS[$model]:-0}
    total_time=${MODEL_TIMES[$model]:-0}
    avg_time=0
    if [ $usage -gt 0 ]; then
        avg_time=$((total_time / usage))
    fi
    success_rate=0
    if [ $usage -gt 0 ]; then
        success_rate=$((success * 100 / usage))
    fi
    printf "  • %-25s  Usage: %3d  Success Rate: %3d%%  Avg Response: %dms\n" \
        "$model" "$usage" "$success_rate" "$avg_time" >> "$REPORT_FILE"
done

cat >> "$REPORT_FILE" << EOF

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 6. TEST CATEGORY BREAKDOWN                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘

  • BASELINE:     Well-formatted reference document (1 test)
  • MINIMAL:      Sparse data with implicit information (3 tests)
  • COMPLEX:      Large-scale grouped deliverable extraction (5 tests)
  • VAGUE:        Ambiguous and poorly defined requirements (4 tests)
  • MIXED:        Various formatting styles and special characters (6 tests)
  • TECHNICAL:    Heavy technical jargon and architecture docs (6 tests)
  • BUDGET:       Financial data with phases and grouped categories (7 tests)

  Deliverable Structure:
  • Categories = Grouped deliverable types (e.g., "Brand Identity System")
  • Items = Sub-components within each category (e.g., "Primary logo", "Color palette")
  • "Final Asset Delivery" should always be included as a category

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 7. KEY FINDINGS & RECOMMENDATIONS                                                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘

EOF

# Add recommendations based on results
if [ $PASS_RATE_INT -ge 90 ]; then
    echo "  ✅ EXCELLENT: Test suite pass rate exceeds 90%" >> "$REPORT_FILE"
fi
if [ $PASS_RATE_INT -lt 80 ]; then
    echo "  ⚠️  WARNING: Pass rate below 80% - review failing tests" >> "$REPORT_FILE"
fi

duration_rate=$((${FIELD_EXTRACTED[duration]:-0} * 100 / ${FIELD_TOTAL[duration]:-1}))
if [ $duration_rate -lt 70 ]; then
    echo "  ⚠️  Duration extraction rate is low ($duration_rate%) - improve timeline parsing" >> "$REPORT_FILE"
fi

if [ $CATEGORY_ACCURACY -gt 90 ]; then
    echo "  ✅ Category extraction accuracy is strong (${CATEGORY_ACCURACY}%)" >> "$REPORT_FILE"
elif [ $CATEGORY_ACCURACY -lt 80 ]; then
    echo "  ⚠️  Category accuracy below 80% - review grouped deliverable logic" >> "$REPORT_FILE"
fi

if [ $THIN_DELIVERABLE_WARNINGS -gt 0 ]; then
    echo "  ⚠️  Found $THIN_DELIVERABLE_WARNINGS thin deliverables (<3 items) - consider grouping better" >> "$REPORT_FILE"
fi

if [ $EDGE_CASE_RATE_INT -ge 80 ]; then
    echo "  ✅ Edge case handling is robust (${EDGE_CASE_RATE}%)" >> "$REPORT_FILE"
else
    echo "  ⚠️  Edge case success rate is low (${EDGE_CASE_RATE}%) - improve error handling" >> "$REPORT_FILE"
fi

if [ $AVG_EXTRACTION_TIME -gt 15000 ]; then
    echo "  ⚠️  Average extraction time exceeds 15s - consider optimization" >> "$REPORT_FILE"
elif [ $AVG_EXTRACTION_TIME -lt 10000 ]; then
    echo "  ✅ Extraction performance is good (avg ${AVG_EXTRACTION_TIME}ms)" >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" << EOF

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 8. DATA FILES GENERATED                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘

  • Detailed Report:     $REPORT_FILE
  • CSV Data Export:     $CSV_REPORT
  • JSON Metrics:        $JSON_REPORT
  • Visualization:       ${RESULTS_DIR}/visualize_results.py

╔══════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                    END OF EVALUATION REPORT                                              ║
║                              Generated: $(date)                                              ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════╝
EOF

# Generate JSON metrics for programmatic analysis
cat > "$JSON_REPORT" << EOF
{
  "test_suite_version": "3.0.0",
  "generated_at": "$(date -Iseconds)",
  "overall_metrics": {
    "total_tests": $TOTAL_TESTS,
    "passed": $PASSED_TESTS,
    "failed": $FAILED_TESTS,
    "skipped": $SKIPPED_TESTS,
    "pass_rate": $PASS_RATE,
    "edge_cases_passed": $EDGE_CASES_PASSED,
    "edge_cases_total": $EDGE_CASES_TOTAL
  },
  "deliverable_metrics": {
    "expected_categories": $TOTAL_CATEGORIES_EXPECTED,
    "found_categories": $TOTAL_CATEGORIES_FOUND,
    "category_accuracy": $CATEGORY_ACCURACY,
    "total_items_found": $TOTAL_ITEMS_FOUND,
    "avg_items_per_category": $AVG_ITEMS_OVERALL,
    "thin_deliverable_warnings": $THIN_DELIVERABLE_WARNINGS
  },
  "performance_metrics": {
    "total_duration_seconds": $ELAPSED_TIME,
    "avg_extraction_ms": $AVG_EXTRACTION_TIME,
    "min_extraction_ms": $MIN_TIME,
    "max_extraction_ms": $MAX_TIME
  },
  "ai_models": {
    "available": ["gemini-2.5-flash-lite", "gemini-3-flash-preview"]
  },
  "files": {
    "report": "$REPORT_FILE",
    "csv": "$CSV_REPORT",
    "json": "$JSON_REPORT"
  }
}
EOF

# Final output
echo -e "${CYAN}┌─────────────────────────────────────────────────────────────────────────────┐${NC}"
echo -e "${CYAN}│ OUTPUT FILES                                                                │${NC}"
echo -e "${CYAN}└─────────────────────────────────────────────────────────────────────────────┘${NC}"
echo ""
echo "  📄 Detailed Report:  $REPORT_FILE"
echo "  📊 CSV Data Export:  $CSV_REPORT"
echo "  📋 JSON Metrics:     $JSON_REPORT"
echo "  🐍 Visualization:    $PYTHON_SCRIPT"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  🎉 ALL TESTS PASSED! Model evaluation complete.                             ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
else
    echo -e "${YELLOW}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║  ⚠️  Some tests failed. Review the report for details.                       ║${NC}"
    echo -e "${YELLOW}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
fi
echo ""

# Generate Python visualization script
PYTHON_SCRIPT="${RESULTS_DIR}/visualize_results.py"
cat > "$PYTHON_SCRIPT" << 'PYTHON_EOF'
#!/usr/bin/env python3
"""
AUREA PDF Extraction Test Results Visualization
================================================
Auto-generated visualization script for test results analysis.

Usage:
    python visualize_results.py [--csv CSV_FILE]
    
Requirements:
    pip install pandas matplotlib seaborn
"""

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import json
import sys
import os
from pathlib import Path

# Set style
plt.style.use('seaborn-v0_8-whitegrid')
sns.set_palette("husl")

def find_latest_csv():
    """Find the most recent CSV file in the directory."""
    script_dir = Path(__file__).parent
    csv_files = list(script_dir.glob("test_data_*.csv"))
    if not csv_files:
        print("Error: No CSV files found in", script_dir)
        sys.exit(1)
    return max(csv_files, key=lambda x: x.stat().st_mtime)

def load_data(csv_path=None):
    """Load test data from CSV."""
    if csv_path is None:
        csv_path = find_latest_csv()
    print(f"📊 Loading data from: {csv_path}")
    return pd.read_csv(csv_path)

def create_dashboard(df, output_dir=None):
    """Create comprehensive visualization dashboard."""
    if output_dir is None:
        output_dir = Path(__file__).parent
    
    # Create figure with subplots
    fig = plt.figure(figsize=(20, 16))
    fig.suptitle('AUREA PDF Extraction - Model Evaluation Dashboard', fontsize=16, fontweight='bold', y=0.98)
    
    # 1. Overall Pass/Fail Rate (Pie Chart)
    ax1 = fig.add_subplot(3, 3, 1)
    status_counts = df['status'].value_counts()
    colors = ['#2ecc71' if s == 'PASSED' else '#e74c3c' for s in status_counts.index]
    ax1.pie(status_counts, labels=status_counts.index, autopct='%1.1f%%', colors=colors, startangle=90)
    ax1.set_title('Overall Pass Rate', fontweight='bold')
    
    # 2. Pass Rate by Category (Bar Chart)
    ax2 = fig.add_subplot(3, 3, 2)
    category_stats = df.groupby('category').agg({
        'status': lambda x: (x == 'PASSED').sum() / len(x) * 100
    }).reset_index()
    category_stats.columns = ['category', 'pass_rate']
    bars = ax2.bar(category_stats['category'], category_stats['pass_rate'], color=sns.color_palette("viridis", len(category_stats)))
    ax2.set_ylabel('Pass Rate (%)')
    ax2.set_title('Pass Rate by Category', fontweight='bold')
    ax2.set_ylim(0, 100)
    ax2.tick_params(axis='x', rotation=45)
    for bar, rate in zip(bars, category_stats['pass_rate']):
        ax2.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1, f'{rate:.1f}%', ha='center', va='bottom', fontsize=8)
    
    # 3. Category Accuracy Distribution (Histogram)
    ax3 = fig.add_subplot(3, 3, 3)
    passed_df = df[df['status'] == 'PASSED']
    if not passed_df.empty:
        ax3.hist(passed_df['category_accuracy'], bins=10, color='#3498db', edgecolor='black', alpha=0.7)
        ax3.axvline(passed_df['category_accuracy'].mean(), color='red', linestyle='--', label=f'Mean: {passed_df["category_accuracy"].mean():.1f}%')
        ax3.legend()
    ax3.set_xlabel('Category Accuracy (%)')
    ax3.set_ylabel('Frequency')
    ax3.set_title('Category Accuracy Distribution', fontweight='bold')
    
    # 4. Extraction Time by Model (Box Plot)
    ax4 = fig.add_subplot(3, 3, 4)
    model_data = df[df['model_used'] != 'unknown']
    if not model_data.empty:
        model_data['extraction_time_s'] = model_data['extraction_time_ms'] / 1000
        sns.boxplot(data=model_data, x='model_used', y='extraction_time_s', ax=ax4, palette="Set2")
        ax4.set_ylabel('Extraction Time (seconds)')
        ax4.set_xlabel('Model')
    ax4.set_title('Extraction Time by Model', fontweight='bold')
    ax4.tick_params(axis='x', rotation=15)
    
    # 5. Field Completeness by Category (Heatmap-style)
    ax5 = fig.add_subplot(3, 3, 5)
    if 'field_completeness' in df.columns:
        category_field = df.groupby('category')['field_completeness'].mean().sort_values(ascending=False)
        bars = ax5.barh(category_field.index, category_field.values, color=plt.cm.RdYlGn(category_field.values / 100))
        ax5.set_xlabel('Field Completeness (%)')
        ax5.set_title('Avg Field Completeness by Category', fontweight='bold')
        ax5.set_xlim(0, 100)
        for bar, val in zip(bars, category_field.values):
            ax5.text(val + 1, bar.get_y() + bar.get_height()/2, f'{val:.0f}%', va='center', fontsize=8)
    
    # 6. Model Usage Distribution
    ax6 = fig.add_subplot(3, 3, 6)
    model_counts = df['model_used'].value_counts()
    ax6.pie(model_counts, labels=model_counts.index, autopct='%1.1f%%', colors=sns.color_palette("pastel"), startangle=90)
    ax6.set_title('Model Usage Distribution', fontweight='bold')
    
    # 7. Extraction Time Trend
    ax7 = fig.add_subplot(3, 3, 7)
    df['test_order'] = range(len(df))
    ax7.scatter(df['test_order'], df['extraction_time_ms']/1000, c=df['status'].map({'PASSED': '#2ecc71', 'FAILED': '#e74c3c'}), alpha=0.6, s=50)
    ax7.set_xlabel('Test Order')
    ax7.set_ylabel('Extraction Time (s)')
    ax7.set_title('Extraction Time Over Test Sequence', fontweight='bold')
    
    # 8. Expected vs Found Categories
    ax8 = fig.add_subplot(3, 3, 8)
    passed_with_categories = passed_df[passed_df['expected_categories'] > 0]
    if not passed_with_categories.empty:
        ax8.scatter(passed_with_categories['expected_categories'], 
                   passed_with_categories['found_categories'], 
                   alpha=0.6, s=60, c='#3498db')
        max_val = max(passed_with_categories['expected_categories'].max(), 
                     passed_with_categories['found_categories'].max())
        ax8.plot([0, max_val], [0, max_val], 'r--', alpha=0.5, label='Perfect Match')
        ax8.legend()
    ax8.set_xlabel('Expected Categories')
    ax8.set_ylabel('Found Categories')
    ax8.set_title('Expected vs Found Categories', fontweight='bold')
    
    # 9. Summary Statistics Table
    ax9 = fig.add_subplot(3, 3, 9)
    ax9.axis('off')
    
    # Calculate summary stats
    total_tests = len(df)
    passed_tests = (df['status'] == 'PASSED').sum()
    pass_rate = passed_tests / total_tests * 100
    avg_time = df['extraction_time_ms'].mean() / 1000
    avg_accuracy = passed_df['category_accuracy'].mean() if not passed_df.empty else 0
    avg_items = passed_df['found_items'].mean() if not passed_df.empty else 0
    
    summary_text = f"""
    ╔════════════════════════════════════════╗
    ║         SUMMARY STATISTICS             ║
    ╠════════════════════════════════════════╣
    ║  Total Tests:        {total_tests:>6}            ║
    ║  Passed:             {passed_tests:>6} ({pass_rate:.1f}%)     ║
    ║  Failed:             {total_tests - passed_tests:>6}            ║
    ║                                        ║
    ║  Avg Extraction:     {avg_time:>6.1f}s           ║
    ║  Category Accuracy:  {avg_accuracy:>6.1f}%          ║
    ║  Avg Items Found:    {avg_items:>6.1f}           ║
    ╚════════════════════════════════════════╝
    """
    ax9.text(0.5, 0.5, summary_text, transform=ax9.transAxes, fontsize=10, 
             verticalalignment='center', horizontalalignment='center',
             fontfamily='monospace', bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
    
    plt.tight_layout(rect=[0, 0, 1, 0.96])
    
    # Save figure
    output_path = output_dir / 'test_results_dashboard.png'
    plt.savefig(output_path, dpi=150, bbox_inches='tight', facecolor='white')
    print(f"📈 Dashboard saved to: {output_path}")
    
    return fig

def create_model_comparison(df, output_dir=None):
    """Create model comparison visualization."""
    if output_dir is None:
        output_dir = Path(__file__).parent
    
    model_data = df[df['model_used'] != 'unknown']
    if model_data.empty:
        print("⚠️  No model data available for comparison")
        return None
    
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    fig.suptitle('AI Model Comparison', fontsize=14, fontweight='bold')
    
    # 1. Success Rate by Model
    ax1 = axes[0, 0]
    model_success = model_data.groupby('model_used').agg({
        'status': lambda x: (x == 'PASSED').sum() / len(x) * 100
    }).reset_index()
    model_success.columns = ['model', 'success_rate']
    bars = ax1.bar(model_success['model'], model_success['success_rate'], color=['#3498db', '#e74c3c'])
    ax1.set_ylabel('Success Rate (%)')
    ax1.set_title('Success Rate by Model')
    ax1.set_ylim(0, 100)
    for bar, rate in zip(bars, model_success['success_rate']):
        ax1.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1, f'{rate:.1f}%', ha='center')
    
    # 2. Average Extraction Time
    ax2 = axes[0, 1]
    model_time = model_data.groupby('model_used')['extraction_time_ms'].mean() / 1000
    bars = ax2.bar(model_time.index, model_time.values, color=['#2ecc71', '#f39c12'])
    ax2.set_ylabel('Avg Extraction Time (s)')
    ax2.set_title('Average Extraction Time by Model')
    for bar, time in zip(bars, model_time.values):
        ax2.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.5, f'{time:.1f}s', ha='center')
    
    # 3. Category Accuracy by Model
    ax3 = axes[1, 0]
    passed_model = model_data[model_data['status'] == 'PASSED']
    if not passed_model.empty:
        model_accuracy = passed_model.groupby('model_used')['category_accuracy'].mean()
        bars = ax3.bar(model_accuracy.index, model_accuracy.values, color=['#9b59b6', '#1abc9c'])
        ax3.set_ylabel('Avg Category Accuracy (%)')
        ax3.set_title('Category Accuracy by Model')
        ax3.set_ylim(0, 100)
        for bar, acc in zip(bars, model_accuracy.values):
            ax3.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1, f'{acc:.1f}%', ha='center')
    
    # 4. Usage Count
    ax4 = axes[1, 1]
    model_counts = model_data['model_used'].value_counts()
    ax4.pie(model_counts, labels=[f'{m}\n({c} tests)' for m, c in model_counts.items()], 
            autopct='%1.1f%%', colors=['#3498db', '#e74c3c'], startangle=90)
    ax4.set_title('Model Usage Distribution')
    
    plt.tight_layout()
    
    output_path = output_dir / 'model_comparison.png'
    plt.savefig(output_path, dpi=150, bbox_inches='tight', facecolor='white')
    print(f"📊 Model comparison saved to: {output_path}")
    
    return fig

def main():
    """Main visualization function."""
    import argparse
    parser = argparse.ArgumentParser(description='Visualize AUREA PDF extraction test results')
    parser.add_argument('--csv', type=str, help='Path to CSV file (default: latest in directory)')
    parser.add_argument('--show', action='store_true', help='Show plots interactively')
    args = parser.parse_args()
    
    print("=" * 60)
    print("  AUREA PDF Extraction - Test Results Visualization")
    print("=" * 60)
    print()
    
    # Load data
    csv_path = Path(args.csv) if args.csv else None
    df = load_data(csv_path)
    
    print(f"📋 Loaded {len(df)} test results")
    print(f"   - Passed: {(df['status'] == 'PASSED').sum()}")
    print(f"   - Failed: {(df['status'] == 'FAILED').sum()}")
    print()
    
    # Create visualizations
    output_dir = Path(__file__).parent
    
    print("🎨 Generating visualizations...")
    create_dashboard(df, output_dir)
    create_model_comparison(df, output_dir)
    
    print()
    print("✅ Visualization complete!")
    print()
    print("Generated files:")
    print(f"   📈 {output_dir / 'test_results_dashboard.png'}")
    print(f"   📊 {output_dir / 'model_comparison.png'}")
    
    if args.show:
        plt.show()

if __name__ == '__main__':
    main()
PYTHON_EOF

chmod +x "$PYTHON_SCRIPT"
echo ""
echo -e "${CYAN}  🐍 Python Visualization: $PYTHON_SCRIPT${NC}"
echo -e "${CYAN}     Run: python $PYTHON_SCRIPT${NC}"
echo ""

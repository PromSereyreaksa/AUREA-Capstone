#!/bin/bash

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  AUREA - Real Client Proposal Test                                            ║
# ║  Tests Gemini AI extraction with grouped deliverables + items                 ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

# Directory paths (relative to script location)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SAMPLES_DIR="$SCRIPT_DIR/../samples"
RESULTS_DIR="$SCRIPT_DIR/../results"

API_URL="http://localhost:3000/api/v0/pdf/extract"
PDF_FILE="$SAMPLES_DIR/pdf/00-Real-client-proposal.pdf"
USER_ID=1

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  ${BOLD}AUREA PDF Extraction Test - Real Client Proposal${NC}${CYAN}                            ║${NC}"
echo -e "${CYAN}║  Testing: Grouped deliverables with items array                             ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if PDF exists
if [ ! -f "$PDF_FILE" ]; then
    echo -e "${RED}ERROR: PDF file not found at $PDF_FILE${NC}"
    echo "Run: bash convert-txt-to-pdf.sh first"
    exit 1
fi

echo -e "${YELLOW}📄 PDF File:${NC} $PDF_FILE"
echo -e "${YELLOW}🌐 API URL:${NC} $API_URL"
echo ""
echo -e "${CYAN}Sending PDF to extraction API...${NC}"
echo ""

# Make the API request and capture response
RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "$API_URL" \
    -F "pdf=@$PDF_FILE" \
    -F "user_id=$USER_ID" \
    --max-time 180)

# Extract HTTP status code (last line)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
# Extract JSON body (everything except last line)
JSON_BODY=$(echo "$RESPONSE" | sed '$d')

echo -e "${BLUE}HTTP Status: ${NC}$HTTP_CODE"
echo ""

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
    echo -e "${GREEN}✓ Extraction successful!${NC}"
    echo ""
    
    # Save full JSON response to file
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    OUTPUT_FILE="$RESULTS_DIR/real_client_proposal_${TIMESTAMP}.json"
    mkdir -p "$RESULTS_DIR"
    echo "$JSON_BODY" | jq '.' > "$OUTPUT_FILE"
    echo -e "${YELLOW}📁 Full JSON saved to:${NC} $OUTPUT_FILE"
    echo ""
    
    # ═══════════════════════════════════════════════════════════════════════════
    # PROJECT DETAILS
    # ═══════════════════════════════════════════════════════════════════════════
    echo -e "${CYAN}┌──────────────────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${CYAN}│  ${BOLD}PROJECT DETAILS${NC}${CYAN}                                                              │${NC}"
    echo -e "${CYAN}└──────────────────────────────────────────────────────────────────────────────┘${NC}"
    echo ""
    
    echo -e "  ${GREEN}Project Name:${NC}  $(echo "$JSON_BODY" | jq -r '.data.project.project_name // "N/A"')"
    echo -e "  ${GREEN}Title:${NC}         $(echo "$JSON_BODY" | jq -r '.data.project.title // "N/A"')"
    echo -e "  ${GREEN}Description:${NC}   $(echo "$JSON_BODY" | jq -r '.data.project.description // "N/A"' | head -c 80)..."
    echo -e "  ${GREEN}Duration:${NC}      $(echo "$JSON_BODY" | jq -r '.data.project.duration // "N/A"') days"
    echo -e "  ${GREEN}Difficulty:${NC}    $(echo "$JSON_BODY" | jq -r '.data.project.difficulty // "N/A"')"
    echo -e "  ${GREEN}Licensing:${NC}     $(echo "$JSON_BODY" | jq -r '.data.project.licensing // "N/A"')"
    echo -e "  ${GREEN}Usage Rights:${NC}  $(echo "$JSON_BODY" | jq -r '.data.project.usage_rights // "N/A"')"
    echo ""
    
    # ═══════════════════════════════════════════════════════════════════════════
    # DELIVERABLES WITH ITEMS
    # ═══════════════════════════════════════════════════════════════════════════
    echo -e "${CYAN}┌──────────────────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${CYAN}│  ${BOLD}DELIVERABLES (Grouped with Items)${NC}${CYAN}                                          │${NC}"
    echo -e "${CYAN}└──────────────────────────────────────────────────────────────────────────────┘${NC}"
    echo ""
    
    DELIVERABLE_COUNT=$(echo "$JSON_BODY" | jq '.data.deliverables | length')
    TOTAL_ITEMS=$(echo "$JSON_BODY" | jq '[.data.deliverables[].items // [] | length] | add // 0')
    
    echo -e "  ${YELLOW}Total Deliverable Categories:${NC} $DELIVERABLE_COUNT"
    echo -e "  ${YELLOW}Total Sub-Items:${NC} $TOTAL_ITEMS"
    echo ""
    
    # Display each deliverable with its items
    echo "$JSON_BODY" | jq -r '.data.deliverables | to_entries[] | 
        "  \u001b[1;34m\(.key + 1). \(.value.deliverable_type)\u001b[0m (qty: \(.value.quantity))\n     └── Items: \(if (.value.items | length) > 0 then (.value.items | join(", ")) else "(none)" end)\n"'
    
    # ═══════════════════════════════════════════════════════════════════════════
    # ITEMS BREAKDOWN
    # ═══════════════════════════════════════════════════════════════════════════
    echo -e "${CYAN}┌──────────────────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${CYAN}│  ${BOLD}ALL ITEMS (Flattened View)${NC}${CYAN}                                                  │${NC}"
    echo -e "${CYAN}└──────────────────────────────────────────────────────────────────────────────┘${NC}"
    echo ""
    
    echo "$JSON_BODY" | jq -r '.data.deliverables[] | select(.items != null and (.items | length) > 0) | 
        "  [\(.deliverable_type)]", (.items[] | "    • \(.)")'
    echo ""
    
    # ═══════════════════════════════════════════════════════════════════════════
    # METADATA
    # ═══════════════════════════════════════════════════════════════════════════
    echo -e "${CYAN}┌──────────────────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${CYAN}│  ${BOLD}METADATA${NC}${CYAN}                                                                     │${NC}"
    echo -e "${CYAN}└──────────────────────────────────────────────────────────────────────────────┘${NC}"
    echo ""
    echo -e "  ${GREEN}Model Used:${NC}  $(echo "$JSON_BODY" | jq -r '.data.metadata.model // "N/A"')"
    echo -e "  ${GREEN}Summarized:${NC}  $(echo "$JSON_BODY" | jq -r '.data.metadata.summarized // false')"
    echo ""
    
    # ═══════════════════════════════════════════════════════════════════════════
    # VALIDATION CHECK
    # ═══════════════════════════════════════════════════════════════════════════
    echo -e "${CYAN}┌──────────────────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${CYAN}│  ${BOLD}EXTRACTION QUALITY CHECK${NC}${CYAN}                                                    │${NC}"
    echo -e "${CYAN}└──────────────────────────────────────────────────────────────────────────────┘${NC}"
    echo ""
    
    # Check for expected deliverable categories
    HAS_BRAND_IDENTITY=$(echo "$JSON_BODY" | jq '[.data.deliverables[].deliverable_type | ascii_downcase | contains("brand") or contains("identity") or contains("logo")] | any')
    HAS_GUIDELINES=$(echo "$JSON_BODY" | jq '[.data.deliverables[].deliverable_type | ascii_downcase | contains("guideline") or contains("style")] | any')
    HAS_SOCIAL=$(echo "$JSON_BODY" | jq '[.data.deliverables[].deliverable_type | ascii_downcase | contains("social")] | any')
    HAS_FINAL_DELIVERY=$(echo "$JSON_BODY" | jq '[.data.deliverables[].deliverable_type | ascii_downcase | contains("final") or contains("delivery") or contains("asset")] | any')
    
    echo -e "  Expected Deliverable Categories:"
    [ "$HAS_BRAND_IDENTITY" = "true" ] && echo -e "    ${GREEN}✓${NC} Brand Identity System" || echo -e "    ${RED}✗${NC} Brand Identity System (missing)"
    [ "$HAS_GUIDELINES" = "true" ] && echo -e "    ${GREEN}✓${NC} Brand Guidelines" || echo -e "    ${RED}✗${NC} Brand Guidelines (missing)"
    [ "$HAS_SOCIAL" = "true" ] && echo -e "    ${GREEN}✓${NC} Social Media Kit" || echo -e "    ${YELLOW}○${NC} Social Media Kit (optional)"
    [ "$HAS_FINAL_DELIVERY" = "true" ] && echo -e "    ${GREEN}✓${NC} Final Asset Delivery" || echo -e "    ${RED}✗${NC} Final Asset Delivery (missing)"
    echo ""
    
    # Check items count per deliverable
    echo -e "  Items per Deliverable:"
    echo "$JSON_BODY" | jq -r '.data.deliverables[] | "    \(.deliverable_type): \(.items | length // 0) items"'
    echo ""
    
    # Warn if any deliverable has < 3 items (too thin)
    THIN_DELIVERABLES=$(echo "$JSON_BODY" | jq '[.data.deliverables[] | select((.items | length // 0) < 3 and (.items | length // 0) > 0)] | length')
    if [ "$THIN_DELIVERABLES" -gt 0 ]; then
        echo -e "  ${YELLOW}⚠ Warning: $THIN_DELIVERABLES deliverable(s) have < 3 items (may be too thin)${NC}"
    fi
    echo ""
    
else
    echo -e "${RED}✗ Extraction failed!${NC}"
    echo ""
    echo -e "${RED}Response:${NC}"
    echo "$JSON_BODY" | jq '.' 2>/dev/null || echo "$JSON_BODY"
fi

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  ${BOLD}Test Complete${NC}${CYAN}                                                                 ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

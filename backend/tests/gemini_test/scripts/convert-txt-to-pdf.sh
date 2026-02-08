#!/bin/bash

# Convert all .txt files to PDF in samples directory

echo "=========================================="
echo "Converting TXT files to PDF"
echo "=========================================="
echo ""

# Directory paths (relative to script location)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SAMPLES_DIR="$SCRIPT_DIR/../samples"
TXT_DIR="$SAMPLES_DIR/txt"
PDF_DIR="$SAMPLES_DIR/pdf"

cd "$TXT_DIR" || exit 1

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

CONVERTED=0
FAILED=0

# Check if libreoffice is available
if command -v libreoffice &> /dev/null; then
    echo "Using LibreOffice for conversion..."
    echo "Source: $TXT_DIR"
    echo "Output: $PDF_DIR"
    echo ""
    
    for file in *.txt; do
        if [ -f "$file" ]; then
            echo "Converting: $file"
            if libreoffice --headless --convert-to pdf --outdir "$PDF_DIR" "$file" &> /dev/null; then
                echo -e "${GREEN}✓ Created: ${file%.txt}.pdf${NC}"
                ((CONVERTED++))
            else
                echo -e "${RED}✗ Failed to convert: $file${NC}"
                ((FAILED++))
            fi
        fi
    done
    
elif command -v enscript &> /dev/null && command -v ps2pdf &> /dev/null; then
    echo "Using enscript + ps2pdf for conversion..."
    echo "Source: $TXT_DIR"
    echo "Output: $PDF_DIR"
    echo ""
    
    for file in *.txt; do
        if [ -f "$file" ]; then
            echo "Converting: $file"
            if enscript -B -p - "$file" 2>/dev/null | ps2pdf - "$PDF_DIR/${file%.txt}.pdf" 2>/dev/null; then
                echo -e "${GREEN}✓ Created: ${file%.txt}.pdf${NC}"
                ((CONVERTED++))
            else
                echo -e "${RED}✗ Failed to convert: $file${NC}"
                ((FAILED++))
            fi
        fi
    done
    
else
    echo -e "${RED}Error: No PDF conversion tool found!${NC}"
    echo ""
    echo "Please install one of the following:"
    echo "  1. LibreOffice: sudo apt install libreoffice-writer"
    echo "  2. enscript + ghostscript: sudo apt install enscript ghostscript"
    echo ""
    exit 1
fi

echo ""
echo "=========================================="
echo "Conversion Summary"
echo "=========================================="
echo -e "${GREEN}Converted: $CONVERTED${NC}"
echo -e "${RED}Failed:    $FAILED${NC}"
echo ""

if [ $CONVERTED -gt 0 ]; then
    echo "PDF files created in: $SAMPLES_DIR/"
    echo ""
    echo "Ready to run accuracy test:"
    echo "  cd .."
    echo "  bash test-pdf-accuracy.sh"
else
    echo -e "${YELLOW}No files were converted${NC}"
fi

echo "=========================================="

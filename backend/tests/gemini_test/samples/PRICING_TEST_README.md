# Test Client Briefs for Pricing Integration

This directory contains test client briefs specifically designed to test the **Project Extraction + AI Pricing Integration** feature.

## Test Files

### 1. `PRICING_TEST_01-STARTUP_RUSH.txt`
**Scenario:** Early-stage startup with urgent deadline

**Characteristics:**
- ✅ Client Type: **Startup** (should get lower rate)
- ✅ Urgency: **URGENT** ("ASAP", "3 weeks", multiple urgency mentions)
- ✅ Budget: Mentioned but vague ($500-2000 range, hoping for $1000)
- ✅ Region: **Cambodia** (Phnom Penh based, targeting Southeast Asia)
- ✅ Deliverables: Moderate complexity (6-7 items grouped)
- ⚠️ Missing: Specific timeline dates (only "3 weeks")
- ⚠️ Incomplete: Vague style requirements ("that vibe")

**Expected AI Behavior:**
- Detect `client_type: "startup"`
- Detect `urgency: "urgent"` or `"rush"`
- Extract `budget_mentioned: 1000` (or range)
- Detect `client_region: "cambodia"`
- Estimate ~30-50 hours for deliverables
- Apply negative client type multiplier (startups get -5 to -10%)
- Apply urgency multiplier (+30-50% for rush work)
- **Net effect:** Lower base rate but increased by urgency = competitive but fair pricing

**Pricing Expectations:**
- Base rate: $30-35/hr (Cambodia mid-level)
- After startup discount: $27-32/hr
- After urgency premium: $35-48/hr
- Project total: ~$1,400-2,400 (assuming 40-50 hours)

---

### 2. `PRICING_TEST_02-CORPORATE_DETAILED.txt`
**Scenario:** Large corporate bank with extensive deliverables

**Characteristics:**
- ✅ Client Type: **Corporate** (bank, $120M+ revenue, procurement process)
- ✅ Urgency: **Normal** (Q1 timeline, flexible)
- ✅ Budget: Mentioned ($5,000-12,000 range for similar projects)
- ✅ Region: **Cambodia** (MekongBank)
- ✅ Deliverables: **High complexity** (50+ individual items across 4 categories)
- ⚠️ Missing: Specific deadline (only "Q1 if possible")
- ⚠️ Incomplete: Timeline TBD

**Expected AI Behavior:**
- Detect `client_type: "corporate"` or `"government"`
- Detect `urgency: "normal"`
- Extract `budget_mentioned: 8500` (average of range)
- Detect `client_region: "cambodia"`
- Estimate 120-180+ hours (massive deliverable count)
- Extract complexity indicators: "regulatory compliance", "approval process", "multiple stakeholders"
- Apply positive client type multiplier (corporate +20-30%)
- NO urgency multiplier (normal timeline)
- **Net effect:** Higher base rate + corporate premium = premium pricing

**Pricing Expectations:**
- Base rate: $35-40/hr (experienced level needed)
- After corporate premium: $42-52/hr
- Project total: ~$6,000-9,000 (assuming 120-180 hours)
- Should align with stated budget range ($5k-12k)

---

## What Makes This "Not Perfect Data"?

### Intentional Imperfections:

1. **Missing Specific Dates**
   - Test 1: "3 weeks" instead of exact date
   - Test 2: "Q1 if possible" instead of deadline

2. **Vague Requirements**
   - Test 1: "Something that pops", "that vibe", "whatever fonts work"
   - Test 2: Timeline "TBD" (testing AI's handling of missing critical info)

3. **Budget Ambiguity**
   - Test 1: Range provided with hope for lower end
   - Test 2: Reference to "previous projects" not current budget

4. **Mixed Signals**
   - Test 1: "Bootstrapped" + "budget is tight" vs "can stretch a bit"
   - Test 2: Corporate entity but prefers Cambodia-based (may affect international rates)

5. **Incomplete Technical Details**
   - Test 1: "whatever fonts work best"
   - Test 2: No specific color codes, just "match Pantone swatches provided" (not actually provided)

6. **Varying Detail Levels**
   - Test 1: Casual, startup-style brief
   - Test 2: Formal RFQ with excessive detail in some areas, missing in others

---

## Running The Tests

### Option 1: Automated Test Script
```bash
cd backend/tests/gemini_test
./test-pricing-integration.sh
```

### Option 2: Manual API Testing

**Test Startup Brief (with pricing):**
```bash
curl -X POST "http://localhost:3000/api/pdf-extract/extract?calculate_pricing=true" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "pdf=@samples/txt/PRICING_TEST_01-STARTUP_RUSH.txt" \
  -F "user_id=1"
```

**Test Corporate Brief (with pricing):**
```bash
curl -X POST "http://localhost:3000/api/pdf-extract/extract?calculate_pricing=true" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "pdf=@samples/txt/PRICING_TEST_02-CORPORATE_DETAILED.txt" \
  -F "user_id=1"
```

**Test Without Grounding (faster, AI knowledge only):**
```bash
curl -X POST "http://localhost:3000/api/pdf-extract/extract?calculate_pricing=true&use_grounding=false" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "pdf=@samples/txt/PRICING_TEST_01-STARTUP_RUSH.txt" \
  -F "user_id=1"
```

---

## Validation Checklist

### For Test 1 (Startup Rush):
- [ ] `client_type` detected as "startup"
- [ ] `urgency` detected as "urgent" or "rush"
- [ ] `budget_mentioned` extracted (~1000)
- [ ] `estimated_hours` in range 30-50
- [ ] `final_hourly_rate` shows urgency multiplier applied
- [ ] `adjustments` array includes both client_type and urgency factors
- [ ] `sources` includes web search results (if grounding enabled)
- [ ] Total estimate is reasonable for startup budget ($1.5k-2.5k)

### For Test 2 (Corporate Detailed):
- [ ] `client_type` detected as "corporate"
- [ ] `urgency` detected as "normal"
- [ ] `budget_mentioned` extracted (~8500)
- [ ] `estimated_hours` is much higher (100-180+)
- [ ] `complexity_indicators` includes "regulatory compliance", "approval process"
- [ ] `final_hourly_rate` shows corporate premium
- [ ] Project total aligns with stated budget range
- [ ] Many deliverables properly extracted and grouped

### General Validation:
- [ ] Both responses include `pricing` object
- [ ] `calculation_breakdown` shows step-by-step rate adjustments
- [ ] `market_research` includes Cambodia-specific data
- [ ] `sources` array is populated (when grounding enabled)
- [ ] Response time reasonable (~10-20 seconds with grounding)
- [ ] No errors in extraction or pricing calculation

---

## Expected Differences

| Aspect | Test 1 (Startup) | Test 2 (Corporate) |
|--------|------------------|-------------------|
| **Client Type Multiplier** | -5% to -10% | +20% to +30% |
| **Urgency Multiplier** | +30% to +50% | None (normal) |
| **Base Rate** | $30-35/hr | $35-40/hr |
| **Final Rate** | $35-48/hr | $42-52/hr |
| **Estimated Hours** | 30-50 hrs | 120-180+ hrs |
| **Project Total** | $1,400-2,400 | $6,000-9,000 |
| **Complexity** | Medium | High |
| **Deliverables** | 6-7 items | 50+ items |

---

## Notes

- These are **text files** for easy editing. In production, actual PDF files would be used.
- To convert to PDF for more realistic testing: Use any text-to-PDF converter or `pandoc`
- The AI should handle text files the same way it handles PDF text extraction
- Grounding adds ~2-5 seconds to response time but improves accuracy significantly
- Without grounding, pricing relies on AI's training data (may be less current)

---

## Creating PDF Versions (Optional)

```bash
# Using pandoc (if installed)
pandoc samples/txt/PRICING_TEST_01-STARTUP_RUSH.txt -o samples/pdf/PRICING_TEST_01-STARTUP_RUSH.pdf
pandoc samples/txt/PRICING_TEST_02-CORPORATE_DETAILED.txt -o samples/pdf/PRICING_TEST_02-CORPORATE_DETAILED.pdf

# Or use LibreOffice
libreoffice --headless --convert-to pdf samples/txt/PRICING_TEST_01-STARTUP_RUSH.txt --outdir samples/pdf/
libreoffice --headless --convert-to pdf samples/txt/PRICING_TEST_02-CORPORATE_DETAILED.txt --outdir samples/pdf/
```

---

**Last Updated:** February 2026  
**Feature Version:** v1.0.0 (Project Extraction + AI Pricing Integration)

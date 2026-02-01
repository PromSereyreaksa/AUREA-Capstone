# Quick Estimate A/B Testing

This folder contains tests to compare the Quick Estimate API with and without Google Search Grounding.

## Overview

The Quick Estimate endpoint (`/api/v1/pricing/quick-estimate`) supports two modes:

1. **With Google Search Grounding** (default)
   - AI searches the web in real-time
   - Returns actual URLs from web searches
   - Prices based on current web data

2. **Without Grounding** (use_grounding=false)
   - AI uses only its training data
   - No live web searches
   - Based on AI's knowledge cutoff

## Files

| File | Description |
|------|-------------|
| `quick-estimate-test.sh` | Main test script - runs both modes and saves results |
| `compare_results.py` | Python script to analyze and compare results |
| `results/` | Output directory for JSON result files |

## Usage

### 1. Run the Test

```bash
# Make sure server is running first
cd backend && npm run dev

# In another terminal, run the test
cd backend/tests/quick_estimate
./quick-estimate-test.sh
```

This will:
- Create a test user
- Run 4 scenarios (beginner, intermediate, experienced, expert)
- Test WITH grounding (default)
- Test WITHOUT grounding (?use_grounding=false)
- Save results to `results/` folder

### 2. Compare Results

```bash
# Using latest results
python3 compare_results.py

# Or specify specific files
python3 compare_results.py results/with_grounding_XXXX.json results/without_grounding_XXXX.json
```

### 3. Output

The comparison shows:
- **Hourly Rate Comparison** - rates from both modes
- **Monthly Cost Estimates** - software, workspace, income
- **Data Sources Analysis** - how many sources, web URLs present
- **Key Insights** - average differences, grounding effectiveness

## API Parameter

To toggle grounding via API:

```bash
# WITH grounding (default)
POST /api/v1/pricing/quick-estimate
{
  "user_id": 1,
  "skills": "Logo Design",
  "experience_level": "beginner",
  "hours_per_week": 20
}

# WITHOUT grounding
POST /api/v1/pricing/quick-estimate?use_grounding=false
{
  "user_id": 1,
  "skills": "Logo Design",
  "experience_level": "beginner",
  "hours_per_week": 20
}
```

## Expected Differences

| Aspect | With Grounding | Without Grounding |
|--------|----------------|-------------------|
| Sources | Web URLs (real) | AI knowledge labels |
| Data freshness | Current (2024-2026) | Training cutoff |
| Cost accuracy | Higher (real prices) | Estimated |
| Response time | Slightly slower | Faster |

## Result Files Structure

```json
{
  "test_type": "with_google_search_grounding",
  "timestamp": "2026-01-29T23:55:00+07:00",
  "results": [
    {
      "experience_level": "beginner",
      "skills": "Logo Design, Social Media Graphics",
      "estimate": {
        "hourly_rate_min": 8.5,
        "hourly_rate_max": 15,
        "recommended_rate": 12
      },
      "ai_researched_costs": { ... },
      "sources": [
        "Adobe Creative Cloud Pricing (https://adobe.com/...)",
        "Factory Phnom Penh (https://factorypp.com/...)"
      ],
      "has_web_urls": true
    }
  ]
}
```

# AUREA Pricing Calculation Engine

## Overview

The AUREA Pricing Calculation Engine is a sophisticated AI-powered system that helps freelance graphic designers in Cambodia calculate sustainable, market-aligned hourly rates. The engine combines the **UREA (Utility, Rent, Equipment, Administration)** pricing framework with **Google Gemini AI** and **Google Search Grounding** to provide accurate, data-driven pricing recommendations.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [UREA Framework](#urea-framework)
3. [Technology Stack](#technology-stack)
4. [Calculation Modes](#calculation-modes)
5. [Google Search Grounding](#google-search-grounding)
6. [Calculation Flow](#calculation-flow)
7. [Market Benchmarking](#market-benchmarking)
8. [Security](#security)
9. [Testing & Validation](#testing--validation)
10. [Performance Considerations](#performance-considerations)
11. [Error Handling](#error-handling)
12. [Future Enhancements](#future-enhancements)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Request                            │
│              (User Profile + Project Context)                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Pricing Controller                            │
│  • Validates input                                               │
│  • Routes to appropriate use case                                │
│  • Handles query parameters (e.g., use_grounding)                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                ▼                         ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│  Full Onboarding Mode    │   │  Quick Estimate Mode     │
│  (User-provided data)    │   │  (AI-researched data)    │
└──────────┬───────────────┘   └───────────┬──────────────┘
           │                               │
           ▼                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Gemini AI Service                             │
│  • Validates user inputs (onboarding)                            │
│  • Researches market data (quick estimate)                       │
│  • Google Search Grounding (when enabled)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    UREA Calculation Engine                       │
│  Formula: (Total Costs + Desired Income) / Billable Hours       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Market Benchmark Adjustment                     │
│  • Compares against Cambodia market data                         │
│  • Applies seniority multipliers                                 │
│  • Adjusts for client type and region                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Final Rate Output                           │
│  • Min/Max range                                                 │
│  • Recommended rate                                              │
│  • Breakdown and sources                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## UREA Framework

### What is UREA?

UREA is a cost-based pricing framework specifically designed for freelancers to ensure their rates are **sustainable** and **profitable**. It stands for:

| Component | Description | Examples |
|-----------|-------------|----------|
| **U**tility | Software, subscriptions, tools | Adobe CC, Figma, Canva Pro |
| **R**ent | Workspace costs | Co-working space, home office utilities |
| **E**quipment | Hardware (amortized) | Laptop, monitor, tablet, peripherals |
| **A**dministration | Business expenses | Internet, electricity, taxes, insurance |

### Core Formula

```
Base Hourly Rate = (Total Monthly Costs + Desired Monthly Income) / Monthly Billable Hours
```

Where:
- **Total Monthly Costs** = Utility + Rent + Equipment + Administration
- **Desired Monthly Income** = Target take-home income (after costs)
- **Monthly Billable Hours** = Working hours × Billable ratio (typically 60-85%)

### Example Calculation

For a **Beginner** graphic designer in Cambodia:

```
Costs:
├─ Software (Utility):         $35/month
├─ Workspace (Rent):          $120/month
├─ Equipment (amortized):     $100/month
└─ Utilities + Internet:       $105/month
                              ─────────────
Total Monthly Costs:          $360/month

Income Goal:                 $1,200/month
Working Hours:                  80 hours/week
Billable Ratio:                  60% (48 hours)

Calculation:
($360 + $1,200) / 48 = $32.50/hour (raw UREA result)

After market adjustment: $15/hour (recommended)
```

---

## Technology Stack

### Backend Framework
- **Node.js** (v18+) with **TypeScript** (v5.3+)
- **Express.js** (v4.18+) - REST API framework
- **Clean Architecture** - Domain-driven design pattern

### AI & Machine Learning
- **Google Gemini 2.5 Flash** - Large Language Model
  - Model: `gemini-2.5-flash-lite`
  - Context window: 1M tokens
  - JSON mode: Structured output
- **Google Search Grounding** - Real-time web search integration
  - Dynamic retrieval threshold: 0.2 (moderate search tendency)
  - Source tracking: URLs, titles, confidence scores

### Database
- **Supabase** (PostgreSQL 15)
  - User profiles and onboarding sessions
  - Market benchmarks by category and seniority
  - Pricing profiles and calculation history

### Key Libraries
```json
{
  "@google/genai": "^1.38.0",
  "express": "^4.18.2",
  "dotenv": "^16.3.1",
  "zod": "^3.22.4"
}
```

---

## Calculation Modes

### 1. Full Onboarding Mode

**Use Case**: Users who know their actual costs and income goals.

**Process**:
1. User completes 10-question onboarding
2. Gemini AI validates each answer:
   ```typescript
   Q1: Monthly rent/office costs → Validates: positive number
   Q2: Equipment/software costs → Validates: reasonable range
   Q3: Utilities/insurance/taxes → Validates: numeric format
   Q4: Materials per project → Validates: positive or zero
   Q5: Desired monthly income → Validates: sustainable amount
   Q6: Billable hours/month → Validates: 40-200 range
   Q7: Profit margin → Validates: 5-50% range
   Q8: Years of experience → Validates: 0-50 years
   Q9: Skills list → Validates: relevant skills
   Q10: Seniority level → Validates: junior/mid/senior/expert
   ```

3. Data stored in `pricing_profiles` table
4. UREA calculation applied directly
5. Market benchmark comparison

**Endpoints**:
- `POST /api/v1/pricing/onboarding/start`
- `POST /api/v1/pricing/onboarding/answer`
- `POST /api/v1/pricing/calculate/base-rate`
- `POST /api/v1/pricing/calculate/project-rate`

### 2. Quick Estimate Mode (AI-Powered)

**Use Case**: Beginners who don't know their costs yet.

**Process**:
1. User provides minimal info:
   - Skills (e.g., "Logo Design, Branding")
   - Experience level (beginner/intermediate/experienced/expert)
   - Hours per week (5-80)
   - Optional: Client type, region

2. **With Google Search Grounding** (default):
   ```typescript
   // AI searches the web for real-time data
   const response = await geminiService.generateContentWithGrounding(prompt, 0.2);
   
   // Example searches performed:
   [
     "Adobe Creative Cloud Cambodia price",
     "co-working spaces Phnom Penh prices",
     "laptop prices Cambodia for graphic design",
     "freelance graphic designer rates Cambodia",
     "cost of living Phnom Penh"
   ]
   
   // Sources returned:
   [
     "Factory Phnom Penh (https://factoryphnompenh.com/office-spaces)",
     "Mekong Space (https://mekongspace.com/)",
     "Upwork Cambodia rates (https://upwork.com/...)",
     ...44 total sources
   ]
   ```

3. **Without Grounding** (for comparison):
   ```typescript
   // AI uses only training data (knowledge cutoff)
   const response = await geminiService.generateContent(prompt);
   
   // Sources returned:
   [
     "AI market research",
     "Cambodia cost of living data",
     "(AI Knowledge Base - No live web search)"
   ]
   ```

4. AI returns structured JSON:
   ```json
   {
     "hourly_rate_min": 8,
     "hourly_rate_max": 25,
     "recommended_rate": 15,
     "costs": {
       "software_cost": 35,
       "software_details": "Adobe CC All Apps ~$7.50/mo, Figma Pro ~$45/mo...",
       "workspace_cost": 120,
       "workspace_details": "Mekong Space $100/mo, Factory PP $280/mo...",
       "equipment_cost": 100,
       "equipment_details": "Laptop $1000-$1500 amortized over 36 months...",
       "total_expenses": 360
     },
     "income": {
       "suggested_income": 1200,
       "reasoning": "Cost of living in Phnom Penh: $523-$876/mo...",
       "billable_ratio": 0.6,
       "billable_hours": 48
     },
     "market": {
       "median_rate": 9,
       "percentile_75_rate": 15,
       "position": "at_market"
     },
     "sources": [ "..." ]
   }
   ```

**Endpoint**:
- `POST /api/v1/pricing/quick-estimate?use_grounding=true`

---

## Google Search Grounding

### What is Google Search Grounding?

Google Search Grounding is a Gemini AI feature that allows the model to search the web in **real-time** to retrieve current, factual information. Instead of relying solely on training data (which has a knowledge cutoff), the AI can access live web content.

### How It Works

```typescript
// 1. Enable grounding in API call
const response = await client.models.generateContent({
  model: 'gemini-2.5-flash-lite',
  contents: prompt,
  config: {
    tools: [
      {
        googleSearch: {}  // Enable web search
      }
    ]
  }
});

// 2. Gemini decides when to search
// Based on dynamic retrieval threshold (0.0-1.0)
// Lower = more searches, Higher = fewer searches

// 3. AI performs searches
const searchQueries = [
  "Adobe Creative Cloud Cambodia price",
  "co-working spaces Phnom Penh prices"
];

// 4. Returns grounding metadata
const sources = response.candidates[0].groundingMetadata;
/*
{
  webSearchQueries: ["Adobe CC price", "Phnom Penh coworking"],
  groundingChunks: [
    {
      web: {
        uri: "https://factoryphnompenh.com/office-spaces",
        title: "Factory Phnom Penh Office Spaces"
      }
    }
  ]
}
*/
```

### Benefits

| Aspect | With Grounding | Without Grounding |
|--------|----------------|-------------------|
| **Data Freshness** | Current (2024-2026) | Training cutoff (~2023) |
| **Accuracy** | Real prices from websites | Estimated/interpolated |
| **Transparency** | Actual URLs provided | Generic sources |
| **Cambodia-specific** | Local websites, job boards | General knowledge |
| **Verification** | User can check sources | Harder to verify |

### Example: Real Sources Retrieved

From actual test run (44 sources):

```
Web Sources with URLs:
├─ khmer24.com (office rentals)
├─ factoryphnompenh.com (co-working space)
├─ mekongspace.com (co-working membership)
├─ office-hub.com (office listings)
├─ upwork.com (freelancer rates)
├─ truelancer.com (Cambodia designer rates)
├─ clutch.co (agency rates)
├─ livingcostindex.com (cost of living)
└─ ...36 more URLs

Search Queries Performed:
├─ Adobe Creative Cloud Cambodia price
├─ Figma Cambodia price
├─ co-working spaces Phnom Penh prices
├─ laptop prices Cambodia for graphic design
├─ junior graphic designer salary Phnom Penh
└─ freelance rates Upwork Cambodia graphic design
```

### Fallback Mechanism

```typescript
try {
  // Try with grounding
  const response = await generateContentWithGrounding(prompt, 0.2);
  return response;
} catch (error) {
  if (error.message.includes('grounding')) {
    // Grounding not available - fallback to knowledge base
    console.warn('Grounding unavailable, using AI knowledge');
    const fallback = await generateContent(prompt);
    return {
      text: fallback,
      groundingMetadata: {
        searchQueries: [],
        webSearchSources: [
          { uri: 'AI Training Data', title: 'Gemini Knowledge Base' }
        ]
      }
    };
  }
  throw error;
}
```

---

## Calculation Flow

### Step-by-Step Process

#### 1. Input Validation

```typescript
// File: src/shared/validators/PricingValidator.ts

validateQuickEstimate(data: any): QuickEstimateInput {
  // Validate user_id
  this.throwIf(this.isNullOrEmpty(data?.user_id), 'user_id is required');
  const user_id = this.parsePositiveInt(data.user_id, 'user_id');

  // Validate experience level
  const validLevels = ['beginner', 'intermediate', 'experienced', 'expert'];
  this.throwIf(
    !validLevels.includes(data.experience_level),
    'Invalid experience_level'
  );

  // Validate hours (5-80 per week)
  const hours_per_week = parseInt(data.hours_per_week);
  this.throwIf(
    hours_per_week < 5 || hours_per_week > 80,
    'hours_per_week must be between 5 and 80'
  );

  return { user_id, skills, experience_level, hours_per_week };
}
```

#### 2. Market Benchmark Retrieval

```typescript
// File: src/infrastructure/repositories/MarketBenchmarkRepository.ts

async findByRegion(region: string): Promise<MarketBenchmark[]> {
  const { data, error } = await supabase
    .from('market_benchmarks')
    .select('*')
    .eq('region', region)
    .order('median_hourly_rate', { ascending: false });

  return data.map(row => new MarketBenchmark(
    row.category,
    row.region,
    row.seniority_level,
    row.median_hourly_rate,
    row.percentile_75_rate,
    row.sample_size
  ));
}
```

#### 3. AI Research (Quick Estimate)

```typescript
// File: src/application/use_cases/QuickEstimateRate.ts

private async generateAIResearchedEstimate(params: {
  skills: string;
  experienceLevel: string;
  seniority: string;
  region: string;
  useGrounding: boolean;
}): Promise<EstimateResult> {
  
  // Build comprehensive prompt
  const prompt = `
    # ROLE
    You are an AI Research Agent for freelance pricing in Cambodia.

    # CRITICAL INSTRUCTION
    Research ACTUAL current costs:
    1. Software subscription prices (Adobe CC, Figma, Canva Pro)
    2. Co-working space costs (Factory PP, Mekong Space, etc.)
    3. Equipment prices with amortization
    4. Freelance rates on Upwork, Fiverr for Cambodia
    5. Cost of living in Phnom Penh

    # USER PROFILE
    Skills: ${params.skills}
    Experience: ${params.experienceLevel} (${params.seniority})
    Region: ${params.region}

    # RESPONSE FORMAT
    Return valid JSON with:
    - hourly_rate_min, hourly_rate_max, recommended_rate
    - costs (software, workspace, equipment with details)
    - income (suggested amount with reasoning)
    - market (median, 75th percentile, insights)
    - sources (array of data sources)
  `;

  // Call Gemini with or without grounding
  let responseText: string;
  let webSources: Array<{uri: string, title: string}> = [];

  if (params.useGrounding) {
    const grounded = await this.geminiService
      .generateContentWithGrounding(prompt, 0.2);
    responseText = grounded.text;
    webSources = grounded.groundingMetadata?.webSearchSources || [];
    
    console.log(`AI searched: ${grounded.groundingMetadata?.searchQueries}`);
  } else {
    responseText = await this.geminiService.generateContent(prompt);
  }

  // Parse JSON response
  const aiResult = JSON.parse(responseText);
  
  // Validate required fields
  this.validateAIResponse(aiResult);

  return {
    ...aiResult,
    sources: [
      ...webSources.map(s => `${s.title} (${s.uri})`),
      ...aiResult.sources
    ]
  };
}
```

#### 4. UREA Calculation

```typescript
// Apply UREA formula
const totalCosts = costs.software_cost 
                 + costs.workspace_cost 
                 + costs.equipment_cost 
                 + costs.utilities_cost 
                 + costs.internet_cost;

const totalRequired = totalCosts + income.suggested_income;
const ureaRate = totalRequired / income.billable_hours;

// Example:
// ($360 + $1,200) / 48 hours = $32.50/hour
```

#### 5. Market Adjustment

```typescript
// Compare with market benchmarks
const marketMedian = 9;  // From database or AI research
const marketP75 = 15;

// Adjust UREA rate to market reality
const recommendedRate = Math.min(
  ureaRate,
  marketP75 * 1.1  // Don't exceed 110% of 75th percentile
);

// Set range
const minRate = Math.max(ureaRate * 0.85, marketMedian * 0.7);
const maxRate = Math.min(ureaRate * 1.15, marketP75);

return {
  hourly_rate_min: minRate,
  hourly_rate_max: maxRate,
  recommended_rate: recommendedRate
};
```

#### 6. Seniority & Context Multipliers

```typescript
// File: src/shared/constants/index.ts

export const SENIORITY_MULTIPLIERS = {
  junior: 0.8,    // -20%
  mid: 1.0,       // baseline
  senior: 1.3,    // +30%
  expert: 1.5     // +50%
} as const;

// Applied in project rate calculation
const baseRate = 15;
const seniorityMultiplier = SENIORITY_MULTIPLIERS['senior']; // 1.3
const finalRate = baseRate * seniorityMultiplier; // 15 * 1.3 = 19.5
```

---

## Market Benchmarking

### Data Sources

1. **Database Benchmarks** (`market_benchmarks` table)
   - Pre-seeded Cambodia market data
   - Organized by category, region, seniority
   - Sample data from local agencies and platforms

2. **AI-Researched Benchmarks** (Google Search Grounding)
   - Live Upwork/Fiverr rates for Cambodia
   - Local job board salaries (Khmer24, BongThom)
   - Agency rates (Clutch, TechBehemoths)
   - Cost of living indexes

### Benchmark Table Structure

```sql
CREATE TABLE market_benchmarks (
  id SERIAL PRIMARY KEY,
  category VARCHAR(100) NOT NULL,     -- e.g., 'graphic_design'
  region VARCHAR(50) NOT NULL,        -- e.g., 'cambodia'
  seniority_level VARCHAR(20),        -- 'junior', 'mid', 'senior', 'expert'
  median_hourly_rate DECIMAL(10,2),   -- e.g., 15.00
  percentile_75_rate DECIMAL(10,2),   -- e.g., 25.00
  percentile_90_rate DECIMAL(10,2),   -- e.g., 40.00
  sample_size INTEGER,
  last_updated TIMESTAMP DEFAULT NOW()
);
```

### Example Benchmark Data

```json
{
  "category": "graphic_design",
  "region": "cambodia",
  "seniority_level": "junior",
  "median_hourly_rate": 9.00,
  "percentile_75_rate": 15.00,
  "percentile_90_rate": 25.00,
  "sample_size": 127
}
```

### Position Determination

```typescript
function determineMarketPosition(
  yourRate: number,
  median: number,
  p75: number
): string {
  if (yourRate < median * 0.8) return 'below_market';
  if (yourRate <= median * 1.1) return 'at_market';
  if (yourRate <= p75) return 'above_median';
  if (yourRate <= p75 * 1.1) return 'at_75th_percentile';
  return 'premium';
}
```

---

## Testing & Validation

### Test Suite Structure

```
backend/tests/pricing_test/
├── unit/                              # Unit tests (Jest)
│   ├── PricingCalculatorService.test.ts  # 45 tests - calculation logic
│   ├── DomainEntities.test.ts           # 39 tests - entity validation
│   └── README.md
│
├── integration/                       # Integration tests
│   ├── PricingAPI.test.ts              # Jest API endpoint tests
│   ├── integration-test.sh             # Shell-based integration tests
│   └── README.md
│
├── e2e/                               # End-to-end tests
│   ├── e2e-pricing-flow.sh             # Full user journey test
│   └── README.md
│
├── quick_estimate/                    # AI feature tests
│   ├── quick-estimate-test.sh          # A/B testing (grounding)
│   ├── compare_results.py              # Result comparison
│   └── visualize_single.py             # Single result visualization
│
├── pricing-api-test.sh                # Original API tests
├── pricing-api-test-2.sh              # Extended API tests
├── jest.config.js                     # Jest configuration
└── README.md                          # Test documentation
```

### Running Tests

```bash
# Unit Tests (84 tests, fast)
npm run test:unit

# Integration Tests (Jest)
npm run test:integration

# All Jest Tests
npm test

# With Coverage Report
npm run test:coverage

# Shell-based Tests (requires server running)
./tests/pricing_test/pricing-api-test.sh
./tests/pricing_test/e2e/e2e-pricing-flow.sh
```

### Test Coverage

| Category | Tests | Coverage |
|----------|-------|----------|
| **Unit Tests** | 84 | PricingCalculatorService, Domain Entities |
| **Integration** | 12+ | API endpoints, auth, validation |
| **E2E** | 6 phases | Full user journey |
| **AI A/B Tests** | 8 | Grounding comparison |

### Unit Test Examples

```typescript
describe('PricingCalculatorService', () => {
  it('should calculate correct base rate', () => {
    const fixedCosts = new FixedCosts(200, 100, 50, 30, 20);  // $400
    const variableCosts = new VariableCosts(50, 0, 30);       // $80
    const rate = PricingCalculatorService.calculateSustainabilityRate(
      fixedCosts, variableCosts, 1000, 0.15, 100
    );
    expect(rate).toBeCloseTo(17.02, 2);  // (400+80+1000)*1.15/100
  });

  it('should apply client context multipliers', () => {
    const context = new ClientContext(ClientType.CORPORATE, ClientRegion.GLOBAL);
    const rate = PricingCalculatorService.applyMultipliers(20, SeniorityLevel.SENIOR, context);
    expect(rate).toBeCloseTo(33.8, 2);  // 20 * 1.3 * 1.3
  });
});
```

### A/B Testing: Grounding vs No Grounding

```bash
# Run automated test
./quick-estimate-test.sh

# Test matrix:
# - 4 experience levels (beginner, intermediate, experienced, expert)
# - WITH grounding (default, ?use_grounding=true)
# - WITHOUT grounding (?use_grounding=false)
# - Saves results to JSON files

# Compare results
python3 compare_results.py

# Output:
# - Hourly rate comparison table
# - Cost estimates comparison
# - Source quality analysis
# - Statistical insights
```

### Expected Results

| Metric | With Grounding | Without Grounding |
|--------|----------------|-------------------|
| **Sources** | 30-50 URLs | 2-5 generic labels |
| **Web URLs** | ✅ YES | ❌ NO |
| **Rates** | Data-driven | Knowledge-based |
| **Details** | Specific venues/prices | General estimates |
| **Response Time** | 3-5 seconds | 2-3 seconds |

### Example Test Output

```
╔══════════════════════════════════════════════════════════════════════════╗
║     Quick Estimate Comparison: Google Search Grounding vs Knowledge     ║
╚══════════════════════════════════════════════════════════════════════════╝

  HOURLY RATE COMPARISON
  Level           With Grounding        Without       Difference     % Diff
  beginner              $15.00/hr       $12.00/hr          +$3.00    +25.0%
  intermediate          $22.00/hr       $18.00/hr          +$4.00    +22.2%
  experienced           $32.00/hr       $28.00/hr          +$4.00    +14.3%
  expert                $45.00/hr       $40.00/hr          +$5.00    +12.5%

  DATA SOURCES ANALYSIS
  Level           With Grounding    Without Grounding       Web URLs
  beginner             44 sources          3 sources          ✓ YES
  intermediate         38 sources          3 sources          ✓ YES
  experienced          42 sources          3 sources          ✓ YES
  expert               40 sources          3 sources          ✓ YES

  KEY INSIGHTS
  • Average with grounding:    $28.50/hr
  • Average without grounding: $24.50/hr
  • Difference:                +$4.00/hr (+16.3%)
  • Google Search Grounding is providing real web sources: 4/4 scenarios
```

---

## Security

### Authentication & Authorization

All pricing endpoints require JWT authentication and implement user authorization:

```typescript
// Security middleware stack applied to all pricing endpoints
router.post(
  '/calculate/base-rate',
  authMiddleware,           // Verify JWT token
  calculationLimiter,       // Rate limiting
  injectAuthenticatedUserId, // IDOR protection - inject user_id from JWT
  asyncHandler(...)
);
```

### IDOR Protection

User IDs in request bodies are **overwritten** with the authenticated user's ID from the JWT token. This prevents users from accessing other users' data:

```typescript
// Bad: user_id from request body (vulnerable)
const userId = req.body.user_id;  // ❌ Never trust client

// Good: user_id from JWT (secure)
const userId = req.user.user_id;  // ✓ From verified token
req.body.user_id = userId;        // Overwrite any client-provided value
```

### Rate Limiting

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| AI Endpoints (`/quick-estimate`) | 5 requests | 1 minute |
| Calculation Endpoints | 30 requests | 1 minute |
| Profile Endpoints | 20 requests | 1 minute |
| General Endpoints | 100 requests | 1 minute |

### Input Sanitization

AI prompts are sanitized to prevent prompt injection attacks:

```typescript
// Dangerous patterns removed from user input
const sanitized = sanitizeForAI(userInput);
// Removes: system prompts, role switching, jailbreaks, control characters
```

### Error Handling

Internal errors are logged but never exposed to users:

```typescript
// Internal: Full error details for debugging
console.error('[QuickEstimate] AI research failed:', {
  message: error.message,
  stack: error.stack
});

// External: Generic message to user
throw new Error('Unable to generate estimate. Please try again.');
```

---

## Performance Considerations

### Response Times

| Operation | Average Time | Notes |
|-----------|--------------|-------|
| Quick Estimate (with grounding) | 3-5 seconds | Includes web searches |
| Quick Estimate (without grounding) | 2-3 seconds | AI knowledge only |
| Full onboarding (per question) | 1-2 seconds | Validation only |
| Base rate calculation | <1 second | Database + math |
| Project rate calculation | <1 second | Multipliers applied |

### API Rate Limits

- **Gemini API**: 60 requests/minute per API key
- **Solution**: 3 API keys with rotation
- **Fallback**: Model rotation (gemini-2.5-flash-lite → gemini-3-flash-preview)

### Caching Strategy

```typescript
// Market benchmarks cached for 24 hours
const BENCHMARK_CACHE_TTL = 24 * 60 * 60 * 1000;

// User pricing profiles cached until updated
// No expiration - invalidate on profile update
```

---

## Error Handling

### Gemini API Failures

```typescript
try {
  const response = await geminiService.generateContentWithGrounding(prompt);
  return response;
} catch (error) {
  if (isRateLimitError(error)) {
    // Rotate to next API key/model
    rotateToNextModel();
    retry();
  } else if (error.message.includes('grounding')) {
    // Grounding not available - fallback
    return await geminiService.generateContent(prompt);
  } else {
    throw new ExternalServiceError('Gemini', error.message);
  }
}
```

### Validation Failures

```typescript
// User input validation
if (!aiResult.costs.total_expenses || aiResult.costs.total_expenses <= 0) {
  throw new Error('AI must research and provide actual cost estimates');
}

// Market data validation
if (benchmarks.length === 0) {
  console.warn('No market benchmarks found, using AI research only');
}
```

---

## Future Enhancements

### Planned Features

1. **Multi-Region Support**
   - Expand beyond Cambodia (Thailand, Vietnam, Indonesia)
   - Currency conversion
   - Regional cost-of-living adjustments

2. **Historical Tracking**
   - Rate evolution over time
   - Market trend analysis
   - Inflation adjustments

3. **Project-Based Pricing**
   - Fixed price estimation (not just hourly)
   - Package pricing (e.g., "Logo + Business Card" bundle)
   - Value-based pricing recommendations

4. **Competitor Analysis**
   - Compare rates with similar profiles
   - Anonymous benchmarking
   - Skill gap identification

5. **Real-Time Data Integration**
   - Direct API integrations (Upwork, Fiverr)
   - Numbeo API for cost of living
   - Exchange rate APIs

---

## References

### Documentation
- [Google Gemini API Docs](https://ai.google.dev/docs)
- [Google Search Grounding](https://ai.google.dev/gemini-api/docs/grounding)
- [Supabase Documentation](https://supabase.com/docs)

### Research Papers
- "Sustainable Pricing for Freelancers" - UREA Framework (2023)
- "AI-Powered Market Research" - Google Research (2024)

### Market Data Sources
- Upwork Cambodia: https://upwork.com/categories/graphic-design/asia/cambodia
- Clutch Cambodia Agencies: https://clutch.co/kh/web-design/agencies
- Living Cost Index: https://livingcostindex.com/cambodia/phnom-penh
- Cambodia Developer Salaries: Various local surveys and job boards

---

## Contact & Support

For technical questions about the calculation engine:
- GitHub Issues: [AUREA-Capstone/issues](https://github.com/...)
- Email: support@aurea-pricing.com
- Documentation: `/backend/docs/`

---

**Last Updated**: February 1, 2026  
**Version**: 1.1.0  
**Authors**: AUREA Development Team

### Changelog

#### v1.1.0 (February 1, 2026)
- Added Security section (IDOR protection, rate limiting, input sanitization)
- Expanded Testing section with Jest unit tests (84 tests)
- Added integration and E2E test documentation
- Updated Swagger docs for security middleware

#### v1.0.0 (January 30, 2026)
- Initial release
- UREA calculation engine
- Google Search Grounding integration
- Market benchmarking

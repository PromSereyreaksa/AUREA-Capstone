# AUREA Pricing Engine - Test Suite

Comprehensive test coverage for the AUREA calculation engine, including the new AI-powered portfolio rate recommendation system.

## Test Structure

```
pricing_test/
├── unit/                    # Unit tests (fast, isolated)
│   ├── PricingCalculatorService.test.ts
│   ├── PortfolioAssistedPricing.test.ts  # Updated with AI rate tests
│   ├── AcceptPortfolioRate.test.ts       # NEW: Accept rate use case
│   ├── DomainEntities.test.ts
│   ├── PricingValidator.test.ts
│   └── README.md
│
├── integration/             # Integration tests (database, API)
│   ├── PricingAPI.test.ts
│   ├── integration-test.sh
│   └── README.md
│
├── e2e/                     # End-to-end tests (full user flows)
│   ├── PortfolioAssistedPricing.test.ts  # Updated with AI & accept rate
│   ├── e2e-pricing-flow.sh
│   └── README.md
│
├── quick_estimate/          # Quick estimate feature tests
│
├── portfolio-assist-test.sh # Portfolio pricing test (updated with AI tests)
├── pricing-api-test.sh      # Original API test script
├── pricing-api-test-2.sh    # Extended API tests
├── jest.config.js           # Jest configuration
└── README.md                # This file
```

## Recent Updates (Feb 2026)

### New Features Tested:
1. **AI Rate Recommendation**: Gemini analyzes portfolio + researches Cambodia costs + applies UREA formula
2. **Structured Fields**: `experience_years`, `skills`, `hours_per_week` supplement portfolio analysis
3. **Accept Rate Endpoint**: Save AI-recommended rate to pricing profile (`POST /pricing/portfolio-assist/accept`)
4. **Rate Prioritization**: AI recommendation > market benchmark > defaults
5. **Cost Breakdown**: AI-researched costs (workspace, software, equipment, utilities, materials)

### Updated Test Files:
- ✅ `unit/PortfolioAssistedPricing.test.ts` - Added AI rate recommendation tests
- ✅ `unit/AcceptPortfolioRate.test.ts` - NEW file for accept rate use case
- ✅ `e2e/PortfolioAssistedPricing.test.ts` - Added tests for structured fields & accept endpoint
- ✅ `portfolio-assist-test.sh` - Added AI rate & accept rate test scenarios

## Running Tests

### Unit Tests (Jest)
```bash
# Install Jest if not already installed
npm install --save-dev jest ts-jest @types/jest

# Run unit tests
npm test -- --config tests/pricing_test/jest.config.js --selectProjects unit

# Run with coverage
npm test -- --config tests/pricing_test/jest.config.js --selectProjects unit --coverage
```

### Integration Tests
```bash
# Jest integration tests
npm test -- --config tests/pricing_test/jest.config.js --selectProjects integration

# Shell integration tests (requires server running)
cd tests/pricing_test/integration
./integration-test.sh
```

### E2E Tests
```bash
# Requires server running: npm run dev
cd tests/pricing_test/e2e
./e2e-pricing-flow.sh

# With verbose output
VERBOSE=true ./e2e-pricing-flow.sh
```

### All Shell-Based Tests
```bash
# Original comprehensive API tests
cd tests/pricing_test
./pricing-api-test.sh

# Extended with batch tests
MAX_BATCH_TESTS=50 ./pricing-api-test-2.sh
```

## Test Types Explained

| Type | Speed | Scope | Dependencies |
|------|-------|-------|--------------|
| **Unit** | Fast (<1s) | Single function | None (mocked) |
| **Integration** | Medium (seconds) | Multiple components | Database |
| **E2E** | Slow (minutes) | Full user journey | All services |

## Test Pyramid

```
         /\
        /  \     E2E: e2e-pricing-flow.sh
       /----\    
      /      \   Integration: pricing-api-test.sh
     /--------\  
    /          \ Unit: *.test.ts
   /______________\
```

## Coverage Goals

- **Unit Tests**: 80%+ coverage of calculation logic
- **Integration Tests**: All API endpoints tested
- **E2E Tests**: Critical user journeys covered

## New Test Scenarios (Portfolio AI Rate Recommendation)

### Unit Tests (`unit/PortfolioAssistedPricing.test.ts`)
- ✅ AI rate recommendation with structured fields (experience, skills, hours)
- ✅ Rate source prioritization (AI > benchmark > defaults)
- ✅ AI-researched costs extraction
- ✅ Graceful AI failure fallback
- ✅ Calculation breakdown validation

### Unit Tests (`unit/AcceptPortfolioRate.test.ts`)
- ✅ Profile creation with accepted rate
- ✅ Profile update with new rate
- ✅ AI-researched costs integration
- ✅ Experience estimation from rate
- ✅ Validation (rate > 0, valid seniority)

### E2E Tests (`e2e/PortfolioAssistedPricing.test.ts`)
- ✅ Structured fields validation (experience_years, skills, hours_per_week)
- ✅ AI rate recommendation response structure
- ✅ Cost breakdown in response (workspace, software, equipment, etc.)
- ✅ Accept rate endpoint (POST /portfolio-assist/accept)
- ✅ Profile creation vs update behavior

### Shell Tests (`portfolio-assist-test.sh`)
```bash
# Test 1: URL grounding
# Test 2: PDF upload
# Test 3: Text + structured fields → AI rate recommendation
# Test 4: AI rate recommendation with minimal data
# Test 5: Accept rate & save to profile
```

**Run portfolio assist tests:**
```bash
cd tests/pricing_test
./portfolio-assist-test.sh http://localhost:3000
```

**Expected output:**
- 5/5 tests passing
- AI recommended rates displayed
- Profile created/updated with accepted rate

## Adding New Tests

### Unit Test Template
```typescript
describe('MyService', () => {
  it('should do something', () => {
    const result = myFunction(input);
    expect(result).toBe(expected);
  });
});
```

### Integration Test Template
```bash
test_my_feature() {
  response=$(curl -s -X POST "$API_V1/my-endpoint" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d '{"key": "value"}')
  
  if echo "$response" | grep -q '"expected_field"'; then
    test_pass "My feature works"
  else
    test_fail "My feature" "$response"
  fi
}
```

## Environment Variables

```bash
# API URL (default: http://localhost:3000)
API_BASE_URL=http://localhost:3000

# Test configuration
MAX_BATCH_TESTS=10      # Number of batch tests
RUN_BATCH_TESTS=true    # Enable/disable batch tests
VERBOSE=false           # Verbose output
SKIP_CLEANUP=false      # Keep test data after E2E
```

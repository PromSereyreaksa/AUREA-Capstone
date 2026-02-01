# AUREA Pricing Engine - Test Suite

Comprehensive test coverage for the AUREA calculation engine.

## Test Structure

```
pricing_test/
├── unit/                    # Unit tests (fast, isolated)
│   ├── PricingCalculatorService.test.ts
│   ├── DomainEntities.test.ts
│   └── README.md
│
├── integration/             # Integration tests (database, API)
│   ├── PricingAPI.test.ts
│   ├── integration-test.sh
│   └── README.md
│
├── e2e/                     # End-to-end tests (full user flows)
│   ├── e2e-pricing-flow.sh
│   └── README.md
│
├── quick_estimate/          # Quick estimate feature tests
│
├── pricing-api-test.sh      # Original API test script
├── pricing-api-test-2.sh    # Extended API tests
├── jest.config.js           # Jest configuration
└── README.md                # This file
```

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

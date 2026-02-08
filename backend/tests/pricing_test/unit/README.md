# Unit Tests

Unit tests for AUREA pricing calculation engine.

## What's Tested

- **Domain Entities**: FixedCosts, VariableCosts, ClientContext, SeniorityLevel
- **Calculation Service**: PricingCalculatorService pure functions
- **Validators**: Input validation logic

## Running Tests

```bash
# Run all unit tests
npm test -- --testPathPattern=unit

# Run with coverage
npm test -- --testPathPattern=unit --coverage

# Run specific test file
npm test -- unit/PricingCalculatorService.test.ts
```

## Test Philosophy

- No database or network calls
- All dependencies mocked
- Fast execution (<1s per file)
- Tests pure functions in isolation

# End-to-End Tests

E2E tests for complete user journeys through the AUREA pricing system.

## What's Tested

- **Complete Onboarding Flow**: Sign up → Verify → Onboard → Calculate
- **Pricing Workflow**: Base rate → Project rate → Benchmark comparison
- **Profile Management**: Create → Read → Update → Delete
- **Multi-Client Scenarios**: Different client types and regions

## Prerequisites

- Backend server running: `npm run dev`
- Valid SMTP configuration (for OTP emails)
- Test database with seed data

## Running Tests

```bash
# Run full E2E test suite
./e2e-pricing-flow.sh

# Run with verbose output
VERBOSE=true ./e2e-pricing-flow.sh

# Skip cleanup (keep test data for debugging)
SKIP_CLEANUP=true ./e2e-pricing-flow.sh
```

## Test Scenarios

1. **New User Journey**: Complete flow from signup to first rate calculation
2. **Returning User**: Login and recalculate rates with updated costs
3. **Multi-Project**: Calculate rates for different client scenarios
4. **Edge Cases**: Invalid inputs, missing data, rate limits

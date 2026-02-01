# Integration Tests

Integration tests for AUREA pricing calculation engine.

## What's Tested

- **Repository + Database**: PricingProfileRepository, OnboardingSessionRepository
- **Use Cases + Repositories**: CalculateBaseRate, CalculateProjectRate
- **API Endpoints + Services**: Full HTTP request/response cycle

## Prerequisites

- Backend server running: `npm run dev`
- Test database configured (uses same Supabase instance)

## Running Tests

```bash
# Run all integration tests
npm test -- --testPathPattern=integration

# Run specific test file
npm test -- integration/PricingProfileRepository.test.ts

# Run shell-based integration tests
./pricing-api-test.sh
```

## Test Data Cleanup

Integration tests create real data. The test suite handles cleanup automatically,
but if tests fail mid-run, you may need to clean up manually:

```sql
DELETE FROM pricing_profiles WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE '%@test.aurea.com');
DELETE FROM users WHERE email LIKE '%@test.aurea.com';
```

# Configuration Options:

## Run with 50 test entries (default is 10)
MAX_BATCH_TESTS=50 ./pricing-api-test-2.sh

## Run with all 100 test entries
MAX_BATCH_TESTS=100 ./pricing-api-test-2.sh

## Skip batch tests entirely
RUN_BATCH_TESTS=false ./pricing-api-test-2.sh
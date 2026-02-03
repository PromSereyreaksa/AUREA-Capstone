-- Migration: Add market_benchmarks table
-- Purpose: Store Cambodia freelance market pricing data for comparison
-- Date: 2026-01-29

CREATE TABLE IF NOT EXISTS market_benchmarks (
  benchmark_id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES category(category_id) ON DELETE CASCADE,
  seniority_level VARCHAR(20) NOT NULL CHECK (seniority_level IN ('junior', 'mid', 'senior', 'expert')),
  
  -- Market rates (in USD)
  median_hourly_rate DECIMAL(10,2) NOT NULL CHECK (median_hourly_rate >= 0),
  percentile_75_rate DECIMAL(10,2) NOT NULL CHECK (percentile_75_rate >= median_hourly_rate),
  
  -- Data reliability
  sample_size INTEGER DEFAULT 0 CHECK (sample_size >= 0),
  region VARCHAR(50) DEFAULT 'cambodia' NOT NULL,
  
  -- Timestamps
  last_updated TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(category_id, seniority_level, region)
);

-- Indexes for faster queries
CREATE INDEX idx_market_benchmarks_category ON market_benchmarks(category_id);
CREATE INDEX idx_market_benchmarks_seniority ON market_benchmarks(seniority_level);
CREATE INDEX idx_market_benchmarks_region ON market_benchmarks(region);

-- Comments for documentation
COMMENT ON TABLE market_benchmarks IS 'Market pricing data for Cambodia freelance graphic design services';
COMMENT ON COLUMN market_benchmarks.median_hourly_rate IS '50th percentile (median) hourly rate in USD';
COMMENT ON COLUMN market_benchmarks.percentile_75_rate IS '75th percentile hourly rate in USD';
COMMENT ON COLUMN market_benchmarks.sample_size IS 'Number of data points used for this benchmark (reliability indicator)';

-- Seed data for market_benchmarks table
-- Purpose: Initial Cambodia freelance graphic design market rates (2026)
-- Source: TO BE CONFIRMED - Using placeholder regional averages
-- Note: These are estimated values and should be replaced with real market research data

-- First, ensure we have some basic categories in the category table
-- (Assumes category table exists with standard graphic design services)

-- Logo Design benchmarks
INSERT INTO market_benchmarks (category_id, seniority_level, median_hourly_rate, percentile_75_rate, sample_size, region, last_updated)
SELECT 
  category_id, 
  'junior', 
  8.00,    -- $8/hour median for junior logo designers
  12.00,   -- $12/hour 75th percentile
  15,      -- Sample size
  'cambodia',
  NOW()
FROM category WHERE category_name = 'Logo Design'
ON CONFLICT (category_id, seniority_level, region) DO UPDATE
SET 
  median_hourly_rate = EXCLUDED.median_hourly_rate,
  percentile_75_rate = EXCLUDED.percentile_75_rate,
  sample_size = EXCLUDED.sample_size,
  last_updated = NOW();

INSERT INTO market_benchmarks (category_id, seniority_level, median_hourly_rate, percentile_75_rate, sample_size, region, last_updated)
SELECT 
  category_id, 
  'mid', 
  15.00,   -- $15/hour median for mid-level
  20.00,   -- $20/hour 75th percentile
  20,
  'cambodia',
  NOW()
FROM category WHERE category_name = 'Logo Design'
ON CONFLICT (category_id, seniority_level, region) DO UPDATE
SET 
  median_hourly_rate = EXCLUDED.median_hourly_rate,
  percentile_75_rate = EXCLUDED.percentile_75_rate,
  sample_size = EXCLUDED.sample_size,
  last_updated = NOW();

INSERT INTO market_benchmarks (category_id, seniority_level, median_hourly_rate, percentile_75_rate, sample_size, region, last_updated)
SELECT 
  category_id, 
  'senior', 
  25.00,   -- $25/hour median for senior
  35.00,   -- $35/hour 75th percentile
  12,
  'cambodia',
  NOW()
FROM category WHERE category_name = 'Logo Design'
ON CONFLICT (category_id, seniority_level, region) DO UPDATE
SET 
  median_hourly_rate = EXCLUDED.median_hourly_rate,
  percentile_75_rate = EXCLUDED.percentile_75_rate,
  sample_size = EXCLUDED.sample_size,
  last_updated = NOW();

INSERT INTO market_benchmarks (category_id, seniority_level, median_hourly_rate, percentile_75_rate, sample_size, region, last_updated)
SELECT 
  category_id, 
  'expert', 
  40.00,   -- $40/hour median for expert
  60.00,   -- $60/hour 75th percentile
  8,
  'cambodia',
  NOW()
FROM category WHERE category_name = 'Logo Design'
ON CONFLICT (category_id, seniority_level, region) DO UPDATE
SET 
  median_hourly_rate = EXCLUDED.median_hourly_rate,
  percentile_75_rate = EXCLUDED.percentile_75_rate,
  sample_size = EXCLUDED.sample_size,
  last_updated = NOW();

-- Branding benchmarks (similar pattern)
INSERT INTO market_benchmarks (category_id, seniority_level, median_hourly_rate, percentile_75_rate, sample_size, region, last_updated)
SELECT category_id, 'junior', 10.00, 15.00, 12, 'cambodia', NOW()
FROM category WHERE category_name ILIKE '%brand%'
ON CONFLICT (category_id, seniority_level, region) DO UPDATE
SET median_hourly_rate = EXCLUDED.median_hourly_rate, percentile_75_rate = EXCLUDED.percentile_75_rate, last_updated = NOW();

INSERT INTO market_benchmarks (category_id, seniority_level, median_hourly_rate, percentile_75_rate, sample_size, region, last_updated)
SELECT category_id, 'mid', 18.00, 25.00, 15, 'cambodia', NOW()
FROM category WHERE category_name ILIKE '%brand%'
ON CONFLICT (category_id, seniority_level, region) DO UPDATE
SET median_hourly_rate = EXCLUDED.median_hourly_rate, percentile_75_rate = EXCLUDED.percentile_75_rate, last_updated = NOW();

INSERT INTO market_benchmarks (category_id, seniority_level, median_hourly_rate, percentile_75_rate, sample_size, region, last_updated)
SELECT category_id, 'senior', 30.00, 40.00, 10, 'cambodia', NOW()
FROM category WHERE category_name ILIKE '%brand%'
ON CONFLICT (category_id, seniority_level, region) DO UPDATE
SET median_hourly_rate = EXCLUDED.median_hourly_rate, percentile_75_rate = EXCLUDED.percentile_75_rate, last_updated = NOW();

INSERT INTO market_benchmarks (category_id, seniority_level, median_hourly_rate, percentile_75_rate, sample_size, region, last_updated)
SELECT category_id, 'expert', 50.00, 70.00, 6, 'cambodia', NOW()
FROM category WHERE category_name ILIKE '%brand%'
ON CONFLICT (category_id, seniority_level, region) DO UPDATE
SET median_hourly_rate = EXCLUDED.median_hourly_rate, percentile_75_rate = EXCLUDED.percentile_75_rate, last_updated = NOW();

-- Web Design benchmarks
INSERT INTO market_benchmarks (category_id, seniority_level, median_hourly_rate, percentile_75_rate, sample_size, region, last_updated)
SELECT category_id, 'junior', 12.00, 18.00, 18, 'cambodia', NOW()
FROM category WHERE category_name ILIKE '%web%' OR category_name ILIKE '%UI/UX%'
ON CONFLICT (category_id, seniority_level, region) DO UPDATE
SET median_hourly_rate = EXCLUDED.median_hourly_rate, percentile_75_rate = EXCLUDED.percentile_75_rate, last_updated = NOW();

INSERT INTO market_benchmarks (category_id, seniority_level, median_hourly_rate, percentile_75_rate, sample_size, region, last_updated)
SELECT category_id, 'mid', 22.00, 30.00, 22, 'cambodia', NOW()
FROM category WHERE category_name ILIKE '%web%' OR category_name ILIKE '%UI/UX%'
ON CONFLICT (category_id, seniority_level, region) DO UPDATE
SET median_hourly_rate = EXCLUDED.median_hourly_rate, percentile_75_rate = EXCLUDED.percentile_75_rate, last_updated = NOW();

INSERT INTO market_benchmarks (category_id, seniority_level, median_hourly_rate, percentile_75_rate, sample_size, region, last_updated)
SELECT category_id, 'senior', 35.00, 50.00, 14, 'cambodia', NOW()
FROM category WHERE category_name ILIKE '%web%' OR category_name ILIKE '%UI/UX%'
ON CONFLICT (category_id, seniority_level, region) DO UPDATE
SET median_hourly_rate = EXCLUDED.median_hourly_rate, percentile_75_rate = EXCLUDED.percentile_75_rate, last_updated = NOW();

INSERT INTO market_benchmarks (category_id, seniority_level, median_hourly_rate, percentile_75_rate, sample_size, region, last_updated)
SELECT category_id, 'expert', 55.00, 80.00, 9, 'cambodia', NOW()
FROM category WHERE category_name ILIKE '%web%' OR category_name ILIKE '%UI/UX%'
ON CONFLICT (category_id, seniority_level, region) DO UPDATE
SET median_hourly_rate = EXCLUDED.median_hourly_rate, percentile_75_rate = EXCLUDED.percentile_75_rate, last_updated = NOW();

-- Social Media Graphics benchmarks
INSERT INTO market_benchmarks (category_id, seniority_level, median_hourly_rate, percentile_75_rate, sample_size, region, last_updated)
SELECT category_id, 'junior', 7.00, 10.00, 20, 'cambodia', NOW()
FROM category WHERE category_name ILIKE '%social%'
ON CONFLICT (category_id, seniority_level, region) DO UPDATE
SET median_hourly_rate = EXCLUDED.median_hourly_rate, percentile_75_rate = EXCLUDED.percentile_75_rate, last_updated = NOW();

INSERT INTO market_benchmarks (category_id, seniority_level, median_hourly_rate, percentile_75_rate, sample_size, region, last_updated)
SELECT category_id, 'mid', 12.00, 18.00, 25, 'cambodia', NOW()
FROM category WHERE category_name ILIKE '%social%'
ON CONFLICT (category_id, seniority_level, region) DO UPDATE
SET median_hourly_rate = EXCLUDED.median_hourly_rate, percentile_75_rate = EXCLUDED.percentile_75_rate, last_updated = NOW();

INSERT INTO market_benchmarks (category_id, seniority_level, median_hourly_rate, percentile_75_rate, sample_size, region, last_updated)
SELECT category_id, 'senior', 20.00, 28.00, 15, 'cambodia', NOW()
FROM category WHERE category_name ILIKE '%social%'
ON CONFLICT (category_id, seniority_level, region) DO UPDATE
SET median_hourly_rate = EXCLUDED.median_hourly_rate, percentile_75_rate = EXCLUDED.percentile_75_rate, last_updated = NOW();

INSERT INTO market_benchmarks (category_id, seniority_level, median_hourly_rate, percentile_75_rate, sample_size, region, last_updated)
SELECT category_id, 'expert', 30.00, 45.00, 10, 'cambodia', NOW()
FROM category WHERE category_name ILIKE '%social%'
ON CONFLICT (category_id, seniority_level, region) DO UPDATE
SET median_hourly_rate = EXCLUDED.median_hourly_rate, percentile_75_rate = EXCLUDED.percentile_75_rate, last_updated = NOW();

-- Summary Comment
-- ⚠️ IMPORTANT: These rates are PLACEHOLDERS based on regional Southeast Asia averages
-- Replace with actual Cambodia market data from:
--   1. Local freelancer surveys
--   2. Bongthom.com / Khmer24.com job postings analysis
--   3. Cambodia Digital Economy reports
--   4. Freelancer community partnerships
-- 
-- Current estimates assume:
--   - Junior: 0-2 years experience
--   - Mid: 2-5 years experience
--   - Senior: 5-10 years experience
--   - Expert: 10+ years experience
--
-- Market positioning:
--   - Lower than global rates (reflects Cambodia cost of living)
--   - Competitive within Southeast Asia
--   - Room for premium positioning with international clients

SELECT 
  COUNT(*) as total_benchmarks,
  COUNT(DISTINCT category_id) as categories_covered,
  AVG(sample_size) as avg_sample_size
FROM market_benchmarks
WHERE region = 'cambodia';

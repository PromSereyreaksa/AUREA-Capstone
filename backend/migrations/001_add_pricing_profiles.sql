-- Migration: Add pricing_profiles table
-- Purpose: Store UREA onboarding data and calculated base rates
-- Date: 2026-01-29

CREATE TABLE IF NOT EXISTS pricing_profiles (
  pricing_profile_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Fixed costs (monthly, in USD)
  fixed_cost_rent DECIMAL(10,2) DEFAULT 0 NOT NULL,
  fixed_cost_equipment DECIMAL(10,2) DEFAULT 0 NOT NULL,
  fixed_cost_insurance DECIMAL(10,2) DEFAULT 0 NOT NULL,
  fixed_cost_utilities DECIMAL(10,2) DEFAULT 0 NOT NULL,
  fixed_cost_taxes DECIMAL(10,2) DEFAULT 0 NOT NULL,
  
  -- Variable costs (monthly estimate, in USD)
  variable_cost_materials DECIMAL(10,2) DEFAULT 0 NOT NULL,
  variable_cost_outsourcing DECIMAL(10,2) DEFAULT 0 NOT NULL,
  variable_cost_marketing DECIMAL(10,2) DEFAULT 0 NOT NULL,
  
  -- AUREA parameters
  desired_monthly_income DECIMAL(10,2) NOT NULL CHECK (desired_monthly_income > 0),
  billable_hours_per_month INTEGER NOT NULL CHECK (billable_hours_per_month > 0 AND billable_hours_per_month <= 744),
  profit_margin DECIMAL(5,4) NOT NULL CHECK (profit_margin >= 0 AND profit_margin <= 1),
  
  -- Experience and seniority
  experience_years INTEGER DEFAULT 0 CHECK (experience_years >= 0),
  seniority_level VARCHAR(20) CHECK (seniority_level IN ('junior', 'mid', 'senior', 'expert')),
  
  -- Calculated result
  base_hourly_rate DECIMAL(10,2),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id)
);

-- Index for faster lookups
CREATE INDEX idx_pricing_profiles_user_id ON pricing_profiles(user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pricing_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pricing_profile_timestamp
BEFORE UPDATE ON pricing_profiles
FOR EACH ROW
EXECUTE FUNCTION update_pricing_profile_timestamp();

-- Comments for documentation
COMMENT ON TABLE pricing_profiles IS 'Stores UREA pricing calculator onboarding data and calculated base rates for freelancers';
COMMENT ON COLUMN pricing_profiles.base_hourly_rate IS 'Calculated sustainable hourly rate using UREA formula';
COMMENT ON COLUMN pricing_profiles.profit_margin IS 'Desired profit margin as decimal (0.15 = 15%)';

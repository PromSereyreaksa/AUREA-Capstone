-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  AUREA CAPSTONE - COMPLETE DATABASE SCHEMA                                    ║
-- ║  Version: 2.0.0                                                               ║
-- ║  Date: February 2026                                                          ║
-- ║  Includes: Original tables + UREA pricing + Gemini extraction fields          ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- =============================================================================
-- USERS
-- =============================================================================
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  google_id VARCHAR(255) UNIQUE,
  email_verified BOOLEAN DEFAULT FALSE,
  verification_otp VARCHAR(10),
  verify_otp_expired TIMESTAMP,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  auth_provider VARCHAR(50)
);
-- Index for fast token lookup during password reset
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token) WHERE password_reset_token IS NOT NULL;

-- =============================================================================
-- BASE PRICE (Legacy - consider migrating to pricing_profiles)
-- =============================================================================
DROP TABLE IF EXISTS base_price CASCADE;
CREATE TABLE base_price (
  base_price_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  base_rate_result DECIMAL(10,2),
  profit_margin DECIMAL(5,2),
  annual_rent DECIMAL(10,2),
  equipment_cost DECIMAL(10,2),
  labor_cost DECIMAL(10,2),
  annual_salary DECIMAL(10,2),
  billable_hours INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- USER PROFILE (Extended with experience data)
-- =============================================================================
DROP TABLE IF EXISTS user_profile CASCADE;
CREATE TABLE user_profile (
  profile_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  bio TEXT,
  skills TEXT,
  location VARCHAR(255),
  profile_avatar VARCHAR(255),
  -- UREA extension fields
  experience_years INT CHECK (experience_years >= 0),
  seniority_level VARCHAR(20) CHECK (seniority_level IN ('junior', 'mid', 'senior', 'expert')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profile_seniority ON user_profile(seniority_level) WHERE seniority_level IS NOT NULL;

-- =============================================================================
-- PORTFOLIO
-- =============================================================================
DROP TABLE IF EXISTS portfolio CASCADE;
CREATE TABLE portfolio (
  portfolio_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  portfolio_url VARCHAR(255),
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- CATEGORY
-- =============================================================================
DROP TABLE IF EXISTS category CASCADE;
CREATE TABLE category (
  category_id SERIAL PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- USER CATEGORY (JOIN TABLE)
-- =============================================================================
DROP TABLE IF EXISTS user_category CASCADE;
CREATE TABLE user_category (
  portfolio_id INT NOT NULL REFERENCES portfolio(portfolio_id) ON DELETE CASCADE,
  category_id INT NOT NULL REFERENCES category(category_id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (portfolio_id, category_id)
);

-- =============================================================================
-- PROJECT PRICE (Extended with client context + calculated rate)
-- =============================================================================
DROP TABLE IF EXISTS project_price CASCADE;
CREATE TABLE project_price (
  project_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  project_name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  description TEXT,
  duration INT,
  difficulty VARCHAR(50),
  licensing VARCHAR(100),
  usage_rights VARCHAR(100),
  result TEXT,
  -- UREA extension fields
  client_type VARCHAR(50) CHECK (client_type IN ('startup', 'sme', 'corporate', 'ngo', 'government')),
  client_region VARCHAR(50) CHECK (client_region IN ('cambodia', 'southeast_asia', 'global')),
  calculated_rate DECIMAL(10,2) CHECK (calculated_rate >= 0),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_price_user ON project_price(user_id);
CREATE INDEX IF NOT EXISTS idx_project_price_client_type ON project_price(client_type) WHERE client_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_project_price_client_region ON project_price(client_region) WHERE client_region IS NOT NULL;

-- =============================================================================
-- PROJECT DELIVERABLE (Extended with items array for Gemini extraction)
-- =============================================================================
DROP TABLE IF EXISTS project_deliverable CASCADE;
CREATE TABLE project_deliverable (
  deliverable_id SERIAL PRIMARY KEY,
  project_id INT NOT NULL REFERENCES project_price(project_id) ON DELETE CASCADE,
  deliverable_type VARCHAR(100) NOT NULL,
  quantity INT NOT NULL,
  -- Gemini extraction extension: sub-items/components included in this deliverable
  -- Example: ["Primary logo", "Secondary logo", "Color palette", "Typography system"]
  items TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_deliverable_project ON project_deliverable(project_id);

-- =============================================================================
-- INVOICE
-- =============================================================================
DROP TABLE IF EXISTS invoice CASCADE;
CREATE TABLE invoice (
  invoice_id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  project_id INT NOT NULL UNIQUE REFERENCES project_price(project_id) ON DELETE CASCADE,
  client_name VARCHAR(255),
  client_email VARCHAR(255),
  client_location VARCHAR(255),
  invoice_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- PRICING PROFILES (UREA Calculator - stores onboarding data and base rates)
-- =============================================================================
DROP TABLE IF EXISTS pricing_profiles CASCADE;
CREATE TABLE pricing_profiles (
  pricing_profile_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  
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
  
  -- UREA parameters
  desired_monthly_income DECIMAL(10,2) NOT NULL CHECK (desired_monthly_income > 0),
  billable_hours_per_month INT NOT NULL CHECK (billable_hours_per_month > 0 AND billable_hours_per_month <= 744),
  profit_margin DECIMAL(5,4) NOT NULL CHECK (profit_margin >= 0 AND profit_margin <= 1),
  
  -- Experience and seniority
  experience_years INT DEFAULT 0 CHECK (experience_years >= 0),
  seniority_level VARCHAR(20) CHECK (seniority_level IN ('junior', 'mid', 'senior', 'expert')),
  
  -- Calculated result
  base_hourly_rate DECIMAL(10,2),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pricing_profiles_user_id ON pricing_profiles(user_id);

-- =============================================================================
-- MARKET BENCHMARKS (Cambodia freelance market pricing data)
-- =============================================================================
DROP TABLE IF EXISTS market_benchmarks CASCADE;
CREATE TABLE market_benchmarks (
  benchmark_id SERIAL PRIMARY KEY,
  category_id INT NOT NULL REFERENCES category(category_id) ON DELETE CASCADE,
  seniority_level VARCHAR(20) NOT NULL CHECK (seniority_level IN ('junior', 'mid', 'senior', 'expert')),
  
  -- Market rates (in USD)
  median_hourly_rate DECIMAL(10,2) NOT NULL CHECK (median_hourly_rate >= 0),
  percentile_75_rate DECIMAL(10,2) NOT NULL CHECK (percentile_75_rate >= median_hourly_rate),
  
  -- Data reliability
  sample_size INT DEFAULT 0 CHECK (sample_size >= 0),
  region VARCHAR(50) DEFAULT 'cambodia' NOT NULL,
  
  -- Timestamps
  last_updated TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(category_id, seniority_level, region)
);

CREATE INDEX IF NOT EXISTS idx_market_benchmarks_category ON market_benchmarks(category_id);
CREATE INDEX IF NOT EXISTS idx_market_benchmarks_seniority ON market_benchmarks(seniority_level);
CREATE INDEX IF NOT EXISTS idx_market_benchmarks_region ON market_benchmarks(region);

-- =============================================================================
-- ONBOARDING SESSIONS (AI-driven onboarding conversation state)
-- =============================================================================
DROP TABLE IF EXISTS onboarding_sessions CASCADE;
CREATE TABLE onboarding_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Session state
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  current_question_index INT DEFAULT 0 CHECK (current_question_index >= 0),
  
  -- Questions and answers (stored as JSONB for flexibility)
  questions JSONB NOT NULL DEFAULT '[]',
  collected_data JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  
  -- Constraints
  CHECK (
    (status = 'completed' AND completed_at IS NOT NULL) OR
    (status IN ('in_progress', 'abandoned'))
  )
);

CREATE INDEX IF NOT EXISTS idx_onboarding_user ON onboarding_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_status ON onboarding_sessions(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_started ON onboarding_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_onboarding_user_active ON onboarding_sessions(user_id, status) WHERE status = 'in_progress';

-- =============================================================================
-- TRIGGERS: Auto-update updated_at timestamps
-- =============================================================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_base_price_updated_at BEFORE UPDATE ON base_price FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_user_profile_updated_at BEFORE UPDATE ON user_profile FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_portfolio_updated_at BEFORE UPDATE ON portfolio FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_project_price_updated_at BEFORE UPDATE ON project_price FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_project_deliverable_updated_at BEFORE UPDATE ON project_deliverable FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_invoice_updated_at BEFORE UPDATE ON invoice FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_pricing_profiles_updated_at BEFORE UPDATE ON pricing_profiles FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- =============================================================================
-- COMMENTS (Documentation)
-- =============================================================================
COMMENT ON TABLE users IS 'User accounts with authentication data';
COMMENT ON TABLE user_profile IS 'Extended user profile with experience data for UREA pricing';
COMMENT ON TABLE project_price IS 'Projects with optional client context and UREA-calculated rates';
COMMENT ON TABLE project_deliverable IS 'Project deliverables with grouped items from Gemini extraction';
COMMENT ON COLUMN project_deliverable.items IS 'Array of sub-items included in this deliverable (e.g., ["Logo", "Color palette", "Typography"])';
COMMENT ON TABLE pricing_profiles IS 'UREA pricing calculator onboarding data and calculated base rates';
COMMENT ON TABLE market_benchmarks IS 'Cambodia freelance market pricing data for comparison';
COMMENT ON TABLE onboarding_sessions IS 'AI-driven pricing onboarding conversation state';

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================

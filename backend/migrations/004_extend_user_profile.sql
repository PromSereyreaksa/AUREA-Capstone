-- Migration: Extend user_profile table with experience data
-- Purpose: Add experience_years and seniority_level for UREA calculations
-- Date: 2026-01-29
-- Note: Backward compatible - all new fields are optional

ALTER TABLE user_profile 
  ADD COLUMN IF NOT EXISTS experience_years INTEGER CHECK (experience_years >= 0),
  ADD COLUMN IF NOT EXISTS seniority_level VARCHAR(20) CHECK (seniority_level IN ('junior', 'mid', 'senior', 'expert'));

-- Index for filtering by seniority
CREATE INDEX IF NOT EXISTS idx_user_profile_seniority ON user_profile(seniority_level) WHERE seniority_level IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN user_profile.experience_years IS 'Years of professional experience in graphic design (optional)';
COMMENT ON COLUMN user_profile.seniority_level IS 'Skill level: junior, mid, senior, or expert (optional, used for pricing multipliers)';

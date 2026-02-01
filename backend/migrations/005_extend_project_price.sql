-- Migration: Extend project_price table with client context and calculated rate
-- Purpose: Add client_type, client_region, and calculated_rate for UREA pricing
-- Date: 2026-01-29
-- Note: Backward compatible - all new fields are optional

ALTER TABLE project_price
  ADD COLUMN IF NOT EXISTS client_type VARCHAR(50) CHECK (client_type IN ('startup', 'sme', 'corporate', 'ngo', 'government')),
  ADD COLUMN IF NOT EXISTS client_region VARCHAR(50) CHECK (client_region IN ('cambodia', 'southeast_asia', 'global')),
  ADD COLUMN IF NOT EXISTS calculated_rate DECIMAL(10,2) CHECK (calculated_rate >= 0);

-- Indexes for analytics and filtering
CREATE INDEX IF NOT EXISTS idx_project_price_client_type ON project_price(client_type) WHERE client_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_project_price_client_region ON project_price(client_region) WHERE client_region IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN project_price.client_type IS 'Type of client organization (optional): startup, sme, corporate, ngo, government';
COMMENT ON COLUMN project_price.client_region IS 'Client geographic region (optional): cambodia, southeast_asia, global';
COMMENT ON COLUMN project_price.calculated_rate IS 'UREA-calculated hourly rate for this project (optional, in USD)';

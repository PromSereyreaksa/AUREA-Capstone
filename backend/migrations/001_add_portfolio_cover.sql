ALTER TABLE portfolio
ADD COLUMN IF NOT EXISTS portfolio_cover_url VARCHAR(500);

COMMENT ON COLUMN portfolio.portfolio_cover_url IS 'Public URL for portfolio cover image';

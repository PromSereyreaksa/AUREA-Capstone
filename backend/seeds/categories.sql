-- Seed data for category table
-- Purpose: Standard graphic design service categories for portfolio filtering
-- Run this BEFORE cambodia_market_benchmarks.sql

INSERT INTO category (category_name) VALUES
  ('Logo Design'),
  ('Branding'),
  ('UI/UX Design'),
  ('Web Design'),
  ('Illustration'),
  ('Motion Graphics'),
  ('Print Design'),
  ('Packaging Design'),
  ('Social Media Design'),
  ('Photography'),
  ('3D Design'),
  ('Icon Design'),
  ('Typography'),
  ('Advertising'),
  ('Editorial Design')
ON CONFLICT (category_name) DO NOTHING;

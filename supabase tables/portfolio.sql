-- Portfolio Structure Tables
-- Run this in Supabase SQL Editor to create the tables

-- Drop existing tables if they exist (to recreate with correct types)
DROP TABLE IF EXISTS property_portfolio_mapping CASCADE;
DROP TABLE IF EXISTS regions CASCADE;
DROP TABLE IF EXISTS portfolios CASCADE;

-- Portfolios table
CREATE TABLE portfolios (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Regions within portfolios
CREATE TABLE regions (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT REFERENCES portfolios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Property to portfolio mapping (links to AF_properties or local property IDs)
CREATE TABLE property_portfolio_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id TEXT NOT NULL UNIQUE,
  property_name TEXT,
  portfolio_id TEXT REFERENCES portfolios(id) ON DELETE SET NULL,
  region_id TEXT REFERENCES regions(id) ON DELETE SET NULL,
  address TEXT,
  city TEXT,
  state TEXT DEFAULT 'CT',
  unit_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_regions_portfolio ON regions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_property_mapping_portfolio ON property_portfolio_mapping(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_property_mapping_region ON property_portfolio_mapping(region_id);

-- Enable Row Level Security
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_portfolio_mapping ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow all for authenticated on portfolios" ON portfolios
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow read for anon on portfolios" ON portfolios
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow all for authenticated on regions" ON regions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow read for anon on regions" ON regions
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow all for authenticated on property_portfolio_mapping" ON property_portfolio_mapping
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow read for anon on property_portfolio_mapping" ON property_portfolio_mapping
  FOR SELECT TO anon USING (true);

-- Seed data
INSERT INTO portfolios (id, name, description) VALUES
('portfolio-001', 'Hartford Portfolio', 'Properties in the Greater Hartford area'),
('portfolio-002', 'New Haven Portfolio', 'Properties in the New Haven region');

INSERT INTO regions (id, portfolio_id, name, description) VALUES
('region-001', 'portfolio-001', 'Downtown Hartford', 'Central business district properties'),
('region-002', 'portfolio-001', 'West Hartford', 'Suburban residential properties'),
('region-003', 'portfolio-002', 'Downtown New Haven', 'Near Yale University');

INSERT INTO property_portfolio_mapping (property_id, property_name, portfolio_id, region_id, address, city, unit_count) VALUES
('prop-001', '90 Park Street', 'portfolio-001', 'region-001', '90 Park Street', 'Hartford', 24),
('prop-002', '101 Maple Avenue', 'portfolio-001', 'region-002', '101 Maple Avenue', 'West Hartford', 18),
('prop-003', '222 Main Street', 'portfolio-001', 'region-001', '222 Main Street', 'Hartford', 32),
('prop-004', '45 College Street', 'portfolio-002', 'region-003', '45 College Street', 'New Haven', 20),
('prop-005', '78 Chapel Street', 'portfolio-002', 'region-003', '78 Chapel Street', 'New Haven', 16);

-- View for portfolio stats (can be used for quick lookups)
CREATE OR REPLACE VIEW portfolio_stats AS
SELECT 
  p.id as portfolio_id,
  p.name as portfolio_name,
  COUNT(DISTINCT ppm.property_id) as property_count,
  COALESCE(SUM(ppm.unit_count), 0) as total_units,
  COUNT(DISTINCT r.id) as region_count
FROM portfolios p
LEFT JOIN property_portfolio_mapping ppm ON ppm.portfolio_id = p.id
LEFT JOIN regions r ON r.portfolio_id = p.id
GROUP BY p.id, p.name;

-- FIX COMPLIANCE DEPENDENCIES V5 (ROBUST SEEDING)
-- Run this entire script in Supabase SQL Editor
-- Fixes: "null value in column appfolio_property_id violates not-null constraint"

-- 1. CLEANUP: Drop dependent views first to allow table modification
DROP VIEW IF EXISTS v_property_health_with_compliance;
DROP VIEW IF EXISTS v_property_health_metrics;

-- 2. PROPERTIES TABLE SCHEMA CHECK
-- We assume the table exists based on the error, but we'll ensure our required columns are present.
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
    -- Ensure standard columns exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'code') THEN
        ALTER TABLE properties ADD COLUMN code TEXT UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'name') THEN
        ALTER TABLE properties ADD COLUMN name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'total_units') THEN
        ALTER TABLE properties ADD COLUMN total_units INT DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'address') THEN
        ALTER TABLE properties ADD COLUMN address TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'city') THEN
        ALTER TABLE properties ADD COLUMN city TEXT;
    END IF;
    
    -- Note: 'appfolio_property_id' exists in your DB with NOT NULL constraint, so we don't need to add it,
    -- but we MUST handle it in inserts.
END $$;

-- 3. BASE VIEW: v_property_health_metrics
-- Re-create with correct joins and coalesce for safety
CREATE OR REPLACE VIEW v_property_health_metrics AS
SELECT 
  p.id,
  p.code as "propertyCode",
  p.name as "propertyName",
  p.total_units as "totalUnits",
  
  -- Work order counts
  COUNT(wo.id) FILTER (WHERE wo."Status" NOT IN ('COMPLETED', 'Completed', 'DONE', 'CANCELLED')) as "openWorkOrders",
  COUNT(wo.id) FILTER (WHERE LOWER(wo."Priority") = 'emergency' AND wo."Status" NOT IN ('COMPLETED', 'Completed', 'DONE', 'CANCELLED')) as "emergencyCount",
  COUNT(wo.id) FILTER (WHERE wo."CreatedAt" < NOW() - INTERVAL '72 hours' AND wo."Status" NOT IN ('COMPLETED', 'Completed', 'DONE', 'CANCELLED')) as "stuckCount",
  COUNT(wo.id) FILTER (WHERE wo."Status" = 'overdue') as "overdueCount",
  COUNT(wo.id) FILTER (WHERE wo."Status" IN ('Ready for Review', 'READY_REVIEW')) as "readyForReviewCount",
  
  -- Performance metrics
  COALESCE(
    AVG(EXTRACT(EPOCH FROM (wo."CompletedOn" - wo."CreatedAt"))/3600) 
    FILTER (WHERE wo."Status" IN ('COMPLETED', 'Completed', 'DONE')), 
    0
  ) as "avgResolutionHours",
  
  -- Compliance placeholders
  NULL::timestamp as "nextInspectionDate",
  NULL::text as "inspectionType",
  NULL::int as "daysUntilInspection",
  
  -- Revenue impact placeholders
  0 as "monthlyMaintenanceCost",
  0 as "estimatedLiabilityAtStake",
  
  NOW() as updated_at
FROM properties p
-- READ-ONLY JOIN to AF table using the code column
LEFT JOIN "AF_work_order_new" wo ON wo."Property" LIKE '%' || COALESCE(p.code, 'UNKNOWN_CODE') || '%' 
GROUP BY p.id, p.code, p.name, p.total_units;

-- 4. COMPLIANCE TABLE
CREATE TABLE IF NOT EXISTS compliance_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id TEXT, -- Matches properties.code
  deadline_type TEXT NOT NULL DEFAULT 'section_8_annual',
  deadline_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'pending',
  units_at_risk INT DEFAULT 0,
  monthly_rent_at_risk DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ENHANCED VIEW: v_property_health_with_compliance
CREATE OR REPLACE VIEW v_property_health_with_compliance AS
SELECT 
  ph.*,
  cd.deadline_type as next_inspection_type,
  cd.deadline_date as next_inspection_date,
  (cd.deadline_date - CURRENT_DATE) as days_until_inspection,
  cd.units_at_risk,
  cd.monthly_rent_at_risk as inspection_rent_at_risk
FROM v_property_health_metrics ph
LEFT JOIN LATERAL (
  SELECT * FROM compliance_deadlines 
  WHERE property_id = ph."propertyCode" 
    AND status = 'pending'
    AND deadline_date >= CURRENT_DATE
  ORDER BY deadline_date ASC
  LIMIT 1
) cd ON true;

-- 6. PERMISSIONS & DYNAMIC SEEDING
GRANT SELECT ON v_property_health_metrics TO authenticated, service_role;
GRANT SELECT ON v_property_health_with_compliance TO authenticated, service_role;
GRANT ALL ON compliance_deadlines TO authenticated, service_role;
GRANT ALL ON properties TO authenticated, service_role;

-- Robust Seeding Block
DO $$
BEGIN
    -- Check if appfolio_property_id exists to determine insert strategy
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'appfolio_property_id') THEN
        -- Insert WITH appfolio_property_id (using code as value)
        INSERT INTO properties (code, name, total_units, address, city, appfolio_property_id)
        VALUES 
          ('S0021', '67 Park Street', 24, '67 Park Street', 'Hartford', 'S0021'),
          ('S0045', 'Riverside Apartments', 12, '123 Riverside Dr', 'East Hartford', 'S0045'),
          ('S0099', 'Maple Gardens', 36, '45 Maple Ave', 'West Hartford', 'S0099')
        ON CONFLICT (code) DO NOTHING;
    ELSE
        -- Insert WITHOUT appfolio_property_id
        INSERT INTO properties (code, name, total_units, address, city)
        VALUES 
          ('S0021', '67 Park Street', 24, '67 Park Street', 'Hartford'),
          ('S0045', 'Riverside Apartments', 12, '123 Riverside Dr', 'East Hartford'),
          ('S0099', 'Maple Gardens', 36, '45 Maple Ave', 'West Hartford')
        ON CONFLICT (code) DO NOTHING;
    END IF;
END $$;

-- Seed Data for Compliance (Always same)
INSERT INTO compliance_deadlines (property_id, deadline_type, deadline_date, status, units_at_risk, monthly_rent_at_risk)
VALUES
  ('S0021', 'section_8_annual', CURRENT_DATE + INTERVAL '12 days', 'pending', 4, 5200.00),
  ('S0045', 'cao_license', CURRENT_DATE + INTERVAL '45 days', 'pending', 12, 15000.00)
ON CONFLICT DO NOTHING;

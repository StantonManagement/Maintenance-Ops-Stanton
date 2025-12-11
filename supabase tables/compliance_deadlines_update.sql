-- Update compliance_deadlines table and create view
-- Run this in Supabase SQL Editor

-- Ensure columns exist
ALTER TABLE compliance_deadlines ADD COLUMN IF NOT EXISTS 
  property_id TEXT;
ALTER TABLE compliance_deadlines ADD COLUMN IF NOT EXISTS 
  deadline_type TEXT NOT NULL DEFAULT 'section_8_annual';
ALTER TABLE compliance_deadlines ADD COLUMN IF NOT EXISTS 
  deadline_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE compliance_deadlines ADD COLUMN IF NOT EXISTS 
  status TEXT DEFAULT 'pending';
ALTER TABLE compliance_deadlines ADD COLUMN IF NOT EXISTS 
  units_at_risk INT DEFAULT 0;
ALTER TABLE compliance_deadlines ADD COLUMN IF NOT EXISTS 
  monthly_rent_at_risk DECIMAL(10,2) DEFAULT 0;

-- Update property health view to include compliance data
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

-- Grant access
GRANT SELECT ON v_property_health_with_compliance TO authenticated;
GRANT SELECT ON v_property_health_with_compliance TO service_role;

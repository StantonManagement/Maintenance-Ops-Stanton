-- Preventive Maintenance Tables
-- Run this in Supabase SQL Editor to create the tables

-- Main schedules table
CREATE TABLE IF NOT EXISTS preventive_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  frequency_type TEXT NOT NULL CHECK (frequency_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'semi-annual', 'annual', 'seasonal')),
  frequency_value INTEGER DEFAULT 1,
  seasonal_trigger TEXT CHECK (seasonal_trigger IN ('pre-winter', 'pre-summer', 'spring', 'fall', NULL)),
  property_ids TEXT[] DEFAULT '{}',
  unit_ids TEXT[] DEFAULT '{}',
  equipment_type TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN ('hvac', 'plumbing', 'electrical', 'safety', 'compliance', 'general')),
  is_active BOOLEAN DEFAULT true,
  last_generated TIMESTAMPTZ,
  next_due DATE,
  estimated_duration_hours NUMERIC(4,2) DEFAULT 1,
  checklist_items TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link table for generated work orders
CREATE TABLE IF NOT EXISTS preventive_work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES preventive_schedules(id) ON DELETE CASCADE,
  work_order_id TEXT NOT NULL, -- References work order number
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by TEXT DEFAULT 'system'
);

-- Compliance deadlines table
CREATE TABLE IF NOT EXISTS compliance_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('section_8', 'city_code', 'fire_safety', 'elevator')),
  property_id TEXT NOT NULL,
  property_name TEXT,
  unit_id TEXT,
  unit_name TEXT,
  deadline DATE NOT NULL,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'due_soon', 'overdue', 'completed')),
  last_inspection DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_preventive_schedules_active ON preventive_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_preventive_schedules_next_due ON preventive_schedules(next_due);
CREATE INDEX IF NOT EXISTS idx_preventive_work_orders_schedule ON preventive_work_orders(schedule_id);
CREATE INDEX IF NOT EXISTS idx_compliance_deadlines_status ON compliance_deadlines(status);
CREATE INDEX IF NOT EXISTS idx_compliance_deadlines_property ON compliance_deadlines(property_id);

-- Enable Row Level Security
ALTER TABLE preventive_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE preventive_work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_deadlines ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow all for authenticated on preventive_schedules" ON preventive_schedules
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow read for anon on preventive_schedules" ON preventive_schedules
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow all for authenticated on preventive_work_orders" ON preventive_work_orders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated on compliance_deadlines" ON compliance_deadlines
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed data for preventive schedules
INSERT INTO preventive_schedules (name, description, frequency_type, frequency_value, seasonal_trigger, property_ids, equipment_type, category, is_active, next_due, estimated_duration_hours, checklist_items) VALUES
(
  'Boiler Maintenance - Pre-Winter',
  'Annual boiler inspection and maintenance before heating season',
  'annual',
  1,
  'pre-winter',
  ARRAY['prop-001', 'prop-002', 'prop-003'],
  'Boiler',
  'hvac',
  true,
  '2025-10-01',
  4,
  ARRAY['Check pilot light and ignition', 'Inspect heat exchanger', 'Test safety controls', 'Check flue and venting', 'Lubricate moving parts', 'Test thermostat operation']
),
(
  'HVAC Filter Replacement',
  'Replace HVAC filters in all units',
  'quarterly',
  3,
  NULL,
  ARRAY['prop-001', 'prop-002'],
  'HVAC',
  'hvac',
  true,
  '2024-12-01',
  0.5,
  ARRAY['Remove old filter', 'Check filter housing for debris', 'Install new filter (correct size)', 'Note filter size on unit record']
),
(
  'Fire Extinguisher Inspection',
  'Monthly fire extinguisher check and annual certification',
  'monthly',
  1,
  NULL,
  ARRAY['prop-001', 'prop-002', 'prop-003', 'prop-004'],
  'Fire Extinguisher',
  'safety',
  true,
  '2024-12-01',
  1,
  ARRAY['Check pressure gauge', 'Verify seal is intact', 'Check for physical damage', 'Ensure clear access', 'Initial and date tag']
),
(
  'Water Heater Flush',
  'Annual water heater flush to remove sediment',
  'annual',
  1,
  NULL,
  ARRAY[]::TEXT[],
  'Water Heater',
  'plumbing',
  true,
  '2025-03-15',
  1,
  ARRAY['Turn off power/gas', 'Connect hose to drain valve', 'Flush until water runs clear', 'Check anode rod condition', 'Restore power and test']
);

-- Seed data for compliance deadlines
INSERT INTO compliance_deadlines (type, property_id, property_name, unit_id, unit_name, deadline, status, last_inspection) VALUES
(
  'section_8',
  'prop-001',
  '90 Park St',
  'unit-205',
  'Unit 205',
  CURRENT_DATE + INTERVAL '15 days',
  'due_soon',
  '2023-12-15'
),
(
  'section_8',
  'prop-002',
  '101 Maple Ave',
  'unit-310',
  'Unit 310',
  CURRENT_DATE + INTERVAL '45 days',
  'upcoming',
  '2024-01-20'
),
(
  'fire_safety',
  'prop-001',
  '90 Park St',
  NULL,
  NULL,
  CURRENT_DATE - INTERVAL '5 days',
  'overdue',
  '2023-11-01'
),
(
  'elevator',
  'prop-003',
  '222 Main St',
  NULL,
  NULL,
  CURRENT_DATE + INTERVAL '60 days',
  'upcoming',
  '2024-06-01'
);

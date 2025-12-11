-- PRP 07: Portfolio & Unit Management Schema

-- 1. Unit Equipment Table
CREATE TABLE IF NOT EXISTS unit_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL, -- Links to property_units or similar table (assuming units exist or using text for now if not normalized)
  equipment_type TEXT NOT NULL, -- HVAC, Appliance, Plumbing, etc.
  make TEXT,
  model TEXT,
  serial_number TEXT,
  install_date DATE,
  warranty_expiration DATE,
  last_service_date DATE,
  status TEXT DEFAULT 'operational', -- operational, needs_service, broken
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_unit_equipment_unit ON unit_equipment(unit_id);

-- RLS
ALTER TABLE unit_equipment ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read unit_equipment" ON unit_equipment;
CREATE POLICY "Authenticated users can read unit_equipment"
  ON unit_equipment FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert unit_equipment" ON unit_equipment;
CREATE POLICY "Authenticated users can insert unit_equipment"
  ON unit_equipment FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update unit_equipment" ON unit_equipment;
CREATE POLICY "Authenticated users can update unit_equipment"
  ON unit_equipment FOR UPDATE
  TO authenticated
  USING (true);

-- 2. Inspections Table
CREATE TABLE IF NOT EXISTS inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID, -- Optional, could be property level
  property_id UUID, -- Optional
  inspection_type TEXT NOT NULL, -- Move-in, Annual, Emergency
  inspection_date DATE DEFAULT CURRENT_DATE,
  result TEXT, -- Pass, Fail, Needs Action
  notes TEXT,
  inspector_name TEXT,
  next_inspection_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_inspections_unit ON inspections(unit_id);

-- RLS
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read inspections" ON inspections;
CREATE POLICY "Authenticated users can read inspections"
  ON inspections FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert inspections" ON inspections;
CREATE POLICY "Authenticated users can insert inspections"
  ON inspections FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Seed Data for Unit Equipment (assuming a unit UUID, will use a placeholder or random one if not known)
-- For the purpose of this script, we'll just insert if empty, but we need a valid unit_id. 
-- Since we don't know the unit IDs from previous scripts easily without querying, we will rely on the app to create them or 
-- use a hardcoded ID that matches what we might use in the mock fallback if we were seeding units.
-- However, let's assuming there are no units tables effectively used yet in the frontend (UnitProfilePage uses mock fallback).

-- Let's creating a 'units' table if it doesn't exist to make this relational, or just assume unit_id is a text string in the frontend for now.
-- The existing UnitProfilePage fetches from 'units' table. Let's see if that table exists. 
-- Based on the user's `UnitProfilePage.tsx`, it tries to fetch from `units` table.
-- Let's Ensure 'units' table exists.

CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID, -- link to properties if exists
  unit_number TEXT NOT NULL,
  floor_plan TEXT,
  status TEXT DEFAULT 'occupied',
  tenant_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for units
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read units" ON units;
CREATE POLICY "Authenticated users can read units"
  ON units FOR SELECT
  TO authenticated
  USING (true);

-- Insert a sample unit so we can attach equipment to it
INSERT INTO units (id, unit_number, floor_plan, status)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '101', '2 Bed / 1 Bath', 'occupied'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', '205', '1 Bed / 1 Bath', 'vacant')
ON CONFLICT (id) DO NOTHING;

-- Seed Equipment
INSERT INTO unit_equipment (unit_id, equipment_type, make, model, status, install_date)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'HVAC', 'Carrier', 'Infinity 96', 'operational', '2020-05-15'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Refrigerator', 'Whirlpool', 'WRX735', 'operational', '2021-08-20'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Dishwasher', 'Bosch', '800 Series', 'needs_service', '2019-11-10')
ON CONFLICT DO NOTHING; -- No conflict constraint on non-pk, but good practice to avoid duplicate runs if we had unique constraints

-- Seed Inspections
INSERT INTO inspections (unit_id, inspection_type, inspection_date, result, inspector_name, notes)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Annual', '2024-01-15', 'Pass', 'Mike R.', 'Clean unit, filters changed.'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Move-Out', '2023-12-01', 'Needs Action', 'Sarah T.', 'Carpet cleaning required.')
ON CONFLICT DO NOTHING;

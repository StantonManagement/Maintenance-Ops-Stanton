-- GPS Verification Schema
-- PRP-P02-07: Verify tech location matches building on check-in/out
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. LOCATION VERIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS location_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id TEXT NOT NULL, -- References AF_work_order_new.ServiceRequestId loosely
  technician_id UUID REFERENCES technicians(id),
  verification_type TEXT CHECK (verification_type IN ('check_in', 'check_out', 'photo_upload')),
  
  -- Expected location (Property)
  expected_lat DECIMAL(10, 8),
  expected_lng DECIMAL(11, 8),
  property_code TEXT,
  
  -- Actual location (Technician)
  actual_lat DECIMAL(10, 8),
  actual_lng DECIMAL(11, 8),
  
  -- Analysis
  distance_feet INTEGER,
  within_geofence BOOLEAN,
  verified BOOLEAN,
  
  -- Manual Override
  override_reason TEXT,
  
  -- Metadata
  source TEXT, -- workyard, mobile_app, photo_metadata
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_loc_ver_wo ON location_verifications(work_order_id);
CREATE INDEX IF NOT EXISTS idx_loc_ver_tech ON location_verifications(technician_id);
CREATE INDEX IF NOT EXISTS idx_loc_ver_verified ON location_verifications(verified);

-- ============================================
-- 3. RLS POLICIES
-- ============================================
ALTER TABLE location_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated on location_verifications" ON location_verifications
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow read for anon on location_verifications" ON location_verifications
  FOR SELECT TO anon USING (true);

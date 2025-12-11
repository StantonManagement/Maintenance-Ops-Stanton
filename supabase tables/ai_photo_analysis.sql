-- AI Photo Analysis Schema
-- PRP-AI-PHOTO-COMPLETION: Verify work completion via AI
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. WORK ORDER PHOTOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS work_order_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id TEXT NOT NULL,
  photo_type TEXT CHECK (photo_type IN ('before', 'after', 'cleanup', 'other')),
  storage_url TEXT NOT NULL,
  thumbnail_url TEXT,
  
  -- Metadata
  gps_lat DECIMAL(10, 8),
  gps_lng DECIMAL(11, 8),
  captured_at TIMESTAMPTZ,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES technicians(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wo_photos_wo ON work_order_photos(work_order_id);
CREATE INDEX IF NOT EXISTS idx_wo_photos_type ON work_order_photos(photo_type);

-- ============================================
-- 2. PHOTO ANALYSIS RESULTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS photo_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id TEXT NOT NULL,
  
  -- Scores (0-100)
  overall_confidence INTEGER,
  completeness_score INTEGER,
  before_after_score INTEGER,
  cleanup_score INTEGER,
  quality_score INTEGER,
  location_score INTEGER,
  
  -- Analysis
  recommendation TEXT CHECK (recommendation IN ('APPROVE', 'REVIEW', 'REJECT')),
  issues_found JSONB DEFAULT '[]'::JSONB,
  ai_notes TEXT,
  
  -- Metadata
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photo_analysis_wo ON photo_analysis_results(work_order_id);
CREATE INDEX IF NOT EXISTS idx_photo_analysis_rec ON photo_analysis_results(recommendation);

-- ============================================
-- 3. RLS POLICIES
-- ============================================
ALTER TABLE work_order_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_analysis_results ENABLE ROW LEVEL SECURITY;

-- Policies for work_order_photos
DROP POLICY IF EXISTS "Allow all for authenticated on work_order_photos" ON work_order_photos;
CREATE POLICY "Allow all for authenticated on work_order_photos" ON work_order_photos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read for anon on work_order_photos" ON work_order_photos;
CREATE POLICY "Allow read for anon on work_order_photos" ON work_order_photos
  FOR SELECT TO anon USING (true);

-- Policies for photo_analysis_results
DROP POLICY IF EXISTS "Allow all for authenticated on photo_analysis_results" ON photo_analysis_results;
CREATE POLICY "Allow all for authenticated on photo_analysis_results" ON photo_analysis_results
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read for anon on photo_analysis_results" ON photo_analysis_results;
CREATE POLICY "Allow read for anon on photo_analysis_results" ON photo_analysis_results
  FOR SELECT TO anon USING (true);

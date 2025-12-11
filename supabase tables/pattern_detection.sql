-- AI Pattern Detection Schema
-- PRP-AI-PATTERN-DETECTION
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. PATTERN ALERTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS pattern_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type TEXT CHECK (pattern_type IN ('recurring', 'building', 'seasonal', 'cascade')),
  severity TEXT CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Context
  affected_units TEXT[], -- Array of unit numbers
  affected_building TEXT,
  related_work_orders TEXT[], -- Array of WO IDs
  
  recommended_action TEXT,
  
  -- Workflow
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'resolved', 'dismissed')),
  acknowledged_by UUID REFERENCES technicians(id),
  resolved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. PATTERN RULES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS pattern_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type TEXT NOT NULL,
  category_match TEXT, -- work order category to watch
  unit_threshold INTEGER DEFAULT 3,
  time_window_days INTEGER DEFAULT 30,
  enabled BOOLEAN DEFAULT true,
  severity TEXT DEFAULT 'warning',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pattern_alerts_status ON pattern_alerts(status);
CREATE INDEX IF NOT EXISTS idx_pattern_alerts_type ON pattern_alerts(pattern_type);

-- ============================================
-- 3. RLS POLICIES
-- ============================================
ALTER TABLE pattern_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pattern_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated on pattern_alerts" ON pattern_alerts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow read for anon on pattern_alerts" ON pattern_alerts
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow all for authenticated on pattern_rules" ON pattern_rules
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow read for anon on pattern_rules" ON pattern_rules
  FOR SELECT TO anon USING (true);

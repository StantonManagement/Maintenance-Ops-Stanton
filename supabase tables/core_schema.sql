-- Core Schema Tables
-- Run this FIRST before other SQL files
-- These are the foundational tables needed for user stories

-- Drop conflicting views/tables first
DROP TABLE IF EXISTS work_order_assignments CASCADE;
DROP VIEW IF EXISTS v_todays_schedule CASCADE;
DROP VIEW IF EXISTS v_pending_approvals CASCADE;
DROP VIEW IF EXISTS v_technician_workload CASCADE;

-- ============================================
-- 1. TECHNICIANS TABLE
-- ============================================
DROP TABLE IF EXISTS technicians CASCADE;
CREATE TABLE technicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  role TEXT DEFAULT 'technician' CHECK (role IN ('technician', 'lead', 'supervisor', 'coordinator')),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'busy', 'off_duty', 'on_leave', 'in-transit')),
  skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  certifications TEXT[] DEFAULT ARRAY[]::TEXT[],
  max_daily_workload INTEGER DEFAULT 6,
  current_load INTEGER DEFAULT 0,
  current_location TEXT,
  estimated_arrival TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_technicians_status ON technicians(status);

-- ============================================
-- 2. WORK ORDER ASSIGNMENTS TABLE
-- ============================================
DROP TABLE IF EXISTS work_order_assignments CASCADE;
CREATE TABLE work_order_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id TEXT NOT NULL, -- References AF_work_order_new.id
  technician_id UUID REFERENCES technicians(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time_start TIME,
  scheduled_time_end TIME,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'ready_for_review', 'completed', 'cancelled')),
  assigned_by TEXT NOT NULL,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  completed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignments_wo ON work_order_assignments(work_order_id);
CREATE INDEX IF NOT EXISTS idx_assignments_tech ON work_order_assignments(technician_id);
CREATE INDEX IF NOT EXISTS idx_assignments_date ON work_order_assignments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON work_order_assignments(status);

-- ============================================
-- 3. OVERRIDE HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS override_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id UUID REFERENCES technicians(id) ON DELETE SET NULL,
  override_by TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('emergency', 'turnover', 'inspection', 'other')),
  detail TEXT,
  displaced_work_orders TEXT[], -- Array of work order IDs that were affected
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_override_tech ON override_history(technician_id);
CREATE INDEX IF NOT EXISTS idx_override_date ON override_history(created_at);

-- ============================================
-- 4. AUDIT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'work_order', 'technician', 'assignment', etc.
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'created', 'updated', 'completed', 'rejected', 'override', etc.
  actor TEXT NOT NULL, -- Who performed the action
  actor_role TEXT, -- 'technician', 'coordinator', 'manager'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_logs(created_at);

-- ============================================
-- 5. MESSAGES TABLE (for work order threads)
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('coordinator', 'technician', 'tenant', 'system')),
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_wo ON messages(work_order_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(work_order_id, is_read) WHERE is_read = FALSE;

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE override_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES (permissive for dev)
-- ============================================
CREATE POLICY "Allow all for authenticated on technicians" ON technicians
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow read for anon on technicians" ON technicians
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow all for authenticated on work_order_assignments" ON work_order_assignments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow read for anon on work_order_assignments" ON work_order_assignments
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow all for authenticated on override_history" ON override_history
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated on audit_logs" ON audit_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated on messages" ON messages
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow read for anon on messages" ON messages
  FOR SELECT TO anon USING (true);

-- ============================================
-- SEED DATA: TECHNICIANS
-- ============================================
INSERT INTO technicians (id, name, phone, email, role, status, skills, max_daily_workload) VALUES
('11111111-1111-1111-1111-111111111111', 'Mike Rodriguez', '(555) 123-4567', 'mike.r@maintenance.com', 'technician', 'available', ARRAY['plumbing', 'hvac', 'electrical'], 6),
('22222222-2222-2222-2222-222222222222', 'Sarah Chen', '(555) 234-5678', 'sarah.c@maintenance.com', 'lead', 'available', ARRAY['hvac', 'appliances'], 6),
('33333333-3333-3333-3333-333333333333', 'James Wilson', '(555) 345-6789', 'james.w@maintenance.com', 'technician', 'busy', ARRAY['electrical', 'general'], 6),
('44444444-4444-4444-4444-444444444444', 'Maria Lopez', '(555) 456-7890', 'maria.l@maintenance.com', 'technician', 'available', ARRAY['plumbing', 'general'], 6)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  skills = EXCLUDED.skills,
  updated_at = NOW();

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Today's schedule view
CREATE OR REPLACE VIEW v_todays_schedule AS
SELECT 
  wa.id,
  wa.work_order_id,
  wa.scheduled_date,
  wa.scheduled_time_start,
  wa.scheduled_time_end,
  wa.status,
  t.id as technician_id,
  t.name as technician_name,
  t.status as technician_status
FROM work_order_assignments wa
JOIN technicians t ON wa.technician_id = t.id
WHERE wa.scheduled_date = CURRENT_DATE
  AND wa.status NOT IN ('completed', 'cancelled')
ORDER BY wa.scheduled_time_start;

-- Pending approvals view
CREATE OR REPLACE VIEW v_pending_approvals AS
SELECT 
  wa.id,
  wa.work_order_id,
  wa.technician_id,
  t.name as technician_name,
  wa.notes,
  wa.updated_at,
  EXTRACT(EPOCH FROM (NOW() - wa.updated_at)) / 3600 as hours_waiting
FROM work_order_assignments wa
JOIN technicians t ON wa.technician_id = t.id
WHERE wa.status = 'ready_for_review'
ORDER BY wa.updated_at ASC;

-- Technician workload view
CREATE OR REPLACE VIEW v_technician_workload AS
SELECT 
  t.id,
  t.name,
  t.max_daily_workload,
  COUNT(wa.id) as current_assignments,
  t.max_daily_workload - COUNT(wa.id) as available_slots
FROM technicians t
LEFT JOIN work_order_assignments wa ON t.id = wa.technician_id 
  AND wa.scheduled_date = CURRENT_DATE
  AND wa.status NOT IN ('completed', 'cancelled')
GROUP BY t.id, t.name, t.max_daily_workload;

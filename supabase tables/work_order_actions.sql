-- Work Order Actions Table
-- This table stores all actions taken on work orders (assignments, status changes, notes, etc.)
-- The AF_work_order_new table is READ-ONLY, so we track changes here

-- Drop existing policies first
DROP POLICY IF EXISTS "Allow all for authenticated on work_order_actions" ON work_order_actions;
DROP POLICY IF EXISTS "Allow insert for anon on work_order_actions" ON work_order_actions;
DROP POLICY IF EXISTS "Allow select for anon on work_order_actions" ON work_order_actions;

DROP TABLE IF EXISTS work_order_actions CASCADE;
CREATE TABLE work_order_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id TEXT NOT NULL, -- References AF_work_order_new.id
  action_type TEXT NOT NULL CHECK (action_type IN ('assignment', 'status_change', 'note', 'photo', 'scheduling', 'approval', 'message')),
  action_data JSONB NOT NULL DEFAULT '{}',
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'system'
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_work_order_actions_wo_id ON work_order_actions(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_actions_type ON work_order_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_work_order_actions_created ON work_order_actions(created_at);

-- Enable Row Level Security
ALTER TABLE work_order_actions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow all for authenticated on work_order_actions" ON work_order_actions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow insert for anon on work_order_actions" ON work_order_actions
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow select for anon on work_order_actions" ON work_order_actions
  FOR SELECT TO anon USING (true);

-- View to get latest action per work order (useful for current status/assignee)
CREATE OR REPLACE VIEW work_order_current_state AS
SELECT DISTINCT ON (work_order_id)
  work_order_id,
  action_type,
  action_data,
  created_at,
  created_by
FROM work_order_actions
ORDER BY work_order_id, created_at DESC;

-- View to get assignment history (renamed to avoid conflict with table)
CREATE OR REPLACE VIEW work_order_assignment_history AS
SELECT 
  work_order_id,
  action_data->>'technician_id' as technician_id,
  action_data->>'technician_name' as technician_name,
  action_data->>'assigned_at' as assigned_at,
  action_data->>'override_reason' as override_reason,
  created_by,
  created_at
FROM work_order_actions
WHERE action_type = 'assignment'
ORDER BY created_at DESC;

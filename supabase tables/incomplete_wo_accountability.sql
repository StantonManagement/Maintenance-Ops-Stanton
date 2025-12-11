-- Incomplete Work Order Accountability Schema
-- IWO-01: Database tables for morning accountability gate
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. INCOMPLETE WO EXPLANATIONS TABLE
-- Stores technician explanations for incomplete work orders
-- ============================================
CREATE TABLE IF NOT EXISTS incomplete_wo_explanations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id TEXT NOT NULL,
  assignment_id UUID REFERENCES work_order_assignments(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
  original_date DATE NOT NULL,
  
  -- Explanation details
  reason TEXT NOT NULL CHECK (reason IN (
    'parts_needed',
    'access_denied', 
    'tenant_reschedule',
    'equipment_issue',
    'time_ran_out',
    'emergency_redirect',
    'other'
  )),
  reason_detail TEXT,
  
  -- Reschedule info
  new_scheduled_date DATE,
  auto_rescheduled BOOLEAN DEFAULT FALSE,
  
  -- Escalation (for high/emergency priority)
  escalated_to_coordinator BOOLEAN DEFAULT FALSE,
  coordinator_action TEXT CHECK (coordinator_action IN ('approved', 'reassigned', 'escalated', NULL)),
  coordinator_notes TEXT,
  coordinator_actioned_at TIMESTAMPTZ,
  coordinator_actioned_by TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'escalated')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_iwo_tech ON incomplete_wo_explanations(technician_id);
CREATE INDEX IF NOT EXISTS idx_iwo_date ON incomplete_wo_explanations(original_date);
CREATE INDEX IF NOT EXISTS idx_iwo_status ON incomplete_wo_explanations(status);
CREATE INDEX IF NOT EXISTS idx_iwo_escalated ON incomplete_wo_explanations(escalated_to_coordinator) WHERE escalated_to_coordinator = TRUE;

-- ============================================
-- 2. MORNING GATE STATUS TABLE
-- Tracks whether tech has completed morning accountability
-- ============================================
CREATE TABLE IF NOT EXISTS morning_gate_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
  gate_date DATE NOT NULL,
  
  -- Status
  incomplete_count INTEGER DEFAULT 0,
  addressed_count INTEGER DEFAULT 0,
  gate_cleared BOOLEAN DEFAULT FALSE,
  cleared_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(technician_id, gate_date)
);

CREATE INDEX IF NOT EXISTS idx_morning_gate_tech ON morning_gate_status(technician_id);
CREATE INDEX IF NOT EXISTS idx_morning_gate_date ON morning_gate_status(gate_date);

-- ============================================
-- 3. COORDINATOR MORNING QUEUE TABLE
-- Queue of escalated items for coordinator review
-- ============================================
CREATE TABLE IF NOT EXISTS coordinator_morning_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  explanation_id UUID REFERENCES incomplete_wo_explanations(id) ON DELETE CASCADE,
  work_order_id TEXT NOT NULL,
  technician_id UUID REFERENCES technicians(id),
  technician_name TEXT,
  
  -- Work order info snapshot
  wo_title TEXT,
  wo_priority TEXT,
  wo_property TEXT,
  wo_unit TEXT,
  
  -- Queue status
  queue_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_coord_queue_date ON coordinator_morning_queue(queue_date);
CREATE INDEX IF NOT EXISTS idx_coord_queue_status ON coordinator_morning_queue(status);

-- ============================================
-- 4. RLS POLICIES
-- ============================================
ALTER TABLE incomplete_wo_explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE morning_gate_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE coordinator_morning_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated on incomplete_wo_explanations" ON incomplete_wo_explanations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow read for anon on incomplete_wo_explanations" ON incomplete_wo_explanations
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow all for authenticated on morning_gate_status" ON morning_gate_status
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated on coordinator_morning_queue" ON coordinator_morning_queue
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 5. FUNCTION: Get Incomplete WOs for Technician
-- Returns work orders from previous day(s) that weren't completed
-- ============================================
CREATE OR REPLACE FUNCTION get_incomplete_work_orders(p_technician_id UUID)
RETURNS TABLE (
  assignment_id UUID,
  work_order_id TEXT,
  wo_title TEXT,
  wo_priority TEXT,
  wo_property TEXT,
  wo_unit TEXT,
  scheduled_date DATE,
  days_overdue INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wa.id as assignment_id,
    wa.work_order_id,
    af."JobDescription" as wo_title,
    af."Priority" as wo_priority,
    af."Property" as wo_property,
    af."UnitName" as wo_unit,
    wa.scheduled_date,
    (CURRENT_DATE - wa.scheduled_date)::INTEGER as days_overdue
  FROM work_order_assignments wa
  LEFT JOIN "AF_work_order_new" af ON wa.work_order_id = af."ServiceRequestId"::TEXT
  WHERE wa.technician_id = p_technician_id
    AND wa.scheduled_date < CURRENT_DATE
    AND wa.status NOT IN ('completed', 'cancelled')
    AND NOT EXISTS (
      SELECT 1 FROM incomplete_wo_explanations iwe 
      WHERE iwe.assignment_id = wa.id 
      AND iwe.status IN ('resolved', 'escalated')
    )
  ORDER BY wa.scheduled_date ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. FUNCTION: Submit Incomplete WO Explanation
-- Called when tech provides reason for incomplete work
-- ============================================
CREATE OR REPLACE FUNCTION submit_incomplete_explanation(
  p_assignment_id UUID,
  p_technician_id UUID,
  p_reason TEXT,
  p_reason_detail TEXT DEFAULT NULL,
  p_new_date DATE DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  escalated BOOLEAN,
  new_explanation_id UUID
) AS $$
DECLARE
  v_assignment RECORD;
  v_wo_priority TEXT;
  v_explanation_id UUID;
  v_should_escalate BOOLEAN := FALSE;
  v_auto_reschedule BOOLEAN := FALSE;
BEGIN
  -- Get assignment details
  SELECT wa.*, af."Priority" as priority, af."JobDescription" as title,
         af."Property" as property, af."UnitName" as unit
  INTO v_assignment
  FROM work_order_assignments wa
  LEFT JOIN "AF_work_order_new" af ON wa.work_order_id = af."ServiceRequestId"::TEXT
  WHERE wa.id = p_assignment_id AND wa.technician_id = p_technician_id;
  
  IF v_assignment IS NULL THEN
    RETURN QUERY SELECT false, 'Assignment not found or not yours'::TEXT, false, NULL::UUID;
    RETURN;
  END IF;
  
  v_wo_priority := v_assignment.priority;
  
  -- Determine if should escalate (high/emergency) or auto-reschedule (normal/low)
  IF v_wo_priority IN ('High', 'Emergency', 'Urgent') THEN
    v_should_escalate := TRUE;
  ELSE
    v_auto_reschedule := TRUE;
  END IF;
  
  -- If no new date provided for auto-reschedule, default to tomorrow
  IF v_auto_reschedule AND p_new_date IS NULL THEN
    p_new_date := CURRENT_DATE + 1;
  END IF;
  
  -- Insert explanation
  INSERT INTO incomplete_wo_explanations (
    work_order_id,
    assignment_id,
    technician_id,
    original_date,
    reason,
    reason_detail,
    new_scheduled_date,
    auto_rescheduled,
    escalated_to_coordinator,
    status
  ) VALUES (
    v_assignment.work_order_id,
    p_assignment_id,
    p_technician_id,
    v_assignment.scheduled_date,
    p_reason,
    p_reason_detail,
    p_new_date,
    v_auto_reschedule,
    v_should_escalate,
    CASE WHEN v_should_escalate THEN 'escalated' ELSE 'resolved' END
  )
  RETURNING id INTO v_explanation_id;
  
  -- If auto-reschedule, update the assignment
  IF v_auto_reschedule AND p_new_date IS NOT NULL THEN
    UPDATE work_order_assignments
    SET scheduled_date = p_new_date,
        notes = COALESCE(notes, '') || E'\n[RESCHEDULED] ' || p_reason || ' - ' || COALESCE(p_reason_detail, ''),
        updated_at = NOW()
    WHERE id = p_assignment_id;
  END IF;
  
  -- If escalated, add to coordinator queue
  IF v_should_escalate THEN
    INSERT INTO coordinator_morning_queue (
      explanation_id,
      work_order_id,
      technician_id,
      technician_name,
      wo_title,
      wo_priority,
      wo_property,
      wo_unit
    )
    SELECT 
      v_explanation_id,
      v_assignment.work_order_id,
      p_technician_id,
      t.name,
      v_assignment.title,
      v_wo_priority,
      v_assignment.property,
      v_assignment.unit
    FROM technicians t WHERE t.id = p_technician_id;
  END IF;
  
  -- Update morning gate status
  UPDATE morning_gate_status
  SET addressed_count = addressed_count + 1,
      gate_cleared = (addressed_count + 1 >= incomplete_count)
  WHERE technician_id = p_technician_id AND gate_date = CURRENT_DATE;
  
  IF v_should_escalate THEN
    RETURN QUERY SELECT true, 'Escalated to coordinator for review'::TEXT, true, v_explanation_id;
  ELSE
    RETURN QUERY SELECT true, 'Rescheduled to ' || p_new_date::TEXT, false, v_explanation_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. FUNCTION: Check Morning Gate Status
-- Returns whether tech can access their schedule
-- ============================================
CREATE OR REPLACE FUNCTION check_morning_gate(p_technician_id UUID)
RETURNS TABLE (
  gate_cleared BOOLEAN,
  incomplete_count INTEGER,
  addressed_count INTEGER,
  pending_items JSON
) AS $$
DECLARE
  v_incomplete_count INTEGER;
  v_gate_record RECORD;
BEGIN
  -- Count incomplete work orders
  SELECT COUNT(*)::INTEGER INTO v_incomplete_count
  FROM work_order_assignments wa
  WHERE wa.technician_id = p_technician_id
    AND wa.scheduled_date < CURRENT_DATE
    AND wa.status NOT IN ('completed', 'cancelled')
    AND NOT EXISTS (
      SELECT 1 FROM incomplete_wo_explanations iwe 
      WHERE iwe.assignment_id = wa.id 
      AND iwe.status IN ('resolved', 'escalated')
    );
  
  -- Get or create morning gate status
  INSERT INTO morning_gate_status (technician_id, gate_date, incomplete_count)
  VALUES (p_technician_id, CURRENT_DATE, v_incomplete_count)
  ON CONFLICT (technician_id, gate_date) DO UPDATE
  SET incomplete_count = v_incomplete_count
  RETURNING * INTO v_gate_record;
  
  -- If no incomplete items, auto-clear the gate
  IF v_incomplete_count = 0 THEN
    UPDATE morning_gate_status
    SET gate_cleared = TRUE, cleared_at = NOW()
    WHERE technician_id = p_technician_id AND gate_date = CURRENT_DATE;
    
    RETURN QUERY SELECT true, 0, 0, '[]'::JSON;
    RETURN;
  END IF;
  
  -- Return gate status with pending items
  RETURN QUERY
  SELECT 
    v_gate_record.gate_cleared,
    v_gate_record.incomplete_count,
    v_gate_record.addressed_count,
    COALESCE(
      (SELECT json_agg(row_to_json(t)) FROM (
        SELECT * FROM get_incomplete_work_orders(p_technician_id)
      ) t),
      '[]'::JSON
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. FUNCTION: Coordinator Action on Escalated Item
-- ============================================
CREATE OR REPLACE FUNCTION coordinator_action_escalated(
  p_queue_id UUID,
  p_action TEXT,
  p_notes TEXT,
  p_coordinator_name TEXT,
  p_new_technician_id UUID DEFAULT NULL,
  p_new_date DATE DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_queue_item RECORD;
  v_explanation_id UUID;
BEGIN
  -- Get queue item
  SELECT * INTO v_queue_item FROM coordinator_morning_queue WHERE id = p_queue_id;
  
  IF v_queue_item IS NULL THEN
    RETURN QUERY SELECT false, 'Queue item not found'::TEXT;
    RETURN;
  END IF;
  
  v_explanation_id := v_queue_item.explanation_id;
  
  -- Update explanation with coordinator action
  UPDATE incomplete_wo_explanations
  SET coordinator_action = p_action,
      coordinator_notes = p_notes,
      coordinator_actioned_at = NOW(),
      coordinator_actioned_by = p_coordinator_name,
      status = 'resolved',
      resolved_at = NOW()
  WHERE id = v_explanation_id;
  
  -- Update queue item
  UPDATE coordinator_morning_queue
  SET status = 'actioned', reviewed_at = NOW()
  WHERE id = p_queue_id;
  
  -- Handle specific actions
  IF p_action = 'approved' AND p_new_date IS NOT NULL THEN
    -- Reschedule to new date
    UPDATE work_order_assignments
    SET scheduled_date = p_new_date,
        notes = COALESCE(notes, '') || E'\n[COORD APPROVED] ' || p_notes,
        updated_at = NOW()
    WHERE id = (SELECT assignment_id FROM incomplete_wo_explanations WHERE id = v_explanation_id);
    
  ELSIF p_action = 'reassigned' AND p_new_technician_id IS NOT NULL THEN
    -- Reassign to different technician
    UPDATE work_order_assignments
    SET technician_id = p_new_technician_id,
        scheduled_date = COALESCE(p_new_date, CURRENT_DATE),
        notes = COALESCE(notes, '') || E'\n[REASSIGNED] ' || p_notes,
        updated_at = NOW()
    WHERE id = (SELECT assignment_id FROM incomplete_wo_explanations WHERE id = v_explanation_id);
  END IF;
  
  RETURN QUERY SELECT true, 'Action completed: ' || p_action;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. VIEW: Coordinator Morning Summary
-- ============================================
CREATE OR REPLACE VIEW v_coordinator_morning_summary AS
SELECT 
  cmq.id,
  cmq.work_order_id,
  cmq.technician_id,
  cmq.technician_name,
  cmq.wo_title,
  cmq.wo_priority,
  cmq.wo_property,
  cmq.wo_unit,
  iwe.reason,
  iwe.reason_detail,
  iwe.original_date,
  cmq.status,
  cmq.created_at,
  EXTRACT(EPOCH FROM (NOW() - cmq.created_at)) / 60 as minutes_waiting
FROM coordinator_morning_queue cmq
JOIN incomplete_wo_explanations iwe ON cmq.explanation_id = iwe.id
WHERE cmq.queue_date = CURRENT_DATE
ORDER BY 
  CASE cmq.wo_priority 
    WHEN 'Emergency' THEN 1 
    WHEN 'Urgent' THEN 2
    WHEN 'High' THEN 3 
    ELSE 4 
  END,
  cmq.created_at ASC;

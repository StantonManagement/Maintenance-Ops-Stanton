-- Database Functions for Business Logic
-- Run this AFTER core_schema.sql

-- ============================================
-- 1. CHECK TECHNICIAN CAPACITY
-- ============================================
CREATE OR REPLACE FUNCTION check_technician_capacity(
  p_technician_id UUID,
  p_target_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  can_accept BOOLEAN,
  current_count INTEGER,
  max_allowed INTEGER,
  message TEXT
) AS $$
DECLARE
  v_current INTEGER;
  v_max INTEGER;
BEGIN
  -- Get technician's max workload
  SELECT max_daily_workload INTO v_max
  FROM technicians
  WHERE id = p_technician_id;

  IF v_max IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, 0, 'Technician not found'::TEXT;
    RETURN;
  END IF;

  -- Count current assignments for the date
  SELECT COUNT(*) INTO v_current
  FROM work_order_assignments
  WHERE technician_id = p_technician_id
    AND scheduled_date = p_target_date
    AND status NOT IN ('completed', 'cancelled');

  RETURN QUERY SELECT 
    v_current < v_max,
    v_current,
    v_max,
    CASE 
      WHEN v_current >= v_max THEN 'Technician at maximum capacity'
      WHEN v_current >= v_max - 1 THEN 'Technician nearly at capacity'
      ELSE 'Capacity available'
    END::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. ASSIGN WORK ORDER (with capacity check)
-- ============================================
CREATE OR REPLACE FUNCTION assign_work_order(
  p_work_order_id TEXT,
  p_technician_id UUID,
  p_scheduled_date DATE,
  p_scheduled_time_start TIME DEFAULT NULL,
  p_scheduled_time_end TIME DEFAULT NULL,
  p_assigned_by TEXT DEFAULT 'system'
)
RETURNS TABLE (
  success BOOLEAN,
  assignment_id UUID,
  message TEXT
) AS $$
DECLARE
  v_can_accept BOOLEAN;
  v_current INTEGER;
  v_max INTEGER;
  v_new_id UUID;
BEGIN
  -- Check capacity
  SELECT ca.can_accept, ca.current_count, ca.max_allowed 
  INTO v_can_accept, v_current, v_max
  FROM check_technician_capacity(p_technician_id, p_scheduled_date) ca;

  IF NOT v_can_accept THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 
      format('Technician at capacity (%s/%s). Use override if necessary.', v_current, v_max)::TEXT;
    RETURN;
  END IF;

  -- Check if already assigned
  IF EXISTS (
    SELECT 1 FROM work_order_assignments 
    WHERE work_order_id = p_work_order_id 
    AND status NOT IN ('completed', 'cancelled')
  ) THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Work order already assigned'::TEXT;
    RETURN;
  END IF;

  -- Create assignment
  INSERT INTO work_order_assignments (
    work_order_id,
    technician_id,
    scheduled_date,
    scheduled_time_start,
    scheduled_time_end,
    assigned_by,
    status
  ) VALUES (
    p_work_order_id,
    p_technician_id,
    p_scheduled_date,
    p_scheduled_time_start,
    p_scheduled_time_end,
    p_assigned_by,
    'scheduled'
  ) RETURNING id INTO v_new_id;

  -- Log to audit
  INSERT INTO audit_logs (entity_type, entity_id, action, actor, metadata)
  VALUES ('work_order', p_work_order_id, 'assigned', p_assigned_by, 
    jsonb_build_object('technician_id', p_technician_id, 'scheduled_date', p_scheduled_date));

  RETURN QUERY SELECT TRUE, v_new_id, 'Assignment created successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. MARK READY FOR REVIEW
-- ============================================
CREATE OR REPLACE FUNCTION mark_ready_for_review(
  p_work_order_id TEXT,
  p_technician_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_assignment_id UUID;
BEGIN
  -- Find the assignment
  SELECT id INTO v_assignment_id
  FROM work_order_assignments
  WHERE work_order_id = p_work_order_id
    AND technician_id = p_technician_id
    AND status IN ('scheduled', 'in_progress');

  IF v_assignment_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'No active assignment found for this technician'::TEXT;
    RETURN;
  END IF;

  -- Update status
  UPDATE work_order_assignments
  SET 
    status = 'ready_for_review',
    notes = COALESCE(notes, '') || E'\n[READY FOR REVIEW] ' || COALESCE(p_notes, ''),
    updated_at = NOW()
  WHERE id = v_assignment_id;

  -- Log to audit
  INSERT INTO audit_logs (entity_type, entity_id, action, actor, metadata)
  VALUES ('work_order', p_work_order_id, 'ready_for_review', p_technician_id::TEXT, 
    jsonb_build_object('notes', p_notes));

  RETURN QUERY SELECT TRUE, 'Marked ready for coordinator review'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. COMPLETE WORK ORDER (coordinator only)
-- ============================================
CREATE OR REPLACE FUNCTION complete_work_order(
  p_work_order_id TEXT,
  p_approved_by TEXT,
  p_approver_role TEXT,
  p_completion_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_assignment_id UUID;
BEGIN
  -- Check role (only coordinator or higher can complete)
  IF p_approver_role NOT IN ('coordinator', 'supervisor', 'manager', 'admin') THEN
    RETURN QUERY SELECT FALSE, 'Only coordinators can approve work order completion'::TEXT;
    RETURN;
  END IF;

  -- Find the assignment
  SELECT id INTO v_assignment_id
  FROM work_order_assignments
  WHERE work_order_id = p_work_order_id
    AND status = 'ready_for_review';

  IF v_assignment_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'No work order pending review found'::TEXT;
    RETURN;
  END IF;

  -- Update status
  UPDATE work_order_assignments
  SET 
    status = 'completed',
    completed_at = NOW(),
    completed_by = p_approved_by,
    notes = COALESCE(notes, '') || E'\n[COMPLETED] ' || COALESCE(p_completion_notes, ''),
    updated_at = NOW()
  WHERE id = v_assignment_id;

  -- Log to audit
  INSERT INTO audit_logs (entity_type, entity_id, action, actor, actor_role, metadata)
  VALUES ('work_order', p_work_order_id, 'completed', p_approved_by, p_approver_role,
    jsonb_build_object('notes', p_completion_notes));

  RETURN QUERY SELECT TRUE, 'Work order completed successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. RECORD OVERRIDE
-- ============================================
CREATE OR REPLACE FUNCTION record_override(
  p_technician_id UUID,
  p_override_by TEXT,
  p_reason TEXT,
  p_detail TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  displaced_count INTEGER,
  message TEXT
) AS $$
DECLARE
  v_displaced TEXT[];
  v_count INTEGER;
BEGIN
  -- Get work orders that will be displaced
  SELECT ARRAY_AGG(work_order_id), COUNT(*)
  INTO v_displaced, v_count
  FROM work_order_assignments
  WHERE technician_id = p_technician_id
    AND scheduled_date >= CURRENT_DATE
    AND status IN ('scheduled', 'in_progress');

  -- Cancel displaced assignments
  UPDATE work_order_assignments
  SET 
    status = 'cancelled',
    notes = COALESCE(notes, '') || E'\n[CANCELLED - OVERRIDE] ' || p_reason,
    updated_at = NOW()
  WHERE technician_id = p_technician_id
    AND scheduled_date >= CURRENT_DATE
    AND status IN ('scheduled', 'in_progress');

  -- Mark technician as busy
  UPDATE technicians
  SET status = 'busy', updated_at = NOW()
  WHERE id = p_technician_id;

  -- Record override
  INSERT INTO override_history (technician_id, override_by, reason, detail, displaced_work_orders)
  VALUES (p_technician_id, p_override_by, p_reason, p_detail, v_displaced);

  -- Log to audit
  INSERT INTO audit_logs (entity_type, entity_id, action, actor, metadata)
  VALUES ('technician', p_technician_id::TEXT, 'override', p_override_by,
    jsonb_build_object('reason', p_reason, 'displaced_count', v_count));

  RETURN QUERY SELECT TRUE, COALESCE(v_count, 0), 
    format('Override recorded. %s work orders need reassignment.', COALESCE(v_count, 0))::TEXT;
END;
$$ LANGUAGE plpgsql;

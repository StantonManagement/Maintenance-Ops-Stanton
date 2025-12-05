# PRP: Database Functions & Business Logic Enforcement

## Goal
Create Supabase RPC functions to enforce critical business rules at the database level, preventing client-side bypass.

## Success Criteria
- [ ] Capacity check runs server-side (not just UI)
- [ ] Work order completion requires coordinator role
- [ ] Override actions create audit log entries
- [ ] Analytics calculations performed in database

## Prerequisites
- PRP-DATABASE-SCHEMA completed (tables exist)
- Supabase project access

---

## Task 1: Capacity Enforcement Function

This prevents assigning more than 6 work orders per technician per day, regardless of how the API is called.

```sql
-- ============================================
-- CAPACITY CHECK FUNCTION
-- Returns whether a technician can accept more work
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
) 
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_count INTEGER;
  v_max_workload INTEGER;
BEGIN
  -- Get technician's max workload setting
  SELECT max_daily_workload INTO v_max_workload
  FROM technicians
  WHERE id = p_technician_id;
  
  IF v_max_workload IS NULL THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      0::INTEGER,
      0::INTEGER,
      'Technician not found'::TEXT;
    RETURN;
  END IF;
  
  -- Count assignments for the target date
  SELECT COUNT(*)::INTEGER INTO v_current_count
  FROM work_order_assignments
  WHERE technician_id = p_technician_id
    AND scheduled_date = p_target_date
    AND status NOT IN ('cancelled', 'completed');
  
  RETURN QUERY SELECT
    (v_current_count < v_max_workload)::BOOLEAN,
    v_current_count,
    v_max_workload,
    CASE 
      WHEN v_current_count < v_max_workload THEN 'Capacity available'
      ELSE 'Technician at maximum capacity for ' || p_target_date::TEXT
    END;
END;
$$;

-- ============================================
-- ASSIGN WORK ORDER WITH CAPACITY CHECK
-- Atomic operation: check + assign in one transaction
-- ============================================
CREATE OR REPLACE FUNCTION assign_work_order(
  p_work_order_id TEXT,
  p_technician_id UUID,
  p_scheduled_date DATE,
  p_scheduled_time_start TIME DEFAULT NULL,
  p_scheduled_time_end TIME DEFAULT NULL,
  p_assigned_by TEXT DEFAULT 'SYSTEM'
)
RETURNS TABLE (
  success BOOLEAN,
  assignment_id UUID,
  message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_can_accept BOOLEAN;
  v_current_count INTEGER;
  v_max_allowed INTEGER;
  v_capacity_message TEXT;
  v_new_id UUID;
BEGIN
  -- Check capacity first
  SELECT * INTO v_can_accept, v_current_count, v_max_allowed, v_capacity_message
  FROM check_technician_capacity(p_technician_id, p_scheduled_date);
  
  IF NOT v_can_accept THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, v_capacity_message;
    RETURN;
  END IF;
  
  -- Check for existing assignment
  IF EXISTS (
    SELECT 1 FROM work_order_assignments 
    WHERE work_order_id = p_work_order_id 
    AND status NOT IN ('cancelled')
  ) THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Work order already assigned'::TEXT;
    RETURN;
  END IF;
  
  -- Create assignment
  INSERT INTO work_order_assignments (
    work_order_id,
    technician_id,
    assigned_by,
    scheduled_date,
    scheduled_time_start,
    scheduled_time_end,
    status
  ) VALUES (
    p_work_order_id,
    p_technician_id,
    p_assigned_by,
    p_scheduled_date,
    p_scheduled_time_start,
    p_scheduled_time_end,
    'assigned'
  )
  RETURNING id INTO v_new_id;
  
  -- Log to audit
  INSERT INTO audit_logs (entity_type, entity_id, action, actor, new_value)
  VALUES (
    'work_order_assignment',
    v_new_id::TEXT,
    'created',
    p_assigned_by,
    jsonb_build_object(
      'work_order_id', p_work_order_id,
      'technician_id', p_technician_id,
      'scheduled_date', p_scheduled_date
    )
  );
  
  RETURN QUERY SELECT TRUE, v_new_id, 'Assignment created successfully'::TEXT;
END;
$$;
```

---

## Task 2: Work Order Completion Function

Only allows completion through proper coordinator approval flow.

```sql
-- ============================================
-- COMPLETE WORK ORDER (Coordinator Only)
-- Enforces the "technicians can't close" rule
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
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Enforce coordinator-only completion
  IF p_approver_role NOT IN ('coordinator', 'manager', 'admin') THEN
    -- Log the attempt
    INSERT INTO audit_logs (entity_type, entity_id, action, actor, metadata)
    VALUES (
      'work_order',
      p_work_order_id,
      'completion_denied',
      p_approved_by,
      jsonb_build_object('reason', 'insufficient_role', 'attempted_role', p_approver_role)
    );
    
    RETURN QUERY SELECT FALSE, 'Only coordinators can complete work orders'::TEXT;
    RETURN;
  END IF;
  
  -- Check assignment exists and is in ready_review status
  IF NOT EXISTS (
    SELECT 1 FROM work_order_assignments
    WHERE work_order_id = p_work_order_id
    AND status = 'in_progress'
  ) THEN
    RETURN QUERY SELECT FALSE, 'Work order not found or not ready for completion'::TEXT;
    RETURN;
  END IF;
  
  -- Update assignment status
  UPDATE work_order_assignments
  SET status = 'completed',
      notes = COALESCE(notes || E'\n', '') || 'Approved by ' || p_approved_by || ': ' || COALESCE(p_completion_notes, 'Approved'),
      updated_at = NOW()
  WHERE work_order_id = p_work_order_id
  AND status = 'in_progress';
  
  -- Log completion
  INSERT INTO audit_logs (entity_type, entity_id, action, actor, metadata)
  VALUES (
    'work_order',
    p_work_order_id,
    'completed',
    p_approved_by,
    jsonb_build_object('approver_role', p_approver_role, 'notes', p_completion_notes)
  );
  
  RETURN QUERY SELECT TRUE, 'Work order completed successfully'::TEXT;
END;
$$;

-- ============================================
-- MARK READY FOR REVIEW (Technician Action)
-- This is what technicians CAN do
-- ============================================
CREATE OR REPLACE FUNCTION mark_ready_for_review(
  p_work_order_id TEXT,
  p_technician_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verify technician is assigned to this work order
  IF NOT EXISTS (
    SELECT 1 FROM work_order_assignments
    WHERE work_order_id = p_work_order_id
    AND technician_id = p_technician_id
    AND status = 'in_progress'
  ) THEN
    RETURN QUERY SELECT FALSE, 'Not authorized or work order not in progress'::TEXT;
    RETURN;
  END IF;
  
  -- Note: We're NOT changing status to 'completed'
  -- We're changing to a review state (still 'in_progress' but flagged)
  UPDATE work_order_assignments
  SET notes = COALESCE(notes || E'\n', '') || '[READY FOR REVIEW] ' || COALESCE(p_notes, ''),
      updated_at = NOW()
  WHERE work_order_id = p_work_order_id
  AND technician_id = p_technician_id;
  
  -- Log the action
  INSERT INTO audit_logs (entity_type, entity_id, action, actor, metadata)
  VALUES (
    'work_order',
    p_work_order_id,
    'marked_ready_review',
    p_technician_id::TEXT,
    jsonb_build_object('notes', p_notes)
  );
  
  RETURN QUERY SELECT TRUE, 'Work order marked ready for coordinator review'::TEXT;
END;
$$;
```

---

## Task 3: Override Tracking Function

```sql
-- ============================================
-- RECORD EMERGENCY OVERRIDE
-- When manager pulls technician from scheduled work
-- ============================================
CREATE OR REPLACE FUNCTION record_override(
  p_technician_id UUID,
  p_override_by TEXT,
  p_reason TEXT,
  p_reason_detail TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  override_id UUID,
  displaced_count INTEGER,
  message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_override_id UUID;
  v_displaced_orders TEXT[];
  v_displaced_count INTEGER;
BEGIN
  -- Find work orders that will be displaced (today's scheduled, not completed)
  SELECT ARRAY_AGG(work_order_id), COUNT(*)::INTEGER
  INTO v_displaced_orders, v_displaced_count
  FROM work_order_assignments
  WHERE technician_id = p_technician_id
    AND scheduled_date = CURRENT_DATE
    AND status IN ('assigned', 'accepted', 'in_progress');
  
  -- Create override record
  INSERT INTO override_history (
    technician_id,
    override_by,
    override_reason,
    override_reason_detail,
    displaced_work_orders
  ) VALUES (
    p_technician_id,
    p_override_by,
    p_reason,
    p_reason_detail,
    v_displaced_orders
  )
  RETURNING id INTO v_override_id;
  
  -- Update technician status
  UPDATE technicians
  SET status = 'busy'
  WHERE id = p_technician_id;
  
  -- Mark displaced work orders for reassignment
  UPDATE work_order_assignments
  SET status = 'cancelled',
      notes = COALESCE(notes || E'\n', '') || 'Displaced by override: ' || p_reason || ' (' || p_override_by || ')'
  WHERE technician_id = p_technician_id
    AND scheduled_date = CURRENT_DATE
    AND status IN ('assigned', 'accepted');
  
  -- Log to audit
  INSERT INTO audit_logs (entity_type, entity_id, action, actor, metadata)
  VALUES (
    'override',
    v_override_id::TEXT,
    'created',
    p_override_by,
    jsonb_build_object(
      'technician_id', p_technician_id,
      'reason', p_reason,
      'displaced_count', v_displaced_count,
      'displaced_orders', v_displaced_orders
    )
  );
  
  RETURN QUERY SELECT 
    TRUE,
    v_override_id,
    v_displaced_count,
    'Override recorded. ' || v_displaced_count || ' work orders displaced.'::TEXT;
END;
$$;
```

---

## Task 4: Analytics Aggregation Functions

```sql
-- ============================================
-- GET DASHBOARD METRICS
-- Server-side aggregation for analytics
-- ============================================
CREATE OR REPLACE FUNCTION get_dashboard_metrics(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_work_orders BIGINT,
  completed_work_orders BIGINT,
  completion_rate NUMERIC,
  avg_completion_days NUMERIC,
  emergency_count BIGINT,
  pending_approval BIGINT,
  first_time_fix_rate NUMERIC,
  override_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH wo_stats AS (
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'completed') as completed,
      COUNT(*) FILTER (WHERE status = 'in_progress' AND notes LIKE '%READY FOR REVIEW%') as pending
    FROM work_order_assignments
    WHERE created_at BETWEEN p_start_date AND p_end_date
  ),
  override_stats AS (
    SELECT COUNT(*) as overrides
    FROM override_history
    WHERE created_at BETWEEN p_start_date AND p_end_date
  )
  SELECT
    wo_stats.total,
    wo_stats.completed,
    CASE WHEN wo_stats.total > 0 
      THEN ROUND((wo_stats.completed::NUMERIC / wo_stats.total) * 100, 1)
      ELSE 0 
    END,
    0::NUMERIC, -- Placeholder for avg completion days
    0::BIGINT,  -- Placeholder for emergency count (would need AF table join)
    wo_stats.pending,
    85.0::NUMERIC, -- Placeholder until we track rework
    override_stats.overrides
  FROM wo_stats, override_stats;
END;
$$;

-- ============================================
-- GET TECHNICIAN PERFORMANCE
-- Per-tech metrics
-- ============================================
CREATE OR REPLACE FUNCTION get_technician_performance(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  technician_id UUID,
  technician_name TEXT,
  total_assigned BIGINT,
  total_completed BIGINT,
  completion_rate NUMERIC,
  avg_per_day NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    COUNT(wa.id) as total_assigned,
    COUNT(wa.id) FILTER (WHERE wa.status = 'completed') as total_completed,
    CASE WHEN COUNT(wa.id) > 0
      THEN ROUND((COUNT(wa.id) FILTER (WHERE wa.status = 'completed')::NUMERIC / COUNT(wa.id)) * 100, 1)
      ELSE 0
    END as completion_rate,
    ROUND(COUNT(wa.id)::NUMERIC / GREATEST((p_end_date - p_start_date), 1), 1) as avg_per_day
  FROM technicians t
  LEFT JOIN work_order_assignments wa ON t.id = wa.technician_id
    AND wa.created_at BETWEEN p_start_date AND p_end_date
  GROUP BY t.id, t.name
  ORDER BY total_completed DESC;
END;
$$;
```

---

## Task 5: Helper Views

```sql
-- ============================================
-- VIEW: Today's Schedule by Technician
-- ============================================
CREATE OR REPLACE VIEW v_todays_schedule AS
SELECT 
  t.id as technician_id,
  t.name as technician_name,
  t.status as technician_status,
  t.max_daily_workload,
  COUNT(wa.id) as assigned_today,
  (t.max_daily_workload - COUNT(wa.id)) as remaining_capacity,
  ARRAY_AGG(wa.work_order_id) FILTER (WHERE wa.id IS NOT NULL) as work_order_ids
FROM technicians t
LEFT JOIN work_order_assignments wa ON t.id = wa.technician_id
  AND wa.scheduled_date = CURRENT_DATE
  AND wa.status NOT IN ('cancelled', 'completed')
GROUP BY t.id, t.name, t.status, t.max_daily_workload;

-- ============================================
-- VIEW: Pending Approvals (Ready for Review)
-- ============================================
CREATE OR REPLACE VIEW v_pending_approvals AS
SELECT 
  wa.work_order_id,
  wa.technician_id,
  t.name as technician_name,
  wa.scheduled_date,
  wa.notes,
  wa.updated_at as marked_ready_at,
  EXTRACT(EPOCH FROM (NOW() - wa.updated_at))/3600 as hours_waiting
FROM work_order_assignments wa
JOIN technicians t ON wa.technician_id = t.id
WHERE wa.status = 'in_progress'
  AND wa.notes LIKE '%READY FOR REVIEW%'
ORDER BY wa.updated_at ASC;

-- ============================================
-- VIEW: Override History with Details
-- ============================================
CREATE OR REPLACE VIEW v_override_details AS
SELECT 
  oh.id,
  oh.created_at,
  oh.override_by,
  oh.override_reason,
  oh.override_reason_detail,
  t.name as technician_name,
  CARDINALITY(oh.displaced_work_orders) as displaced_count,
  oh.displaced_work_orders,
  oh.acknowledged_by,
  oh.acknowledged_at
FROM override_history oh
JOIN technicians t ON oh.technician_id = t.id
ORDER BY oh.created_at DESC;
```

---

## Validation Checkpoint

```sql
-- Test capacity check
SELECT * FROM check_technician_capacity('11111111-1111-1111-1111-111111111111');

-- Test assignment (should succeed if capacity available)
SELECT * FROM assign_work_order(
  'TEST-001',
  '11111111-1111-1111-1111-111111111111',
  CURRENT_DATE,
  '09:00'::TIME,
  '11:00'::TIME,
  'TEST_COORDINATOR'
);

-- Verify views work
SELECT * FROM v_todays_schedule;
SELECT * FROM v_pending_approvals;

-- Check audit log captured the test
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5;
```

---

## Frontend Integration Notes

After running this PRP, update your hooks:

```typescript
// useCapacityCheck.ts - Replace client-side logic with RPC call
const { data } = await supabase.rpc('check_technician_capacity', {
  p_technician_id: technicianId,
  p_target_date: date
});

// useAssignWorkOrder.ts - Use atomic assignment function
const { data } = await supabase.rpc('assign_work_order', {
  p_work_order_id: workOrderId,
  p_technician_id: technicianId,
  p_scheduled_date: date,
  p_assigned_by: currentUser.name
});
```

---

## Anti-Patterns to Avoid
- ❌ Don't bypass these functions by direct INSERT/UPDATE
- ❌ Don't trust client-side role checks for completion
- ❌ Don't skip audit logging for important actions
- ❌ Don't call RPC functions without error handling

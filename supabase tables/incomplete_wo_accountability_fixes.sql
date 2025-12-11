-- Incomplete WO Accountability - FIXES ONLY
-- Run this to apply the data flow fixes without recreating tables

-- ============================================
-- FIX 1: Update check_morning_gate with null safety
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
  
  -- Return gate status with pending items (with null safety)
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
-- FIX 2: Update view to include technician_id
-- Must DROP first because column order changed
-- ============================================
DROP VIEW IF EXISTS v_coordinator_morning_summary;
CREATE VIEW v_coordinator_morning_summary AS
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
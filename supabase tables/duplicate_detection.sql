-- Duplicate Detection Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. DUPLICATE CANDIDATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS duplicate_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_wo_id TEXT NOT NULL,
  duplicate_wo_id TEXT NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  detection_reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'auto_merged')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(primary_wo_id, duplicate_wo_id)
);

CREATE INDEX IF NOT EXISTS idx_duplicate_status ON duplicate_candidates(status);
CREATE INDEX IF NOT EXISTS idx_duplicate_primary ON duplicate_candidates(primary_wo_id);
CREATE INDEX IF NOT EXISTS idx_duplicate_duplicate ON duplicate_candidates(duplicate_wo_id);

-- ============================================
-- 2. WORK ORDER MERGE HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS work_order_merge_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_wo_id TEXT NOT NULL,
  merged_wo_id TEXT NOT NULL,
  merged_description TEXT,
  merged_photos JSONB DEFAULT '[]',
  merged_at TIMESTAMPTZ DEFAULT NOW(),
  merged_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_merge_primary ON work_order_merge_history(primary_wo_id);
CREATE INDEX IF NOT EXISTS idx_merge_merged ON work_order_merge_history(merged_wo_id);

-- ============================================
-- 3. RLS POLICIES
-- ============================================
ALTER TABLE duplicate_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_merge_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated on duplicate_candidates" ON duplicate_candidates
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow read for anon on duplicate_candidates" ON duplicate_candidates
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow all for authenticated on work_order_merge_history" ON work_order_merge_history
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow read for anon on work_order_merge_history" ON work_order_merge_history
  FOR SELECT TO anon USING (true);

-- ============================================
-- 4. DUPLICATE DETECTION FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION detect_duplicate_work_order(p_new_wo_id TEXT)
RETURNS TABLE (
  duplicate_found BOOLEAN,
  candidate_id UUID,
  primary_wo_id TEXT,
  confidence DECIMAL(3,2),
  reason TEXT
) AS $$
DECLARE
  v_new_wo RECORD;
  v_existing_wo RECORD;
  v_confidence DECIMAL(3,2);
  v_reason TEXT;
  v_candidate_id UUID;
BEGIN
  -- Get the new work order details
  SELECT * INTO v_new_wo 
  FROM "AF_work_order_new" 
  WHERE "ServiceRequestId"::TEXT = p_new_wo_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, 0.0::DECIMAL(3,2), 'Work order not found'::TEXT;
    RETURN;
  END IF;
  
  -- Look for potential duplicates (same unit, within 48 hours, open status)
  FOR v_existing_wo IN
    SELECT * FROM "AF_work_order_new"
    WHERE "ServiceRequestId"::TEXT != p_new_wo_id
      AND "UnitName" = v_new_wo."UnitName"
      AND "Property" = v_new_wo."Property"
      AND "Status" NOT IN ('COMPLETED', 'Cancelled', 'merged')
      AND "CreatedAt" >= (v_new_wo."CreatedAt"::timestamp - interval '48 hours')
      AND "CreatedAt" < v_new_wo."CreatedAt"::timestamp
  LOOP
    -- Calculate confidence score
    v_confidence := 0.60; -- Base score for same unit within 48 hours
    v_reason := 'Same unit (' || v_new_wo."UnitName" || ')';
    
    -- Boost if same day
    IF DATE(v_existing_wo."CreatedAt") = DATE(v_new_wo."CreatedAt") THEN
      v_confidence := v_confidence + 0.20;
      v_reason := v_reason || ', same day';
    END IF;
    
    -- Boost if similar description (basic check - contains same words)
    IF v_new_wo."JobDescription" ILIKE '%' || split_part(v_existing_wo."JobDescription", ' ', 1) || '%' THEN
      v_confidence := v_confidence + 0.15;
      v_reason := v_reason || ', similar description';
    END IF;
    
    -- Cap at 0.99
    IF v_confidence > 0.99 THEN
      v_confidence := 0.99;
    END IF;
    
    -- Only flag if confidence > 0.60
    IF v_confidence > 0.60 THEN
      -- Insert into duplicate_candidates
      INSERT INTO duplicate_candidates (primary_wo_id, duplicate_wo_id, confidence_score, detection_reason)
      VALUES (v_existing_wo."ServiceRequestId"::TEXT, p_new_wo_id, v_confidence, v_reason)
      ON CONFLICT (primary_wo_id, duplicate_wo_id) DO NOTHING
      RETURNING id INTO v_candidate_id;
      
      RETURN QUERY SELECT true, v_candidate_id, v_existing_wo."ServiceRequestId"::TEXT, v_confidence, v_reason;
      RETURN;
    END IF;
  END LOOP;
  
  -- No duplicate found
  RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, 0.0::DECIMAL(3,2), 'No duplicates detected'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. MERGE WORK ORDERS FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION merge_work_orders(
  p_primary_id TEXT,
  p_duplicate_id TEXT,
  p_merged_by TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_primary RECORD;
  v_duplicate RECORD;
BEGIN
  -- Get both work orders
  SELECT * INTO v_primary FROM "AF_work_order_new" WHERE "ServiceRequestId"::TEXT = p_primary_id;
  SELECT * INTO v_duplicate FROM "AF_work_order_new" WHERE "ServiceRequestId"::TEXT = p_duplicate_id;
  
  IF v_primary IS NULL THEN
    RETURN QUERY SELECT false, 'Primary work order not found'::TEXT;
    RETURN;
  END IF;
  
  IF v_duplicate IS NULL THEN
    RETURN QUERY SELECT false, 'Duplicate work order not found'::TEXT;
    RETURN;
  END IF;
  
  -- Record the merge
  INSERT INTO work_order_merge_history (primary_wo_id, merged_wo_id, merged_description, merged_by)
  VALUES (p_primary_id, p_duplicate_id, v_duplicate."JobDescription", p_merged_by);
  
  -- Update duplicate_candidates status
  UPDATE duplicate_candidates
  SET status = 'approved', reviewed_by = p_merged_by, reviewed_at = NOW()
  WHERE (primary_wo_id = p_primary_id AND duplicate_wo_id = p_duplicate_id)
     OR (primary_wo_id = p_duplicate_id AND duplicate_wo_id = p_primary_id);
  
  -- Note: We don't modify AF_work_order_new as it's read-only from AppFolio
  -- The merge is tracked in our local tables
  
  RETURN QUERY SELECT true, 'Work orders merged successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. DISMISS DUPLICATE FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION dismiss_duplicate(
  p_candidate_id UUID,
  p_dismissed_by TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
BEGIN
  UPDATE duplicate_candidates
  SET status = 'rejected', reviewed_by = p_dismissed_by, reviewed_at = NOW()
  WHERE id = p_candidate_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Candidate not found'::TEXT;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT true, 'Duplicate dismissed'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. VIEW: PENDING DUPLICATES WITH DETAILS
-- ============================================
CREATE OR REPLACE VIEW v_pending_duplicates AS
SELECT 
  dc.id,
  dc.primary_wo_id,
  dc.duplicate_wo_id,
  dc.confidence_score,
  dc.detection_reason,
  dc.created_at,
  EXTRACT(EPOCH FROM (NOW() - dc.created_at)) / 3600 as hours_pending,
  p."JobDescription" as primary_description,
  p."UnitName" as primary_unit,
  p."Property" as primary_property,
  p."CreatedAt" as primary_created,
  p."Status" as primary_status,
  d."JobDescription" as duplicate_description,
  d."UnitName" as duplicate_unit,
  d."CreatedAt" as duplicate_created,
  d."Status" as duplicate_status
FROM duplicate_candidates dc
LEFT JOIN "AF_work_order_new" p ON dc.primary_wo_id = p."ServiceRequestId"::TEXT
LEFT JOIN "AF_work_order_new" d ON dc.duplicate_wo_id = d."ServiceRequestId"::TEXT
WHERE dc.status = 'pending'
ORDER BY dc.confidence_score DESC, dc.created_at ASC;

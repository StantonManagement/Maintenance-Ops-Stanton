-- AI Duplicate Analysis Columns
-- Run this in Supabase SQL Editor to add AI analysis fields

-- Add AI analysis columns to duplicate_candidates
ALTER TABLE duplicate_candidates
ADD COLUMN IF NOT EXISTS ai_recommendation TEXT CHECK (ai_recommendation IN ('MERGE', 'NOT_DUPLICATE', 'NEEDS_REVIEW')),
ADD COLUMN IF NOT EXISTS ai_confidence INTEGER CHECK (ai_confidence >= 0 AND ai_confidence <= 100),
ADD COLUMN IF NOT EXISTS ai_reasoning TEXT,
ADD COLUMN IF NOT EXISTS ai_key_differences TEXT,
ADD COLUMN IF NOT EXISTS ai_merge_note TEXT,
ADD COLUMN IF NOT EXISTS ai_analyzed_at TIMESTAMPTZ;

-- Index for finding unanalyzed candidates
CREATE INDEX IF NOT EXISTS idx_duplicate_ai_pending 
ON duplicate_candidates(status) 
WHERE ai_analyzed_at IS NULL AND status = 'pending';

-- Update the view to include AI fields
DROP VIEW IF EXISTS v_pending_duplicates;
CREATE VIEW v_pending_duplicates AS
SELECT 
  dc.id,
  dc.primary_wo_id,
  dc.duplicate_wo_id,
  dc.confidence_score,
  dc.detection_reason,
  dc.created_at,
  dc.ai_recommendation,
  dc.ai_confidence,
  dc.ai_reasoning,
  dc.ai_key_differences,
  dc.ai_merge_note,
  dc.ai_analyzed_at,
  EXTRACT(EPOCH FROM (NOW() - dc.created_at)) / 3600 as hours_pending,
  p."JobDescription" as primary_description,
  p."UnitName" as primary_unit,
  p."Property" as primary_property,
  p."CreatedAt" as primary_created,
  p."Status" as primary_status,
  p."Priority" as primary_priority,
  d."JobDescription" as duplicate_description,
  d."UnitName" as duplicate_unit,
  d."CreatedAt" as duplicate_created,
  d."Status" as duplicate_status,
  d."Priority" as duplicate_priority
FROM duplicate_candidates dc
LEFT JOIN "AF_work_order_new" p ON dc.primary_wo_id = p."ServiceRequestId"::TEXT
LEFT JOIN "AF_work_order_new" d ON dc.duplicate_wo_id = d."ServiceRequestId"::TEXT
WHERE dc.status = 'pending'
ORDER BY 
  CASE dc.ai_recommendation 
    WHEN 'MERGE' THEN 1 
    WHEN 'NEEDS_REVIEW' THEN 2
    WHEN 'NOT_DUPLICATE' THEN 3
    ELSE 4 
  END,
  dc.ai_confidence DESC NULLS LAST,
  dc.confidence_score DESC,
  dc.created_at ASC;

-- Function to update AI analysis
CREATE OR REPLACE FUNCTION update_duplicate_ai_analysis(
  p_candidate_id UUID,
  p_recommendation TEXT,
  p_confidence INTEGER,
  p_reasoning TEXT,
  p_key_differences TEXT DEFAULT NULL,
  p_merge_note TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE duplicate_candidates
  SET 
    ai_recommendation = p_recommendation,
    ai_confidence = p_confidence,
    ai_reasoning = p_reasoning,
    ai_key_differences = p_key_differences,
    ai_merge_note = p_merge_note,
    ai_analyzed_at = NOW()
  WHERE id = p_candidate_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

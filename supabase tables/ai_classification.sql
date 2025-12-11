-- AI Work Order Classification
-- Run this in Supabase SQL Editor

-- Add AI classification columns to AF_work_order_new
ALTER TABLE "AF_work_order_new"
ADD COLUMN IF NOT EXISTS ai_priority TEXT,
ADD COLUMN IF NOT EXISTS ai_priority_confidence INTEGER CHECK (ai_priority_confidence >= 0 AND ai_priority_confidence <= 100),
ADD COLUMN IF NOT EXISTS ai_priority_reasoning TEXT,
ADD COLUMN IF NOT EXISTS ai_skills_required TEXT[],
ADD COLUMN IF NOT EXISTS ai_estimated_hours DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS ai_estimated_hours_confidence INTEGER CHECK (ai_estimated_hours_confidence >= 0 AND ai_estimated_hours_confidence <= 100),
ADD COLUMN IF NOT EXISTS ai_likely_parts JSONB,
ADD COLUMN IF NOT EXISTS ai_category TEXT,
ADD COLUMN IF NOT EXISTS ai_flags JSONB,
ADD COLUMN IF NOT EXISTS ai_classified_at TIMESTAMPTZ;

-- Create classification log table
CREATE TABLE IF NOT EXISTS work_order_classification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id TEXT NOT NULL,
  input_description TEXT,
  ai_output JSONB,
  coordinator_override JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_classification_log_wo_id 
ON work_order_classification_log(work_order_id);

-- Index for finding unclassified work orders
CREATE INDEX IF NOT EXISTS idx_wo_ai_unclassified 
ON "AF_work_order_new"("Status") 
WHERE ai_classified_at IS NULL AND "Status" = 'NEW';

-- Function to update AI classification
CREATE OR REPLACE FUNCTION update_wo_ai_classification(
  p_work_order_id TEXT,
  p_priority TEXT,
  p_priority_confidence INTEGER,
  p_priority_reasoning TEXT,
  p_skills_required TEXT[],
  p_estimated_hours DECIMAL,
  p_estimated_hours_confidence INTEGER,
  p_likely_parts JSONB,
  p_category TEXT,
  p_flags JSONB,
  p_full_response JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update work order with AI classification
  UPDATE "AF_work_order_new"
  SET 
    ai_priority = p_priority,
    ai_priority_confidence = p_priority_confidence,
    ai_priority_reasoning = p_priority_reasoning,
    ai_skills_required = p_skills_required,
    ai_estimated_hours = p_estimated_hours,
    ai_estimated_hours_confidence = p_estimated_hours_confidence,
    ai_likely_parts = p_likely_parts,
    ai_category = p_category,
    ai_flags = p_flags,
    ai_classified_at = NOW()
  WHERE "ServiceRequestNumber"::TEXT = p_work_order_id;
  
  -- Log the classification
  INSERT INTO work_order_classification_log (
    work_order_id,
    input_description,
    ai_output
  )
  SELECT 
    p_work_order_id,
    "JobDescription",
    p_full_response
  FROM "AF_work_order_new"
  WHERE "ServiceRequestNumber"::TEXT = p_work_order_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to log coordinator override
CREATE OR REPLACE FUNCTION log_classification_override(
  p_work_order_id TEXT,
  p_override_field TEXT,
  p_original_value TEXT,
  p_new_value TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update the most recent log entry with override info
  UPDATE work_order_classification_log
  SET coordinator_override = COALESCE(coordinator_override, '{}'::JSONB) || 
    jsonb_build_object(
      p_override_field, jsonb_build_object(
        'original', p_original_value,
        'override', p_new_value,
        'reason', p_reason,
        'overridden_at', NOW()
      )
    )
  WHERE id = (
    SELECT id
    FROM work_order_classification_log
    WHERE work_order_id = p_work_order_id
    ORDER BY created_at DESC
    LIMIT 1
  );
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- View for unclassified work orders
CREATE OR REPLACE VIEW v_unclassified_work_orders AS
SELECT 
  "ServiceRequestNumber" as id,
  "JobDescription" as description,
  "Property" as property,
  "UnitName" as unit,
  "PrimaryTenant" as resident_name,
  "Priority" as current_priority,
  "Status" as status,
  "CreatedAt" as created_at
FROM "AF_work_order_new"
WHERE ai_classified_at IS NULL
  AND "Status" IN ('NEW', 'ASSIGNED')
ORDER BY "CreatedAt" DESC;

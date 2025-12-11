-- AI Parts Prediction Schema
-- PRP-AI-PARTS-PREDICTION
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. PARTS PREDICTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS parts_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id TEXT NOT NULL,
  
  -- Prediction Content
  predicted_parts JSONB DEFAULT '[]'::JSONB, -- High/Medium confidence items
  suggested_tools JSONB DEFAULT '[]'::JSONB,
  prediction_reasoning TEXT,
  
  -- Feedback Loop
  actual_parts_used JSONB, -- Captured at completion
  prediction_accuracy INTEGER, -- 0-100 score
  tech_feedback TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parts_predictions_wo ON parts_predictions(work_order_id);

-- ============================================
-- 2. RLS POLICIES
-- ============================================
ALTER TABLE parts_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated on parts_predictions" ON parts_predictions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow read for anon on parts_predictions" ON parts_predictions
  FOR SELECT TO anon USING (true);

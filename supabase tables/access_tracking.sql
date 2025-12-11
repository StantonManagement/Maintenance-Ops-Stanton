-- Access Tracking Table and View
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS access_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id TEXT NOT NULL,
  attempt_number INT NOT NULL,
  attempt_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  attempt_method TEXT NOT NULL, -- 'phone', 'text', 'email', 'in_person', 'letter'
  contact_result TEXT NOT NULL, -- 'no_answer', 'refused', 'rescheduled', 'successful', 'voicemail'
  notes TEXT,
  photo_urls TEXT[],
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_access_attempts_wo ON access_attempts(work_order_id);

CREATE OR REPLACE VIEW v_access_escalation_status AS
SELECT 
  work_order_id,
  COUNT(*) as attempt_count,
  MAX(attempt_date) as last_attempt,
  CASE 
    WHEN COUNT(*) >= 4 THEN 'legal_escalation'
    WHEN COUNT(*) >= 3 THEN 'caseworker_contact'
    WHEN COUNT(*) >= 2 THEN 'written_notice'
    WHEN COUNT(*) >= 1 THEN 'initial_attempt'
    ELSE 'not_started'
  END as escalation_stage
FROM access_attempts
WHERE contact_result != 'successful'
GROUP BY work_order_id;

-- Grant access
GRANT ALL ON access_attempts TO authenticated;
GRANT ALL ON access_attempts TO service_role;
GRANT SELECT ON v_access_escalation_status TO authenticated;
GRANT SELECT ON v_access_escalation_status TO service_role;

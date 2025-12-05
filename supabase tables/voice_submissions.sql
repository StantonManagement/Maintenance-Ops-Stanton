-- Voice Submissions Table
-- Run this in Supabase SQL Editor to create the table

CREATE TABLE IF NOT EXISTS voice_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('telegram', 'twilio', 'voicemail', 'manual')),
  audio_url TEXT,
  transcription TEXT NOT NULL,
  detected_language TEXT DEFAULT 'en',
  extracted_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'created', 'discarded')),
  work_order_id TEXT, -- References work order number/ID created from this submission
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  created_by TEXT DEFAULT 'system'
);

-- Index for fetching pending/ready submissions
CREATE INDEX IF NOT EXISTS idx_voice_submissions_status ON voice_submissions(status);

-- Index for finding submissions by work order
CREATE INDEX IF NOT EXISTS idx_voice_submissions_work_order ON voice_submissions(work_order_id);

-- Enable Row Level Security
ALTER TABLE voice_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users (adjust as needed)
CREATE POLICY "Allow all for authenticated users" ON voice_submissions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Allow read for anon (for webhook testing)
CREATE POLICY "Allow read for anon" ON voice_submissions
  FOR SELECT
  TO anon
  USING (true);

-- Policy: Allow insert for anon (for webhook)
CREATE POLICY "Allow insert for anon" ON voice_submissions
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Sample data for testing (optional - comment out in production)
INSERT INTO voice_submissions (source, transcription, detected_language, extracted_data, status) VALUES
(
  'twilio',
  'Hi, this is Maria from Unit 205 in Building A. My kitchen sink is leaking really bad, water is going everywhere. Please send someone as soon as possible, it''s an emergency!',
  'en',
  '{"property": {"value": "Building A", "confidence": 85}, "unit": {"value": "Unit 205", "confidence": 90}, "issue_description": {"value": "Kitchen sink leaking, water everywhere", "confidence": 95}, "priority": {"value": "emergency", "confidence": 92}, "category": {"value": "Plumbing", "confidence": 88}, "tenant_name": {"value": "Maria", "confidence": 75}}',
  'ready'
),
(
  'telegram',
  'Hola, soy Carlos del apartamento 310. El aire acondicionado no funciona y hace mucho calor. Gracias.',
  'es',
  '{"property": {"value": "", "confidence": 0}, "unit": {"value": "Unit 310", "confidence": 85}, "issue_description": {"value": "Air conditioning not working, very hot", "confidence": 90}, "priority": {"value": "high", "confidence": 70}, "category": {"value": "HVAC", "confidence": 92}, "tenant_name": {"value": "Carlos", "confidence": 80}}',
  'ready'
);

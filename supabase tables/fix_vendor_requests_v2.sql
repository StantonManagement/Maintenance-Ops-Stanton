-- FIX VENDOR REQUESTS V2 (MISSING COLUMNS)
-- Run this in Supabase SQL Editor
-- Fixes: "column vresp.response_status does not exist"

-- 1. CLEANUP VIEW
DROP VIEW IF EXISTS v_vendor_requests_with_responses;

-- 2. ENSURE COLUMNS ON VENDOR_REQUESTS
-- (Safe alters)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_requests' AND column_name = 'request_details') THEN
        ALTER TABLE vendor_requests ADD COLUMN request_details TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_requests' AND column_name = 'max_budget') THEN
        ALTER TABLE vendor_requests ADD COLUMN max_budget DECIMAL(10,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_requests' AND column_name = 'response_deadline') THEN
        ALTER TABLE vendor_requests ADD COLUMN response_deadline TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_requests' AND column_name = 'building_access_info') THEN
        ALTER TABLE vendor_requests ADD COLUMN building_access_info TEXT;
    END IF;
END $$;

-- 3. ENSURE VENDOR_RESPONSES TABLE & COLUMNS
CREATE TABLE IF NOT EXISTS vendor_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
    -- Core columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_responses' AND column_name = 'request_id') THEN
        ALTER TABLE vendor_responses ADD COLUMN request_id UUID REFERENCES vendor_requests(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_responses' AND column_name = 'vendor_id') THEN
        ALTER TABLE vendor_responses ADD COLUMN vendor_id UUID REFERENCES vendors(id);
    END IF;
    
    -- The missing column causing the error
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_responses' AND column_name = 'response_status') THEN
        ALTER TABLE vendor_responses ADD COLUMN response_status TEXT NOT NULL DEFAULT 'pending';
    END IF;

    -- Other fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_responses' AND column_name = 'proposed_timeline') THEN
        ALTER TABLE vendor_responses ADD COLUMN proposed_timeline TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_responses' AND column_name = 'quoted_amount') THEN
        ALTER TABLE vendor_responses ADD COLUMN quoted_amount DECIMAL(10,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_responses' AND column_name = 'decline_reason') THEN
        ALTER TABLE vendor_responses ADD COLUMN decline_reason TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_responses' AND column_name = 'notes') THEN
        ALTER TABLE vendor_responses ADD COLUMN notes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_responses' AND column_name = 'responded_at') THEN
        ALTER TABLE vendor_responses ADD COLUMN responded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 4. RECREATE VIEW
CREATE OR REPLACE VIEW v_vendor_requests_with_responses AS
SELECT 
  vr.*,
  COUNT(vresp.id) as response_count,
  COUNT(CASE WHEN vresp.response_status IN ('accepted', 'quoted') THEN 1 END) as positive_responses,
  MIN(vresp.quoted_amount) as lowest_quote
FROM vendor_requests vr
LEFT JOIN vendor_responses vresp ON vresp.request_id = vr.id
GROUP BY vr.id;

-- 5. PERMISSIONS
GRANT ALL ON vendor_responses TO authenticated, service_role;
GRANT SELECT ON v_vendor_requests_with_responses TO authenticated, service_role;

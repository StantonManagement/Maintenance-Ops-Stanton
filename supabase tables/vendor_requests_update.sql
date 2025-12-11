-- Vendor Requests Updates
-- Run this in Supabase SQL Editor

-- Update vendor_requests table
ALTER TABLE vendor_requests ADD COLUMN IF NOT EXISTS request_details TEXT;
ALTER TABLE vendor_requests ADD COLUMN IF NOT EXISTS max_budget DECIMAL(10,2);
ALTER TABLE vendor_requests ADD COLUMN IF NOT EXISTS response_deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE vendor_requests ADD COLUMN IF NOT EXISTS building_access_info TEXT;

-- Create responses table
CREATE TABLE IF NOT EXISTS vendor_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES vendor_requests(id),
  vendor_id UUID REFERENCES vendors(id),
  response_status TEXT NOT NULL, -- 'accepted', 'declined', 'quoted', 'needs_info'
  proposed_timeline TEXT,
  quoted_amount DECIMAL(10,2),
  decline_reason TEXT,
  notes TEXT,
  responded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- View for requests with response metrics
CREATE OR REPLACE VIEW v_vendor_requests_with_responses AS
SELECT 
  vr.*,
  COUNT(vresp.id) as response_count,
  COUNT(CASE WHEN vresp.response_status IN ('accepted', 'quoted') THEN 1 END) as positive_responses,
  MIN(vresp.quoted_amount) as lowest_quote
FROM vendor_requests vr
LEFT JOIN vendor_responses vresp ON vresp.request_id = vr.id
GROUP BY vr.id;

-- Grant access
GRANT ALL ON vendor_responses TO authenticated;
GRANT ALL ON vendor_responses TO service_role;
GRANT SELECT ON v_vendor_requests_with_responses TO authenticated;
GRANT SELECT ON v_vendor_requests_with_responses TO service_role;

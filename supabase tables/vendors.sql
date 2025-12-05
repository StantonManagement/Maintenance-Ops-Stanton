-- Vendors Tables
-- Run this in Supabase SQL Editor to create the tables

-- Main vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  categories TEXT[] DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  emergency_available BOOLEAN DEFAULT false,
  hourly_rate NUMERIC(10,2),
  is_active BOOLEAN DEFAULT true,
  quality_score NUMERIC(5,2) DEFAULT 0,
  response_time_avg INTEGER DEFAULT 0, -- in minutes
  jobs_completed INTEGER DEFAULT 0,
  acceptance_rate NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendor requests table
CREATE TABLE IF NOT EXISTS vendor_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id TEXT NOT NULL, -- References work order number
  category TEXT NOT NULL,
  description TEXT,
  urgency TEXT DEFAULT 'standard' CHECK (urgency IN ('emergency', 'urgent', 'standard')),
  deadline TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'responded', 'assigned', 'cancelled', 'completed')),
  selected_vendor_id UUID REFERENCES vendors(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT DEFAULT 'system'
);

-- Vendor responses table
CREATE TABLE IF NOT EXISTS vendor_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES vendor_requests(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id),
  response TEXT NOT NULL CHECK (response IN ('accept', 'decline', 'info_needed')),
  proposed_time TIMESTAMPTZ,
  quote_amount NUMERIC(10,2),
  notes TEXT,
  responded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vendors_active ON vendors(is_active);
CREATE INDEX IF NOT EXISTS idx_vendors_categories ON vendors USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_vendor_requests_status ON vendor_requests(status);
CREATE INDEX IF NOT EXISTS idx_vendor_requests_work_order ON vendor_requests(work_order_id);
CREATE INDEX IF NOT EXISTS idx_vendor_responses_request ON vendor_responses(request_id);

-- Enable Row Level Security
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_responses ENABLE ROW LEVEL SECURITY;

-- Policies for vendors
CREATE POLICY "Allow all for authenticated users on vendors" ON vendors
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow read for anon on vendors" ON vendors
  FOR SELECT TO anon USING (true);

-- Policies for vendor_requests
CREATE POLICY "Allow all for authenticated users on vendor_requests" ON vendor_requests
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policies for vendor_responses
CREATE POLICY "Allow all for authenticated users on vendor_responses" ON vendor_responses
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed data
INSERT INTO vendors (name, company, phone, email, categories, certifications, emergency_available, hourly_rate, quality_score, response_time_avg, jobs_completed, acceptance_rate) VALUES
(
  'Mike Rodriguez',
  'Rodriguez Plumbing LLC',
  '(555) 123-4567',
  'mike@rodriguezplumbing.com',
  ARRAY['Plumbing', 'Emergency'],
  ARRAY['Licensed Plumber', 'Backflow Certified'],
  true,
  85.00,
  94,
  45,
  127,
  88
),
(
  'Sarah Chen',
  'Chen Electric Services',
  '(555) 234-5678',
  'sarah@chenelectric.com',
  ARRAY['Electrical', 'Emergency'],
  ARRAY['Master Electrician', 'OSHA Certified'],
  true,
  95.00,
  97,
  60,
  89,
  92
),
(
  'Tom Williams',
  'Williams HVAC',
  '(555) 345-6789',
  'tom@williamshvac.com',
  ARRAY['HVAC', 'Specialized'],
  ARRAY['EPA 608 Certified', 'NATE Certified'],
  false,
  110.00,
  91,
  180,
  64,
  78
),
(
  'Lisa Park',
  'Park Appliance Repair',
  '(555) 456-7890',
  'lisa@parkappliance.com',
  ARRAY['Appliance', 'Specialized'],
  ARRAY['Factory Authorized'],
  false,
  75.00,
  88,
  240,
  156,
  95
),
(
  'Maria Santos',
  'Santos Locksmith',
  '(555) 678-9012',
  'maria@santoslocksmith.com',
  ARRAY['Locksmith', 'Emergency'],
  ARRAY['Certified Locksmith', 'Bonded'],
  true,
  90.00,
  96,
  30,
  203,
  91
);

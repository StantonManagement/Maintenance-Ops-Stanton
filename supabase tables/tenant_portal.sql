-- Tenant Portal Tables
-- Run this in Supabase SQL Editor to create the tables

-- Tenant portal sessions for phone verification
CREATE TABLE IF NOT EXISTS tenant_portal_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  verification_code TEXT,
  verified_at TIMESTAMPTZ,
  tenant_id TEXT, -- Link to tenant record if found
  unit_id TEXT,   -- Link to unit if tenant found
  property_id TEXT,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant portal requests
CREATE TABLE IF NOT EXISTS tenant_portal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES tenant_portal_sessions(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  permission_to_enter TEXT DEFAULT 'yes' CHECK (permission_to_enter IN ('yes', 'no', 'call_first')),
  urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('emergency', 'urgent', 'normal')),
  preferred_time TEXT,
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  work_order_id TEXT, -- References work order number
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'work_order_created', 'in_progress', 'scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant messages (for communication thread)
CREATE TABLE IF NOT EXISTS tenant_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES tenant_portal_requests(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('tenant', 'coordinator', 'system')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tenant_sessions_phone ON tenant_portal_sessions(phone);
CREATE INDEX IF NOT EXISTS idx_tenant_sessions_verified ON tenant_portal_sessions(verified_at);
CREATE INDEX IF NOT EXISTS idx_tenant_requests_phone ON tenant_portal_requests(phone);
CREATE INDEX IF NOT EXISTS idx_tenant_requests_status ON tenant_portal_requests(status);
CREATE INDEX IF NOT EXISTS idx_tenant_requests_work_order ON tenant_portal_requests(work_order_id);
CREATE INDEX IF NOT EXISTS idx_tenant_messages_request ON tenant_messages(request_id);

-- Enable Row Level Security
ALTER TABLE tenant_portal_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_portal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow all for authenticated on tenant_portal_sessions" ON tenant_portal_sessions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow insert for anon on tenant_portal_sessions" ON tenant_portal_sessions
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow select own session for anon" ON tenant_portal_sessions
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow all for authenticated on tenant_portal_requests" ON tenant_portal_requests
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow insert for anon on tenant_portal_requests" ON tenant_portal_requests
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow select own requests for anon" ON tenant_portal_requests
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow all for authenticated on tenant_messages" ON tenant_messages
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow insert for anon on tenant_messages" ON tenant_messages
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow select for anon on tenant_messages" ON tenant_messages
  FOR SELECT TO anon USING (true);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_tenant_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tenant_request_updated_at
  BEFORE UPDATE ON tenant_portal_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_tenant_request_updated_at();

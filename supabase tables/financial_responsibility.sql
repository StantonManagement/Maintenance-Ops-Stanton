-- AI Financial Responsibility Schema
-- PRP-AI-RESPONSIBILITY
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. ADD RESPONSIBILITY COLUMNS TO WORK ORDERS
-- ============================================
-- Using sidecar table pattern again if we can't modify main table easily, 
-- or extending the one we just made. 
-- Let's extend work_order_financials if possible, or create a new one.
-- Creating a new one is cleaner for modularity.

CREATE TABLE IF NOT EXISTS work_order_responsibility (
  work_order_id TEXT PRIMARY KEY, -- References ServiceRequestId
  responsibility TEXT CHECK (responsibility IN ('owner', 'tenant', 'shared')),
  responsibility_confidence INTEGER,
  responsibility_reasoning TEXT,
  key_factors JSONB DEFAULT '[]'::JSONB,
  dispute_risk TEXT CHECK (dispute_risk IN ('low', 'medium', 'high')),
  
  -- Split Details (for shared)
  owner_percentage INTEGER,
  tenant_percentage INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. TENANT CHARGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id TEXT NOT NULL,
  tenant_id TEXT, -- Who is being charged
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  charge_type TEXT, -- damage, negligence, modification, other
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'billed', 'paid', 'disputed', 'waived')),
  evidence_summary TEXT,
  
  -- Metadata
  created_by UUID REFERENCES technicians(id), -- or coordinator
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wo_resp_wo ON work_order_responsibility(work_order_id);
CREATE INDEX IF NOT EXISTS idx_tenant_charges_wo ON tenant_charges(work_order_id);
CREATE INDEX IF NOT EXISTS idx_tenant_charges_tenant ON tenant_charges(tenant_id);

-- ============================================
-- 3. RLS POLICIES
-- ============================================
ALTER TABLE work_order_responsibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated on work_order_responsibility" ON work_order_responsibility
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow read for anon on work_order_responsibility" ON work_order_responsibility
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow all for authenticated on tenant_charges" ON tenant_charges
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow read for anon on tenant_charges" ON tenant_charges
  FOR SELECT TO anon USING (true);

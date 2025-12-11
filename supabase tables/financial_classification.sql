-- AI Financial Classification Schema
-- PRP-AI-CAPEX-CLASSIFICATION
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. ADD FINANCIAL COLUMNS TO WORK ORDERS
-- ============================================
-- Note: work_orders table name might vary, using what we found in other files
-- Assuming the main table is "AF_work_order_new" but we might need a shadow table or extra columns
-- If we can't alter AF_work_order_new, we should use a sidecar table like work_order_financials

CREATE TABLE IF NOT EXISTS work_order_financials (
  work_order_id TEXT PRIMARY KEY, -- References ServiceRequestId
  financial_category TEXT CHECK (financial_category IN ('capex', 'maintenance')),
  ai_financial_confidence INTEGER,
  ai_financial_reasoning TEXT,
  ai_estimated_lifespan_years DECIMAL,
  work_type TEXT, -- replacement, repair, service, installation
  
  -- Manual Override
  override_by UUID REFERENCES technicians(id),
  override_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. CAPEX ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS capex_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id TEXT NOT NULL, -- FK to work order
  item_description TEXT NOT NULL,
  item_category TEXT, -- fixture, appliance, system, structural
  estimated_lifespan_years INTEGER,
  installed_date DATE DEFAULT CURRENT_DATE,
  warranty_expires DATE,
  cost DECIMAL(10, 2),
  unit_id TEXT, -- For unit profile linking
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wo_financials_cat ON work_order_financials(financial_category);
CREATE INDEX IF NOT EXISTS idx_capex_items_wo ON capex_items(work_order_id);
CREATE INDEX IF NOT EXISTS idx_capex_items_unit ON capex_items(unit_id);

-- ============================================
-- 3. RLS POLICIES
-- ============================================
ALTER TABLE work_order_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE capex_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated on work_order_financials" ON work_order_financials
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow read for anon on work_order_financials" ON work_order_financials
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow all for authenticated on capex_items" ON capex_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow read for anon on capex_items" ON capex_items
  FOR SELECT TO anon USING (true);

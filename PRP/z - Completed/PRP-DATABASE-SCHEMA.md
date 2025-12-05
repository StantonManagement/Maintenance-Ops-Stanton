# PRP: Database Schema Completion

## Goal
Create all missing Supabase tables required for Phase 1-3 features to use real data instead of mock fallbacks.

## Success Criteria
- [ ] All tables created in Supabase
- [ ] Foreign key relationships established
- [ ] Row Level Security policies applied
- [ ] Seed data inserted for testing
- [ ] `useTechnicians` hook returns real data (no fallback)

## Prerequisites
- Supabase project with existing `AF_work_order_new` table
- Supabase CLI or Dashboard access

---

## Task 1: Run Core Schema SQL

Run this in Supabase SQL Editor (in order):

```sql
-- ============================================
-- 1. TECHNICIANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS technicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  role TEXT DEFAULT 'technician' CHECK (role IN ('technician', 'lead', 'supervisor')),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'busy', 'off_duty', 'on_leave')),
  skills TEXT[] DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  max_daily_workload INTEGER DEFAULT 6,
  current_location JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for status queries
CREATE INDEX idx_technicians_status ON technicians(status);

-- ============================================
-- 2. PROPERTIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  owner_entity TEXT,
  is_section8 BOOLEAN DEFAULT FALSE,
  unit_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_properties_code ON properties(property_code);

-- ============================================
-- 3. UNITS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  bedrooms INTEGER,
  bathrooms NUMERIC(3,1),
  square_feet INTEGER,
  floor INTEGER,
  status TEXT DEFAULT 'occupied' CHECK (status IN ('occupied', 'vacant', 'turnover', 'offline')),
  last_turnover_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(property_id, unit_number)
);

CREATE INDEX idx_units_property ON units(property_id);
CREATE INDEX idx_units_status ON units(status);

-- ============================================
-- 4. TENANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  preferred_language TEXT DEFAULT 'en',
  is_section8 BOOLEAN DEFAULT FALSE,
  lease_start DATE,
  lease_end DATE,
  payment_status TEXT DEFAULT 'current' CHECK (payment_status IN ('current', 'late', 'delinquent', 'eviction')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenants_unit ON tenants(unit_id);
CREATE INDEX idx_tenants_payment_status ON tenants(payment_status);

-- ============================================
-- 5. EQUIPMENT TABLE (Unit Profiles)
-- ============================================
CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  equipment_type TEXT NOT NULL,
  make TEXT,
  model TEXT,
  serial_number TEXT,
  install_date DATE,
  warranty_expiration DATE,
  expected_lifespan_years INTEGER,
  last_service_date DATE,
  condition TEXT DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'poor', 'needs_replacement')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_equipment_unit ON equipment(unit_id);
CREATE INDEX idx_equipment_type ON equipment(equipment_type);

-- ============================================
-- 6. WORK ORDER ASSIGNMENTS TABLE
-- Links work orders to technicians
-- ============================================
CREATE TABLE IF NOT EXISTS work_order_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id TEXT NOT NULL, -- References AF_work_order_new.ServiceRequestId
  technician_id UUID REFERENCES technicians(id) ON DELETE SET NULL,
  assigned_by TEXT, -- Coordinator name or 'AI_AUTO'
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_date DATE,
  scheduled_time_start TIME,
  scheduled_time_end TIME,
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assignments_work_order ON work_order_assignments(work_order_id);
CREATE INDEX idx_assignments_technician ON work_order_assignments(technician_id);
CREATE INDEX idx_assignments_date ON work_order_assignments(scheduled_date);

-- ============================================
-- 7. OVERRIDE HISTORY TABLE
-- Tracks when managers pull technicians
-- ============================================
CREATE TABLE IF NOT EXISTS override_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id UUID REFERENCES technicians(id) ON DELETE SET NULL,
  override_by TEXT NOT NULL,
  override_reason TEXT NOT NULL CHECK (override_reason IN ('emergency', 'turnover', 'inspection', 'other')),
  override_reason_detail TEXT,
  displaced_work_orders TEXT[], -- Array of work order IDs that were displaced
  acknowledged_by TEXT,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_overrides_technician ON override_history(technician_id);
CREATE INDEX idx_overrides_date ON override_history(created_at);

-- ============================================
-- 8. AUDIT LOG TABLE
-- General purpose audit trail
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'work_order', 'technician', 'tenant', etc.
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'status_change', etc.
  actor TEXT NOT NULL, -- User or system that made the change
  old_value JSONB,
  new_value JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_date ON audit_logs(created_at);
CREATE INDEX idx_audit_actor ON audit_logs(actor);

-- ============================================
-- 9. FINANCIAL RECORDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS financial_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id TEXT,
  property_id UUID REFERENCES properties(id),
  unit_id UUID REFERENCES units(id),
  category TEXT NOT NULL CHECK (category IN ('maintenance', 'capex', 'turnover', 'section8_inspection', 'section8_tenant', 'section8_preinspection', 'preventive')),
  subcategory TEXT,
  description TEXT,
  amount NUMERIC(10,2) NOT NULL,
  is_tenant_charge BOOLEAN DEFAULT FALSE,
  tenant_id UUID REFERENCES tenants(id),
  vendor_id UUID,
  invoice_number TEXT,
  invoice_date DATE,
  paid_date DATE,
  fiscal_year INTEGER,
  fiscal_month INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_financial_category ON financial_records(category);
CREATE INDEX idx_financial_property ON financial_records(property_id);
CREATE INDEX idx_financial_date ON financial_records(created_at);

-- ============================================
-- 10. MESSAGES TABLE
-- Tenant/Tech communication threads
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('tenant', 'coordinator', 'technician', 'system')),
  sender_id TEXT,
  sender_name TEXT,
  content TEXT NOT NULL,
  original_language TEXT,
  translated_content TEXT,
  channel TEXT DEFAULT 'sms' CHECK (channel IN ('sms', 'email', 'app', 'phone')),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_work_order ON messages(work_order_id);
CREATE INDEX idx_messages_unread ON messages(is_read) WHERE is_read = FALSE;

-- ============================================
-- 11. WORK ORDER PHOTOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS work_order_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id TEXT NOT NULL,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('before', 'during', 'after', 'cleanup')),
  storage_url TEXT NOT NULL,
  thumbnail_url TEXT,
  uploaded_by TEXT,
  gps_latitude NUMERIC(10,7),
  gps_longitude NUMERIC(10,7),
  ai_analysis_result JSONB,
  ai_confidence NUMERIC(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_photos_work_order ON work_order_photos(work_order_id);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_technicians_updated_at BEFORE UPDATE ON technicians FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON work_order_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_updated_at BEFORE UPDATE ON financial_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Task 2: Enable Row Level Security

```sql
-- Enable RLS on all tables
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE override_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_photos ENABLE ROW LEVEL SECURITY;

-- For development: Allow all operations for authenticated users
-- IMPORTANT: Tighten these policies before production

CREATE POLICY "Allow all for authenticated users" ON technicians FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON properties FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON units FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON tenants FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON equipment FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON work_order_assignments FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON override_history FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON audit_logs FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON financial_records FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON messages FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON work_order_photos FOR ALL USING (true);
```

---

## Task 3: Insert Seed Data

```sql
-- ============================================
-- SEED DATA FOR TESTING
-- ============================================

-- Technicians (matches your mock data structure)
INSERT INTO technicians (id, name, phone, email, role, status, skills, certifications, max_daily_workload) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Ramon Martinez', '555-0101', 'ramon@maintenance.com', 'technician', 'available', ARRAY['plumbing', 'electrical', 'hvac', 'appliances'], ARRAY['EPA 608', 'Journeyman Plumber'], 6),
  ('22222222-2222-2222-2222-222222222222', 'Kishan Patel', '555-0102', 'kishan@maintenance.com', 'technician', 'available', ARRAY['electrical', 'general', 'drywall'], ARRAY['Journeyman Electrician'], 6),
  ('33333333-3333-3333-3333-333333333333', 'Carlos Rivera', '555-0103', 'carlos@maintenance.com', 'lead', 'available', ARRAY['plumbing', 'hvac', 'appliances', 'general'], ARRAY['Master Plumber', 'EPA 608'], 6),
  ('44444444-4444-4444-4444-444444444444', 'Keyshawn Johnson', '555-0104', 'keyshawn@maintenance.com', 'technician', 'busy', ARRAY['general', 'painting', 'drywall', 'flooring'], ARRAY[], 6);

-- Properties
INSERT INTO properties (id, property_code, name, address, city, state, zip, owner_entity, is_section8, unit_count) VALUES
  ('aaaa1111-1111-1111-1111-111111111111', 'S0021', '67 Park Ave', '67 Park Avenue', 'Newark', 'NJ', '07102', 'Park Holdings LLC', TRUE, 24),
  ('aaaa2222-2222-2222-2222-222222222222', 'S0045', 'Riverside Commons', '123 River St', 'Newark', 'NJ', '07104', 'Riverside Properties LLC', FALSE, 36),
  ('aaaa3333-3333-3333-3333-333333333333', 'S0089', 'Oak Manor', '456 Oak Lane', 'East Orange', 'NJ', '07017', 'Oak Holdings LLC', TRUE, 18);

-- Units
INSERT INTO units (id, property_id, unit_number, bedrooms, bathrooms, square_feet, floor, status) VALUES
  ('bbbb1111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', '205', 2, 1, 850, 2, 'occupied'),
  ('bbbb2222-2222-2222-2222-222222222222', 'aaaa1111-1111-1111-1111-111111111111', '302', 1, 1, 650, 3, 'occupied'),
  ('bbbb3333-3333-3333-3333-333333333333', 'aaaa2222-2222-2222-2222-222222222222', '101', 3, 2, 1200, 1, 'occupied'),
  ('bbbb4444-4444-4444-4444-444444444444', 'aaaa3333-3333-3333-3333-333333333333', '404', 2, 1.5, 900, 4, 'turnover');

-- Tenants
INSERT INTO tenants (id, unit_id, first_name, last_name, email, phone, preferred_language, is_section8, lease_start, lease_end, payment_status) VALUES
  ('cccc1111-1111-1111-1111-111111111111', 'bbbb1111-1111-1111-1111-111111111111', 'Maria', 'Lopez', 'maria.lopez@email.com', '555-1001', 'es', TRUE, '2023-01-01', '2025-01-01', 'current'),
  ('cccc2222-2222-2222-2222-222222222222', 'bbbb2222-2222-2222-2222-222222222222', 'James', 'Wilson', 'jwilson@email.com', '555-1002', 'en', TRUE, '2022-06-01', '2024-06-01', 'current'),
  ('cccc3333-3333-3333-3333-333333333333', 'bbbb3333-3333-3333-3333-333333333333', 'Chen', 'Wei', 'chen.wei@email.com', '555-1003', 'zh', FALSE, '2024-01-01', '2026-01-01', 'late');

-- Equipment (for Unit 205)
INSERT INTO equipment (unit_id, equipment_type, make, model, install_date, warranty_expiration, expected_lifespan_years, condition) VALUES
  ('bbbb1111-1111-1111-1111-111111111111', 'Water Heater', 'Rheem', 'Professional 40 Gal', '2020-03-15', '2026-03-15', 12, 'good'),
  ('bbbb1111-1111-1111-1111-111111111111', 'HVAC System', 'Carrier', 'Comfort Series', '2019-08-01', '2029-08-01', 15, 'good'),
  ('bbbb1111-1111-1111-1111-111111111111', 'Refrigerator', 'GE', 'Profile Series', '2022-01-10', '2024-01-10', 15, 'excellent'),
  ('bbbb1111-1111-1111-1111-111111111111', 'Smoke Detector', 'First Alert', 'SA320CN', '2024-01-05', NULL, 10, 'excellent');
```

---

## Validation Checkpoint

After running all SQL:

```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('technicians', 'properties', 'units', 'tenants', 'equipment', 'work_order_assignments', 'override_history', 'audit_logs', 'financial_records', 'messages', 'work_order_photos');

-- Verify seed data
SELECT COUNT(*) as tech_count FROM technicians; -- Should be 4
SELECT COUNT(*) as property_count FROM properties; -- Should be 3
SELECT COUNT(*) as unit_count FROM units; -- Should be 4
SELECT COUNT(*) as tenant_count FROM tenants; -- Should be 3
```

---

## Anti-Patterns to Avoid
- ❌ Don't modify AF_work_order_new table (read-only AppFolio data)
- ❌ Don't create duplicate columns that exist in AF tables
- ❌ Don't skip the RLS policies (security risk)
- ❌ Don't hardcode UUIDs in production (seed data only)

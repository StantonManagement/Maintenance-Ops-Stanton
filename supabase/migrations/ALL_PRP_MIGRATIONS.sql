-- ============================================================
-- ALL PRP MIGRATIONS - Combined SQL for Maintenance Ops Center
-- Run this file in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PRP-01: DATA LAYER FOUNDATION
-- ============================================================

-- 1. Portfolios - Add missing columns to existing table
DO $$
BEGIN
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portfolios' AND column_name = 'settings') THEN
        ALTER TABLE public.portfolios ADD COLUMN settings JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portfolios' AND column_name = 'appfolio_account_id') THEN
        ALTER TABLE public.portfolios ADD COLUMN appfolio_account_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portfolios' AND column_name = 'subscription_tier') THEN
        ALTER TABLE public.portfolios ADD COLUMN subscription_tier TEXT DEFAULT 'standard';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portfolios' AND column_name = 'active') THEN
        ALTER TABLE public.portfolios ADD COLUMN active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 2. Portfolio Users
CREATE TABLE IF NOT EXISTS public.portfolio_users (
    portfolio_id TEXT REFERENCES public.portfolios(id),
    user_id UUID REFERENCES auth.users(id),
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'coordinator', 'admin', 'technician', 'viewer')),
    permissions TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    granted_by UUID REFERENCES auth.users(id),
    PRIMARY KEY (portfolio_id, user_id)
);

-- 3. Properties
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id TEXT NOT NULL REFERENCES public.portfolios(id),
    af_property_id TEXT,
    name TEXT NOT NULL,
    code TEXT,
    address_street TEXT,
    address_city TEXT,
    address_state TEXT,
    address_zip TEXT,
    address_full TEXT GENERATED ALWAYS AS (
        COALESCE(address_street, '') || ', ' || 
        COALESCE(address_city, '') || ', ' || 
        COALESCE(address_state, '') || ' ' || 
        COALESCE(address_zip, '')
    ) STORED,
    property_type TEXT CHECK (property_type IN ('residential', 'commercial', 'mixed')),
    section_8_status TEXT DEFAULT 'none',
    owner_entity TEXT,
    manager_name TEXT,
    manager_phone TEXT,
    manager_email TEXT,
    building_count INT DEFAULT 1,
    unit_count INT DEFAULT 0,
    settings JSONB DEFAULT '{}'::jsonb,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Units
CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES public.properties(id),
    portfolio_id TEXT NOT NULL REFERENCES public.portfolios(id),
    af_unit_id TEXT,
    unit_number TEXT NOT NULL,
    building_number TEXT,
    floor INT,
    bedrooms INT,
    bathrooms DECIMAL,
    square_feet INT,
    rent_amount DECIMAL,
    is_section_8 BOOLEAN DEFAULT false,
    tenant_id UUID,
    tenant_name TEXT,
    tenant_phone TEXT,
    tenant_email TEXT,
    tenant_language TEXT DEFAULT 'en',
    lease_start DATE,
    lease_end DATE,
    status TEXT CHECK (status IN ('occupied', 'vacant', 'notice_given', 'make_ready')),
    last_inspection_date DATE,
    next_inspection_date DATE,
    equipment JSONB DEFAULT '{}'::jsonb,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Technicians
CREATE TABLE IF NOT EXISTS public.technicians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    portfolio_id TEXT NOT NULL REFERENCES public.portfolios(id),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    skills TEXT[] DEFAULT '{}',
    certifications JSONB DEFAULT '[]'::jsonb,
    max_daily_orders INT DEFAULT 6,
    hourly_rate DECIMAL,
    is_available BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'on_job', 'off_duty', 'vacation')),
    current_location JSONB,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Work Orders
CREATE TABLE IF NOT EXISTS public.work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id TEXT NOT NULL REFERENCES public.portfolios(id),
    property_id UUID NOT NULL REFERENCES public.properties(id),
    unit_id UUID REFERENCES public.units(id),
    af_work_order_id TEXT,
    service_request_id TEXT,
    work_order_number INT,
    title TEXT,
    description TEXT,
    category TEXT,
    priority TEXT CHECK (priority IN ('emergency', 'high', 'medium', 'low', 'normal')),
    status TEXT DEFAULT 'new',
    source TEXT,
    
    -- Assignment
    assigned_technician_id UUID REFERENCES public.technicians(id),
    scheduled_date DATE,
    scheduled_time_start TIME,
    scheduled_time_end TIME,
    estimated_duration_hours DECIMAL,

    -- Tenant Context
    tenant_name TEXT,
    tenant_phone TEXT,
    tenant_availability TEXT,
    permission_to_enter TEXT DEFAULT 'pending',
    access_instructions TEXT,

    -- Financial
    is_capex BOOLEAN DEFAULT false,
    capex_reason TEXT,
    section_8_category TEXT,
    estimated_cost DECIMAL,
    actual_cost DECIMAL,
    parts_cost DECIMAL,
    labor_cost DECIMAL,

    -- Completion
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES auth.users(id),
    completion_notes TEXT,
    tech_notes TEXT,
    tenant_satisfaction INT,
    first_time_fix BOOLEAN,
    
    -- Rejection tracking
    rejection_reason TEXT,
    rejection_count INT DEFAULT 0,

    -- Deadline
    deadline_date DATE,
    deadline_type TEXT,
    exposure_amount DECIMAL,

    -- Photos (JSONB for flexibility)
    photos JSONB DEFAULT '{"before": [], "after": [], "cleanup": []}'::jsonb,

    -- Metadata
    has_unread_messages BOOLEAN DEFAULT false,
    message_count INT DEFAULT 0,
    photo_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 7. Messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id TEXT NOT NULL REFERENCES public.portfolios(id),
    work_order_id UUID REFERENCES public.work_orders(id),
    direction TEXT CHECK (direction IN ('inbound', 'outbound')),
    channel TEXT CHECK (channel IN ('sms', 'email', 'phone', 'portal')),
    sender_type TEXT CHECK (sender_type IN ('tenant', 'coordinator', 'technician', 'system')),
    sender_id UUID REFERENCES auth.users(id),
    sender_phone TEXT,
    sender_name TEXT,
    content TEXT,
    content_translated TEXT,
    original_language TEXT DEFAULT 'en',
    delivery_status TEXT DEFAULT 'pending',
    read_at TIMESTAMPTZ,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Approvals
CREATE TABLE IF NOT EXISTS public.approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id TEXT NOT NULL REFERENCES public.portfolios(id),
    work_order_id UUID NOT NULL REFERENCES public.work_orders(id),
    type TEXT CHECK (type IN ('completion', 'expense', 'vendor', 'override')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_by UUID REFERENCES auth.users(id),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    amount DECIMAL,
    vendor_name TEXT,
    invoice_number TEXT,
    before_photos TEXT[],
    after_photos TEXT[],
    cleanup_photos TEXT[],
    checklist JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Vendors
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id TEXT NOT NULL REFERENCES public.portfolios(id),
    name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    category TEXT,
    specialties TEXT[],
    insurance_verified BOOLEAN DEFAULT false,
    insurance_expiration DATE,
    license_number TEXT,
    license_expiration DATE,
    hourly_rate DECIMAL,
    emergency_rate DECIMAL,
    response_time_hours INT,
    rating DECIMAL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Audit Log
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id TEXT NOT NULL REFERENCES public.portfolios(id),
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT,
    user_role TEXT,
    action TEXT,
    entity_type TEXT,
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    context JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRP-02: AUTHENTICATION & AUTHORIZATION
-- ============================================================

-- 1. Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function to get user's portfolio IDs
CREATE OR REPLACE FUNCTION public.user_portfolio_ids() 
RETURNS TEXT[] AS $$
  SELECT ARRAY_AGG(portfolio_id)
  FROM public.portfolio_users
  WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to check if user has access to portfolio
CREATE OR REPLACE FUNCTION public.check_user_portfolio_access(check_portfolio_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.portfolio_users
    WHERE user_id = auth.uid()
    AND portfolio_id = check_portfolio_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role for portfolio
CREATE OR REPLACE FUNCTION public.get_user_role(check_portfolio_id TEXT)
RETURNS TEXT AS $$
DECLARE
  found_role TEXT;
BEGIN
  SELECT role INTO found_role
  FROM public.portfolio_users
  WHERE user_id = auth.uid()
  AND portfolio_id = check_portfolio_id;
  
  RETURN found_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    END IF;
END
$$;

-- Audit log function
CREATE OR REPLACE FUNCTION public.record_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    user_role_text TEXT;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        SELECT role INTO user_role_text FROM public.portfolio_users 
        WHERE user_id = auth.uid() AND portfolio_id = OLD.portfolio_id;
        
        INSERT INTO public.audit_log (
            portfolio_id, user_id, user_email, user_role, 
            action, entity_type, entity_id, old_value
        )
        VALUES (
            OLD.portfolio_id,
            auth.uid(),
            (SELECT email FROM public.profiles WHERE id = auth.uid()),
            user_role_text,
            TG_OP,
            TG_TABLE_NAME,
            OLD.id,
            row_to_json(OLD)
        );
        RETURN OLD;
    ELSE
        SELECT role INTO user_role_text FROM public.portfolio_users 
        WHERE user_id = auth.uid() AND portfolio_id = NEW.portfolio_id;

        INSERT INTO public.audit_log (
            portfolio_id, user_id, user_email, user_role, 
            action, entity_type, entity_id, old_value, new_value
        )
        VALUES (
            NEW.portfolio_id,
            auth.uid(),
            (SELECT email FROM public.profiles WHERE id = auth.uid()),
            user_role_text,
            TG_OP,
            TG_TABLE_NAME,
            NEW.id,
            CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
            row_to_json(NEW)
        );
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Drop existing policies to avoid conflicts (idempotent)
DROP POLICY IF EXISTS "Users can view assigned portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Users can view portfolio members" ON public.portfolio_users;
DROP POLICY IF EXISTS "Users can view portfolio properties" ON public.properties;
DROP POLICY IF EXISTS "Users can view portfolio units" ON public.units;
DROP POLICY IF EXISTS "Users can view portfolio technicians" ON public.technicians;
DROP POLICY IF EXISTS "Users can view portfolio work orders" ON public.work_orders;
DROP POLICY IF EXISTS "Users can view portfolio messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view portfolio approvals" ON public.approvals;
DROP POLICY IF EXISTS "Users can view portfolio vendors" ON public.vendors;
DROP POLICY IF EXISTS "Users can view portfolio audit logs" ON public.audit_log;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Portfolios
CREATE POLICY "Users can view assigned portfolios" ON public.portfolios
    FOR SELECT USING (id IN (
        SELECT portfolio_id FROM public.portfolio_users WHERE user_id = auth.uid()
    ));

-- Portfolio Users
CREATE POLICY "Users can view portfolio members" ON public.portfolio_users
    FOR SELECT USING (portfolio_id = ANY(public.user_portfolio_ids()));

-- Properties
CREATE POLICY "Users can view portfolio properties" ON public.properties
    FOR SELECT USING (portfolio_id = ANY(public.user_portfolio_ids()));

CREATE POLICY "Users can insert portfolio properties" ON public.properties
    FOR INSERT WITH CHECK (portfolio_id = ANY(public.user_portfolio_ids()));

CREATE POLICY "Users can update portfolio properties" ON public.properties
    FOR UPDATE USING (portfolio_id = ANY(public.user_portfolio_ids()));

-- Units
CREATE POLICY "Users can view portfolio units" ON public.units
    FOR SELECT USING (portfolio_id = ANY(public.user_portfolio_ids()));

CREATE POLICY "Users can insert portfolio units" ON public.units
    FOR INSERT WITH CHECK (portfolio_id = ANY(public.user_portfolio_ids()));

CREATE POLICY "Users can update portfolio units" ON public.units
    FOR UPDATE USING (portfolio_id = ANY(public.user_portfolio_ids()));

-- Technicians
CREATE POLICY "Users can view portfolio technicians" ON public.technicians
    FOR SELECT USING (portfolio_id = ANY(public.user_portfolio_ids()));

CREATE POLICY "Users can insert portfolio technicians" ON public.technicians
    FOR INSERT WITH CHECK (portfolio_id = ANY(public.user_portfolio_ids()));

CREATE POLICY "Users can update portfolio technicians" ON public.technicians
    FOR UPDATE USING (portfolio_id = ANY(public.user_portfolio_ids()));

-- Work Orders
CREATE POLICY "Users can view portfolio work orders" ON public.work_orders
    FOR SELECT USING (portfolio_id = ANY(public.user_portfolio_ids()));

CREATE POLICY "Users can insert portfolio work orders" ON public.work_orders
    FOR INSERT WITH CHECK (portfolio_id = ANY(public.user_portfolio_ids()));

CREATE POLICY "Users can update portfolio work orders" ON public.work_orders
    FOR UPDATE USING (portfolio_id = ANY(public.user_portfolio_ids()));

-- Messages
CREATE POLICY "Users can view portfolio messages" ON public.messages
    FOR SELECT USING (portfolio_id = ANY(public.user_portfolio_ids()));

CREATE POLICY "Users can insert portfolio messages" ON public.messages
    FOR INSERT WITH CHECK (portfolio_id = ANY(public.user_portfolio_ids()));

CREATE POLICY "Users can update portfolio messages" ON public.messages
    FOR UPDATE USING (portfolio_id = ANY(public.user_portfolio_ids()));

-- Approvals
CREATE POLICY "Users can view portfolio approvals" ON public.approvals
    FOR SELECT USING (portfolio_id = ANY(public.user_portfolio_ids()));

CREATE POLICY "Users can insert portfolio approvals" ON public.approvals
    FOR INSERT WITH CHECK (portfolio_id = ANY(public.user_portfolio_ids()));

CREATE POLICY "Users can update portfolio approvals" ON public.approvals
    FOR UPDATE USING (portfolio_id = ANY(public.user_portfolio_ids()));

-- Vendors
CREATE POLICY "Users can view portfolio vendors" ON public.vendors
    FOR SELECT USING (portfolio_id = ANY(public.user_portfolio_ids()));

CREATE POLICY "Users can insert portfolio vendors" ON public.vendors
    FOR INSERT WITH CHECK (portfolio_id = ANY(public.user_portfolio_ids()));

CREATE POLICY "Users can update portfolio vendors" ON public.vendors
    FOR UPDATE USING (portfolio_id = ANY(public.user_portfolio_ids()));

-- Audit Log
CREATE POLICY "Users can view portfolio audit logs" ON public.audit_log
    FOR SELECT USING (portfolio_id = ANY(public.user_portfolio_ids()));

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- AUDIT TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS audit_work_orders ON public.work_orders;
CREATE TRIGGER audit_work_orders
AFTER INSERT OR UPDATE OR DELETE ON public.work_orders
FOR EACH ROW EXECUTE PROCEDURE public.record_audit_log();

DROP TRIGGER IF EXISTS audit_technicians ON public.technicians;
CREATE TRIGGER audit_technicians
AFTER INSERT OR UPDATE OR DELETE ON public.technicians
FOR EACH ROW EXECUTE PROCEDURE public.record_audit_log();

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_work_orders_portfolio ON public.work_orders(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON public.work_orders(portfolio_id, status);
CREATE INDEX IF NOT EXISTS idx_work_orders_priority ON public.work_orders(portfolio_id, priority);
CREATE INDEX IF NOT EXISTS idx_work_orders_assigned ON public.work_orders(portfolio_id, assigned_technician_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_deadline ON public.work_orders(portfolio_id, deadline_date);
CREATE INDEX IF NOT EXISTS idx_work_orders_scheduled ON public.work_orders(portfolio_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_work_orders_unread ON public.work_orders(portfolio_id, has_unread_messages) WHERE has_unread_messages = true;
CREATE INDEX IF NOT EXISTS idx_work_orders_af_id ON public.work_orders(af_work_order_id) WHERE af_work_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_units_portfolio ON public.units(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_units_property ON public.units(property_id);

CREATE INDEX IF NOT EXISTS idx_messages_portfolio ON public.messages(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_messages_work_order ON public.messages(work_order_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(work_order_id) WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_approvals_pending ON public.approvals(portfolio_id, status) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_technicians_portfolio ON public.technicians(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_technicians_available ON public.technicians(portfolio_id, is_available) WHERE is_available = true;

CREATE INDEX IF NOT EXISTS idx_properties_portfolio ON public.properties(portfolio_id);

-- ============================================================
-- SAMPLE DATA (Optional - uncomment to seed test data)
-- ============================================================

/*
-- Create a test portfolio
INSERT INTO public.portfolios (id, name, code) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Test Portfolio', 'TEST')
ON CONFLICT (id) DO NOTHING;

-- Add current user to portfolio (run after signing up)
-- INSERT INTO public.portfolio_users (portfolio_id, user_id, role)
-- VALUES ('00000000-0000-0000-0000-000000000001', auth.uid(), 'owner');
*/

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================

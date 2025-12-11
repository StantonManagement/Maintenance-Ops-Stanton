-- PRP-01: Data Layer Foundation

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Portfolios
CREATE TABLE IF NOT EXISTS public.portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    appfolio_account_id TEXT,
    subscription_tier TEXT DEFAULT 'standard',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Portfolio Users
CREATE TABLE IF NOT EXISTS public.portfolio_users (
    portfolio_id UUID REFERENCES public.portfolios(id),
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
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id),
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
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id), -- Denormalized
    af_unit_id TEXT,
    unit_number TEXT NOT NULL,
    building_number TEXT,
    floor INT,
    bedrooms INT,
    bathrooms DECIMAL,
    square_feet INT,
    rent_amount DECIMAL,
    is_section_8 BOOLEAN DEFAULT false,
    tenant_id UUID, -- Link to auth.users if they have a login, or just store details below
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
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id),
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
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id),
    property_id UUID NOT NULL REFERENCES public.properties(id),
    unit_id UUID REFERENCES public.units(id),
    af_work_order_id TEXT,
    request_number TEXT,
    description TEXT,
    category TEXT,
    priority TEXT CHECK (priority IN ('emergency', 'high', 'medium', 'low')),
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
    tenant_satisfaction INT,
    first_time_fix BOOLEAN,

    -- Deadline
    deadline_date DATE,
    deadline_type TEXT,
    exposure_amount DECIMAL,

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
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id),
    work_order_id UUID NOT NULL REFERENCES public.work_orders(id),
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
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id),
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
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id),
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
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id),
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

-- Helper Function for RLS
CREATE OR REPLACE FUNCTION public.user_portfolio_ids() 
RETURNS UUID[] AS $$
  SELECT ARRAY_AGG(portfolio_id)
  FROM public.portfolio_users
  WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Enable RLS
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

-- RLS Policies

-- Portfolios: Users can see portfolios they belong to
CREATE POLICY "Users can view assigned portfolios" ON public.portfolios
    FOR SELECT USING (id IN (
        SELECT portfolio_id FROM public.portfolio_users WHERE user_id = auth.uid()
    ));

-- Portfolio Users: Users can see who else is in their portfolios
CREATE POLICY "Users can view portfolio members" ON public.portfolio_users
    FOR SELECT USING (portfolio_id = ANY(public.user_portfolio_ids()));

-- Properties
CREATE POLICY "Users can view portfolio properties" ON public.properties
    FOR SELECT USING (portfolio_id = ANY(public.user_portfolio_ids()));

-- Units
CREATE POLICY "Users can view portfolio units" ON public.units
    FOR SELECT USING (portfolio_id = ANY(public.user_portfolio_ids()));

-- Technicians
CREATE POLICY "Users can view portfolio technicians" ON public.technicians
    FOR SELECT USING (portfolio_id = ANY(public.user_portfolio_ids()));

-- Work Orders
CREATE POLICY "Users can view portfolio work orders" ON public.work_orders
    FOR SELECT USING (portfolio_id = ANY(public.user_portfolio_ids()));

CREATE POLICY "Technicians see only assigned work" ON public.work_orders
    FOR SELECT USING (
        portfolio_id = ANY(public.user_portfolio_ids())
        AND (
            NOT EXISTS (
                SELECT 1 FROM public.portfolio_users
                WHERE user_id = auth.uid()
                AND portfolio_id = public.work_orders.portfolio_id
                AND role = 'technician'
            )
            OR assigned_technician_id = (
                SELECT t.id FROM public.technicians t
                WHERE t.user_id = auth.uid()
                AND t.portfolio_id = public.work_orders.portfolio_id
            )
        )
    );

-- Messages
CREATE POLICY "Users can view portfolio messages" ON public.messages
    FOR SELECT USING (portfolio_id = ANY(public.user_portfolio_ids()));

-- Approvals
CREATE POLICY "Users can view portfolio approvals" ON public.approvals
    FOR SELECT USING (portfolio_id = ANY(public.user_portfolio_ids()));

-- Vendors
CREATE POLICY "Users can view portfolio vendors" ON public.vendors
    FOR SELECT USING (portfolio_id = ANY(public.user_portfolio_ids()));

-- Audit Log
CREATE POLICY "Users can view portfolio audit logs" ON public.audit_log
    FOR SELECT USING (portfolio_id = ANY(public.user_portfolio_ids()));

-- Indexes
CREATE INDEX idx_work_orders_portfolio ON public.work_orders(portfolio_id);
CREATE INDEX idx_units_portfolio ON public.units(portfolio_id);
CREATE INDEX idx_messages_portfolio ON public.messages(portfolio_id);
CREATE INDEX idx_work_orders_status ON public.work_orders(portfolio_id, status);
CREATE INDEX idx_work_orders_priority ON public.work_orders(portfolio_id, priority);
CREATE INDEX idx_work_orders_assigned ON public.work_orders(portfolio_id, assigned_technician_id);
CREATE INDEX idx_work_orders_deadline ON public.work_orders(portfolio_id, deadline_date);
CREATE INDEX idx_approvals_pending ON public.approvals(portfolio_id, status) WHERE status = 'pending';
CREATE INDEX idx_messages_work_order ON public.messages(work_order_id, created_at);
CREATE INDEX idx_work_orders_unread ON public.work_orders(portfolio_id, has_unread_messages) WHERE has_unread_messages = true;
CREATE INDEX idx_work_orders_af_id ON public.work_orders(af_work_order_id) WHERE af_work_order_id IS NOT NULL;

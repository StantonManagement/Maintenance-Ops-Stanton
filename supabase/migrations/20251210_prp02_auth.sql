-- PRP-02: Authentication & Authorization

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

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 2. Trigger to create profile on signup
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

-- Check if trigger exists before creating to avoid errors in repeat runs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    END IF;
END
$$;

-- 3. Update portfolio_users role constraint if needed
-- (PRP-01 might have already created this with check, but reinforcing here)
DO $$
BEGIN
    -- Check if constraint exists, drop it if you want to update it, or just ensure it's there.
    -- For safety, we'll try to add it only if it doesn't exist, or just rely on PRP-01.
    -- PRP-01 SQL had: role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'coordinator', 'admin', 'technician', 'viewer'))
    -- So this is likely covered. But we can add a comment or idempotent check.
    NULL; 
END
$$;

-- 4. Permission Helper Functions

-- Function to check if user has access to portfolio
CREATE OR REPLACE FUNCTION public.check_user_portfolio_access(check_portfolio_id UUID)
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
CREATE OR REPLACE FUNCTION public.get_user_role(check_portfolio_id UUID)
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

-- 5. RLS Policies Updates (Enhancing PRP-01 policies)

-- Work Orders: Ensure users can only update if they have access
-- (Existing PRP-01 policy covers basic select/update based on portfolio_id list)
-- We can add more specific role-based policies if needed, e.g. for DELETE

-- Example: Only owners can delete work orders
CREATE POLICY "Only owners can delete work orders" ON public.work_orders
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.portfolio_users
            WHERE user_id = auth.uid()
            AND portfolio_id = work_orders.portfolio_id
            AND role = 'owner'
        )
    );

-- Audit Log Triggers (Simple version)
-- Create a function to record audit logs
CREATE OR REPLACE FUNCTION public.record_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    user_role_text TEXT;
BEGIN
    -- Try to get role if portfolio_id is present
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

-- Attach audit trigger to work_orders
DROP TRIGGER IF EXISTS audit_work_orders ON public.work_orders;
CREATE TRIGGER audit_work_orders
AFTER INSERT OR UPDATE OR DELETE ON public.work_orders
FOR EACH ROW EXECUTE PROCEDURE public.record_audit_log();

-- Attach audit trigger to technicians
DROP TRIGGER IF EXISTS audit_technicians ON public.technicians;
CREATE TRIGGER audit_technicians
AFTER INSERT OR UPDATE OR DELETE ON public.technicians
FOR EACH ROW EXECUTE PROCEDURE public.record_audit_log();


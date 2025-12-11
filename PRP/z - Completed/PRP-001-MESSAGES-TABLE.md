# PRP-001: Messages Table

## Goal
Create the `messages` table in Supabase to store all work order communications.

## Success Criteria
- [ ] Table exists with correct schema
- [ ] RLS policies allow authenticated access
- [ ] Test insert/select works
- [ ] Index on work_order_id for fast queries

---

## SQL Implementation

```sql
-- ============================================
-- PRP-001: Messages Table
-- Run in Supabase SQL Editor
-- ============================================

-- 1. Create the messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('coordinator', 'technician', 'tenant', 'system')),
  sender_id UUID,
  sender_name TEXT,
  content TEXT NOT NULL,
  translated_content TEXT,
  original_language TEXT DEFAULT 'en',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_work_order_id ON public.messages(work_order_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read) WHERE is_read = FALSE;

-- 3. Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies (permissive for dev, tighten for prod)
CREATE POLICY "Allow all operations for authenticated users"
  ON public.messages
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Helper function: Get message count for a work order
CREATE OR REPLACE FUNCTION get_message_count(wo_id TEXT)
RETURNS TABLE (total_count BIGINT, unread_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_count,
    COUNT(*) FILTER (WHERE is_read = FALSE)::BIGINT as unread_count
  FROM public.messages
  WHERE work_order_id = wo_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Insert test data (optional, remove for prod)
INSERT INTO public.messages (work_order_id, sender_type, sender_name, content, original_language)
VALUES 
  ('WO-001', 'tenant', 'Maria Garcia', 'The faucet is still leaking after the repair', 'en'),
  ('WO-001', 'coordinator', 'Kristine', 'I''ll send a technician back tomorrow morning. Does 9am work?', 'en'),
  ('WO-001', 'tenant', 'Maria Garcia', 'Si, 9am esta bien. Gracias.', 'es'),
  ('WO-002', 'tenant', 'John Smith', 'AC is making a loud noise', 'en'),
  ('WO-003', 'system', 'System', 'Work order created from tenant portal', 'en');
```

---

## Validation

```sql
-- Verify table exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'messages';

-- Verify test data
SELECT * FROM messages ORDER BY created_at DESC LIMIT 10;

-- Verify function works
SELECT * FROM get_message_count('WO-001');
```

---

## Rollback (if needed)

```sql
DROP FUNCTION IF EXISTS get_message_count(TEXT);
DROP TRIGGER IF EXISTS messages_updated_at ON public.messages;
DROP TABLE IF EXISTS public.messages;
```

---

## Next Steps
After this PRP completes:
- PRP-003: Create useMessages hook to fetch this data
- PRP-004: Add message counts to work orders query

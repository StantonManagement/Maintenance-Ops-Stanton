-- ============================================
-- PRP-001: Messages Table
-- ============================================

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

CREATE INDEX IF NOT EXISTS idx_messages_work_order_id ON public.messages(work_order_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read) WHERE is_read = FALSE;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON public.messages
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS messages_updated_at ON public.messages;
CREATE TRIGGER messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ============================================
-- PRP-002: Sidebar Stats Function
-- ============================================

CREATE OR REPLACE FUNCTION get_sidebar_stats()
RETURNS JSON AS $$
DECLARE result JSON;
BEGIN
  SELECT json_build_object(
    'unread_messages', (SELECT COUNT(*) FROM messages WHERE is_read = FALSE),
    'messages_waiting_reply', (
      SELECT COUNT(DISTINCT work_order_id) FROM messages m1
      WHERE m1.sender_type = 'tenant'
      AND m1.created_at = (SELECT MAX(created_at) FROM messages m2 WHERE m2.work_order_id = m1.work_order_id)
    ),
    'total_conversations', (SELECT COUNT(DISTINCT work_order_id) FROM messages),
    'approval_queue', (SELECT COUNT(*) FROM "AF_work_order_new" WHERE "Status" IN ('Ready for Review', 'READY_REVIEW')),
    'new_today', (SELECT COUNT(*) FROM "AF_work_order_new" WHERE DATE("CreatedDate") = CURRENT_DATE),
    'emergency_count', (SELECT COUNT(*) FROM "AF_work_order_new" WHERE "Priority" = 'Emergency' AND "Status" NOT IN ('Completed', 'COMPLETED', 'Cancelled', 'CANCELLED')),
    'in_progress', (SELECT COUNT(*) FROM "AF_work_order_new" WHERE "Status" IN ('In Progress', 'IN_PROGRESS', 'Assigned', 'ASSIGNED'))
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PRP-004: Work Orders with Message Counts View
-- ============================================

CREATE OR REPLACE VIEW v_work_orders_with_messages AS
SELECT 
  wo.*,
  COALESCE(msg_counts.message_count, 0)::INTEGER as message_count,
  COALESCE(msg_counts.unread_count, 0)::INTEGER as unread_count,
  msg_counts.last_message_at
FROM "AF_work_order_new" wo
LEFT JOIN (
  SELECT 
    work_order_id,
    COUNT(*)::INTEGER as message_count,
    COUNT(*) FILTER (WHERE is_read = FALSE)::INTEGER as unread_count,
    MAX(created_at) as last_message_at
  FROM messages
  GROUP BY work_order_id
) msg_counts ON wo."ServiceRequestId"::TEXT = msg_counts.work_order_id;

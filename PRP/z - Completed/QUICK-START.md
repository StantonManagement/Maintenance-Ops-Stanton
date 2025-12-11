# PRP Quick Start - All Outstanding Fixes

## Overview

10 PRPs to fix data flow issues and wire up the messaging system:

| # | Name | Type | Time Est |
|---|------|------|----------|
| 001 | Messages Table | SQL | 15 min |
| 002 | Sidebar Stats | SQL + Hook + UI | 30 min |
| 003 | useMessages Hook | Hook | 30 min |
| 004 | Message Counts | SQL + Hook | 20 min |
| 005 | Conversation Thread | UI | 30 min |
| 006 | Message List Filter | UI | 15 min |
| 007 | Overview Stats | UI | 15 min |
| 008 | Approval Queue | Hook + UI | 45 min |
| 009 | Realtime Messages | Hook | 20 min |
| 010 | Realtime Stats | Hook | 15 min |

**Total: ~4 hours**

---

## Day 1: Foundation SQL (Run All at Once)

Copy this entire block to Supabase SQL Editor:

```sql
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
) msg_counts ON wo."ServiceRequestId" = msg_counts.work_order_id;

-- ============================================
-- Test Data (Optional - Remove for Prod)
-- ============================================

INSERT INTO public.messages (work_order_id, sender_type, sender_name, content, original_language)
VALUES 
  ('2182', 'tenant', 'Maria Garcia', 'The faucet is still leaking after the repair', 'en'),
  ('2182', 'coordinator', 'Kristine', 'I''ll send a technician back tomorrow morning. Does 9am work?', 'en'),
  ('2182', 'tenant', 'Maria Garcia', 'Si, 9am esta bien. Gracias.', 'es')
ON CONFLICT DO NOTHING;
```

**Verify:**
```sql
SELECT get_sidebar_stats();
SELECT * FROM v_work_orders_with_messages WHERE message_count > 0;
```

---

## Day 1: Hooks (Create These Files)

### File 1: `src/hooks/useSidebarStats.ts`
→ See PRP-002

### File 2: `src/hooks/useMessages.ts`  
→ See PRP-003

### File 3: `src/hooks/useApprovalQueue.ts`
→ See PRP-008

---

## Day 2: UI Updates

### Update 1: NavigationSidebar.tsx
- Import `useSidebarStats`
- Replace hardcoded counts with `stats.unreadMessages`, etc.
- Replace overview stats with real data

### Update 2: useWorkOrders.ts
- Change query to use `v_work_orders_with_messages` view
- Or add message_count to transform function

### Update 3: ConversationThread.tsx
- Replace mock data with `useMessageThread` hook
- Wire up send message functionality

### Update 4: WorkOrderList.tsx (Messages view)
- Filter should now work with real message counts

---

## Validation Checklist

After completing all PRPs:

```bash
npm run build  # Must pass
npm run dev    # Must load
```

Visual checks:
- [ ] Sidebar shows real message count (not "4")
- [ ] Messages view shows work orders with messages
- [ ] Clicking a work order shows real conversation
- [ ] Sending a message works
- [ ] Approval queue shows real pending items
- [ ] Overview stats match reality
- [ ] New messages appear without refresh

---

## File Reference

```
PRP/
├── PRP-INDEX-OUTSTANDING.md   # This overview
├── PRP-001-MESSAGES-TABLE.md  # SQL schema
├── PRP-002-SIDEBAR-STATS.md   # Stats hook + RPC
├── PRP-003-USE-MESSAGES-HOOK.md # Messages hook
├── PRP-004-MESSAGE-COUNTS.md  # WO + message counts
├── PRP-005-CONVERSATION-THREAD.md # UI component
├── PRP-006-MESSAGE-LIST-FILTER.md # Filter fix
├── PRP-007-OVERVIEW-STATS.md  # Dashboard stats
├── PRP-008-APPROVAL-QUEUE.md  # Approval page
├── PRP-009-REALTIME-MESSAGES.md # Live messages
└── PRP-010-REALTIME-STATS.md  # Live stats
```

---

## Copy to Project

To use these PRPs, copy the `/home/claude/PRP/` folder to your project's documentation directory.

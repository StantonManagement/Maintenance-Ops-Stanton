# PRP-002: Sidebar Stats

## Goal
Replace hardcoded sidebar counts with real data from Supabase.

## Success Criteria
- [ ] Sidebar shows real unread message count
- [ ] Sidebar shows real "waiting for reply" count
- [ ] Sidebar shows real approval queue count
- [ ] Stats refresh on data changes

---

## Part 1: Supabase RPC Function

```sql
-- ============================================
-- PRP-002: Sidebar Stats Function
-- Run in Supabase SQL Editor
-- ============================================

CREATE OR REPLACE FUNCTION get_sidebar_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'unread_messages', (
      SELECT COUNT(*) FROM messages WHERE is_read = FALSE
    ),
    'messages_waiting_reply', (
      -- Messages where last message is from tenant (coordinator needs to reply)
      SELECT COUNT(DISTINCT work_order_id) 
      FROM messages m1
      WHERE m1.sender_type = 'tenant'
      AND m1.created_at = (
        SELECT MAX(created_at) 
        FROM messages m2 
        WHERE m2.work_order_id = m1.work_order_id
      )
    ),
    'total_conversations', (
      SELECT COUNT(DISTINCT work_order_id) FROM messages
    ),
    'approval_queue', (
      SELECT COUNT(*) 
      FROM "AF_work_order_new" 
      WHERE "Status" IN ('Ready for Review', 'READY_REVIEW')
    ),
    'new_today', (
      SELECT COUNT(*) 
      FROM "AF_work_order_new" 
      WHERE DATE("CreatedDate") = CURRENT_DATE
    ),
    'emergency_count', (
      SELECT COUNT(*) 
      FROM "AF_work_order_new" 
      WHERE "Priority" = 'Emergency' 
      AND "Status" NOT IN ('Completed', 'COMPLETED', 'Cancelled', 'CANCELLED')
    ),
    'in_progress', (
      SELECT COUNT(*) 
      FROM "AF_work_order_new" 
      WHERE "Status" IN ('In Progress', 'IN_PROGRESS', 'Assigned', 'ASSIGNED')
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

---

## Part 2: React Hook

**Create file:** `src/hooks/useSidebarStats.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SidebarStats {
  unreadMessages: number;
  messagesWaitingReply: number;
  totalConversations: number;
  approvalQueue: number;
  newToday: number;
  emergencyCount: number;
  inProgress: number;
}

const defaultStats: SidebarStats = {
  unreadMessages: 0,
  messagesWaitingReply: 0,
  totalConversations: 0,
  approvalQueue: 0,
  newToday: 0,
  emergencyCount: 0,
  inProgress: 0,
};

export function useSidebarStats() {
  const [stats, setStats] = useState<SidebarStats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const { data, error: rpcError } = await supabase.rpc('get_sidebar_stats');
      
      if (rpcError) throw rpcError;
      
      if (data) {
        setStats({
          unreadMessages: data.unread_messages || 0,
          messagesWaitingReply: data.messages_waiting_reply || 0,
          totalConversations: data.total_conversations || 0,
          approvalQueue: data.approval_queue || 0,
          newToday: data.new_today || 0,
          emergencyCount: data.emergency_count || 0,
          inProgress: data.in_progress || 0,
        });
      }
    } catch (err) {
      console.error('Error fetching sidebar stats:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch stats'));
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return { stats, loading, error, refetch };
}
```

---

## Part 3: Update NavigationSidebar.tsx

**Find and replace the hardcoded values:**

```typescript
// BEFORE (around line 165-171):
// Static "4" and "3 waiting for reply"

// AFTER:
import { useSidebarStats } from '@/hooks/useSidebarStats';

// Inside component:
const { stats, loading } = useSidebarStats();

// Replace hardcoded badge with:
<Badge>{loading ? '...' : stats.unreadMessages}</Badge>

// Replace "3 waiting for reply" with:
<span className="text-xs text-muted-foreground">
  {stats.messagesWaitingReply} waiting for reply
</span>

// For approval queue badge:
<Badge variant="warning">{stats.approvalQueue}</Badge>
```

**Specific changes to NavigationSidebar.tsx:**

```typescript
// Add import at top
import { useSidebarStats } from '@/hooks/useSidebarStats';

// Inside NavigationSidebar component, add:
const { stats } = useSidebarStats();

// Find the Messages nav item (around line 165) and change:
// FROM: badge: "4"
// TO: badge: stats.unreadMessages.toString()

// Find the "waiting for reply" text and change:
// FROM: "3 waiting for reply"
// TO: `${stats.messagesWaitingReply} waiting for reply`

// Find the Approval Queue badge and change:
// FROM: badge: "2" (or whatever hardcoded)
// TO: badge: stats.approvalQueue.toString()
```

---

## Part 4: Update Today's Overview Stats

**In the overview card section of NavigationSidebar.tsx:**

```typescript
// Replace hardcoded stats with:
<div className="grid grid-cols-2 gap-2 text-sm">
  <div>
    <span className="text-muted-foreground">New Today</span>
    <span className="font-medium ml-2">{stats.newToday}</span>
  </div>
  <div>
    <span className="text-muted-foreground">Emergency</span>
    <span className="font-medium ml-2 text-red-500">{stats.emergencyCount}</span>
  </div>
  <div>
    <span className="text-muted-foreground">In Progress</span>
    <span className="font-medium ml-2">{stats.inProgress}</span>
  </div>
  <div>
    <span className="text-muted-foreground">Pending Review</span>
    <span className="font-medium ml-2 text-amber-500">{stats.approvalQueue}</span>
  </div>
</div>
```

---

## Validation

```bash
# 1. Build check
npm run build

# 2. Dev server
npm run dev

# 3. Visual check:
# - Sidebar message count should reflect actual message count
# - "waiting for reply" should show correct number
# - Approval queue should match work orders in Ready for Review status
# - Overview stats should show real numbers
```

```sql
-- Verify RPC returns data
SELECT get_sidebar_stats();
```

---

## Rollback

```sql
DROP FUNCTION IF EXISTS get_sidebar_stats();
```

```bash
# Revert NavigationSidebar.tsx changes via git
git checkout src/components/NavigationSidebar.tsx
```

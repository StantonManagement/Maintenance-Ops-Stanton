# PRP-010: Real-Time Sidebar Stats

## Goal
Update sidebar stats in real-time when work orders or messages change.

## Dependencies
- PRP-002 (useSidebarStats hook)

## Success Criteria
- [ ] Message count updates when new message arrives
- [ ] Approval queue count updates when status changes
- [ ] No manual refresh needed
- [ ] Efficient (doesn't re-fetch too often)

---

## Approach Options

### Option A: Subscribe to Table Changes (Recommended)
Listen for changes to `messages` and `AF_work_order_new` tables, then refetch stats.

### Option B: Compute Stats Client-Side
Subscribe to raw data changes and compute counts locally.

### Option C: Hybrid
Subscribe and debounce refetch calls.

---

## Implementation (Option A - Recommended)

**Update `src/hooks/useSidebarStats.ts`:**

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

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
  const channelRef = useRef<RealtimeChannel | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

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
      setError(null);
    } catch (err) {
      console.error('Error fetching sidebar stats:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch stats'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced refetch to avoid hammering the DB
  const debouncedRefetch = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchStats();
    }, 500); // Wait 500ms after last change
  }, [fetchStats]);

  const refetch = useCallback(() => {
    setLoading(true);
    fetchStats();
  }, [fetchStats]);

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('sidebar-stats')
      // Listen for message changes
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'messages',
        },
        () => {
          console.log('Messages changed, refreshing stats');
          debouncedRefetch();
        }
      )
      // Listen for work order changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'AF_work_order_new',
        },
        () => {
          console.log('Work orders changed, refreshing stats');
          debouncedRefetch();
        }
      )
      .subscribe((status) => {
        console.log(`Sidebar stats subscription: ${status}`);
      });

    channelRef.current = channel;

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [debouncedRefetch]);

  return { stats, loading, error, refetch };
}
```

---

## Enable Real-Time on Work Orders Table

```sql
-- If AF_work_order_new isn't in real-time publication:
ALTER PUBLICATION supabase_realtime ADD TABLE "AF_work_order_new";
```

**Note:** If `AF_work_order_new` is a VIEW (not a table), real-time won't work directly. You'd need to:
1. Subscribe to the underlying table(s)
2. Or use a trigger to notify on changes
3. Or poll instead of using real-time

---

## Alternative: Polling Fallback

If real-time doesn't work for the work orders table:

```typescript
// In useSidebarStats.ts

useEffect(() => {
  fetchStats();
  
  // Poll every 30 seconds as fallback
  const pollInterval = setInterval(fetchStats, 30000);
  
  // Real-time for messages only (more reliable)
  const channel = supabase
    .channel('sidebar-messages')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'messages',
    }, debouncedRefetch)
    .subscribe();

  return () => {
    clearInterval(pollInterval);
    supabase.removeChannel(channel);
  };
}, [fetchStats, debouncedRefetch]);
```

---

## Visual Feedback for Updates

**Add a subtle animation when counts change:**

```typescript
// In NavigationSidebar.tsx

const prevStats = useRef(stats);
const [recentlyUpdated, setRecentlyUpdated] = useState<Set<string>>(new Set());

useEffect(() => {
  const updated = new Set<string>();
  
  if (stats.unreadMessages !== prevStats.current.unreadMessages) {
    updated.add('messages');
  }
  if (stats.approvalQueue !== prevStats.current.approvalQueue) {
    updated.add('approvals');
  }
  
  if (updated.size > 0) {
    setRecentlyUpdated(updated);
    setTimeout(() => setRecentlyUpdated(new Set()), 2000);
  }
  
  prevStats.current = stats;
}, [stats]);

// In the badge:
<Badge 
  className={cn(
    recentlyUpdated.has('messages') && 'animate-pulse'
  )}
>
  {stats.unreadMessages}
</Badge>
```

---

## Validation

```bash
npm run build
npm run dev

# Test real-time stats:
# 1. Note current message count in sidebar
# 2. Insert a message via SQL or another tab
# 3. Sidebar count should update within ~1 second
# 4. Same test for approval queue - change a work order status

# SQL test:
INSERT INTO messages (work_order_id, sender_type, sender_name, content)
VALUES ('WO-001', 'tenant', 'Test', 'This should update the count');
```

---

## Performance Considerations

1. **Debouncing is critical** - Multiple rapid changes shouldn't cause multiple fetches
2. **RPC is efficient** - Single query for all stats vs multiple queries
3. **Consider caching** - If stats don't need to be instant, cache for 5-10 seconds
4. **Monitor DB load** - Real-time + frequent RPC calls can add up at scale

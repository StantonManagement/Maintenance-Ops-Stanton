# PRP-P1-03: Sidebar Stats (Real Counts)

## Goal
Wire up the sidebar badge counts to show real data instead of hardcoded numbers.

## Success Criteria
- [ ] Messages badge shows count of unread messages
- [ ] Approval Queue badge shows count of assignments in ready_for_review status
- [ ] Counts update in real-time via Supabase subscriptions
- [ ] Badges animate when counts change
- [ ] Zero counts hide the badge (don't show "0")

---

## Context

**Files involved:**
- `src/components/NavigationSidebar.tsx` - Sidebar with nav items
- `src/hooks/useMessages.ts` - Messages data
- `src/hooks/useApprovals.ts` - Approvals data
- New: `src/hooks/useSidebarStats.ts` - Centralized stats hook

**Current state:**
- Badge numbers are hardcoded
- No real-time updates
- Messages system shows fake data

**Data sources:**
- Unread messages: `messages` table WHERE `is_read = false` AND recipient is coordinator
- Pending approvals: `work_order_assignments` WHERE `status = 'ready_for_review'`

---

## Tasks

### Task 1: Create Sidebar Stats Hook

CREATE `src/hooks/useSidebarStats.ts`:

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface SidebarStats {
  unreadMessages: number;
  pendingApprovals: number;
  loading: boolean;
}

export function useSidebarStats(): SidebarStats {
  const [stats, setStats] = useState<SidebarStats>({
    unreadMessages: 0,
    pendingApprovals: 0,
    loading: true,
  });

  // Initial fetch
  useEffect(() => {
    async function fetchStats() {
      const [messagesResult, approvalsResult] = await Promise.all([
        supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('is_read', false)
          .eq('sender_type', 'tenant'), // Only tenant messages need coordinator attention
        
        supabase
          .from('work_order_assignments')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'ready_for_review'),
      ]);

      setStats({
        unreadMessages: messagesResult.count || 0,
        pendingApprovals: approvalsResult.count || 0,
        loading: false,
      });
    }

    fetchStats();
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    // Subscribe to messages changes
    const messagesChannel = supabase
      .channel('sidebar-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        async () => {
          // Re-fetch count on any change
          const { count } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('is_read', false)
            .eq('sender_type', 'tenant');
          
          setStats(prev => ({ ...prev, unreadMessages: count || 0 }));
        }
      )
      .subscribe();

    // Subscribe to assignments changes
    const approvalsChannel = supabase
      .channel('sidebar-approvals')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'work_order_assignments',
        },
        async () => {
          const { count } = await supabase
            .from('work_order_assignments')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'ready_for_review');
          
          setStats(prev => ({ ...prev, pendingApprovals: count || 0 }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(approvalsChannel);
    };
  }, []);

  return stats;
}
```

### Task 2: Create Animated Badge Component

CREATE `src/components/ui/animated-badge.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedBadgeProps {
  count: number;
  variant?: 'default' | 'warning' | 'critical';
  className?: string;
}

export function AnimatedBadge({ count, variant = 'default', className }: AnimatedBadgeProps) {
  const [prevCount, setPrevCount] = useState(count);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (count !== prevCount) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setPrevCount(count);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [count, prevCount]);

  if (count === 0) return null;

  const variantStyles = {
    default: 'bg-blue-600',
    warning: 'bg-amber-500',
    critical: 'bg-red-600',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'min-w-[20px] h-5 px-1.5 rounded-full',
        'text-xs font-bold text-white',
        variantStyles[variant],
        isAnimating && 'animate-pulse scale-110',
        'transition-transform duration-200',
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
```

### Task 3: Update Navigation Sidebar

MODIFY `src/components/NavigationSidebar.tsx`:

```typescript
import { useSidebarStats } from '@/hooks/useSidebarStats';
import { AnimatedBadge } from '@/components/ui/animated-badge';

export function NavigationSidebar() {
  const { unreadMessages, pendingApprovals, loading } = useSidebarStats();

  // ... existing sidebar code

  return (
    <nav>
      {/* ... other nav items */}
      
      <NavItem 
        to="/messages" 
        icon={MessageSquare}
        label="Messages"
        badge={
          <AnimatedBadge 
            count={unreadMessages} 
            variant="default" 
          />
        }
      />
      
      <NavItem 
        to="/approval-queue" 
        icon={CheckCircle}
        label="Approval Queue"
        badge={
          <AnimatedBadge 
            count={pendingApprovals} 
            variant={pendingApprovals > 5 ? 'warning' : 'default'}
          />
        }
      />
      
      {/* ... other nav items */}
    </nav>
  );
}

// NavItem component if it doesn't exist
interface NavItemProps {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: React.ReactNode;
}

function NavItem({ to, icon: Icon, label, badge }: NavItemProps) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent"
    >
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5" />
        <span>{label}</span>
      </div>
      {badge}
    </Link>
  );
}
```

### Task 4: Add Loading Skeleton

For initial load, show skeleton badges:

```typescript
{loading ? (
  <span className="w-5 h-5 rounded-full bg-muted animate-pulse" />
) : (
  <AnimatedBadge count={unreadMessages} />
)}
```

---

## Validation

```bash
# Type check
npx tsc --noEmit

# Build
npm run build

# Manual testing:
# 1. Load app - badges should show real counts
# 2. Create a new message (or mark one unread) - badge updates
# 3. Approve an assignment - approval count decreases
# 4. Count of 0 - badge hidden
# 5. Count change - badge animates briefly
```

---

## Database Notes

If `messages` table doesn't exist or is empty, the hook will return 0 for unread messages. This is correct behavior - PRP-P1-05 (Messages Wiring) will populate real message data.

For now, you can test with:

```sql
-- Insert test messages
INSERT INTO messages (work_order_id, sender_type, content, is_read)
SELECT 
  id,
  'tenant',
  'Test message from tenant',
  false
FROM work_orders
LIMIT 3;
```

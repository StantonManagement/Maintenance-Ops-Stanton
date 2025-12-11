# PRP-007: Overview Stats

## Goal
Wire the "Today's Overview" stats in the sidebar to show real data.

## Dependencies
- PRP-002 (useSidebarStats hook) provides the data

## Success Criteria
- [ ] "New Requests" shows actual count from today
- [ ] "In Progress" shows actual count
- [ ] "Emergency" shows actual emergency work orders
- [ ] "Pending Review" shows actual approval queue count

---

## Current State

The overview card shows hardcoded numbers:

```typescript
// HARDCODED:
New Requests: 12
In Progress: 8
Emergency: 2
Completed: 5
```

---

## Implementation

**The stats are already available from `useSidebarStats` (PRP-002).**

**Update `NavigationSidebar.tsx`:**

Find the Today's Overview section and replace with:

```typescript
// Import the hook (should already be imported from PRP-002)
import { useSidebarStats } from '@/hooks/useSidebarStats';

// Inside the component
const { stats, loading: statsLoading } = useSidebarStats();

// Find the overview stats section and update:
<Card className="mx-3 mb-4">
  <CardHeader className="pb-2">
    <CardTitle className="text-sm font-medium">Today's Overview</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 gap-3 text-sm">
      <StatItem 
        label="New Today" 
        value={stats.newToday} 
        loading={statsLoading}
      />
      <StatItem 
        label="In Progress" 
        value={stats.inProgress}
        loading={statsLoading}
      />
      <StatItem 
        label="Emergency" 
        value={stats.emergencyCount}
        loading={statsLoading}
        variant="danger"
      />
      <StatItem 
        label="Pending Review" 
        value={stats.approvalQueue}
        loading={statsLoading}
        variant="warning"
      />
    </div>
  </CardContent>
</Card>
```

---

## StatItem Component

**Create a small helper component:**

```typescript
interface StatItemProps {
  label: string;
  value: number;
  loading?: boolean;
  variant?: 'default' | 'danger' | 'warning' | 'success';
}

function StatItem({ label, value, loading, variant = 'default' }: StatItemProps) {
  const valueColor = {
    default: 'text-foreground',
    danger: 'text-red-500',
    warning: 'text-amber-500',
    success: 'text-green-500',
  }[variant];

  return (
    <div className="flex flex-col">
      <span className="text-muted-foreground text-xs">{label}</span>
      {loading ? (
        <span className="text-lg font-semibold animate-pulse">--</span>
      ) : (
        <span className={cn("text-lg font-semibold", valueColor)}>
          {value}
        </span>
      )}
    </div>
  );
}
```

---

## Enhanced Version with Trends (Optional)

If you want to show comparison to yesterday:

```sql
-- Add to get_sidebar_stats() function:
'new_yesterday', (
  SELECT COUNT(*) 
  FROM "AF_work_order_new" 
  WHERE DATE("CreatedDate") = CURRENT_DATE - INTERVAL '1 day'
),
```

```typescript
// In the UI:
<StatItem 
  label="New Today" 
  value={stats.newToday}
  trend={stats.newToday - stats.newYesterday}
/>

// With trend indicator:
function StatItem({ label, value, trend }: StatItemProps) {
  return (
    <div>
      <span className="text-muted-foreground text-xs">{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-lg font-semibold">{value}</span>
        {trend !== undefined && trend !== 0 && (
          <span className={cn(
            "text-xs",
            trend > 0 ? "text-red-500" : "text-green-500"
          )}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}
          </span>
        )}
      </div>
    </div>
  );
}
```

---

## Validation

```bash
npm run build
npm run dev

# Check:
# 1. Overview stats show numbers (not hardcoded)
# 2. Numbers change when work orders are created/updated
# 3. Loading state shows briefly then resolves
```

```sql
-- Verify the data matches UI
SELECT 
  (SELECT COUNT(*) FROM "AF_work_order_new" WHERE DATE("CreatedDate") = CURRENT_DATE) as new_today,
  (SELECT COUNT(*) FROM "AF_work_order_new" WHERE "Status" IN ('In Progress', 'IN_PROGRESS')) as in_progress,
  (SELECT COUNT(*) FROM "AF_work_order_new" WHERE "Priority" = 'Emergency' AND "Status" NOT IN ('Completed', 'Cancelled')) as emergency,
  (SELECT COUNT(*) FROM "AF_work_order_new" WHERE "Status" IN ('Ready for Review', 'READY_REVIEW')) as pending_review;
```

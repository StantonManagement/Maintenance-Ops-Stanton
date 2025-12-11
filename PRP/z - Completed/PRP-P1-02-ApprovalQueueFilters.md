# PRP-P1-02: Approval Queue Filters

## Goal
Make the "Oldest First" sorting and "Over 12h" filter functional on the Approval Queue page.

## Success Criteria
- [ ] "Oldest First" sorts assignments by how long they've been in ready_for_review status
- [ ] "Over 12h" filters to show only assignments waiting >12 hours for review
- [ ] Default sort is oldest first (FIFO - first in, first out)
- [ ] Visual badge shows count of items over 12h
- [ ] Database has `status_changed_at` field for accurate tracking

---

## Context

**Files involved:**
- `src/pages/ApprovalsPage.tsx` or `src/components/ApprovalQueue.tsx`
- `src/hooks/useApprovals.ts` or similar
- Supabase: `work_order_assignments` table

**Current state:**
- Approval queue shows assignments with status = 'ready_for_review'
- Sorting/filtering buttons exist but don't function
- No timestamp tracking when status changed

**Key insight:**
- Approval queue shows ASSIGNMENTS not work orders
- Each tech's work is approved independently
- Need `status_changed_at` to know how long it's been waiting

---

## Tasks

### Task 1: Add Database Field

RUN in Supabase SQL Editor:

```sql
-- Add timestamp for status changes
ALTER TABLE work_order_assignments 
ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill existing rows (use updated_at as approximation)
UPDATE work_order_assignments 
SET status_changed_at = COALESCE(updated_at, created_at)
WHERE status_changed_at IS NULL;

-- Create trigger to auto-update on status change
CREATE OR REPLACE FUNCTION update_assignment_status_changed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_changed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS assignment_status_change_trigger ON work_order_assignments;

CREATE TRIGGER assignment_status_change_trigger
  BEFORE UPDATE ON work_order_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_assignment_status_changed_at();
```

### Task 2: Update Types

MODIFY `src/types/index.ts`:

```typescript
export interface WorkOrderAssignment {
  id: string;
  work_order_id: string;
  technician_id: string;
  scheduled_date: string | null;
  scheduled_time_start: string | null;
  scheduled_time_end: string | null;
  status: 'scheduled' | 'in_progress' | 'ready_for_review' | 'completed' | 'cancelled';
  status_changed_at: string; // ISO timestamp
  created_at: string;
  updated_at: string;
  // Joined data
  work_order?: WorkOrder;
  technician?: Technician;
}
```

### Task 3: Create/Update Approvals Hook

CREATE or MODIFY `src/hooks/useApprovals.ts`:

```typescript
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { WorkOrderAssignment } from '@/types';

interface UseApprovalsOptions {
  sortOldestFirst?: boolean;
  filterOver12h?: boolean;
}

export function useApprovals(options: UseApprovalsOptions = {}) {
  const [assignments, setAssignments] = useState<WorkOrderAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchApprovals() {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('work_order_assignments')
        .select(`
          *,
          work_order:work_orders(*),
          technician:technicians(id, name, phone)
        `)
        .eq('status', 'ready_for_review')
        .order('status_changed_at', { ascending: true }); // Oldest first by default
      
      if (error) {
        setError(error);
      } else {
        setAssignments(data || []);
      }
      setLoading(false);
    }

    fetchApprovals();
  }, []);

  // Computed values
  const filteredAssignments = useMemo(() => {
    let result = [...assignments];
    
    if (options.filterOver12h) {
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
      result = result.filter(a => a.status_changed_at < twelveHoursAgo);
    }
    
    if (options.sortOldestFirst) {
      result.sort((a, b) => 
        new Date(a.status_changed_at).getTime() - new Date(b.status_changed_at).getTime()
      );
    }
    
    return result;
  }, [assignments, options.filterOver12h, options.sortOldestFirst]);

  const over12hCount = useMemo(() => {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    return assignments.filter(a => a.status_changed_at < twelveHoursAgo).length;
  }, [assignments]);

  return {
    assignments: filteredAssignments,
    allAssignments: assignments,
    over12hCount,
    loading,
    error,
    refetch: () => { /* trigger re-fetch */ }
  };
}
```

### Task 4: Update Approval Queue UI

MODIFY the approval queue page/component:

```typescript
export function ApprovalQueue() {
  const [sortOldestFirst, setSortOldestFirst] = useState(true);
  const [filterOver12h, setFilterOver12h] = useState(false);
  
  const { assignments, over12hCount, loading } = useApprovals({
    sortOldestFirst,
    filterOver12h,
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Approval Queue</h1>
          <p className="text-muted-foreground">
            {assignments.length} assignments waiting for review
          </p>
        </div>
        
        {/* Filter controls */}
        <div className="flex gap-2">
          <Button
            variant={sortOldestFirst ? "default" : "outline"}
            size="sm"
            onClick={() => setSortOldestFirst(!sortOldestFirst)}
          >
            <Clock className="h-4 w-4 mr-1" />
            Oldest First
          </Button>
          
          <Button
            variant={filterOver12h ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterOver12h(!filterOver12h)}
            className={filterOver12h ? "bg-amber-600 hover:bg-amber-700" : ""}
          >
            <AlertTriangle className="h-4 w-4 mr-1" />
            Over 12h
            {over12hCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {over12hCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>
      
      {/* Assignment cards */}
      <div className="space-y-4">
        {assignments.map(assignment => (
          <ApprovalCard 
            key={assignment.id} 
            assignment={assignment}
            waitTime={formatWaitTime(assignment.status_changed_at)}
            isUrgent={isOver12h(assignment.status_changed_at)}
          />
        ))}
      </div>
    </div>
  );
}

// Helper functions
function formatWaitTime(statusChangedAt: string): string {
  const hours = Math.floor(
    (Date.now() - new Date(statusChangedAt).getTime()) / (1000 * 60 * 60)
  );
  if (hours < 1) return 'Less than 1 hour';
  if (hours < 24) return `${hours} hours`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''}`;
}

function isOver12h(statusChangedAt: string): boolean {
  const twelveHoursAgo = Date.now() - 12 * 60 * 60 * 1000;
  return new Date(statusChangedAt).getTime() < twelveHoursAgo;
}
```

### Task 5: Update Approval Card to Show Wait Time

MODIFY the approval card component:

```tsx
interface ApprovalCardProps {
  assignment: WorkOrderAssignment;
  waitTime: string;
  isUrgent: boolean;
  onApprove: () => void;
  onReject: () => void;
}

function ApprovalCard({ assignment, waitTime, isUrgent, onApprove, onReject }: ApprovalCardProps) {
  return (
    <Card className={isUrgent ? "border-amber-500 border-2" : ""}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              {assignment.work_order?.id}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {assignment.work_order?.propertyAddress} • {assignment.work_order?.unit}
            </p>
            <p className="text-sm">
              Tech: {assignment.technician?.name}
            </p>
          </div>
          <div className="text-right">
            <Badge variant={isUrgent ? "destructive" : "secondary"}>
              <Clock className="h-3 w-3 mr-1" />
              {waitTime}
            </Badge>
          </div>
        </div>
      </CardHeader>
      {/* ... rest of card */}
    </Card>
  );
}
```

---

## Validation

```bash
# Type check
npx tsc --noEmit

# Build
npm run build

# Manual testing:
# 1. Navigate to /approval-queue
# 2. Verify assignments sorted oldest first by default
# 3. Toggle "Over 12h" - only stale items show
# 4. Badge shows correct count
# 5. Wait time displays on each card
# 6. Urgent items (>12h) have visual distinction
```

---

## Edge Cases

- No assignments in ready_for_review → Show "All caught up!" message
- All items < 12h old → "Over 12h" filter shows empty state
- Assignment just changed status → status_changed_at is fresh
- Multiple techs on same work order → Each shows separately

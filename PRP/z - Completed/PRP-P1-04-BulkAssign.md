# PRP-P1-04: Bulk Assign

## Goal
Enable selecting multiple work orders and assigning them all to a single technician in one action.

## Success Criteria
- [ ] Checkbox on each work order row for selection
- [ ] "Select All" checkbox in header
- [ ] "Bulk Assign" button shows when 1+ work orders selected
- [ ] Modal opens with technician picker
- [ ] Shows technician capacity (current load / max)
- [ ] Warning if assignment would exceed capacity
- [ ] Creates assignments for all selected work orders
- [ ] Success toast with count
- [ ] Selection clears after successful assignment

---

## Context

**Files involved:**
- `src/components/WorkOrderList.tsx` - Main list with bulk actions
- `src/hooks/useTechnicians.ts` - Technician data with capacity
- `src/hooks/useWorkOrders.ts` - Work order data
- New: `src/components/BulkAssignModal.tsx`

**Current state:**
- "Bulk Assign" button exists but only logs to console
- No selection mechanism on work order rows
- Assignment creation logic exists for single assignments

**Business rules:**
- Max 6 assignments per technician per day
- Can override with reason (handled separately)
- Only unassigned or reassignable work orders can be bulk assigned

---

## Tasks

### Task 1: Add Selection State

MODIFY `src/components/WorkOrderList.tsx`:

```typescript
import { useState, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';

export function WorkOrderList() {
  const { workOrders } = useWorkOrders();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);

  // Toggle single selection
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle all
  const toggleAll = () => {
    if (selectedIds.size === workOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(workOrders.map(wo => wo.id)));
    }
  };

  // Clear selection
  const clearSelection = () => setSelectedIds(new Set());

  const selectedWorkOrders = useMemo(
    () => workOrders.filter(wo => selectedIds.has(wo.id)),
    [workOrders, selectedIds]
  );

  // ... rest of component
}
```

### Task 2: Add Checkboxes to Table

MODIFY the work order table/list rendering:

```tsx
// Table header
<TableHead className="w-12">
  <Checkbox
    checked={selectedIds.size === workOrders.length && workOrders.length > 0}
    onCheckedChange={toggleAll}
    aria-label="Select all"
  />
</TableHead>

// Table row
<TableCell>
  <Checkbox
    checked={selectedIds.has(workOrder.id)}
    onCheckedChange={() => toggleSelection(workOrder.id)}
    aria-label={`Select work order ${workOrder.id}`}
  />
</TableCell>
```

### Task 3: Show Bulk Action Bar

ADD floating action bar when items selected:

```tsx
{selectedIds.size > 0 && (
  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
    <div className="bg-background border rounded-lg shadow-lg p-4 flex items-center gap-4">
      <span className="text-sm font-medium">
        {selectedIds.size} selected
      </span>
      
      <Button
        variant="default"
        onClick={() => setBulkAssignOpen(true)}
      >
        <UserPlus className="h-4 w-4 mr-2" />
        Bulk Assign
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={clearSelection}
      >
        Clear
      </Button>
    </div>
  </div>
)}

<BulkAssignModal
  open={bulkAssignOpen}
  onOpenChange={setBulkAssignOpen}
  workOrders={selectedWorkOrders}
  onSuccess={clearSelection}
/>
```

### Task 4: Create Bulk Assign Modal

CREATE `src/components/BulkAssignModal.tsx`:

```typescript
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, User } from 'lucide-react';
import { toast } from 'sonner';
import { useTechnicians } from '@/hooks/useTechnicians';
import { supabase } from '@/lib/supabase';
import type { WorkOrder, Technician } from '@/types';

interface BulkAssignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrders: WorkOrder[];
  onSuccess: () => void;
}

export function BulkAssignModal({
  open,
  onOpenChange,
  workOrders,
  onSuccess,
}: BulkAssignModalProps) {
  const { technicians } = useTechnicians();
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  const selectedTech = technicians.find(t => t.id === selectedTechId);
  const newLoad = (selectedTech?.current_load || 0) + workOrders.length;
  const wouldExceedCapacity = selectedTech && newLoad > selectedTech.max_daily_workload;

  const handleAssign = async () => {
    if (!selectedTechId) return;

    setAssigning(true);

    try {
      // Create assignments for each work order
      const assignments = workOrders.map(wo => ({
        work_order_id: wo.id,
        technician_id: selectedTechId,
        status: 'scheduled',
        scheduled_date: new Date().toISOString().split('T')[0], // Today
        created_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('work_order_assignments')
        .insert(assignments);

      if (error) throw error;

      // Update technician current_load
      await supabase
        .from('technicians')
        .update({ current_load: newLoad })
        .eq('id', selectedTechId);

      toast.success(`Assigned ${workOrders.length} work orders to ${selectedTech?.name}`);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Bulk assign error:', error);
      toast.error('Failed to assign work orders');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Assign {workOrders.length} Work Order{workOrders.length > 1 ? 's' : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Select a technician to assign all selected work orders:
          </p>

          <RadioGroup
            value={selectedTechId || ''}
            onValueChange={setSelectedTechId}
            className="space-y-2"
          >
            {technicians
              .filter(t => t.status !== 'off_duty')
              .map(tech => {
                const futureLoad = tech.current_load + workOrders.length;
                const atCapacity = tech.current_load >= tech.max_daily_workload;
                const wouldExceed = futureLoad > tech.max_daily_workload;

                return (
                  <div
                    key={tech.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border ${
                      atCapacity ? 'opacity-50 bg-muted' : 'hover:bg-accent'
                    }`}
                  >
                    <RadioGroupItem
                      value={tech.id}
                      id={tech.id}
                      disabled={atCapacity}
                    />
                    <Label
                      htmlFor={tech.id}
                      className="flex-1 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{tech.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={wouldExceed ? 'destructive' : 'secondary'}>
                          {tech.current_load} → {futureLoad} / {tech.max_daily_workload}
                        </Badge>
                        {wouldExceed && (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                    </Label>
                  </div>
                );
              })}
          </RadioGroup>

          {wouldExceedCapacity && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Capacity Warning
                  </p>
                  <p className="text-sm text-amber-700">
                    This will put {selectedTech?.name} over their daily limit.
                    Consider using Override if this is an emergency.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedTechId || assigning}
          >
            {assigning ? 'Assigning...' : `Assign ${workOrders.length} Work Orders`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Task 5: Update Technicians Hook for Capacity

ENSURE `src/hooks/useTechnicians.ts` returns capacity info:

```typescript
export function useTechnicians() {
  // ... existing fetch logic

  // Ensure we're getting current_load and max_daily_workload
  const { data, error } = await supabase
    .from('technicians')
    .select('*')
    .order('name');

  // ... return data
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
# 1. Go to /work-orders
# 2. Click checkbox on 3 work orders
# 3. Floating bar appears with "3 selected"
# 4. Click "Bulk Assign"
# 5. Modal shows technicians with capacity
# 6. Select technician, click Assign
# 7. Toast confirms, selection clears
# 8. Assignments created in database
```

---

## Edge Cases

- No technicians available → Show message "No technicians available"
- All techs at capacity → Disable radio buttons, show warning
- Work order already assigned → Skip or update assignment? (Decision: create new assignment, old one can be cancelled separately)
- Mixed priorities in selection → Proceed anyway (user made deliberate choice)
- Network error during assign → Toast error, keep selection

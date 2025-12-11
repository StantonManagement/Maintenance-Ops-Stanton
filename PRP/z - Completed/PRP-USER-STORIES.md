# PRP: Core User Story Integration

## Goal
Connect all UI actions to actual Supabase persistence. Every user action that should save data must actually save data.

## Success Criteria
- [ ] Work order from AF_work_order_new displays in UI
- [ ] Assigning a work order creates record in `work_order_assignments`
- [ ] Assignment respects capacity limits (server-side)
- [ ] Status changes persist and show in real-time
- [ ] Override action creates audit trail
- [ ] Completion requires coordinator role (enforced)

## Prerequisites
- PRP-DATABASE-SCHEMA completed
- PRP-DATABASE-FUNCTIONS completed

---

## User Story 1: Work Order Display

**Flow:** AppFolio sync → AF_work_order_new → useWorkOrders → UI

### Task 1.1: Verify AF Table Has Data

```sql
-- Run in Supabase SQL Editor
SELECT COUNT(*) FROM "AF_work_order_new";
-- If 0, the AppFolio sync isn't running or table is empty
```

### Task 1.2: Verify Hook Reads Correctly

**File:** `src/hooks/useWorkOrders.ts`

Ensure the hook queries the correct table and transforms data:

```typescript
const { data, error } = await supabase
  .from('AF_work_order_new')
  .select('*')
  .order('CreatedDate', { ascending: false });
```

**Validation:** Open browser DevTools → Network tab → Look for Supabase request to `AF_work_order_new`

### Task 1.3: Add Test Work Order (If AF Table Empty)

If no AppFolio data exists, insert test data for development:

```sql
-- Only run if AF_work_order_new is empty and you need test data
-- Note: This mimics AppFolio structure
INSERT INTO "AF_work_order_new" (
  "ServiceRequestId",
  "Description", 
  "Status",
  "Priority",
  "PropertyCode",
  "UnitNumber",
  "CreatedDate",
  "ResidentName"
) VALUES 
  ('WO-TEST-001', 'Kitchen faucet leaking', 'New', 'High', 'S0021', '205', NOW(), 'Maria Lopez'),
  ('WO-TEST-002', 'AC not cooling', 'New', 'Emergency', 'S0021', '302', NOW(), 'James Wilson'),
  ('WO-TEST-003', 'Garbage disposal jammed', 'New', 'Medium', 'S0045', '101', NOW(), 'Chen Wei');
```

---

## User Story 2: Assign Work Order to Technician

**Flow:** Drag work order → Drop on technician → Check capacity → Create assignment → Update UI

### Task 2.1: Fix DispatchPage performAssignment

**File:** `src/pages/DispatchPage.tsx`

Replace the stubbed `performAssignment` function:

```typescript
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const performAssignment = async (
  workOrderId: string,
  technicianId: string,
  scheduledDate: Date,
  timeSlot?: { start: string; end: string }
) => {
  try {
    // Use the RPC function that enforces capacity
    const { data, error } = await supabase.rpc('assign_work_order', {
      p_work_order_id: workOrderId,
      p_technician_id: technicianId,
      p_scheduled_date: scheduledDate.toISOString().split('T')[0],
      p_scheduled_time_start: timeSlot?.start || null,
      p_scheduled_time_end: timeSlot?.end || null,
      p_assigned_by: 'COORDINATOR' // TODO: Get from auth context
    });

    if (error) {
      throw new Error(error.message);
    }

    const result = data[0];
    
    if (!result.success) {
      toast.error(result.message);
      return false;
    }

    toast.success(`Assigned to technician`);
    
    // Refresh the work orders list
    refetchWorkOrders();
    
    return true;
  } catch (err) {
    console.error('Assignment failed:', err);
    toast.error('Failed to assign work order');
    return false;
  }
};
```

### Task 2.2: Update Drag-Drop Handler

**File:** `src/pages/DispatchPage.tsx` (or wherever drag-drop is handled)

Ensure the drop handler calls the real function:

```typescript
const handleDrop = async (workOrderId: string, technicianId: string, date: Date) => {
  setIsAssigning(true);
  
  const success = await performAssignment(workOrderId, technicianId, date);
  
  if (success) {
    // Remove from unscheduled queue (UI state)
    setUnscheduledOrders(prev => prev.filter(wo => wo.id !== workOrderId));
  }
  
  setIsAssigning(false);
};
```

### Task 2.3: Show Assignment Status on Work Order Cards

**File:** `src/components/WorkOrderCard.tsx`

Add visual indicator when work order is assigned:

```typescript
// Fetch assignment status
const { data: assignment } = await supabase
  .from('work_order_assignments')
  .select('*, technician:technicians(name)')
  .eq('work_order_id', workOrder.serviceRequestId)
  .single();

// In render:
{assignment && (
  <div className="text-sm text-gray-500">
    Assigned to: {assignment.technician.name}
  </div>
)}
```

**Validation:** 
1. Drag a work order to a technician
2. Check Supabase → work_order_assignments table
3. Record should exist with correct work_order_id and technician_id

---

## User Story 3: Capacity Enforcement

**Flow:** Try to assign 7th work order → Server rejects → UI shows error

### Task 3.1: Pre-Check Capacity on Drag Start

**File:** `src/pages/DispatchPage.tsx`

Show visual feedback before drop:

```typescript
const [techCapacities, setTechCapacities] = useState<Map<string, CapacityInfo>>();

// Fetch capacities when date changes
useEffect(() => {
  async function loadCapacities() {
    const capacities = new Map();
    
    for (const tech of technicians) {
      const { data } = await supabase.rpc('check_technician_capacity', {
        p_technician_id: tech.id,
        p_target_date: selectedDate.toISOString().split('T')[0]
      });
      
      if (data?.[0]) {
        capacities.set(tech.id, {
          canAccept: data[0].can_accept,
          current: data[0].current_count,
          max: data[0].max_allowed
        });
      }
    }
    
    setTechCapacities(capacities);
  }
  
  loadCapacities();
}, [selectedDate, technicians]);
```

### Task 3.2: Visual Capacity Indicator

**File:** `src/components/TechnicianColumn.tsx` (or equivalent)

```typescript
const capacity = techCapacities.get(technician.id);

<div className={cn(
  "p-4 rounded-lg border-2",
  capacity?.canAccept 
    ? "border-green-200 bg-green-50" 
    : "border-red-200 bg-red-50"
)}>
  <div className="flex justify-between items-center">
    <span>{technician.name}</span>
    <span className="text-sm">
      {capacity?.current}/{capacity?.max}
    </span>
  </div>
  
  {/* Capacity ring */}
  <div className="w-8 h-8 rounded-full border-4" 
    style={{
      borderColor: capacity?.canAccept ? '#10B981' : '#EF4444',
      background: `conic-gradient(
        currentColor ${(capacity?.current / capacity?.max) * 360}deg,
        transparent 0deg
      )`
    }}
  />
</div>
```

### Task 3.3: Block Drop on Full Technician

```typescript
const handleDragOver = (e: DragEvent, technicianId: string) => {
  const capacity = techCapacities.get(technicianId);
  
  if (!capacity?.canAccept) {
    e.dataTransfer.dropEffect = 'none';
    return;
  }
  
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
};
```

**Validation:**
1. Assign 6 work orders to one technician
2. Try to assign a 7th
3. Should see error toast: "Technician at maximum capacity"
4. Check work_order_assignments - should only have 6 records for that tech/date

---

## User Story 4: Mark Ready for Review (Technician Action)

**Flow:** Technician completes work → Marks ready → Appears in approval queue

### Task 4.1: Create Status Update Function

**File:** `src/hooks/useUpdateWorkOrderStatus.ts` (new file)

```typescript
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function useUpdateWorkOrderStatus() {
  const [loading, setLoading] = useState(false);

  const markReadyForReview = useCallback(async (
    workOrderId: string,
    technicianId: string,
    notes?: string
  ) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('mark_ready_for_review', {
        p_work_order_id: workOrderId,
        p_technician_id: technicianId,
        p_notes: notes || null
      });

      if (error) throw new Error(error.message);
      
      const result = data[0];
      
      if (result.success) {
        toast.success('Marked ready for coordinator review');
      } else {
        toast.error(result.message);
      }
      
      return result.success;
    } catch (err) {
      toast.error('Failed to update status');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { markReadyForReview, loading };
}
```

### Task 4.2: Add Button to Work Order Detail

**File:** `src/components/WorkOrderDetail.tsx`

```typescript
import { useUpdateWorkOrderStatus } from '@/hooks/useUpdateWorkOrderStatus';

// In component:
const { markReadyForReview, loading } = useUpdateWorkOrderStatus();

// In render (only show if current user is the assigned technician):
{isAssignedTechnician && status === 'in_progress' && (
  <Button
    onClick={() => markReadyForReview(workOrder.id, currentUser.id)}
    disabled={loading}
  >
    {loading ? 'Updating...' : 'Mark Ready for Review'}
  </Button>
)}
```

**Validation:**
1. As technician, click "Mark Ready for Review"
2. Check work_order_assignments.notes contains "[READY FOR REVIEW]"
3. Work order appears in approval queue

---

## User Story 5: Coordinator Approves Completion

**Flow:** Coordinator reviews → Approves → Work order closed → Audit logged

### Task 5.1: Create Completion Function

**File:** `src/hooks/useCompleteWorkOrder.ts` (new file)

```typescript
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function useCompleteWorkOrder() {
  const [loading, setLoading] = useState(false);

  const completeWorkOrder = useCallback(async (
    workOrderId: string,
    approvedBy: string,
    approverRole: string,
    notes?: string
  ) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('complete_work_order', {
        p_work_order_id: workOrderId,
        p_approved_by: approvedBy,
        p_approver_role: approverRole,
        p_completion_notes: notes || null
      });

      if (error) throw new Error(error.message);
      
      const result = data[0];
      
      if (result.success) {
        toast.success('Work order completed');
      } else {
        toast.error(result.message);
      }
      
      return result.success;
    } catch (err) {
      toast.error('Failed to complete work order');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const rejectWorkOrder = useCallback(async (
    workOrderId: string,
    rejectedBy: string,
    reason: string
  ) => {
    setLoading(true);
    
    try {
      // Update assignment back to in_progress with rejection note
      const { error } = await supabase
        .from('work_order_assignments')
        .update({
          notes: supabase.sql`notes || E'\n[REJECTED] ' || ${reason}`,
          updated_at: new Date().toISOString()
        })
        .eq('work_order_id', workOrderId);

      if (error) throw new Error(error.message);
      
      // Log rejection
      await supabase.from('audit_logs').insert({
        entity_type: 'work_order',
        entity_id: workOrderId,
        action: 'rejected',
        actor: rejectedBy,
        metadata: { reason }
      });
      
      toast.warning('Work order sent back for rework');
      return true;
    } catch (err) {
      toast.error('Failed to reject work order');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { completeWorkOrder, rejectWorkOrder, loading };
}
```

### Task 5.2: Update Approval Queue Page

**File:** `src/pages/ApprovalQueuePage.tsx`

```typescript
import { useCompleteWorkOrder } from '@/hooks/useCompleteWorkOrder';

// Fetch pending approvals from view
const { data: pendingApprovals } = await supabase
  .from('v_pending_approvals')
  .select('*')
  .order('hours_waiting', { ascending: false });

// In component:
const { completeWorkOrder, rejectWorkOrder, loading } = useCompleteWorkOrder();

const handleApprove = async (workOrderId: string) => {
  await completeWorkOrder(
    workOrderId,
    currentUser.name,
    currentUser.role, // Must be 'coordinator' or higher
    approvalNotes
  );
  refetch();
};

const handleReject = async (workOrderId: string, reason: string) => {
  await rejectWorkOrder(workOrderId, currentUser.name, reason);
  refetch();
};
```

### Task 5.3: Enforce Role Check in UI

```typescript
// Only show approve button if user has coordinator role
{currentUser.role === 'coordinator' && (
  <div className="flex gap-2">
    <Button variant="destructive" onClick={() => setShowRejectModal(true)}>
      Request Rework
    </Button>
    <Button onClick={() => handleApprove(workOrder.id)}>
      Approve & Complete
    </Button>
  </div>
)}

{currentUser.role === 'technician' && (
  <p className="text-sm text-gray-500">
    Waiting for coordinator approval
  </p>
)}
```

**Validation:**
1. As coordinator, open approval queue
2. Click "Approve & Complete"
3. Check work_order_assignments.status = 'completed'
4. Check audit_logs has completion record
5. Try same action as technician - should be blocked

---

## User Story 6: Emergency Override

**Flow:** Manager pulls tech → System logs override → Coordinator notified → Displaced WOs flagged

### Task 6.1: Create Override UI

**File:** `src/components/OverrideModal.tsx` (new file)

```typescript
import { useState } from 'react';
import { useRecordOverride } from '@/hooks/useRecordOverride';

interface OverrideModalProps {
  technician: Technician;
  onClose: () => void;
  onSuccess: () => void;
}

export function OverrideModal({ technician, onClose, onSuccess }: OverrideModalProps) {
  const [reason, setReason] = useState<'emergency' | 'turnover' | 'inspection' | 'other'>('emergency');
  const [detail, setDetail] = useState('');
  const { recordOverride, loading } = useRecordOverride();

  const handleSubmit = async () => {
    const result = await recordOverride(
      technician.id,
      'Dean', // TODO: Get from auth context
      reason,
      detail
    );

    if (result.success) {
      onSuccess();
      onClose();
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Emergency Override: {technician.name}</DialogTitle>
          <DialogDescription>
            This will mark the technician as unavailable and flag their scheduled work for reassignment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectItem value="emergency">Emergency</SelectItem>
              <SelectItem value="turnover">Unit Turnover</SelectItem>
              <SelectItem value="inspection">Inspection</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </Select>
          </div>

          <div>
            <Label>Details</Label>
            <Textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Describe the situation..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            variant="destructive" 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Recording...' : 'Confirm Override'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Task 6.2: Add Override Button to Technician Card

**File:** `src/components/TechnicianCard.tsx`

```typescript
const [showOverrideModal, setShowOverrideModal] = useState(false);

// In render:
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreVertical className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => setShowOverrideModal(true)}>
      <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
      Emergency Override
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

{showOverrideModal && (
  <OverrideModal
    technician={technician}
    onClose={() => setShowOverrideModal(false)}
    onSuccess={() => refetchTechnicians()}
  />
)}
```

**Validation:**
1. Click override on a technician with scheduled work
2. Check override_history table has new record
3. Check work_order_assignments - displaced orders marked 'cancelled'
4. Check technicians - status changed to 'busy'
5. Toast shows count of displaced work orders

---

## Integration Test Checklist

Run through this manually after implementing:

```
□ 1. Work order visible
   - Open /work-orders
   - See at least one work order from AF_work_order_new
   
□ 2. Assignment works
   - Drag work order to technician (in /dispatch)
   - Check Supabase: work_order_assignments has new record
   
□ 3. Capacity enforced
   - Assign 6 orders to one tech
   - 7th assignment fails with error
   
□ 4. Ready for review
   - Click "Mark Ready for Review" on assigned order
   - Order appears in /approvals
   
□ 5. Completion restricted
   - As technician: Approve button should not appear
   - As coordinator: Approve button works, status changes
   
□ 6. Override logged
   - Click override on technician
   - Check override_history, audit_logs tables
   - Displaced orders have 'cancelled' status
```

---

## Files Created/Modified Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/DispatchPage.tsx` | MODIFY | Real assignment function |
| `src/hooks/useUpdateWorkOrderStatus.ts` | CREATE | Mark ready for review |
| `src/hooks/useCompleteWorkOrder.ts` | CREATE | Coordinator completion |
| `src/hooks/useRecordOverride.ts` | MODIFY | Already in previous PRP |
| `src/components/OverrideModal.tsx` | CREATE | Override UI |
| `src/components/TechnicianCard.tsx` | MODIFY | Add override button |
| `src/pages/ApprovalQueuePage.tsx` | MODIFY | Real approval actions |

---

## Anti-Patterns to Avoid
- ❌ Don't update UI state without confirming database write succeeded
- ❌ Don't show success toast before async operation completes
- ❌ Don't trust client-side role checks alone (server enforces too)
- ❌ Don't forget to refetch after mutations
- ❌ Don't leave console.log assignment stubs in production

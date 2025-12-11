# PRP-008: Approval Queue

## Goal
Wire the Approval Queue view to show real work orders in "Ready for Review" status.

## Dependencies
- None (uses existing work orders data)

## Success Criteria
- [ ] Shows only work orders with status "Ready for Review"
- [ ] Approve/Reject actions work
- [ ] Status updates in real-time
- [ ] Badge count matches actual queue size

---

## Data Source

Work orders in "Ready for Review" status from `AF_work_order_new` table:

```sql
SELECT * FROM "AF_work_order_new" 
WHERE "Status" IN ('Ready for Review', 'READY_REVIEW', 'ready_review');
```

---

## Part 1: useApprovalQueue Hook

**Create file:** `src/hooks/useApprovalQueue.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { WorkOrder } from '@/types';

const REVIEW_STATUSES = ['Ready for Review', 'READY_REVIEW', 'ready_review'];

function transformWorkOrder(row: any): WorkOrder {
  return {
    id: row.ServiceRequestId,
    title: row.Description,
    description: row.Description,
    status: row.Status,
    priority: row.Priority,
    propertyCode: row.PropertyCode,
    propertyAddress: row.PropertyAddress,
    unit: row.Unit,
    residentName: row.ResidentName,
    assignee: row.Assignee,
    createdDate: row.CreatedDate,
    messageCount: 0,
    unreadCount: 0,
  };
}

export function useApprovalQueue() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('AF_work_order_new')
        .select('*')
        .in('Status', REVIEW_STATUSES)
        .order('CreatedDate', { ascending: false });

      if (fetchError) throw fetchError;

      setWorkOrders((data || []).map(transformWorkOrder));
      setError(null);
    } catch (err) {
      console.error('Error fetching approval queue:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch'));
    } finally {
      setLoading(false);
    }
  }, []);

  const approveWorkOrder = useCallback(async (workOrderId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('AF_work_order_new')
        .update({ Status: 'Completed' })
        .eq('ServiceRequestId', workOrderId);

      if (updateError) throw updateError;

      // Remove from local state
      setWorkOrders(prev => prev.filter(wo => wo.id !== workOrderId));
      
      return true;
    } catch (err) {
      console.error('Error approving work order:', err);
      throw err;
    }
  }, []);

  const rejectWorkOrder = useCallback(async (workOrderId: string, reason: string) => {
    try {
      const { error: updateError } = await supabase
        .from('AF_work_order_new')
        .update({ 
          Status: 'In Progress',
          // If you have a notes/rejection_reason column:
          // rejection_reason: reason
        })
        .eq('ServiceRequestId', workOrderId);

      if (updateError) throw updateError;

      // Remove from local state
      setWorkOrders(prev => prev.filter(wo => wo.id !== workOrderId));
      
      return true;
    } catch (err) {
      console.error('Error rejecting work order:', err);
      throw err;
    }
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    fetchQueue();
  }, [fetchQueue]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  return {
    workOrders,
    loading,
    error,
    queueCount: workOrders.length,
    approveWorkOrder,
    rejectWorkOrder,
    refetch,
  };
}
```

---

## Part 2: Approval Queue View

**Create or update:** `src/pages/ApprovalsPage.tsx`

```typescript
import { useState } from 'react';
import { useApprovalQueue } from '@/hooks/useApprovalQueue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import type { WorkOrder } from '@/types';

export function ApprovalsPage() {
  const { 
    workOrders, 
    loading, 
    error, 
    approveWorkOrder, 
    rejectWorkOrder 
  } = useApprovalQueue();
  
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleApprove = async (wo: WorkOrder) => {
    setProcessing(true);
    try {
      await approveWorkOrder(wo.id);
      toast.success(`Work order ${wo.id} approved`);
    } catch {
      toast.error('Failed to approve work order');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedWO || !rejectReason.trim()) return;
    
    setProcessing(true);
    try {
      await rejectWorkOrder(selectedWO.id, rejectReason);
      toast.success(`Work order ${selectedWO.id} sent back for rework`);
      setRejecting(false);
      setSelectedWO(null);
      setRejectReason('');
    } catch {
      toast.error('Failed to reject work order');
    } finally {
      setProcessing(false);
    }
  };

  const openRejectDialog = (wo: WorkOrder) => {
    setSelectedWO(wo);
    setRejecting(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-8">
        Failed to load approval queue. Please try again.
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Approval Queue</h1>
          <p className="text-muted-foreground">
            {workOrders.length} work orders waiting for review
          </p>
        </div>
      </div>

      {workOrders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <p className="text-lg font-medium">All caught up!</p>
            <p className="text-muted-foreground">
              No work orders pending approval
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {workOrders.map(wo => (
            <ApprovalCard
              key={wo.id}
              workOrder={wo}
              onApprove={() => handleApprove(wo)}
              onReject={() => openRejectDialog(wo)}
              processing={processing}
            />
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejecting} onOpenChange={setRejecting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Rework</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-2">
              Work Order: {selectedWO?.id}
            </p>
            <Textarea
              placeholder="Explain what needs to be fixed..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectReason.trim() || processing}
            >
              Send Back for Rework
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// Approval Card Component
// ============================================

interface ApprovalCardProps {
  workOrder: WorkOrder;
  onApprove: () => void;
  onReject: () => void;
  processing: boolean;
}

function ApprovalCard({ workOrder, onApprove, onReject, processing }: ApprovalCardProps) {
  const waitTime = formatDistanceToNow(new Date(workOrder.createdDate));
  const isUrgent = waitTime.includes('day') || waitTime.includes('hour');

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{workOrder.id}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {workOrder.propertyAddress} • {workOrder.unit}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={workOrder.priority === 'Emergency' ? 'destructive' : 'secondary'}>
              {workOrder.priority}
            </Badge>
            {isUrgent && (
              <Badge variant="outline" className="text-amber-500 border-amber-500">
                <Clock className="h-3 w-3 mr-1" />
                {waitTime}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-4">{workOrder.description}</p>
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Completed by: <span className="font-medium">{workOrder.assignee || 'Unassigned'}</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onReject}
              disabled={processing}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Request Rework
            </Button>
            <Button
              size="sm"
              onClick={onApprove}
              disabled={processing}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve & Complete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ApprovalsPage;
```

---

## Part 3: Add Route

**In `AppRouter.tsx`:**

```typescript
import { ApprovalsPage } from '@/pages/ApprovalsPage';

// Add route:
<Route path="/approvals" element={<ApprovalsPage />} />
```

---

## Validation

```bash
npm run build
npm run dev

# Manual testing:
# 1. Create a work order with status "Ready for Review" in Supabase
# 2. Navigate to /approvals
# 3. Work order should appear
# 4. Click Approve - should disappear and status change to Completed
# 5. Click Reject - dialog should appear, after submit status changes to In Progress
# 6. Sidebar badge should update
```

---

## Note on AF_ Table Write Restrictions

If `AF_work_order_new` is truly READ ONLY (synced from AppFolio), you'll need:

1. **Option A:** Operational status table
   - Create `work_order_status_overrides` table
   - Store local status changes there
   - Join with AF_ table for display

2. **Option B:** Write back to AppFolio
   - API call to update status in AppFolio
   - Let sync bring the change back

For MVP, the code above assumes writes are possible. Adjust based on your actual constraints.

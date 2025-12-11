# PRP-P2-02: Dispatch Board

## Goal
Build a Kanban-style drag-and-drop interface for assigning work orders to technicians.

## Success Criteria
- [ ] Unassigned queue on left shows work orders needing assignment
- [ ] Technician columns show each tech with their current assignments
- [ ] Capacity indicator (3/6) on each technician column
- [ ] Drag work order from queue to technician to assign
- [ ] Drag between technicians to reassign
- [ ] Capacity warning when dropping would exceed limit
- [ ] Override option with reason when exceeding capacity
- [ ] Real-time updates when assignments change

---

## Context

**Files involved:**
- `src/pages/DispatchPage.tsx` - Main dispatch page
- `src/components/dispatch/DispatchBoard.tsx` - Board layout
- `src/components/dispatch/UnassignedQueue.tsx` - Left queue
- `src/components/dispatch/TechnicianColumn.tsx` - Tech column
- `src/components/dispatch/DraggableWorkOrder.tsx` - Draggable card
- Library: `@dnd-kit` (already installed)

**Current state:**
- DispatchPage exists with some UI
- dnd-kit is in package.json
- Assignment creation logic exists

**Business rules:**
- Max 6 assignments per technician per day
- Emergency can override capacity
- Only coordinator can dispatch
- Override requires reason

---

## Tasks

### Task 1: Set Up DnD Context

CREATE `src/components/dispatch/DispatchBoard.tsx`:

```typescript
import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { UnassignedQueue } from './UnassignedQueue';
import { TechnicianColumn } from './TechnicianColumn';
import { WorkOrderCard } from './WorkOrderCard';
import { OverrideDialog } from './OverrideDialog';
import { useDispatchData } from '@/hooks/useDispatchData';
import type { WorkOrder, Technician } from '@/types';

export function DispatchBoard() {
  const {
    unassignedWorkOrders,
    technicians,
    assignmentsByTech,
    loading,
    refetch,
  } = useDispatchData();

  const [activeWorkOrder, setActiveWorkOrder] = useState<WorkOrder | null>(null);
  const [pendingAssignment, setPendingAssignment] = useState<{
    workOrder: WorkOrder;
    technicianId: string;
  } | null>(null);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const workOrder = findWorkOrder(active.id as string);
    setActiveWorkOrder(workOrder || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveWorkOrder(null);

    if (!over) return;

    const workOrderId = active.id as string;
    const targetId = over.id as string;

    // Check if dropped on a technician column
    if (targetId.startsWith('tech-')) {
      const technicianId = targetId.replace('tech-', '');
      const workOrder = findWorkOrder(workOrderId);
      const technician = technicians.find(t => t.id === technicianId);

      if (!workOrder || !technician) return;

      // Check capacity
      const currentLoad = assignmentsByTech[technicianId]?.length || 0;
      if (currentLoad >= technician.max_daily_workload) {
        // Show override dialog
        setPendingAssignment({ workOrder, technicianId });
        setOverrideDialogOpen(true);
        return;
      }

      // Proceed with assignment
      await createAssignment(workOrder.id, technicianId);
    }
  };

  const findWorkOrder = (id: string): WorkOrder | undefined => {
    // Check unassigned
    const unassigned = unassignedWorkOrders.find(wo => wo.id === id);
    if (unassigned) return unassigned;

    // Check assigned
    for (const techId of Object.keys(assignmentsByTech)) {
      const found = assignmentsByTech[techId]?.find(a => a.work_order?.id === id);
      if (found) return found.work_order;
    }
    return undefined;
  };

  const createAssignment = async (
    workOrderId: string,
    technicianId: string,
    overrideReason?: string
  ) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from('work_order_assignments')
        .insert({
          work_order_id: workOrderId,
          technician_id: technicianId,
          scheduled_date: today,
          status: 'scheduled',
        });

      if (error) throw error;

      // Log override if applicable
      if (overrideReason) {
        await supabase.from('override_history').insert({
          technician_id: technicianId,
          work_order_id: workOrderId,
          override_reason: overrideReason,
          override_by: 'coordinator', // TODO: Get actual user
        });
      }

      toast.success('Work order assigned');
      refetch();
    } catch (error) {
      console.error('Assignment error:', error);
      toast.error('Failed to assign work order');
    }
  };

  const handleOverrideConfirm = async (reason: string) => {
    if (pendingAssignment) {
      await createAssignment(
        pendingAssignment.workOrder.id,
        pendingAssignment.technicianId,
        reason
      );
    }
    setOverrideDialogOpen(false);
    setPendingAssignment(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-4 p-4 overflow-x-auto">
        {/* Unassigned Queue */}
        <UnassignedQueue workOrders={unassignedWorkOrders} />

        {/* Technician Columns */}
        {technicians.map(tech => (
          <TechnicianColumn
            key={tech.id}
            technician={tech}
            assignments={assignmentsByTech[tech.id] || []}
          />
        ))}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeWorkOrder && (
          <WorkOrderCard workOrder={activeWorkOrder} isDragging />
        )}
      </DragOverlay>

      {/* Override Dialog */}
      <OverrideDialog
        open={overrideDialogOpen}
        onOpenChange={setOverrideDialogOpen}
        technician={technicians.find(t => t.id === pendingAssignment?.technicianId)}
        onConfirm={handleOverrideConfirm}
        onCancel={() => {
          setOverrideDialogOpen(false);
          setPendingAssignment(null);
        }}
      />
    </DndContext>
  );
}
```

### Task 2: Create Dispatch Data Hook

CREATE `src/hooks/useDispatchData.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { WorkOrder, Technician, WorkOrderAssignment } from '@/types';

interface UseDispatchDataResult {
  unassignedWorkOrders: WorkOrder[];
  technicians: Technician[];
  assignmentsByTech: Record<string, WorkOrderAssignment[]>;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useDispatchData(): UseDispatchDataResult {
  const [unassignedWorkOrders, setUnassignedWorkOrders] = useState<WorkOrder[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [assignmentsByTech, setAssignmentsByTech] = useState<Record<string, WorkOrderAssignment[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch unassigned work orders (no assignment for today)
      const { data: allWOs } = await supabase
        .from('work_orders')
        .select('*')
        .in('status', ['new', 'pending', 'scheduled'])
        .order('priority', { ascending: true });

      // Fetch today's assignments
      const { data: todayAssignments } = await supabase
        .from('work_order_assignments')
        .select(`
          *,
          work_order:work_orders(*),
          technician:technicians(id, name)
        `)
        .eq('scheduled_date', today)
        .not('status', 'eq', 'cancelled');

      // Work orders with today's assignment
      const assignedWOIds = new Set(
        todayAssignments?.map(a => a.work_order_id) || []
      );

      // Filter unassigned
      const unassigned = (allWOs || []).filter(wo => !assignedWOIds.has(wo.id));
      setUnassignedWorkOrders(unassigned);

      // Fetch technicians
      const { data: techData } = await supabase
        .from('technicians')
        .select('*')
        .neq('status', 'off_duty')
        .order('name');

      setTechnicians(techData || []);

      // Group assignments by technician
      const grouped: Record<string, WorkOrderAssignment[]> = {};
      (todayAssignments || []).forEach(assignment => {
        const techId = assignment.technician_id;
        if (!grouped[techId]) grouped[techId] = [];
        grouped[techId].push(assignment);
      });
      setAssignmentsByTech(grouped);

    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('dispatch-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'work_order_assignments' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  return {
    unassignedWorkOrders,
    technicians,
    assignmentsByTech,
    loading,
    error,
    refetch: fetchData,
  };
}
```

### Task 3: Create Unassigned Queue Component

CREATE `src/components/dispatch/UnassignedQueue.tsx`:

```typescript
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Inbox } from 'lucide-react';
import { DraggableWorkOrder } from './DraggableWorkOrder';
import type { WorkOrder } from '@/types';

interface UnassignedQueueProps {
  workOrders: WorkOrder[];
}

export function UnassignedQueue({ workOrders }: UnassignedQueueProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'unassigned-queue',
  });

  const emergencyCount = workOrders.filter(wo => wo.priority === 1).length;

  return (
    <Card
      ref={setNodeRef}
      className={`w-80 flex-shrink-0 flex flex-col ${
        isOver ? 'ring-2 ring-primary' : ''
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Inbox className="h-5 w-5" />
            Unassigned
          </CardTitle>
          <Badge variant="secondary">{workOrders.length}</Badge>
        </div>
        {emergencyCount > 0 && (
          <Badge variant="destructive" className="w-fit">
            {emergencyCount} Emergency
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-2">
        <SortableContext
          items={workOrders.map(wo => wo.id)}
          strategy={verticalListSortingStrategy}
        >
          {workOrders.map(workOrder => (
            <DraggableWorkOrder key={workOrder.id} workOrder={workOrder} />
          ))}
        </SortableContext>
        
        {workOrders.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            All work orders assigned!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### Task 4: Create Technician Column Component

CREATE `src/components/dispatch/TechnicianColumn.tsx`:

```typescript
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { User, AlertTriangle } from 'lucide-react';
import { DraggableWorkOrder } from './DraggableWorkOrder';
import type { Technician, WorkOrderAssignment } from '@/types';

interface TechnicianColumnProps {
  technician: Technician;
  assignments: WorkOrderAssignment[];
}

export function TechnicianColumn({ technician, assignments }: TechnicianColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `tech-${technician.id}`,
  });

  const currentLoad = assignments.length;
  const maxLoad = technician.max_daily_workload || 6;
  const capacityPercent = (currentLoad / maxLoad) * 100;
  const atCapacity = currentLoad >= maxLoad;

  const statusColors: Record<string, string> = {
    available: 'bg-green-500',
    busy: 'bg-amber-500',
    'in-transit': 'bg-blue-500',
    off_duty: 'bg-gray-400',
  };

  return (
    <Card
      ref={setNodeRef}
      className={`w-72 flex-shrink-0 flex flex-col ${
        isOver ? 'ring-2 ring-primary' : ''
      } ${atCapacity ? 'border-amber-500' : ''}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="relative">
              <User className="h-5 w-5" />
              <div
                className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full ${
                  statusColors[technician.status] || 'bg-gray-400'
                }`}
              />
            </div>
            {technician.name}
          </CardTitle>
          <Badge
            variant={atCapacity ? 'destructive' : 'secondary'}
            className="flex items-center gap-1"
          >
            {atCapacity && <AlertTriangle className="h-3 w-3" />}
            {currentLoad}/{maxLoad}
          </Badge>
        </div>
        
        {/* Capacity Bar */}
        <Progress
          value={capacityPercent}
          className="h-1.5"
          indicatorClassName={
            capacityPercent >= 100
              ? 'bg-red-500'
              : capacityPercent >= 80
              ? 'bg-amber-500'
              : 'bg-green-500'
          }
        />
        
        {/* Skills */}
        {technician.skills && technician.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {technician.skills.slice(0, 3).map(skill => (
              <Badge key={skill} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {technician.skills.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{technician.skills.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto space-y-2">
        <SortableContext
          items={assignments.map(a => a.work_order?.id || a.id)}
          strategy={verticalListSortingStrategy}
        >
          {assignments.map(assignment => (
            <DraggableWorkOrder
              key={assignment.id}
              workOrder={assignment.work_order!}
              assignment={assignment}
            />
          ))}
        </SortableContext>
        
        {assignments.length === 0 && (
          <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
            Drop work orders here
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### Task 5: Create Draggable Work Order Card

CREATE `src/components/dispatch/DraggableWorkOrder.tsx`:

```typescript
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WorkOrderCard } from './WorkOrderCard';
import type { WorkOrder, WorkOrderAssignment } from '@/types';

interface DraggableWorkOrderProps {
  workOrder: WorkOrder;
  assignment?: WorkOrderAssignment;
}

export function DraggableWorkOrder({ workOrder, assignment }: DraggableWorkOrderProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: workOrder.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <WorkOrderCard
        workOrder={workOrder}
        assignment={assignment}
        isDragging={isDragging}
      />
    </div>
  );
}
```

### Task 6: Create Work Order Card

CREATE `src/components/dispatch/WorkOrderCard.tsx`:

```typescript
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, AlertTriangle } from 'lucide-react';
import type { WorkOrder, WorkOrderAssignment } from '@/types';

interface WorkOrderCardProps {
  workOrder: WorkOrder;
  assignment?: WorkOrderAssignment;
  isDragging?: boolean;
}

export function WorkOrderCard({ workOrder, assignment, isDragging }: WorkOrderCardProps) {
  const priorityConfig: Record<number, { label: string; color: string }> = {
    1: { label: 'Emergency', color: 'bg-red-600' },
    2: { label: 'High', color: 'bg-amber-500' },
    3: { label: 'Medium', color: 'bg-blue-500' },
    4: { label: 'Low', color: 'bg-green-500' },
    5: { label: 'Cosmetic', color: 'bg-gray-500' },
  };

  const priority = priorityConfig[workOrder.priority] || priorityConfig[3];

  return (
    <Card
      className={`p-3 cursor-grab active:cursor-grabbing ${
        isDragging ? 'shadow-lg ring-2 ring-primary' : ''
      }`}
    >
      {/* Priority Indicator */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l ${priority.color}`} />
      
      <div className="pl-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="font-medium text-sm truncate">
            {workOrder.title || workOrder.id}
          </span>
          {workOrder.priority === 1 && (
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
          {workOrder.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate max-w-[100px]">
              {workOrder.unit || workOrder.property_address}
            </span>
          </div>
          <Badge variant="outline" className="text-xs">
            {priority.label}
          </Badge>
        </div>

        {/* Assignment Time */}
        {assignment?.scheduled_time_start && (
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {assignment.scheduled_time_start}
          </div>
        )}
      </div>
    </Card>
  );
}
```

### Task 7: Create Override Dialog

CREATE `src/components/dispatch/OverrideDialog.tsx`:

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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';
import type { Technician } from '@/types';

interface OverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  technician?: Technician;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function OverrideDialog({
  open,
  onOpenChange,
  technician,
  onConfirm,
  onCancel,
}: OverrideDialogProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason.trim());
      setReason('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Capacity Override Required
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            <strong>{technician?.name}</strong> is already at maximum capacity 
            ({technician?.max_daily_workload || 6} work orders). 
            You can override this limit, but a reason is required.
          </p>

          <div>
            <Label htmlFor="override-reason">Override Reason</Label>
            <Textarea
              id="override-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Emergency repair, tenant complaint, etc."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason.trim()}
          >
            Override & Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Task 8: Update Dispatch Page

MODIFY `src/pages/DispatchPage.tsx`:

```typescript
import { DispatchBoard } from '@/components/dispatch/DispatchBoard';

export function DispatchPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold">Dispatch Board</h1>
        <p className="text-muted-foreground">
          Drag work orders to assign them to technicians
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <DispatchBoard />
      </div>
    </div>
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
# 1. Go to /dispatch
# 2. See unassigned queue on left
# 3. See technician columns with capacity
# 4. Drag work order to tech - assignment created
# 5. Drag to full tech - override dialog appears
# 6. Enter reason, confirm - assignment created with override logged
# 7. Real-time: open second tab, see updates
```

---

## Edge Cases

- No unassigned work orders → Show "All assigned" message
- No technicians available → Show warning
- Technician goes off_duty → Column grays out, can't drop
- Drag cancelled (drop outside) → No change
- Network error on assign → Toast error, card returns to original position

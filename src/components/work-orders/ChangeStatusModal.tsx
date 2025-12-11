import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useWorkOrders } from '@/hooks/useWorkOrders';
import { useRole } from '@/providers/RoleProvider';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Status definitions with colors and role restrictions
const STATUS_CONFIG: Record<string, { label: string; color: string; description: string }> = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-700', description: 'Newly created, not yet reviewed' },
  assigned: { label: 'Assigned', color: 'bg-purple-100 text-purple-700', description: 'Assigned to a technician' },
  scheduled: { label: 'Scheduled', color: 'bg-indigo-100 text-indigo-700', description: 'Scheduled for a specific date/time' },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-700', description: 'Work is currently being done' },
  waiting_parts: { label: 'Waiting Parts', color: 'bg-orange-100 text-orange-700', description: 'Waiting for parts to arrive' },
  waiting_access: { label: 'Waiting Access', color: 'bg-orange-100 text-orange-700', description: 'Cannot access unit, waiting for tenant' },
  ready_review: { label: 'Ready for Review', color: 'bg-cyan-100 text-cyan-700', description: 'Work done, pending coordinator review' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', description: 'Work verified and closed' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-700', description: 'Work order cancelled' },
};

// Valid status transitions
const STATUS_TRANSITIONS: Record<string, string[]> = {
  new: ['assigned', 'cancelled'],
  assigned: ['scheduled', 'in_progress', 'cancelled'],
  scheduled: ['in_progress', 'waiting_access', 'cancelled'],
  in_progress: ['ready_review', 'waiting_parts', 'waiting_access'],
  waiting_parts: ['in_progress', 'cancelled'],
  waiting_access: ['in_progress', 'cancelled'],
  ready_review: ['completed', 'in_progress'], // Coordinator can approve or send back
  completed: [], // Terminal state
  cancelled: [], // Terminal state
};

// Statuses technicians can transition TO
const TECHNICIAN_ALLOWED_STATUSES = ['in_progress', 'ready_review', 'waiting_parts', 'waiting_access'];

interface ChangeStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrderId: string;
  currentStatus: string;
  onStatusChanged?: () => void;
}

export function ChangeStatusModal({
  open,
  onOpenChange,
  workOrderId,
  currentStatus,
  onStatusChanged
}: ChangeStatusModalProps) {
  const { updateWorkOrderStatus } = useWorkOrders();
  const { role } = useRole();
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  // Get valid transitions based on current status
  const validTransitions = STATUS_TRANSITIONS[currentStatus.toLowerCase()] || [];
  
  // Filter by role - technicians have limited options
  const availableStatuses = role === 'technician' 
    ? validTransitions.filter(s => TECHNICIAN_ALLOWED_STATUSES.includes(s))
    : validTransitions;

  // Check if status requires notes
  const requiresNotes = (status: string) => {
    return ['waiting_parts', 'waiting_access', 'cancelled'].includes(status);
  };

  const handleStatusChange = async () => {
    if (!selectedStatus) {
      toast.error('Please select a status');
      return;
    }

    if (requiresNotes(selectedStatus) && !notes.trim()) {
      toast.error('Please provide a reason or notes for this status change');
      return;
    }

    setUpdating(true);
    try {
      await updateWorkOrderStatus(workOrderId, selectedStatus, notes || undefined);
      toast.success(`Status updated to ${STATUS_CONFIG[selectedStatus]?.label || selectedStatus}`);
      onOpenChange(false);
      setSelectedStatus(null);
      setNotes('');
      onStatusChanged?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const currentStatusConfig = STATUS_CONFIG[currentStatus.toLowerCase()];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Change Status</DialogTitle>
          <DialogDescription>
            Current status:{' '}
            <Badge className={cn("ml-1", currentStatusConfig?.color)}>
              {currentStatusConfig?.label || currentStatus}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {availableStatuses.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No status transitions available from this state.</p>
              {role === 'technician' && (
                <p className="text-sm mt-1">Contact a coordinator for further actions.</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Select new status</Label>
              <div className="grid gap-2">
                {availableStatuses.map((status) => {
                  const config = STATUS_CONFIG[status];
                  const isSelected = selectedStatus === status;
                  
                  return (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={cn(
                        "w-full p-3 rounded-lg border text-left transition-all",
                        isSelected 
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge className={cn("text-xs", config?.color)}>
                            {config?.label || status}
                          </Badge>
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                        </div>
                      </div>
                      {config?.description && (
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {config.description}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {selectedStatus && requiresNotes(selectedStatus) && (
            <div className="space-y-2">
              <Label htmlFor="notes">
                {selectedStatus === 'waiting_parts' && 'Parts needed'}
                {selectedStatus === 'waiting_access' && 'Access issue details'}
                {selectedStatus === 'cancelled' && 'Cancellation reason'}
              </Label>
              <Textarea
                id="notes"
                placeholder="Enter details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {selectedStatus && !requiresNotes(selectedStatus) && (
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleStatusChange} 
            disabled={!selectedStatus || updating || availableStatuses.length === 0}
          >
            {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

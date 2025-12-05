import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { WorkOrder } from "../../types";
import { Calendar, Clock, User, AlertTriangle } from "lucide-react";
import { Badge } from "../ui/badge";

interface ScheduleConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  workOrder: WorkOrder;
  technicianName: string;
  date: Date;
  isReschedule?: boolean;
  warnings?: string[];
}

export function ScheduleConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  workOrder,
  technicianName,
  date,
  isReschedule,
  warnings = []
}: ScheduleConfirmModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isReschedule ? 'Reschedule Work Order' : 'Confirm Assignment'}</DialogTitle>
          <DialogDescription>
            Review the details before confirming this schedule.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Work Order Summary */}
          <div className="flex items-start gap-3 p-3 border rounded-md bg-muted/50">
            <div className={`h-2 w-2 mt-2 rounded-full ${getPriorityColor(workOrder.priority)}`} />
            <div>
              <div className="font-medium text-sm">{workOrder.title}</div>
              <div className="text-xs text-muted-foreground">
                {workOrder.propertyCode} · {workOrder.residentName}
              </div>
            </div>
          </div>

          {/* Schedule Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Assign to: <strong>{technicianName}</strong></span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Date: <strong>{date.toLocaleDateString()}</strong></span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Time: <strong>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
            </div>
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="rounded-md bg-yellow-50 p-3 border border-yellow-200">
              <div className="flex items-center gap-2 text-yellow-800 font-medium text-sm mb-1">
                <AlertTriangle className="h-4 w-4" />
                <span>Warnings Detected</span>
              </div>
              <ul className="list-disc list-inside text-xs text-yellow-700 space-y-1">
                {warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onConfirm}>
            {isReschedule ? 'Reschedule' : 'Confirm Schedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'emergency': return 'bg-red-500';
    case 'high': return 'bg-amber-500';
    case 'normal': return 'bg-blue-500';
    case 'low': return 'bg-emerald-500';
    default: return 'bg-slate-500';
  }
}

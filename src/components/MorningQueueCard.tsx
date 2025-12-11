import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { MorningQueueItem } from "../types";
import { DeadlineWarningBadge } from "./DeadlineWarningBadge";
import { AlertCircle, ArrowRight, UserX, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";

interface MorningQueueCardProps {
  item: MorningQueueItem;
  onApproveReschedule: (id: string, date: Date) => void;
  onReassign: (id: string, techId: string) => void;
  onDismiss: (id: string) => void;
}

const REASON_CONFIG = {
  incomplete_yesterday: { label: "Incomplete Yesterday", color: "bg-amber-100 text-amber-800 border-amber-200", icon: Clock },
  sla_overdue: { label: "SLA Overdue", color: "bg-red-100 text-red-800 border-red-200", icon: AlertCircle },
  stuck: { label: "Stuck Work Order", color: "bg-orange-100 text-orange-800 border-orange-200", icon: AlertCircle },
  access_issue: { label: "Access Issue", color: "bg-purple-100 text-purple-800 border-purple-200", icon: UserX },
};

export function MorningQueueCard({ item, onApproveReschedule, onDismiss }: MorningQueueCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { workOrder, queueReason, suggestedAction, suggestedReason } = item;
  const config = REASON_CONFIG[queueReason];
  const Icon = config.icon;

  const handleAction = () => {
    if (suggestedAction === 'reschedule') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      onApproveReschedule(item.id, tomorrow);
    } else {
      // For now just dismiss for other actions in this demo
      onDismiss(item.id);
    }
  };

  return (
    <Card className="mb-3 overflow-hidden border-l-4" style={{ borderLeftColor: queueReason === 'sla_overdue' ? '#ef4444' : '#f59e0b' }}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={`gap-1 ${config.color}`}>
                <Icon className="h-3 w-3" />
                {config.label}
              </Badge>
              <DeadlineWarningBadge 
                hoursUntilBreach={workOrder.hoursUntilSLABreach}
                slaStatus={workOrder.slaStatus}
              />
            </div>
            
            <h3 className="font-medium text-lg">{workOrder.title}</h3>
            <p className="text-sm text-gray-500 mb-2">
              {workOrder.propertyCode} • Unit {workOrder.unit} • {workOrder.residentName}
            </p>
            
            <div className="bg-gray-50 p-3 rounded-md border border-gray-100 mt-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <ArrowRight className="h-4 w-4 text-blue-500" />
                Suggested Action: <span className="capitalize">{suggestedAction}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 pl-6">
                {suggestedReason}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 ml-4">
            <Button size="sm" onClick={handleAction} className="whitespace-nowrap">
              {suggestedAction === 'reschedule' ? 'Approve Reschedule' : 
               suggestedAction === 'reassign' ? 'Reassign Tech' : 'Escalate'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDismiss(item.id)}>
              Dismiss
            </Button>
          </div>
        </div>

        <button 
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-gray-400 mt-3 hover:text-gray-600 transition-colors"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {expanded ? "Hide Details" : "Show Details"}
        </button>
      </div>

      {expanded && (
        <div className="bg-gray-50 p-4 border-t text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-500 block text-xs">Assigned To</span>
              <span className="font-medium">{item.assignedTechnicianName || "Unassigned"}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">Original Schedule</span>
              <span className="font-medium">
                {item.originalScheduledDate ? format(new Date(item.originalScheduledDate), "MMM d, yyyy") : "N/A"}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500 block text-xs">Description</span>
              <p className="text-gray-700 mt-1">{workOrder.description}</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

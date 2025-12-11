import React from 'react';
import { WorkOrder } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { DeadlineCountdown } from '@/components/ui/DeadlineCountdown';
import { StatusBadge } from './StatusBadge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRole } from '@/providers/RoleProvider';

// Extend WorkOrder to include fields that might be joined or computed
export interface WorkOrderWithExtras extends WorkOrder {
  deadline?: string;
  unitRent?: number;
}

interface WorkOrderRowProps {
  workOrder: WorkOrderWithExtras;
  selected: boolean;
  onSelect: () => void;
  onClick: () => void;
  visibleColumns?: string[];
  onAssign?: (workOrderId: string) => void;
  onChangeStatus?: (workOrderId: string) => void;
}

export function WorkOrderRow({
  workOrder,
  selected,
  onSelect,
  onClick,
  visibleColumns,
  onAssign,
  onChangeStatus
}: WorkOrderRowProps) {
  const { canAssignTechnician } = useRole();
  
  // Default visible columns if not provided
  const showColumn = (col: string) => !visibleColumns || visibleColumns.includes(col);

  // Helper to stop propagation for interactive elements
  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleAssignClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAssign?.(workOrder.id);
  };

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChangeStatus?.(workOrder.id);
  };

  return (
    <tr 
      className={cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        selected && "bg-blue-50 hover:bg-blue-50/80 border-l-2 border-l-blue-500"
      )}
      onClick={onClick}
      data-state={selected ? "selected" : undefined}
    >
      {/* Checkbox */}
      <td className="w-10 px-4 py-2" onClick={(e) => { e.stopPropagation(); onSelect(); }}>
        <Checkbox checked={selected} onCheckedChange={() => onSelect()} />
      </td>

      {/* Deadline */}
      {showColumn('deadline') && (
        <td className="px-4 py-2 min-w-[140px]">
          <DeadlineCountdown 
            deadline={workOrder.deadline || null} 
            size="sm"
            exposure={workOrder.unitRent}
            showExposure={true}
          />
        </td>
      )}

      {/* ID */}
      {showColumn('id') && (
        <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
          #{workOrder.workOrderNumber}
        </td>
      )}

      {/* Status */}
      {showColumn('status') && (
        <td className="px-4 py-2">
          <StatusBadge status={workOrder.status} />
        </td>
      )}

      {/* Property/Unit */}
      {showColumn('property') && (
        <td className="px-4 py-2">
          <div className="flex flex-col">
            <span className="font-medium text-sm">{workOrder.propertyCode}</span>
            <span className="text-xs text-muted-foreground">Unit {workOrder.unit}</span>
          </div>
        </td>
      )}

      {/* Description */}
      {showColumn('description') && (
        <td className="px-4 py-2 max-w-[300px]">
          <div className="truncate text-sm font-medium" title={workOrder.title}>
            {workOrder.title}
          </div>
          <div className="truncate text-xs text-muted-foreground" title={workOrder.description}>
            {workOrder.description}
          </div>
        </td>
      )}

      {/* Assignee */}
      {showColumn('assignee') && (
        <td className="px-4 py-2 text-sm">
          {workOrder.assignee || workOrder.assignedTechnicianName ? (
            <span className="text-gray-900">{workOrder.assignedTechnicianName || workOrder.assignee}</span>
          ) : (
            <span className="text-red-500 font-medium text-xs">Unassigned</span>
          )}
        </td>
      )}

      {/* Category */}
      {showColumn('category') && (
        <td className="px-4 py-2 text-sm text-muted-foreground">
          {workOrder.issueDetails?.category || workOrder.aiCategory || '-'}
        </td>
      )}

      {/* Created */}
      {showColumn('created') && (
        <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">
          {format(new Date(workOrder.createdDate), 'MMM d, yyyy')}
        </td>
      )}

      {/* Actions */}
      <td className="px-4 py-2 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={handleAction}>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={handleAction}>
            <DropdownMenuItem onClick={() => onClick()}>View Details</DropdownMenuItem>
            {canAssignTechnician && (
              <DropdownMenuItem onClick={handleAssignClick}>
                {workOrder.assignee ? 'Reassign Technician' : 'Assign Technician'}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleStatusClick}>Change Status</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

import { useState, useRef, useCallback } from "react";
import { ChevronDown, ChevronUp, MoreVertical, MessageSquare, User, Calendar, AlertCircle, GripVertical, Move } from "lucide-react";
import { WorkOrder } from "../types";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface WorkOrderTableProps {
  workOrders: WorkOrder[];
  selectedWorkOrderId?: string;
  onSelectWorkOrder: (workOrder: WorkOrder) => void;
  onSelectMultiple?: (workOrderIds: string[]) => void;
}

type SortField = "id" | "status" | "priority" | "createdDate" | "residentName";
type SortDirection = "asc" | "desc";

interface ColumnWidths {
  checkbox: number;
  id: number;
  status: number;
  description: number;
  property: number;
  resident: number;
  assignee: number;
  priority: number;
  created: number;
  actions: number;
}

export function WorkOrderTable({ 
  workOrders, 
  selectedWorkOrderId, 
  onSelectWorkOrder,
  onSelectMultiple 
}: WorkOrderTableProps) {
  const [sortField, setSortField] = useState<SortField>("createdDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>({
    checkbox: 48,
    id: 100,
    status: 120,
    description: 300,
    property: 150,
    resident: 150,
    assignee: 120,
    priority: 100,
    created: 120,
    actions: 48,
  });
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  const handleResizeStart = useCallback((column: keyof ColumnWidths, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(column);
    startXRef.current = e.clientX;
    startWidthRef.current = columnWidths[column];
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startXRef.current;
      const newWidth = Math.max(50, startWidthRef.current + deltaX);
      setColumnWidths(prev => ({ ...prev, [column]: newWidth }));
    };

    const handleMouseUp = () => {
      setIsResizing(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [columnWidths]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedWorkOrders = [...workOrders].sort((a, b) => {
    let aValue: string | number = a[sortField] || "";
    let bValue: string | number = b[sortField] || "";

    if (sortField === "priority") {
      const priorityOrder = { emergency: 0, high: 1, normal: 2, low: 3 };
      aValue = priorityOrder[a.priority] || 999;
      bValue = priorityOrder[b.priority] || 999;
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const toggleRowSelection = (id: string) => {
    const newSelection = selectedRows.includes(id)
      ? selectedRows.filter((rowId) => rowId !== id)
      : [...selectedRows, id];
    setSelectedRows(newSelection);
    onSelectMultiple?.(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === workOrders.length) {
      setSelectedRows([]);
      onSelectMultiple?.([]);
    } else {
      const allIds = workOrders.map((wo) => wo.id);
      setSelectedRows(allIds);
      onSelectMultiple?.(allIds);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "emergency":
        return "var(--status-critical-icon)";
      case "high":
        return "var(--status-warning-icon)";
      case "normal":
        return "var(--status-neutral-icon)";
      case "low":
        return "var(--text-tertiary)";
      default:
        return "var(--text-tertiary)";
    }
  };

  const getStatusBadge = (status: string, isNew?: boolean, isResidentSubmitted?: boolean) => {
    if (isNew) {
      return (
        <Badge
          className="h-5 px-2 text-[11px]"
          style={{
            backgroundColor: "var(--action-primary)",
            color: "var(--text-inverted)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          NEW
        </Badge>
      );
    }
    
    if (isResidentSubmitted) {
      return (
        <Badge
          className="h-5 px-2 text-[11px]"
          style={{
            backgroundColor: "var(--status-warning-bg)",
            color: "var(--status-warning-text)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          RESIDENT
        </Badge>
      );
    }

    const statusColors: Record<string, { bg: string; text: string }> = {
      "NEW": { bg: "var(--action-primary)", text: "var(--text-inverted)" },
      "ASSIGNED": { bg: "var(--status-success-bg)", text: "var(--status-success-text)" },
      "IN PROGRESS": { bg: "var(--status-warning-bg)", text: "var(--status-warning-text)" },
      "Ready for Review": { bg: "var(--status-warning-bg)", text: "var(--status-warning-text)" },
    };

    const colors = statusColors[status] || { bg: "var(--status-neutral-bg)", text: "var(--status-neutral-text)" };

    return (
      <Badge
        className="h-5 px-2 text-[11px]"
        style={{
          backgroundColor: colors.bg,
          color: colors.text,
          borderRadius: "var(--radius-sm)",
        }}
      >
        {status}
      </Badge>
    );
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown className="h-4 w-4 opacity-0 group-hover:opacity-50" />;
    return sortDirection === "asc" ? 
      <ChevronUp className="h-4 w-4" style={{ color: "var(--action-primary)" }} /> : 
      <ChevronDown className="h-4 w-4" style={{ color: "var(--action-primary)" }} />;
  };

  const ResizableColumnHeader = ({ 
    column, 
    children, 
    sortable = false, 
    onSort 
  }: { 
    column: keyof ColumnWidths; 
    children: React.ReactNode; 
    sortable?: boolean; 
    onSort?: () => void;
  }) => {
    const isCurrentlyResizing = isResizing === column;
    
    return (
      <th 
        className="relative px-4 py-3 text-left select-none group"
        style={{ 
          width: columnWidths[column],
          minWidth: columnWidths[column],
          maxWidth: columnWidths[column],
          backgroundColor: isCurrentlyResizing ? "var(--bg-hover)" : undefined
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 group">
            {sortable && onSort ? (
              <button
                className="flex items-center gap-2 group"
                onClick={onSort}
              >
                {children}
                <SortIcon field={column as SortField} />
              </button>
            ) : (
              children
            )}
          </div>
          <div
            className="absolute right-0 top-0 bottom-0 w-4 cursor-col-resize flex items-center justify-center group border-r border-transparent hover:border-blue-200"
            onMouseDown={(e) => handleResizeStart(column, e)}
            style={{
              backgroundColor: isCurrentlyResizing ? "var(--action-primary)" : "transparent"
            }}
          >
            <div 
              className="w-1 h-8 rounded-full transition-all opacity-30 group-hover:opacity-100"
              style={{
                backgroundColor: isCurrentlyResizing ? "white" : "var(--action-primary)"
              }}
            />
            <div 
              className="absolute right-0 top-0 bottom-0 w-px opacity-0 group-hover:opacity-70"
              style={{
                backgroundColor: "var(--action-primary)"
              }}
            />
          </div>
        </div>
      </th>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto" style={{ backgroundColor: "var(--bg-card)" }}>
        <table ref={tableRef} className="w-full">
          {/* Table Header */}
          <thead className="sticky top-0 z-10" style={{ backgroundColor: "var(--bg-hover)" }}>
            <tr style={{ borderBottom: `1px solid var(--border-default)` }}>
              <ResizableColumnHeader column="checkbox">
                <Checkbox
                  checked={selectedRows.length === workOrders.length && workOrders.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </ResizableColumnHeader>
              <ResizableColumnHeader 
                column="id" 
                sortable 
                onSort={() => handleSort("id")}
              >
                <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>WO ID</span>
              </ResizableColumnHeader>
              <ResizableColumnHeader 
                column="status" 
                sortable 
                onSort={() => handleSort("status")}
              >
                <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>Status</span>
              </ResizableColumnHeader>
              <ResizableColumnHeader column="description">
                <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>Description</span>
              </ResizableColumnHeader>
              <ResizableColumnHeader column="property">
                <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>Property/Unit</span>
              </ResizableColumnHeader>
              <ResizableColumnHeader 
                column="resident" 
                sortable 
                onSort={() => handleSort("residentName")}
              >
                <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>Resident</span>
              </ResizableColumnHeader>
              <ResizableColumnHeader column="assignee">
                <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>Assignee</span>
              </ResizableColumnHeader>
              <ResizableColumnHeader 
                column="priority" 
                sortable 
                onSort={() => handleSort("priority")}
              >
                <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>Priority</span>
              </ResizableColumnHeader>
              <ResizableColumnHeader 
                column="created" 
                sortable 
                onSort={() => handleSort("createdDate")}
              >
                <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>Created</span>
              </ResizableColumnHeader>
              <ResizableColumnHeader column="actions">
                <span></span>
              </ResizableColumnHeader>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {sortedWorkOrders.map((wo) => (
              <tr
                key={wo.id}
                className="cursor-pointer transition-smooth"
                style={{
                  backgroundColor: selectedWorkOrderId === wo.id ? "rgba(37, 99, 235, 0.05)" : "transparent",
                  borderBottom: `1px solid var(--border-default)`,
                  borderLeft: `4px solid ${getPriorityColor(wo.priority)}`,
                }}
                onClick={() => onSelectWorkOrder(wo)}
                onMouseEnter={(e) => {
                  if (selectedWorkOrderId !== wo.id) {
                    e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedWorkOrderId !== wo.id) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                <td 
                  className="px-4 py-4" 
                  style={{ width: columnWidths.checkbox, minWidth: columnWidths.checkbox, maxWidth: columnWidths.checkbox }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={selectedRows.includes(wo.id)}
                    onCheckedChange={() => toggleRowSelection(wo.id)}
                  />
                </td>
                <td 
                  className="px-4 py-4"
                  style={{ width: columnWidths.id, minWidth: columnWidths.id, maxWidth: columnWidths.id }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[13px]" style={{ color: "var(--text-primary)" }}>
                      #{wo.serviceRequestId}
                    </span>
                    {wo.unread && (
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: "var(--action-primary)" }}
                      />
                    )}
                  </div>
                </td>
                <td 
                  className="px-4 py-4"
                  style={{ width: columnWidths.status, minWidth: columnWidths.status, maxWidth: columnWidths.status }}
                >
                  {getStatusBadge(wo.status, wo.isNew, wo.isResidentSubmitted)}
                </td>
                <td 
                  className="px-4 py-4"
                  style={{ width: columnWidths.description, minWidth: columnWidths.description, maxWidth: columnWidths.description }}
                >
                  <div style={{ maxWidth: columnWidths.description - 32 }}>
                    <div className="text-[13px] truncate" style={{ color: "var(--text-primary)" }}>
                      {wo.title}
                    </div>
                    {wo.messageCount && wo.messageCount > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <MessageSquare className="h-3 w-3" style={{ color: "var(--text-tertiary)" }} />
                        <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                          {wo.messageCount} messages
                        </span>
                      </div>
                    )}
                  </div>
                </td>
                <td 
                  className="px-4 py-4"
                  style={{ width: columnWidths.property, minWidth: columnWidths.property, maxWidth: columnWidths.property }}
                >
                  <div className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                    {wo.propertyCode}
                  </div>
                  <div className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>
                    {wo.propertyAddress} · {wo.unit}
                  </div>
                </td>
                <td 
                  className="px-4 py-4"
                  style={{ width: columnWidths.resident, minWidth: columnWidths.resident, maxWidth: columnWidths.resident }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-6 w-6 rounded-full flex items-center justify-center text-[11px]"
                      style={{
                        backgroundColor: "var(--status-neutral-bg)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {wo.residentName[0]}
                    </div>
                    <span className="text-[13px]" style={{ color: "var(--text-primary)" }}>
                      {wo.residentName}
                    </span>
                  </div>
                </td>
                <td 
                  className="px-4 py-4"
                  style={{ width: columnWidths.assignee, minWidth: columnWidths.assignee, maxWidth: columnWidths.assignee }}
                >
                  {wo.assignee ? (
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" style={{ color: "var(--text-tertiary)" }} />
                      <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                        {wo.assignee}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[13px] italic" style={{ color: "var(--text-tertiary)" }}>
                      Unassigned
                    </span>
                  )}
                </td>
                <td 
                  className="px-4 py-4"
                  style={{ width: columnWidths.priority, minWidth: columnWidths.priority, maxWidth: columnWidths.priority }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: getPriorityColor(wo.priority) }}
                    />
                    <span className="text-[13px] capitalize" style={{ color: "var(--text-secondary)" }}>
                      {wo.priority}
                    </span>
                  </div>
                </td>
                <td 
                  className="px-4 py-4"
                  style={{ width: columnWidths.created, minWidth: columnWidths.created, maxWidth: columnWidths.created }}
                >
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" style={{ color: "var(--text-tertiary)" }} />
                    <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                      {wo.createdDate}
                    </span>
                  </div>
                  {wo.createdTime && (
                    <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                      {wo.createdTime}
                    </div>
                  )}
                </td>
                <td 
                  className="px-4 py-4" 
                  style={{ width: columnWidths.actions, minWidth: columnWidths.actions, maxWidth: columnWidths.actions }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Send Message</DropdownMenuItem>
                      <DropdownMenuItem>Reassign</DropdownMenuItem>
                      <DropdownMenuItem>Change Priority</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty State */}
        {workOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12">
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: "var(--bg-hover)" }}
            >
              <AlertCircle className="h-8 w-8" style={{ color: "var(--text-tertiary)" }} />
            </div>
            <h3 className="text-[18px] mb-2" style={{ color: "var(--text-primary)" }}>
              No work orders found
            </h3>
            <p className="text-[14px]" style={{ color: "var(--text-secondary)" }}>
              Work orders will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

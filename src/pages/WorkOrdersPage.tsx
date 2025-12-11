import { useState, useMemo } from "react";
import { useWorkOrders } from "../hooks/useWorkOrders";
import { WorkOrderGrid } from "../components/work-orders/WorkOrderGrid";
import { WorkOrderDetailPanel } from "../components/work-orders/WorkOrderDetailPanel";
import { WorkOrderFilters } from "../components/work-orders/WorkOrderFilters";
import { BulkActionsToolbar } from "../components/work-orders/BulkActionsToolbar";
import { ColumnVisibilityMenu } from "../components/work-orders/ColumnVisibilityMenu";
import { AssignTechnicianModal } from "../components/work-orders/AssignTechnicianModal";
import { ChangeStatusModal } from "../components/work-orders/ChangeStatusModal";
import { useGridKeyboard } from "../hooks/useGridKeyboard";
import { Button } from "@/components/ui/button";
import { Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { WorkOrderWithExtras } from "@/components/work-orders/WorkOrderRow";

const ALL_COLUMNS = [
  { id: 'deadline', label: 'Deadline', visible: true },
  { id: 'id', label: 'ID', visible: true },
  { id: 'status', label: 'Status', visible: true },
  { id: 'property', label: 'Property', visible: true },
  { id: 'description', label: 'Description', visible: true },
  { id: 'assignee', label: 'Assignee', visible: true },
  { id: 'category', label: 'Category', visible: true },
  { id: 'created', label: 'Created', visible: true },
];

export default function WorkOrdersPage() {
  const { workOrders: dbWorkOrders, loading, error, refetch } = useWorkOrders();
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState('deadline');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [columnConfig, setColumnConfig] = useState(ALL_COLUMNS);
  const [filters, setFilters] = useState({ search: '', status: [] as string[], priority: [] as string[], quickFilters: [] as string[] });
  
  // Modal states
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [actionWorkOrderId, setActionWorkOrderId] = useState<string | null>(null);

  // Transform work orders to include deadline string for sorting/display
  const workOrders = useMemo(() => {
    return dbWorkOrders.map(wo => ({
      ...wo,
      deadline: wo.deadlineInfo ? new Date(Date.now() + wo.deadlineInfo.hoursRemaining * 3600000).toISOString() : undefined,
      // Mock unitRent for exposure if not present
      unitRent: 1500 
    })) as WorkOrderWithExtras[];
  }, [dbWorkOrders]);

  // Filter and Sort
  const filteredAndSortedWorkOrders = useMemo(() => {
    let result = workOrders;

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(wo => 
        wo.title.toLowerCase().includes(searchLower) ||
        wo.workOrderNumber.toString().includes(searchLower) ||
        wo.residentName.toLowerCase().includes(searchLower) ||
        wo.propertyAddress.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      result = result.filter(wo => 
        filters.status.includes(wo.status.toLowerCase())
      );
    }

    // Priority filter
    if (filters.priority && filters.priority.length > 0) {
      result = result.filter(wo => 
        filters.priority.includes(wo.priority)
      );
    }

    // Quick filters (combine with AND)
    if (filters.quickFilters && filters.quickFilters.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      filters.quickFilters.forEach(qf => {
        switch (qf) {
          case 'emergency':
            result = result.filter(wo => wo.priority === 'emergency');
            break;
          case 'today':
            result = result.filter(wo => {
              if (!wo.scheduledDate) return false;
              const scheduled = new Date(wo.scheduledDate);
              return scheduled >= today && scheduled <= todayEnd;
            });
            break;
          case 'unread':
            result = result.filter(wo => wo.messageCount && wo.messageCount > 0);
            break;
          case 'unassigned':
            result = result.filter(wo => !wo.assignee && !wo.assignedTechnicianName);
            break;
        }
      });
    }

    // Sort
    return [...result].sort((a, b) => {
      let comparison = 0;
      switch (sortColumn) {
        case 'deadline':
          // Handle nulls
          if (!a.deadline && !b.deadline) comparison = 0;
          else if (!a.deadline) comparison = 1;
          else if (!b.deadline) comparison = -1;
          else comparison = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          break;
        case 'id':
          comparison = a.workOrderNumber - b.workOrderNumber;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'property':
          comparison = a.propertyCode.localeCompare(b.propertyCode);
          break;
        case 'assignee':
           comparison = (a.assignee || '').localeCompare(b.assignee || '');
           break;
        case 'created':
          comparison = new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime();
          break;
        default:
          comparison = 0;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [workOrders, filters, sortColumn, sortDirection]);

  // Handlers
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleColumnVisibility = (columnId: string, visible: boolean) => {
    setColumnConfig(prev => prev.map(col => col.id === columnId ? { ...col, visible } : col));
  };

  const visibleColumns = columnConfig.filter(c => c.visible).map(c => c.id);

  // Bulk Actions
  const handleBulkAssign = async () => {
    // Placeholder logic - normally would open modal
    toast.info(`Assigning ${selectedIds.length} orders... (Mock)`);
    // Example: await assignWorkOrder(selectedIds[0], ...);
    setSelectedIds([]);
  };

  const handleBulkStatus = () => {
    toast.info(`Changing status for ${selectedIds.length} orders... (Mock)`);
    setSelectedIds([]);
  };

  const handleExport = () => {
    toast.success(`Exporting ${selectedIds.length > 0 ? selectedIds.length : 'all'} work orders`);
  };

  // Modal handlers
  const handleOpenAssignModal = (workOrderId: string) => {
    setActionWorkOrderId(workOrderId);
    setAssignModalOpen(true);
  };

  const handleOpenStatusModal = (workOrderId: string) => {
    setActionWorkOrderId(workOrderId);
    setStatusModalOpen(true);
  };

  const handleModalClose = () => {
    setAssignModalOpen(false);
    setStatusModalOpen(false);
    setActionWorkOrderId(null);
  };

  const handleActionComplete = () => {
    handleModalClose();
    refetch();
  };

  // Get the work order for the action modal
  const actionWorkOrder = actionWorkOrderId 
    ? workOrders.find(wo => wo.id === actionWorkOrderId) 
    : null;

  // Keyboard Navigation
  const [focusedId, setFocusedId] = useState<string | null>(null);
  useGridKeyboard({
    selectedIds,
    allIds: filteredAndSortedWorkOrders.map(wo => wo.id),
    onSelectionChange: setSelectedIds,
    onEnter: (id) => setDetailId(id),
    focusedId,
    setFocusedId
  });

  if (loading) return <div className="flex h-full items-center justify-center">Loading work orders...</div>;
  if (error) return <div className="flex h-full items-center justify-center text-red-500">Error: {error.message}</div>;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
        <h1 className="text-2xl font-semibold tracking-tight">Work Orders</h1>
        <div className="flex items-center gap-2">
            <WorkOrderFilters filters={filters} onChange={setFilters} />
            <ColumnVisibilityMenu columns={columnConfig} onChange={handleColumnVisibility} />
            <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export
            </Button>
            <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New
            </Button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
         {/* Bulk Actions */}
         {selectedIds.length > 0 && (
            <BulkActionsToolbar
                selectedCount={selectedIds.length}
                onAssign={handleBulkAssign}
                onChangeStatus={handleBulkStatus}
                onExport={handleExport}
                onClearSelection={() => setSelectedIds([])}
            />
         )}

         {/* Grid */}
         <div className="flex-1 overflow-hidden rounded-md border bg-card shadow-sm">
             <WorkOrderGrid 
                workOrders={filteredAndSortedWorkOrders}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                onRowClick={setDetailId}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
                visibleColumns={visibleColumns}
                onAssign={handleOpenAssignModal}
                onChangeStatus={handleOpenStatusModal}
             />
         </div>
      </div>

      <WorkOrderDetailPanel 
        workOrderId={detailId}
        onClose={() => setDetailId(null)}
      />

      {/* Assign Technician Modal */}
      {actionWorkOrderId && (
        <AssignTechnicianModal
          open={assignModalOpen}
          onOpenChange={(open) => !open && handleModalClose()}
          workOrderId={actionWorkOrderId}
          workOrderCategory={actionWorkOrder?.aiCategory || actionWorkOrder?.issueDetails?.category}
          currentTechnicianId={undefined}
          onAssigned={handleActionComplete}
        />
      )}

      {/* Change Status Modal */}
      {actionWorkOrderId && actionWorkOrder && (
        <ChangeStatusModal
          open={statusModalOpen}
          onOpenChange={(open) => !open && handleModalClose()}
          workOrderId={actionWorkOrderId}
          currentStatus={actionWorkOrder.status}
          onStatusChanged={handleActionComplete}
        />
      )}
    </div>
  );
}

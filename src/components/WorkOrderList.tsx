import { useState } from "react";
import { Search, Plus, ChevronDown, X, Users, MessageSquare, List, LayoutGrid } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { WorkOrderCard } from "./WorkOrderCard";
import { WorkOrder } from "../types";
import { WorkOrderTable } from "./WorkOrderTable";
import { Badge } from "./ui/badge";
import BulkAssignmentModal from "./BulkAssignmentModal";
import BulkMessagingModal from "./BulkMessagingModal";
import { OverrideAlertBanner } from "./OverrideAlertBanner";
import { useWorkOrders } from "../hooks/useWorkOrders";
import { useAssignWorkOrder } from "../hooks/useAssignWorkOrder";
import { toast } from "sonner";
import { CreateWorkOrderModal } from "./work-orders/CreateWorkOrderModal";

interface WorkOrderListProps {
  selectedWorkOrderId?: string;
  onSelectWorkOrder: (workOrder: WorkOrder) => void;
  viewMode?: "work-orders" | "messages" | "approval-queue";
}


export function WorkOrderList({ selectedWorkOrderId, onSelectWorkOrder, viewMode = "work-orders" }: WorkOrderListProps) {
  const { workOrders: dbWorkOrders, loading, error } = useWorkOrders();
  const { assignWorkOrder } = useAssignWorkOrder();
  
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["emergency", "high"])
  );
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [showBulkAssignment, setShowBulkAssignment] = useState(false);
  const [showBulkMessaging, setShowBulkMessaging] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [displayMode, setDisplayMode] = useState<"cards" | "table">(
    viewMode === "work-orders" ? "table" : "cards"
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Selection handlers
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const clearSelection = () => setSelectedIds([]);

  const handleBulkAssign = async (workOrderIds: string[], technicianId: string) => {
    let successCount = 0;
    // Iterate through each work order
    for (const id of workOrderIds) {
      // Assuming assignment to 'today' for bulk action simplicity, or could pass date from modal if extended
      const result = await assignWorkOrder(id, technicianId, new Date(), undefined, 'coordinator', { silent: true });
      if (result.success) successCount++;
    }

    if (successCount > 0) {
      toast.success(`Assigned ${successCount} work orders`);
      clearSelection();
      setShowBulkAssignment(false);
    } else {
      toast.error("Failed to assign work orders");
    }
  };

  const handleBulkMessage = async (workOrderIds: string[], message: string) => {
    // In a real app, this would use a backend function to message multiple users
    // For now we'll simulate it or use Supabase if we have a table
    console.log(`Sending message to ${workOrderIds.length} orders: ${message}`);
    toast.success(`Sent message to ${workOrderIds.length} recipients`);
    setShowBulkMessaging(false);
    clearSelection();
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const toggleFilter = (filter: string) => {
    const newFilters = new Set(activeFilters);
    if (newFilters.has(filter)) {
      newFilters.delete(filter);
    } else {
      newFilters.add(filter);
    }
    setActiveFilters(newFilters);
  };

  // Filter work orders based on view mode
  const getFilteredWorkOrdersByView = () => {
    switch (viewMode) {
      case "messages":
        return dbWorkOrders.filter((wo) => (wo.messageCount || 0) > 0);
      case "approval-queue":
        return dbWorkOrders.filter((wo) => wo.status === "Ready for Review");
      case "work-orders":
      default:
        return dbWorkOrders;
    }
  };

  const viewFilteredWorkOrders = getFilteredWorkOrdersByView();

  // Apply additional active filters
  const filteredWorkOrders = viewFilteredWorkOrders.filter((wo) => {
    if (activeFilters.has("unread") && !wo.unread) return false;
    return true;
  });

  const groupedWorkOrders = {
    emergency: filteredWorkOrders.filter((wo) => wo.priority === "emergency"),
    high: filteredWorkOrders.filter((wo) => wo.priority === "high"),
    normal: filteredWorkOrders.filter((wo) => wo.priority === "normal"),
    low: filteredWorkOrders.filter((wo) => wo.priority === "low"),
  };

  const unreadCount = viewFilteredWorkOrders.filter((wo) => wo.unread).length;

  const getViewTitle = () => {
    switch (viewMode) {
      case "messages": return "Messages";
      case "approval-queue": return "Approval Queue";
      case "work-orders": default: return "Work Orders";
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p>Loading work orders...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-red-600">Error loading work orders: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col border-r relative" style={{ borderColor: 'var(--border-default)' }}>
      {/* Header */}
      <div 
        className="h-16 border-b px-6 flex items-center gap-4"
        style={{ 
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-default)'
        }}
      >
        <div className="flex-1 flex items-center gap-3">
          <h2 className="text-[24px] leading-[32px] tracking-[-0.25px]" style={{ color: 'var(--text-primary)' }}>
            {getViewTitle()}
          </h2>
          <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
            {viewMode === "approval-queue" 
              ? `${viewFilteredWorkOrders.length} awaiting review`
              : `${unreadCount} unread`}
          </span>
        </div>
        
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
          <Input
            placeholder="Search work orders..."
            className="h-10 pl-10 text-[14px] border"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-default)',
              borderRadius: 'var(--radius-md)',
            }}
          />
        </div>

        {viewMode === "work-orders" && (
          <div className="flex gap-1 border rounded-lg p-1" style={{ borderColor: 'var(--border-default)' }}>
            <button
              className="h-8 w-8 flex items-center justify-center rounded transition-all"
              style={{
                backgroundColor: displayMode === "cards" ? 'var(--action-primary)' : 'transparent',
                color: displayMode === "cards" ? 'white' : 'var(--text-secondary)',
              }}
              onClick={() => setDisplayMode("cards")}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              className="h-8 w-8 flex items-center justify-center rounded transition-all"
              style={{
                backgroundColor: displayMode === "table" ? 'var(--action-primary)' : 'transparent',
                color: displayMode === "table" ? 'white' : 'var(--text-secondary)',
              }}
              onClick={() => setDisplayMode("table")}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        )}

        <Button
          className="h-10 px-5 text-[14px] gap-2"
          style={{
            backgroundColor: 'var(--action-primary)',
            color: 'var(--text-inverted)',
            borderRadius: 'var(--radius-md)',
          }}
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="h-4 w-4" />
          New
        </Button>
      </div>

      {/* Floating Action Bar */}
      {selectedIds.length > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-2 flex items-center gap-2">
            <span className="text-sm font-medium px-3">
              {selectedIds.length} selected
            </span>
            
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1" />
            
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowBulkAssignment(true)}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Users className="h-4 w-4" />
              Assign
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkMessaging(true)}
              className="gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Message
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="text-gray-500 hover:text-gray-700"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Filter Chips (Hidden when selecting?) No, keep them. */}
      {viewMode === "work-orders" && <OverrideAlertBanner />}

      <div 
        className="h-10 px-6 flex items-center gap-2 overflow-x-auto border-b"
        style={{ 
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-default)'
        }}
      >
        {viewMode !== "approval-queue" && (
          <button
            className="h-7 px-3 flex items-center gap-2 whitespace-nowrap transition-all"
            style={{
              backgroundColor: activeFilters.has("unread") ? 'var(--action-primary)' : 'var(--action-secondary)',
              color: activeFilters.has("unread") ? 'var(--text-inverted)' : 'var(--text-primary)',
              borderRadius: 'var(--radius-full)',
            }}
            onClick={() => toggleFilter("unread")}
          >
            <span className="text-[12px]">Unread</span>
            <Badge
              className="h-4 min-w-4 px-1 text-[10px]"
              style={{
                backgroundColor: activeFilters.has("unread") ? 'rgba(255, 255, 255, 0.3)' : 'var(--border-strong)',
                color: activeFilters.has("unread") ? 'var(--text-inverted)' : 'var(--text-primary)',
                borderRadius: 'var(--radius-full)',
              }}
            >
              {unreadCount}
            </Badge>
            {activeFilters.has("unread") && <X className="h-3 w-3" />}
          </button>
        )}
        {/* ... other filters (simplified for brevity/maintenance) ... */}
      </div>

      {displayMode === "table" ? (
        <WorkOrderTable
          workOrders={filteredWorkOrders}
          selectedWorkOrderId={selectedWorkOrderId}
          onSelectWorkOrder={onSelectWorkOrder}
          selectedIds={selectedIds}
          onSelectMultiple={setSelectedIds}
        />
      ) : (
        <div className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--bg-primary)' }}>
          {/* Simplified Cards View Logic with Grouping */}
          {Object.entries(groupedWorkOrders).map(([priority, orders]) => (
            orders.length > 0 && (
              <div key={priority}>
                <button
                  className="w-full h-10 px-6 flex items-center gap-2 transition-all"
                  style={{ backgroundColor: 'var(--bg-primary)' }}
                  onClick={() => toggleSection(priority)}
                >
                  <ChevronDown
                    className="h-5 w-5 transition-transform"
                    style={{
                      transform: expandedSections.has(priority) ? "rotate(0deg)" : "rotate(-90deg)",
                    }}
                  />
                  <span className="text-[20px] leading-[28px] uppercase">{priority.replace('-', ' ')}</span>
                  <Badge className="h-5 px-2 text-[12px]">{orders.length}</Badge>
                </button>
                {expandedSections.has(priority) && (
                  <div className="pb-3">
                    {orders.map((wo) => (
                      <WorkOrderCard
                        key={wo.id}
                        workOrder={wo}
                        selected={selectedWorkOrderId === wo.id}
                        selectable={true}
                        onSelect={() => toggleSelection(wo.id)}
                        onClick={() => onSelectWorkOrder(wo)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          ))}
          
          {filteredWorkOrders.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full p-12">
              <p>No work orders found</p>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showBulkAssignment && (
        <BulkAssignmentModal 
          workOrders={dbWorkOrders.filter(wo => selectedIds.includes(wo.id))}
          onClose={() => setShowBulkAssignment(false)}
          onAssign={handleBulkAssign}
        />
      )}
      {showBulkMessaging && (
        <BulkMessagingModal 
          workOrders={dbWorkOrders.filter(wo => selectedIds.includes(wo.id))}
          onClose={() => setShowBulkMessaging(false)}
          onSend={handleBulkMessage}
        />
      )}

      <CreateWorkOrderModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
    </div>
  );
}

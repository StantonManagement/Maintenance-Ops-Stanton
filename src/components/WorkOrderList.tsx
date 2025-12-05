import { useState } from "react";
import { Search, Filter, Plus, ChevronDown, X, Users, MessageSquare, List, LayoutGrid, Lock } from "lucide-react";
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

interface WorkOrderListProps {
  selectedWorkOrderId?: string;
  onSelectWorkOrder: (workOrder: WorkOrder) => void;
  viewMode?: "work-orders" | "messages" | "approval-queue";
}


export function WorkOrderList({ selectedWorkOrderId, onSelectWorkOrder, viewMode = "work-orders" }: WorkOrderListProps) {
  // Use the work orders hook to fetch real data
  const { workOrders: dbWorkOrders, loading, error } = useWorkOrders()
  
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["emergency", "high"])
  );
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [showBulkAssignment, setShowBulkAssignment] = useState(false);
  const [showBulkMessaging, setShowBulkMessaging] = useState(false);
  const [displayMode, setDisplayMode] = useState<"cards" | "table">(
    viewMode === "work-orders" ? "table" : "cards"
  );

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
        // Show only work orders with messages
        return dbWorkOrders.filter((wo) => wo.messageCount && wo.messageCount > 0);
      case "approval-queue":
        // Show only work orders ready for review
        return dbWorkOrders.filter((wo) => wo.status === "Ready for Review");
      case "work-orders":
      default:
        // Show all work orders
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

  // Get title based on view mode
  const getViewTitle = () => {
    switch (viewMode) {
      case "messages":
        return "Messages";
      case "approval-queue":
        return "Approval Queue";
      case "work-orders":
      default:
        return "Work Orders";
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p>Loading work orders...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-red-600">Error loading work orders: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col border-r" style={{ borderColor: 'var(--border-default)' }}>
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

        {/* View Toggle - Only show in work-orders view */}
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
        >
          <Plus className="h-4 w-4" />
          New
        </Button>
      </div>

      {/* Override Alert Banner */}
      {viewMode === "work-orders" && <OverrideAlertBanner />}

      {/* Filter Chips & Bulk Actions */}
      <div 
        className="h-10 px-6 flex items-center gap-2 overflow-x-auto border-b"
        style={{ 
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-default)'
        }}
      >
        {/* Bulk Actions - only show in work-orders view */}
        {viewMode === "work-orders" && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-3 gap-2"
              onClick={() => setShowBulkAssignment(true)}
            >
              <Users size={14} />
              Bulk Assign
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-3 gap-2"
              onClick={() => setShowBulkMessaging(true)}
            >
              <MessageSquare size={14} />
              Bulk Message
            </Button>

            <div className="w-px h-5" style={{ backgroundColor: 'var(--border-default)' }} />
          </>
        )}

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

        {viewMode === "work-orders" && (
          <>
            <button
              className="h-7 px-3 flex items-center gap-1 whitespace-nowrap"
              style={{
                backgroundColor: 'var(--action-secondary)',
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-full)',
              }}
            >
              <span className="text-[12px]">Needs Assignment</span>
              <Badge
                className="h-4 min-w-4 px-1 text-[10px]"
                style={{
                  backgroundColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                3
              </Badge>
            </button>

            <button
              className="h-7 px-3 whitespace-nowrap text-[12px]"
              style={{
                backgroundColor: 'var(--action-secondary)',
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-full)',
              }}
            >
              Emergency
            </button>

            <button
              className="h-7 px-3 whitespace-nowrap text-[12px]"
              style={{
                backgroundColor: 'var(--action-secondary)',
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-full)',
              }}
            >
              Today's Schedule
            </button>

            {/* Override Active Filter */}
            <button
              className="h-7 px-3 flex items-center gap-1 whitespace-nowrap transition-all"
              style={{
                backgroundColor: activeFilters.has("override") ? '#FEF3C7' : 'var(--action-secondary)',
                color: activeFilters.has("override") ? '#D97706' : 'var(--text-primary)',
                borderRadius: 'var(--radius-full)',
                border: activeFilters.has("override") ? '1px solid #F59E0B' : 'none',
              }}
              onClick={() => toggleFilter("override")}
            >
              <span className="text-[12px]">Override Active</span>
              <Badge
                className="h-4 min-w-4 px-1 text-[10px]"
                style={{
                  backgroundColor: activeFilters.has("override") ? 'rgba(217, 119, 6, 0.3)' : 'var(--border-strong)',
                  color: activeFilters.has("override") ? '#D97706' : 'var(--text-primary)',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                2
              </Badge>
              {activeFilters.has("override") && <X className="h-3 w-3" />}
            </button>

            {/* Location Alerts Filter - Phase 2 Locked */}
            <button
              className="h-7 px-3 flex items-center gap-1 whitespace-nowrap relative opacity-60"
              style={{
                backgroundColor: 'var(--action-secondary)',
                color: 'var(--text-secondary)',
                borderRadius: 'var(--radius-full)',
                cursor: 'not-allowed',
              }}
              disabled
              title="Phase 2 Feature - GPS location tracking"
            >
              <Lock className="h-3 w-3" style={{ color: 'var(--phase-2-icon)' }} />
              <span className="text-[12px]">Location Alerts</span>
              <Badge
                className="h-4 min-w-4 px-1 text-[10px]"
                style={{
                  backgroundColor: 'var(--border-strong)',
                  color: 'var(--text-secondary)',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                0
              </Badge>
            </button>
          </>
        )}

        {viewMode === "approval-queue" && (
          <>
            <button
              className="h-7 px-3 whitespace-nowrap text-[12px]"
              style={{
                backgroundColor: 'var(--action-secondary)',
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-full)',
              }}
            >
              Oldest First
            </button>
            <button
              className="h-7 px-3 whitespace-nowrap text-[12px]"
              style={{
                backgroundColor: 'var(--action-secondary)',
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-full)',
              }}
            >
              Over 12h
            </button>
          </>
        )}
      </div>

      {/* Work Order List - Table or Cards */}
      {displayMode === "table" ? (
        <WorkOrderTable
          workOrders={filteredWorkOrders}
          selectedWorkOrderId={selectedWorkOrderId}
          onSelectWorkOrder={onSelectWorkOrder}
        />
      ) : (
        <div className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--bg-primary)' }}>
          {/* Emergency Section */}
          {groupedWorkOrders.emergency.length > 0 && (
            <div>
              <button
                className="w-full h-10 px-6 flex items-center gap-2 transition-all"
                style={{ backgroundColor: 'var(--bg-primary)' }}
                onClick={() => toggleSection("emergency")}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                }}
              >
                <ChevronDown
                  className="h-5 w-5 transition-transform"
                  style={{
                    color: 'var(--status-critical-icon)',
                    transform: expandedSections.has("emergency") ? "rotate(0deg)" : "rotate(-90deg)",
                  }}
                />
                <span className="text-[20px] leading-[28px]" style={{ color: 'var(--status-critical-text)' }}>
                  EMERGENCY
                </span>
                <Badge
                  className="h-5 px-2 text-[12px]"
                  style={{
                    backgroundColor: 'var(--status-critical-bg)',
                    color: 'var(--status-critical-text)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {groupedWorkOrders.emergency.length}
                </Badge>
              </button>
              {expandedSections.has("emergency") && (
                <div className="pb-3">
                  {groupedWorkOrders.emergency.map((wo) => (
                    <WorkOrderCard
                      key={wo.id}
                      workOrder={wo}
                      selected={selectedWorkOrderId === wo.id}
                      onClick={() => onSelectWorkOrder(wo)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* High Priority Section */}
          {groupedWorkOrders.high.length > 0 && (
            <div>
              <button
                className="w-full h-10 px-6 flex items-center gap-2 transition-all"
                style={{ backgroundColor: 'var(--bg-primary)' }}
                onClick={() => toggleSection("high")}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                }}
              >
                <ChevronDown
                  className="h-5 w-5 transition-transform"
                  style={{
                    color: 'var(--status-warning-icon)',
                    transform: expandedSections.has("high") ? "rotate(0deg)" : "rotate(-90deg)",
                  }}
                />
                <span className="text-[20px] leading-[28px]" style={{ color: 'var(--status-warning-text)' }}>
                  HIGH PRIORITY
                </span>
                <Badge
                  className="h-5 px-2 text-[12px]"
                  style={{
                    backgroundColor: 'var(--status-warning-bg)',
                    color: 'var(--status-warning-text)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {groupedWorkOrders.high.length}
                </Badge>
              </button>
              {expandedSections.has("high") && (
                <div className="pb-3">
                  {groupedWorkOrders.high.map((wo) => (
                    <WorkOrderCard
                      key={wo.id}
                      workOrder={wo}
                      selected={selectedWorkOrderId === wo.id}
                      onClick={() => onSelectWorkOrder(wo)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Normal Priority Section */}
          {groupedWorkOrders.normal.length > 0 && (
            <div>
              <button
                className="w-full h-10 px-6 flex items-center gap-2 transition-all"
                style={{ backgroundColor: 'var(--bg-primary)' }}
                onClick={() => toggleSection("normal")}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                }}
              >
                <ChevronDown
                  className="h-5 w-5 transition-transform"
                  style={{
                    color: 'var(--status-neutral-icon)',
                    transform: expandedSections.has("normal") ? "rotate(0deg)" : "rotate(-90deg)",
                  }}
                />
                <span className="text-[20px] leading-[28px]" style={{ color: 'var(--status-neutral-text)' }}>
                  NORMAL
                </span>
                <Badge
                  className="h-5 px-2 text-[12px]"
                  style={{
                    backgroundColor: 'var(--status-neutral-bg)',
                    color: 'var(--status-neutral-text)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {groupedWorkOrders.normal.length}
                </Badge>
              </button>
              {expandedSections.has("normal") && (
                <div className="pb-3">
                  {groupedWorkOrders.normal.map((wo) => (
                    <WorkOrderCard
                      key={wo.id}
                      workOrder={wo}
                      selected={selectedWorkOrderId === wo.id}
                      onClick={() => onSelectWorkOrder(wo)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {filteredWorkOrders.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full p-12">
              <div 
                className="h-16 w-16 rounded-full flex items-center justify-center mb-4"
                style={{
                  backgroundColor: 'var(--bg-hover)',
                }}
              >
                <MessageSquare className="h-8 w-8" style={{ color: 'var(--text-tertiary)' }} />
              </div>
              <h3 className="text-[18px] mb-2" style={{ color: 'var(--text-primary)' }}>
                {viewMode === "messages" && "No messages yet"}
                {viewMode === "approval-queue" && "All caught up!"}
                {viewMode === "work-orders" && "No work orders"}
              </h3>
              <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
                {viewMode === "messages" && "Work orders with message threads will appear here"}
                {viewMode === "approval-queue" && "No work orders awaiting review"}
                {viewMode === "work-orders" && "Work orders will appear here"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showBulkAssignment && (
        <BulkAssignmentModal 
          workOrders={viewFilteredWorkOrders}
          onClose={() => setShowBulkAssignment(false)}
          onAssign={(workOrderIds, technicianId) => {
            console.log('Assign work orders:', workOrderIds, 'to technician:', technicianId);
            // Handle assignment logic here
          }}
        />
      )}
      {showBulkMessaging && (
        <BulkMessagingModal 
          workOrders={viewFilteredWorkOrders}
          onClose={() => setShowBulkMessaging(false)}
          onSend={(workOrderIds, message) => {
            console.log('Send message:', message, 'to work orders:', workOrderIds);
            // Handle messaging logic here
          }}
        />
      )}
    </div>
  );
}

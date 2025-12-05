import { useState } from "react";
import { Search, Building2, Clock, MessageSquare, User } from "lucide-react";
import { WorkOrder } from "../types";
import SwipeableWorkOrderCard from "./SwipeableWorkOrderCard";
import { toast } from "sonner";

interface MobileWorkOrderListProps {
  onSelectWorkOrder: (workOrder: WorkOrder) => void;
  onBulkMessage: () => void;
}

const mockWorkOrders: WorkOrder[] = [
  {
    id: "WO-1234",
    serviceRequestId: "SR-1234",
    workOrderNumber: 1234,
    title: "Kitchen sink leaking - urgent repair",
    description: "Kitchen sink is leaking under the cabinet",
    propertyCode: "BLDA",
    propertyAddress: "Building A",
    unit: "Unit 205",
    residentName: "Maria Lopez",
    originalLanguage: "ES",
    priority: "emergency",
    status: "Waiting for Access",
    createdDate: "2 hours ago",
    unread: true,
    messageCount: 3,
    lastMessage: "Sí, perfecto. Estaré en casa...",
  },
  {
    id: "WO-1235",
    serviceRequestId: "SR-1235",
    workOrderNumber: 1235,
    title: "Broken window in bedroom",
    description: "Bedroom window is cracked",
    propertyCode: "BLDB",
    propertyAddress: "Building B",
    unit: "Unit 104",
    residentName: "James Chen",
    originalLanguage: "EN",
    priority: "high",
    status: "ASSIGNED",
    createdDate: "3 hours ago",
    unread: true,
    messageCount: 2,
    lastMessage: "Thanks, I'll be here all day",
  },
  {
    id: "WO-1236",
    serviceRequestId: "SR-1236",
    workOrderNumber: 1236,
    title: "AC not cooling properly",
    description: "Air conditioning unit not cooling",
    propertyCode: "BLDA",
    propertyAddress: "Building A",
    unit: "Unit 310",
    residentName: "Wei Zhang",
    originalLanguage: "ZH",
    priority: "high",
    status: "IN PROGRESS",
    createdDate: "4 hours ago",
    unread: false,
    messageCount: 5,
    lastMessage: "谢谢你的帮助",
  },
  {
    id: "WO-1237",
    serviceRequestId: "SR-1237",
    workOrderNumber: 1237,
    title: "Light fixture replacement needed",
    description: "Light fixture in living room needs replacement",
    propertyCode: "BLDC",
    propertyAddress: "Building C",
    unit: "Unit 201",
    residentName: "Sarah Johnson",
    originalLanguage: "EN",
    priority: "normal",
    status: "ASSIGNED",
    createdDate: "5 hours ago",
    unread: false,
  },
];

export function MobileWorkOrderList({ onSelectWorkOrder, onBulkMessage }: MobileWorkOrderListProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "emergency" | "today">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredWorkOrders = mockWorkOrders.filter((wo) => {
    if (activeFilter === "unread" && !wo.unread) return false;
    if (activeFilter === "emergency" && wo.priority !== "emergency") return false;
    if (searchQuery && !wo.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const unreadCount = mockWorkOrders.filter((wo) => wo.unread).length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "emergency":
        return "var(--status-critical-border)";
      case "high":
        return "var(--status-warning-border)";
      case "medium":
        return "var(--status-neutral-border)";
      case "low":
        return "var(--status-success-border)";
      default:
        return "var(--border-default)";
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Waiting for Access":
        return {
          backgroundColor: "var(--status-warning-bg)",
          borderColor: "var(--status-warning-border)",
          color: "var(--status-warning-text)",
        };
      case "In Progress":
        return {
          backgroundColor: "var(--status-neutral-bg)",
          borderColor: "var(--status-neutral-border)",
          color: "var(--status-neutral-text)",
        };
      case "Assigned":
      case "Scheduled":
        return {
          backgroundColor: "var(--status-success-bg)",
          borderColor: "var(--status-success-border)",
          color: "var(--status-success-text)",
        };
      default:
        return {
          backgroundColor: "var(--status-neutral-bg)",
          borderColor: "var(--status-neutral-border)",
          color: "var(--status-neutral-text)",
        };
    }
  };

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* Header */}
      <div
        className="border-b"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-default)",
          paddingTop: "env(safe-area-inset-top, 20px)",
          paddingLeft: "var(--space-md)",
          paddingRight: "var(--space-md)",
          paddingBottom: "var(--space-md)",
        }}
      >
        {/* Title Row */}
        <div className="flex items-center justify-between mb-3">
          <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--text-primary)" }}>
            Messages
          </h1>
          <button
            className="rounded-full"
            style={{
              width: "32px",
              height: "32px",
              backgroundColor: "var(--action-primary)",
              color: "var(--text-inverted)",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            KC
          </button>
        </div>

        {/* Search Bar */}
        <div
          className="flex items-center gap-2 px-3 rounded-lg"
          style={{
            height: "40px",
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-default)",
          }}
        >
          <Search size={16} style={{ color: "var(--text-tertiary)" }} />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none"
            style={{ fontSize: "14px", color: "var(--text-primary)" }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        className="flex gap-2 overflow-x-auto no-scrollbar border-b"
        style={{
          padding: "var(--space-sm) var(--space-md)",
          backgroundColor: "var(--bg-primary)",
          borderColor: "var(--border-default)",
        }}
      >
        {[
          { id: "all", label: "All" },
          { id: "unread", label: `Unread (${unreadCount})` },
          { id: "emergency", label: "Emergency" },
          { id: "today", label: "Today" },
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id as any)}
            className="rounded-full whitespace-nowrap border"
            style={{
              height: "36px",
              padding: "0 16px",
              fontSize: "12px",
              fontWeight: 600,
              backgroundColor:
                activeFilter === filter.id ? "var(--action-primary)" : "var(--bg-card)",
              color:
                activeFilter === filter.id ? "var(--text-inverted)" : "var(--text-secondary)",
              borderColor:
                activeFilter === filter.id ? "var(--action-primary)" : "var(--border-default)",
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Work Order List */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: "96px" }}>
        {filteredWorkOrders.map((workOrder) => (
          <SwipeableWorkOrderCard
            key={workOrder.id}
            workOrder={workOrder}
            onComplete={(id) => {
              toast.success("Work order marked as complete!");
            }}
            onAssign={(id) => {
              toast.info("Opening assignment options...");
            }}
            onClick={() => onSelectWorkOrder(workOrder)}
          >
            <button
              className="w-full text-left border-b active:opacity-80"
              style={{
                margin: "var(--space-sm) var(--space-md) 0",
                padding: "var(--space-md)",
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-default)",
                borderLeft: `4px solid ${getPriorityColor(workOrder.priority)}`,
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-sm)",
                position: "relative",
              }}
            >
            {/* Unread Indicator */}
            {workOrder.unread && (
              <div
                className="absolute top-3 right-3 rounded-full"
                style={{
                  width: "6px",
                  height: "6px",
                  backgroundColor: "var(--action-primary)",
                }}
              />
            )}

            {/* Row 1: ID and Status */}
            <div className="flex items-center justify-between mb-2">
              <span
                style={{
                  fontSize: "12px",
                  fontFamily: "monospace",
                  color: "var(--text-secondary)",
                }}
              >
                {workOrder.id}
              </span>
              <span
                className="px-2 rounded border"
                style={{
                  height: "20px",
                  fontSize: "10px",
                  fontWeight: 600,
                  lineHeight: "18px",
                  ...getStatusStyle(workOrder.status),
                }}
              >
                {workOrder.status}
              </span>
            </div>

            {/* Row 2: Title */}
            <div
              className="mb-2"
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--text-primary)",
                lineHeight: "1.4",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {workOrder.title}
            </div>

            {/* Row 3: Location */}
            <div className="flex items-center gap-1 mb-2">
              <Building2 size={16} style={{ color: "var(--text-secondary)" }} />
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                {workOrder.propertyAddress} · {workOrder.unit}
              </span>
            </div>

            {/* Row 4: Tenant and Time */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <User size={16} style={{ color: "var(--text-secondary)" }} />
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  {workOrder.residentName} · 🌐
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={16} style={{ color: "var(--text-tertiary)" }} />
                <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                  {workOrder.createdDate}
                </span>
              </div>
            </div>

            {/* Row 5: Message Preview */}
            {workOrder.messageCount && workOrder.lastMessage && (
              <div
                className="rounded"
                style={{
                  backgroundColor: "var(--bg-hover)",
                  padding: "var(--space-xs)",
                }}
              >
                <div className="flex items-center gap-1 mb-1">
                  <MessageSquare size={12} style={{ color: "var(--text-tertiary)" }} />
                  <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                    {workOrder.messageCount} messages
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    fontStyle: "italic",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {workOrder.lastMessage}
                </div>
              </div>
            )}
            </button>
          </SwipeableWorkOrderCard>
        ))}
      </div>
    </div>
  );
}

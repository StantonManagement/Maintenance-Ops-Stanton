import { Badge } from "./ui/badge";
import { Building, User, Clock, MessageSquare, Wrench, Calendar, Info, Globe, UserCheck } from "lucide-react";
import { WorkOrder } from "../types";

interface WorkOrderCardProps {
  workOrder: WorkOrder;
  selected?: boolean;
  onClick?: () => void;
}

const priorityColors = {
  emergency: {
    border: 'var(--status-critical-border)',
    bg: 'rgba(220, 38, 38, 0.03)',
  },
  high: {
    border: 'var(--status-warning-border)',
    bg: 'rgba(217, 119, 6, 0.03)',
  },
  normal: {
    border: 'var(--border-strong)',
    bg: 'transparent',
  },
  low: {
    border: 'var(--border-strong)',
    bg: 'transparent',
  },
};

const statusStyles = {
  "NEW": {
    bg: 'var(--status-warning-bg)',
    border: 'var(--status-warning-border)',
    text: 'var(--status-warning-text)',
  },
  "ASSIGNED": {
    bg: 'var(--status-neutral-bg)',
    border: 'var(--status-neutral-border)',
    text: 'var(--status-neutral-text)',
  },
  "IN PROGRESS": {
    bg: 'rgba(37, 99, 235, 0.1)',
    border: 'var(--action-primary)',
    text: 'var(--action-primary)',
  },
  "Ready for Review": {
    bg: 'var(--status-success-bg)',
    border: 'var(--status-success-border)',
    text: 'var(--status-success-text)',
  },
  "COMPLETED": {
    bg: 'var(--status-success-bg)',
    border: 'var(--status-success-border)',
    text: 'var(--status-success-text)',
  },
  "Waiting for Access": {
    bg: 'var(--status-warning-bg)',
    border: 'var(--status-warning-border)',
    text: 'var(--status-warning-text)',
  },
};

export function WorkOrderCard({ workOrder, selected, onClick }: WorkOrderCardProps) {
  const statusStyle = statusStyles[workOrder.status as keyof typeof statusStyles] || statusStyles["ASSIGNED"];
  const workOrderId = `WO-${workOrder.serviceRequestId}-${workOrder.workOrderNumber}`;

  return (
    <div
      className="mx-6 mb-3 p-6 border cursor-pointer transition-all relative"
      style={{
        backgroundColor: selected 
          ? 'rgba(37, 99, 235, 0.05)' 
          : priorityColors[workOrder.priority].bg || 'var(--bg-card)',
        borderColor: selected ? 'var(--action-primary)' : 'var(--border-default)',
        borderLeftWidth: '4px',
        borderLeftColor: selected ? 'var(--action-primary)' : priorityColors[workOrder.priority].border,
        borderRadius: 'var(--radius-md)',
        boxShadow: selected ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.3)';
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          e.currentTarget.style.borderColor = 'var(--border-default)';
        }
      }}
    >
      {/* Unread Indicator */}
      {workOrder.unread && (
        <div
          className="absolute top-6 right-6 h-2 w-2"
          style={{
            backgroundColor: 'var(--action-primary)',
            borderRadius: 'var(--radius-full)',
          }}
        />
      )}

      {/* Row 1: Header with ID and Badges */}
      <div className="flex items-center justify-between mb-3">
        <span 
          className="text-[14px] font-mono hover:underline" 
          style={{ color: 'var(--text-secondary)' }}
        >
          {workOrderId}
        </span>
        <div className="flex items-center gap-2">
          {workOrder.isNew && (
            <Badge
              className="h-6 px-[10px] text-[11px] border animate-pulse-subtle"
              style={{
                backgroundColor: 'var(--status-warning-bg)',
                borderColor: 'var(--status-warning-border)',
                color: 'var(--status-warning-text)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              NEW
            </Badge>
          )}
          {workOrder.isResidentSubmitted && (
            <Badge
              className="h-6 px-[10px] text-[11px] border"
              style={{
                backgroundColor: 'var(--status-success-bg)',
                borderColor: 'var(--status-success-border)',
                color: 'var(--status-success-text)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              RESIDENT
            </Badge>
          )}
          <Badge
            className="h-6 px-[10px] text-[11px] border"
            style={{
              backgroundColor: statusStyle.bg,
              borderColor: statusStyle.border,
              color: statusStyle.text,
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {workOrder.status}
          </Badge>
          {workOrder.permissionToEnter && (
            <Badge
              className="h-6 px-[10px] text-[11px] border"
              style={{
                backgroundColor: workOrder.permissionToEnter === 'yes' 
                  ? 'var(--status-success-bg)' 
                  : 'var(--status-neutral-bg)',
                borderColor: workOrder.permissionToEnter === 'yes' 
                  ? 'var(--status-success-border)' 
                  : 'var(--status-neutral-border)',
                color: workOrder.permissionToEnter === 'yes' 
                  ? 'var(--status-success-text)' 
                  : 'var(--status-neutral-text)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              Entry: {workOrder.permissionToEnter.toUpperCase()}
            </Badge>
          )}
        </div>
      </div>

      {/* Row 2: Title/Description */}
      <h3 
        className="text-[16px] leading-[24px] mb-3 line-clamp-2" 
        style={{ color: 'var(--text-primary)' }}
      >
        {workOrder.priority === 'emergency' && '⚡ '}
        {workOrder.title}
      </h3>

      {/* Multi-language translation if applicable */}
      {workOrder.originalLanguage && workOrder.translation && (
        <div 
          className="mb-3 p-3"
          style={{
            backgroundColor: 'rgba(37, 99, 235, 0.05)',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '2px solid var(--action-primary)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-3 w-3" style={{ color: 'var(--text-tertiary)' }} />
            <span className="text-[12px] italic" style={{ color: 'var(--text-tertiary)' }}>
              Auto-translated from {workOrder.originalLanguage}:
            </span>
          </div>
          <p className="text-[14px] line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
            "{workOrder.translation}"
          </p>
        </div>
      )}

      {/* Row 3: Property & Resident Info */}
      <div className="flex items-center gap-6 mb-3">
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
          <span className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
            {workOrder.propertyCode} - {workOrder.propertyAddress} · Unit {workOrder.unit}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
          <span className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
            {workOrder.residentName}
          </span>
        </div>
      </div>

      {/* Row 4: Assignment & Timing */}
      <div className="flex items-center justify-between mb-3">
        {workOrder.vendor || workOrder.assignee ? (
          <div 
            className="px-3 py-1.5 flex items-center gap-2"
            style={{
              backgroundColor: 'var(--bg-hover)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <Wrench className="h-3.5 w-3.5" style={{ color: 'var(--text-secondary)' }} />
            <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
              {workOrder.vendor}
              {workOrder.assignee && ` · ${workOrder.assignee}`}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Wrench className="h-3.5 w-3.5" style={{ color: 'var(--text-tertiary)' }} />
            <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
              --
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5" style={{ color: 'var(--text-tertiary)' }} />
          <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
            {workOrder.createdDate}
          </span>
        </div>
      </div>

      {/* Row 5: Quick Actions & Indicators */}
      <div className="flex flex-wrap items-center gap-4 pt-3 border-t" style={{ borderColor: 'var(--divider-light)' }}>
        {workOrder.hasScheduling && (
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" style={{ color: 'var(--text-tertiary)' }} />
            <span className="text-[12px] italic" style={{ color: 'var(--text-tertiary)' }}>
              {workOrder.schedulingStatus || "Not scheduled yet"}
            </span>
          </div>
        )}

        {workOrder.residentAvailability && (
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" style={{ color: 'var(--status-success-icon)' }} />
            <span className="text-[12px]" style={{ color: 'var(--status-success-text)' }}>
              {workOrder.residentAvailability}
            </span>
          </div>
        )}

        {workOrder.hasIssueDetails && (
          <div className="flex items-center gap-2">
            <Info className="h-3.5 w-3.5" style={{ color: 'var(--text-secondary)' }} />
            <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
              Detailed diagnostics available
            </span>
          </div>
        )}

        {workOrder.messageCount && workOrder.messageCount > 0 && (
          <div className="flex items-center gap-2">
            <MessageSquare className="h-3.5 w-3.5" style={{ color: 'var(--action-primary)' }} />
            <span className="text-[12px]" style={{ color: 'var(--action-primary)' }}>
              {workOrder.messageCount} message{workOrder.messageCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Message Preview (if has recent messages) */}
      {workOrder.messageCount && workOrder.lastMessage && (
        <div 
          className="mt-3 p-2"
          style={{
            backgroundColor: 'rgba(37, 99, 235, 0.05)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <p className="text-[12px] italic truncate" style={{ color: 'var(--text-secondary)' }}>
            "{workOrder.lastMessage}"
          </p>
        </div>
      )}

      {/* Urgency Warning (if over 12 hours old for approval queue) */}
      {workOrder.status === "Ready for Review" && workOrder.hoursOld && workOrder.hoursOld > 12 && (
        <div 
          className="mt-3 px-2 py-1 inline-block text-[12px]"
          style={{
            backgroundColor: workOrder.hoursOld > 48 
              ? 'var(--status-critical-bg)' 
              : 'rgba(245, 158, 11, 0.2)',
            color: workOrder.hoursOld > 48 
              ? 'var(--status-critical-text)' 
              : 'var(--status-warning-text)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          {workOrder.hoursOld > 48 ? '⚠️ Urgent review needed' : `Over ${Math.floor(workOrder.hoursOld)}h old`}
        </div>
      )}
    </div>
  );
}

import { Badge } from "./ui/badge";
import { Building, Wrench, Droplet } from "lucide-react";
import { Checkbox } from "./ui/checkbox";

export interface DraggableWorkOrder {
  id: string;
  title: string;
  location: string;
  tenant: string;
  tenantLanguage: string;
  priority: "emergency" | "high" | "medium" | "low";
  estimatedTime: string;
  skillsRequired: string[];
  lastContact: string;
}

interface DraggableWorkOrderCardProps {
  workOrder: DraggableWorkOrder;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  isDragging?: boolean;
  isUnlocked?: boolean;
}

const priorityColors = {
  emergency: 'var(--status-critical-border)',
  high: 'var(--status-warning-border)',
  medium: 'var(--status-neutral-border)',
  low: 'var(--status-success-border)',
};

const priorityLabels = {
  emergency: 'Emergency',
  high: 'High Priority',
  medium: 'Medium',
  low: 'Low Priority',
};

const skillIcons: Record<string, React.ComponentType<any>> = {
  Plumbing: Droplet,
  General: Wrench,
};

export function DraggableWorkOrderCard({
  workOrder,
  selected,
  onSelect,
  isDragging,
  isUnlocked = false,
}: DraggableWorkOrderCardProps) {
  return (
    <div
      draggable={isUnlocked}
      className="relative mx-4 mb-3 p-4 border transition-all"
      style={{
        backgroundColor: selected ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-card)',
        borderColor: selected ? 'var(--action-primary)' : 'var(--border-default)',
        borderWidth: selected ? '2px' : '1px',
        borderLeftWidth: '4px',
        borderLeftColor: priorityColors[workOrder.priority],
        borderRadius: 'var(--radius-md)',
        boxShadow: isDragging ? 'var(--shadow-lg)' : 'var(--shadow-md)',
        opacity: isDragging ? 0.9 : 1,
        transform: isDragging ? 'rotate(2deg)' : 'rotate(0deg)',
        cursor: isUnlocked ? 'grab' : 'default',
      }}
      onDragStart={(e) => {
        if (isUnlocked) {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('workOrderId', workOrder.id);
          e.currentTarget.style.opacity = '0.5';
        }
      }}
      onDragEnd={(e) => {
        e.currentTarget.style.opacity = '1';
      }}
      onMouseEnter={(e) => {
        if (!isDragging && isUnlocked) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }
      }}
    >
      {/* Checkbox for multi-select */}
      <div
        className="absolute top-4 left-4 z-10"
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(!selected);
        }}
      >
        <Checkbox
          checked={selected}
          className="h-4 w-4"
          style={{
            borderColor: 'var(--border-default)',
          }}
        />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-3 pl-6">
        <span className="text-[14px] font-mono" style={{ color: 'var(--text-secondary)' }}>
          {workOrder.id}
        </span>
        <div className="flex items-center gap-2">
          <Badge
            className="h-6 px-[10px] text-[12px] border"
            style={{
              backgroundColor: 'var(--status-warning-bg)',
              borderColor: 'var(--status-warning-border)',
              color: 'var(--status-warning-text)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {priorityLabels[workOrder.priority]}
          </Badge>
          <div
            className="px-[10px] py-1 text-[12px]"
            style={{
              backgroundColor: 'var(--bg-hover)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
            }}
          >
            Est. {workOrder.estimatedTime}
          </div>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-[16px] leading-[24px] mb-3" style={{ color: 'var(--text-primary)' }}>
        {workOrder.title}
      </h3>

      {/* Location & Skills */}
      <div className="mb-3 space-y-2">
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
          <span className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
            {workOrder.location}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {workOrder.skillsRequired.map((skill, index) => {
            const SkillIcon = skillIcons[skill] || Wrench;
            return (
              <div
                key={index}
                className="flex items-center gap-1 px-2 py-1 text-[12px]"
                style={{
                  backgroundColor: 'var(--status-neutral-bg)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-secondary)',
                }}
              >
                <SkillIcon className="h-3 w-3" />
                {skill}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tenant Info */}
      <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--divider-light)' }}>
        <div className="flex items-center gap-2">
          <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
            {workOrder.tenant} · 🌐 {workOrder.tenantLanguage}
          </span>
        </div>
        <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
          {workOrder.lastContact}
        </span>
      </div>
    </div>
  );
}

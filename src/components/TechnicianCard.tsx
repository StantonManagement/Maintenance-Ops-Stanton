import { MapPin, ChevronDown, Check, X, AlertTriangle } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useState } from "react";
import { Technician } from "../types";

interface TechnicianCardProps {
  technician: Technician;
  isValidDrop?: boolean;
  isSkillMismatch?: boolean;
  isAtCapacity?: boolean;
  isDragOver?: boolean;
  onDrop?: (workOrderId: string) => void;
  onOverrideCapacity?: () => void;
  isUnlocked?: boolean;
}

export function TechnicianCard({
  technician,
  isValidDrop,
  isSkillMismatch,
  isAtCapacity,
  isDragOver,
  onDrop,
  onOverrideCapacity,
  isUnlocked = false,
}: TechnicianCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragOverState, setIsDragOverState] = useState(false);

  const capacityPercentage = (technician.capacity.current / technician.capacity.max) * 100;
  const getCapacityColor = () => {
    if (capacityPercentage >= 100) return 'var(--status-critical-border)';
    if (capacityPercentage >= 80) return 'var(--status-warning-border)';
    return 'var(--status-success-border)';
  };

  const statusColors = {
    available: 'var(--status-success-icon)',
    'in-transit': 'var(--status-warning-icon)',
    unavailable: 'var(--status-critical-icon)',
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (isUnlocked) {
      e.preventDefault();
      setIsDragOverState(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOverState(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (isUnlocked) {
      e.preventDefault();
      const workOrderId = e.dataTransfer.getData('workOrderId');
      setIsDragOverState(false);
      if (workOrderId && onDrop) {
        onDrop(workOrderId);
      }
    }
  };

  return (
    <div
      className="p-6 border transition-all"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        backgroundColor: technician.pulledForTurnover 
          ? 'rgba(252, 211, 77, 0.1)' 
          : isDragOverState
          ? 'rgba(37, 99, 235, 0.1)'
          : isValidDrop && isDragOver 
          ? 'var(--status-success-bg)' 
          : isSkillMismatch && isDragOver
          ? 'var(--status-warning-bg)'
          : isAtCapacity && isDragOver
          ? 'var(--status-critical-bg)'
          : 'var(--bg-card)',
        borderColor: isDragOverState
          ? 'var(--action-primary)'
          : isValidDrop && isDragOver
          ? 'var(--status-success-border)'
          : isSkillMismatch && isDragOver
          ? 'var(--status-warning-border)'
          : isAtCapacity && isDragOver
          ? 'var(--status-critical-border)'
          : 'var(--border-default)',
        borderWidth: isDragOver ? '2px' : '2px',
        borderStyle: 'solid',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        minHeight: '280px',
        transform: isValidDrop && isDragOver ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      {/* Turnover Banner */}
      {technician.pulledForTurnover && technician.turnoverInfo && (
        <div
          className="mb-4 p-3 border"
          style={{
            backgroundColor: 'var(--status-warning-bg)',
            borderColor: 'var(--status-warning-border)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5" style={{ color: 'var(--status-warning-icon)' }} />
            <div className="flex-1">
              <p className="text-[12px]" style={{ color: 'var(--status-warning-text)' }}>
                ⚠️ PULLED FOR TURNOVER
              </p>
              <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                {technician.turnoverInfo.building} · Est. return {technician.turnoverInfo.estimatedReturn}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="relative">
            <div
              className="h-12 w-12 flex items-center justify-center text-[16px]"
              style={{
                backgroundColor: 'var(--action-primary)',
                color: 'var(--text-inverted)',
                borderRadius: 'var(--radius-full)',
              }}
            >
              {technician.name.split(' ').map(n => n[0]).join('')}
            </div>
            {/* Status Indicator */}
            <div
              className="absolute bottom-0 right-0 h-3 w-3 border-2"
              style={{
                backgroundColor: statusColors[technician.status],
                borderColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-full)',
              }}
            />
          </div>
          <div>
            <h3 className="text-[20px] leading-[28px]" style={{ color: 'var(--text-primary)' }}>
              {technician.name}
            </h3>
            <div className="flex items-center gap-1 flex-wrap mt-1">
              {technician.skills.slice(0, 3).map((skill, index) => (
                <Badge
                  key={index}
                  className="h-5 px-2 text-[11px]"
                  style={{
                    backgroundColor: 'var(--status-neutral-bg)',
                    color: 'var(--text-secondary)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {skill}
                </Badge>
              ))}
              {technician.skills.length > 3 && (
                <Badge
                  className="h-5 px-2 text-[11px]"
                  style={{
                    backgroundColor: 'var(--status-neutral-bg)',
                    color: 'var(--text-secondary)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  +{technician.skills.length - 3}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Capacity Indicator */}
        <div className="text-center">
          <div className="relative h-20 w-20">
            <svg className="transform -rotate-90" width="80" height="80">
              {/* Background circle */}
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="var(--border-default)"
                strokeWidth="6"
              />
              {/* Progress circle */}
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke={getCapacityColor()}
                strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - capacityPercentage / 100)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[20px] font-mono" style={{ color: 'var(--text-primary)' }}>
                {technician.capacity.current}/{technician.capacity.max}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Current Location */}
      <div className="mb-4 flex items-center gap-2">
        <MapPin className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
        <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
          {technician.inTransit
            ? `In transit to ${technician.currentLocation}`
            : technician.currentLocation}
        </span>
        {technician.estimatedArrival && (
          <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
            · ~{technician.estimatedArrival}
          </span>
        )}
      </div>

      {/* Current Work Orders */}
      {technician.assignedWorkOrders.length > 0 && (
        <div className="mb-4">
          <button
            className="w-full flex items-center justify-between text-[12px] py-2 transition-all"
            style={{ color: 'var(--text-secondary)' }}
            onClick={() => setIsExpanded(!isExpanded)}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <span>{technician.assignedWorkOrders.length} active orders</span>
            <ChevronDown
              className="h-4 w-4 transition-transform"
              style={{
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </button>
          {isExpanded && (
            <div className="space-y-2 mt-2">
              {technician.assignedWorkOrders.map((wo) => (
                <div
                  key={wo.id}
                  className="p-2 text-[12px] border"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--text-primary)' }}>
                      {wo.id} · {wo.title}
                    </span>
                    <Badge
                      className="h-4 px-2 text-[10px]"
                      style={{
                        backgroundColor: 'var(--status-neutral-bg)',
                        color: 'var(--text-secondary)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      {wo.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Drop Zone */}
      <div
        className="min-h-[100px] border-2 border-dashed flex items-center justify-center p-4 transition-all"
        style={{
          borderColor: isValidDrop && isDragOver
            ? 'var(--status-success-border)'
            : isSkillMismatch && isDragOver
            ? 'var(--status-warning-border)'
            : isAtCapacity && isDragOver
            ? 'var(--status-critical-border)'
            : 'var(--border-default)',
          backgroundColor: isValidDrop && isDragOver
            ? 'var(--status-success-bg)'
            : isSkillMismatch && isDragOver
            ? 'var(--status-warning-bg)'
            : isAtCapacity && isDragOver
            ? 'var(--status-critical-bg)'
            : 'var(--bg-primary)',
          borderRadius: 'var(--radius-sm)',
        }}
      >
        {isAtCapacity && isDragOver ? (
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <X className="h-6 w-6" style={{ color: 'var(--status-critical-icon)' }} />
              <p className="text-[14px]" style={{ color: 'var(--status-critical-text)' }}>
                At daily capacity ({technician.capacity.max}/{technician.capacity.max})
              </p>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <Button
                size="sm"
                className="h-8 text-[12px]"
                style={{
                  backgroundColor: 'var(--action-secondary)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-8 text-[12px]"
                style={{
                  backgroundColor: 'var(--action-destructive)',
                  color: 'var(--text-inverted)',
                  borderRadius: 'var(--radius-md)',
                }}
                onClick={onOverrideCapacity}
              >
                Override - Emergency
              </Button>
            </div>
          </div>
        ) : isSkillMismatch && isDragOver ? (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5" style={{ color: 'var(--status-warning-icon)' }} />
              <p className="text-[12px]" style={{ color: 'var(--status-warning-text)' }}>
                Can do, but not ideal match
              </p>
            </div>
          </div>
        ) : isValidDrop && isDragOver ? (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <Check className="h-6 w-6" style={{ color: 'var(--status-success-icon)' }} />
              <p className="text-[14px]" style={{ color: 'var(--status-success-text)' }}>
                Drop to assign to {technician.name.split(' ')[0]}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-[12px] text-center italic" style={{ color: 'var(--text-tertiary)' }}>
            Drop work orders here
          </p>
        )}
      </div>
    </div>
  );
}

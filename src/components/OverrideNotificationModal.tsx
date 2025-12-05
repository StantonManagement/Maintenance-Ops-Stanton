import { AlertTriangle, X, Phone } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface AffectedWorkOrder {
  id: string;
  location: string;
  status: string;
  statusColor: string;
  reassignedTo?: string;
}

interface OverrideNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  technicianName: string;
  pulledBy: string;
  newAssignment: {
    location: string;
    priority: string;
    estimatedDuration: string;
  };
  affectedWorkOrders: AffectedWorkOrder[];
}

export function OverrideNotificationModal({
  isOpen,
  onClose,
  technicianName,
  pulledBy,
  newAssignment,
  affectedWorkOrders,
}: OverrideNotificationModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(2px)',
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed top-1/2 left-1/2 z-50 w-[540px] max-h-[80vh] overflow-y-auto animate-fade-in"
        style={{
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Header */}
        <div
          className="h-14 px-5 flex items-center justify-between"
          style={{
            background: 'linear-gradient(to right, #FEF3C7, #FDE68A)',
            borderTopLeftRadius: 'var(--radius-lg)',
            borderTopRightRadius: 'var(--radius-lg)',
          }}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6" style={{ color: '#EA580C' }} />
            <h2 className="text-[18px]" style={{ color: '#1A1A1A', fontWeight: 600 }}>
              Emergency Override Activated
            </h2>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center transition-colors hover:bg-white/50"
            style={{ borderRadius: 'var(--radius-md)' }}
          >
            <X className="h-5 w-5" style={{ color: '#78716C' }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Main info */}
          <div>
            <p className="text-[16px]" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
              {pulledBy} has reassigned {technicianName}
            </p>
          </div>

          <div className="h-px" style={{ backgroundColor: 'var(--border-default)' }} />

          {/* New Assignment Details */}
          <div>
            <h3 className="text-[14px] mb-3" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              New Assignment:
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>Location:</span>
                <span className="text-[14px]" style={{ color: 'var(--text-primary)' }}>
                  {newAssignment.location}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>Priority:</span>
                <Badge
                  className="px-2 py-1 text-[11px]"
                  style={{
                    backgroundColor: 'var(--status-critical-bg)',
                    color: 'var(--status-critical-text)',
                    border: '1px solid var(--status-critical-border)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {newAssignment.priority}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>Estimated duration:</span>
                <span className="text-[14px]" style={{ color: 'var(--text-primary)' }}>
                  {newAssignment.estimatedDuration}
                </span>
              </div>
            </div>
          </div>

          {/* Affected Work Orders */}
          <div>
            <h3 className="text-[14px] mb-3" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              Affected Work Orders ({affectedWorkOrders.length}):
            </h3>
            <div className="space-y-3">
              {affectedWorkOrders.map((wo) => (
                <div
                  key={wo.id}
                  className="p-3 border"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-[13px]" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                        {wo.id} - {wo.location}
                      </p>
                    </div>
                    <Button
                      className="h-7 px-3 text-[12px] border"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-default)',
                        color: 'var(--action-primary)',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>Status:</span>
                    <span className="text-[12px]" style={{ color: wo.statusColor }}>
                      {wo.status}
                      {wo.reassignedTo && ` → ${wo.reassignedTo}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-16 px-6 flex items-center justify-end gap-3 border-t" style={{ borderColor: 'var(--border-default)' }}>
          <Button
            className="h-10 px-5 text-[14px] border"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <Phone className="h-4 w-4 mr-2" />
            Contact {pulledBy.split(' ')[0]}
          </Button>
          <Button
            className="h-10 px-5 text-[14px] border"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            Review All
          </Button>
          <Button
            className="h-10 px-5 text-[14px]"
            style={{
              backgroundColor: 'var(--action-primary)',
              color: 'var(--text-inverted)',
              borderRadius: 'var(--radius-md)',
            }}
            onClick={onClose}
          >
            Acknowledge
          </Button>
        </div>
      </div>
    </>
  );
}

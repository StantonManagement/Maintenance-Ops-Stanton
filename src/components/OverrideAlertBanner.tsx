import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Phone, Calendar } from "lucide-react";
import { Button } from "./ui/button";

interface OverrideAlert {
  id: string;
  technicianName: string;
  pulledBy: string;
  originalWorkOrder: {
    id: string;
    title: string;
    location: string;
  };
  newAssignment: {
    title: string;
    location: string;
    priority: string;
  };
  timestamp: string;
  timeAgo: string;
}

const mockOverrides: OverrideAlert[] = [
  {
    id: "override-1",
    technicianName: "Ramon Gutierrez",
    pulledBy: "Dean Carson",
    originalWorkOrder: {
      id: "WO-2024-1234",
      title: "Leaking faucet",
      location: "Building A Unit 205",
    },
    newAssignment: {
      title: "Building C Unit 401 Turnover",
      location: "Building C Unit 401",
      priority: "Emergency",
    },
    timestamp: "2:15 PM",
    timeAgo: "23 min ago",
  },
  {
    id: "override-2",
    technicianName: "Miguel Rodriguez",
    pulledBy: "System",
    originalWorkOrder: {
      id: "WO-2024-1235",
      title: "HVAC repair",
      location: "Building B Unit 102",
    },
    newAssignment: {
      title: "Taking over WO-2024-1235",
      location: "Building B Unit 102",
      priority: "High",
    },
    timestamp: "2:15 PM",
    timeAgo: "23 min ago",
  },
];

interface OverrideAlertBannerProps {
  onDismiss?: () => void;
}

export function OverrideAlertBanner({ onDismiss }: OverrideAlertBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || mockOverrides.length === 0) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      className="border-b transition-all"
      style={{
        background: 'linear-gradient(to bottom, #FEF3C7, #FDE68A)',
        borderColor: '#F59E0B',
        borderLeftWidth: '4px',
        borderLeftColor: '#EA580C',
        height: isExpanded ? 'auto' : '56px',
        overflow: 'hidden',
      }}
    >
      {/* Collapsed State */}
      <div className="h-14 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <AlertTriangle className="h-5 w-5" style={{ color: '#EA580C' }} />
          <div>
            <span className="text-[14px]" style={{ color: '#1A1A1A', fontWeight: 500 }}>
              {mockOverrides.length} Active Override{mockOverrides.length > 1 ? 's' : ''}
            </span>
            <span className="text-[13px] ml-2" style={{ color: '#78716C' }}>
              {mockOverrides[0].technicianName} pulled by {mockOverrides[0].pulledBy}
              {mockOverrides.length > 1 && ` • ${mockOverrides.length - 1} more`} • {mockOverrides[0].timeAgo}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="h-8 px-3 text-[13px] border"
            style={{
              backgroundColor: 'white',
              borderColor: '#D97706',
              color: '#D97706',
              borderRadius: 'var(--radius-md)',
            }}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Review'}
            {isExpanded ? (
              <ChevronUp className="h-3 w-3 ml-1" />
            ) : (
              <ChevronDown className="h-3 w-3 ml-1" />
            )}
          </Button>
          <Button
            className="h-8 px-3 text-[13px]"
            style={{
              backgroundColor: '#2563EB',
              color: 'white',
              borderRadius: 'var(--radius-md)',
            }}
            onClick={handleDismiss}
          >
            Dismiss
          </Button>
        </div>
      </div>

      {/* Expanded State */}
      {isExpanded && (
        <div className="px-6 pb-5 space-y-4 animate-fade-in">
          {mockOverrides.map((override) => (
            <div
              key={override.id}
              className="p-4 border"
              style={{
                backgroundColor: 'white',
                borderColor: '#F59E0B',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-[14px] mb-1" style={{ color: '#1A1A1A', fontWeight: 500 }}>
                    {override.technicianName} - Pulled by {override.pulledBy}
                  </h4>
                  <p className="text-[12px]" style={{ color: '#78716C' }}>
                    {override.timestamp} ({override.timeAgo})
                  </p>
                </div>
              </div>

              <div className="space-y-2 mb-3">
                <div className="text-[12px]">
                  <span style={{ color: '#78716C' }}>Original: </span>
                  <span style={{ color: '#1A1A1A' }}>
                    {override.originalWorkOrder.id} {override.originalWorkOrder.location}
                  </span>
                </div>
                <div className="text-[12px]">
                  <span style={{ color: '#78716C' }}>Now working: </span>
                  <span style={{ color: '#1A1A1A' }}>
                    {override.newAssignment.location} ({override.newAssignment.priority})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  className="h-8 px-3 text-[12px] border"
                  style={{
                    backgroundColor: 'white',
                    borderColor: '#E5E7EB',
                    color: '#1A1A1A',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <Phone className="h-3 w-3 mr-1" />
                  Contact {override.pulledBy.split(' ')[0]}
                </Button>
                <Button
                  className="h-8 px-3 text-[12px] border"
                  style={{
                    backgroundColor: 'white',
                    borderColor: '#E5E7EB',
                    color: '#1A1A1A',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  Reschedule {override.originalWorkOrder.id}
                </Button>
                <Button
                  className="h-8 px-3 text-[12px]"
                  style={{
                    backgroundColor: '#2563EB',
                    color: 'white',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  Acknowledge
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

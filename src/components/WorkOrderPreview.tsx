import { WorkOrder } from "../types";
import { Badge } from "./ui/badge";
import { 
  Building, 
  User, 
  Clock, 
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MapPin,
  Phone,
  Key,
  FileText,
  Image as ImageIcon,
  Info
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface WorkOrderPreviewProps {
  workOrder?: WorkOrder;
}

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

const priorityConfig = {
  emergency: { label: "Emergency", color: "var(--status-critical-text)" },
  high: { label: "High", color: "var(--status-warning-text)" },
  normal: { label: "Normal", color: "var(--text-secondary)" },
  low: { label: "Low", color: "var(--text-tertiary)" },
};

// Mock photos for demo - in real app these would come from work order data
const mockPhotos = [
  "https://images.unsplash.com/photo-1581720604719-ee1b1a4e44b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmluZyUyMGxlYWslMjByZXBhaXJ8ZW58MXx8fHwxNzU5OTUxOTI5fDA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1759434775823-40d8b9577a41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraXRjaGVuJTIwYXBwbGlhbmNlJTIwbWFpbnRlbmFuY2V8ZW58MXx8fHwxNzU5OTUxOTI5fDA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1596394183255-728c265e24aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxodmFjJTIwYWlyJTIwY29uZGl0aW9uaW5nfGVufDF8fHx8MTc1OTk0NTU0Nnww&ixlib=rb-4.1.0&q=80&w=1080",
];

export function WorkOrderPreview({ workOrder }: WorkOrderPreviewProps) {
  if (!workOrder) {
    return (
      <div className="w-[480px] border-l flex flex-col" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-card)" }}>
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div
            className="h-16 w-16 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: "var(--bg-hover)" }}
          >
            <FileText className="h-8 w-8" style={{ color: "var(--text-tertiary)" }} />
          </div>
          <h3 className="text-[18px] mb-2" style={{ color: "var(--text-primary)" }}>
            Select a work order
          </h3>
          <p className="text-[14px] text-center" style={{ color: "var(--text-secondary)" }}>
            Choose a work order from the table to preview details, photos, and more
          </p>
        </div>
      </div>
    );
  }

  const currentStatus = statusStyles[workOrder.status as keyof typeof statusStyles] || statusStyles.NEW;
  const priorityInfo = priorityConfig[workOrder.priority];

  // Show photos for some work orders (demo logic)
  const hasPhotos = workOrder.hasIssueDetails || workOrder.priority === "emergency" || workOrder.priority === "high";

  return (
    <div className="w-[480px] border-l flex flex-col" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-card)" }}>
      {/* Header */}
      <div className="px-6 py-5 border-b" style={{ borderColor: "var(--border-default)" }}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-[12px] mb-1" style={{ color: "var(--text-tertiary)" }}>
              WO-{workOrder.workOrderNumber.toString().padStart(4, '0')}
            </div>
            <h2 className="text-[18px]" style={{ color: "var(--text-primary)" }}>
              {workOrder.title}
            </h2>
          </div>
          <Badge
            className="text-[11px] px-2 py-1 border"
            style={{
              backgroundColor: currentStatus.bg,
              borderColor: currentStatus.border,
              color: currentStatus.text,
            }}
          >
            {workOrder.status}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-[13px]">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4" style={{ color: priorityInfo.color }} />
            <span style={{ color: priorityInfo.color }}>{priorityInfo.label}</span>
          </div>
          <div className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
            <Clock className="h-4 w-4" />
            <span>{workOrder.createdDate}</span>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Photos Section */}
        {hasPhotos && (
          <div className="px-6 py-5 border-b" style={{ borderColor: "var(--border-default)" }}>
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />
              <h3 className="text-[14px]" style={{ color: "var(--text-primary)" }}>
                Photos ({mockPhotos.length})
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {mockPhotos.map((photo, idx) => (
                <div
                  key={idx}
                  className="aspect-square rounded-lg overflow-hidden border cursor-pointer transition-all hover:opacity-80"
                  style={{ borderColor: "var(--border-default)" }}
                >
                  <ImageWithFallback
                    src={photo}
                    alt={`Work order photo ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Property & Resident Information */}
        <div className="px-6 py-5 border-b" style={{ borderColor: "var(--border-default)" }}>
          <h3 className="text-[14px] mb-3" style={{ color: "var(--text-primary)" }}>
            Location & Resident
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Building className="h-4 w-4 mt-0.5" style={{ color: "var(--text-secondary)" }} />
              <div className="flex-1">
                <div className="text-[13px]" style={{ color: "var(--text-primary)" }}>
                  {workOrder.propertyAddress}
                </div>
                <div className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                  {workOrder.propertyCode} • Unit {workOrder.unit}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 mt-0.5" style={{ color: "var(--text-secondary)" }} />
              <div className="flex-1">
                <div className="text-[13px]" style={{ color: "var(--text-primary)" }}>
                  {workOrder.residentName}
                </div>
                {workOrder.isResidentSubmitted && (
                  <div className="text-[12px] flex items-center gap-1 mt-1" style={{ color: "var(--status-neutral-text)" }}>
                    <Info className="h-3 w-3" />
                    Resident submitted
                  </div>
                )}
              </div>
            </div>
            {workOrder.permissionToEnter && (
              <div className="flex items-start gap-3">
                <Key className="h-4 w-4 mt-0.5" style={{ color: "var(--text-secondary)" }} />
                <div className="flex-1">
                  <div className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>
                    Permission to enter
                  </div>
                  <div className="text-[13px] flex items-center gap-1.5 mt-0.5">
                    {workOrder.permissionToEnter === "yes" ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "var(--status-success-icon)" }} />
                        <span style={{ color: "var(--status-success-text)" }}>Yes</span>
                      </>
                    ) : workOrder.permissionToEnter === "no" ? (
                      <>
                        <XCircle className="h-3.5 w-3.5" style={{ color: "var(--status-critical-icon)" }} />
                        <span style={{ color: "var(--status-critical-text)" }}>No - Requires appointment</span>
                      </>
                    ) : (
                      <span style={{ color: "var(--text-secondary)" }}>Not specified</span>
                    )}
                  </div>
                </div>
              </div>
            )}
            {workOrder.residentAvailability && (
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 mt-0.5" style={{ color: "var(--text-secondary)" }} />
                <div className="flex-1">
                  <div className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>
                    Availability
                  </div>
                  <div className="text-[13px]" style={{ color: "var(--text-primary)" }}>
                    {workOrder.residentAvailability}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="px-6 py-5 border-b" style={{ borderColor: "var(--border-default)" }}>
          <h3 className="text-[14px] mb-2" style={{ color: "var(--text-primary)" }}>
            Description
          </h3>
          <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {workOrder.description}
          </p>
        </div>

        {/* Issue Details */}
        {workOrder.hasIssueDetails && workOrder.issueDetails && (
          <div className="px-6 py-5 border-b" style={{ borderColor: "var(--border-default)" }}>
            <h3 className="text-[14px] mb-3" style={{ color: "var(--text-primary)" }}>
              Issue Details
            </h3>
            <div className="space-y-3">
              <div className="px-3 py-2 rounded-md" style={{ backgroundColor: "var(--bg-hover)" }}>
                <div className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>
                  Category
                </div>
                <div className="text-[13px]" style={{ color: "var(--text-primary)" }}>
                  {workOrder.issueDetails.category}
                </div>
              </div>
              {workOrder.issueDetails.questions.map((qa, idx) => (
                <div key={idx}>
                  <div className="text-[12px] mb-1" style={{ color: "var(--text-tertiary)" }}>
                    {qa.question}
                  </div>
                  <div className="text-[13px]" style={{ color: "var(--text-primary)" }}>
                    {qa.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assignment */}
        {(workOrder.vendor || workOrder.assignee) && (
          <div className="px-6 py-5 border-b" style={{ borderColor: "var(--border-default)" }}>
            <h3 className="text-[14px] mb-3" style={{ color: "var(--text-primary)" }}>
              Assignment
            </h3>
            <div className="space-y-2">
              {workOrder.vendor && (
                <div className="flex items-center gap-2">
                  <div className="text-[12px]" style={{ color: "var(--text-tertiary)", width: "80px" }}>
                    Vendor
                  </div>
                  <div className="text-[13px]" style={{ color: "var(--text-primary)" }}>
                    {workOrder.vendor}
                  </div>
                </div>
              )}
              {workOrder.assignee && (
                <div className="flex items-center gap-2">
                  <div className="text-[12px]" style={{ color: "var(--text-tertiary)", width: "80px" }}>
                    Assignee
                  </div>
                  <div className="text-[13px]" style={{ color: "var(--text-primary)" }}>
                    {workOrder.assignee}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions Log */}
        {workOrder.actionsLog && workOrder.actionsLog.length > 0 && (
          <div className="px-6 py-5">
            <h3 className="text-[14px] mb-3" style={{ color: "var(--text-primary)" }}>
              Activity Log
            </h3>
            <div className="space-y-3">
              {workOrder.actionsLog.map((log, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2" style={{ backgroundColor: "var(--action-primary)" }} />
                  <div className="flex-1">
                    <div className="text-[13px]" style={{ color: "var(--text-primary)" }}>
                      {log.action}
                    </div>
                    <div className="text-[12px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                      {log.user} • {log.timestamp}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

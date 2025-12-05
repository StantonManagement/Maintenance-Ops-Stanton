import { useState } from "react";
import { 
  CheckCircle, 
  XCircle, 
  ZoomIn,
  Download,
  Clock,
  User,
  MapPin,
  AlertTriangle,
  MessageSquare
} from "lucide-react";
import { WorkOrder } from "../types";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { PhotoUploadButton } from "./PhotoUploadButton";
import { toast } from "sonner";
import { useCompleteWorkOrder } from "../hooks/useCompleteWorkOrder";

interface ApprovalInterfaceProps {
  workOrder?: WorkOrder;
}

interface CompletionPhoto {
  id: string;
  url: string;
  type: "before" | "after";
  timestamp: string;
  caption?: string;
}

export function ApprovalInterface({ workOrder }: ApprovalInterfaceProps) {
  const [approvalNotes, setApprovalNotes] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<CompletionPhoto | null>(null);
  const { completeWorkOrder, rejectWorkOrder, loading } = useCompleteWorkOrder();
  
  // Mock photos for demonstration
  const [photos] = useState<CompletionPhoto[]>([
    {
      id: "1",
      url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400",
      type: "before",
      timestamp: "Oct 8, 2025 10:30 AM",
      caption: "Broken cabinet hinge"
    },
    {
      id: "2",
      url: "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=400",
      type: "after",
      timestamp: "Oct 8, 2025 2:15 PM",
      caption: "Hinge replaced and cabinet functional"
    },
    {
      id: "3",
      url: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400",
      type: "after",
      timestamp: "Oct 8, 2025 2:20 PM",
      caption: "Close-up of new hardware"
    },
  ]);

  const handleApprove = async () => {
    if (!workOrder) return;
    
    const success = await completeWorkOrder(
      workOrder.id,
      'Coordinator', // TODO: Get from auth context
      'coordinator',
      approvalNotes || undefined
    );
    
    if (success) {
      setApprovalNotes('');
    }
  };

  const handleReject = async () => {
    if (!workOrder) return;
    if (!approvalNotes.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    
    await rejectWorkOrder(
      workOrder.id,
      'Coordinator', // TODO: Get from auth context
      approvalNotes
    );
    
    setApprovalNotes('');
  };

  const handleUploadPhotos = (files: FileList) => {
    // Handle file upload logic here
    console.log("Uploaded files:", files);
  };

  if (!workOrder) {
    return (
      <div className="w-[480px] border-l flex flex-col" style={{ borderColor: "var(--border-default)" }}>
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div
            className="h-16 w-16 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: "var(--bg-hover)" }}
          >
            <CheckCircle className="h-8 w-8" style={{ color: "var(--text-tertiary)" }} />
          </div>
          <h3 className="text-[18px] mb-2" style={{ color: "var(--text-primary)" }}>
            Select a work order
          </h3>
          <p className="text-[14px] text-center" style={{ color: "var(--text-secondary)" }}>
            Choose a work order from the list to review completion photos and approve or reject the work
          </p>
        </div>
      </div>
    );
  }

  const beforePhotos = photos.filter(p => p.type === "before");
  const afterPhotos = photos.filter(p => p.type === "after");
  const hoursWaiting = workOrder.hoursOld || 0;
  const isUrgent = hoursWaiting > 12;

  return (
    <div className="w-[480px] border-l flex flex-col" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-card)" }}>
      {/* Header */}
      <div
        className="p-6 border-b"
        style={{ borderColor: "var(--border-default)" }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-[20px]" style={{ color: "var(--text-primary)" }}>
                Work Order #{workOrder.serviceRequestId}
              </h2>
              <Badge
                className="h-5 px-2 text-[11px]"
                style={{
                  backgroundColor: "var(--status-warning-bg)",
                  color: "var(--status-warning-text)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                {workOrder.status}
              </Badge>
            </div>
            <p className="text-[14px]" style={{ color: "var(--text-secondary)" }}>
              {workOrder.title}
            </p>
          </div>
        </div>

        {/* Urgency Warning */}
        {isUrgent && (
          <div
            className="flex items-center gap-2 p-3 rounded-lg mb-4"
            style={{
              backgroundColor: "var(--status-warning-bg)",
              border: `1px solid var(--status-warning-border)`,
            }}
          >
            <AlertTriangle className="h-4 w-4" style={{ color: "var(--status-warning-icon)" }} />
            <div className="flex-1">
              <div className="text-[13px]" style={{ color: "var(--status-warning-text)" }}>
                Waiting {hoursWaiting} hours for review
              </div>
            </div>
          </div>
        )}

        {/* Work Order Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" style={{ color: "var(--text-tertiary)" }} />
            <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
              Resident: {workOrder.residentName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" style={{ color: "var(--text-tertiary)" }} />
            <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
              {workOrder.propertyCode} - {workOrder.propertyAddress} · Unit {workOrder.unit}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" style={{ color: "var(--text-tertiary)" }} />
            <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
              Completed by: {workOrder.assignee || "Unknown"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" style={{ color: "var(--text-tertiary)" }} />
            <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
              Created: {workOrder.createdDate}
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Before Photos */}
        {beforePhotos.length > 0 && (
          <div className="p-6 border-b" style={{ borderColor: "var(--border-default)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px]" style={{ color: "var(--text-primary)" }}>
                Before Photos
              </h3>
              <Badge
                className="h-5 px-2 text-[11px]"
                style={{
                  backgroundColor: "var(--status-neutral-bg)",
                  color: "var(--status-neutral-text)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                {beforePhotos.length}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {beforePhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group border"
                  style={{ borderColor: "var(--border-default)" }}
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
                  >
                    <ZoomIn className="h-6 w-6" style={{ color: "white" }} />
                  </div>
                  <div
                    className="absolute bottom-0 left-0 right-0 p-2"
                    style={{
                      background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                    }}
                  >
                    <p className="text-[11px] text-white line-clamp-1">{photo.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* After Photos */}
        {afterPhotos.length > 0 && (
          <div className="p-6 border-b" style={{ borderColor: "var(--border-default)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px]" style={{ color: "var(--text-primary)" }}>
                After Photos
              </h3>
              <Badge
                className="h-5 px-2 text-[11px]"
                style={{
                  backgroundColor: "var(--status-success-bg)",
                  color: "var(--status-success-text)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                {afterPhotos.length}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {afterPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group border"
                  style={{ borderColor: "var(--border-default)" }}
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
                  >
                    <ZoomIn className="h-6 w-6" style={{ color: "white" }} />
                  </div>
                  <div
                    className="absolute bottom-0 left-0 right-0 p-2"
                    style={{
                      background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                    }}
                  >
                    <p className="text-[11px] text-white line-clamp-1">{photo.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload More Photos */}
        <div className="p-6 border-b" style={{ borderColor: "var(--border-default)" }}>
          <PhotoUploadButton
            onUpload={handleUploadPhotos}
            className="w-full h-12"
          />
        </div>

        {/* Approval Notes */}
        <div className="p-6">
          <label
            htmlFor="approval-notes"
            className="block mb-2 text-[14px]"
            style={{ color: "var(--text-primary)" }}
          >
            Notes & Comments
          </label>
          <Textarea
            id="approval-notes"
            placeholder="Add notes about the completed work, or reasons for rejection..."
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            rows={4}
            className="resize-none"
            style={{
              backgroundColor: "white",
              borderColor: "var(--border-default)",
            }}
          />
          <div className="flex items-center gap-2 mt-2">
            <MessageSquare className="h-3 w-3" style={{ color: "var(--text-tertiary)" }} />
            <span className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>
              These notes will be visible to the technician and tenant
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div
        className="p-6 border-t flex gap-3"
        style={{ borderColor: "var(--border-default)" }}
      >
        <Button
          variant="outline"
          className="flex-1 h-12 gap-2"
          onClick={handleReject}
          disabled={loading}
          style={{
            borderColor: "var(--status-critical-border)",
            color: "var(--status-critical-text)",
          }}
        >
          <XCircle className="h-5 w-5" />
          {loading ? 'Processing...' : 'Reject Work'}
        </Button>
        <Button
          className="flex-1 h-12 gap-2"
          onClick={handleApprove}
          disabled={loading}
          style={{
            backgroundColor: "var(--status-success-icon)",
            color: "white",
          }}
        >
          <CheckCircle className="h-5 w-5" />
          {loading ? 'Processing...' : 'Approve Work'}
        </Button>
      </div>

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-8"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.9)" }}
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.caption}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <div
              className="absolute top-4 left-4 px-3 py-2 rounded-lg"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
            >
              <Badge
                className="h-5 px-2 text-[11px] mb-2"
                style={{
                  backgroundColor: selectedPhoto.type === "before" 
                    ? "var(--status-neutral-bg)" 
                    : "var(--status-success-bg)",
                  color: selectedPhoto.type === "before" 
                    ? "var(--status-neutral-text)" 
                    : "var(--status-success-text)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                {selectedPhoto.type.toUpperCase()}
              </Badge>
              <p className="text-[13px] text-white">{selectedPhoto.caption}</p>
              <p className="text-[11px] text-gray-300 mt-1">{selectedPhoto.timestamp}</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="absolute top-4 right-4 h-10 w-10 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                // Download logic
                toast.success("Download started");
              }}
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                borderColor: "rgba(255, 255, 255, 0.3)",
                color: "white",
              }}
            >
              <Download className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

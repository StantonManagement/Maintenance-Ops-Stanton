import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "./ui/button";
import { WorkOrder } from "../types";
import { toast } from "sonner";

interface SendToTenantIssuesModalProps {
  workOrder: WorkOrder;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (issueId: string) => void;
}

export function SendToTenantIssuesModal({ workOrder, isOpen, onClose, onSuccess }: SendToTenantIssuesModalProps) {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState(
    `Tenant reported ${workOrder.title.toLowerCase()}. Work order created ${new Date().toLocaleDateString()}. Consider for lease renewal review.`
  );
  const [severity, setSeverity] = useState<"minor" | "moderate" | "serious">("moderate");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!category) {
      toast.error("Please select a category");
      return;
    }

    const issueId = Math.floor(Math.random() * 100) + 1;
    toast.success(`Tenant issue #${issueId} created and linked to ${workOrder.id}`);
    onSuccess?.(issueId.toString());
    onClose();
  };

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
        className="fixed top-1/2 left-1/2 z-50 w-[540px] animate-fade-in"
        style={{
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b" style={{ borderColor: 'var(--border-default)' }}>
          <h2 className="text-[20px]" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            Send to Tenant Issues
          </h2>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center transition-colors hover:bg-gray-100"
            style={{ borderRadius: 'var(--radius-md)' }}
          >
            <X className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Tenant Info */}
          <div>
            <p className="text-[14px] mb-1" style={{ color: 'var(--text-secondary)' }}>
              Creating issue for:
            </p>
            <p className="text-[16px]" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
              {workOrder.residentName} - {workOrder.propertyAddress} · {workOrder.unit}
            </p>
          </div>

          <div className="h-px" style={{ backgroundColor: 'var(--border-default)' }} />

          {/* Category */}
          <div>
            <label className="text-[14px] mb-2 block" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
              Category <span style={{ color: 'var(--status-critical-text)' }}>*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 px-3 text-[14px] border"
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <option value="">Select category...</option>
              <option value="noise">Noise Complaint</option>
              <option value="cleanliness">Cleanliness</option>
              <option value="unauthorized">Unauthorized Occupant</option>
              <option value="lease-violation">Lease Violation</option>
              <option value="property-damage">Property Damage</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="text-[14px] mb-2 block" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
              Description <span style={{ color: 'var(--status-critical-text)' }}>*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-[14px] border resize-y"
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-md)',
                minHeight: '120px',
              }}
            />
            <p className="text-[12px] mt-1" style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
              Auto-filled from work order - editable
            </p>
          </div>

          {/* Severity */}
          <div>
            <label className="text-[14px] mb-3 block" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
              Severity <span style={{ color: 'var(--status-critical-text)' }}>*</span>
            </label>
            <div className="flex items-center gap-6">
              {(['minor', 'moderate', 'serious'] as const).map((level) => (
                <label key={level} className="flex items-center gap-2 cursor-pointer">
                  <div className="relative">
                    <input
                      type="radio"
                      name="severity"
                      value={level}
                      checked={severity === level}
                      onChange={(e) => setSeverity(e.target.value as typeof severity)}
                      className="h-5 w-5 cursor-pointer"
                      style={{
                        accentColor: 'var(--action-primary)',
                      }}
                    />
                  </div>
                  <span className="text-[14px]" style={{ color: 'var(--text-primary)' }}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Info text */}
          <div
            className="p-3 text-[13px]"
            style={{
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-secondary)',
              borderRadius: 'var(--radius-md)',
              fontStyle: 'italic',
            }}
          >
            This will link Work Order #{workOrder.id} to the new tenant issue for tracking.
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
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="h-11 px-6 text-[14px]"
            style={{
              backgroundColor: 'var(--action-primary)',
              color: 'var(--text-inverted)',
              borderRadius: 'var(--radius-md)',
            }}
            onClick={handleSubmit}
          >
            Create Issue & Link
          </Button>
        </div>
      </div>
    </>
  );
}

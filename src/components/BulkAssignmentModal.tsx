import { useState } from "react";
import { X, CheckCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Avatar } from "./ui/avatar";
import { WorkOrder } from "../types";
import { toast } from "sonner";
import { useTechnicians } from "../hooks/useTechnicians";

interface BulkAssignmentModalProps {
  workOrders: WorkOrder[];
  onClose: () => void;
  onAssign: (workOrderIds: string[], technicianId: string) => Promise<void>;
}

export default function BulkAssignmentModal({ workOrders, onClose, onAssign }: BulkAssignmentModalProps) {
  const { technicians, loading } = useTechnicians();
  const [selectedWorkOrders, setSelectedWorkOrders] = useState<string[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  const toggleWorkOrder = (id: string) => {
    setSelectedWorkOrders((prev) =>
      prev.includes(id) ? prev.filter((woId) => woId !== id) : [...prev, id]
    );
  };

  const selectAllWorkOrders = () => {
    if (selectedWorkOrders.length === workOrders.length) {
      setSelectedWorkOrders([]);
    } else {
      setSelectedWorkOrders(workOrders.map((wo) => wo.id));
    }
  };

  const handleAssign = async () => {
    if (!selectedTechnician || selectedWorkOrders.length === 0) return;

    setAssigning(true);
    try {
      await onAssign(selectedWorkOrders, selectedTechnician);
      // Toast is handled by parent or here? PRP says success toast. 
      // Let's assume parent might handle data updates, but we can show toast here if parent doesn't throw.
      // But wait, WorkOrderList's console.log is sync. 
      // I'll update WorkOrderList to be async later.
      onClose();
    } catch (error) {
      console.error("Assignment failed", error);
      toast.error("Failed to assign work orders");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[85vh] rounded-lg flex flex-col animate-fade-in"
        style={{ backgroundColor: "var(--bg-card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: "var(--border-default)" }}
        >
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 600 }}>Bulk Assignment</h2>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
              Select work orders and assign to a technician
            </p>
          </div>
          <Button onClick={onClose} variant="ghost" size="icon" className="rounded-full">
            <X size={20} />
          </Button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Work Orders List */}
          <div className="flex-1 overflow-y-auto border-r" style={{ borderColor: "var(--border-default)" }}>
            <div
              className="sticky top-0 px-6 py-3 border-b flex items-center justify-between"
              style={{
                backgroundColor: "var(--bg-hover)",
                borderColor: "var(--border-default)",
              }}
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedWorkOrders.length === workOrders.length && workOrders.length > 0}
                  onCheckedChange={selectAllWorkOrders}
                />
                <span style={{ fontSize: "14px", fontWeight: 600 }}>
                  Select All ({selectedWorkOrders.length} of {workOrders.length})
                </span>
              </div>
            </div>

            <div className="p-4 space-y-2">
              {workOrders.map((wo) => (
                <div
                  key={wo.id}
                  className="flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-smooth hover-lift"
                  style={{
                    borderColor: selectedWorkOrders.includes(wo.id)
                      ? "var(--action-primary)"
                      : "var(--border-default)",
                    backgroundColor: selectedWorkOrders.includes(wo.id)
                      ? "rgba(37, 99, 235, 0.05)"
                      : "transparent",
                  }}
                  onClick={() => toggleWorkOrder(wo.id)}
                >
                  <Checkbox
                    checked={selectedWorkOrders.includes(wo.id)}
                    onCheckedChange={() => toggleWorkOrder(wo.id)}
                  />
                  <div className="flex-1">
                    <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>
                      {wo.title}
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                      {wo.propertyCode} - {wo.propertyAddress} · Unit {wo.unit} · {wo.createdDate}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Technician Selection */}
          <div className="w-80 overflow-y-auto">
            <div
              className="sticky top-0 px-6 py-3 border-b"
              style={{
                backgroundColor: "var(--bg-hover)",
                borderColor: "var(--border-default)",
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: 600 }}>Select Technician</span>
            </div>

            <div className="p-4 space-y-2">
              {loading ? (
                <div className="text-center p-4 text-muted-foreground">Loading technicians...</div>
              ) : technicians.length === 0 ? (
                <div className="text-center p-4 text-muted-foreground">No technicians available</div>
              ) : (
                technicians.map((tech) => {
                  const isSelected = selectedTechnician === tech.id;
                  const capacityPercent = (tech.capacity.current / tech.capacity.max) * 100;

                  return (
                    <div
                      key={tech.id}
                      className="p-4 rounded-lg border cursor-pointer transition-smooth hover-lift"
                      style={{
                        borderColor: isSelected ? "var(--action-primary)" : "var(--border-default)",
                        backgroundColor: isSelected ? "rgba(37, 99, 235, 0.05)" : "transparent",
                      }}
                      onClick={() => setSelectedTechnician(tech.id)}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="w-10 h-10">
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{
                              backgroundColor: "var(--action-primary)",
                              color: "white",
                              fontSize: "14px",
                            }}
                          >
                            {tech.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </div>
                        </Avatar>
                        <div className="flex-1">
                          <div style={{ fontSize: "14px", fontWeight: 600 }}>{tech.name}</div>
                          <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                            {tech.capacity.current}/{tech.capacity.max} work orders
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle size={20} style={{ color: "var(--action-primary)" }} />
                        )}
                      </div>

                      {/* Capacity Bar */}
                      <div className="space-y-1">
                        <div
                          className="h-2 rounded-full overflow-hidden"
                          style={{ backgroundColor: "var(--bg-hover)" }}
                        >
                          <div
                            className="h-full transition-all"
                            style={{
                              width: `${Math.min(capacityPercent, 100)}%`,
                              backgroundColor:
                                capacityPercent >= 100
                                  ? "var(--status-critical-icon)"
                                  : capacityPercent >= 80
                                  ? "var(--status-warning-icon)"
                                  : "var(--status-success-icon)",
                            }}
                          />
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                          {Math.round(capacityPercent)}% capacity
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="p-6 border-t flex gap-3"
          style={{ borderColor: "var(--border-default)" }}
        >
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            disabled={!selectedTechnician || selectedWorkOrders.length === 0 || assigning}
            onClick={handleAssign}
            style={{
              backgroundColor: "var(--action-primary)",
              color: "white",
              opacity: !selectedTechnician || selectedWorkOrders.length === 0 ? 0.5 : 1,
            }}
          >
            {assigning ? "Assigning..." : `Assign ${selectedWorkOrders.length > 0 ? `${selectedWorkOrders.length} Work Orders` : ""}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { X, CheckCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Avatar } from "./ui/avatar";
import { WorkOrder } from "../types";
import { toast } from "sonner";

interface BulkAssignmentModalProps {
  workOrders: WorkOrder[];
  onClose: () => void;
  onAssign: (workOrderIds: string[], technicianId: string) => void;
}

export default function BulkAssignmentModal({ workOrders, onClose, onAssign }: BulkAssignmentModalProps) {
  const [selectedWorkOrders, setSelectedWorkOrders] = useState<string[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<string | null>(null);

  const technicians = [
    { id: "mike", name: "Mike Johnson", avatar: "MJ", workload: 4, maxWorkload: 6, available: true },
    { id: "sarah", name: "Sarah Chen", avatar: "SC", workload: 3, maxWorkload: 6, available: true },
    { id: "carlos", name: "Carlos Rodriguez", avatar: "CR", workload: 5, maxWorkload: 6, available: true },
    { id: "emily", name: "Emily Davis", avatar: "ED", workload: 2, maxWorkload: 6, available: true },
  ];

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

  const handleAssign = () => {
    if (!selectedTechnician || selectedWorkOrders.length === 0) return;

    onAssign(selectedWorkOrders, selectedTechnician);
    const tech = technicians.find((t) => t.id === selectedTechnician);
    toast.success(`Assigned ${selectedWorkOrders.length} work orders to ${tech?.name}`);
    onClose();
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
              {technicians.map((tech) => {
                const isSelected = selectedTechnician === tech.id;
                const capacityPercent = (tech.workload / tech.maxWorkload) * 100;

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
                          {tech.avatar}
                        </div>
                      </Avatar>
                      <div className="flex-1">
                        <div style={{ fontSize: "14px", fontWeight: 600 }}>{tech.name}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                          {tech.workload}/{tech.maxWorkload} work orders
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
                            width: `${capacityPercent}%`,
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
              })}
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
            disabled={!selectedTechnician || selectedWorkOrders.length === 0}
            onClick={handleAssign}
            style={{
              backgroundColor: "var(--action-primary)",
              color: "white",
              opacity: !selectedTechnician || selectedWorkOrders.length === 0 ? 0.5 : 1,
            }}
          >
            Assign {selectedWorkOrders.length > 0 ? `${selectedWorkOrders.length} Work Orders` : ""}
          </Button>
        </div>
      </div>
    </div>
  );
}

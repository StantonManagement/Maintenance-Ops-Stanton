import { useNavigate, useParams } from "react-router-dom";
import { WorkOrderList } from "../components/WorkOrderList";
import { ApprovalInterface } from "../components/ApprovalInterface";
import { useWorkOrder } from "../hooks/useWorkOrders";
import { WorkOrder } from "../types";
import { CheckSquare } from "lucide-react";

export default function ApprovalPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { workOrder: selectedWorkOrder } = useWorkOrder(id);

  const handleSelectWorkOrder = (workOrder: WorkOrder) => {
    navigate(`/approval-queue/${workOrder.id}`);
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden">
      {/* Center Column: Approval List */}
      <WorkOrderList 
        selectedWorkOrderId={id}
        onSelectWorkOrder={handleSelectWorkOrder}
        viewMode="approval-queue"
      />

      {/* Right Column: Approval Interface */}
      {id ? (
        <ApprovalInterface workOrder={selectedWorkOrder || undefined} />
      ) : (
        <div className="w-[480px] border-l flex flex-col" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-card)" }}>
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: "var(--bg-hover)" }}
            >
              <CheckSquare className="h-8 w-8" style={{ color: "var(--text-tertiary)" }} />
            </div>
            <h3 className="text-[18px] mb-2" style={{ color: "var(--text-primary)" }}>
              Approval Queue
            </h3>
            <p className="text-[14px] text-center" style={{ color: "var(--text-secondary)" }}>
              Select a work order to review completion details
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

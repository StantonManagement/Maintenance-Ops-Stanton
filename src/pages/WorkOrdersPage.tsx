import { useParams, useNavigate } from "react-router-dom";
import { WorkOrderList } from "../components/WorkOrderList";
import { WorkOrderPreview } from "../components/WorkOrderPreview";
import { useWorkOrder } from "../hooks/useWorkOrders";
import { WorkOrder } from "../types";

export default function WorkOrdersPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { workOrder: selectedWorkOrder, loading: detailLoading } = useWorkOrder(id);

  const handleSelectWorkOrder = (workOrder: WorkOrder) => {
    navigate(`/work-orders/${workOrder.id}`);
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden">
      {/* Center Column: List */}
      <WorkOrderList 
        selectedWorkOrderId={id}
        onSelectWorkOrder={handleSelectWorkOrder}
        viewMode="work-orders"
      />

      {/* Right Column: Detail Preview */}
      {id && (
        <div className="w-[480px] border-l bg-card flex flex-col h-full overflow-hidden transition-all animate-slide-in-right">
          {detailLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Loading details...</p>
            </div>
          ) : (
            <WorkOrderPreview workOrder={selectedWorkOrder || undefined} />
          )}
        </div>
      )}
    </div>
  );
}

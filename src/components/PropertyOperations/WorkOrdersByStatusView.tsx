import type { WorkOrder } from '../../types';

interface WorkOrdersByStatusViewProps {
  workOrders: WorkOrder[];
}

// VERIFY: These status values match your actual data
const STATUS_COLUMNS = [
  { key: 'unscheduled', label: 'Unscheduled', color: 'bg-gray-100' },
  { key: 'scheduled', label: 'Scheduled', color: 'bg-blue-100' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-yellow-100' },
  { key: 'waiting_parts', label: 'Waiting Parts', color: 'bg-orange-100' },
  { key: 'ready_review', label: 'Ready for Review', color: 'bg-purple-100' },
] as const;

export function WorkOrdersByStatusView({ workOrders }: WorkOrdersByStatusViewProps) {
  // Group by status - VERIFY: field name is schedulingStatus or status
  const byStatus = STATUS_COLUMNS.reduce((acc, col) => {
    acc[col.key] = workOrders.filter(
      wo => (wo.schedulingStatus || wo.status)?.toLowerCase().includes(col.key.replace('_', ''))
    );
    return acc;
  }, {} as Record<string, WorkOrder[]>);

  return (
    <div className="grid grid-cols-5 gap-4">
      {STATUS_COLUMNS.map((col) => (
        <div key={col.key} className="space-y-2">
          <h3 className={`font-medium text-sm ${col.color} rounded px-2 py-1`}>
            {col.label} ({byStatus[col.key]?.length ?? 0})
          </h3>
          
          <div className="space-y-2">
            {(byStatus[col.key] ?? []).map((wo) => (
              <div 
                key={wo.id || wo.serviceRequestId}
                className="bg-white border rounded p-2 text-sm shadow-sm hover:shadow-md cursor-pointer"
              >
                <div className="font-medium">#{wo.serviceRequestId}</div>
                <div className="text-gray-600 text-xs truncate">{wo.description || wo.title}</div>
                <div className="text-gray-400 text-xs mt-1">{wo.unit}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

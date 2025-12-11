import { useWorkOrders } from '../../hooks/useWorkOrders';

interface MorningAccountabilityGateProps {
  propertyCode: string;
}

export function MorningAccountabilityGate({ propertyCode }: MorningAccountabilityGateProps) {
  // Adapted to match existing hook signature
  const { workOrders: allWorkOrders } = useWorkOrders();
  
  // Find work orders that were scheduled for yesterday but not completed
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const incompleteFromYesterday = (allWorkOrders ?? []).filter(wo => {
    if (wo.propertyCode !== propertyCode) return false;
    
    // VERIFY: Field names for scheduled date and completion status
    // Using schedulingStatus as per types/index.ts
    // Using scheduledDate which I added to types
    const scheduledDate = wo.scheduledDate ? new Date(wo.scheduledDate) : null;
    const isComplete = wo.status === 'COMPLETED' || wo.schedulingStatus === 'completed';
    
    return scheduledDate && 
           scheduledDate >= yesterday && 
           scheduledDate < today && 
           !isComplete;
  });
  
  if (incompleteFromYesterday.length === 0) {
    return null;
  }

  return (
    <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-6">
      <h3 className="font-semibold text-amber-800 mb-2">
        ⚠️ Morning Accountability: {incompleteFromYesterday.length} Incomplete from Yesterday
      </h3>
      <p className="text-sm text-amber-700 mb-3">
        These work orders were scheduled yesterday but not marked complete. 
        Review with technicians before assigning new work.
      </p>
      
      <div className="space-y-2">
        {incompleteFromYesterday.map((wo) => (
          <div 
            key={wo.id || wo.serviceRequestId}
            className="bg-white rounded p-2 text-sm flex justify-between items-center"
          >
            <div>
              <span className="font-medium">#{wo.serviceRequestId}</span>
              <span className="text-gray-600 ml-2">{wo.description || wo.title}</span>
            </div>
            <div className="text-amber-600">
              Assigned: {wo.assignedTechnicianName || wo.assignee || 'Unknown'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

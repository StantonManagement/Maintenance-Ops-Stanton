import { useStuckWorkOrders } from '../../hooks/usePropertyHealth';

export function StuckWorkOrdersWidget() {
  const { data: stuckOrders, isLoading } = useStuckWorkOrders();
  
  if (isLoading) return <div className="animate-pulse bg-gray-100 h-32 rounded-lg" />;
  
  const criticalStuck = stuckOrders?.filter(wo => {
    // Handling different date field names just in case, prioritizing createdDate from type
    const dateStr = wo.createdDate || (wo as any).created_at;
    if (!dateStr) return false;
    
    const createdDate = new Date(dateStr);
    const hoursStuck = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60);
    return hoursStuck > 72; // More than 3 days
  }) ?? [];
  
  if (criticalStuck.length === 0) {
    return null; // Don't show widget if nothing stuck
  }

  return (
    <div className="bg-orange-50 border border-orange-300 rounded-lg p-4">
      <h3 className="font-semibold text-orange-800 mb-3">
        🚨 {criticalStuck.length} Work Orders Stuck {">"} 72 Hours
      </h3>
      
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {criticalStuck.slice(0, 5).map((wo) => {
          const dateStr = wo.createdDate || (wo as any).created_at;
          const createdDate = new Date(dateStr);
          const hoursStuck = Math.round((Date.now() - createdDate.getTime()) / (1000 * 60 * 60));
          
          return (
            <div 
              key={wo.id || wo.serviceRequestId} 
              className="bg-white rounded p-2 text-sm flex justify-between items-center"
            >
              <div>
                <span className="font-medium">#{wo.serviceRequestId}</span>
                <span className="text-gray-600 ml-2">{wo.description || wo.title}</span>
              </div>
              <div className="text-orange-600 font-medium">
                {hoursStuck}h stuck
              </div>
            </div>
          );
        })}
      </div>
      
      {criticalStuck.length > 5 && (
        <div className="text-sm text-orange-600 mt-2">
          + {criticalStuck.length - 5} more stuck work orders
        </div>
      )}
    </div>
  );
}

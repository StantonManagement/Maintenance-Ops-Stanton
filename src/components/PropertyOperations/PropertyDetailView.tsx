import { useState } from 'react';
import { useWorkOrders } from '../../hooks/useWorkOrders';
import type { PropertyHealthMetrics, WorkOrder } from '../../types';
import { WorkOrdersByStatusView } from './WorkOrdersByStatusView';
import { MorningAccountabilityGate } from './MorningAccountabilityGate';

interface PropertyDetailViewProps {
  property: PropertyHealthMetrics;
  onBack: () => void;
}

type ViewTab = 'stuck_first' | 'by_status' | 'by_technician' | 'timeline';

export function PropertyDetailView({ property, onBack }: PropertyDetailViewProps) {
  const [activeTab, setActiveTab] = useState<ViewTab>('stuck_first');
  
  // Fetch work orders - Adapted to match existing hook signature
  const { workOrders: allWorkOrders, loading: isLoading } = useWorkOrders();
  
  // Filter to this property's work orders
  // VERIFY: Field name for property code/id matching
  const propertyWorkOrders = (allWorkOrders ?? []).filter(
    (wo) => wo.propertyCode === property.propertyCode
  );
  
  // Sort by stuck duration (longest first) for stuck_first view
  const sortedByStuck = [...propertyWorkOrders].sort((a, b) => {
    const aCreated = new Date(a.createdDate).getTime();
    const bCreated = new Date(b.createdDate).getTime();
    return aCreated - bCreated; // Oldest first
  });

  return (
    <div className="p-6 h-full flex flex-col flex-1 overflow-y-auto">
      {/* Header with back button */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold">
          {property.propertyName} - {propertyWorkOrders.length} Open Work Orders
        </h1>
      </div>
      
      {/* Morning Accountability Gate - Shows incomplete from yesterday */}
      <MorningAccountabilityGate propertyCode={property.propertyCode} />
      
      {/* Tab navigation */}
      <div className="flex gap-4 mb-6 border-b">
        {([
          { key: 'stuck_first', label: 'Stuck First' },
          { key: 'by_status', label: 'By Status' },
          { key: 'by_technician', label: 'By Technician' },
          { key: 'timeline', label: 'Timeline' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-2 px-1 ${
              activeTab === tab.key 
                ? 'border-b-2 border-blue-600 text-blue-600 font-medium' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab content */}
      {isLoading ? (
        <div className="text-gray-500">Loading work orders...</div>
      ) : activeTab === 'stuck_first' ? (
        <StuckFirstView workOrders={sortedByStuck} />
      ) : activeTab === 'by_status' ? (
        <WorkOrdersByStatusView workOrders={propertyWorkOrders} />
      ) : activeTab === 'by_technician' ? (
        <div className="text-gray-500">By Technician view - TODO</div>
      ) : (
        <div className="text-gray-500">Timeline view - TODO</div>
      )}
    </div>
  );
}

// Stuck First View - prioritizes oldest/most stuck
function StuckFirstView({ workOrders }: { workOrders: WorkOrder[] }) {
  return (
    <div className="space-y-3">
      {workOrders.map((wo, index) => {
        const createdDate = new Date(wo.createdDate);
        const hoursOld = Math.round((Date.now() - createdDate.getTime()) / (1000 * 60 * 60));
        const urgencyClass = hoursOld > 72 
          ? 'border-red-500 bg-red-50' 
          : hoursOld > 24 
            ? 'border-amber-500 bg-amber-50' 
            : 'border-gray-200 bg-white';
        
        return (
          <div 
            key={wo.id || wo.serviceRequestId}
            className={`border-l-4 ${urgencyClass} rounded p-3 flex justify-between items-start`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">#{index + 1}</span>
                <span className="font-medium">#{wo.serviceRequestId}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  wo.priority === 'emergency' ? 'bg-red-100 text-red-700' :
                  wo.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {wo.priority}
                </span>
              </div>
              <div className="text-sm text-gray-600 mt-1">{wo.description || wo.title}</div>
              <div className="text-xs text-gray-400 mt-1">
                {wo.unit} • Assigned: {wo.assignee || 'Unassigned'}
              </div>
            </div>
            <div className="text-right">
              <div className={`font-medium ${hoursOld > 72 ? 'text-red-600' : hoursOld > 24 ? 'text-amber-600' : 'text-gray-600'}`}>
                {hoursOld}h old
              </div>
              <div className="text-xs text-gray-400">
                {wo.status || wo.schedulingStatus}
              </div>
            </div>
          </div>
        );
      })}
      
      {workOrders.length === 0 && (
        <div className="text-gray-400 text-center py-8">No open work orders 🎉</div>
      )}
    </div>
  );
}

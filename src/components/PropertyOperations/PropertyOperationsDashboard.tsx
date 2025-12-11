import { useState } from 'react';
import { usePropertyHealth } from '../../hooks/usePropertyHealth';
import { PropertyHealthCard } from './PropertyHealthCard';
import { PropertyDetailView } from './PropertyDetailView';
import { StuckWorkOrdersWidget } from './StuckWorkOrdersWidget';
import type { PropertyHealthMetrics, PropertyOperationalStatus } from '../../types';

export function PropertyOperationsDashboard() {
  const { data: properties, isLoading, error } = usePropertyHealth();
  const [selectedProperty, setSelectedProperty] = useState<PropertyHealthMetrics | null>(null);

  if (isLoading) return <div className="p-6">Loading property health data...</div>;
  if (error) return <div className="p-6 text-red-600">Error loading properties</div>;

  // If a property is selected, show detail view
  if (selectedProperty) {
    return (
      <PropertyDetailView 
        property={selectedProperty}
        onBack={() => setSelectedProperty(null)}
      />
    );
  }

  // Sort properties by operational urgency
  const sortedProperties = [...(properties ?? [])].sort((a, b) => {
    // High priority: Inspection within 14 days
    const aInspectionUrgency = a.daysUntilInspection !== undefined && a.daysUntilInspection <= 14 ? 1 : 0;
    const bInspectionUrgency = b.daysUntilInspection !== undefined && b.daysUntilInspection <= 14 ? 1 : 0;
    
    if (aInspectionUrgency !== bInspectionUrgency) {
      return bInspectionUrgency - aInspectionUrgency;
    }

    const statusOrder: Record<PropertyOperationalStatus, number> = {
      compliance_critical: 0,
      emergency_active: 1,
      backlog_high: 2,
      on_track: 3,
      healthy: 4,
    };
    return (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5);
  });

  // Summary stats
  const totalEmergencies = properties?.reduce((sum, p) => sum + p.emergencyCount, 0) ?? 0;
  const totalOverdue = properties?.reduce((sum, p) => sum + p.overdueCount, 0) ?? 0;
  const totalStuck = properties?.reduce((sum, p) => sum + p.stuckCount, 0) ?? 0;
  const totalPendingReview = properties?.reduce((sum, p) => sum + p.readyForReviewCount, 0) ?? 0;
  const upcomingInspections = properties?.filter(p => p.daysUntilInspection !== undefined && p.daysUntilInspection <= 30).length ?? 0;

  return (
    <div className="p-6 space-y-6 h-full flex flex-col flex-1 overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Property Operations</h1>
        <div className="text-sm text-gray-500">
          Coordinator: Kristine • {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-700">{upcomingInspections}</div>
          <div className="text-sm text-purple-600">Upcoming Inspections</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-700">{totalEmergencies}</div>
          <div className="text-sm text-red-600">Active Emergencies</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-amber-700">{totalOverdue}</div>
          <div className="text-sm text-amber-600">Past SLA</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-700">{totalStuck}</div>
          <div className="text-sm text-orange-600">Stuck Work Orders</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-700">{totalPendingReview}</div>
          <div className="text-sm text-blue-600">Ready for Review</div>
        </div>
      </div>

      {/* Stuck Work Orders Widget - Always visible at top */}
      <StuckWorkOrdersWidget />

      {/* Property Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Properties by Operational Status</h2>
        {sortedProperties.map((property) => (
          <PropertyHealthCard
            key={property.id}
            property={property}
            onClick={() => setSelectedProperty(property)}
          />
        ))}
      </div>
    </div>
  );
}

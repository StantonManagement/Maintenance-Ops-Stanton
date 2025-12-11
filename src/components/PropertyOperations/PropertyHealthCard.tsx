import type { PropertyHealthMetrics, PropertyOperationalStatus } from '../../types';
import { ComplianceDeadlineBadge } from '../ComplianceDeadlineBadge';

interface PropertyHealthCardProps {
  property: PropertyHealthMetrics;
  onClick: () => void;
}

const STATUS_CONFIG: Record<PropertyOperationalStatus, { 
  emoji: string; 
  color: string; 
  label: string;
  borderColor: string;
}> = {
  compliance_critical: { 
    emoji: '🔴', 
    color: 'bg-red-50', 
    borderColor: 'border-red-500',
    label: 'COMPLIANCE CRITICAL' 
  },
  emergency_active: { 
    emoji: '🚨', 
    color: 'bg-red-50', 
    borderColor: 'border-red-400',
    label: 'EMERGENCY ACTIVE' 
  },
  backlog_high: { 
    emoji: '🟠', 
    color: 'bg-orange-50', 
    borderColor: 'border-orange-500',
    label: 'HIGH BACKLOG' 
  },
  on_track: { 
    emoji: '🟡', 
    color: 'bg-yellow-50', 
    borderColor: 'border-yellow-500',
    label: 'ON TRACK' 
  },
  healthy: { 
    emoji: '✅', 
    color: 'bg-green-50', 
    borderColor: 'border-green-500',
    label: 'HEALTHY' 
  },
};

export function PropertyHealthCard({ property, onClick }: PropertyHealthCardProps) {
  const config = STATUS_CONFIG[property.status];
  
  // Auto-calculate exposure if not provided by backend
  // Fallback: $1300 avg rent (Section 8 standard in this portfolio)
  const rentAtRisk = property.inspectionRentAtRisk || (property.unitsAtRisk ? property.unitsAtRisk * 1300 : 0);
  const isCalculated = !property.inspectionRentAtRisk && rentAtRisk > 0;

  return (
    <div 
      className={`border-l-4 ${config.borderColor} ${config.color} rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">
          {config.emoji} {property.propertyName} ({property.propertyCode}) - {config.label}
        </h2>
        <div className="flex items-center gap-3">
          {property.daysUntilInspection !== undefined && (
            <ComplianceDeadlineBadge 
              daysUntil={property.daysUntilInspection}
              type={property.nextInspectionType}
            />
          )}
          <span className="text-sm text-gray-500">{property.totalUnits} units</span>
        </div>
      </div>
      
      {/* Inspection warning if applicable */}
      {rentAtRisk > 0 && (
        <div className="text-sm text-red-600 mb-2 font-medium flex items-center gap-2">
          <span>⚠️ Inspection Risk:</span>
          <span>${rentAtRisk.toLocaleString()}/mo rent at risk {isCalculated && <span className="text-xs font-normal text-red-500">(est.)</span>}</span>
          {property.unitsAtRisk && <span>({property.unitsAtRisk} units)</span>}
        </div>
      )}
      
      {/* Work order breakdown */}
      <div className="grid grid-cols-5 gap-2 text-sm mb-2">
        <div>
          <span className="text-gray-500">Open:</span>{' '}
          <span className="font-medium">{property.openWorkOrders}</span>
        </div>
        <div className={property.emergencyCount > 0 ? 'text-red-600' : ''}>
          <span className="text-gray-500">Emergency:</span>{' '}
          <span className="font-medium">{property.emergencyCount}</span>
        </div>
        <div className={property.overdueCount > 0 ? 'text-amber-600' : ''}>
          <span className="text-gray-500">Overdue:</span>{' '}
          <span className="font-medium">{property.overdueCount}</span>
        </div>
        <div className={property.stuckCount > 0 ? 'text-orange-600' : ''}>
          <span className="text-gray-500">Stuck:</span>{' '}
          <span className="font-medium">{property.stuckCount}</span>
        </div>
        <div className={property.readyForReviewCount > 0 ? 'text-blue-600' : ''}>
          <span className="text-gray-500">Review:</span>{' '}
          <span className="font-medium">{property.readyForReviewCount}</span>
        </div>
      </div>
      
      {/* Performance metrics */}
      <div className="flex gap-4 text-xs text-gray-500">
        <span>Avg Resolution: {property.avgResolutionHours.toFixed(1)}h</span>
        <span>First-Time Fix: {Math.round(property.firstTimeFixRate * 100)}%</span>
        {property.estimatedLiabilityAtStake > 0 && (
          <span className="text-red-600">
            ${property.estimatedLiabilityAtStake.toLocaleString()} liability at stake
          </span>
        )}
      </div>
    </div>
  );
}

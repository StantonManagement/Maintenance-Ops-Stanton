# Property Operations Dashboard - Project Requirement Proposal (PRP)

## Overview

Create a new "Property Operations Dashboard" that provides building-level visibility and stuck-first prioritization for maintenance work orders. The system scales from 150 to 5,000+ units across multiple properties with different compliance urgency levels (Section 8 inspections, CAO licenses, emergency response).

## Critical Implementation Rules

### BEFORE WRITING ANY CODE:
1. Check `src/types/index.ts` (or equivalent) for existing types - USE THEM, don't invent new ones
2. Verify property names match actual type definitions (e.g., `serviceRequestId` not `workOrderId`)
3. Check if hooks/services already exist before creating new ones
4. Run `npx tsc --noEmit` after EVERY file change
5. Remember: All `AF_` tables are READ ONLY - never write to them

### NEVER:
- Create types without adding them to the types file first
- Import from paths that don't exist
- Assume barrel exports (index.ts) exist - import from specific files
- Use string literals where enums exist
- Write to AppFolio sync tables (AF_ prefix)

---

## Context Files to Reference

### Existing Types (READ THESE FIRST):
- `src/types/index.ts` or `src/types/database.ts` - ALL type definitions
- `src/types/work-order.ts` - if separate work order types exist

### Existing Components to Study:
- `src/components/Dispatch/DispatchPage.tsx` - current dispatch implementation
- `src/components/WorkOrders/` - work order card patterns
- `src/views/WorkOrdersView.tsx` - table view reference

### Existing Hooks (USE THESE, don't recreate):
- `src/hooks/useWorkOrders.ts` - work order data fetching
- `src/hooks/useTechnicians.ts` - technician data fetching
- `src/hooks/useCoordinatorMorningQueue.ts` - morning accountability queue (if exists)

### Existing Services:
- `src/services/` - check what exists before creating new ones
- `src/lib/supabase.ts` - Supabase client configuration

---

## Phase 1: Type Definitions & Data Layer

### Task 1.1: Add Property Health Types
**File to modify:** `src/types/index.ts`

**FIRST:** Search the file for existing Property type. If it exists, extend it. If not, add:

```typescript
// Property operational status for prioritization
export type PropertyOperationalStatus = 
  | 'compliance_critical'    // Section 8 inspection or CAO license imminent
  | 'emergency_active'       // Has active emergency work orders
  | 'backlog_high'          // >5 work orders waiting >72 hours
  | 'on_track'              // Meeting SLA targets
  | 'healthy';              // All clear

// Property health metrics
export interface PropertyHealthMetrics {
  id: string;
  propertyCode: string;
  propertyName: string;
  status: PropertyOperationalStatus;
  totalUnits: number;
  
  // Work order counts
  openWorkOrders: number;
  emergencyCount: number;
  overdueCount: number;           // Past SLA
  stuckCount: number;             // >72 hours no progress
  readyForReviewCount: number;    // Awaiting coordinator approval
  
  // Compliance tracking
  nextInspectionDate?: string;    // ISO date
  inspectionType?: 'section_8' | 'cao_license' | 'city_code' | 'routine';
  daysUntilInspection?: number;
  
  // Performance metrics
  avgResolutionHours: number;
  firstTimeFixRate: number;       // 0-1
  tenantSatisfactionScore: number; // 0-1
  
  // Revenue impact
  monthlyMaintenanceCost: number;
  estimatedLiabilityAtStake: number;
  
  created_at: string;
  updated_at: string;
}

// Work order stuck reasons
export type StuckReason = 
  | 'waiting_parts'
  | 'waiting_access'
  | 'waiting_vendor'
  | 'waiting_approval'
  | 'technician_overloaded'
  | 'unassigned'
  | 'unknown';

// Extended work order status for stuck tracking
export interface WorkOrderStuckInfo {
  workOrderId: string;
  stuckSince: string;             // ISO datetime
  stuckDurationHours: number;
  stuckReason: StuckReason;
  lastActionDate: string;
  lastActionBy: string;
  blockingIssue?: string;
}
```

**VERIFICATION:** Run `npx tsc --noEmit` - must pass before proceeding.

### Task 1.2: Extend Work Order Type (if needed)
**File to modify:** `src/types/index.ts`

**FIRST:** Find the existing `WorkOrder` interface. Add these fields if missing:

```typescript
// Add to existing WorkOrder interface:
interface WorkOrder {
  // ... existing fields (DO NOT REMOVE ANY) ...
  
  // New fields for Property Operations Dashboard
  propertyId?: string;
  stuckInfo?: WorkOrderStuckInfo;
  hoursUntilSLABreach?: number;
  isOverdue?: boolean;
  lastProgressUpdate?: string;
}
```

**VERIFICATION:** Run `npx tsc --noEmit` - must pass before proceeding.

### Task 1.3: Create Property Health Hook
**File to create:** `src/hooks/usePropertyHealth.ts`

**FIRST:** Check if this file already exists. If so, extend it instead of creating.

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { PropertyHealthMetrics, PropertyOperationalStatus } from '@/types';

// Calculate operational status from metrics
function calculateStatus(metrics: Partial<PropertyHealthMetrics>): PropertyOperationalStatus {
  if (metrics.daysUntilInspection && metrics.daysUntilInspection <= 14) {
    return 'compliance_critical';
  }
  if (metrics.emergencyCount && metrics.emergencyCount > 0) {
    return 'emergency_active';
  }
  if (metrics.stuckCount && metrics.stuckCount > 5) {
    return 'backlog_high';
  }
  if (metrics.overdueCount && metrics.overdueCount > 0) {
    return 'on_track'; // Has issues but managing
  }
  return 'healthy';
}

export function usePropertyHealth() {
  return useQuery({
    queryKey: ['property-health'],
    queryFn: async (): Promise<PropertyHealthMetrics[]> => {
      // VERIFY: Adjust table/view name to match your schema
      // This might need to be a view that aggregates work order data by property
      const { data, error } = await supabase
        .from('v_property_health_metrics')  // Or build from work orders
        .select('*');
      
      if (error) throw error;
      
      // Calculate status for each property
      return (data ?? []).map(property => ({
        ...property,
        status: calculateStatus(property),
      }));
    },
  });
}

export function usePropertyHealthById(propertyId: string) {
  return useQuery({
    queryKey: ['property-health', propertyId],
    queryFn: async (): Promise<PropertyHealthMetrics | null> => {
      const { data, error } = await supabase
        .from('v_property_health_metrics')
        .select('*')
        .eq('id', propertyId)
        .single();
      
      if (error) throw error;
      return data ? { ...data, status: calculateStatus(data) } : null;
    },
    enabled: !!propertyId,
  });
}

// Hook for stuck work orders across all properties
export function useStuckWorkOrders() {
  return useQuery({
    queryKey: ['stuck-work-orders'],
    queryFn: async () => {
      // VERIFY: Adjust to match your work order table/view
      const { data, error } = await supabase
        .from('v_work_orders_with_messages')
        .select('*')
        .or('schedulingStatus.eq.unscheduled,schedulingStatus.is.null')
        .order('created_at', { ascending: true }); // Oldest first = stuck longest
      
      if (error) throw error;
      return data ?? [];
    },
  });
}
```

**VERIFICATION:** 
1. Run `npx tsc --noEmit`
2. Check that `supabase` import path is correct for this project

---

## Phase 2: Property Operations Dashboard (Main View)

### Task 2.1: Create Operations Dashboard Route
**File to create:** `src/pages/PropertyOperations.tsx` (or appropriate route location)

```typescript
import { PropertyOperationsDashboard } from '@/components/PropertyOperations/PropertyOperationsDashboard';

export default function PropertyOperationsPage() {
  return <PropertyOperationsDashboard />;
}
```

### Task 2.2: Create Main Dashboard Component
**File to create:** `src/components/PropertyOperations/PropertyOperationsDashboard.tsx`

**FIRST:** Check if this directory/file exists. If so, review what's there before modifying.

```typescript
'use client';

import { useState } from 'react';
import { usePropertyHealth } from '@/hooks/usePropertyHealth';
import { PropertyHealthCard } from './PropertyHealthCard';
import { PropertyDetailView } from './PropertyDetailView';
import { StuckWorkOrdersWidget } from './StuckWorkOrdersWidget';
import type { PropertyHealthMetrics, PropertyOperationalStatus } from '@/types';

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Property Operations</h1>
        <div className="text-sm text-gray-500">
          Coordinator: Kristine • {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
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
```

**VERIFICATION:** Run `npx tsc --noEmit` before proceeding.

### Task 2.3: Create PropertyHealthCard Component
**File to create:** `src/components/PropertyOperations/PropertyHealthCard.tsx`

```typescript
'use client';

import type { PropertyHealthMetrics, PropertyOperationalStatus } from '@/types';

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
  
  return (
    <div 
      className={`border-l-4 ${config.borderColor} ${config.color} rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">
          {config.emoji} {property.propertyName} ({property.propertyCode}) - {config.label}
        </h2>
        <span className="text-sm text-gray-500">{property.totalUnits} units</span>
      </div>
      
      {/* Inspection warning if applicable */}
      {property.daysUntilInspection !== undefined && property.daysUntilInspection <= 30 && (
        <div className="text-sm text-red-600 mb-2">
          ⚠️ {property.inspectionType?.replace('_', ' ')} inspection in {property.daysUntilInspection} days
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
```

**VERIFICATION:** Run `npx tsc --noEmit` before proceeding.

### Task 2.4: Create StuckWorkOrdersWidget Component
**File to create:** `src/components/PropertyOperations/StuckWorkOrdersWidget.tsx`

```typescript
'use client';

import { useStuckWorkOrders } from '@/hooks/usePropertyHealth';

export function StuckWorkOrdersWidget() {
  const { data: stuckOrders, isLoading } = useStuckWorkOrders();
  
  if (isLoading) return <div className="animate-pulse bg-gray-100 h-32 rounded-lg" />;
  
  const criticalStuck = stuckOrders?.filter(wo => {
    // VERIFY: Adjust field names to match your WorkOrder type
    const createdDate = new Date(wo.createdDate || wo.created_at);
    const hoursStuck = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60);
    return hoursStuck > 72; // More than 3 days
  }) ?? [];
  
  if (criticalStuck.length === 0) {
    return null; // Don't show widget if nothing stuck
  }

  return (
    <div className="bg-orange-50 border border-orange-300 rounded-lg p-4">
      <h3 className="font-semibold text-orange-800 mb-3">
        🚨 {criticalStuck.length} Work Orders Stuck &gt; 72 Hours
      </h3>
      
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {criticalStuck.slice(0, 5).map((wo) => {
          // VERIFY: Field names match your WorkOrder type
          const createdDate = new Date(wo.createdDate || wo.created_at);
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
```

---

## Phase 3: Property Detail View

### Task 3.1: Create PropertyDetailView Component
**File to create:** `src/components/PropertyOperations/PropertyDetailView.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useWorkOrders } from '@/hooks/useWorkOrders';
import type { PropertyHealthMetrics, WorkOrder } from '@/types';
import { WorkOrdersByStatusView } from './WorkOrdersByStatusView';
import { MorningAccountabilityGate } from './MorningAccountabilityGate';

interface PropertyDetailViewProps {
  property: PropertyHealthMetrics;
  onBack: () => void;
}

type ViewTab = 'stuck_first' | 'by_status' | 'by_technician' | 'timeline';

export function PropertyDetailView({ property, onBack }: PropertyDetailViewProps) {
  const [activeTab, setActiveTab] = useState<ViewTab>('stuck_first');
  
  // Fetch work orders - VERIFY: Check useWorkOrders signature
  const { data: allWorkOrders, isLoading } = useWorkOrders();
  
  // Filter to this property's work orders
  // VERIFY: Field name for property code/id matching
  const propertyWorkOrders = (allWorkOrders ?? []).filter(
    (wo) => wo.propertyCode === property.propertyCode
  );
  
  // Sort by stuck duration (longest first) for stuck_first view
  const sortedByStuck = [...propertyWorkOrders].sort((a, b) => {
    const aCreated = new Date(a.createdDate || a.created_at).getTime();
    const bCreated = new Date(b.createdDate || b.created_at).getTime();
    return aCreated - bCreated; // Oldest first
  });

  return (
    <div className="p-6">
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
        const createdDate = new Date(wo.createdDate || wo.created_at);
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
                {wo.unitName} • Assigned: {wo.assignedTechnicianName || 'Unassigned'}
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
```

### Task 3.2: Create WorkOrdersByStatusView Component
**File to create:** `src/components/PropertyOperations/WorkOrdersByStatusView.tsx`

```typescript
'use client';

import type { WorkOrder } from '@/types';

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
                <div className="text-gray-400 text-xs mt-1">{wo.unitName}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Task 3.3: Create MorningAccountabilityGate Component
**File to create:** `src/components/PropertyOperations/MorningAccountabilityGate.tsx`

```typescript
'use client';

import { useWorkOrders } from '@/hooks/useWorkOrders';

interface MorningAccountabilityGateProps {
  propertyCode: string;
}

export function MorningAccountabilityGate({ propertyCode }: MorningAccountabilityGateProps) {
  // VERIFY: Check if useCoordinatorMorningQueue hook exists and use it instead
  const { data: allWorkOrders } = useWorkOrders();
  
  // Find work orders that were scheduled for yesterday but not completed
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const incompleteFromYesterday = (allWorkOrders ?? []).filter(wo => {
    if (wo.propertyCode !== propertyCode) return false;
    
    // VERIFY: Field names for scheduled date and completion status
    const scheduledDate = wo.scheduledDate ? new Date(wo.scheduledDate) : null;
    const isComplete = wo.status === 'completed' || wo.schedulingStatus === 'completed';
    
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
              Assigned: {wo.assignedTechnicianName || 'Unknown'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Phase 4: Index File & Navigation Integration

### Task 4.1: Create Component Index
**File to create:** `src/components/PropertyOperations/index.ts`

```typescript
export { PropertyOperationsDashboard } from './PropertyOperationsDashboard';
export { PropertyHealthCard } from './PropertyHealthCard';
export { PropertyDetailView } from './PropertyDetailView';
export { WorkOrdersByStatusView } from './WorkOrdersByStatusView';
export { StuckWorkOrdersWidget } from './StuckWorkOrdersWidget';
export { MorningAccountabilityGate } from './MorningAccountabilityGate';
```

### Task 4.2: Add to Navigation
**File to modify:** Find the navigation/sidebar component

Add link to Property Operations dashboard in the navigation, likely in Phase 1 (Active) section alongside existing nav items.

---

## Phase 5: Database Views (Document Only)

### Required Supabase Views

**v_property_health_metrics view:**
```sql
-- Aggregates work order data by property for dashboard
-- This should be created in Supabase if it doesn't exist
CREATE OR REPLACE VIEW v_property_health_metrics AS
SELECT 
  p.id,
  p.code as propertyCode,
  p.name as propertyName,
  p.total_units as totalUnits,
  
  -- Work order counts
  COUNT(wo.id) FILTER (WHERE wo.status != 'completed') as openWorkOrders,
  COUNT(wo.id) FILTER (WHERE wo.priority = 'emergency' AND wo.status != 'completed') as emergencyCount,
  COUNT(wo.id) FILTER (WHERE wo.created_at < NOW() - INTERVAL '72 hours' AND wo.status != 'completed') as stuckCount,
  COUNT(wo.id) FILTER (WHERE /* SLA breach logic */) as overdueCount,
  COUNT(wo.id) FILTER (WHERE wo.status = 'ready_review') as readyForReviewCount,
  
  -- Performance metrics
  AVG(EXTRACT(EPOCH FROM (wo.completed_at - wo.created_at))/3600) 
    FILTER (WHERE wo.status = 'completed') as avgResolutionHours,
  
  -- Compliance (join to inspections table if exists)
  -- inspection fields...
  
  NOW() as updated_at
FROM properties p
LEFT JOIN AF_work_order_new wo ON wo.property_code = p.code
GROUP BY p.id, p.code, p.name, p.total_units;
```

---

## Verification Checklist

After EACH phase, run these checks:

- [ ] `npx tsc --noEmit` exits with 0 errors
- [ ] `npm run lint` passes (if configured)
- [ ] App loads without console errors
- [ ] New route `/property-operations` is accessible (adjust path as needed)

### Phase 1 Verification:
- [ ] Types added to types file
- [ ] No duplicate type definitions
- [ ] Hooks import types correctly
- [ ] No writes to AF_ tables

### Phase 2 Verification:
- [ ] Dashboard renders with property cards
- [ ] Properties sorted by operational status
- [ ] Summary stats display correctly
- [ ] Stuck work orders widget shows data

### Phase 3 Verification:
- [ ] Detail view shows work orders for selected property
- [ ] Back button returns to dashboard
- [ ] Tab switching works
- [ ] Morning accountability gate shows incomplete from yesterday

### Phase 4 Verification:
- [ ] Navigation link appears
- [ ] Route accessible from nav
- [ ] Component exports work

---

## Implementation Order

1. **STOP** - Read existing types file completely
2. **STOP** - Check what hooks already exist
3. Phase 1: Types and hooks
4. Run `npx tsc --noEmit` - fix any errors
5. Phase 2: Dashboard components
6. Run `npx tsc --noEmit` - fix any errors
7. Phase 3: Detail view components
8. Run `npx tsc --noEmit` - fix any errors
9. Phase 4: Navigation
10. Full test in browser

---

## Common Mistakes to Avoid

| Wrong | Right |
|-------|-------|
| `wo.workOrderId` | `wo.serviceRequestId` |
| `wo.createdAt` | `wo.createdDate` or `wo.created_at` |
| `wo.technicianName` | `wo.assignedTechnicianName` |
| Writing to `AF_work_order_new` | Only SELECT from AF_ tables |
| `import { X } from '@/components/ui'` | `import { X } from '@/components/ui/X'` |
| Inventing new types | Check types file first |
| `any` type | Proper type from types file |

---

## Success Criteria

1. Property Operations Dashboard loads without errors
2. Properties display with correct operational status indicators
3. Clicking property shows detail view with work orders
4. Work orders sorted by "stuck duration" in default view
5. Morning accountability gate shows yesterday's incomplete work
6. All TypeScript compiles cleanly
7. No writes attempted to read-only AF_ tables
8. Existing Dispatch and Work Orders views still work

import { useWorkOrders } from './useWorkOrders';
import { useTechnicians } from './useTechnicians';
import { WorkOrderWithExtras } from '@/components/work-orders/WorkOrderRow';
import { getUrgencyTier } from '@/lib/deadline-utils';
import { useMemo } from 'react';

export interface MorningQueueData {
  items: WorkOrderWithExtras[];
  capacity: {
    availableHours: number;
    requiredHours: number;
  };
  grouped: {
    overdue: WorkOrderWithExtras[];
    'due-today': WorkOrderWithExtras[];
    critical: WorkOrderWithExtras[];
    warning: WorkOrderWithExtras[];
    watch: WorkOrderWithExtras[];
    scheduled: WorkOrderWithExtras[];
  };
  totalExposure: number;
  loading: boolean;
  error: Error | null;
  assignWorkOrder: any; // Using the one from useWorkOrders
}

export function useMorningQueue(): MorningQueueData {
  const { workOrders: dbWorkOrders, loading: loadingOrders, error: errorOrders, assignWorkOrder } = useWorkOrders();
  const { technicians, loading: loadingTechs, error: errorTechs } = useTechnicians();

  // Transform work orders
  const items = useMemo(() => {
    return dbWorkOrders.map(wo => ({
      ...wo,
      deadline: wo.deadlineInfo ? new Date(Date.now() + wo.deadlineInfo.hoursRemaining * 3600000).toISOString() : undefined,
      unitRent: 1500 // Mock
    })) as WorkOrderWithExtras[];
  }, [dbWorkOrders]);

  // Group items
  const grouped = useMemo(() => {
    const groups: MorningQueueData['grouped'] = {
      overdue: [],
      'due-today': [],
      critical: [],
      warning: [],
      watch: [],
      scheduled: [],
    };

    items.forEach(item => {
        // Filter out completed? 
        if (['COMPLETED', 'CANCELLED'].includes(item.status.toUpperCase())) return;

        const tier = getUrgencyTier(item.deadline || null);
        if (tier && groups[tier]) {
            groups[tier].push(item);
        } else {
            groups.scheduled.push(item); // Default to scheduled if tier not found or null
        }
    });
    return groups;
  }, [items]);

  // Calculate Capacity
  const capacity = useMemo(() => {
    // Sum available hours from techs (mock logic if field missing)
    // Assume each tech has 8h/day * 5 = 40h/week ? Or just today? 
    // PRP says "This Week's Capacity".
    const availableHours = technicians.length * 40; 
    
    // Sum required hours from incomplete items
    // Use aiEstimatedHours or default 2h
    const requiredHours = items.reduce((sum, item) => {
        if (['COMPLETED', 'CANCELLED'].includes(item.status.toUpperCase())) return sum;
        return sum + (item.aiEstimatedHours || 2);
    }, 0);

    return { availableHours, requiredHours };
  }, [technicians, items]);

  // Calculate Exposure
  const totalExposure = useMemo(() => {
    return items.reduce((sum, item) => {
        if (['COMPLETED', 'CANCELLED'].includes(item.status.toUpperCase())) return sum;
        return sum + (item.unitRent || 0);
    }, 0);
  }, [items]);

  return {
    items,
    capacity,
    grouped,
    totalExposure,
    loading: loadingOrders || loadingTechs,
    error: errorOrders || errorTechs,
    assignWorkOrder
  };
}

import { useWorkOrders } from './useWorkOrders';
import { useTechnicians } from './useTechnicians';
import { Technician } from '@/types';
import { useMemo } from 'react';

export interface TechnicianWithAvailability extends Technician {
  status: 'available' | 'in-transit' | 'unavailable'; // Aligning with type definition
  // Technician type already has capacity info
}

export function useDispatchData() {
  const { workOrders, loading: loadingOrders, error: errorOrders, assignWorkOrder } = useWorkOrders();
  const { technicians, loading: loadingTechs, error: errorTechs } = useTechnicians();

  const unassignedWorkOrders = useMemo(() => {
    return workOrders.filter(wo => 
      // Unassigned logic: no assignee and not completed
      (!wo.assignee && !wo.assignedTechnicianName) && 
      !['COMPLETED', 'CANCELLED'].includes(wo.status.toUpperCase())
    );
  }, [workOrders]);

  const loading = loadingOrders || loadingTechs;
  const error = errorOrders || errorTechs;

  return {
    unassignedWorkOrders,
    technicians, // technicians already have capacity info from useTechnicians
    loading,
    error,
    assignWorkOrder
  };
}

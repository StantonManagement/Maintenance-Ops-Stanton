import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { useActivePortfolio } from '@/providers/PortfolioProvider';
import type { WorkOrder } from '@/types';

const REVIEW_STATUSES = ['ready_review', 'Ready for Review', 'READY_REVIEW'];

function transformWorkOrder(row: any): WorkOrder {
  // Handle joined data from properties and units
  const property = row.properties || {};
  const unit = row.units || {};
  const technician = row.technicians || {};
  
  return {
    id: row.id,
    serviceRequestId: row.service_request_id || row.id,
    workOrderNumber: row.work_order_number || 0,
    title: row.title || row.description || 'No Description',
    description: row.description || '',
    status: row.status,
    priority: row.priority || 'normal',
    propertyCode: property.code || row.property_id || '',
    propertyAddress: property.address_full || property.name || '',
    unit: unit.unit_number || row.unit_id || '',
    residentName: row.tenant_name || '',
    assignee: technician.name || row.assigned_technician_id || '',
    assignedTechnicianName: technician.name,
    createdDate: row.created_at || new Date().toISOString(),
    scheduledDate: row.scheduled_date,
    messageCount: 0,
    unreadCount: 0,
    isNew: false,
    hoursOld: 0,
    actionsLog: [],
  };
}

export function useApprovalQueue() {
  const { activePortfolio } = useActivePortfolio();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchQueue = useCallback(async () => {
    if (!activePortfolio?.id) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error: fetchError } = await supabase
        .from('work_orders')
        .select(`
          *,
          properties (name, address_full, code),
          units (unit_number),
          technicians (name)
        `)
        .eq('portfolio_id', activePortfolio.id)
        .in('status', REVIEW_STATUSES)
        .order('created_at', { ascending: true }); // Oldest first (FIFO)

      if (fetchError) throw fetchError;

      setWorkOrders((data || []).map(transformWorkOrder));
      setError(null);
    } catch (err) {
      console.error('Error fetching approval queue:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch'));
    } finally {
      setLoading(false);
    }
  }, [activePortfolio?.id]);

  const approveWorkOrder = useCallback(async (workOrderId: string) => {
    try {
      const { error: updateError } = await (supabase
        .from('work_orders') as any)
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', workOrderId);

      if (updateError) throw updateError;

      // Remove from local state
      setWorkOrders(prev => prev.filter(wo => wo.id !== workOrderId));
      
      return true;
    } catch (err) {
      console.error('Error approving work order:', err);
      throw err;
    }
  }, []);

  const rejectWorkOrder = useCallback(async (workOrderId: string, reason: string) => {
    try {
      const { error: updateError } = await (supabase
        .from('work_orders') as any)
        .update({ 
          status: 'in_progress',
          rejection_reason: reason,
          rejection_count: 1 // Could increment if we track multiple rejections
        })
        .eq('id', workOrderId);

      if (updateError) throw updateError;

      // Remove from local state
      setWorkOrders(prev => prev.filter(wo => wo.id !== workOrderId));
      
      return true;
    } catch (err) {
      console.error('Error rejecting work order:', err);
      throw err;
    }
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    fetchQueue();
  }, [fetchQueue]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  return {
    workOrders,
    loading,
    error,
    queueCount: workOrders.length,
    approveWorkOrder,
    rejectWorkOrder,
    refetch,
  };
}

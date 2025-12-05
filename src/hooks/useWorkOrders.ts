import { useState, useEffect } from 'react'
import { supabase, WorkOrderFromDB, TABLES } from '../services/supabase'
import { WorkOrder, Priority } from '../types'
import { useRealtimeSubscription } from './useRealtimeSubscription'
import { toast } from 'sonner'

export function useWorkOrders() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchWorkOrders()
  }, [])

  useRealtimeSubscription({
    table: TABLES.WORK_ORDERS,
    onData: (payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      
      if (eventType === 'INSERT') {
        const newWorkOrder = transformWorkOrder(newRecord as WorkOrderFromDB);
        setWorkOrders((prev) => [newWorkOrder, ...prev]);
        toast.info('New work order received');
      } else if (eventType === 'UPDATE') {
        const updatedWorkOrder = transformWorkOrder(newRecord as WorkOrderFromDB);
        setWorkOrders((prev) => prev.map((wo) => (wo.id === updatedWorkOrder.id ? updatedWorkOrder : wo)));
      } else if (eventType === 'DELETE') {
        setWorkOrders((prev) => prev.filter((wo) => wo.id !== oldRecord.id));
      }
    }
  });

  async function fetchWorkOrders() {
    try {
      setLoading(true)
      setError(null)
      
      // Query the AF_work_order_new table (READ ONLY)
      const { data, error } = await supabase
        .from(TABLES.WORK_ORDERS)
        .select('*')
        .order('CreatedAt', { ascending: false })
        .limit(50) // Get latest 50 work orders
      
      if (error) throw error
      
      // Transform database records to your WorkOrder type
      const transformedOrders: WorkOrder[] = (data || []).map(transformWorkOrder)
      
      setWorkOrders(transformedOrders)
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching work orders:', err)
    } finally {
      setLoading(false)
    }
  }

  async function assignWorkOrder(workOrderId: string, technicianId: string, technicianName: string) {
    try {
      const { error } = await supabase
        .from(TABLES.WORK_ORDER_ACTIONS)
        .insert({
          work_order_id: workOrderId,
          action_type: 'assignment',
          action_data: {
            technician_id: technicianId,
            technician_name: technicianName,
            assigned_at: new Date().toISOString()
          },
          created_by: 'coordinator'
        });

      if (error) throw error;

      // Update local state to reflect assignment
      setWorkOrders(prev => prev.map(wo => 
        wo.id === workOrderId 
          ? { ...wo, assignee: technicianName }
          : wo
      ));

      toast.success(`Work order assigned to ${technicianName}`);
      return true;
    } catch (err) {
      console.error('Failed to assign work order:', err);
      toast.error('Failed to assign work order');
      return false;
    }
  }

  async function updateWorkOrderStatus(workOrderId: string, newStatus: string, notes?: string) {
    try {
      const { error } = await supabase
        .from(TABLES.WORK_ORDER_ACTIONS)
        .insert({
          work_order_id: workOrderId,
          action_type: 'status_change',
          action_data: {
            new_status: newStatus,
            notes: notes || null,
            changed_at: new Date().toISOString()
          },
          created_by: 'coordinator'
        });

      if (error) throw error;

      // Update local state
      setWorkOrders(prev => prev.map(wo => 
        wo.id === workOrderId 
          ? { ...wo, status: newStatus }
          : wo
      ));

      toast.success(`Status updated to ${newStatus}`);
      return true;
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Failed to update status');
      return false;
    }
  }

  return { 
    workOrders, 
    loading, 
    error, 
    refetch: fetchWorkOrders,
    assignWorkOrder,
    updateWorkOrderStatus
  }
}

export function useWorkOrder(id?: string) {
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (id) {
      fetchWorkOrder(id)
    } else {
      setWorkOrder(null)
    }
  }, [id])

  async function fetchWorkOrder(workOrderId: string) {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from(TABLES.WORK_ORDERS)
        .select('*')
        .eq('id', workOrderId)
        .single()
      
      if (error) throw error
      
      if (data) {
        setWorkOrder(transformWorkOrder(data))
      }
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching work order:', err)
    } finally {
      setLoading(false)
    }
  }

  return { workOrder, loading, error, refetch: () => id && fetchWorkOrder(id) }
}

// Helper functions
function transformWorkOrder(wo: WorkOrderFromDB): WorkOrder {
  return {
    id: wo.id,
    serviceRequestId: wo.ServiceRequestNumber,
    workOrderNumber: wo.WorkOrderNumber,
    title: wo.JobDescription?.substring(0, 100) || 'Untitled Work Order',
    description: wo.JobDescription || '',
    propertyCode: wo.PropertyName?.split('-')[0]?.trim() || '',
    propertyAddress: wo.PropertyAddress || '',
    unit: wo.UnitName || '',
    residentName: wo.PrimaryTenant || '',
    priority: mapPriority(wo.Priority),
    status: wo.Status || 'NEW',
    createdDate: formatDate(wo.CreatedAt),
    vendor: wo.Vendor || '',
    assignee: wo.AssignedUser || '',
    // Add other fields with defaults
    ownerEntity: wo.PropertyName || '',
    permissionToEnter: 'n/a', // Default since not in AF table
    unread: true, // Default for new data
    isNew: true, // Default for new data
    isResidentSubmitted: false, // Default since not in AF table
  }
}

function mapPriority(priority: string | null): Priority {
  const p = priority?.toLowerCase() || ''
  if (p.includes('emergency') || p.includes('urgent')) return 'emergency'
  if (p.includes('high')) return 'high'
  if (p.includes('low')) return 'low'
  return 'normal'
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  } catch {
    return 'N/A'
  }
}




import { useState, useEffect } from 'react'
import { supabase, TABLES } from '../services/supabase'
import { WorkOrder, Priority, DeadlineInfo, DeadlineStage } from '../types'
import { useRealtimeSubscription } from './useRealtimeSubscription'
import { useActivePortfolio } from '../providers/PortfolioProvider'
import { toast } from 'sonner'

export function useWorkOrders() {
  const { activePortfolio } = useActivePortfolio()
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (activePortfolio?.id) {
      fetchWorkOrders()
    } else {
      setWorkOrders([])
      setLoading(false)
    }
  }, [activePortfolio?.id])

  useRealtimeSubscription({
    table: TABLES.WORK_ORDERS,
    filter: activePortfolio?.id ? `portfolio_id=eq.${activePortfolio.id}` : undefined,
    onData: (payload) => {
      // For realtime, we might need to refetch to get the joined data
      // or implement a smarter merge. For now, simple refetch or partial update if possible.
      // Since joins are missing in payload, easiest is to refetch or just update the fields we have.
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
         fetchWorkOrders(); 
      } else if (payload.eventType === 'DELETE') {
         setWorkOrders((prev) => prev.filter((wo) => wo.id !== payload.old.id));
      }
    }
  });

  async function fetchWorkOrders() {
    if (!activePortfolio?.id) return

    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          *,
          properties (name, address_full, code),
          units (unit_number, tenant_name),
          technicians (name)
        `)
        .eq('portfolio_id', activePortfolio.id)
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) throw error
      
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
      // Direct update to work_orders table
      const { error } = await supabase
        .from('work_orders')
        .update({ 
          assigned_technician_id: technicianId,
          // We could also update status to 'ASSIGNED' if business logic requires
          status: 'assigned'
        })
        .eq('id', workOrderId);

      if (error) throw error;

      // Optimistic update
      setWorkOrders(prev => prev.map(wo => 
        wo.id === workOrderId 
          ? { ...wo, assignee: technicianName, assignedTechnicianName: technicianName, status: 'ASSIGNED' }
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
        .from('work_orders')
        .update({ 
          status: newStatus.toLowerCase(),
          // append notes to completion_notes or description? 
          // For now just status.
        })
        .eq('id', workOrderId);

      if (error) throw error;

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
        .from('work_orders')
        .select(`
          *,
          properties (name, address_full, code),
          units (unit_number, tenant_name),
          technicians (name)
        `)
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
function transformWorkOrder(wo: any): WorkOrder {
  // wo is the joined result, so it has properties from work_orders plus the joined tables
  
  const property = wo.properties;
  const unit = wo.units;
  const technician = wo.technicians;

  return {
    id: wo.id,
    serviceRequestId: wo.request_number || wo.id, // Fallback
    workOrderNumber: parseInt(wo.request_number?.replace(/\D/g, '') || '0'),
    title: wo.description?.substring(0, 100) || 'Untitled Work Order',
    description: wo.description || '',
    propertyCode: property?.code || '',
    propertyAddress: property?.address_full || '',
    unit: unit?.unit_number || '',
    residentName: wo.tenant_name || unit?.tenant_name || '',
    priority: mapPriority(wo.priority),
    status: wo.status || 'NEW',
    createdDate: formatDate(wo.created_at),
    vendor: '', // Not joined yet
    assignee: technician?.name || '',
    assignedTechnicianName: technician?.name,
    
    ownerEntity: property?.name || '',
    permissionToEnter: wo.permission_to_enter || 'n/a',
    unread: wo.has_unread_messages || false,
    messageCount: wo.message_count || 0,
    unreadCount: wo.has_unread_messages ? 1 : 0, // Approximate
    isNew: wo.status === 'new',
    isResidentSubmitted: wo.source === 'tenant_portal',
    
    // SLA / Deadline
    deadlineInfo: calculateDeadlineStage(wo.deadline_date),
    
    // Retain these if they exist in DB or default them
    scheduledDate: wo.scheduled_date,
  }
}

function calculateDeadlineStage(deadlineDate: string | null): DeadlineInfo | undefined {
  if (!deadlineDate) return undefined;

  const deadline = new Date(deadlineDate);
  const now = new Date();
  const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
  const days = hoursRemaining / 24;

  let stage: DeadlineStage;
  let action: string;

  if (hoursRemaining < 0) {
    stage = 'overdue';
    action = 'Loss occurring';
  } else if (days <= 1) {
    stage = 'emergency';
    action = 'Pull resources if needed';
  } else if (days <= 3) {
    stage = 'critical';
    action = 'Escalate if not in progress';
  } else if (days <= 7) {
    stage = 'urgent';
    action = 'Check if work started';
  } else if (days <= 14) {
    stage = 'attention';
    action = 'Confirm tech assigned, parts ready';
  } else if (days <= 30) {
    stage = 'scheduled';
    action = 'Verify scheduled, confirm materials';
  } else {
    stage = 'planning';
    action = 'Calculate exposure, estimate hours';
  }

  return {
    stage,
    daysRemaining: Math.floor(days),
    hoursRemaining: Math.floor(hoursRemaining),
    suggestedAction: action
  };
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




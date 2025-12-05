import { useState, useEffect } from 'react';
import { supabase, TABLES } from '../services/supabase';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { WorkOrder } from '../types';
import { toast } from 'sonner';

export function useApprovals() {
  const [approvals, setApprovals] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchApprovals();
  }, []);

  useRealtimeSubscription({
    table: TABLES.WORK_ORDERS,
    onData: (payload) => {
      // For approvals, we care if a work order status changes TO 'Ready for Review' (INSERT/UPDATE)
      // or FROM 'Ready for Review' (UPDATE/DELETE)
      const { eventType, new: newRecord, old: oldRecord } = payload;
      
      if (eventType === 'UPDATE' || eventType === 'INSERT') {
        const isReady = newRecord.Status === 'Ready for Review';
        if (isReady) {
           // Add or Update
           // Need to transform data first, but we can just refetch for simplicity or duplicate transform logic
           // For prototype: simple refetch or optimistic if we had the transformer
           fetchApprovals(); 
           if (eventType === 'UPDATE' && oldRecord.Status !== 'Ready for Review') {
             toast.info('New item ready for review');
           }
        } else {
           // Remove if it was there
           setApprovals(prev => prev.filter(a => a.id !== newRecord.id));
        }
      } else if (eventType === 'DELETE') {
        setApprovals(prev => prev.filter(a => a.id !== oldRecord.id));
      }
    }
  });

  async function fetchApprovals() {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from(TABLES.WORK_ORDERS)
        .select('*')
        .eq('Status', 'Ready for Review')
        .order('updated_at', { ascending: false }); // Assuming updated_at exists, else CreatedAt

      if (error) throw error;

      // Transform (simplified for now, ideally import the transformer)
      // We can just cast for now or duplicate
      // Let's assume the shape is close enough or we rely on useWorkOrders transformer in future refactor
      // For now, mapping essential fields
      const mapped = (data || []).map((wo: any) => ({
        id: wo.id,
        serviceRequestId: wo.ServiceRequestNumber,
        workOrderNumber: wo.WorkOrderNumber,
        title: wo.JobDescription || 'Untitled',
        description: wo.JobDescription,
        propertyCode: wo.PropertyName,
        propertyAddress: wo.PropertyAddress,
        unit: wo.UnitName,
        residentName: wo.PrimaryTenant,
        priority: mapPriority(wo.Priority),
        status: wo.Status,
        createdDate: wo.CreatedAt,
        assignee: wo.AssignedUser,
        hoursOld: wo.updated_at ? Math.floor((Date.now() - new Date(wo.updated_at).getTime()) / (1000 * 60 * 60)) : 0
      })) as WorkOrder[];

      setApprovals(mapped);
    } catch (err) {
      console.error('Error fetching approvals:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }

  async function approveWorkOrder(id: string) {
    try {
      const { error } = await supabase
        .from(TABLES.WORK_ORDERS)
        .update({ Status: 'COMPLETED', CompletedOn: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Work order approved');
      // Realtime will handle removing it from list
    } catch (err) {
      toast.error('Failed to approve');
      console.error(err);
    }
  }

  async function rejectWorkOrder(id: string, reason: string) {
    try {
      const { error } = await supabase
        .from(TABLES.WORK_ORDERS)
        .update({ Status: 'IN PROGRESS' }) // Send back to tech
        .eq('id', id);

      if (error) throw error;
      
      // Log rejection reason (separate table or notes)
      await supabase.from(TABLES.WORK_ORDER_ACTIONS).insert({
        work_order_id: id,
        action_type: 'approval',
        action_data: { status: 'rejected', reason },
        created_at: new Date().toISOString(),
        created_by: 'coordinator' // mocked
      });

      toast.success('Work order rejected');
    } catch (err) {
      toast.error('Failed to reject');
      console.error(err);
    }
  }

  return { approvals, loading, error, approveWorkOrder, rejectWorkOrder, pendingCount: approvals.length };
}

// Duplicated helper for now to avoid circular deps if hooks depend on each other
function mapPriority(p: string): any {
  if (!p) return 'normal';
  const low = p.toLowerCase();
  if (low.includes('emergency')) return 'emergency';
  if (low.includes('high')) return 'high';
  if (low.includes('low')) return 'low';
  return 'normal';
}

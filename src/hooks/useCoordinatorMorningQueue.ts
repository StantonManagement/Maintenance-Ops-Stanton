import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../services/supabase';
import type { MorningQueueItem, MorningQueueStats, WorkOrder, QueueReason, SuggestedAction } from '../types';
import { toast } from 'sonner';

export function useCoordinatorMorningQueue() {
  const [items, setItems] = useState<MorningQueueItem[]>([]);
  const [stats, setStats] = useState<MorningQueueStats>({
    totalItems: 0,
    incompleteFromYesterday: 0,
    slaOverdue: 0,
    stuckWorkOrders: 0,
    accessIssues: 0,
    yesterdayCompletionRate: 0.82 // Mock for now
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchMorningQueueItems = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all active work orders with SLA info
      const { data, error } = await supabase
        .from('v_work_orders_with_sla')
        .select('*')
        .not('Status', 'in', '("COMPLETED","Completed","DONE","CANCELLED")');

      if (error) throw error;

      const queueItems: MorningQueueItem[] = [];
      
      // Helper to map DB row to WorkOrder (simplified version of useWorkOrders transform)
      const mapWO = (row: any): WorkOrder => ({
        id: row.id,
        serviceRequestId: row.ServiceRequestNumber,
        workOrderNumber: row.WorkOrderNumber,
        title: row.JobDescription || 'Untitled',
        description: row.JobDescription,
        propertyCode: row.Property || '',
        propertyAddress: row.PropertyAddress || '',
        unit: row.UnitName || '',
        residentName: row.PrimaryTenant || '',
        priority: (row.Priority || 'normal').toLowerCase(),
        status: row.Status,
        createdDate: new Date(row.CreatedAt).toLocaleDateString(),
        hoursUntilSLABreach: row.hours_until_sla_breach,
        slaStatus: row.sla_status,
        assignedTechnicianName: row.AssignedUser,
        scheduledDate: row.ScheduledStart
      } as WorkOrder);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      (data || []).forEach(row => {
        const wo = mapWO(row);
        let reason: QueueReason | null = null;
        let action: SuggestedAction = 'reschedule';
        let suggestedReason = '';

        // 1. Incomplete from yesterday
        if (wo.scheduledDate && wo.scheduledDate.startsWith(yesterdayStr)) {
          reason = 'incomplete_yesterday';
          action = 'reschedule';
          suggestedReason = 'Scheduled yesterday but not completed';
        }
        // 2. SLA Overdue (takes precedence if also incomplete)
        else if (wo.slaStatus === 'overdue') {
          reason = 'sla_overdue';
          action = 'escalate';
          suggestedReason = 'SLA breach - immediate attention required';
        }
        // 3. Waiting for Access
        else if (wo.status === 'Waiting for Access') {
          reason = 'access_issue';
          action = 'escalate';
          suggestedReason = 'Tenant access blocked - review log';
        }
        // 4. Stuck (Open > 72h with no progress) - simplified check
        else if (row.hours_old > 72 && wo.status === 'NEW') {
          reason = 'stuck';
          action = 'reassign';
          suggestedReason = 'No action for 72+ hours';
        }

        if (reason) {
          queueItems.push({
            id: wo.id,
            workOrder: wo,
            queueReason: reason,
            originalScheduledDate: wo.scheduledDate,
            assignedTechnicianName: wo.assignedTechnicianName,
            suggestedAction: action,
            suggestedReason
          });
        }
      });

      // Sort by urgency
      const reasonPriority: Record<QueueReason, number> = {
        'sla_overdue': 0,
        'incomplete_yesterday': 1,
        'access_issue': 2,
        'stuck': 3
      };

      queueItems.sort((a, b) => reasonPriority[a.queueReason] - reasonPriority[b.queueReason]);

      setItems(queueItems);
      
      // Calculate stats
      setStats({
        totalItems: queueItems.length,
        incompleteFromYesterday: queueItems.filter(i => i.queueReason === 'incomplete_yesterday').length,
        slaOverdue: queueItems.filter(i => i.queueReason === 'sla_overdue').length,
        stuckWorkOrders: queueItems.filter(i => i.queueReason === 'stuck').length,
        accessIssues: queueItems.filter(i => i.queueReason === 'access_issue').length,
        yesterdayCompletionRate: 0.82 // Mock
      });

    } catch (err) {
      console.error('Error fetching morning queue:', err);
      toast.error('Failed to load morning queue');
    } finally {
      setLoading(false);
    }
  }, []);

  const approveReschedule = async (itemId: string, newDate: Date) => {
    setActionLoading(itemId);
    // Mock action
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success(`Rescheduled for ${newDate.toLocaleDateString()}`);
    setItems(prev => prev.filter(i => i.id !== itemId));
    setActionLoading(null);
  };

  const reassignWorkOrder = async (itemId: string, _technicianId: string) => {
    setActionLoading(itemId);
    // Mock action
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Work order reassigned');
    setItems(prev => prev.filter(i => i.id !== itemId));
    setActionLoading(null);
  };

  const dismissItem = (itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
    toast.success('Item dismissed');
  };

  useEffect(() => {
    fetchMorningQueueItems();
  }, [fetchMorningQueueItems]);

  return {
    items,
    stats,
    loading,
    actionLoading,
    refresh: fetchMorningQueueItems,
    approveReschedule,
    reassignWorkOrder,
    dismissItem
  };
}

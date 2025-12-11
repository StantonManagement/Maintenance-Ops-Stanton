import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

export type IncompleteReason = 
  | 'parts_needed'
  | 'access_denied'
  | 'tenant_reschedule'
  | 'equipment_issue'
  | 'time_ran_out'
  | 'emergency_redirect'
  | 'other';

export const REASON_LABELS: Record<IncompleteReason, string> = {
  parts_needed: 'Parts/Materials Needed',
  access_denied: 'Could Not Access Unit',
  tenant_reschedule: 'Tenant Requested Reschedule',
  equipment_issue: 'Equipment/Tool Issue',
  time_ran_out: 'Ran Out of Time',
  emergency_redirect: 'Redirected to Emergency',
  other: 'Other',
};

export interface IncompleteWorkOrder {
  assignmentId: string;
  workOrderId: string;
  title: string;
  priority: string;
  property: string;
  unit: string;
  scheduledDate: string;
  daysOverdue: number;
}

export interface MorningGateStatus {
  gateCleared: boolean;
  incompleteCount: number;
  addressedCount: number;
  pendingItems: IncompleteWorkOrder[];
}

interface SubmitResult {
  success: boolean;
  message: string;
  escalated: boolean;
}

// Mock data for when tables don't exist
const MOCK_INCOMPLETE: IncompleteWorkOrder[] = [
  {
    assignmentId: 'mock-assign-1',
    workOrderId: '12345',
    title: 'Fix leaking faucet in kitchen',
    priority: 'Normal',
    property: 'S0021 - 67 Park',
    unit: '2A',
    scheduledDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    daysOverdue: 1,
  },
  {
    assignmentId: 'mock-assign-2',
    workOrderId: '12346',
    title: 'HVAC not cooling properly',
    priority: 'High',
    property: 'S0021 - 67 Park',
    unit: '3B',
    scheduledDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    daysOverdue: 1,
  },
];

export function useMorningGate(technicianId: string | null) {
  const [status, setStatus] = useState<MorningGateStatus>({
    gateCleared: true,
    incompleteCount: 0,
    addressedCount: 0,
    pendingItems: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const checkGate = useCallback(async () => {
    if (!technicianId) {
      setStatus({ gateCleared: true, incompleteCount: 0, addressedCount: 0, pendingItems: [] });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase
        .rpc('check_morning_gate', { p_technician_id: technicianId });

      if (rpcError) {
        if (rpcError.code === '42883' || rpcError.message.includes('does not exist')) {
          console.warn('Morning gate tables not found, using mock data');
          // Return mock data with gate NOT cleared to show UI
          setStatus({
            gateCleared: false,
            incompleteCount: MOCK_INCOMPLETE.length,
            addressedCount: 0,
            pendingItems: MOCK_INCOMPLETE,
          });
          return;
        }
        throw rpcError;
      }

      if (data && data.length > 0) {
        const result = data[0];
        setStatus({
          gateCleared: result.gate_cleared,
          incompleteCount: result.incomplete_count,
          addressedCount: result.addressed_count,
          pendingItems: (result.pending_items || []).map((item: any) => ({
            assignmentId: item.assignment_id,
            workOrderId: item.work_order_id,
            title: item.wo_title || 'Untitled Work Order',
            priority: item.wo_priority || 'Normal',
            property: item.wo_property || 'Unknown',
            unit: item.wo_unit || 'N/A',
            scheduledDate: item.scheduled_date,
            daysOverdue: item.days_overdue,
          })),
        });
      } else {
        setStatus({ gateCleared: true, incompleteCount: 0, addressedCount: 0, pendingItems: [] });
      }
    } catch (err) {
      console.error('Error checking morning gate:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      // Fallback to cleared gate on error
      setStatus({ gateCleared: true, incompleteCount: 0, addressedCount: 0, pendingItems: [] });
    } finally {
      setLoading(false);
    }
  }, [technicianId]);

  useEffect(() => {
    checkGate();
  }, [checkGate]);

  const submitExplanation = useCallback(async (
    assignmentId: string,
    reason: IncompleteReason,
    reasonDetail?: string,
    newDate?: Date
  ): Promise<SubmitResult> => {
    if (!technicianId) {
      return { success: false, message: 'No technician ID', escalated: false };
    }

    try {
      setSubmitting(true);

      const { data, error: rpcError } = await supabase
        .rpc('submit_incomplete_explanation', {
          p_assignment_id: assignmentId,
          p_technician_id: technicianId,
          p_reason: reason,
          p_reason_detail: reasonDetail || null,
          p_new_date: newDate ? newDate.toISOString().split('T')[0] : null,
        });

      if (rpcError) {
        if (rpcError.code === '42883' || rpcError.message.includes('does not exist')) {
          console.warn('Submit function not found, simulating success');
          // Remove from pending items locally
          setStatus(prev => ({
            ...prev,
            addressedCount: prev.addressedCount + 1,
            pendingItems: prev.pendingItems.filter(i => i.assignmentId !== assignmentId),
            gateCleared: prev.pendingItems.length <= 1,
          }));
          return { success: true, message: 'Explanation recorded (mock)', escalated: false };
        }
        throw rpcError;
      }

      if (data && data.length > 0) {
        const result = data[0];
        // Refresh gate status
        await checkGate();
        return {
          success: result.success,
          message: result.message,
          escalated: result.escalated,
        };
      }

      return { success: false, message: 'No response from server', escalated: false };
    } catch (err) {
      console.error('Error submitting explanation:', err);
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Unknown error',
        escalated: false,
      };
    } finally {
      setSubmitting(false);
    }
  }, [technicianId, checkGate]);

  const getRecommendedDate = useCallback((priority: string): Date => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Skip weekends for normal priority
    if (priority === 'Normal' || priority === 'Low') {
      while (tomorrow.getDay() === 0 || tomorrow.getDay() === 6) {
        tomorrow.setDate(tomorrow.getDate() + 1);
      }
    }
    
    return tomorrow;
  }, []);

  const isHighPriority = useCallback((priority: string): boolean => {
    return ['High', 'Emergency', 'Urgent'].includes(priority);
  }, []);

  return {
    status,
    loading,
    error,
    submitting,
    checkGate,
    submitExplanation,
    getRecommendedDate,
    isHighPriority,
    remainingCount: status.incompleteCount - status.addressedCount,
  };
}

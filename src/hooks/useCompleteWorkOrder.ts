import { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { toast } from 'sonner';

export function useCompleteWorkOrder() {
  const [loading, setLoading] = useState(false);

  const completeWorkOrder = useCallback(async (
    workOrderId: string,
    approvedBy: string,
    approverRole: string,
    notes?: string
  ) => {
    setLoading(true);
    
    try {
      // Check role client-side first
      if (!['coordinator', 'supervisor', 'manager', 'admin'].includes(approverRole)) {
        toast.error('Only coordinators can approve work order completion');
        return false;
      }

      const { data, error } = await supabase.rpc('complete_work_order', {
        p_work_order_id: workOrderId,
        p_approved_by: approvedBy,
        p_approver_role: approverRole,
        p_completion_notes: notes || null
      });

      if (error) {
        console.error('Complete RPC error:', error.message);
        // Fallback to direct update
        const { error: updateError } = await supabase
          .from('work_order_assignments')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            completed_by: approvedBy,
            notes: notes ? `[COMPLETED] ${notes}` : '[COMPLETED]',
            updated_at: new Date().toISOString()
          })
          .eq('work_order_id', workOrderId)
          .eq('status', 'ready_for_review');

        if (updateError) {
          toast.error('Failed to complete work order');
          return false;
        }

        toast.success('Work order completed');
        return true;
      }

      const result = data?.[0];
      
      if (result?.success) {
        toast.success('Work order completed');
      } else {
        toast.error(result?.message || 'Completion failed');
      }
      
      return result?.success || false;
    } catch (err) {
      console.error('Completion error:', err);
      toast.error('Failed to complete work order');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const rejectWorkOrder = useCallback(async (
    workOrderId: string,
    rejectedBy: string,
    reason: string
  ) => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('work_order_assignments')
        .update({
          status: 'in_progress',
          notes: `[REJECTED] ${reason}`,
          updated_at: new Date().toISOString()
        })
        .eq('work_order_id', workOrderId)
        .eq('status', 'ready_for_review');

      if (error) {
        toast.error('Failed to reject work order');
        return false;
      }

      // Log rejection
      await supabase.from('audit_logs').insert({
        entity_type: 'work_order',
        entity_id: workOrderId,
        action: 'rejected',
        actor: rejectedBy,
        metadata: { reason }
      });

      toast.warning('Work order sent back for rework');
      return true;
    } catch (err) {
      console.error('Rejection error:', err);
      toast.error('Failed to reject work order');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { completeWorkOrder, rejectWorkOrder, loading };
}

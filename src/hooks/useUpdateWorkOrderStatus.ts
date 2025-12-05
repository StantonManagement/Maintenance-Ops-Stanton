import { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { toast } from 'sonner';

export function useUpdateWorkOrderStatus() {
  const [loading, setLoading] = useState(false);

  const markReadyForReview = useCallback(async (
    workOrderId: string,
    technicianId: string,
    notes?: string
  ) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('mark_ready_for_review', {
        p_work_order_id: workOrderId,
        p_technician_id: technicianId,
        p_notes: notes || null
      });

      if (error) {
        console.error('Mark ready RPC error:', error.message);
        // Fallback to direct update
        const { error: updateError } = await supabase
          .from('work_order_assignments')
          .update({
            status: 'ready_for_review',
            notes: notes ? `[READY FOR REVIEW] ${notes}` : '[READY FOR REVIEW]',
            updated_at: new Date().toISOString()
          })
          .eq('work_order_id', workOrderId);

        if (updateError) {
          toast.error('Failed to update status');
          return false;
        }

        toast.success('Marked ready for coordinator review');
        return true;
      }

      const result = data?.[0];
      
      if (result?.success) {
        toast.success('Marked ready for coordinator review');
      } else {
        toast.error(result?.message || 'Update failed');
      }
      
      return result?.success || false;
    } catch (err) {
      console.error('Status update error:', err);
      toast.error('Failed to update status');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = useCallback(async (
    workOrderId: string,
    newStatus: string,
    notes?: string
  ) => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('work_order_assignments')
        .update({
          status: newStatus,
          notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('work_order_id', workOrderId);

      if (error) {
        toast.error('Failed to update status');
        return false;
      }

      toast.success(`Status updated to ${newStatus}`);
      return true;
    } catch (err) {
      console.error('Status update error:', err);
      toast.error('Failed to update status');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { markReadyForReview, updateStatus, loading };
}

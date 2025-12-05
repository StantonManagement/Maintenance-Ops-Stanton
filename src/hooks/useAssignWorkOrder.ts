import { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { toast } from 'sonner';

export function useAssignWorkOrder() {
  const [loading, setLoading] = useState(false);

  const assignWorkOrder = useCallback(async (
    workOrderId: string,
    technicianId: string,
    scheduledDate: Date,
    timeSlot?: { start: string; end: string },
    assignedBy: string = 'coordinator'
  ) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('assign_work_order', {
        p_work_order_id: workOrderId,
        p_technician_id: technicianId,
        p_scheduled_date: scheduledDate.toISOString().split('T')[0],
        p_scheduled_time_start: timeSlot?.start || null,
        p_scheduled_time_end: timeSlot?.end || null,
        p_assigned_by: assignedBy
      });

      if (error) {
        console.error('Assignment RPC error:', error.message);
        // Fallback to direct insert if RPC doesn't exist
        const { error: insertError } = await supabase
          .from('work_order_assignments')
          .insert({
            work_order_id: workOrderId,
            technician_id: technicianId,
            scheduled_date: scheduledDate.toISOString().split('T')[0],
            scheduled_time_start: timeSlot?.start || null,
            scheduled_time_end: timeSlot?.end || null,
            assigned_by: assignedBy,
            status: 'scheduled'
          });

        if (insertError) {
          toast.error('Failed to assign work order');
          return { success: false, message: insertError.message };
        }

        toast.success('Work order assigned');
        return { success: true, message: 'Assignment created' };
      }

      const result = data?.[0];
      
      if (result?.success) {
        toast.success('Work order assigned');
      } else {
        toast.error(result?.message || 'Assignment failed');
      }
      
      return result || { success: false, message: 'No response from server' };
    } catch (err) {
      console.error('Assignment error:', err);
      toast.error('Failed to assign work order');
      return { success: false, message: 'Assignment failed' };
    } finally {
      setLoading(false);
    }
  }, []);

  return { assignWorkOrder, loading };
}

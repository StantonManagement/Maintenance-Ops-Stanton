import { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { toast } from 'sonner';

export function useRecordOverride() {
  const [loading, setLoading] = useState(false);

  const recordOverride = useCallback(async (
    technicianId: string,
    overrideBy: string,
    reason: 'emergency' | 'turnover' | 'inspection' | 'other',
    detail?: string
  ) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('record_override', {
        p_technician_id: technicianId,
        p_override_by: overrideBy,
        p_reason: reason,
        p_detail: detail || null
      });

      if (error) {
        console.error('Override RPC error:', error.message);
        // Fallback to direct operations
        
        // Get displaced work orders
        const { data: displaced } = await supabase
          .from('work_order_assignments')
          .select('work_order_id')
          .eq('technician_id', technicianId)
          .gte('scheduled_date', new Date().toISOString().split('T')[0])
          .in('status', ['scheduled', 'in_progress']);

        const displacedIds = displaced?.map(d => d.work_order_id) || [];

        // Cancel assignments
        await supabase
          .from('work_order_assignments')
          .update({
            status: 'cancelled',
            notes: `[CANCELLED - OVERRIDE] ${reason}`,
            updated_at: new Date().toISOString()
          })
          .eq('technician_id', technicianId)
          .gte('scheduled_date', new Date().toISOString().split('T')[0])
          .in('status', ['scheduled', 'in_progress']);

        // Mark technician busy
        await supabase
          .from('technicians')
          .update({ status: 'busy', updated_at: new Date().toISOString() })
          .eq('id', technicianId);

        // Record override
        await supabase.from('override_history').insert({
          technician_id: technicianId,
          override_by: overrideBy,
          reason,
          detail,
          displaced_work_orders: displacedIds
        });

        toast.warning(`Override recorded. ${displacedIds.length} work orders need reassignment.`);
        return { success: true, displaced_count: displacedIds.length };
      }

      const result = data?.[0];
      
      if (result?.success) {
        toast.warning(result.message);
      } else {
        toast.error(result?.message || 'Override failed');
      }
      
      return result || { success: false, displaced_count: 0 };
    } catch (err) {
      console.error('Override error:', err);
      toast.error('Failed to record override');
      return { success: false, displaced_count: 0 };
    } finally {
      setLoading(false);
    }
  }, []);

  return { recordOverride, loading };
}

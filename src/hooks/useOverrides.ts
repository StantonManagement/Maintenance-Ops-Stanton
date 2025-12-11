import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../services/supabase';
import type { OverrideAction, OverrideReason } from '../types';
import { toast } from 'sonner';

export function useOverrides() {
  const [overrides, setOverrides] = useState<OverrideAction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOverrides = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('work_order_actions')
        .select('*')
        .eq('action_type', 'override')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformed: OverrideAction[] = (data || []).map(row => ({
        id: row.id,
        workOrderId: row.work_order_id,
        overrideBy: row.action_data.override_by,
        overrideReason: row.action_data.reason as OverrideReason,
        reasonDetails: row.action_data.details,
        technicianId: row.action_data.technician_id,
        technicianName: row.action_data.technician_name,
        displacedWorkOrders: row.action_data.displaced_work_orders || [],
        acknowledgedBy: row.action_data.acknowledged_by,
        acknowledgedAt: row.action_data.acknowledged_at,
        createdAt: row.created_at
      }));

      setOverrides(transformed);
    } catch (err) {
      console.error('Error fetching overrides:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createOverride = useCallback(async (data: {
    workOrderId: string; // The emergency WO or context ID
    technicianId: string;
    technicianName: string;
    reason: OverrideReason;
    details: string;
    displacedWorkOrders: string[];
    overrideBy: string;
  }) => {
    try {
      const { error } = await supabase
        .from('work_order_actions')
        .insert({
          work_order_id: data.workOrderId,
          action_type: 'override',
          action_data: {
            override_by: data.overrideBy,
            reason: data.reason,
            details: data.details,
            technician_id: data.technicianId,
            technician_name: data.technicianName,
            displaced_work_orders: data.displacedWorkOrders,
            acknowledged_by: null,
            acknowledged_at: null
          },
          created_by: data.overrideBy
        });

      if (error) throw error;

      toast.success('Override logged successfully');
      fetchOverrides();
      return true;
    } catch (err) {
      console.error('Error creating override:', err);
      toast.error('Failed to log override');
      return false;
    }
  }, [fetchOverrides]);

  const acknowledgeOverride = useCallback(async (overrideId: string, user: string) => {
    try {
      // First fetch the existing record to preserve other data
      const { data: existing, error: fetchError } = await supabase
        .from('work_order_actions')
        .select('action_data')
        .eq('id', overrideId)
        .single();

      if (fetchError) throw fetchError;

      const updatedData = {
        ...existing.action_data,
        acknowledged_by: user,
        acknowledged_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('work_order_actions')
        .update({ action_data: updatedData })
        .eq('id', overrideId);

      if (error) throw error;

      toast.success('Override acknowledged');
      fetchOverrides();
      return true;
    } catch (err) {
      console.error('Error acknowledging override:', err);
      toast.error('Failed to acknowledge override');
      return false;
    }
  }, [fetchOverrides]);

  const getDisplacedWorkOrders = useCallback(async (technicianId: string) => {
    try {
      // Query work_order_assignments table
      const { data: assignments, error: assignError } = await supabase
        .from('work_order_assignments')
        .select('work_order_id')
        .eq('technician_id', technicianId)
        .eq('status', 'scheduled');
        
      if (assignError) throw assignError;
      
      return (assignments || []).map(a => a.work_order_id);
    } catch (err) {
      console.error('Error getting displaced WOs:', err);
      return [];
    }
  }, []);

  useEffect(() => {
    fetchOverrides();
  }, [fetchOverrides]);

  return {
    overrides,
    unacknowledgedOverrides: overrides.filter(o => !o.acknowledgedBy),
    loading,
    fetchOverrides,
    createOverride,
    acknowledgeOverride,
    getDisplacedWorkOrders
  };
}

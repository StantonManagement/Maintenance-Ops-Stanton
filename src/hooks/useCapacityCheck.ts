import { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';

export interface CapacityCheckResult {
  current: number;
  max: number;
  status: 'safe' | 'warning' | 'critical';
  canAssign: boolean;
  requiresOverride: boolean;
  activeWorkOrders?: any[]; // Optional now as we don't get full objects from RPC
  message?: string;
}

export function useCapacityCheck() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const checkCapacity = useCallback(async (
    technicianId: string,
    targetDate?: Date
  ): Promise<CapacityCheckResult> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: rpcError } = await supabase.rpc(
        'check_technician_capacity',
        {
          p_technician_id: technicianId,
          p_target_date: targetDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
        }
      );
      
      if (rpcError) throw rpcError;
      
      // Handle array response from RPC (returns table)
      const result = Array.isArray(data) && data.length > 0 ? data[0] : null;

      if (!result) {
        // Fallback if RPC missing/fails silently
        console.warn('Capacity check RPC returned no data');
        return {
          current: 0,
          max: 6,
          status: 'safe',
          canAssign: true,
          requiresOverride: false
        };
      }

      const current = result.current_count;
      const max = result.max_allowed;
      let status: 'safe' | 'warning' | 'critical' = 'safe';
      
      if (current >= max) status = 'critical';
      else if (current >= max - 1) status = 'warning';

      return {
        current,
        max,
        status,
        canAssign: result.can_accept,
        requiresOverride: !result.can_accept,
        message: result.message
      };

    } catch (err) {
      console.error('Capacity check failed:', err);
      setError(err as Error);
      // Fail safe - allow assignment with warning log
      return {
        current: 0,
        max: 6,
        status: 'safe',
        canAssign: true,
        requiresOverride: false
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return { checkCapacity, loading, error };
}

import { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import type { AccessAttempt, AccessEscalationStatus, AttemptMethod, ContactResult } from '../types';
import { toast } from 'sonner';

export function useAccessTracking(workOrderId?: string) {
  const [attempts, setAttempts] = useState<AccessAttempt[]>([]);
  const [escalationStatus, setEscalationStatus] = useState<AccessEscalationStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAccessAttempts = useCallback(async () => {
    if (!workOrderId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('access_attempts')
        .select('*')
        .eq('work_order_id', workOrderId)
        .order('attempt_number', { ascending: false });

      if (error) throw error;

      setAttempts((data || []).map(mapAccessAttempt));
    } catch (err) {
      console.error('Error fetching access attempts:', err);
    } finally {
      setLoading(false);
    }
  }, [workOrderId]);

  const fetchEscalationStatus = useCallback(async () => {
    if (!workOrderId) return;
    try {
      const { data, error } = await supabase
        .from('v_access_escalation_status')
        .select('*')
        .eq('work_order_id', workOrderId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore not found (no attempts yet)

      if (data) {
        setEscalationStatus({
          workOrderId: data.work_order_id,
          attemptCount: data.attempt_count,
          lastAttempt: data.last_attempt,
          escalationStage: data.escalation_stage
        });
      } else {
        setEscalationStatus(null);
      }
    } catch (err) {
      console.error('Error fetching escalation status:', err);
    }
  }, [workOrderId]);

  const logAccessAttempt = useCallback(async (data: {
    method: AttemptMethod;
    result: ContactResult;
    notes?: string;
    photoUrls?: string[];
    user: string;
  }) => {
    if (!workOrderId) return false;
    try {
      // Get next attempt number
      const { count } = await supabase
        .from('access_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('work_order_id', workOrderId);
      
      const nextNumber = (count || 0) + 1;

      const { error } = await supabase
        .from('access_attempts')
        .insert({
          work_order_id: workOrderId,
          attempt_number: nextNumber,
          attempt_method: data.method,
          contact_result: data.result,
          notes: data.notes,
          photo_urls: data.photoUrls,
          created_by: data.user
        });

      if (error) throw error;

      toast.success('Access attempt logged');
      fetchAccessAttempts();
      fetchEscalationStatus();
      return true;
    } catch (err) {
      console.error('Error logging access attempt:', err);
      toast.error('Failed to log attempt');
      return false;
    }
  }, [workOrderId, fetchAccessAttempts, fetchEscalationStatus]);

  return {
    attempts,
    escalationStatus,
    loading,
    fetchAccessAttempts,
    fetchEscalationStatus,
    logAccessAttempt
  };
}

function mapAccessAttempt(row: any): AccessAttempt {
  return {
    id: row.id,
    workOrderId: row.work_order_id,
    attemptNumber: row.attempt_number,
    attemptDate: row.attempt_date,
    attemptMethod: row.attempt_method as AttemptMethod,
    contactResult: row.contact_result as ContactResult,
    notes: row.notes,
    photoUrls: row.photo_urls,
    createdBy: row.created_by,
    createdAt: row.created_at
  };
}

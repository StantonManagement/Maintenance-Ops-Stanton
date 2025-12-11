import { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import type { ComplianceDeadline, ComplianceDeadlineType, ComplianceStatus } from '../types';
import { toast } from 'sonner';

export function useComplianceDeadlines() {
  const [deadlines, setDeadlines] = useState<ComplianceDeadline[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPropertyDeadlines = useCallback(async (propertyId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('compliance_deadlines')
        .select('*')
        .eq('property_id', propertyId)
        .order('deadline_date', { ascending: true });

      if (error) throw error;

      setDeadlines((data || []).map(mapDeadline));
    } catch (err) {
      console.error('Error fetching property deadlines:', err);
      toast.error('Failed to load deadlines');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUpcomingDeadlines = useCallback(async (days: number = 30) => {
    try {
      setLoading(true);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + days);

      const { data, error } = await supabase
        .from('compliance_deadlines')
        .select('*')
        .eq('status', 'pending')
        .lte('deadline_date', cutoff.toISOString())
        .gte('deadline_date', new Date().toISOString())
        .order('deadline_date', { ascending: true });

      if (error) throw error;

      setDeadlines((data || []).map(mapDeadline));
    } catch (err) {
      console.error('Error fetching upcoming deadlines:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createDeadline = useCallback(async (data: Omit<ComplianceDeadline, 'id'>) => {
    try {
      const { error } = await supabase
        .from('compliance_deadlines')
        .insert({
          property_id: data.propertyId,
          deadline_type: data.deadlineType,
          deadline_date: data.deadlineDate,
          status: data.status,
          units_at_risk: data.unitsAtRisk,
          monthly_rent_at_risk: data.monthlyRentAtRisk,
          notes: data.notes
        });

      if (error) throw error;
      toast.success('Deadline created');
      return true;
    } catch (err) {
      console.error('Error creating deadline:', err);
      toast.error('Failed to create deadline');
      return false;
    }
  }, []);

  const updateDeadlineStatus = useCallback(async (id: string, status: ComplianceStatus) => {
    try {
      const { error } = await supabase
        .from('compliance_deadlines')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      toast.success('Status updated');
      return true;
    } catch (err) {
      console.error('Error updating deadline status:', err);
      toast.error('Failed to update status');
      return false;
    }
  }, []);

  return {
    deadlines,
    loading,
    fetchPropertyDeadlines,
    fetchUpcomingDeadlines,
    createDeadline,
    updateDeadlineStatus
  };
}

function mapDeadline(row: any): ComplianceDeadline {
  return {
    id: row.id,
    propertyId: row.property_id,
    deadlineType: row.deadline_type as ComplianceDeadlineType,
    deadlineDate: row.deadline_date,
    status: row.status as ComplianceStatus,
    unitsAtRisk: row.units_at_risk || 0,
    monthlyRentAtRisk: row.monthly_rent_at_risk || 0,
    notes: row.notes
  };
}

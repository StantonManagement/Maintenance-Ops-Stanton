import { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { toast } from 'sonner';

export interface PatternAlert {
  id: string;
  pattern_type: 'recurring' | 'building' | 'seasonal' | 'cascade';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  affected_units: string[];
  affected_building?: string;
  related_work_orders: string[];
  recommended_action: string;
  status: 'new' | 'acknowledged' | 'resolved' | 'dismissed';
  created_at: string;
}

export function usePatternDetection() {
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState<PatternAlert[]>([]);

  const fetchAlerts = useCallback(async (status: string = 'new') => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pattern_alerts')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pattern alerts:', error);
    } else {
      setAlerts(data || []);
    }
    setLoading(false);
  }, []);

  const acknowledgeAlert = async (id: string) => {
    const { error } = await supabase
      .from('pattern_alerts')
      .update({ status: 'acknowledged' })
      .eq('id', id);

    if (error) {
      toast.error('Failed to acknowledge alert');
    } else {
      setAlerts(prev => prev.filter(a => a.id !== id));
      toast.success('Alert acknowledged');
    }
  };

  const dismissAlert = async (id: string) => {
    const { error } = await supabase
      .from('pattern_alerts')
      .update({ status: 'dismissed' })
      .eq('id', id);

    if (error) {
      toast.error('Failed to dismiss alert');
    } else {
      setAlerts(prev => prev.filter(a => a.id !== id));
    }
  };

  const runDailyScan = async () => {
    setLoading(true);
    try {
      // Mock Scan - In reality this would be an Edge Function or scheduled job
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockAlerts: Partial<PatternAlert>[] = [
        {
          pattern_type: 'building',
          severity: 'critical',
          title: 'Hot Water Complaints - Building A',
          description: '5 units across different floors reporting hot water issues within 7 days. Likely boiler issue.',
          affected_units: ['101', '205', '208', '310', '412'],
          affected_building: 'Building A',
          recommended_action: 'Dispatch HVAC tech for boiler inspection',
          status: 'new'
        },
        {
          pattern_type: 'recurring',
          severity: 'warning',
          title: 'Recurring Toilet Issue - Unit 205',
          description: '3rd toilet running complaint this year. Multiple part replacements failed.',
          affected_units: ['205'],
          affected_building: 'Building A',
          recommended_action: 'Schedule full toilet replacement',
          status: 'new'
        }
      ];

      for (const alert of mockAlerts) {
        await supabase.from('pattern_alerts').insert(alert);
      }

      await fetchAlerts();
      toast.success('Daily pattern scan complete');

    } catch (error) {
      console.error('Scan failed:', error);
      toast.error('Pattern scan failed');
    } finally {
      setLoading(false);
    }
  };

  return {
    alerts,
    loading,
    fetchAlerts,
    acknowledgeAlert,
    dismissAlert,
    runDailyScan
  };
}

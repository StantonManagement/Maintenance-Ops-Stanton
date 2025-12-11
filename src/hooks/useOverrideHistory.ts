import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

export interface OverrideLog {
  id: string;
  timestamp: string;
  technicianName: string;
  workOrderTitle: string;
  overriddenBy: string;
  reason: string;
  notes?: string;
}

export function useOverrideHistory() {
  const [logs, setLogs] = useState<OverrideLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  async function fetchHistory() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('override_history')
        .select(`
          id,
          created_at,
          override_by,
          reason,
          detail,
          technician:technicians(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedLogs: OverrideLog[] = (data || []).map((item: any) => {
        // Parse detail to extract title and notes
        // Format expected: "Work Order: [Title]. Notes: [Notes]"
        const detailText = item.detail || '';
        let title = 'Unknown Work Order';
        let notes = '';

        if (detailText.includes('Work Order: ')) {
          const parts = detailText.split('. Notes: ');
          title = parts[0].replace('Work Order: ', '');
          notes = parts[1] || '';
        } else {
          notes = detailText;
        }

        return {
          id: item.id,
          timestamp: item.created_at,
          technicianName: item.technician?.name || 'Unknown Technician',
          workOrderTitle: title,
          overriddenBy: item.override_by,
          reason: item.reason,
          notes: notes
        };
      });

      setLogs(formattedLogs);
    } catch (err) {
      console.error('Error fetching override history:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHistory();
  }, []);

  return { logs, loading, error, refetch: fetchHistory };
}

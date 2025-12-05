import { useState } from 'react';
import { toast } from 'sonner';

export function useOverrideNotification() {
  const [loading, setLoading] = useState(false);

  const triggerOverrideNotification = async (
    technicianName: string, 
    workOrderTitle: string, 
    reason: string, 
    notes?: string
  ) => {
    try {
      setLoading(true);
      
      // 1. Create notification record
      // In a real app: await supabase.from('notifications').insert(...)
      
      // 2. Trigger toast (immediate feedback)
      toast.warning(`Override Approved: ${technicianName} assigned to "${workOrderTitle}"`, {
        description: `Reason: ${reason}. Managers have been notified.`,
        duration: 5000,
      });

      // 3. Log to console for dev
      console.log('[Override Log]', {
        technician: technicianName,
        workOrder: workOrderTitle,
        reason,
        notes,
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Failed to trigger override notification:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { triggerOverrideNotification, loading };
}

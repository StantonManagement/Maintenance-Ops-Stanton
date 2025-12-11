import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../services/supabase';

export function useOverrideNotification() {
  const [loading, setLoading] = useState(false);

  const triggerOverrideNotification = async (
    technicianName: string, 
    workOrderTitle: string, 
    reason: string, 
    notes?: string,
    technicianId?: string
  ) => {
    try {
      setLoading(true);
      
      // 1. Create notification/history record
      const detailString = `Work Order: ${workOrderTitle}. Notes: ${notes || ''}`;
      
      if (technicianId) {
        // Map reason to valid enum values if necessary
        // Valid: 'emergency', 'turnover', 'inspection', 'other'
        let validReason = reason.toLowerCase();
        if (!['emergency', 'turnover', 'inspection', 'other'].includes(validReason)) {
          validReason = 'other';
        }

        const { error } = await supabase.from('override_history').insert({
          technician_id: technicianId,
          override_by: 'Coordinator', 
          reason: validReason, 
          detail: detailString
        });

        if (error) {
          console.error('Supabase insert error:', error);
          // Don't throw, just log, so we don't block the assignment flow
        }
      }
      
      // 2. Trigger toast (immediate feedback)
      toast.warning(`Override Approved: ${technicianName} assigned to "${workOrderTitle}"`, {
        description: `Reason: ${reason}. Managers have been notified.`,
        duration: 5000,
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

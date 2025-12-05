import { useState } from 'react';
import { aiService, AIAssignmentSuggestion } from '../services/aiService';
import { WorkOrder, Technician } from '../types';
import { toast } from 'sonner';

export function useAIAssignment() {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AIAssignmentSuggestion[]>([]);

  const getSuggestions = async (workOrder: WorkOrder, technicians: Technician[]) => {
    try {
      setLoading(true);
      const results = await aiService.suggestTechnician(workOrder, technicians);
      setSuggestions(results);
      return results;
    } catch (error) {
      console.error('AI Assignment failed:', error);
      toast.error('Failed to get AI suggestions');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    getSuggestions,
    suggestions,
    loading
  };
}

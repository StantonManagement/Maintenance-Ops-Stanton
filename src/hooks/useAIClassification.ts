import { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { 
  classifyWorkOrder, 
  AIClassification, 
  WorkOrderForClassification 
} from '../services/aiClassificationService';
import { toast } from 'sonner';

export interface WorkOrderWithAI {
  id: string;
  description: string;
  property: string;
  unit: string;
  residentName: string;
  createdAt: string;
  // AI fields
  aiPriority?: string;
  aiPriorityConfidence?: number;
  aiPriorityReasoning?: string;
  aiSkillsRequired?: string[];
  aiEstimatedHours?: number;
  aiEstimatedHoursConfidence?: number;
  aiLikelyParts?: { highConfidence: string[]; bringJustInCase: string[] };
  aiCategory?: string;
  aiFlags?: {
    safetyConcern: boolean;
    possibleTenantDamage: boolean;
    likelyRecurring: boolean;
    multiVisitLikely: boolean;
  };
  aiClassifiedAt?: string;
}

export function useAIClassification() {
  const [classifying, setClassifying] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<AIClassification | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const classify = useCallback(async (workOrder: WorkOrderForClassification): Promise<AIClassification | null> => {
    try {
      setClassifying(workOrder.id);
      setError(null);

      const classification = await classifyWorkOrder(workOrder);
      setLastResult(classification);

      // Save to database
      const { error: saveError } = await supabase.rpc('update_wo_ai_classification', {
        p_work_order_id: workOrder.id,
        p_priority: classification.priority,
        p_priority_confidence: classification.priorityConfidence,
        p_priority_reasoning: classification.priorityReasoning,
        p_skills_required: classification.skillsRequired,
        p_estimated_hours: classification.estimatedHours,
        p_estimated_hours_confidence: classification.estimatedHoursConfidence,
        p_likely_parts: classification.likelyParts,
        p_category: classification.category,
        p_flags: classification.flags,
        p_full_response: classification,
      });

      if (saveError) {
        console.warn('Failed to save AI classification to database:', saveError);
        // Still return the classification even if save failed
      }

      toast.success(`Classified as ${classification.priority.toUpperCase()} priority (${classification.priorityConfidence}% confident)`);
      return classification;
    } catch (err) {
      console.error('Error classifying work order:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      toast.error('Failed to classify work order');
      return null;
    } finally {
      setClassifying(null);
    }
  }, []);

  const overridePriority = useCallback(async (
    workOrderId: string,
    originalPriority: string,
    newPriority: string,
    reason?: string
  ): Promise<boolean> => {
    try {
      // Update the work order priority
      const { error: updateError } = await supabase
        .from('AF_work_order_new')
        .update({ Priority: newPriority })
        .eq('ServiceRequestId', workOrderId);

      if (updateError) throw updateError;

      // Log the override
      await supabase.rpc('log_classification_override', {
        p_work_order_id: workOrderId,
        p_override_field: 'priority',
        p_original_value: originalPriority,
        p_new_value: newPriority,
        p_reason: reason,
      });

      toast.success(`Priority updated to ${newPriority.toUpperCase()}`);
      return true;
    } catch (err) {
      console.error('Error overriding priority:', err);
      toast.error('Failed to update priority');
      return false;
    }
  }, []);

  const getPriorityColor = useCallback((priority: string): { bg: string; text: string; border: string } => {
    switch (priority?.toLowerCase()) {
      case 'emergency':
        return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-400' };
      case 'high':
        return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-400' };
      case 'medium':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-400' };
      case 'low':
        return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-400' };
      case 'cosmetic':
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-400' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' };
    }
  }, []);

  const getCategoryIcon = useCallback((category: string): string => {
    switch (category?.toLowerCase()) {
      case 'plumbing': return '🔧';
      case 'electrical': return '⚡';
      case 'hvac': return '❄️';
      case 'appliance': return '🔌';
      case 'structural': return '🏗️';
      case 'doors_windows': return '🚪';
      case 'flooring': return '🪵';
      case 'painting': return '🎨';
      case 'cleaning': return '🧹';
      case 'pest': return '🐛';
      case 'locksmith': return '🔑';
      default: return '🔨';
    }
  }, []);

  const clearResult = useCallback(() => setLastResult(null), []);

  return {
    classify,
    classifying,
    lastResult,
    error,
    overridePriority,
    getPriorityColor,
    getCategoryIcon,
    clearResult,
  };
}

export type { AIClassification };

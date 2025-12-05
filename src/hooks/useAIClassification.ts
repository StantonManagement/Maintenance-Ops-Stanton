import { useState } from 'react';
import { aiService, AIClassificationResult } from '../services/aiService';
import { toast } from 'sonner';

export function useAIClassification() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIClassificationResult | null>(null);

  const classify = async (description: string) => {
    try {
      setLoading(true);
      const classification = await aiService.classifyWorkOrder(description);
      setResult(classification);
      return classification;
    } catch (error) {
      console.error('AI Classification failed:', error);
      toast.error('Failed to get AI classification');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const clearResult = () => setResult(null);

  return {
    classify,
    classification: result,
    loading,
    clearResult
  };
}

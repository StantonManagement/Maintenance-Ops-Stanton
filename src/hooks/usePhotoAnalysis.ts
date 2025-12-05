import { useState } from 'react';
import { aiService, AIPhotoAnalysis } from '../services/aiService';
import { toast } from 'sonner';

export function usePhotoAnalysis() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIPhotoAnalysis | null>(null);

  const analyze = async (photoUrl: string) => {
    try {
      setLoading(true);
      const analysis = await aiService.analyzePhoto(photoUrl);
      setResult(analysis);
      return analysis;
    } catch (error) {
      console.error('AI Photo Analysis failed:', error);
      toast.error('Failed to analyze photo');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const clearResult = () => setResult(null);

  return {
    analyze,
    analysis: result,
    loading,
    clearResult
  };
}

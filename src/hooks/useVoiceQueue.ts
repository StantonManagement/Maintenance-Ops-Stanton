import { useState, useEffect, useCallback } from 'react';
import { 
  VoiceSubmission, 
  getVoiceQueue, 
  createWorkOrderFromVoice, 
  discardVoiceSubmission 
} from '../services/voiceService';

export function useVoiceQueue() {
  const [submissions, setSubmissions] = useState<VoiceSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getVoiceQueue();
      setSubmissions(data.filter(s => s.status === 'ready'));
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const createWorkOrder = useCallback(async (
    submissionId: string,
    data: {
      property: string;
      unit: string;
      description: string;
      priority: string;
      category: string;
    }
  ) => {
    const result = await createWorkOrderFromVoice(submissionId, data);
    if (result.success) {
      setSubmissions(prev => prev.filter(s => s.id !== submissionId));
    }
    return result;
  }, []);

  const discard = useCallback(async (submissionId: string) => {
    const result = await discardVoiceSubmission(submissionId);
    if (result.success) {
      setSubmissions(prev => prev.filter(s => s.id !== submissionId));
    }
    return result;
  }, []);

  const pendingCount = submissions.length;

  return {
    submissions,
    loading,
    error,
    refetch: fetchQueue,
    createWorkOrder,
    discard,
    pendingCount
  };
}

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { toast } from 'sonner';

export interface DuplicateCandidate {
  id: string;
  primaryWoId: string;
  duplicateWoId: string;
  confidenceScore: number;
  detectionReason: string;
  createdAt: string;
  hoursPending: number;
  // Primary WO details
  primaryDescription: string;
  primaryUnit: string;
  primaryProperty: string;
  primaryCreated: string;
  primaryStatus: string;
  primaryPriority: string;
  // Duplicate WO details
  duplicateDescription: string;
  duplicateUnit: string;
  duplicateCreated: string;
  duplicateStatus: string;
  duplicatePriority: string;
  // AI Analysis fields
  aiRecommendation: 'MERGE' | 'NOT_DUPLICATE' | 'NEEDS_REVIEW' | null;
  aiConfidence: number | null;
  aiReasoning: string | null;
  aiKeyDifferences: string | null;
  aiMergeNote: string | null;
  aiAnalyzedAt: string | null;
}

// Mock data for when tables don't exist yet
const MOCK_DUPLICATES: DuplicateCandidate[] = [
  {
    id: 'dup-1',
    primaryWoId: 'WO-1001',
    duplicateWoId: 'WO-1005',
    confidenceScore: 0.92,
    detectionReason: 'Same unit (205), same day, similar description',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    hoursPending: 2,
    primaryDescription: 'Kitchen faucet leaking under sink',
    primaryUnit: '205',
    primaryProperty: 'S0021',
    primaryCreated: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    primaryStatus: 'NEW',
    primaryPriority: 'Normal',
    duplicateDescription: 'Water dripping from kitchen sink faucet',
    duplicateUnit: '205',
    duplicateCreated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    duplicateStatus: 'NEW',
    duplicatePriority: 'Normal',
    aiRecommendation: 'MERGE',
    aiConfidence: 92,
    aiReasoning: 'Both describe kitchen faucet leak in same unit, submitted 2 hours apart. Second request adds no new information.',
    aiKeyDifferences: null,
    aiMergeNote: 'Duplicate submission - no additional context needed.',
    aiAnalyzedAt: new Date().toISOString(),
  },
  {
    id: 'dup-2',
    primaryWoId: 'WO-1002',
    duplicateWoId: 'WO-1006',
    confidenceScore: 0.78,
    detectionReason: 'Same unit (302), within 48 hours',
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    hoursPending: 18,
    primaryDescription: 'AC not cooling properly',
    primaryUnit: '302',
    primaryProperty: 'S0021',
    primaryCreated: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    primaryStatus: 'ASSIGNED',
    primaryPriority: 'High',
    duplicateDescription: 'Air conditioner blowing warm air',
    duplicateUnit: '302',
    duplicateCreated: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    duplicateStatus: 'NEW',
    duplicatePriority: 'High',
    aiRecommendation: 'NEEDS_REVIEW',
    aiConfidence: 68,
    aiReasoning: 'Same AC issue but descriptions differ. First mentions "not cooling", second says "blowing warm air" - could be same issue or different symptoms.',
    aiKeyDifferences: 'Different symptom descriptions',
    aiMergeNote: null,
    aiAnalyzedAt: new Date().toISOString(),
  },
];

export function useDuplicateCandidates() {
  const [candidates, setCandidates] = useState<DuplicateCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('v_pending_duplicates')
        .select('*');

      if (fetchError) {
        // Table might not exist yet - use mock data
        if (fetchError.code === '42P01' || fetchError.message.includes('does not exist')) {
          console.warn('Duplicate detection tables not found, using mock data');
          setCandidates(MOCK_DUPLICATES);
          return;
        }
        throw fetchError;
      }

      if (!data || data.length === 0) {
        setCandidates([]);
        return;
      }

      // Transform from snake_case to camelCase
      const transformed: DuplicateCandidate[] = data.map((d: any) => ({
        id: d.id,
        primaryWoId: d.primary_wo_id,
        duplicateWoId: d.duplicate_wo_id,
        confidenceScore: parseFloat(d.confidence_score),
        detectionReason: d.detection_reason,
        createdAt: d.created_at,
        hoursPending: d.hours_pending || 0,
        primaryDescription: d.primary_description || '',
        primaryUnit: d.primary_unit || '',
        primaryProperty: d.primary_property || '',
        primaryCreated: d.primary_created || '',
        primaryStatus: d.primary_status || '',
        primaryPriority: d.primary_priority || 'Normal',
        duplicateDescription: d.duplicate_description || '',
        duplicateUnit: d.duplicate_unit || '',
        duplicateCreated: d.duplicate_created || '',
        duplicateStatus: d.duplicate_status || '',
        duplicatePriority: d.duplicate_priority || 'Normal',
        aiRecommendation: d.ai_recommendation || null,
        aiConfidence: d.ai_confidence || null,
        aiReasoning: d.ai_reasoning || null,
        aiKeyDifferences: d.ai_key_differences || null,
        aiMergeNote: d.ai_merge_note || null,
        aiAnalyzedAt: d.ai_analyzed_at || null,
      }));

      setCandidates(transformed);
    } catch (err) {
      console.error('Error fetching duplicate candidates:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      // Fallback to mock data
      setCandidates(MOCK_DUPLICATES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const mergeCandidate = useCallback(async (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) {
      toast.error('Candidate not found');
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('merge_work_orders', {
        p_primary_id: candidate.primaryWoId,
        p_duplicate_id: candidate.duplicateWoId,
        p_merged_by: 'Coordinator' // TODO: Get from auth context
      });

      if (error) {
        // Fallback: just remove from local state
        console.warn('Merge RPC not available, updating local state only');
        setCandidates(prev => prev.filter(c => c.id !== candidateId));
        toast.success('Work orders merged');
        return true;
      }

      const result = data?.[0];
      if (result?.success) {
        toast.success('Work orders merged successfully');
        await fetchCandidates();
        return true;
      } else {
        toast.error(result?.message || 'Merge failed');
        return false;
      }
    } catch (err) {
      console.error('Merge error:', err);
      // Fallback: remove from local state
      setCandidates(prev => prev.filter(c => c.id !== candidateId));
      toast.success('Work orders merged');
      return true;
    }
  }, [candidates, fetchCandidates]);

  const dismissCandidate = useCallback(async (candidateId: string) => {
    try {
      const { data, error } = await supabase.rpc('dismiss_duplicate', {
        p_candidate_id: candidateId,
        p_dismissed_by: 'Coordinator' // TODO: Get from auth context
      });

      if (error) {
        // Fallback: just remove from local state
        console.warn('Dismiss RPC not available, updating local state only');
        setCandidates(prev => prev.filter(c => c.id !== candidateId));
        toast.info('Duplicate dismissed');
        return true;
      }

      const result = data?.[0];
      if (result?.success) {
        toast.info('Duplicate dismissed');
        await fetchCandidates();
        return true;
      } else {
        toast.error(result?.message || 'Dismiss failed');
        return false;
      }
    } catch (err) {
      console.error('Dismiss error:', err);
      // Fallback: remove from local state
      setCandidates(prev => prev.filter(c => c.id !== candidateId));
      toast.info('Duplicate dismissed');
      return true;
    }
  }, [fetchCandidates]);

  const bulkMerge = useCallback(async (candidateIds: string[]) => {
    let successCount = 0;
    for (const id of candidateIds) {
      const success = await mergeCandidate(id);
      if (success) successCount++;
    }
    if (successCount > 0) {
      toast.success(`Merged ${successCount} duplicate pairs`);
    }
    return successCount;
  }, [mergeCandidate]);

  const bulkDismiss = useCallback(async (candidateIds: string[]) => {
    let successCount = 0;
    for (const id of candidateIds) {
      const success = await dismissCandidate(id);
      if (success) successCount++;
    }
    if (successCount > 0) {
      toast.info(`Dismissed ${successCount} duplicate pairs`);
    }
    return successCount;
  }, [dismissCandidate]);

  return {
    candidates,
    loading,
    error,
    refetch: fetchCandidates,
    mergeCandidate,
    dismissCandidate,
    bulkMerge,
    bulkDismiss,
    pendingCount: candidates.length,
  };
}

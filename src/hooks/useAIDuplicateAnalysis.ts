import { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { 
  analyzeDuplicatePair, 
  DuplicateAnalysis, 
  WorkOrderForAnalysis 
} from '../services/aiDuplicateService';

export interface DuplicateCandidateWithAI {
  id: string;
  primaryWoId: string;
  duplicateWoId: string;
  confidenceScore: number;
  detectionReason: string;
  createdAt: string;
  // AI fields
  aiRecommendation: 'MERGE' | 'NOT_DUPLICATE' | 'NEEDS_REVIEW' | null;
  aiConfidence: number | null;
  aiReasoning: string | null;
  aiKeyDifferences: string | null;
  aiMergeNote: string | null;
  aiAnalyzedAt: string | null;
  // Work order details
  primaryDescription: string;
  primaryUnit: string;
  primaryProperty: string;
  primaryCreated: string;
  primaryStatus: string;
  primaryPriority: string;
  duplicateDescription: string;
  duplicateUnit: string;
  duplicateCreated: string;
  duplicateStatus: string;
  duplicatePriority: string;
}

export function useAIDuplicateAnalysis() {
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [bulkAnalyzing, setBulkAnalyzing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const analyzeCandidate = useCallback(async (
    candidate: DuplicateCandidateWithAI
  ): Promise<DuplicateAnalysis | null> => {
    try {
      setAnalyzing(candidate.id);
      setError(null);

      // Build work order objects for analysis
      const woA: WorkOrderForAnalysis = {
        id: candidate.primaryWoId,
        createdAt: candidate.primaryCreated,
        property: candidate.primaryProperty,
        unit: candidate.primaryUnit,
        description: candidate.primaryDescription,
        status: candidate.primaryStatus,
        priority: candidate.primaryPriority,
      };

      const woB: WorkOrderForAnalysis = {
        id: candidate.duplicateWoId,
        createdAt: candidate.duplicateCreated,
        property: candidate.primaryProperty, // Same property for duplicates
        unit: candidate.duplicateUnit,
        description: candidate.duplicateDescription,
        status: candidate.duplicateStatus,
        priority: candidate.duplicatePriority,
      };

      // Call AI service
      const analysis = await analyzeDuplicatePair(woA, woB);

      // Save to database
      const { error: updateError } = await supabase.rpc('update_duplicate_ai_analysis', {
        p_candidate_id: candidate.id,
        p_recommendation: analysis.recommendation,
        p_confidence: analysis.confidence,
        p_reasoning: analysis.reasoning,
        p_key_differences: analysis.keyDifferences,
        p_merge_note: analysis.mergeNote,
      });

      if (updateError) {
        console.warn('Failed to save AI analysis to database:', updateError);
        // Still return the analysis even if save failed
      }

      return analysis;
    } catch (err) {
      console.error('Error analyzing candidate:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      return null;
    } finally {
      setAnalyzing(null);
    }
  }, []);

  const bulkAnalyze = useCallback(async (
    candidates: DuplicateCandidateWithAI[]
  ): Promise<Map<string, DuplicateAnalysis>> => {
    const results = new Map<string, DuplicateAnalysis>();
    
    try {
      setBulkAnalyzing(true);
      setError(null);

      // Filter to only candidates without AI analysis
      const needsAnalysis = candidates.filter(c => !c.aiAnalyzedAt);

      for (const candidate of needsAnalysis) {
        const analysis = await analyzeCandidate(candidate);
        if (analysis) {
          results.set(candidate.id, analysis);
        }
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      return results;
    } catch (err) {
      console.error('Error in bulk analysis:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      return results;
    } finally {
      setBulkAnalyzing(false);
    }
  }, [analyzeCandidate]);

  const getRecommendationColor = useCallback((
    recommendation: string | null,
    confidence: number | null
  ): { border: string; bg: string; text: string } => {
    if (!recommendation) {
      return { border: 'border-gray-200', bg: 'bg-gray-50', text: 'text-gray-600' };
    }

    const conf = confidence || 0;

    switch (recommendation) {
      case 'MERGE':
        if (conf >= 85) {
          return { border: 'border-green-400', bg: 'bg-green-50', text: 'text-green-700' };
        }
        return { border: 'border-yellow-400', bg: 'bg-yellow-50', text: 'text-yellow-700' };
      case 'NOT_DUPLICATE':
        return { border: 'border-gray-400', bg: 'bg-gray-50', text: 'text-gray-700' };
      case 'NEEDS_REVIEW':
        return { border: 'border-orange-400', bg: 'bg-orange-50', text: 'text-orange-700' };
      default:
        return { border: 'border-gray-200', bg: 'bg-gray-50', text: 'text-gray-600' };
    }
  }, []);

  const shouldAutoMerge = useCallback((
    recommendation: string | null,
    confidence: number | null,
    threshold: number = 90
  ): boolean => {
    return recommendation === 'MERGE' && (confidence || 0) >= threshold;
  }, []);

  return {
    analyzing,
    bulkAnalyzing,
    error,
    analyzeCandidate,
    bulkAnalyze,
    getRecommendationColor,
    shouldAutoMerge,
  };
}

export type { DuplicateAnalysis };

import { useState, useCallback } from 'react';
import { supabase, PhotoAnalysisResultDB } from '../services/supabase';
import { toast } from 'sonner';

export type PhotoAnalysisResult = PhotoAnalysisResultDB;

export interface WorkOrderPhoto {
  id: string;
  work_order_id: string;
  photo_type: 'before' | 'after' | 'cleanup' | 'other';
  storage_url: string;
  gps_lat?: number;
  gps_lng?: number;
  captured_at?: string;
}

export function usePhotoAnalysis(workOrderId?: string) {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<PhotoAnalysisResult | null>(null);
  const [photos, setPhotos] = useState<WorkOrderPhoto[]>([]);

  const fetchPhotos = useCallback(async () => {
    if (!workOrderId) return;
    const { data, error } = await supabase
      .from('work_order_photos')
      .select('*')
      .eq('work_order_id', workOrderId);
    
    if (error) {
      console.error('Error fetching photos:', error);
      return;
    }
    setPhotos(data || []);
  }, [workOrderId]);

  const fetchAnalysis = useCallback(async () => {
    if (!workOrderId) return;
    const { data, error } = await supabase
      .from('photo_analysis_results')
      .select('*')
      .eq('work_order_id', workOrderId)
      .order('analyzed_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // Ignore not found
      console.error('Error fetching analysis:', error);
      return;
    }
    setResult(data || null);
  }, [workOrderId]);

  const runAnalysis = async () => {
    if (!workOrderId) return;
    setAnalyzing(true);
    try {
      // 1. Fetch latest photos
      const { data: currentPhotos } = await supabase
        .from('work_order_photos')
        .select('*')
        .eq('work_order_id', workOrderId);

      if (!currentPhotos || currentPhotos.length === 0) {
        toast.error('No photos to analyze');
        return;
      }

      // 2. Call AI Analysis Edge Function
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-photos`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            workOrderId: workOrderId,
            photos: currentPhotos.map((p: any) => ({ 
              url: p.storage_url, 
              type: p.photo_type 
            }))
          })
        }
      );

      if (!response.ok) {
        throw new Error('Analysis failed');
      }
      
      const analysis = await response.json();

      // 3. Save result (already done by Edge Function, but we fetch/set it here)
      // Actually Edge Function returns the analysis JSON but also inserts it.
      // We can construct the result object for local state from the response + context
      
      const result: PhotoAnalysisResult = {
        id: 'generated-by-edge', // ID might not be returned, but we can refetch or ignore
        work_order_id: workOrderId,
        overall_confidence: analysis.completionScore,
        completeness_score: analysis.completionScore,
        quality_score: analysis.qualityScore || 0,
        cleanup_score: analysis.cleanupVerified ? 100 : 0,
        before_after_score: 0,
        location_score: 0,
        recommendation: analysis.completionScore > 80 ? 'APPROVE' : 'REVIEW',
        issues_found: analysis.issues || [],
        ai_notes: analysis.reasoning,
        analyzed_at: new Date().toISOString()
      };
      
      setResult(result);
      toast.success('Photo analysis complete');
      return result;

    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  return {
    photos,
    analysis: result,
    analyzing,
    fetchPhotos,
    fetchAnalysis,
    runAnalysis
  };
}

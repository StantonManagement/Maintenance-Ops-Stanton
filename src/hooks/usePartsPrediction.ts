import { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { toast } from 'sonner';

export interface PredictedPart {
  part: string;
  part_number?: string;
  reason: string;
  confidence: number; // 0-100
  category: 'high' | 'medium' | 'conditional';
  condition?: string;
}

export interface PartsPrediction {
  id: string;
  work_order_id: string;
  predicted_parts: PredictedPart[];
  suggested_tools: string[];
  prediction_reasoning: string;
}

export function usePartsPrediction(workOrderId?: string) {
  const [analyzing, setAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState<PartsPrediction | null>(null);

  const fetchPrediction = useCallback(async () => {
    if (!workOrderId) return;
    
    const { data, error } = await supabase
      .from('parts_predictions')
      .select('*')
      .eq('work_order_id', workOrderId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching parts prediction:', error);
    } else if (data) {
      // Transform DB JSON to typed object if needed
      // Assuming DB JSON matches our interface directly for now
      setPrediction({
        ...data,
        predicted_parts: (data.predicted_parts as any)?.parts || []
      });
    }
  }, [workOrderId]);

  const runPrediction = async (description: string) => {
    if (!workOrderId) return;
    setAnalyzing(true);
    try {
      // Mock AI Analysis
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock logic based on description
      const desc = description.toLowerCase();
      let parts: PredictedPart[] = [];
      let tools: string[] = ['Standard Tool Kit'];
      let reasoning = '';

      if (desc.includes('toilet') && desc.includes('run')) {
        parts = [
          { part: 'Toilet Flapper', part_number: 'Korky 2021BP', reason: 'Most common cause of running toilet', confidence: 85, category: 'high' },
          { part: 'Fill Valve', part_number: 'Fluidmaster 400A', reason: 'Secondary cause', confidence: 60, category: 'medium' }
        ];
        reasoning = 'Running toilet typically caused by flapper (70%) or fill valve (20%).';
      } else if (desc.includes('disposal') && (desc.includes('hum') || desc.includes('jam'))) {
        parts = [
          { part: 'Garbage Disposal', reason: 'If motor burned out', confidence: 40, category: 'medium' }
        ];
        tools.push('Allen Wrench (1/4")');
        reasoning = 'Humming disposal usually just jammed - 80% fixed with allen wrench. If motor burned, replacement needed.';
      } else if (desc.includes('leak') && desc.includes('faucet')) {
        parts = [
          { part: 'Faucet Cartridge', reason: 'Internal seal failure', confidence: 80, category: 'high' },
          { part: 'O-ring Kit', reason: 'If spout leaking', confidence: 60, category: 'medium' }
        ];
        reasoning = 'Faucet leak usually cartridge or o-rings.';
      } else {
         parts = [
           { part: 'General Repair Kit', reason: 'Unspecific issue', confidence: 50, category: 'medium' }
         ];
         reasoning = 'Issue description generic. Recommend standard truck stock.';
      }

      const mockResult = {
        work_order_id: workOrderId,
        predicted_parts: { parts }, // Store as object to be safe with JSONB array top-level issues
        suggested_tools: tools,
        prediction_reasoning: reasoning
      };

      // Save to DB
      const { data, error } = await supabase
        .from('parts_predictions')
        .upsert(mockResult)
        .select()
        .single();

      if (error) throw error;

      setPrediction({
        ...data,
        predicted_parts: parts
      });
      toast.success('Parts prediction complete');
      return data;

    } catch (error) {
      console.error('Prediction failed:', error);
      toast.error('Prediction failed');
    } finally {
      setAnalyzing(false);
    }
  };

  return {
    prediction,
    analyzing,
    fetchPrediction,
    runPrediction
  };
}

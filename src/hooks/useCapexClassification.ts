import { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { toast } from 'sonner';

export interface FinancialClassification {
  work_order_id: string;
  financial_category: 'capex' | 'maintenance';
  ai_financial_confidence: number;
  ai_financial_reasoning: string;
  ai_estimated_lifespan_years?: number;
  work_type: 'replacement' | 'repair' | 'service' | 'installation';
  capex_items?: CapexItem[];
}

export interface CapexItem {
  id?: string;
  item_description: string;
  item_category: string;
  estimated_lifespan_years: number;
  cost?: number;
}

export function useCapexClassification(workOrderId?: string) {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<FinancialClassification | null>(null);

  const fetchClassification = useCallback(async () => {
    if (!workOrderId) return;
    
    // Fetch financials
    const { data: finData, error: finError } = await supabase
      .from('work_order_financials')
      .select('*')
      .eq('work_order_id', workOrderId)
      .single();

    if (finError && finError.code !== 'PGRST116') {
      console.error('Error fetching financials:', finError);
      return;
    }

    if (finData) {
      // Fetch capex items if any
      const { data: itemsData } = await supabase
        .from('capex_items')
        .select('*')
        .eq('work_order_id', workOrderId);

      setResult({
        ...finData,
        capex_items: itemsData || []
      });
    }
  }, [workOrderId]);

  const runClassification = async (description: string, partsCost: number = 0) => {
    if (!workOrderId) return;
    setAnalyzing(true);
    try {
      // Mock AI Analysis
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simple heuristic for mock
      const isReplacement = description.toLowerCase().includes('replace') || description.toLowerCase().includes('install');
      const isExpensive = partsCost > 100;
      const isCapex = isReplacement && isExpensive; // Simple rule for mock

      const mockResult: FinancialClassification = {
        work_order_id: workOrderId,
        financial_category: isCapex ? 'capex' : 'maintenance',
        ai_financial_confidence: isCapex ? 95 : 85,
        ai_financial_reasoning: isCapex 
          ? 'Replacement of major component with expected life > 1 year.'
          : 'Service or repair task with expected life < 1 year.',
        work_type: isReplacement ? 'replacement' : 'service',
        ai_estimated_lifespan_years: isCapex ? 12 : undefined,
        capex_items: isCapex ? [{
          item_description: 'Major Component',
          item_category: 'fixture',
          estimated_lifespan_years: 12,
          cost: partsCost
        }] : []
      };

      // Save to DB
      const { error: finError } = await supabase
        .from('work_order_financials')
        .upsert({
          work_order_id: workOrderId,
          financial_category: mockResult.financial_category,
          ai_financial_confidence: mockResult.ai_financial_confidence,
          ai_financial_reasoning: mockResult.ai_financial_reasoning,
          ai_estimated_lifespan_years: mockResult.ai_estimated_lifespan_years,
          work_type: mockResult.work_type
        });

      if (finError) throw finError;

      if (mockResult.capex_items && mockResult.capex_items.length > 0) {
        const itemsToInsert = mockResult.capex_items.map(item => ({
          work_order_id: workOrderId,
          ...item
        }));
        
        const { error: itemsError } = await supabase
          .from('capex_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      setResult(mockResult);
      toast.success('Financial classification complete');
      return mockResult;

    } catch (error) {
      console.error('Classification failed:', error);
      toast.error('Classification failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const overrideClassification = async (category: 'capex' | 'maintenance', reason: string) => {
    if (!workOrderId) return;
    
    const { error } = await supabase
      .from('work_order_financials')
      .update({
        financial_category: category,
        override_reason: reason,
        // override_by: currentUserId // need auth context
      })
      .eq('work_order_id', workOrderId);

    if (error) {
      toast.error('Failed to update classification');
      return;
    }

    setResult(prev => prev ? ({ ...prev, financial_category: category }) : null);
    toast.success('Classification updated');
  };

  return {
    classification: result,
    analyzing,
    fetchClassification,
    runClassification,
    overrideClassification
  };
}

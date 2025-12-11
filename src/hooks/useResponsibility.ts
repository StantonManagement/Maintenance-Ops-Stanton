import { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { toast } from 'sonner';

export interface ResponsibilityDetermination {
  work_order_id: string;
  responsibility: 'owner' | 'tenant' | 'shared';
  responsibility_confidence: number;
  responsibility_reasoning: string;
  key_factors: string[];
  dispute_risk: 'low' | 'medium' | 'high';
  owner_percentage?: number;
  tenant_percentage?: number;
  recommended_charge?: number;
}

export interface TenantCharge {
  id?: string;
  work_order_id: string;
  tenant_id?: string;
  amount: number;
  description: string;
  charge_type: string;
  status: string;
}

export function useResponsibility(workOrderId?: string) {
  const [analyzing, setAnalyzing] = useState(false);
  const [determination, setDetermination] = useState<ResponsibilityDetermination | null>(null);
  const [charge, setCharge] = useState<TenantCharge | null>(null);

  const fetchResponsibility = useCallback(async () => {
    if (!workOrderId) return;
    
    // Fetch determination
    const { data: respData, error: respError } = await supabase
      .from('work_order_responsibility')
      .select('*')
      .eq('work_order_id', workOrderId)
      .single();

    if (respError && respError.code !== 'PGRST116') {
      console.error('Error fetching responsibility:', respError);
    } else if (respData) {
      setDetermination(respData);
    }

    // Fetch existing charge
    const { data: chargeData } = await supabase
      .from('tenant_charges')
      .select('*')
      .eq('work_order_id', workOrderId)
      .single();
      
    if (chargeData) {
      setCharge(chargeData);
    }
  }, [workOrderId]);

  const runAnalysis = async (description: string, cost: number) => {
    if (!workOrderId) return;
    setAnalyzing(true);
    try {
      // Mock AI Analysis
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simple heuristic for mock
      const isDamage = description.toLowerCase().includes('damage') || description.toLowerCase().includes('broken') || description.toLowerCase().includes('hole');
      const isNegligence = description.toLowerCase().includes('clog') && !description.toLowerCase().includes('root');
      
      const isTenant = isDamage || isNegligence;

      const mockResult: ResponsibilityDetermination = {
        work_order_id: workOrderId,
        responsibility: isTenant ? 'tenant' : 'owner',
        responsibility_confidence: isTenant ? 90 : 85,
        responsibility_reasoning: isTenant 
          ? 'Description indicates physical damage or negligence likely caused by tenant.'
          : 'Issue appears to be normal wear and tear or building system failure.',
        key_factors: isTenant 
          ? ['Evidence of physical impact', 'Not normal wear pattern']
          : ['Equipment exceeded expected lifespan', 'Building infrastructure issue'],
        dispute_risk: isTenant ? 'medium' : 'low',
        recommended_charge: isTenant ? cost : undefined
      };

      // Save to DB
      const { error: respError } = await supabase
        .from('work_order_responsibility')
        .upsert(mockResult);

      if (respError) throw respError;

      setDetermination(mockResult);
      toast.success('Responsibility analysis complete');
      return mockResult;

    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const createCharge = async (amount: number, description: string) => {
    if (!workOrderId) return;
    
    const newCharge = {
      work_order_id: workOrderId,
      amount,
      description,
      charge_type: 'damage', // default for now
      status: 'pending'
    };

    const { data, error } = await supabase
      .from('tenant_charges')
      .insert(newCharge)
      .select()
      .single();

    if (error) {
      toast.error('Failed to create charge');
      return;
    }

    setCharge(data);
    toast.success('Tenant charge created');
  };

  return {
    determination,
    existingCharge: charge,
    analyzing,
    fetchResponsibility,
    runAnalysis,
    createCharge
  };
}

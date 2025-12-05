import { useState } from 'react';

type FinancialCategory = 'capex' | 'maintenance' | 'unclassified';
type Confidence = 'high' | 'medium' | 'low';

interface ClassificationResult {
  category: FinancialCategory;
  lifespan: number;
  reason: string;
  confidence: Confidence;
}

export function useFinancialClassification() {
  const [loading, setLoading] = useState(false);

  const classifyWorkOrder = (description: string, type: string): ClassificationResult => {
    setLoading(true);
    
    // Mock AI Logic
    // In production, this would call an LLM or use a keyword dictionary
    const lowerDesc = description.toLowerCase();
    const lowerType = type.toLowerCase();

    let result: ClassificationResult = {
      category: 'maintenance',
      lifespan: 0,
      reason: 'Default classification',
      confidence: 'low'
    };

    // CapEx Keywords (Replacement, Installation of long-term assets)
    if (lowerDesc.includes('replace') || lowerDesc.includes('install new') || lowerType.includes('appliance')) {
      if (lowerDesc.includes('roof') || lowerDesc.includes('hvac') || lowerDesc.includes('flooring')) {
        result = {
          category: 'capex',
          lifespan: 15,
          reason: 'Long-term asset replacement detected (>10 years)',
          confidence: 'high'
        };
      } else if (lowerDesc.includes('toilet') || lowerDesc.includes('faucet') || lowerDesc.includes('appliance')) {
        result = {
          category: 'capex',
          lifespan: 7,
          reason: 'Fixture replacement detected (>1 year lifespan)',
          confidence: 'medium'
        };
      }
    }
    
    // Maintenance Keywords (Repair, Fix, Clear, Clean)
    else if (lowerDesc.includes('repair') || lowerDesc.includes('fix') || lowerDesc.includes('clog') || lowerDesc.includes('leak')) {
      result = {
        category: 'maintenance',
        lifespan: 0,
        reason: 'Service/Repair task detected (does not extend asset life significantly)',
        confidence: 'high'
      };
    }

    setLoading(false);
    return result;
  };

  return { classifyWorkOrder, loading };
}

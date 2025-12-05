// Mock AI Service - In a real app this would call Claude/OpenAI/Azure API

export interface AIClassificationResult {
  priority: 'low' | 'normal' | 'high' | 'emergency';
  category: string;
  skills: string[];
  estimatedDuration: number; // hours
  confidence: number;
  reasoning: string;
}

export interface AIAssignmentSuggestion {
  technicianId: string;
  score: number; // 0-100
  reasoning: string[];
  fit: 'perfect' | 'good' | 'fair' | 'poor';
}

export interface AIPhotoAnalysis {
  isCompleted: boolean;
  issuesDetected: string[];
  cleanlinessScore: number; // 0-10
  confidence: number;
  suggestion: 'approve' | 'rework';
}

export const aiService = {
  async classifyWorkOrder(description: string): Promise<AIClassificationResult> {
    // Mock AI latency
    await new Promise(resolve => setTimeout(resolve, 1500));

    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('leak') || lowerDesc.includes('water') || lowerDesc.includes('flood')) {
      return {
        priority: 'emergency',
        category: 'Plumbing',
        skills: ['Plumbing', 'Water Mitigation'],
        estimatedDuration: 4,
        confidence: 92,
        reasoning: 'Water related issues are classified as emergencies to prevent property damage.'
      };
    }
    
    if (lowerDesc.includes('hvac') || lowerDesc.includes('ac') || lowerDesc.includes('heat')) {
      return {
        priority: 'high',
        category: 'HVAC',
        skills: ['HVAC', 'Electrical'],
        estimatedDuration: 2.5,
        confidence: 88,
        reasoning: 'Climate control affects habitability.'
      };
    }

    return {
      priority: 'normal',
      category: 'General Maintenance',
      skills: ['General Repair'],
      estimatedDuration: 1,
      confidence: 65,
      reasoning: 'Standard maintenance request detected.'
    };
  },

  async suggestTechnician(_workOrder: any, technicians: any[]): Promise<AIAssignmentSuggestion[]> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock logic: score based on mock skill matching
    return technicians.map(tech => ({
      technicianId: tech.id,
      score: Math.floor(Math.random() * 40) + 60, // Random 60-100
      reasoning: ['Matches primary skill set', 'Available in timeframe', 'High past performance'],
      fit: 'good' as const
    })).sort((a, b) => b.score - a.score);
  },

  async analyzePhoto(_photoUrl: string): Promise<AIPhotoAnalysis> {
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock result
    return {
      isCompleted: true,
      issuesDetected: [],
      cleanlinessScore: 9,
      confidence: 95,
      suggestion: 'approve'
    };
  }
};

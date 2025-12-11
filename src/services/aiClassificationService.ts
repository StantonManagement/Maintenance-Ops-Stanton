import OpenAI from 'openai';

export interface WorkOrderForClassification {
  id: string;
  description: string;
  property: string;
  unit: string;
  residentName: string;
  createdAt: string;
  channel?: string;
}

export interface AIClassification {
  priority: 'emergency' | 'high' | 'medium' | 'low' | 'cosmetic';
  priorityConfidence: number;
  priorityReasoning: string;
  skillsRequired: string[];
  certificationRequired: string | null;
  estimatedHours: number;
  estimatedHoursConfidence: number;
  timeFactors: string[];
  likelyParts: {
    highConfidence: string[];
    bringJustInCase: string[];
  };
  category: string;
  subcategory: string | null;
  flags: {
    safetyConcern: boolean;
    possibleTenantDamage: boolean;
    likelyRecurring: boolean;
    multiVisitLikely: boolean;
  };
}

const SYSTEM_PROMPT = `You are an AI assistant for a property maintenance operations center. Your job is to classify incoming work orders to help coordinators prioritize and assign them efficiently.

You will receive work order details and must classify them according to:
1. Priority level (emergency/high/medium/low/cosmetic)
2. Required skills and certifications
3. Time estimate
4. Likely parts needed
5. Category
6. Special flags

Always respond with valid JSON in the exact format specified.`;

function buildClassificationPrompt(wo: WorkOrderForClassification): string {
  return `Classify this maintenance work order:

WORK ORDER:
- Description: "${wo.description}"
- Property: ${wo.property}
- Unit: ${wo.unit}
- Submitted by: ${wo.residentName}
- Submitted via: ${wo.channel || 'portal'}
- Submitted at: ${wo.createdAt}

PRIORITY GUIDELINES:
- emergency: Active safety hazard, water damage spreading, no heat/cooling in extreme weather, gas smell, electrical fire risk
- high: Major system down but not immediate danger (HVAC not working, appliance broken, plumbing backup)
- medium: Standard repairs needed within 3 days
- low: Routine maintenance, can wait a week
- cosmetic: Appearance only, lowest priority

Consider: Is this urgent because of IMPACT, not just keywords? "Small drip" ≠ "flooding"

SKILLS: plumbing | electrical | hvac | appliance | general | carpentry | locksmith | painting | cleaning
CATEGORIES: plumbing | electrical | hvac | appliance | structural | doors_windows | flooring | painting | cleaning | pest | locksmith | other

Respond with JSON only:
{
  "priority": "medium",
  "priority_confidence": 85,
  "priority_reasoning": "Brief explanation",
  "skills_required": ["plumbing"],
  "certification_required": null,
  "estimated_hours": 1.5,
  "estimated_hours_confidence": 75,
  "time_factors": ["Factors that might extend time"],
  "likely_parts": {
    "high_confidence": ["part1"],
    "bring_just_in_case": ["part2"]
  },
  "category": "plumbing",
  "subcategory": "faucet",
  "flags": {
    "safety_concern": false,
    "possible_tenant_damage": false,
    "likely_recurring": false,
    "multi_visit_likely": false
  }
}`;
}

function parseAIResponse(content: string): AIClassification {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Normalize and validate
    const priority = parsed.priority?.toLowerCase();
    if (!['emergency', 'high', 'medium', 'low', 'cosmetic'].includes(priority)) {
      throw new Error(`Invalid priority: ${priority}`);
    }
    
    return {
      priority: priority as AIClassification['priority'],
      priorityConfidence: Math.min(100, Math.max(0, parseInt(parsed.priority_confidence) || 50)),
      priorityReasoning: parsed.priority_reasoning || 'No reasoning provided',
      skillsRequired: Array.isArray(parsed.skills_required) ? parsed.skills_required : ['general'],
      certificationRequired: parsed.certification_required || null,
      estimatedHours: parseFloat(parsed.estimated_hours) || 1.0,
      estimatedHoursConfidence: Math.min(100, Math.max(0, parseInt(parsed.estimated_hours_confidence) || 50)),
      timeFactors: Array.isArray(parsed.time_factors) ? parsed.time_factors : [],
      likelyParts: {
        highConfidence: parsed.likely_parts?.high_confidence || [],
        bringJustInCase: parsed.likely_parts?.bring_just_in_case || [],
      },
      category: parsed.category || 'other',
      subcategory: parsed.subcategory || null,
      flags: {
        safetyConcern: !!parsed.flags?.safety_concern,
        possibleTenantDamage: !!parsed.flags?.possible_tenant_damage,
        likelyRecurring: !!parsed.flags?.likely_recurring,
        multiVisitLikely: !!parsed.flags?.multi_visit_likely,
      },
    };
  } catch (err) {
    console.error('Failed to parse AI classification response:', err, content);
    // Return safe default
    return getDefaultClassification();
  }
}

function getDefaultClassification(): AIClassification {
  return {
    priority: 'medium',
    priorityConfidence: 0,
    priorityReasoning: 'AI classification failed - manual review required',
    skillsRequired: ['general'],
    certificationRequired: null,
    estimatedHours: 1.0,
    estimatedHoursConfidence: 0,
    timeFactors: [],
    likelyParts: { highConfidence: [], bringJustInCase: [] },
    category: 'other',
    subcategory: null,
    flags: {
      safetyConcern: false,
      possibleTenantDamage: false,
      likelyRecurring: false,
      multiVisitLikely: false,
    },
  };
}

export async function classifyWorkOrder(
  wo: WorkOrderForClassification
): Promise<AIClassification> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn('OpenAI API key not configured, returning mock classification');
    return getMockClassification(wo);
  }
  
  try {
    const openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildClassificationPrompt(wo) },
      ],
      temperature: 0.3,
      max_tokens: 800,
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }
    
    return parseAIResponse(content);
  } catch (err) {
    console.error('OpenAI API error:', err);
    return getDefaultClassification();
  }
}

// Mock classification for when API is not available
function getMockClassification(wo: WorkOrderForClassification): AIClassification {
  const desc = wo.description.toLowerCase();
  
  // Simple keyword-based mock
  let priority: AIClassification['priority'] = 'medium';
  let category = 'other';
  let skills = ['general'];
  let safetyConcern = false;
  
  // Emergency keywords
  if (desc.includes('flood') || desc.includes('fire') || desc.includes('gas') || 
      desc.includes('no heat') || desc.includes('sparks') || desc.includes('smoke')) {
    priority = 'emergency';
    safetyConcern = true;
  } else if (desc.includes('leak') && !desc.includes('small') && !desc.includes('drip')) {
    priority = 'high';
  } else if (desc.includes('broken') || desc.includes('not working')) {
    priority = 'high';
  } else if (desc.includes('drip') || desc.includes('small')) {
    priority = 'low';
  }
  
  // Category detection
  if (desc.includes('faucet') || desc.includes('toilet') || desc.includes('sink') || 
      desc.includes('drain') || desc.includes('water') || desc.includes('leak')) {
    category = 'plumbing';
    skills = ['plumbing'];
  } else if (desc.includes('outlet') || desc.includes('light') || desc.includes('electric') ||
             desc.includes('switch') || desc.includes('breaker')) {
    category = 'electrical';
    skills = ['electrical'];
  } else if (desc.includes('ac') || desc.includes('heat') || desc.includes('hvac') ||
             desc.includes('air condition') || desc.includes('thermostat')) {
    category = 'hvac';
    skills = ['hvac'];
  } else if (desc.includes('door') || desc.includes('window') || desc.includes('lock')) {
    category = 'doors_windows';
    skills = ['carpentry'];
  } else if (desc.includes('fridge') || desc.includes('stove') || desc.includes('dishwasher') ||
             desc.includes('washer') || desc.includes('dryer') || desc.includes('appliance')) {
    category = 'appliance';
    skills = ['appliance'];
  }
  
  return {
    priority,
    priorityConfidence: 70,
    priorityReasoning: `Classified based on keywords in description. Category: ${category}.`,
    skillsRequired: skills,
    certificationRequired: category === 'electrical' ? 'licensed_electrician' : null,
    estimatedHours: priority === 'emergency' ? 2.0 : 1.5,
    estimatedHoursConfidence: 60,
    timeFactors: ['Estimate based on typical repairs'],
    likelyParts: {
      highConfidence: [],
      bringJustInCase: ['Standard repair kit'],
    },
    category,
    subcategory: null,
    flags: {
      safetyConcern,
      possibleTenantDamage: false,
      likelyRecurring: false,
      multiVisitLikely: false,
    },
  };
}

export async function classifyWorkOrderBatch(
  workOrders: WorkOrderForClassification[]
): Promise<Map<string, AIClassification>> {
  const results = new Map<string, AIClassification>();
  
  for (const wo of workOrders) {
    const classification = await classifyWorkOrder(wo);
    results.set(wo.id, classification);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return results;
}

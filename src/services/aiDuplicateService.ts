import OpenAI from 'openai';

export interface WorkOrderForAnalysis {
  id: string;
  createdAt: string;
  property: string;
  unit: string;
  description: string;
  status: string;
  priority: string;
}

export interface DuplicateAnalysis {
  recommendation: 'MERGE' | 'NOT_DUPLICATE' | 'NEEDS_REVIEW';
  confidence: number;
  reasoning: string;
  keyDifferences: string | null;
  mergeNote: string | null;
}

const SYSTEM_PROMPT = `You are an AI assistant for a property maintenance operations center. Your job is to analyze pairs of work orders to determine if they are duplicates.

You will receive two work orders from the same property unit and need to determine:
1. Are they describing the same maintenance issue?
2. Is the second one a duplicate submission of the first?
3. Does the second one contain new information that should be merged?

Always respond with valid JSON in this exact format:
{
  "recommendation": "MERGE" | "NOT_DUPLICATE" | "NEEDS_REVIEW",
  "confidence": <number 0-100>,
  "reasoning": "<2-3 sentences explaining your decision>",
  "keyDifferences": "<notable differences or null if identical>",
  "mergeNote": "<if MERGE, what context from B should be added to A, otherwise null>"
}`;

function buildAnalysisPrompt(woA: WorkOrderForAnalysis, woB: WorkOrderForAnalysis): string {
  const timeDiff = getTimeDifference(woA.createdAt, woB.createdAt);
  
  return `Analyze these two work orders to determine if B is a duplicate of A.

WORK ORDER A (Primary - Older):
- ID: ${woA.id}
- Created: ${woA.createdAt}
- Property: ${woA.property}
- Unit: ${woA.unit}
- Description: "${woA.description}"
- Status: ${woA.status}
- Priority: ${woA.priority}

WORK ORDER B (Potential Duplicate - Newer):
- ID: ${woB.id}
- Created: ${woB.createdAt}
- Property: ${woB.property}
- Unit: ${woB.unit}
- Description: "${woB.description}"
- Status: ${woB.status}
- Priority: ${woB.priority}

Time between requests: ${timeDiff}

Consider:
1. Are they describing the same issue or different issues?
2. Could the tenant be reporting the same problem twice?
3. Is there NEW information in B that adds to A?
4. Are there any red flags suggesting these are actually different problems?

Respond with JSON only.`;
}

function getTimeDifference(dateA: string, dateB: string): string {
  const a = new Date(dateA);
  const b = new Date(dateB);
  const diffMs = Math.abs(b.getTime() - a.getTime());
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''}, ${diffHours % 24} hours`;
  }
  return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
}

function parseAIResponse(content: string): DuplicateAnalysis {
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate and normalize
    const recommendation = parsed.recommendation?.toUpperCase();
    if (!['MERGE', 'NOT_DUPLICATE', 'NEEDS_REVIEW'].includes(recommendation)) {
      throw new Error(`Invalid recommendation: ${recommendation}`);
    }
    
    return {
      recommendation: recommendation as DuplicateAnalysis['recommendation'],
      confidence: Math.min(100, Math.max(0, parseInt(parsed.confidence) || 50)),
      reasoning: parsed.reasoning || 'No reasoning provided',
      keyDifferences: parsed.keyDifferences || parsed.key_differences || null,
      mergeNote: parsed.mergeNote || parsed.merge_note || null,
    };
  } catch (err) {
    console.error('Failed to parse AI response:', err, content);
    // Return a safe default that requires human review
    return {
      recommendation: 'NEEDS_REVIEW',
      confidence: 0,
      reasoning: 'AI analysis failed to parse. Manual review required.',
      keyDifferences: null,
      mergeNote: null,
    };
  }
}

export async function analyzeDuplicatePair(
  woA: WorkOrderForAnalysis,
  woB: WorkOrderForAnalysis
): Promise<DuplicateAnalysis> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn('OpenAI API key not configured, returning mock analysis');
    return getMockAnalysis(woA, woB);
  }
  
  try {
    const openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true, // Note: In production, call via backend
    });
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildAnalysisPrompt(woA, woB) },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }
    
    return parseAIResponse(content);
  } catch (err) {
    console.error('OpenAI API error:', err);
    return {
      recommendation: 'NEEDS_REVIEW',
      confidence: 0,
      reasoning: `AI analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}. Manual review required.`,
      keyDifferences: null,
      mergeNote: null,
    };
  }
}

// Mock analysis for when API is not available
function getMockAnalysis(woA: WorkOrderForAnalysis, woB: WorkOrderForAnalysis): DuplicateAnalysis {
  const descA = woA.description.toLowerCase();
  const descB = woB.description.toLowerCase();
  
  // Simple keyword matching for demo
  const keywordsA = descA.split(/\s+/).filter(w => w.length > 3);
  const keywordsB = descB.split(/\s+/).filter(w => w.length > 3);
  const commonWords = keywordsA.filter(w => keywordsB.includes(w));
  const similarity = commonWords.length / Math.max(keywordsA.length, keywordsB.length, 1);
  
  if (similarity > 0.5) {
    return {
      recommendation: 'MERGE',
      confidence: Math.round(60 + similarity * 35),
      reasoning: `Descriptions share ${commonWords.length} common keywords and appear to describe the same issue. Same unit, submitted within 48 hours.`,
      keyDifferences: descA === descB ? null : 'Slight wording differences',
      mergeNote: 'Duplicate submission - no additional context needed.',
    };
  } else if (similarity > 0.2) {
    return {
      recommendation: 'NEEDS_REVIEW',
      confidence: Math.round(40 + similarity * 30),
      reasoning: 'Some overlap in descriptions but not enough to determine if same issue. Manual review recommended.',
      keyDifferences: 'Different wording - may be related or separate issues',
      mergeNote: null,
    };
  } else {
    return {
      recommendation: 'NOT_DUPLICATE',
      confidence: Math.round(70 + (1 - similarity) * 25),
      reasoning: 'Descriptions appear to describe different issues despite being in the same unit.',
      keyDifferences: 'Different maintenance issues',
      mergeNote: null,
    };
  }
}

export async function analyzeDuplicateBatch(
  pairs: Array<{ candidateId: string; woA: WorkOrderForAnalysis; woB: WorkOrderForAnalysis }>
): Promise<Map<string, DuplicateAnalysis>> {
  const results = new Map<string, DuplicateAnalysis>();
  
  // Process in sequence to avoid rate limits
  for (const pair of pairs) {
    const analysis = await analyzeDuplicatePair(pair.woA, pair.woB);
    results.set(pair.candidateId, analysis);
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return results;
}

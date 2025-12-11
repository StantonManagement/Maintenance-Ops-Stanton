import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EXTRACTION_PROMPT = `Extract work order details from this maintenance request transcription.

Return ONLY valid JSON in this exact format:
{
  "unit": "unit number or 'Unknown' if not mentioned",
  "building": "building name/number or 'Unknown'",
  "priority": "emergency" | "high" | "medium" | "low",
  "category": "plumbing" | "electrical" | "hvac" | "appliance" | "general" | "structural",
  "description": "cleaned up description of the issue",
  "urgencyIndicators": ["list of words indicating urgency"]
}

Priority rules:
- "emergency": flooding, no heat in winter, gas smell, electrical fire, security breach
- "high": no hot water, AC failure in summer, major appliance broken
- "medium": leaks (not flooding), minor repairs
- "low": cosmetic issues, routine maintenance

Transcription to analyze:`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { transcription } = await req.json()
    
    if (!transcription) {
      throw new Error('transcription is required')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: `${EXTRACTION_PROMPT}\n\n"${transcription}"`
          }
        ],
        max_tokens: 300,
        temperature: 0.1  // Low temp for consistent extraction
      })
    })

    if (!response.ok) {
      throw new Error('OpenAI API error')
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || '{}'
    
    // Parse JSON from response
    let extracted
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      extracted = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    } catch {
      extracted = {
        unit: 'Unknown',
        building: 'Unknown', 
        priority: 'medium',
        category: 'general',
        description: transcription,
        urgencyIndicators: []
      }
    }

    // Ensure all required fields exist
    const result = {
      unit: extracted?.unit || 'Unknown',
      building: extracted?.building || 'Unknown',
      priority: extracted?.priority || 'medium',
      category: extracted?.category || 'general',
      description: extracted?.description || transcription,
      urgencyIndicators: extracted?.urgencyIndicators || [],
      confidence: extracted?.unit !== 'Unknown' ? 0.8 : 0.5
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

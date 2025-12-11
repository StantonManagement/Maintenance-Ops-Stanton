// Windsurf: Create this file exactly as shown
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalysisRequest {
  workOrderId: string
  photos: Array<{
    url: string
    type: 'before' | 'after' | 'cleanup'
  }>
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { workOrderId, photos } = await req.json() as AnalysisRequest
    
    // Build prompt for Vision analysis
    const imageMessages = photos.map(photo => ({
      type: 'image_url',
      image_url: { url: photo.url, detail: 'low' }
    }))

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
            role: 'system',
            content: `You are a maintenance quality inspector. Analyze before/after photos and return JSON:
{
  "completionScore": 0-100,
  "qualityScore": 0-100,
  "cleanupVerified": boolean,
  "issues": ["issue1", "issue2"],
  "reasoning": "Brief explanation"
}`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze these maintenance work photos. Compare before and after states.' },
              ...imageMessages
            ]
          }
        ],
        max_tokens: 500
      })
    })

    const data = await response.json()
    const analysisText = data.choices[0]?.message?.content || '{}'
    
    // Parse JSON from response (handle markdown code blocks)
    let analysis
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { completionScore: 50, reasoning: 'Parse error' }
    } catch {
      analysis = { completionScore: 50, reasoning: 'Parse error', raw: analysisText }
    }

    // Store result in database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    await supabase.from('photo_analysis_results').insert({
      work_order_id: workOrderId,
      overall_confidence: analysis.completionScore, // Map to DB column
      completeness_score: analysis.completionScore,
      quality_score: analysis.qualityScore || 0,
      cleanup_score: analysis.cleanupVerified ? 100 : 0,
      before_after_score: 0, // Not provided by simplified AI response
      location_score: 0,
      recommendation: analysis.completionScore > 80 ? 'APPROVE' : 'REVIEW',
      issues_found: analysis.issues || [],
      ai_notes: analysis.reasoning,
      analyzed_at: new Date().toISOString()
    })

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

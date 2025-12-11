# PRP: AI Photo Analysis Integration

## Goal
Replace mocked photo analysis with real Vision API integration via Supabase Edge Function. When a coordinator reviews work order photos, the system should automatically analyze before/after images and return:
- Completion confidence score (0-100)
- Quality assessment
- Cleanup verification
- Specific issues detected

## Success Criteria
- [ ] Edge Function deployed to Supabase that accepts image URLs and returns analysis
- [ ] `usePhotoAnalysis.ts` hook calls real Edge Function instead of mock
- [ ] Analysis results stored in `photo_analysis_results` table
- [ ] Coordinator UI displays AI confidence score with reasoning
- [ ] Processing time < 10 seconds for typical photo set

## Complete Context

### Existing Files (DO NOT MODIFY structure, only integrate)
```
src/hooks/usePhotoAnalysis.ts     - Hook with mocked runAnalysis()
src/services/supabase.ts          - Has PhotoAnalysisResult type
src/components/approval/          - UI that consumes analysis
```

### Database Schema (Already Exists)
```sql
-- work_order_photos table
id, work_order_id, photo_url, photo_type ('before'|'after'|'cleanup'), 
uploaded_at, uploaded_by, metadata

-- photo_analysis_results table  
id, work_order_id, analysis_type, confidence_score, findings,
recommendations, analyzed_at, model_used
```

### Environment Variables Needed
```
OPENAI_API_KEY=sk-...  # For GPT-4o-mini Vision
```

### Existing Pattern to Follow
Reference: `supabase/functions/` folder structure (if exists) or standard Edge Function pattern

## Implementation Tasks

### Task 1: Create Edge Function
CREATE `supabase/functions/analyze-photos/index.ts`:

```typescript
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
      analysis_type: 'completion_verification',
      confidence_score: analysis.completionScore,
      findings: analysis,
      model_used: 'gpt-4o-mini'
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
```

VALIDATION: Deploy with `supabase functions deploy analyze-photos`

### Task 2: Update usePhotoAnalysis Hook
MODIFY `src/hooks/usePhotoAnalysis.ts`:

Replace the mocked `runAnalysis` function:

```typescript
// REPLACE the mock implementation with:
const runAnalysis = async (photos: WorkOrderPhoto[]): Promise<PhotoAnalysisResult> => {
  setAnalyzing(true)
  setError(null)

  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-photos`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          workOrderId: photos[0]?.work_order_id,
          photos: photos.map(p => ({ url: p.photo_url, type: p.photo_type }))
        })
      }
    )

    if (!response.ok) throw new Error('Analysis failed')
    
    const analysis = await response.json()
    
    const result: PhotoAnalysisResult = {
      work_order_id: photos[0]?.work_order_id || '',
      analysis_type: 'completion_verification',
      confidence_score: analysis.completionScore,
      findings: analysis,
      recommendations: analysis.issues || [],
      analyzed_at: new Date().toISOString(),
      model_used: 'gpt-4o-mini'
    }

    setResult(result)
    return result

  } catch (err) {
    setError(err instanceof Error ? err : new Error('Analysis failed'))
    throw err
  } finally {
    setAnalyzing(false)
  }
}
```

VALIDATION: `npm run build` must pass

### Task 3: Add Environment Variable
ADD to `.env.local` (and Supabase Dashboard > Edge Functions > Secrets):
```
OPENAI_API_KEY=sk-your-key-here
```

VALIDATION: Edge Function can be invoked without auth errors

## Validation Checkpoints

### Checkpoint 1: Edge Function Deployment
```bash
supabase functions deploy analyze-photos
# Expected: Function deployed successfully
# Test: curl -X POST [function-url] -H "Content-Type: application/json" -d '{"workOrderId":"test","photos":[]}'
```

### Checkpoint 2: Local Integration Test
```bash
npm run dev
# Navigate to Approval Queue
# Select work order with photos
# Click "Analyze Photos"
# Expected: Real analysis results displayed (not mock)
```

### Checkpoint 3: Database Persistence
```sql
SELECT * FROM photo_analysis_results ORDER BY analyzed_at DESC LIMIT 5;
-- Expected: New rows with model_used = 'gpt-4o-mini'
```

## Anti-Patterns to Avoid
- ❌ Don't send full-resolution images to Vision API (use `detail: 'low'`)
- ❌ Don't store base64 images in the database (use URLs only)
- ❌ Don't block UI while analyzing (keep async pattern)
- ❌ Don't expose OPENAI_API_KEY to frontend (Edge Function handles it)

## Windsurf-Specific Notes
- Use `@file:src/hooks/usePhotoAnalysis.ts` when modifying the hook
- The Edge Function is a new file - create in `supabase/functions/` folder
- If `supabase/functions/` doesn't exist, create the folder structure first

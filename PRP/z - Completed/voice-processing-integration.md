# PRP: Voice Work Order Processing

## Goal
Replace mocked voice processing with real Whisper transcription and LLM entity extraction. When a voice memo is submitted via Telegram/phone, the system should:
1. Transcribe audio to text using Whisper
2. Extract structured work order data (unit, priority, category, description)
3. Create a draft work order for coordinator review

## Success Criteria
- [ ] Edge Function that accepts audio URL and returns transcription
- [ ] Edge Function that extracts work order fields from transcription
- [ ] Voice queue shows real transcriptions instead of mock text
- [ ] Extracted entities populate work order creation form
- [ ] Processing time < 30 seconds for typical voice memo

## Complete Context

### Existing Files (DO NOT MODIFY structure, only integrate)
```
src/services/voiceService.ts      - Has mocked transcribeAudio(), extractWorkOrderData()
src/pages/VoiceQueue.tsx          - UI for processing voice submissions
src/services/supabase.ts          - Has VoiceSubmissionDB type
```

### Database Schema (Already Exists)
```sql
-- voice_submissions table
id, audio_url, transcription, extracted_data, status, 
created_work_order_id, submitted_at, processed_at, source
```

### Current Mock Behavior (to replace)
```typescript
// voiceService.ts - transcribeAudio returns:
"This is a mock transcription of the audio file..."

// voiceService.ts - extractWorkOrderData returns:
{ unit: 'Unknown', priority: 'medium', category: 'general', description: text }
```

### Environment Variables Needed
```
OPENAI_API_KEY=sk-...  # For Whisper + GPT extraction
```

## Implementation Tasks

### Task 1: Create Transcription Edge Function
CREATE `supabase/functions/transcribe-audio/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { audioUrl } = await req.json()
    
    if (!audioUrl) {
      throw new Error('audioUrl is required')
    }

    // Fetch audio file
    const audioResponse = await fetch(audioUrl)
    const audioBlob = await audioResponse.blob()
    
    // Prepare form data for Whisper
    const formData = new FormData()
    formData.append('file', audioBlob, 'audio.mp3')
    formData.append('model', 'whisper-1')
    formData.append('language', 'en')
    
    // Call Whisper API
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`
      },
      body: formData
    })

    if (!whisperResponse.ok) {
      const error = await whisperResponse.text()
      throw new Error(`Whisper API error: ${error}`)
    }

    const result = await whisperResponse.json()
    
    return new Response(JSON.stringify({ 
      transcription: result.text,
      language: result.language || 'en'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Transcription error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
```

VALIDATION: `supabase functions deploy transcribe-audio`

### Task 2: Create Entity Extraction Edge Function
CREATE `supabase/functions/extract-work-order/index.ts`:

```typescript
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
      unit: extracted.unit || 'Unknown',
      building: extracted.building || 'Unknown',
      priority: extracted.priority || 'medium',
      category: extracted.category || 'general',
      description: extracted.description || transcription,
      urgencyIndicators: extracted.urgencyIndicators || [],
      confidence: extracted.unit !== 'Unknown' ? 0.8 : 0.5
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
```

VALIDATION: `supabase functions deploy extract-work-order`

### Task 3: Update voiceService.ts
MODIFY `src/services/voiceService.ts`:

```typescript
// REPLACE the mock implementations with:

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export async function transcribeAudio(audioUrl: string): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/transcribe-audio`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`
    },
    body: JSON.stringify({ audioUrl })
  })

  if (!response.ok) {
    throw new Error('Transcription failed')
  }

  const result = await response.json()
  return result.transcription
}

export async function extractWorkOrderData(transcription: string): Promise<ExtractedWorkOrder> {
  const { data: { session } } = await supabase.auth.getSession()
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/extract-work-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`
    },
    body: JSON.stringify({ transcription })
  })

  if (!response.ok) {
    throw new Error('Extraction failed')
  }

  return response.json()
}

// Add combined processing function
export async function processVoiceSubmission(submissionId: string): Promise<{
  transcription: string
  extracted: ExtractedWorkOrder
}> {
  // Get submission from DB
  const { data: submission } = await supabase
    .from('voice_submissions')
    .select('*')
    .eq('id', submissionId)
    .single()

  if (!submission?.audio_url) {
    throw new Error('Submission not found or missing audio')
  }

  // Step 1: Transcribe
  const transcription = await transcribeAudio(submission.audio_url)

  // Step 2: Extract entities
  const extracted = await extractWorkOrderData(transcription)

  // Step 3: Update submission record
  await supabase
    .from('voice_submissions')
    .update({
      transcription,
      extracted_data: extracted,
      status: 'processed',
      processed_at: new Date().toISOString()
    })
    .eq('id', submissionId)

  return { transcription, extracted }
}
```

VALIDATION: `npm run build` must pass

### Task 4: Update ExtractedWorkOrder Type
ADD to `src/services/voiceService.ts` or types file:

```typescript
export interface ExtractedWorkOrder {
  unit: string
  building: string
  priority: 'emergency' | 'high' | 'medium' | 'low'
  category: 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'general' | 'structural'
  description: string
  urgencyIndicators: string[]
  confidence: number
}
```

## Validation Checkpoints

### Checkpoint 1: Transcription Function
```bash
supabase functions deploy transcribe-audio

# Test with curl (use a real audio URL):
curl -X POST "[FUNCTION_URL]" \
  -H "Content-Type: application/json" \
  -d '{"audioUrl": "https://example.com/test-audio.mp3"}'

# Expected: {"transcription": "actual transcribed text", "language": "en"}
```

### Checkpoint 2: Extraction Function
```bash
supabase functions deploy extract-work-order

# Test:
curl -X POST "[FUNCTION_URL]" \
  -H "Content-Type: application/json" \
  -d '{"transcription": "Hi this is unit 205 we have a water leak under the kitchen sink its pretty bad"}'

# Expected: {"unit": "205", "priority": "medium", "category": "plumbing", ...}
```

### Checkpoint 3: End-to-End Flow
```bash
npm run dev
# Navigate to Voice Queue
# Process a pending voice submission
# Expected: Real transcription appears, extracted fields populated
```

### Checkpoint 4: Database Update
```sql
SELECT id, transcription, extracted_data, status 
FROM voice_submissions 
WHERE status = 'processed'
ORDER BY processed_at DESC 
LIMIT 3;

-- Expected: Real transcription and JSON extracted_data
```

## Anti-Patterns to Avoid
- ❌ Don't store audio files in database (use URLs to storage)
- ❌ Don't call Whisper API directly from frontend (use Edge Function)
- ❌ Don't trust extracted unit numbers without coordinator review
- ❌ Don't auto-create work orders without human confirmation
- ❌ Don't process audio files > 25MB (Whisper limit)

## Edge Cases to Handle
- Audio in Spanish → Whisper handles multi-language, extraction should still work
- Very short audio (< 1 second) → Return error, don't process
- No unit number mentioned → Set unit to "Unknown", require manual entry
- Multiple issues in one message → Extract the primary issue, note others in description

## Windsurf-Specific Notes
- Create both Edge Functions before modifying voiceService
- Use `@file:src/services/voiceService.ts` when updating the service
- Keep the existing function signatures - only replace implementations
- The `processVoiceSubmission` function is new - add it, don't replace existing exports

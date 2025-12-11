# PRP 10: AI Voice Processing

## Goal
Connect mocked voice transcription and entity extraction to real APIs.

## Pre-Check
```bash
grep -r "transcribeAudio\|extractWorkOrderData" src/services/voiceService
```

## Current State
- `transcribeAudio()` returns hardcoded "This is a mock transcription..."
- `extractWorkOrderData()` uses basic `if (text.includes('leak'))` matching
- No actual Whisper or LLM calls

## Fix

### 1. Create Edge Function `supabase/functions/transcribe-audio/index.ts`
- Accept: `{ audioUrl }`
- Fetch audio file from URL
- Call OpenAI Whisper API `/v1/audio/transcriptions`
- Return: `{ transcription, language }`

### 2. Create Edge Function `supabase/functions/extract-work-order/index.ts`
- Accept: `{ transcription }`
- Call OpenAI Chat API with extraction prompt
- Prompt should extract: unit, building, priority, category, description
- Priority rules from config_rules.json keywords
- Return structured JSON

### 3. Update `src/services/voiceService.ts`
- Replace `transcribeAudio()` with Edge Function call
- Replace `extractWorkOrderData()` with Edge Function call
- Add `processVoiceSubmission()` that chains both + updates DB

### 4. Set Supabase Secret
```bash
supabase secrets set OPENAI_API_KEY=sk-...
```

## Expected Output Structure
```typescript
interface ExtractedWorkOrder {
  unit: string           // e.g., "205" or "Unknown"
  building: string       // e.g., "Building A" or "Unknown"
  priority: 'emergency' | 'high' | 'medium' | 'low'
  category: 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'general'
  description: string    // Cleaned up description
  confidence: number     // 0-1
}
```

## Validation
```bash
supabase functions deploy transcribe-audio
supabase functions deploy extract-work-order
npm run build
# Manual: Go to Voice Queue
# Manual: Process a submission with real audio
# Manual: Verify transcription is real text (not mock string)
# Manual: Verify extracted fields populate form
```

## Error Handling
- Audio file >25MB: Reject with message (Whisper limit)
- No audio URL: Return error
- Transcription empty: Return error
- Extraction fails: Return transcription as description, set priority=medium

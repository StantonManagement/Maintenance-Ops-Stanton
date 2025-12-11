# PRP 09: AI Photo Analysis

## Goal
Connect mocked photo analysis to real Vision API via Edge Function.

## Pre-Check
```bash
grep -r "runAnalysis\|PhotoAnalysis" src/hooks/ src/services/
# Check if Edge Function exists
ls supabase/functions/analyze-photos/ 2>/dev/null
```

## Current State
- `usePhotoAnalysis.ts` has `runAnalysis()` that returns fake scores
- Simulates 2-second delay
- Returns score based on whether before/after photos exist (not actual analysis)

## Fix

### 1. Create Edge Function `supabase/functions/analyze-photos/index.ts`
- Accept: `{ workOrderId, photos: [{ url, type }] }`
- Call OpenAI Vision API (gpt-4o-mini with vision)
- Prompt: "Analyze maintenance before/after photos, return completion score 0-100"
- Parse JSON response
- Save result to `photo_analysis_results` table
- Return analysis to client

### 2. Update `src/hooks/usePhotoAnalysis.ts`
- Replace mock implementation with fetch to Edge Function
- Handle loading/error states
- Return structured result

### 3. Set Supabase Secret
```bash
supabase secrets set OPENAI_API_KEY=sk-...
```

## Edge Function Pattern
```typescript
// Key parts (not full code):
// 1. Accept POST with photos array
// 2. Build messages array with image_url content type
// 3. Call OpenAI /v1/chat/completions with gpt-4o-mini
// 4. Parse JSON from response (handle markdown code blocks)
// 5. Insert to photo_analysis_results
// 6. Return result with CORS headers
```

## Validation
```bash
supabase functions deploy analyze-photos
npm run build
# Manual: Go to Approval Queue, select work order with photos
# Manual: Click analyze, verify real AI response (not fake score)
# Manual: Check photo_analysis_results table has new row
```

## Error Handling
- If no OPENAI_API_KEY: return helpful error message
- If API timeout: retry once, then fail gracefully
- If parse error: return raw response with low confidence

# PRPs Execution Guide

## Overview
Three PRPs to complete the AI & Analytics features for Maintenance Ops Center.

| # | PRP | Effort | Dependencies |
|---|-----|--------|--------------|
| 1 | Analytics Enhancement | 2-3 hours | None (start here) |
| 2 | Photo Analysis | 3-4 hours | OpenAI API key |
| 3 | Voice Processing | 4-5 hours | OpenAI API key |

## Recommended Execution Order

### 1. Start with Analytics Enhancement
**Why first:** No external API dependencies, sets up foundational tables (`event_logs`, `reviews`) that other features will use for tracking.

**Files created/modified:**
- `supabase/migrations/` (SQL for new tables)
- `src/services/analyticsService.ts` (new)
- `src/hooks/useAnalytics.ts` (modified)
- `src/services/supabase.ts` (types added)

### 2. Then Photo Analysis
**Why second:** Simpler Edge Function pattern, good warmup before voice processing.

**Files created/modified:**
- `supabase/functions/analyze-photos/index.ts` (new)
- `src/hooks/usePhotoAnalysis.ts` (modified)

### 3. Finally Voice Processing
**Why last:** Most complex, two Edge Functions, involves file handling.

**Files created/modified:**
- `supabase/functions/transcribe-audio/index.ts` (new)
- `supabase/functions/extract-work-order/index.ts` (new)
- `src/services/voiceService.ts` (modified)

---

## Pre-Requisites Checklist

### Environment
- [ ] Supabase project with Edge Functions enabled
- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Logged into Supabase CLI (`supabase login`)
- [ ] OpenAI API key with access to:
  - [ ] Whisper API (for transcription)
  - [ ] GPT-4o-mini (for extraction and photo analysis)

### Supabase Secrets (Set Before Deploying Functions)
```bash
# Run in terminal or set via Supabase Dashboard > Edge Functions > Secrets
supabase secrets set OPENAI_API_KEY=sk-your-key-here
```

### Local Development
- [ ] `.env.local` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] Project builds successfully (`npm run build`)

---

## Windsurf Execution Tips

### For Each PRP:

1. **Load context first**
   ```
   @workspace load the PRP file and related existing files
   ```

2. **Create new files before modifying existing**
   - Edge Functions are standalone - create them first
   - Then update hooks/services to call them

3. **Run validations after each task**
   - Don't proceed to Task 2 until Task 1's validation passes
   - Windsurf can run terminal commands inline

4. **If something breaks**
   - Check Supabase Edge Function logs
   - Check browser console for CORS or auth errors
   - Verify secrets are set correctly

### Common Issues

| Issue | Likely Cause | Fix |
|-------|--------------|-----|
| 401 Unauthorized | Missing/wrong auth token | Check session handling |
| CORS error | Missing corsHeaders | Add cors handling to Edge Function |
| "Function not found" | Not deployed | Run `supabase functions deploy` |
| Timeout | File too large or API slow | Add timeout handling |

---

## Validation Summary

### Analytics Enhancement
```bash
# Tables exist
supabase db diff  # Should show event_logs, reviews

# Build passes
npm run build

# Dashboard shows calculated values
npm run dev  # Check Analytics page
```

### Photo Analysis
```bash
# Function deployed
supabase functions list  # Should show analyze-photos

# Build passes
npm run build

# Integration works
# Test via Approval Queue with real photos
```

### Voice Processing
```bash
# Functions deployed
supabase functions list  # Should show transcribe-audio, extract-work-order

# Build passes
npm run build

# Integration works
# Test via Voice Queue with real audio
```

---

## Success Criteria (All PRPs Complete)

- [ ] Analytics Dashboard shows real calculated metrics
- [ ] Photo Analysis returns AI-generated completion scores
- [ ] Voice submissions get real transcriptions
- [ ] Extracted work order data populates forms correctly
- [ ] All Edge Functions have < 30 second response times
- [ ] No console errors in production
- [ ] All mocked return values eliminated

---

## Files Reference

```
PRPs/
├── analytics-enhancement.md    # Start here
├── photo-analysis-integration.md
├── voice-processing-integration.md
└── execution-guide.md          # This file
```

---

## After Completion

Once all PRPs are implemented:

1. **Remove test data** - Delete seed data from SQL scripts
2. **Monitor costs** - Check OpenAI API usage dashboard
3. **Set up alerts** - Add error monitoring for Edge Functions
4. **Document** - Update project README with new capabilities

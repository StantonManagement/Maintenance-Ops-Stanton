# PRP-26: Wire Voice Queue to Work Orders

## Goal
Connect existing Voice Queue UI to create real work orders in Supabase when "Create Work Order" is clicked.

## Current State
- UI exists: VoiceQueuePage, VoiceWorkOrderDraft, ConfidenceIndicator
- Uses mock data
- "Create Work Order" doesn't persist
- "Discard" doesn't persist

## Success Criteria
- [ ] Voice submissions stored in Supabase table
- [ ] "Create Work Order" creates real WO in work_orders table
- [ ] New WO appears in main Work Order list
- [ ] "Discard" marks submission as discarded in DB
- [ ] Webhook endpoint ready for Telegram/Twilio (can test with manual POST)

---

## Tasks

### Task 1: Voice Submissions Table
Add to Supabase:
```sql
CREATE TABLE voice_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL, -- 'telegram', 'twilio', 'manual'
  audio_url TEXT,
  transcription TEXT,
  detected_language TEXT DEFAULT 'en',
  extracted_data JSONB, -- {property, unit, description, urgency, confidence}
  status TEXT DEFAULT 'pending', -- 'pending', 'created', 'discarded'
  work_order_id UUID REFERENCES work_orders(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);
```

### Task 2: Update useVoiceQueue Hook
MODIFY `src/hooks/useVoiceQueue.ts`:
- Fetch from voice_submissions table instead of mock
- Add createWorkOrder(submissionId) function:
  - Creates work_order from extracted_data
  - Updates voice_submission.status = 'created'
  - Updates voice_submission.work_order_id
  - Returns new work order
- Add discardSubmission(submissionId) function:
  - Updates voice_submission.status = 'discarded'

### Task 3: Update VoiceWorkOrderDraft Component
MODIFY `src/components/voice/VoiceWorkOrderDraft.tsx`:
- Replace mock handlers with hook functions
- On "Create Work Order": call createWorkOrder(), show success toast, navigate to WO
- On "Discard": call discardSubmission(), remove from list

### Task 4: Webhook Endpoint (API Route or Edge Function)
CREATE Supabase Edge Function or API endpoint:
- POST /api/voice-webhook
- Accepts: { source, audio_url, transcription } 
- Stores in voice_submissions
- For now, transcription passed in (Whisper integration later)
- Returns submission ID

### Task 5: Manual Test Flow
- Insert test voice_submission via Supabase dashboard
- Verify it appears in Voice Queue
- Click "Create Work Order"
- Verify WO appears in main list
- Verify voice_submission updated

---

## Validation Checkpoints
1. Voice submissions table exists
2. /voice-queue shows data from Supabase
3. "Create Work Order" → WO in work_orders table
4. New WO visible in /work-orders list
5. "Discard" → submission.status = 'discarded'

---

## Files to Modify
- src/hooks/useVoiceQueue.ts
- src/components/voice/VoiceWorkOrderDraft.tsx

## Files to Create
- Supabase migration for voice_submissions table
- supabase/functions/voice-webhook (or API route)

---

## Anti-Patterns
- ❌ Don't delete discarded submissions (keep for audit)
- ❌ Don't create WO without linking back to submission
- ❌ Don't lose extracted_data after WO creation

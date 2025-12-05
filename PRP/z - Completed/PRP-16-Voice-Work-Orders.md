# PRP-16: Voice Work Order Creation

## Goal
Enable work order creation via phone calls and Telegram voice notes. Speech-to-text with AI extraction of key details.

## Success Criteria
- [ ] Voice notes from Telegram processed into work orders
- [ ] Phone call recordings transcribed and parsed
- [ ] AI extracts: property, unit, issue description, urgency
- [ ] Coordinator reviews before finalizing
- [ ] Confidence score on extracted fields
- [ ] Fallback to manual entry if extraction fails

---

## Context

**Input sources:**
- Telegram voice notes (webhook)
- Phone call recordings (Twilio)
- Voicemail transcriptions

**Processing flow:**
Voice → Transcription → AI Entity Extraction → Draft Work Order → Coordinator Review → Finalize

---

## Tasks

### Task 1: Voice Webhook Handler
- Receive Telegram voice note webhooks
- Receive Twilio recording webhooks
- Store audio file temporarily
- Trigger transcription pipeline

### Task 2: Transcription Service
- Use Whisper API or similar
- Handle multiple languages
- Return text + detected language
- Store transcription with audio reference

### Task 3: AI Entity Extraction
- Parse transcription for: property/unit, issue type, urgency indicators
- Match property names to database
- Suggest priority based on keywords
- Return structured draft + confidence scores

### Task 4: Voice Work Order Queue
- New view: /voice-queue
- List of pending voice-created drafts
- Shows: transcription, extracted fields, confidence
- Edit any field before creating
- "Create Work Order" or "Discard" actions

### Task 5: Confidence Highlighting
- Low confidence fields highlighted yellow
- Very low confidence fields highlighted red
- Tooltip explains what AI detected vs guessed

### Task 6: Voice History Log
- All voice submissions logged
- Link to original audio
- Transcription text
- What work order was created (if any)

---

## Files to Create
- src/services/voiceService.ts
- src/hooks/useVoiceQueue.ts
- src/pages/VoiceQueuePage.tsx
- src/components/voice/VoiceWorkOrderDraft.tsx
- src/components/voice/ConfidenceIndicator.tsx

---

## Anti-Patterns
- ❌ Don't auto-create work orders without review
- ❌ Don't discard audio after transcription (keep for reference)
- ❌ Don't assume English only
- ❌ Don't block on transcription (async processing)

---

## Phase: 2

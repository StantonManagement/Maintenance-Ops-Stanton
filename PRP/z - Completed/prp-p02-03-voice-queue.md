# P02-03: Voice Queue

## Goal
Telegram voice notes → transcribed → coordinator reviews → creates work order

## Table

```sql
CREATE TABLE voice_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_message_id TEXT,
  audio_url TEXT,
  transcript TEXT,
  ai_extracted JSONB, -- {description, building, unit, priority, confidence}
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  rejection_reason TEXT,
  created_work_order_id UUID REFERENCES work_orders(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Files
- `src/hooks/useVoiceQueue.ts`
- `src/components/voice-queue/VoiceQueuePanel.tsx`
- `src/components/voice-queue/VoiceQueueItem.tsx`

## Tasks
1. Create table in Supabase
2. Hook: fetch pending items, approve mutation, reject mutation
3. Panel: list pending items with count badge
4. Item: show transcript, AI extraction, confidence badge, approve/reject buttons
5. Approve action: create work order from extracted data, update voice_queue status
6. Reject action: prompt for reason, update status

## Validation
- [ ] Empty state shows when no items
- [ ] Approve creates WO and removes from list
- [ ] Reject requires reason
- [ ] Confidence colors: green ≥85%, amber ≥60%, red <60%

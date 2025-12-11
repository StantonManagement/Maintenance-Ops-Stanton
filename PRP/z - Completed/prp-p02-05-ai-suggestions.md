# P02-05: AI Scheduling Suggestions

## Goal
AI recommends tech + time for unassigned WOs. Coordinator accepts or overrides.

## Table

```sql
CREATE TABLE ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES work_orders(id),
  suggested_tech_id UUID,
  suggested_time TIMESTAMPTZ,
  confidence DECIMAL,
  reasoning JSONB,
  alternatives JSONB,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Files
- `src/hooks/useAISuggestion.ts`
- `src/components/ai/AISuggestionBadge.tsx`
- `src/components/ai/AISuggestionPanel.tsx`

## Tasks
1. Create table
2. Hook: fetch suggestion for WO, accept mutation, reject mutation
3. Badge: small pill showing confidence %, click opens panel
4. Panel: show recommended tech, time, reasoning list, alternatives
5. Accept: update WO with assignment
6. Reject: prompt reason, mark suggestion rejected

## Validation
- [ ] Badge shows on WOs with pending suggestions
- [ ] Panel displays reasoning as bullet list
- [ ] Can select alternative instead of primary
- [ ] Accept assigns tech to WO

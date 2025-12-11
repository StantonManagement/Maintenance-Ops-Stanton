# P02-06: Photo Analysis

## Goal
AI analyzes before/after photos, scores completion, flags issues for review.

## Tables

```sql
CREATE TABLE work_order_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES work_orders(id),
  photo_type TEXT, -- before, after, cleanup
  url TEXT NOT NULL,
  gps_lat DECIMAL,
  gps_lng DECIMAL,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE photo_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES work_orders(id),
  completion_score DECIMAL,
  cleanup_score DECIMAL,
  overall_confidence DECIMAL,
  issues JSONB,
  recommendation TEXT, -- approve, review, reject
  recommendation_reasoning TEXT,
  analyzed_at TIMESTAMPTZ
);
```

## Files
- `src/hooks/usePhotoAnalysis.ts`
- `src/components/photos/PhotoAnalysisPanel.tsx`
- `src/components/photos/PhotoCompare.tsx`
- `src/components/photos/AnalysisScoreCard.tsx`

## Tasks
1. Create tables
2. Hook: fetch photos + analysis for WO
3. Panel: show in approval queue detail view
4. PhotoCompare: before/after side-by-side with navigation
5. ScoreCard: completion, cleanup, overall with color coding
6. Show issues as alert cards if any flagged

## Validation
- [ ] Photos grouped by type
- [ ] Before/after comparison navigable
- [ ] Scores show green/amber/red based on threshold
- [ ] Recommendation banner shows approve/review/reject

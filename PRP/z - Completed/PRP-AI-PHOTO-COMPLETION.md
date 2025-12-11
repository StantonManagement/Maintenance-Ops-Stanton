# PRP: AI Photo Analysis - Completion Verification

**Feature:** AI-powered photo review for work order completion  
**Priority:** High  
**Dependencies:** Photo upload infrastructure  

---

## Problem Statement

Kristine manually reviews every "Ready for Review" work order, checking before/after/cleanup photos to verify work was actually completed. This is time-consuming and inconsistent.

---

## What AI Evaluates

### 1. Photo Set Completeness
- Before photo(s) present
- After photo(s) present
- Cleanup photo(s) present
- Minimum 2 photos total (per config)

### 2. Before/After Comparison
- Same location shown (angle matching)
- Problem visible in "before"
- Problem resolved in "after"
- Work appears complete

### 3. Cleanup Verification
- No tools left in frame
- No debris or packaging visible
- Surfaces appear clean
- Furniture in normal position

### 4. Photo Quality
- Adequate lighting
- Subject in focus
- Problem area clearly visible
- Sufficient context shown

### 5. Location Verification
- GPS coordinates present in metadata
- Coordinates match assigned building (within 100ft)
- Timestamp within work window

---

## Confidence Thresholds (from config)

| Threshold | Action |
|-----------|--------|
| ≥98% | Auto-approve eligible |
| 90-97% | Recommend approve, Kristine confirms |
| <90% | Flag for detailed review |

**Note:** Auto-approve requires setting enabled (default off)

---

## Data Model

### New Table: `photo_analysis_results`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `work_order_id` | TEXT | FK to work order |
| `overall_confidence` | INTEGER | 0-100 |
| `recommendation` | TEXT | APPROVE / REVIEW / REJECT |
| `completeness_score` | INTEGER | Photo set complete? |
| `before_after_score` | INTEGER | Work visible? |
| `cleanup_score` | INTEGER | Area clean? |
| `quality_score` | INTEGER | Photos usable? |
| `location_score` | INTEGER | GPS verified? |
| `issues_found` | JSONB | Array of flagged issues |
| `ai_notes` | TEXT | Summary for coordinator |
| `analyzed_at` | TIMESTAMPTZ | When analyzed |

### New Table: `work_order_photos`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `work_order_id` | TEXT | FK to work order |
| `photo_type` | TEXT | before / after / cleanup / other |
| `storage_url` | TEXT | S3/Supabase storage URL |
| `thumbnail_url` | TEXT | Compressed preview |
| `gps_lat` | DECIMAL | Latitude from EXIF |
| `gps_lon` | DECIMAL | Longitude from EXIF |
| `captured_at` | TIMESTAMPTZ | From EXIF |
| `uploaded_at` | TIMESTAMPTZ | When uploaded |
| `uploaded_by` | UUID | Technician ID |

---

## AI Analysis Flow

### Trigger
Work order status changes to `ready_review`

### Process
1. Fetch all photos for work order
2. Validate photo set completeness
3. Send to vision AI for analysis
4. Score each category
5. Calculate overall confidence
6. Generate recommendation
7. Store results
8. Update approval queue display

---

## AI Prompt Structure

### Input

```
You are reviewing maintenance work order photos to verify job completion.

WORK ORDER CONTEXT:
- ID: {wo.id}
- Description: "{wo.description}"
- Category: {wo.category}
- Building: {wo.property_address}
- Unit: {wo.unit}

PHOTOS PROVIDED:
{for each photo}
- Type: {photo.type}
- Captured: {photo.captured_at}
- GPS: {photo.gps_lat}, {photo.gps_lon}
{end for}

EXPECTED BUILDING LOCATION:
- Lat: {building.lat}
- Lon: {building.lon}
- Acceptable radius: 100ft
```

### Instructions

```
Analyze these photos and evaluate:

1. COMPLETENESS (0-100):
   - Are before, after, and cleanup photos present?
   - Do photos cover the work described?

2. BEFORE/AFTER COMPARISON (0-100):
   - Do before/after show same location?
   - Is the problem visible in "before"?
   - Does "after" show problem resolved?
   - Does work appear complete?

3. CLEANUP (0-100):
   - Any tools visible in final photos?
   - Any debris, packaging, or materials left?
   - Does area appear clean and orderly?

4. PHOTO QUALITY (0-100):
   - Adequate lighting to see clearly?
   - Subject in focus?
   - Problem area clearly visible?

5. LOCATION (0-100):
   - Do GPS coordinates match expected building?
   - Are timestamps reasonable for work window?

For each category, note specific issues found.

Then provide:
- overall_confidence: 0-100 (weighted average)
- recommendation: "APPROVE" | "REVIEW" | "REJECT"
- summary: 2-3 sentences for coordinator
```

### Expected Output

```json
{
  "completeness_score": 100,
  "completeness_issues": [],
  
  "before_after_score": 95,
  "before_after_issues": ["Angle slightly different between shots"],
  
  "cleanup_score": 85,
  "cleanup_issues": ["Small amount of debris visible in corner"],
  
  "quality_score": 90,
  "quality_issues": ["Before photo slightly dark"],
  
  "location_score": 100,
  "location_issues": [],
  
  "overall_confidence": 92,
  "recommendation": "APPROVE",
  "summary": "Work appears complete. Faucet leak repair visible in before/after comparison. Minor debris in corner of cleanup photo but area is generally clean. Recommend approval."
}
```

---

## Coordinator Interface

### Approval Queue Card (Enhanced)

```
┌─────────────────────────────────────────────────────────────────┐
│  WO #1234 - Kitchen Faucet Leak          [AI: APPROVE ✓ 92%]   │
│  Building A, Unit 205 • Ramon • Completed 2:45 PM               │
│  ───────────────────────────────────────────────────────────────│
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │  BEFORE  │  │  AFTER   │  │ CLEANUP  │                      │
│  │  [img]   │  │  [img]   │  │  [img]   │                      │
│  └──────────┘  └──────────┘  └──────────┘                      │
│                                                                 │
│  AI Summary:                                                    │
│  "Work appears complete. Faucet leak repair visible. Minor      │
│   debris in cleanup photo but area generally clean."            │
│                                                                 │
│  ⚠️ Minor Issues:                                               │
│  • Small debris visible in corner (cleanup: 85%)                │
│                                                                 │
│  [✓ Approve]  [↩ Send Back]  [View Full Details]               │
└─────────────────────────────────────────────────────────────────┘
```

### Score Breakdown (Expandable)

```
Photo Analysis Breakdown:
├─ Completeness:  ████████████████████ 100%  ✓
├─ Before/After:  ███████████████████░  95%  ✓
├─ Cleanup:       █████████████████░░░  85%  ⚠️
├─ Quality:       ██████████████████░░  90%  ✓
└─ Location:      ████████████████████ 100%  ✓
                  ─────────────────────
                  Overall: 92% → APPROVE
```

### Issue Flags

| Score Range | Display |
|-------------|---------|
| 90-100% | Green checkmark |
| 75-89% | Yellow warning |
| <75% | Red flag |

---

## Rejection Scenarios

### Auto-Flag for Review (don't auto-approve)

- Missing required photo type
- GPS >100ft from building
- Cleanup score <80%
- Before/after don't match location
- Quality too poor to evaluate

### Recommend Reject

- No "after" photo showing completed work
- Problem still visible in "after" photo
- Significant debris/tools left behind
- Timestamp outside work window by >2 hours
- GPS at completely wrong location

---

## Validation Checkpoints

### Checkpoint 1: Data Model
- [ ] `photo_analysis_results` table created
- [ ] `work_order_photos` table created
- [ ] Indexes on `work_order_id`

### Checkpoint 2: Photo Upload
- [ ] Photos upload to storage
- [ ] EXIF data extracted (GPS, timestamp)
- [ ] Thumbnails generated
- [ ] Photos linked to work order

### Checkpoint 3: AI Integration
- [ ] Vision API configured
- [ ] Prompt returns expected format
- [ ] Results stored correctly
- [ ] Analysis completes <45 seconds

### Checkpoint 4: UI Display
- [ ] Approval queue shows AI recommendation
- [ ] Score breakdown visible
- [ ] Issues highlighted
- [ ] Photos display correctly

---

## Performance Target

- Analysis time: <45 seconds (per config)
- Accuracy: >95% agreement with Kristine's decisions
- False approve rate: <2% (AI approves, shouldn't have)
- False reject rate: <10% (AI rejects, was actually fine)

---

## Future Enhancements

- Learn from Kristine's overrides (improve model)
- Compare to historical photos of same unit
- Detect safety hazards in photos
- OCR for any visible labels/serial numbers
- Before/after slider view in UI

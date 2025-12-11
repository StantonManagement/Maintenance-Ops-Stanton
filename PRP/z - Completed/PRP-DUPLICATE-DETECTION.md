# PRP: Duplicate Work Order Detection & Merge

**Feature:** Prevent and consolidate duplicate work orders  
**Priority:** High  
**Dependencies:** None  

---

## Problem Statement

Tenants create duplicate work orders by submitting requests through multiple channels (phone, SMS, AppFolio portal). This creates coordinator overhead and confusion about which request is authoritative.

---

## Solution Overview

1. **Prevention** - Show tenants their open WOs before creating new ones
2. **Detection** - Flag likely duplicates for coordinator review
3. **Merge** - Consolidate duplicates while preserving context
4. **Automation** - Enable auto-merge once trust is established

---

## Data Model Changes

### New Table: `duplicate_candidates`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `primary_wo_id` | TEXT | Older work order (survives merge) |
| `duplicate_wo_id` | TEXT | Newer work order (merges into primary) |
| `confidence_score` | DECIMAL(3,2) | 0.00-1.00 match confidence |
| `detection_reason` | TEXT | Human-readable explanation |
| `status` | TEXT | pending / approved / rejected / auto_merged |
| `reviewed_by` | UUID | FK to auth.users |
| `reviewed_at` | TIMESTAMPTZ | When action taken |
| `created_at` | TIMESTAMPTZ | Default now() |

**Indexes:**
- `status` (for queue filtering)
- `primary_wo_id`, `duplicate_wo_id` (for lookups)

---

### New Table: `work_order_merge_history`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `primary_wo_id` | TEXT | Surviving work order |
| `merged_wo_id` | TEXT | Work order that was absorbed |
| `merged_description` | TEXT | Preserved description |
| `merged_photos` | JSONB | Preserved attachments array |
| `merged_at` | TIMESTAMPTZ | Default now() |
| `merged_by` | UUID | FK to auth.users (null if auto) |

---

### Modify Table: `AF_work_order_new`

| New Column | Type | Purpose |
|------------|------|---------|
| `is_merged` | BOOLEAN | Default false, true if absorbed |
| `merged_into_wo_id` | TEXT | Points to primary WO if merged |

---

## Detection Logic

### Trigger Points
- New work order webhook from AppFolio
- New SMS request processed
- New voice request transcribed
- Tenant portal submission

### Duplicate Criteria (ALL must match)

1. **Same source:** Matching `resident_name` OR same `unit`
2. **Time window:** New WO created within 48 hours of existing OPEN WO
3. **Content match (any one):**
   - Description similarity >70% (use pg_trgm or semantic embedding)
   - Same issue category
   - Key phrase overlap (e.g., "faucet leak" appears in both)

### Confidence Scoring

| Scenario | Score |
|----------|-------|
| Same unit + same day + similar description | 0.95 |
| Same unit + within 48hrs + similar description | 0.85 |
| Same tenant + similar description + 48hrs | 0.80 |
| Same unit + within 48hrs + different description | 0.60 |

### Detection Output

Insert row into `duplicate_candidates`:
- `primary_wo_id` = older work order
- `duplicate_wo_id` = newer work order
- `confidence_score` = calculated score
- `detection_reason` = "Same unit (A-205), similar description ('kitchen faucet'), created 3 hours apart"
- `status` = 'pending'

---

## Merge Rules

### What Gets Preserved
- Primary WO: ID, title, original description, timestamps, assignment
- From duplicate: Description appended as note, photos added to gallery

### What Gets Updated
- Merged WO: `is_merged` = true, `merged_into_wo_id` = primary WO ID
- Merged WO: `status` = 'merged' (new status value)

### Merge Window
Tenants can only add context to work orders in these statuses:
- `new`
- `scheduled`

Once status = `in_progress` or later, WO is locked from tenant edits.

---

## Coordinator Interface

### Duplicate Queue View

**Location:** New tab in Work Orders view OR badge on sidebar

**Queue Display:**
- Card showing both WOs side-by-side
- Confidence score with color indicator (green >0.85, yellow 0.70-0.85, red <0.70)
- Detection reason text
- Time since flagged

**Actions per item:**
- **Merge** - Combine into primary WO
- **Not Duplicate** - Dismiss, keep both separate
- **View Details** - Expand to see full WO contents

**Bulk Actions:**
- Select multiple pending duplicates
- "Merge All Selected" button
- "Dismiss All Selected" button

---

### Auto-Merge Configuration

**Location:** Settings > Work Order Rules

**Options:**
- Toggle: "Enable auto-merge for high-confidence duplicates"
- Threshold slider: Minimum confidence for auto-merge (default 0.90)
- Checkbox: "Notify me when auto-merge occurs"

**When enabled:**
- Duplicates with score >= threshold merge automatically
- Entry created in `work_order_merge_history` with `merged_by` = null
- Coordinator notified via toast/badge

---

## Tenant Portal Changes

### Before Creating New Request

**Flow:**
1. Tenant clicks "New Request"
2. System checks for open WOs for their unit
3. If open WOs exist, show modal:

```
You have an open maintenance request:

[WO #1234] Kitchen faucet leaking
Status: Scheduled for Thursday, Dec 12

Is your new request about this same issue?

[Yes, add to existing]    [No, different issue]
```

4. "Yes" → Opens note/photo addition form for existing WO
5. "No" → Proceeds to new request form

### Adding Context to Existing WO

**Allowed actions:**
- Add text note (appended with timestamp)
- Upload additional photos
- Update availability/access info

**Not allowed:**
- Change description
- Change priority
- Add unrelated issues

---

## Hooks & Services

### New Hook: `useDuplicateCandidates`

**Returns:**
- `candidates` - Array of pending duplicate pairs
- `loading`, `error` - Standard states
- `mergeCandidate(id)` - Approve and merge
- `dismissCandidate(id)` - Mark as not duplicate
- `bulkMerge(ids[])` - Merge multiple
- `bulkDismiss(ids[])` - Dismiss multiple

### New Hook: `useDuplicateDetection`

**Used by:** Work order creation flows

**Method:** `checkForDuplicates(newWO)`
- Input: New work order data (unit, tenant, description)
- Output: Array of potential matches with scores
- Side effect: Creates `duplicate_candidates` row if match found

### Modify: `useWorkOrders`

**Add:**
- Filter option: `excludeMerged: boolean` (default true)
- Field in WO type: `mergedNotes` - array of merged descriptions

---

## Database Functions

### `detect_duplicate_work_order(new_wo_id TEXT)`

**Trigger:** After insert on work orders (via webhook handler)

**Logic:**
1. Get new WO details (unit, tenant, description, created_at)
2. Query open WOs for same unit/tenant in last 48 hours
3. For each match, calculate similarity score
4. If score > 0.60, insert into `duplicate_candidates`
5. Return number of duplicates found

### `merge_work_orders(primary_id TEXT, duplicate_id TEXT, merged_by UUID)`

**Called by:** Coordinator action or auto-merge

**Logic:**
1. Validate both WOs exist
2. Validate duplicate WO status allows merge
3. Insert into `work_order_merge_history`
4. Update duplicate WO: `is_merged` = true, `merged_into_wo_id` = primary
5. Append duplicate description to primary as note
6. Update `duplicate_candidates` status = 'approved'
7. Return success/failure

### `get_tenant_open_work_orders(unit TEXT)`

**Called by:** Tenant portal before new request

**Returns:** Array of open WOs for that unit with basic details

---

## UI Components

### `DuplicateQueueView`
- Fetches from `useDuplicateCandidates`
- Renders list of `DuplicatePairCard` components
- Bulk action toolbar at top

### `DuplicatePairCard`
- Side-by-side WO summaries
- Confidence badge
- Detection reason
- Merge / Dismiss buttons

### `DuplicateBadge`
- Shows in sidebar next to Work Orders
- Count of pending duplicates
- Red if any >24 hours old

### `TenantOpenWorkOrdersModal`
- Shown in portal before new request
- Lists open WOs with "Add to this" option

---

## Validation Checkpoints

### Checkpoint 1: Schema
- [ ] `duplicate_candidates` table created
- [ ] `work_order_merge_history` table created
- [ ] `AF_work_order_new` columns added
- [ ] Indexes created

### Checkpoint 2: Detection
- [ ] Creating WO for same unit within 48hrs flags duplicate
- [ ] Confidence score calculated correctly
- [ ] Entry appears in duplicate_candidates

### Checkpoint 3: Coordinator Flow
- [ ] Queue view shows pending duplicates
- [ ] Merge action consolidates WOs correctly
- [ ] Dismiss action clears from queue
- [ ] Bulk actions work

### Checkpoint 4: Tenant Portal
- [ ] Open WOs shown before new request
- [ ] Can add note to existing WO
- [ ] Cannot add to in_progress WO

### Checkpoint 5: Auto-Merge
- [ ] Setting toggles correctly
- [ ] High-confidence duplicates auto-merge when enabled
- [ ] Notification sent to coordinator

---

## Success Metrics

- Duplicate detection rate: >90% of true duplicates caught
- False positive rate: <10% of flagged pairs are not duplicates
- Coordinator time: <30 seconds to process duplicate queue daily
- Auto-merge accuracy: >95% (before enabling)

---

## Future Enhancements

- ML-based description similarity (beyond text matching)
- Cross-unit duplicate detection (same issue, multiple units = building problem)
- Tenant notification when their duplicate is merged
- Analytics on duplicate sources (which channel creates most dupes)

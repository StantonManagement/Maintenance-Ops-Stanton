# PRP-IWO-01: Database Schema

## Goal
Add tables and fields to track incomplete work order reasons, parts ETAs, and reschedule history.

## Success Criteria
- [ ] Can store reason why WO wasn't completed
- [ ] Can store expected parts arrival date
- [ ] Can store voice note transcription
- [ ] Can query "incomplete from yesterday" per technician
- [ ] Full audit trail of reschedule events

---

## New Table: `incomplete_wo_reasons`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| assignment_id | UUID | FK → work_order_assignments |
| reason_code | TEXT | See enum below |
| parts_expected_date | DATE | Nullable, only for parts_needed |
| notes | TEXT | Tech explanation |
| voice_note_url | TEXT | S3/storage link |
| voice_transcription | TEXT | AI transcription |
| created_at | TIMESTAMPTZ | When submitted |
| created_by | UUID | FK → technicians |

### Reason Codes Enum
```
parts_needed
access_issue
ran_out_of_time
additional_issues_found
other
```

---

## New Table: `reschedule_events`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| assignment_id | UUID | FK → work_order_assignments |
| reason_id | UUID | FK → incomplete_wo_reasons |
| previous_date | DATE | Original scheduled date |
| new_date | DATE | Rescheduled to |
| rescheduled_by | TEXT | 'system' or 'coordinator' |
| coordinator_id | UUID | Nullable, if manual |
| created_at | TIMESTAMPTZ | |

---

## Modify: `work_order_assignments`

Add columns:
| Column | Type | Notes |
|--------|------|-------|
| requires_accountability | BOOLEAN | Default false, set true at EOD |
| accountability_completed | BOOLEAN | Default false |
| accountability_completed_at | TIMESTAMPTZ | When tech submitted reason |

---

## New View: `v_pending_accountability`

Returns assignments where:
- `scheduled_date` < today
- `status` NOT IN ('completed', 'cancelled')
- `accountability_completed` = false

Grouped by technician_id for morning gate query.

---

## RPC Function: `get_tech_pending_accountability(tech_id UUID)`

Returns all incomplete assignments for a technician that need reasons.

## RPC Function: `submit_accountability(assignment_id, reason_code, notes, parts_date, voice_url)`

- Inserts into `incomplete_wo_reasons`
- Updates assignment `accountability_completed = true`
- Returns the new reason record

---

## Implementation Tasks

### Task 1: Create tables
- Run SQL to create `incomplete_wo_reasons`
- Run SQL to create `reschedule_events`
- Add columns to `work_order_assignments`

### Task 2: Create view
- Create `v_pending_accountability` view

### Task 3: Create RPC functions
- `get_tech_pending_accountability`
- `submit_accountability`

### Task 4: Add RLS policies
- Techs can only see/submit their own accountability
- Coordinators can view all

---

## Validation
```sql
-- Should return empty initially
SELECT * FROM v_pending_accountability;

-- Test RPC
SELECT get_tech_pending_accountability('tech-uuid-here');
```

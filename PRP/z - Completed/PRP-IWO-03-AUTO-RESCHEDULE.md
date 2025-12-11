# PRP-IWO-03: Auto-Reschedule Logic

## Goal
Implement logic that suggests and executes automatic rescheduling for normal/medium/low priority work orders, while routing high/emergency to coordinator queue.

## Dependencies
- PRP-IWO-01 (database schema)

## Success Criteria
- [ ] System suggests next available slot based on reason
- [ ] Parts-needed respects expected arrival date
- [ ] High/Emergency priority never auto-reschedules
- [ ] Tech can confirm or adjust suggested date
- [ ] Reschedule event logged with full context

---

## Routing Rules

| Priority | Auto-Reschedule? | Route To |
|----------|------------------|----------|
| Emergency | ❌ No | Kristine's queue |
| High | ❌ No | Kristine's queue |
| Medium | ✅ Yes | Tech confirms |
| Normal | ✅ Yes | Tech confirms |
| Low | ✅ Yes | Tech confirms |

---

## Scheduling Logic by Reason

### `parts_needed`
- Use `parts_expected_date` as earliest possible
- Find tech's next available slot ON or AFTER that date
- Slot = first day with capacity < 6

### `access_issue`
- Triggers existing tenant access escalation flow
- Suggest 3 business days out (gives time for contact)
- Flag for follow-up

### `ran_out_of_time`
- Suggest next business day
- Same tech, similar time slot if available

### `additional_issues_found`
- Requires scope review
- Route to coordinator regardless of priority
- Include tech's notes prominently

### `other`
- Suggest next available slot
- Flag for coordinator visibility (even if auto-scheduled)

---

## New Hook: `useAutoReschedule`

```typescript
interface RescheduleInput {
  assignmentId: string;
  reasonCode: ReasonCode;
  partsExpectedDate?: Date;
  notes?: string;
}

interface RescheduleSuggestion {
  suggestedDate: Date;
  suggestedTimeStart: string;
  technicianId: string;
  canAutoSchedule: boolean;  // false for high/emergency
  requiresCoordinatorReview: boolean;
  reasoning: string;
}
```

**Hook returns:**
- `getSuggestion(input)` → RescheduleSuggestion
- `confirmReschedule(assignmentId, date)` → void
- `routeToCoordinator(assignmentId, reasonId)` → void

---

## RPC Function: `suggest_reschedule_date`

Input: assignment_id, reason_code, parts_expected_date
Output: suggested_date, suggested_time, can_auto_schedule, reasoning

Logic:
1. Load assignment + work order priority
2. If priority IN ('emergency', 'high') → can_auto_schedule = false
3. If reason = 'additional_issues_found' → can_auto_schedule = false
4. Else calculate next available based on reason rules
5. Return suggestion

---

## RPC Function: `execute_reschedule`

Input: assignment_id, new_date, new_time, reason_id, rescheduled_by
Actions:
1. Update assignment scheduled_date/time
2. Insert into reschedule_events
3. If rescheduled_by = 'system', log as auto
4. Return updated assignment

---

## Implementation Tasks

### Task 1: Create suggestion RPC
- Implement `suggest_reschedule_date` with priority routing
- Include capacity check for suggested date

### Task 2: Create execution RPC  
- Implement `execute_reschedule`
- Ensure reschedule_events audit entry

### Task 3: Create React hook
- `useAutoReschedule` wrapping the RPCs
- Handle loading/error states

### Task 4: Add to accountability flow
- After tech submits reason, call getSuggestion
- Display suggestion in UI
- Confirm or route based on canAutoSchedule

---

## Validation

```sql
-- Test suggestion for normal priority, parts needed
SELECT suggest_reschedule_date(
  'assignment-uuid',
  'parts_needed',
  '2024-12-15'::date
);

-- Should return date >= Dec 15 with available capacity
```

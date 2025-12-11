# PRP: In Progress Status Implementation

**Feature:** Proper implementation of "In Progress" work order status  
**Priority:** High  
**Dependencies:** None  

---

## Problem Statement

The status workflow includes `in_progress` in config, but it may not be fully wired up in the UI and business logic. Coordinators need clear visibility into which jobs are actively being worked vs. just scheduled.

---

## Current State Audit

### Check These Files

**Config:** `config_rules.json`
- Status workflow already defines: `new → scheduled → in_progress → ready_review → completed`
- Verify transitions include in_progress

**Types:** `src/types/index.ts`
- Confirm `WorkOrderStatus` type includes 'in_progress'
- If using union type, ensure it's listed

**Database:** `AF_work_order_new` table
- Confirm `status` column accepts 'in_progress' value
- Check any constraints or enums

**UI Components:**
- `WorkOrderList.tsx` - Does filter include in_progress?
- `WorkOrderDetailView.tsx` - Can status be changed to in_progress?
- `StatusBadge` component - Does it render in_progress correctly?

---

## Required Status Flow

### Valid Transitions

| From | To | Who Can Trigger |
|------|----|-----------------|
| new | scheduled | Coordinator (on assignment) |
| scheduled | in_progress | Technician (on arrival/start) |
| in_progress | waiting_parts | Technician |
| in_progress | waiting_access | Technician |
| in_progress | ready_review | Technician (on completion) |
| waiting_parts | in_progress | System (parts arrived) or Tech |
| waiting_access | scheduled | System (tenant responds) |
| ready_review | completed | Coordinator only |
| ready_review | in_progress | Coordinator (reject/rework) |

### Status Definitions

| Status | Meaning | Color |
|--------|---------|-------|
| new | Just created, unassigned | Gray |
| scheduled | Assigned, appointment set | Blue |
| **in_progress** | **Tech actively working** | **Yellow/Amber** |
| waiting_parts | Paused for parts | Orange |
| waiting_access | Paused for tenant access | Orange |
| ready_review | Tech done, awaiting approval | Purple |
| completed | Coordinator approved | Green |
| cancelled | Cancelled | Red |
| merged | Merged into another WO | Gray (hidden) |

---

## Implementation Tasks

### Task 1: Type Verification

**File:** `src/types/index.ts`

Ensure WorkOrderStatus includes:
```typescript
type WorkOrderStatus = 
  | 'new'
  | 'scheduled'
  | 'in_progress'
  | 'waiting_parts'
  | 'waiting_access'
  | 'ready_review'
  | 'completed'
  | 'cancelled'
  | 'merged';
```

---

### Task 2: Status Badge Component

**File:** `src/components/StatusBadge.tsx` (or equivalent)

Add in_progress variant:
- Label: "In Progress"
- Color: Amber/Yellow background
- Icon: Wrench or activity spinner (optional)

---

### Task 3: Filter Options

**File:** `src/components/WorkOrderList.tsx`

Status filter dropdown should include:
- All Statuses
- New
- Scheduled
- **In Progress** ← Ensure this exists
- Waiting (Parts/Access)
- Ready for Review
- Completed

---

### Task 4: Status Change Actions

**File:** `src/components/WorkOrderDetailView.tsx`

**For Coordinator:**
- When viewing `scheduled` WO: No direct change to in_progress (tech triggers this)
- When viewing `in_progress` WO: Can see who's working, ETA
- When viewing `ready_review`: Approve or Send Back (→ in_progress)

**For Technician (if tech-facing UI exists):**
- "Start Work" button on scheduled WO → changes to in_progress
- "Mark Complete" button on in_progress → changes to ready_review
- "Need Parts" button → changes to waiting_parts
- "Access Issue" button → changes to waiting_access

---

### Task 5: Dispatch Board Updates

**File:** `src/components/DispatchInterface.tsx`

Visual indicators for in_progress:
- WO cards in tech columns show status badge
- In_progress cards have distinct styling (amber border or background)
- Optional: pulsing indicator for active work

---

### Task 6: Today's Schedule View

**File:** Wherever today's schedule is rendered

Group or highlight by status:
- In Progress (top, most prominent)
- Scheduled (upcoming)
- Waiting (flagged for attention)
- Completed today (dimmed)

---

### Task 7: Dashboard Metrics

**File:** `src/components/analytics/` or dashboard

Add "Currently In Progress" metric:
- Count of WOs with status = 'in_progress'
- Which techs are actively working
- Time in current status (highlight if >4 hours)

---

## Database Considerations

### Status Transition Validation

Create or update RPC function: `update_work_order_status(wo_id, new_status, changed_by)`

**Logic:**
1. Get current status
2. Validate transition is allowed (use transition matrix)
3. If valid, update status and log to audit
4. If invalid, return error

### Audit Trail

Each status change should log:
- `work_order_id`
- `previous_status`
- `new_status`
- `changed_by` (user ID)
- `changed_at` (timestamp)
- `reason` (optional, for rejections)

---

## Technician Trigger Points

How does a WO move to in_progress? Options:

**Option A: Manual Button**
- Tech opens assigned WO
- Clicks "Start Work" button
- Status changes, timestamp recorded

**Option B: Check-in Action**
- Tech clicks "I'm Here" or checks in
- System verifies location (if GPS enabled)
- Status auto-changes to in_progress

**Option C: First Activity**
- Tech uploads first photo or adds note
- System infers work has started
- Status auto-changes

**Recommendation:** Option A (explicit) for Phase 1, add Option B later

---

## Validation Checkpoints

### Checkpoint 1: Types & Config
- [ ] WorkOrderStatus type includes 'in_progress'
- [ ] config_rules.json has correct transitions
- [ ] Database accepts 'in_progress' value

### Checkpoint 2: UI Display
- [ ] StatusBadge renders in_progress correctly
- [ ] Filter dropdown includes In Progress option
- [ ] Filtering by in_progress returns correct results

### Checkpoint 3: Status Changes
- [ ] scheduled → in_progress transition works
- [ ] in_progress → ready_review transition works
- [ ] in_progress → waiting_parts transition works
- [ ] Invalid transitions are blocked

### Checkpoint 4: Visibility
- [ ] Dispatch board shows in_progress indicator
- [ ] Today's schedule highlights active work
- [ ] Dashboard shows "in progress" count

---

## UI Mockup Reference

### Status Badge Variants

```
[● New]           - Gray background, dark text
[● Scheduled]     - Blue background, white text
[● In Progress]   - Amber background, dark text  ← ADD THIS
[● Waiting]       - Orange background, dark text
[● Ready Review]  - Purple background, white text
[● Completed]     - Green background, white text
```

### Work Order Card (in Dispatch)

```
┌─────────────────────────────────┐
│ WO #1234                [Amber] │  ← In Progress badge
│ Kitchen faucet leak      ●Live  │  ← Optional live indicator
│ Building A, Unit 205            │
│ Started: 10:32 AM (1h 23m ago)  │  ← Time in status
└─────────────────────────────────┘
```

### Today's Schedule Grouping

```
IN PROGRESS (2)
├─ WO #1234 - Ramon - Kitchen faucet (1h 23m)
└─ WO #1235 - Kishan - HVAC filter (45m)

SCHEDULED (5)
├─ WO #1236 - Ramon - 2:00 PM
├─ WO #1237 - Ramon - 3:30 PM
└─ ...

WAITING (1)
└─ WO #1240 - Parts on order (ETA Friday)
```

---

## Success Criteria

- [ ] In Progress status visible in all relevant UI areas
- [ ] Coordinators can see at-a-glance which jobs are active
- [ ] Status transitions follow defined rules
- [ ] Audit trail captures all status changes
- [ ] No orphaned WOs stuck in wrong status

---

## Future Enhancements

- GPS-triggered status change (arrive at building → in_progress)
- Time tracking per status (how long in each phase)
- Alerts for long-running in_progress jobs (>4 hours)
- Tech mobile app with one-tap status updates

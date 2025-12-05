# PRP-11: Workload Protection (Phase 2)

## Goal
Implement safeguards to prevent technician overload and ensure coordinator visibility when overrides happen.

## Success Criteria
- [ ] Hard limit: Cannot assign more than 6 WO/day without override
- [ ] Soft warning at 5 WO/day
- [ ] Emergency override requires reason
- [ ] Dean/manager override triggers coordinator notification
- [ ] Dashboard shows overloaded technicians
- [ ] Historical tracking of overrides

---

## Context

**Business rules from docs:**
- Max 6 work orders per technician per day
- Max 3 concurrent active work orders
- Emergency can override capacity
- Coordinator MUST be notified of overrides

**The "Keyshawn Test":** System must allow legitimate pauses (waiting_parts, etc.) without counting against capacity

---

## Tasks

### Task 1: Capacity Check Hook
CREATE `src/hooks/useCapacityCheck.ts`

**IMPORTANT: Function signature must be:**
```typescript
const checkCapacity = async (technicianId: string, targetDate?: Date): Promise<CapacityCheckResult>
```

**NOT:** `checkCapacity(technician: Technician)` - pass ID, not object!

- Input: technician_id (string), optional date
- Returns: { current, max, status, canAssign, requiresOverride, message? }
- Uses Supabase RPC `check_technician_capacity`
- Excludes: waiting_parts, waiting_dry, completed statuses from count
- Only counts active work for the day
- Is ASYNC - must be awaited!

### Task 2: Assignment Capacity Gate
MODIFY assignment flow (calendar, dispatch, detail panel)

**CRITICAL: checkCapacity is async - must await it:**
```typescript
// CORRECT:
const capacity = await checkCapacity(tech.id);

// WRONG - will cause TypeScript errors:
const capacity = checkCapacity(tech);  // Missing await, wrong argument type
```

- Before assigning, check capacity
- If under 5: Allow
- If 5: Show warning, allow
- If 6+: Block unless override checkbox + reason

### Task 3: Override Modal
CREATE `src/components/dispatch/CapacityOverrideModal.tsx`
- "This technician is at capacity"
- Shows current workload
- "Override and assign anyway" checkbox
- Required: Reason dropdown + notes
- Reasons: Emergency, Turnover, Manager request, Other
- Records override in database

### Task 4: Override Notification System
CREATE `src/hooks/useOverrideNotification.ts`
- When override recorded, trigger notification
- Creates notification record
- Targets: coordinator(s)
- Shows in notification bell + toast

### Task 5: Overloaded Technicians Widget
CREATE `src/components/dispatch/OverloadedTechsWidget.tsx`
- Shows on dispatch page
- Lists technicians currently over capacity
- Shows who overrode and why
- Quick link to reassign work

### Task 6: Capacity Visualization Enhancement
MODIFY `src/components/dispatch/CapacityRing.tsx`
- Add pulsing animation when at/over capacity
- Tooltip shows breakdown: active, waiting, completed
- Click expands to show individual WOs

### Task 7: Override History Log
CREATE `src/pages/OverrideHistoryPage.tsx`
- Table of all overrides
- Columns: date, technician, work order, overridden by, reason
- Filter by date range, technician
- Export to CSV

---

## Validation Checkpoints

1. Try assign to tech with 6 WOs - blocked
2. Check override box, enter reason - allowed
3. Coordinator receives notification
4. Override appears in history log
5. Overloaded widget shows the technician

---

## Files to Create
- src/hooks/useCapacityCheck.ts
- src/components/dispatch/CapacityOverrideModal.tsx
- src/hooks/useOverrideNotification.ts
- src/components/dispatch/OverloadedTechsWidget.tsx
- src/pages/OverrideHistoryPage.tsx

## Files to Modify
- src/components/dispatch/CapacityRing.tsx
- Calendar and Dispatch assignment flows

---

## Anti-Patterns
- ❌ Don't hard-block without override option
- ❌ Don't allow override without reason
- ❌ Don't skip coordinator notification
- ❌ Don't count waiting_parts against capacity

---

## Phase 2 Complete
After PRP-11, Phase 2 core features are complete.

## Next Phase
PRP-12 begins Phase 3: Analytics & Intelligence

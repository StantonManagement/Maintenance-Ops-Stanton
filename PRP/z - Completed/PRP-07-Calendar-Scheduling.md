# PRP-07: Calendar & Scheduling (Phase 2)

## Goal
Build the visual calendar for scheduling work orders to technicians. Drag-and-drop interface for assignment.

## Success Criteria
- [ ] Week view showing all technicians as rows
- [ ] Time slots as columns (hourly or half-hour)
- [ ] Existing scheduled work orders appear as blocks
- [ ] Unscheduled work orders in sidebar
- [ ] Drag work order to calendar slot to schedule
- [ ] Drag between slots to reschedule
- [ ] Capacity warnings when over daily limit
- [ ] Conflict detection (double-booking)

---

## Context

**Dependencies:** 
- react-big-calendar OR @fullcalendar/react
- dnd-kit for drag-and-drop

**Data:**
- Technicians (rows)
- Work orders with scheduled_date/time (blocks)
- Work orders without schedule (sidebar queue)

**Business rules:**
- Max 6 work orders per tech per day
- Emergency can override capacity
- Only coordinator can schedule

---

## Tasks

### Task 1: Calendar Page
CREATE `src/pages/CalendarPage.tsx`
- Remove Phase lock overlay
- Layout: Unscheduled sidebar (300px) | Calendar (flex)
- Date navigation: Today, prev/next week
- View toggle: Day, Week (default), Month

### Task 2: Calendar Grid Component
CREATE `src/components/calendar/ScheduleCalendar.tsx`
- Rows = technicians
- Columns = time slots
- Renders scheduled work order blocks
- Drop zones for each slot
- Current time indicator line

**IMPORTANT: react-big-calendar resource accessors must be functions:**
```typescript
// CORRECT:
resourceIdAccessor={(resource: any) => resource.id}
resourceTitleAccessor={(resource: any) => resource.title}

// WRONG (TypeScript error):
resourceIdAccessor="id"
resourceTitleAccessor="title"
```

### Task 3: Technician Row
CREATE `src/components/calendar/TechnicianRow.tsx`
- Tech name + avatar
- Daily capacity indicator (3/6 jobs)
- Status indicator (available, busy, off)
- Skills badges (plumbing, electrical, etc.)

### Task 4: Scheduled Work Order Block
CREATE `src/components/calendar/ScheduledBlock.tsx`
- Displays in calendar slot
- Shows: WO ID, description snippet, duration
- Color = priority
- Draggable for rescheduling
- Click opens detail panel
- Resize handles for duration adjustment

### Task 5: Unscheduled Queue
CREATE `src/components/calendar/UnscheduledQueue.tsx`
- List of work orders without scheduled_date
- Sorted by priority then created_at
- Each item is draggable
- Filter by priority
- Shows estimated duration

### Task 6: Drop Zone Logic
CREATE `src/hooks/useCalendarDrop.ts`
- Validates drop target
- Checks technician capacity
- Checks skill match
- Checks tenant availability (if known)
- Returns: canDrop, warnings[], conflicts[]

### Task 7: Scheduling Confirmation Modal
CREATE `src/components/calendar/ScheduleConfirmModal.tsx`
- Shows: work order, technician, proposed time
- Warnings if any (capacity, skills mismatch)
- Confirm or Cancel
- On confirm: updates work order in Supabase

---

## Validation Checkpoints

1. Navigate to `/calendar` - grid renders with technicians
2. Drag work order to slot - confirmation modal appears
3. Confirm - work order appears in calendar
4. Drag to full-capacity tech - warning shown
5. Drag scheduled block to new slot - reschedules

---

## Files to Create
- src/pages/CalendarPage.tsx
- src/components/calendar/ScheduleCalendar.tsx
- src/components/calendar/TechnicianRow.tsx
- src/components/calendar/ScheduledBlock.tsx
- src/components/calendar/UnscheduledQueue.tsx
- src/components/calendar/ScheduleConfirmModal.tsx
- src/hooks/useCalendarDrop.ts

---

## Anti-Patterns
- ❌ Don't allow drop without confirmation
- ❌ Don't ignore capacity limits (warn, don't block)
- ❌ Don't forget timezone handling
- ❌ Don't refetch entire calendar on every change
- ❌ Don't use string accessors for react-big-calendar resources - use functions
- ❌ Don't forget to await checkCapacity() - it's async!

---

## Next
PRP-08: Real-Time Updates

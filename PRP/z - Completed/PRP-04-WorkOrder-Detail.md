# PRP-04: Work Order Detail Panel

## Goal
Build the detail panel that shows when a work order is selected. Displays full info, photos, history, and quick actions.

## Success Criteria
- [ ] Panel slides in from right when work order selected
- [ ] Shows all work order details
- [ ] Tabs: Details, Photos, History, Messages (link to messages view)
- [ ] Quick actions: Assign, Change Status, Add Note
- [ ] Close button returns to list-only view
- [ ] Keyboard escape closes panel

---

## Context

**Triggers:** Clicking a work order card, navigating to /work-orders/:id

**Data needed:** Single work order by ID, related messages count, photos

**Layout:** 480px fixed width, full height, overlays on mobile

---

## Tasks

### Task 1: Detail Panel Content
CREATE `src/components/work-orders/WorkOrderDetailPanel.tsx`
- Receives workOrderId prop
- Fetches single work order details
- Header: ID, status badge, priority, close button
- Tabbed content area
- Footer: Quick action buttons

### Task 2: Details Tab
CREATE `src/components/work-orders/WorkOrderDetails.tsx`
- Property info: code, address, unit
- Tenant info: name, phone (click to call), email
- Assignment: technician name or "Unassigned"
- Schedule: date/time or "Not scheduled"
- Timestamps: created, updated, completed
- Permission to enter status
- Category and CapEx flag

### Task 3: Photos Tab
CREATE `src/components/work-orders/WorkOrderPhotos.tsx`
- Grid of photo thumbnails
- Click to expand in modal/lightbox
- Labels: Before, After, Cleanup
- Empty state if no photos
- Photo count in tab label

### Task 4: History Tab
CREATE `src/components/work-orders/WorkOrderHistory.tsx`
- Timeline of status changes
- Each entry: timestamp, old status → new status, who made change
- Most recent at top
- Auto-generated from audit log or status changes

### Task 5: Quick Actions
CREATE `src/components/work-orders/WorkOrderActions.tsx`
- Assign Technician button → opens technician select modal
- Change Status button → opens status dropdown
- Add Note button → opens text input modal
- Actions respect current status (can't complete if not ready_review)

### Task 6: Technician Select Modal
CREATE `src/components/work-orders/TechnicianSelectModal.tsx`
- Lists available technicians from useTechnicians hook
- Shows: name, current workload, skills
- Highlights best match (if skills align)
- Confirm assigns and updates work order

---

## Validation Checkpoints

1. Click work order → panel slides in
2. All tabs render without errors
3. Close button → panel slides out, URL updates
4. Escape key closes panel
5. Assign technician → updates work order

---

## Files to Create
- src/components/work-orders/WorkOrderDetailPanel.tsx
- src/components/work-orders/WorkOrderDetails.tsx
- src/components/work-orders/WorkOrderPhotos.tsx
- src/components/work-orders/WorkOrderHistory.tsx
- src/components/work-orders/WorkOrderActions.tsx
- src/components/work-orders/TechnicianSelectModal.tsx

---

## Anti-Patterns
- ❌ Don't refetch list when detail opens (already have data)
- ❌ Don't allow invalid status transitions
- ❌ Don't block UI during assignment (optimistic update)
- ❌ Don't forget keyboard accessibility

---

## Next
PRP-05: Messages UI Shell

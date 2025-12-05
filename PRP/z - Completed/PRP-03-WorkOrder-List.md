# PRP-03: Work Order List & Filtering

## Goal
Build the main work order list view with filtering, sorting, and search. This is the primary operational view.

## Success Criteria
- [ ] Work orders display in scrollable list
- [ ] Filter chips: Emergency, High Priority, Unread, Today's Schedule
- [ ] Status filter dropdown
- [ ] Search by description, property, tenant
- [ ] Sort by date, priority, status
- [ ] Clicking a work order navigates to detail view
- [ ] Empty state when no results
- [ ] Loading skeleton while fetching

---

## Context

**Dependencies:** useWorkOrders hook from PRP-01

**Data source:** Supabase work_orders table

**Design reference:** VISUAL_STYLE_GUIDE.md
- Status colors: emergency (red), high (amber), medium (blue), low (green)
- Card style with left border color indicating priority

---

## Tasks

### Task 1: Work Order List Page
CREATE `src/pages/WorkOrdersPage.tsx`
- Uses MainLayout from PRP-02
- Contains filter bar + list + handles detail panel state
- URL param `?status=`, `?priority=` for shareable filters
- Reads :id param to open detail panel

### Task 2: Filter Bar Component
CREATE `src/components/work-orders/WorkOrderFilterBar.tsx`
- Search input with debounce (300ms)
- Filter chips (toggle on/off): Emergency, High, Unread, Today
- Status dropdown: All, New, Assigned, In Progress, Ready for Review, Completed
- Clear all filters button
- Shows result count

### Task 3: Work Order List Component
CREATE `src/components/work-orders/WorkOrderList.tsx`
- Maps over workOrders from hook
- Renders WorkOrderCard for each
- Virtualized scrolling if >50 items (optional optimization)
- Empty state component when no results
- Loading skeleton (3-5 placeholder cards)

### Task 4: Work Order Card Component
CREATE `src/components/work-orders/WorkOrderCard.tsx`

**IMPORTANT: Use correct WorkOrder property names:**
- `workOrder.propertyAddress` (NOT `location`)
- `workOrder.unit` (NOT `unitNumber`)
- `workOrder.residentName` (NOT `tenant`)
- `workOrder.createdDate` (NOT `timestamp`)
- `workOrder.unread` (NOT `has_unread_messages`)

- Left border color = priority
- Shows: ID, title (truncated), propertyAddress/unit, status badge, createdDate
- Unread indicator (dot) if unread === true
- messageCount badge if messageCount > 0
- Hover state: slight lift + shadow
- Click navigates to /work-orders/:id

### Task 5: Status Badge Component
CREATE `src/components/ui/StatusBadge.tsx`
- Reusable badge for work order status
- Color mapping per status
- Small, rounded pill style

### Task 6: Priority Indicator
CREATE `src/components/ui/PriorityIndicator.tsx`
- Visual indicator (colored dot or icon)
- Emergency = pulsing animation
- Tooltip with priority name

---

## Validation Checkpoints

1. Navigate to `/work-orders` - list loads
2. Apply filter - list updates, URL updates
3. Search "leak" - filters to matching descriptions
4. Click work order - URL changes to `/work-orders/:id`
5. Empty database - shows "No work orders" state

---

## Files to Create
- src/pages/WorkOrdersPage.tsx
- src/components/work-orders/WorkOrderFilterBar.tsx
- src/components/work-orders/WorkOrderList.tsx
- src/components/work-orders/WorkOrderCard.tsx
- src/components/ui/StatusBadge.tsx
- src/components/ui/PriorityIndicator.tsx

---

## Anti-Patterns
- ❌ Don't fetch on every filter change (debounce)
- ❌ Don't show raw timestamps (use "2 hours ago" format)
- ❌ Don't truncate description mid-word
- ❌ Don't forget loading states
- ❌ Don't use `location`, `tenant`, `timestamp` - use `propertyAddress`, `residentName`, `createdDate`
- ❌ Don't import WorkOrder from component files - use `import { WorkOrder } from '../types'`

---

## Next
PRP-04: Work Order Detail Panel

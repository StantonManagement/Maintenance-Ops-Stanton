# PRP-03: Work Order Interactions

## Problem Statement

The work order UI has visual elements that don't actually do anything. Dropdowns exist but clicking menu items has no effect. Filters render but don't filter. Clicking a work order doesn't open a detail view. The UI is a shell without wiring.

**Current State:**
- "View Details" / "Assign Technician" / "Change Status" dropdown items render but onClick does nothing
- Sort dropdown and ascending/descending toggle are visual only
- Filter chips (Emergency, Today's Schedule, Unread, Needs Assignment) don't filter
- Clicking a work order row doesn't select it or show details
- No detail panel exists or it's not connected

**Required State:**
- Every clickable element performs its intended action
- Filters actually filter the displayed data
- Sorting changes the order of displayed items
- Clicking a work order shows full details including photos
- Actions respect role permissions (PRP-02)

---

## Why This Matters

The coordinator (Kristine) sits in front of this screen all day. If she clicks "View Details" and nothing happens, she has to find another way to see the information. If filters don't work, she has to scroll through everything manually. This is the difference between a useful tool and a frustrating decoration.

---

## Dropdown Menu Actions

### Current Structure (Likely)

There's probably a dropdown component with menu items, but the onClick handlers either:
- Don't exist
- Call functions that don't exist
- Call functions that don't do anything

### Required Behavior

**View Details**
- Opens a detail panel (sliding from right, or modal)
- Panel shows ALL work order information:
  - Header: WO number, status badge, priority badge
  - Location: Property, building, unit with full address
  - Tenant: Name, phone, email, language preference
  - Request: Full description, date created, source
  - Assignment: Assigned tech (if any), scheduled date/time
  - Timeline: Status history with timestamps
  - Photos: Before/after/cleanup thumbnails (click to enlarge)
  - Messages: Thread if any messages exist
  - Notes: Internal notes
  - Financial: Is CapEx, Section 8 category, estimated/actual cost
- Panel has action buttons: Assign, Change Status, Add Note, Close

**Assign Technician**
- Opens modal with technician list
- Shows each tech: Name, current workload, skills match, availability
- Skills match: Highlight if tech has required skills (plumbing, electrical, etc.)
- Workload: "4/6 orders today" with visual bar
- Availability: Show if they're already scheduled during the proposed time
- Select tech → optionally set date/time → Confirm
- On confirm: Update work_order.assigned_technician_id, create schedule entry
- Permission check: Only coordinator+ can assign (per PRP-02)

**Change Status**
- Opens modal or inline dropdown with valid status options
- Only shows VALID transitions (from config_rules.json)
- Role-restricted options:
  - Technician can only select: ready_review, waiting_parts, waiting_access
  - Coordinator can select: any valid transition including complete
- Some transitions require additional input:
  - "waiting_parts" → ask for parts list and expected date
  - "completed" → require photo verification passed
  - "cancelled" → require cancellation reason
- On confirm: Update status, record in audit log, update has_unread_messages if needed

### Implementation Approach

1. **Locate the dropdown component** - Find where menu items are rendered
2. **Check if onClick handlers exist** - They might be empty or calling non-existent functions
3. **Create the handler functions** - openDetailPanel(), openAssignModal(), openStatusModal()
4. **Create the modal/panel components** - If they don't exist
5. **Wire state management** - Selected work order, modal open states
6. **Connect to data layer** - Mutations for assign and status change

---

## Filter Implementation

### Filter Types

**Status Filters (chips or dropdown)**
- All (default)
- New
- Assigned
- Scheduled
- In Progress
- Waiting (parts/access/dry)
- Ready for Review
- Completed

**Priority Filters**
- All
- Emergency
- High
- Medium
- Low

**Assignment Filters**
- Needs Assignment (no assigned_technician_id)
- Assigned to Me (for technician view)
- Assigned to [specific tech]

**Quick Filters (chips)**
- Emergency - priority = 'emergency'
- Today's Schedule - scheduled_date = today
- Unread - has_unread_messages = true
- Overdue - deadline_date < today AND status not in (completed, cancelled)

### Filter Logic

Filters should combine with AND logic:
- "Emergency" + "Needs Assignment" = emergency priority AND no tech assigned

Implementation pattern:
1. Store filter state in component state or URL params
2. Apply filters to data before rendering
3. If using server-side pagination, send filters as query params
4. If client-side, filter the array in memory

### Sort Implementation

**Sortable Columns:**
- Created Date (default: newest first)
- Deadline Date (upcoming first)
- Priority (emergency → high → medium → low)
- Status
- Property
- Assigned Technician

**Sort State:**
- sortColumn: string (which column)
- sortDirection: 'asc' | 'desc'

**Toggle Behavior:**
- Click column header → sort by that column ascending
- Click same header again → toggle to descending
- Click different header → sort by new column ascending

---

## Detail Panel Design

### Panel Behavior

- **Trigger:** Click anywhere on work order row (except action buttons)
- **Position:** Slides in from right side
- **Width:** 400-600px depending on screen size
- **Dismissal:** Click X, press ESC, click outside panel
- **Persistence:** Panel stays open while navigating filters (updates if same WO visible)

### Panel Sections

**Header**
- Work order number (e.g., "WO-2024-0142")
- Status badge with color
- Priority badge
- Quick action buttons: Assign, Message, Complete (if ready_review)

**Location**
- Property name and code
- Full address
- Unit number (if applicable)
- Map link (optional: small static map thumbnail)

**Tenant**
- Name
- Phone (click to call or copy)
- Email (click to email or copy)
- Preferred language
- Availability notes
- Permission to enter status

**Request Details**
- Full description
- Category (plumbing, electrical, etc.)
- Source (tenant portal, phone, SMS, inspection)
- Created date and time
- Created by (if staff-created)

**Assignment & Schedule**
- Assigned technician (or "Unassigned")
- Scheduled date
- Scheduled time window
- Estimated duration
- Access instructions

**Photos**
- Thumbnail grid
- Click to open lightbox
- Labeled by type: before, after, cleanup
- Upload button (if in progress)

**Messages Thread**
- Chronological list
- Inbound vs outbound styling
- Translation shown if applicable
- Quick reply input at bottom

**Status History**
- Timeline of status changes
- Each entry: status, timestamp, who changed it
- Most recent at top

**Financial**
- Is CapEx: Yes/No with reason
- Section 8 category (if applicable)
- Estimated cost
- Actual cost (if completed)
- Parts cost breakdown

---

## State Management

### What State is Needed

```
selectedWorkOrderId: string | null  // Which WO is selected
detailPanelOpen: boolean            // Is detail panel showing
assignModalOpen: boolean            // Is assign modal showing
statusModalOpen: boolean            // Is status modal showing
filterState: {
  status: string[]                  // Selected statuses
  priority: string[]                // Selected priorities  
  assignedTo: string | null         // Filter by technician
  dateRange: { start, end } | null  // Date range filter
  quickFilters: string[]            // 'emergency', 'today', 'unread', 'overdue'
}
sortState: {
  column: string
  direction: 'asc' | 'desc'
}
```

### State Location Options

**URL Params (Recommended for filters/sort)**
- Shareable: Copy URL includes current filters
- Refresh preserves state
- Pattern: `/work-orders?status=new,assigned&priority=emergency&sort=deadline:asc`

**Component State (For modals/selection)**
- selectedWorkOrderId in parent component
- Modal open states local to their triggers

**Context (If needed across components)**
- WorkOrderContext with selected WO and actions
- Only if multiple components need same selection

---

## Permission Integration

Before showing any action, check permissions (from PRP-02):

**Assign Technician**
- Visible to: owner, manager, coordinator
- Hidden from: admin, technician, viewer

**Change Status**
- Visible to: all except viewer
- Options restricted by role (technician can't select "complete")

**Mark Complete**
- Only in ready_review status
- Only for coordinator+

**Delete Work Order**
- Only visible to owner
- Requires confirmation modal

### Permission Check Pattern

```typescript
// In component
const { canAssign, canChangeStatus, canComplete } = usePermissions();

// In dropdown
{canAssign && <MenuItem onClick={openAssignModal}>Assign Technician</MenuItem>}
{canChangeStatus && <MenuItem onClick={openStatusModal}>Change Status</MenuItem>}
```

---

## Edge Cases

### Work Order Already Assigned
- "Assign Technician" should show as "Reassign" 
- Show current assignment with option to change
- Warn if tech has work in progress on this order

### Work Order Completed
- Most actions should be hidden or disabled
- "View Details" still works
- Status can only change to "cancelled" (reopen not allowed)

### No Photos Yet
- Photos section shows "No photos uploaded"
- If technician has started work, show upload prompt

### Long Description
- Truncate in list view with "..."
- Full text in detail panel
- Expandable if very long

### Multiple Quick Filters Selected
- Combine with AND
- "Emergency" + "Today" = emergency work orders scheduled for today
- Show active filter count

### Empty Results
- Clear message: "No work orders match your filters"
- Show button to clear filters

---

## Validation Criteria

### Dropdown Actions
- [ ] "View Details" opens detail panel with correct work order
- [ ] "Assign Technician" opens modal with tech list
- [ ] "Change Status" opens modal with valid options only
- [ ] Actions not shown to unauthorized roles
- [ ] Actions complete successfully and update UI

### Filters
- [ ] Each filter chip toggles filter state
- [ ] Active filters have visual indicator (filled, highlighted)
- [ ] Filtered results update immediately
- [ ] Multiple filters combine correctly (AND)
- [ ] Clear filters button resets all
- [ ] Filter state persists in URL

### Sort
- [ ] Clicking column header sorts by that column
- [ ] Sort direction indicator shows (arrow up/down)
- [ ] Clicking same column toggles direction
- [ ] Sort state persists in URL

### Detail Panel
- [ ] Clicking row opens panel
- [ ] Panel shows correct work order data
- [ ] Photos display as thumbnails
- [ ] Photos open lightbox on click
- [ ] Messages thread displays (if any)
- [ ] Panel closes on X, ESC, or outside click
- [ ] Panel updates if work order changes

---

## Dependencies

**Requires:**
- PRP-01 (Data Layer) - data hooks for work orders, technicians
- PRP-02 (Auth) - permission checks

**Blocks:**
- PRP-04 (Scheduling) - uses same selection and assignment patterns

---

## Implementation Checklist

### Phase 1: Wire Existing UI
- [ ] Find dropdown component and menu items
- [ ] Add onClick handlers that call actual functions
- [ ] Create selectedWorkOrder state
- [ ] Log clicks to verify handlers fire

### Phase 2: Detail Panel
- [ ] Create WorkOrderDetailPanel component
- [ ] Add slide-in animation
- [ ] Populate all sections with data
- [ ] Add close button and ESC handler
- [ ] Style to match design system

### Phase 3: Assign Modal
- [ ] Create AssignTechnicianModal component
- [ ] Fetch technicians with workload
- [ ] Show skills match indicators
- [ ] Handle assignment mutation
- [ ] Close and update list on success

### Phase 4: Status Modal
- [ ] Create ChangeStatusModal component
- [ ] Get valid transitions from config
- [ ] Filter by role permissions
- [ ] Handle additional inputs (parts, reason)
- [ ] Handle status mutation
- [ ] Update UI on success

### Phase 5: Filters
- [ ] Create filter state (URL params or state)
- [ ] Wire filter chips to toggle state
- [ ] Apply filters to data query or array
- [ ] Show active filter indicators
- [ ] Add clear filters button

### Phase 6: Sort
- [ ] Add sortable column headers
- [ ] Track sort state
- [ ] Apply sort to data
- [ ] Show direction indicators

### Phase 7: Polish
- [ ] Permission checks on all actions
- [ ] Loading states during mutations
- [ ] Error handling and messages
- [ ] Empty states
- [ ] Keyboard navigation

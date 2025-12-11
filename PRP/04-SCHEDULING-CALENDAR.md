# PRP-04: Scheduling & Calendar

## Problem Statement

The calendar/dispatch view exists but drag-and-drop doesn't work. In AppFolio, you drag a work order from a list, drop it on a technician's timeline at a specific time, and it creates a scheduled block. In the current app, the drag might start but the drop doesn't register, or the scheduled block doesn't appear.

**Current State:**
- May have FullCalendar or similar calendar component
- May have React DnD or dnd-kit for drag-drop
- Dragging might work (item lifts)
- Dropping doesn't create scheduled block
- No visual feedback during drag over calendar

**Required State:**
- Drag work order from unscheduled list
- Visual feedback as you drag over calendar (slot highlights)
- Drop on technician row at specific time
- Creates scheduled block showing work order details
- Work order moves from "unscheduled" to "scheduled"
- Can drag to reschedule existing assignments

---

## Reference: AppFolio Behavior

From the screenshots shared:

1. **Left Panel:** List of unscheduled work orders with key info (WO number, description, address)
2. **Right Panel:** Calendar grid with technician rows and hourly time slots
3. **Drag:** Lift work order card, it follows cursor
4. **Hover:** Time slot highlights to show where it will land
5. **Drop:** Work order appears as block on calendar (e.g., "2372-1 Toilet Clog" spanning 2:45-4:45 PM on Brian's row)
6. **Result:** Work order is now assigned to that tech at that time

This is the target behavior.

---

## Architecture Decision: Calendar Library

### Option A: FullCalendar
- Full-featured calendar with timeline view
- Has resource (technician) rows
- External event dragging is supported but requires specific setup
- Heavy library but handles most edge cases

### Option B: Custom Implementation
- More control over styling and behavior
- More work to build
- Easier to match exact design requirements

### Recommendation: FullCalendar with Custom DnD

Use FullCalendar for the calendar grid and time management, but handle the external drag source separately with React DnD or native drag. The key integration point is telling FullCalendar when an external item is dropped.

---

## Component Structure

### Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Dispatch / Scheduling                              [Date]  │
├──────────────────┬──────────────────────────────────────────┤
│  Unscheduled     │  Calendar Grid                           │
│  Work Orders     │  ┌───────────────────────────────────┐   │
│                  │  │ Tech Rows × Hourly Columns        │   │
│  [Drag Items]    │  │                                   │   │
│                  │  │  ┌──────┐                         │   │
│  ○ WO-123        │  │  │Block │                         │   │
│    Toilet leak   │  │  └──────┘                         │   │
│                  │  │                                   │   │
│  ○ WO-124        │  └───────────────────────────────────┘   │
│    No heat       │                                          │
│                  │                                          │
└──────────────────┴──────────────────────────────────────────┘
```

### Component Hierarchy

```
DispatchPage
├── UnscheduledPanel
│   ├── FilterControls (priority, category)
│   └── DraggableWorkOrderList
│       └── DraggableWorkOrderCard (many)
│
├── CalendarPanel
│   └── FullCalendar (or custom grid)
│       ├── TechnicianResourceRows
│       └── ScheduledEventBlocks
│
└── QuickAssignModal (for non-drag assignment)
```

---

## Unscheduled Work Orders Panel

### What Shows Here

Work orders that need scheduling:
- status = 'new' OR 'assigned' (assigned but not scheduled)
- scheduled_date IS NULL OR scheduled_date < today (past due for reschedule)

### Card Display

Each card shows:
- Work order number
- Brief description (truncated)
- Property/unit
- Priority badge
- Estimated duration
- Deadline indicator (if applicable)

### Drag Behavior

When dragging:
- Card visually lifts from list
- Reduced opacity on original position
- Cursor shows drag feedback
- Card follows cursor (or ghost image)

### Filtering

Filter unscheduled by:
- Priority (show emergencies first)
- Category (plumbing, electrical, etc.)
- Property/building
- Deadline (past due first)

---

## Calendar Grid

### Time Configuration

- **Default View:** Day view or 5-day week view
- **Hours:** Business hours (7am - 6pm) with option to show full day
- **Slot Duration:** 15 or 30 minute increments
- **Date Navigation:** Previous/Next day/week, Today button, Date picker

### Technician Resources

Each row represents one technician:
- Row header shows: Name, current workload (e.g., "4/6"), status indicator
- Row body shows scheduled blocks
- Indicate if tech is unavailable (vacation, off-duty) with blocked area

### Scheduled Event Blocks

Each block shows:
- Work order number
- Brief description
- Address (if fits)
- Time span (start - end)
- Color coding by priority or category
- Resize handles (optional: drag edges to change duration)

### Drop Zones

The calendar grid is one big drop zone. On drop:
1. Determine which technician row
2. Determine which time slot
3. Calculate snap-to-slot (round to nearest 15/30 min)
4. Create or update the assignment

---

## Drag and Drop Implementation

### The Problem with Common Setups

React DnD and dnd-kit work well within React, but FullCalendar is its own DOM management system. The integration point is the challenge.

### FullCalendar External Events Approach

FullCalendar has `droppable: true` option that lets external items drop onto the calendar:

1. External items need `data-event` attribute with JSON
2. Calendar listens for native drag events
3. On drop, calendar fires `eventReceive` callback

### Required Setup

**External Draggable Item:**
- Must be draggable (HTML5 drag or library)
- Must have data attribute with work order info
- On drag start, set transfer data

**Calendar Configuration:**
- `droppable: true`
- `eventReceive` callback to handle drop
- Resource view enabled for technician rows

**Integration Flow:**
1. User drags work order card
2. FullCalendar detects drag enter on grid
3. Visual feedback shows potential slot
4. User drops
5. `eventReceive` fires with drop info (resource, date, time)
6. Handler creates assignment and updates database
7. Calendar refreshes to show new event

### If Not Using FullCalendar

Build custom grid with:
- CSS Grid for layout (columns = hours, rows = techs)
- Each cell is a drop target
- On drop, determine cell coordinates → tech + time
- Render event blocks absolutely positioned within grid

---

## Assignment Creation

### On Drop

When work order is dropped on calendar:

1. **Extract Drop Info:**
   - Work order ID (from drag data)
   - Technician ID (from row/resource)
   - Start time (from column/time slot)
   - Duration (from work order estimated_duration or default 2 hours)

2. **Validation:**
   - Tech has capacity (not over daily limit)
   - Tech has required skills
   - Time slot doesn't conflict with existing
   - Work order isn't already assigned elsewhere

3. **Create Assignment:**
   - Update work_order: assigned_technician_id, scheduled_date, scheduled_time_start, scheduled_time_end
   - Update status to 'scheduled' if it was 'new' or 'assigned'
   - Create audit log entry
   - If reassigning: handle old assignment appropriately

4. **UI Update:**
   - Remove from unscheduled list (or gray out)
   - Show on calendar as event block
   - Update technician workload indicator

### Conflict Handling

If dropped on a time that conflicts with existing event:
- Option A: Reject drop, show error message
- Option B: Allow overlap but warn
- Option C: Auto-adjust to next available slot

Recommendation: Reject with clear message, user can manually adjust.

---

## Event Block Interactions

### Click Block
- Opens work order detail panel (same as PRP-03)
- Or opens quick-edit popover

### Drag Block (Reschedule)
- Existing events can be dragged to new time/tech
- Same drop validation applies
- Updates assignment in database

### Resize Block (Change Duration)
- Drag start/end edges
- Updates scheduled_time_start or scheduled_time_end
- Respects minimum duration (30 min)

### Right-Click / Context Menu
- Quick actions: View Details, Unassign, Change Status
- Less critical but nice to have

---

## Technician Visibility

### What to Show Per Tech

**Row Header:**
- Name
- Photo/avatar (if available)
- Workload: "4/6" with visual bar
- Status indicator: Available (green), Busy (yellow), Off (gray)

**Row Body:**
- Scheduled work blocks
- Blocked time (unavailable periods)
- Current location dot (if GPS integrated)

### Workload Calculation

Per technician per day:
- Count of scheduled work orders
- Sum of estimated hours
- Compare to max_daily_orders (default 6)

Visual:
- Under limit: Green or neutral
- At limit: Amber
- Over limit: Red (should this be allowed?)

### Availability

Mark unavailable time:
- Vacation days
- Time off
- Lunch (if configured)
- Already at capacity

---

## Performance Considerations

### Many Work Orders

If there are 50+ unscheduled work orders:
- Virtual scrolling in unscheduled list
- Pagination or "load more"
- Don't render all as DOM nodes

### Many Technicians

If portfolio has 20+ technicians:
- Virtual scrolling for calendar rows
- Collapse inactive/unavailable techs
- Filter by team or property

### Many Events

If calendar has 100+ events visible:
- Let FullCalendar handle rendering (it's optimized)
- Or use windowing for custom implementation

---

## Keyboard & Accessibility

### Keyboard Navigation
- Arrow keys to navigate calendar
- Enter to select slot
- Tab through unscheduled list
- Escape to cancel drag

### Screen Reader
- Work order cards have aria labels
- Calendar slots have aria labels
- Drop feedback announced

### Mobile
- Drag-drop doesn't work well on touch
- Provide alternative: tap work order → tap calendar slot → confirm
- Or "Assign" button that opens modal

---

## Edge Cases

### Work Order Already Scheduled
- Shows on calendar, not in unscheduled list
- To reschedule: drag the existing block to new location
- Or use "Reschedule" action from dropdown

### Technician Over Capacity
- Show warning but allow if coordinator confirms
- Log override
- Alternative: prevent drop, show "Tech at capacity" message

### Past Time Slot
- Prevent dropping on past times
- Gray out past hours/days

### Multi-Day Work
- If work spans multiple days, show as multi-day event
- Or split into separate daily blocks

### Cancelled/Completed Work Orders
- Don't show in unscheduled list
- Don't allow drag to schedule

### No Technicians Available
- Show message in calendar area
- Still allow scheduling (tech can be assigned later)

---

## Data Requirements

### For Unscheduled List

Query work_orders where:
- portfolio_id = active portfolio
- status IN ('new', 'assigned')
- (scheduled_date IS NULL OR scheduled_date < today)
- active = true

Order by:
- deadline_date ASC NULLS LAST
- priority (emergency first)
- created_at ASC

### For Calendar Events

Query work_orders where:
- portfolio_id = active portfolio
- scheduled_date BETWEEN view_start AND view_end
- assigned_technician_id IS NOT NULL
- status NOT IN ('completed', 'cancelled')

Or query a separate scheduling table if assignments are separate from work orders.

### For Technician Resources

Query technicians where:
- portfolio_id = active portfolio
- active = true
- is_available = true (or show all with status)

---

## Validation Criteria

### Drag from Unscheduled
- [ ] Work order card can be dragged
- [ ] Visual feedback shows card following cursor
- [ ] Original position shows placeholder or dims

### Drop on Calendar
- [ ] Calendar highlights valid drop zones
- [ ] Dropping creates event block at correct position
- [ ] Event shows work order number and details
- [ ] Database updated with assignment

### Visual Feedback
- [ ] Hover over slot shows it's a valid target
- [ ] Invalid slots (past, over capacity) show differently
- [ ] Drop success shows confirmation (subtle)

### Data Integrity
- [ ] Work order status updates to 'scheduled'
- [ ] Technician workload count updates
- [ ] Audit log records the assignment
- [ ] Unscheduled list removes the item

### Reschedule
- [ ] Existing events can be dragged to new time
- [ ] Existing events can be dragged to different tech
- [ ] Database updates correctly

---

## Dependencies

**Requires:**
- PRP-01 (Data Layer) - work orders, technicians queries
- PRP-02 (Auth) - only coordinator+ can assign

**Library Decision:**
- FullCalendar with scheduler/timeline plugin, OR
- Custom grid implementation

---

## Implementation Checklist

### Phase 1: Static Layout
- [ ] Create page with two-panel layout
- [ ] Left panel: list of unscheduled work orders
- [ ] Right panel: calendar grid with tech rows
- [ ] Verify data loads correctly

### Phase 2: Calendar Setup
- [ ] Install/configure FullCalendar (or build custom)
- [ ] Enable resource view with technician rows
- [ ] Load existing scheduled events
- [ ] Date navigation working

### Phase 3: Drag Source
- [ ] Make work order cards draggable
- [ ] Set drag data with work order ID
- [ ] Visual feedback on drag start

### Phase 4: Drop Target
- [ ] Enable dropping on calendar
- [ ] Handle eventReceive or drop event
- [ ] Extract tech ID, date, time from drop
- [ ] Show event block at drop location

### Phase 5: Database Integration
- [ ] On drop, call assignment mutation
- [ ] Update work order in database
- [ ] Refresh calendar and unscheduled list
- [ ] Handle errors gracefully

### Phase 6: Validation & Edge Cases
- [ ] Prevent past time drops
- [ ] Warn on tech over capacity
- [ ] Handle conflicts
- [ ] Support reschedule (drag existing events)

### Phase 7: Polish
- [ ] Loading states
- [ ] Error messages
- [ ] Keyboard accessibility
- [ ] Mobile alternative

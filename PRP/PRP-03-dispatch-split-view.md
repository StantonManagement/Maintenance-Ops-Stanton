# PRP-03: Dispatch Split View

## Goal
Redesign Dispatch to show both supply (technicians) and demand (unassigned work orders) side-by-side, enabling quick visual matching and assignment without switching between pages.

## Success Criteria
- [ ] Left panel: Unassigned/pending work orders (demand)
- [ ] Right panel: Technician availability (supply)
- [ ] Quick-assign via drag-drop OR click-to-assign flow
- [ ] Work orders show DeadlineCountdown as primary sort/visual
- [ ] Technicians show current load and skills
- [ ] Map is available as overlay/toggle, not the primary view
- [ ] Filter work orders by urgency, skills needed, location

## Dependencies
- PRP-01 (DeadlineCountdown component) must be completed first

## Context

### Current Problems (from UX Audit)
- "Dispatch focuses on technicians (supply) but hides the unassigned work orders (demand)"
- "A coordinator can't allocate resources if they can't see both sides on the same screen"

### Coordinator's Question
"I have 5 unassigned urgent items and 3 available techs - who gets what?"

### Current State
- Split view: Map 60% / Tech List 40%
- Unassigned work orders hidden in modals or other pages
- No clear demand visibility

## Implementation Tasks

### Task 1: Page Layout Restructure

MODIFY `src/pages/Dispatch.tsx` (or equivalent):

New layout:
```
┌─────────────────────────────────────────────────────────────────┐
│  Header: Dispatch Center                    [Map Toggle] [Filter]│
├─────────────────────────────────┬───────────────────────────────┤
│                                 │                               │
│  DEMAND                         │  SUPPLY                       │
│  Unassigned Work Orders         │  Technician Availability      │
│                                 │                               │
│  [Filter: Urgency ▼] [Skills ▼] │  [Filter: Available ▼]       │
│                                 │                               │
│  ┌─────────────────────────┐   │  ┌─────────────────────────┐  │
│  │ 🔴 2 days | Unit 302    │   │  │ Ramon - Available       │  │
│  │ Ceiling leak - Plumbing │   │  │ 2/6 orders | Plumbing ✓ │  │
│  └─────────────────────────┘   │  │ [Assign] [View Schedule]│  │
│                                 │  └─────────────────────────┘  │
│  ┌─────────────────────────┐   │                               │
│  │ 🟡 5 days | Unit 108    │   │  ┌─────────────────────────┐  │
│  │ No hot water - Plumbing │   │  │ Kishan - Busy until 2pm │  │
│  └─────────────────────────┘   │  │ 4/6 orders | Electric ✓ │  │
│                                 │  └─────────────────────────┘  │
│  ...                            │  ...                          │
│                                 │                               │
├─────────────────────────────────┴───────────────────────────────┤
│  [Map Overlay - Hidden by default, toggle to show]              │
└─────────────────────────────────────────────────────────────────┘
```

Split: 50% / 50% on desktop, stacked on mobile

### Task 2: Unassigned Work Orders Panel

CREATE `src/components/dispatch/DemandPanel.tsx`:

```typescript
interface DemandPanelProps {
  workOrders: WorkOrder[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAssign: (workOrderId: string, techId: string) => void;
  filters: DemandFilters;
  onFilterChange: (filters: DemandFilters) => void;
}

interface DemandFilters {
  urgency: 'all' | 'critical' | 'warning' | 'watch';
  skillsNeeded: string[];
  propertyId: string | null;
}
```

Features:
- Sorted by deadline (most urgent first)
- Each card shows DeadlineCountdown prominently
- Shows required skills as badges
- Shows property/unit
- Click to select (highlights matching techs on right)
- Drag to tech card to assign

### Task 3: Work Order Demand Card

CREATE `src/components/dispatch/DemandCard.tsx`:

```typescript
interface DemandCardProps {
  workOrder: WorkOrder;
  selected: boolean;
  onSelect: () => void;
  draggable?: boolean;
}
```

Layout:
```
┌───────────────────────────────────┐
│ 🔴 2 days              $1.2k     │  <- DeadlineCountdown + exposure
│ S0021-67 Park - Unit 302         │  <- Property/Unit
│ Ceiling leak in bathroom         │  <- Description
│ [Plumbing] [Drywall]             │  <- Skills needed
└───────────────────────────────────┘
```

Visual states:
- Default: white background
- Selected: blue border, light blue background
- Dragging: elevated shadow, slight rotation
- Drop target hover: green border on tech card

### Task 4: Technician Supply Panel

CREATE `src/components/dispatch/SupplyPanel.tsx`:

```typescript
interface SupplyPanelProps {
  technicians: Technician[];
  selectedWorkOrderSkills: string[];  // Highlights matching techs
  onAssign: (techId: string) => void;
  onViewSchedule: (techId: string) => void;
}
```

Features:
- Shows all techs with current availability
- Capacity indicator (X/6 orders today)
- Skills badges
- Status: Available / Busy until X / Off today
- Highlight techs who match selected work order's skills
- Drop zone for drag-assign

### Task 5: Technician Supply Card

CREATE `src/components/dispatch/SupplyCard.tsx`:

```typescript
interface SupplyCardProps {
  technician: Technician;
  highlighted: boolean;  // Has matching skills for selected WO
  onAssign: () => void;
  onViewSchedule: () => void;
  isDropTarget?: boolean;
}
```

Layout:
```
┌───────────────────────────────────┐
│ Ramon Martinez            🟢     │  <- Name + status dot
│ 2/6 orders today                 │  <- Capacity
│ [Plumbing ✓] [HVAC] [Drywall ✓]  │  <- Skills (✓ = matches selected WO)
│ Available now                     │  <- Status text
│ [Assign Selected] [Schedule →]   │  <- Actions
└───────────────────────────────────┘
```

Visual states:
- Default: white
- Highlighted (skill match): subtle green border
- Drop hover: green background
- Overloaded (6/6): amber background, warning icon

### Task 6: Quick Assign Flow

Two methods:

**Method A: Click-to-Assign**
1. Click work order in left panel (selects it)
2. Right panel highlights matching techs
3. Click "Assign Selected" on tech card
4. Confirmation toast, work order moves to assigned list

**Method B: Drag-and-Drop**
1. Drag work order card from left
2. Drop on tech card on right
3. Same result

Implementation:
- Use react-dnd or native drag-drop
- Show visual feedback during drag
- Validate before drop (tech has capacity, skills match)
- Show warning if assigning to non-matching tech (allow override)

CREATE `src/hooks/useDispatchAssignment.ts`:

```typescript
interface DispatchAssignment {
  selectedWorkOrderId: string | null;
  selectWorkOrder: (id: string | null) => void;
  assignToTech: (workOrderId: string, techId: string) => Promise<void>;
  canAssign: (workOrderId: string, techId: string) => { allowed: boolean; warnings: string[] };
}
```

### Task 7: Map Overlay Toggle

MODIFY existing map component to work as overlay:

```typescript
interface MapOverlayProps {
  visible: boolean;
  onClose: () => void;
  workOrders: WorkOrder[];  // Show pins for unassigned
  technicians: Technician[];  // Show tech locations
  onWorkOrderClick: (id: string) => void;
  onTechClick: (id: string) => void;
}
```

When visible:
- Overlays the split view (80% height)
- Shows work order pins (color by urgency)
- Shows tech location pins
- Click pin to select in underlying panels
- Close button returns to split view

### Task 8: Filter Components

CREATE `src/components/dispatch/DemandFilters.tsx`:

Filters for left panel:
- Urgency dropdown: All / Critical / Warning / Watch
- Skills multi-select: Plumbing, Electrical, HVAC, etc.
- Property dropdown (if multi-property)

CREATE `src/components/dispatch/SupplyFilters.tsx`:

Filters for right panel:
- Availability: All / Available Now / Available Today
- Skills filter (same as demand side)

### Task 9: Data Hook

CREATE `src/hooks/useDispatchData.ts`:

```typescript
interface DispatchData {
  unassignedWorkOrders: WorkOrder[];
  technicians: TechnicianWithAvailability[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface TechnicianWithAvailability extends Technician {
  status: 'available' | 'busy' | 'off';
  busyUntil?: Date;
  ordersToday: number;
  maxOrders: number;  // Usually 6
}
```

Query:
- Work orders where status = 'new' or 'needs_assignment'
- Technicians with today's schedule data
- Real-time subscription for updates (if using Supabase realtime)

## Validation Checkpoints

### Checkpoint 1: Layout Renders
```bash
npm run dev
# Navigate to /dispatch
# Verify: Two panels side by side
# Verify: Work orders on left, techs on right
```

### Checkpoint 2: Selection Works
- Click work order → highlights
- Matching techs get visual indicator
- Click another → previous deselects

### Checkpoint 3: Assignment Works
- Select work order
- Click "Assign" on tech
- Work order disappears from left panel
- Toast confirms assignment
- Tech's order count increases

### Checkpoint 4: Drag-Drop Works (if implemented)
- Drag work order
- Drop on tech
- Same result as click-assign

### Checkpoint 5: Filters Work
- Filter by urgency → list filters
- Filter by skill → list filters
- Filters persist during session

### Checkpoint 6: Map Toggle Works
- Click map toggle
- Map overlays
- Can still interact with underlying selection
- Close returns to split view

### Checkpoint 7: Build Passes
```bash
npm run build
# No errors
```

## Data Requirements

Work orders need:
- id, deadline, description
- propertyCode, unitNumber
- skillsRequired: string[]
- status
- estimatedHours
- location (lat/lng for map)

Technicians need:
- id, name
- skills: string[]
- currentLocation (lat/lng)
- todaySchedule: ScheduleItem[]
- ordersAssignedToday: number

## Mobile Considerations

On screens < 1024px:
- Stack panels vertically (Demand on top, Supply below)
- Or use tab navigation between panels
- Map becomes full-screen toggle
- Drag-drop disabled, click-assign only

## Notes

- Consider keyboard shortcuts: Arrow keys to navigate list, Enter to assign
- Show "No unassigned work orders" empty state (celebration moment!)
- Auto-refresh every 60 seconds or use realtime subscription
- Assignment should optimistically update UI before API confirms
- Undo option in toast for accidental assignments

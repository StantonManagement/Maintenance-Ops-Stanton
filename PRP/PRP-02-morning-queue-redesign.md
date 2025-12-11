# PRP-02: Morning Queue Redesign

## Goal
Transform Morning Queue from a flat list into a structured command center that answers: "Given what's due and what I have, will we make it? If not, what moves do I make?"

## Success Criteria
- [ ] Capacity bar shows tech-hours available vs work-hours needed this week
- [ ] Items grouped by deadline tier (Critical → Warning → Watch), not flat list
- [ ] Each item shows DeadlineCountdown as primary indicator
- [ ] Bulk actions per group ("Reschedule all No-Access in this tier")
- [ ] Financial exposure shown as ONE metric in header, not the headline
- [ ] Table view toggle for power users who want density

## Dependencies
- PRP-01 (DeadlineCountdown component) must be completed first

## Context

### Current Problems
- Flat list of cards wastes space on desktop
- No capacity visualization
- No grouping by urgency
- No bulk actions
- Exposure not visible

### Coordinator's Morning Question
"Will we get everything done in time? If not, what do I shift?"

### Data Available
- Work orders with deadlines (from Supabase)
- Technician schedules (hours available)
- Unit rent data (for exposure calculation)

## Implementation Tasks

### Task 1: Capacity Summary Component

CREATE `src/components/morning-queue/CapacitySummary.tsx`:

```typescript
interface CapacitySummaryProps {
  availableHours: number;    // Sum of tech availability
  requiredHours: number;     // Sum of estimated work hours
  itemCount: number;         // Total items needing attention
  totalExposure: number;     // Sum of financial exposure
}
```

Layout:
```
┌─────────────────────────────────────────────────────────────┐
│  📊 This Week's Capacity                                    │
│                                                             │
│  [████████████░░░░░░░░] 38h needed / 42h available         │
│                                                             │
│  Items: 24    |    On Track: 18    |    At Risk: 6         │
│  Exposure: $12.4k                                          │
└─────────────────────────────────────────────────────────────┘
```

Visual rules:
- Progress bar green if required < available
- Progress bar amber if required is 80-100% of available
- Progress bar red if required > available
- Exposure is same visual weight as other metrics (not emphasized)

### Task 2: Deadline Group Component

CREATE `src/components/morning-queue/DeadlineGroup.tsx`:

```typescript
interface DeadlineGroupProps {
  tier: 'critical' | 'warning' | 'watch';
  items: WorkOrderItem[];
  onBulkAction: (action: string, itemIds: string[]) => void;
}
```

Layout:
```
┌─────────────────────────────────────────────────────────────┐
│  🔴 Critical (3 items)                    [Bulk Actions ▼]  │
├─────────────────────────────────────────────────────────────┤
│  Item row with checkbox | deadline | description | assignee │
│  Item row with checkbox | deadline | description | assignee │
│  Item row with checkbox | deadline | description | assignee │
└─────────────────────────────────────────────────────────────┘
```

Tier headers:
- Critical (red dot): Due in 0-2 days
- Warning (amber dot): Due in 3-6 days  
- Watch (gray dot): Due in 7-14 days
- Scheduled (no dot): Due in 14+ days - collapsed by default

Bulk actions dropdown:
- Reassign selected
- Reschedule selected
- Mark as No Access
- Escalate to Manager

### Task 3: Queue Item Row Component

CREATE `src/components/morning-queue/QueueItemRow.tsx`:

```typescript
interface QueueItemRowProps {
  item: WorkOrderItem;
  selected: boolean;
  onSelect: (id: string) => void;
  onClick: (id: string) => void;
}
```

Columns:
1. Checkbox (for bulk select)
2. DeadlineCountdown (primary visual)
3. Property/Unit
4. Description (truncated)
5. Issue type badge
6. Assignee (or "Unassigned" in red)
7. Status
8. Quick actions (kebab menu)

Row click → opens detail panel or navigates to work order

### Task 4: Refactor Morning Queue Page

MODIFY `src/pages/MorningQueue.tsx` (or equivalent):

Structure:
```tsx
<div className="h-full flex flex-col">
  {/* Fixed header with capacity */}
  <CapacitySummary {...capacityData} />
  
  {/* View toggle */}
  <div className="flex justify-between items-center px-4 py-2 border-b">
    <span>{filteredItems.length} items</span>
    <ViewToggle value={view} onChange={setView} /> {/* 'grouped' | 'table' */}
  </div>
  
  {/* Main content */}
  <div className="flex-1 overflow-auto">
    {view === 'grouped' ? (
      <>
        <DeadlineGroup tier="critical" items={criticalItems} />
        <DeadlineGroup tier="warning" items={warningItems} />
        <DeadlineGroup tier="watch" items={watchItems} />
      </>
    ) : (
      <QueueTable items={allItems} />
    )}
  </div>
</div>
```

### Task 5: Data Hooks

CREATE or MODIFY `src/hooks/useMorningQueue.ts`:

```typescript
interface MorningQueueData {
  items: WorkOrderItem[];
  capacity: {
    availableHours: number;
    requiredHours: number;
  };
  grouped: {
    critical: WorkOrderItem[];
    warning: WorkOrderItem[];
    watch: WorkOrderItem[];
    scheduled: WorkOrderItem[];
  };
  totalExposure: number;
  loading: boolean;
  error: Error | null;
}

function useMorningQueue(): MorningQueueData
```

Grouping logic uses `getUrgencyTier` from deadline-utils.

Exposure calculation:
```typescript
// For each item with a deadline
const daysAtRisk = Math.max(0, differenceInDays(deadline, new Date()));
const exposure = unitRent * Math.min(daysAtRisk, 30); // Cap at 30 days
```

### Task 6: Bulk Action Handlers

CREATE `src/hooks/useBulkActions.ts`:

```typescript
interface BulkActions {
  reassign: (itemIds: string[], techId: string) => Promise<void>;
  reschedule: (itemIds: string[], newDate: Date) => Promise<void>;
  markNoAccess: (itemIds: string[]) => Promise<void>;
  escalate: (itemIds: string[]) => Promise<void>;
}
```

Each action:
1. Optimistically update UI
2. Call API
3. Revert on error
4. Show toast notification

### Task 7: Table View Alternative

CREATE `src/components/morning-queue/QueueTable.tsx`:

Full-width data table with:
- Sortable columns
- All items in single view
- Same row structure as QueueItemRow
- Sticky header

Use existing table component pattern from the codebase if available.

## Validation Checkpoints

### Checkpoint 1: Components Render
```bash
npm run dev
# Navigate to /morning-queue
# Verify: Capacity bar shows, groups display
```

### Checkpoint 2: Grouping Works
- Add test items with various deadlines
- Verify they appear in correct tier groups
- Verify group headers show correct counts

### Checkpoint 3: Bulk Actions Function
- Select multiple items via checkboxes
- Click bulk action
- Verify items update (or mock the API call)

### Checkpoint 4: View Toggle Works
- Switch between grouped and table views
- Data persists across toggle
- Table is sortable

### Checkpoint 5: Build Passes
```bash
npm run build
# No errors
```

## Data Requirements

Work order items need these fields:
- id
- deadline (Date)
- description
- propertyCode
- unitNumber
- status
- assigneeId (nullable)
- estimatedHours
- unitRent (for exposure calc)

Technician data needs:
- id
- name
- availableHoursToday
- scheduledHoursToday

## Notes

- Groups should be collapsible (save state to localStorage)
- Empty groups should be hidden, not shown empty
- "Scheduled" group (14+ days) collapsed by default
- Mobile: Stack capacity metrics vertically, keep grouped view
- Consider keyboard navigation for power users (j/k to move, x to select)

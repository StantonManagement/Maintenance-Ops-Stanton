# PRP-04: Work Orders Data Grid

## Goal
Convert Work Orders from a list-detail pattern to a dense, sortable data grid optimized for high-volume operations. The coordinator should be able to scan 50+ items quickly, sort by any column, bulk select, and take actions without opening each item.

## Success Criteria
- [ ] Full-width data table replaces card list
- [ ] Sortable columns: Deadline, Status, Property, Assignee, Created
- [ ] DeadlineCountdown as first data column (primary sort default)
- [ ] Bulk selection with checkbox column
- [ ] Bulk actions toolbar appears when items selected
- [ ] Detail panel slides out from right (not fixed width eating space)
- [ ] Column visibility toggles for customization
- [ ] Maintains current filter functionality

## Dependencies
- PRP-01 (DeadlineCountdown component) must be completed first

## Context

### Current Problems (from UX Audit)
- "Preview panel is fixed width (w-[480px]). On a 1920px screen, this leaves a lot of empty space"
- "If no ID selected, right side is just a placeholder"
- "Missing: Bulk select checkboxes in the list"
- "The current list-detail is too slow for volume"

### Coordinator's Need
Quickly scan all work orders, find issues, take bulk actions. Not one-at-a-time clicking.

## Implementation Tasks

### Task 1: Data Grid Component

CREATE `src/components/work-orders/WorkOrderGrid.tsx`:

```typescript
interface WorkOrderGridProps {
  workOrders: WorkOrder[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onRowClick: (id: string) => void;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  onSort: (column: string) => void;
  visibleColumns: string[];
}
```

Columns (in order):
1. Checkbox (bulk select)
2. Deadline (DeadlineCountdown component) - default sort
3. ID (work order number)
4. Status (badge)
5. Property/Unit
6. Description (truncated with tooltip)
7. Assignee (name or "Unassigned")
8. Category (Section 8, CapEx, etc.)
9. Created Date
10. Actions (kebab menu)

### Task 2: Table Structure

Use either:
- Existing table component from UI library
- TanStack Table (react-table) for advanced features
- Simple HTML table with Tailwind if keeping it light

```tsx
<div className="w-full overflow-auto">
  <table className="w-full">
    <thead className="sticky top-0 bg-white border-b">
      <tr>
        <th className="w-10 px-2">
          <Checkbox checked={allSelected} onChange={toggleAll} />
        </th>
        <th className="px-3 cursor-pointer" onClick={() => onSort('deadline')}>
          Deadline {sortColumn === 'deadline' && <SortIcon dir={sortDirection} />}
        </th>
        {/* ... other columns */}
      </tr>
    </thead>
    <tbody>
      {workOrders.map(wo => (
        <WorkOrderRow 
          key={wo.id} 
          workOrder={wo}
          selected={selectedIds.includes(wo.id)}
          onSelect={() => toggleSelection(wo.id)}
          onClick={() => onRowClick(wo.id)}
        />
      ))}
    </tbody>
  </table>
</div>
```

### Task 3: Table Row Component

CREATE `src/components/work-orders/WorkOrderRow.tsx`:

```typescript
interface WorkOrderRowProps {
  workOrder: WorkOrder;
  selected: boolean;
  onSelect: () => void;
  onClick: () => void;
}
```

Row styles:
- Default: white background
- Hover: subtle gray background
- Selected: blue-50 background, blue left border
- Clicking row opens detail panel
- Clicking checkbox toggles selection without opening detail

Row height: Compact (40-48px) to maximize density

### Task 4: Bulk Actions Toolbar

CREATE `src/components/work-orders/BulkActionsToolbar.tsx`:

```typescript
interface BulkActionsToolbarProps {
  selectedCount: number;
  onAssign: () => void;
  onChangeStatus: () => void;
  onExport: () => void;
  onClearSelection: () => void;
}
```

Layout (appears above table when items selected):
```
┌─────────────────────────────────────────────────────────────────┐
│ 5 items selected    [Assign...] [Change Status...] [Export]  ✕ │
└─────────────────────────────────────────────────────────────────┘
```

Actions:
- **Assign**: Opens tech picker modal, assigns all selected
- **Change Status**: Opens status dropdown, updates all selected
- **Export**: Downloads CSV/PDF of selected items
- **✕**: Clears selection

### Task 5: Sliding Detail Panel

CREATE `src/components/work-orders/WorkOrderDetailPanel.tsx`:

```typescript
interface WorkOrderDetailPanelProps {
  workOrderId: string | null;
  onClose: () => void;
}
```

Behavior:
- Slides in from right when workOrderId is set
- Width: 480px (or 30% of screen, max 600px)
- Overlays the table (doesn't push it)
- Dark overlay on rest of screen (optional, click to close)
- Close button in header
- ESC key closes

Content:
- Full work order details
- Photo gallery
- Activity/history log
- Action buttons (Assign, Change Status, etc.)

Animation:
```css
/* Slide in from right */
.panel-enter { transform: translateX(100%); }
.panel-enter-active { transform: translateX(0); transition: transform 200ms; }
.panel-exit-active { transform: translateX(100%); transition: transform 200ms; }
```

### Task 6: Column Visibility Toggle

CREATE `src/components/work-orders/ColumnVisibilityMenu.tsx`:

```typescript
interface ColumnVisibilityMenuProps {
  columns: { id: string; label: string; visible: boolean }[];
  onChange: (columnId: string, visible: boolean) => void;
}
```

Dropdown with checkboxes:
- All columns listed
- Check/uncheck to show/hide
- Save preference to localStorage
- Some columns required (can't hide): Checkbox, Deadline, Status

### Task 7: Refactor Work Orders Page

MODIFY `src/pages/WorkOrders.tsx`:

```tsx
export function WorkOrdersPage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState('deadline');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);
  
  const { workOrders, loading, error } = useWorkOrders({ 
    sort: sortColumn, 
    direction: sortDirection,
    ...filters 
  });
  
  return (
    <div className="h-full flex flex-col">
      {/* Header with filters */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <WorkOrderFilters filters={filters} onChange={setFilters} />
        <div className="flex items-center gap-2">
          <ColumnVisibilityMenu 
            columns={columns} 
            onChange={handleColumnVisibility} 
          />
          <Button onClick={handleExport}>Export</Button>
        </div>
      </div>
      
      {/* Bulk actions (conditional) */}
      {selectedIds.length > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedIds.length}
          onAssign={handleBulkAssign}
          onChangeStatus={handleBulkStatus}
          onExport={handleExport}
          onClearSelection={() => setSelectedIds([])}
        />
      )}
      
      {/* Data grid */}
      <div className="flex-1 overflow-auto">
        <WorkOrderGrid
          workOrders={workOrders}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onRowClick={setDetailId}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          visibleColumns={visibleColumns}
        />
      </div>
      
      {/* Sliding detail panel */}
      <WorkOrderDetailPanel
        workOrderId={detailId}
        onClose={() => setDetailId(null)}
      />
    </div>
  );
}
```

### Task 8: Keyboard Navigation

Add keyboard support:
- `↑`/`↓`: Move row focus
- `Space`: Toggle selection of focused row
- `Enter`: Open detail panel for focused row
- `Escape`: Close detail panel / clear selection
- `Ctrl+A`: Select all visible
- `Shift+Click`: Range select

CREATE `src/hooks/useGridKeyboard.ts` for handling this.

### Task 9: Sorting Logic

In data hook or locally:

```typescript
function sortWorkOrders(
  workOrders: WorkOrder[], 
  column: string, 
  direction: 'asc' | 'desc'
): WorkOrder[] {
  return [...workOrders].sort((a, b) => {
    let comparison = 0;
    
    switch (column) {
      case 'deadline':
        comparison = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'property':
        comparison = a.propertyCode.localeCompare(b.propertyCode);
        break;
      case 'assignee':
        comparison = (a.assigneeName || 'zzz').localeCompare(b.assigneeName || 'zzz');
        break;
      case 'created':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      default:
        comparison = 0;
    }
    
    return direction === 'asc' ? comparison : -comparison;
  });
}
```

### Task 10: Status Badge Component

CREATE `src/components/work-orders/StatusBadge.tsx`:

```typescript
const statusStyles = {
  'new': 'bg-blue-100 text-blue-700',
  'assigned': 'bg-purple-100 text-purple-700',
  'scheduled': 'bg-indigo-100 text-indigo-700',
  'in_progress': 'bg-yellow-100 text-yellow-700',
  'waiting_parts': 'bg-orange-100 text-orange-700',
  'waiting_access': 'bg-orange-100 text-orange-700',
  'ready_review': 'bg-green-100 text-green-700',
  'completed': 'bg-gray-100 text-gray-700',
};
```

Compact badge that fits in table cell.

## Validation Checkpoints

### Checkpoint 1: Grid Renders
```bash
npm run dev
# Navigate to /work-orders
# Verify: Full-width table displays
# Verify: All columns visible
# Verify: Data populates
```

### Checkpoint 2: Sorting Works
- Click column header → sorts ascending
- Click again → sorts descending
- Sort indicator shows on active column
- Deadline is default sort

### Checkpoint 3: Selection Works
- Click checkbox → row selected, checkbox checked
- Click row → detail opens (checkbox unchanged)
- Shift+click → range select
- Header checkbox → select all

### Checkpoint 4: Bulk Actions Work
- Select multiple items
- Toolbar appears with count
- Click action → modal/dropdown
- Action applies to all selected
- Selection clears after action

### Checkpoint 5: Detail Panel Works
- Click row → panel slides in
- Panel shows correct work order
- Click another row → panel updates
- Close button / ESC → panel closes
- Table remains interactive while panel open

### Checkpoint 6: Column Visibility Works
- Open column menu
- Uncheck a column → hides from table
- Refresh page → setting persists

### Checkpoint 7: Build Passes
```bash
npm run build
# No errors
```

## Data Requirements

Work order fields used:
- id
- deadline
- status
- propertyCode
- unitNumber
- description
- assigneeId
- assigneeName
- category
- createdAt
- unitRent (for exposure display)

## Performance Considerations

- Virtualize rows if list > 100 items (react-virtual or similar)
- Debounce sort changes
- Memoize row components
- Consider pagination for very large datasets (1000+)

## Mobile Considerations

On screens < 768px:
- Hide less important columns by default
- Keep: Checkbox, Deadline, Property, Status
- Detail panel becomes full-screen modal
- Touch-friendly row height (48px minimum)

## Notes

- Default sort by deadline (ascending = most urgent first)
- "Unassigned" items should stand out (red text or badge)
- Consider row striping for readability
- Frozen first column (checkbox) on horizontal scroll
- Empty state: "No work orders match your filters"

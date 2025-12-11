# PRP-P1-01: Work Order List Filters

## Goal
Make the "Emergency" and "Today's Schedule" filter chips functional on the Work Order List page.

## Success Criteria
- [ ] Clicking "Emergency" filters to show only priority = 1 work orders
- [ ] Clicking "Today's Schedule" filters to show work orders with assignments scheduled for today
- [ ] Filters toggle on/off (click again to clear)
- [ ] Multiple filters can be active (AND logic)
- [ ] Active filter chips have visual distinction (filled vs outline)
- [ ] Filter state persists in URL params for shareability

---

## Context

**Files involved:**
- `src/components/WorkOrderList.tsx` - Main list component with filter chips
- `src/hooks/useWorkOrders.ts` - Data fetching hook
- `src/types/index.ts` - WorkOrder type definition

**Current state:**
- Filter chips exist in UI but onClick handlers are empty or log to console
- Priority field exists on work orders (1-5 scale, 1 = emergency)
- Assignments have `scheduled_date` field

**Data model:**
- `work_orders.priority` - INTEGER 1-5 (1 = emergency, 5 = low)
- `work_order_assignments.scheduled_date` - DATE
- Work orders can have multiple assignments

---

## Tasks

### Task 1: Add Filter State

MODIFY `src/components/WorkOrderList.tsx`:

```typescript
// Add state for active filters
const [activeFilters, setActiveFilters] = useState<{
  emergency: boolean;
  todaysSchedule: boolean;
}>({
  emergency: false,
  todaysSchedule: false,
});

// Toggle handler
const toggleFilter = (filter: 'emergency' | 'todaysSchedule') => {
  setActiveFilters(prev => ({
    ...prev,
    [filter]: !prev[filter]
  }));
};
```

### Task 2: Filter the Data

MODIFY `src/components/WorkOrderList.tsx`:

```typescript
// Filter work orders based on active filters
const filteredWorkOrders = useMemo(() => {
  let result = workOrders;
  
  if (activeFilters.emergency) {
    result = result.filter(wo => wo.priority === 1);
  }
  
  if (activeFilters.todaysSchedule) {
    const today = new Date().toISOString().split('T')[0];
    // This requires assignments to be loaded with work orders
    result = result.filter(wo => 
      wo.assignments?.some(a => a.scheduled_date === today)
    );
  }
  
  return result;
}, [workOrders, activeFilters]);
```

### Task 3: Update Filter Chip UI

MODIFY the filter chip buttons:

```tsx
<Button
  variant={activeFilters.emergency ? "default" : "outline"}
  size="sm"
  onClick={() => toggleFilter('emergency')}
  className={activeFilters.emergency ? "bg-red-600 hover:bg-red-700" : ""}
>
  <AlertTriangle className="h-4 w-4 mr-1" />
  Emergency
</Button>

<Button
  variant={activeFilters.todaysSchedule ? "default" : "outline"}
  size="sm"
  onClick={() => toggleFilter('todaysSchedule')}
>
  <Calendar className="h-4 w-4 mr-1" />
  Today's Schedule
</Button>
```

### Task 4: Sync with URL Params

ADD URL param sync for shareable filter state:

```typescript
import { useSearchParams } from 'react-router-dom';

// In component:
const [searchParams, setSearchParams] = useSearchParams();

// Initialize from URL
useEffect(() => {
  setActiveFilters({
    emergency: searchParams.get('emergency') === 'true',
    todaysSchedule: searchParams.get('today') === 'true',
  });
}, []);

// Update URL when filters change
useEffect(() => {
  const params = new URLSearchParams();
  if (activeFilters.emergency) params.set('emergency', 'true');
  if (activeFilters.todaysSchedule) params.set('today', 'true');
  setSearchParams(params, { replace: true });
}, [activeFilters]);
```

### Task 5: Ensure Assignments Load with Work Orders

MODIFY `src/hooks/useWorkOrders.ts` if not already joining assignments:

```typescript
const { data, error } = await supabase
  .from('work_orders')
  .select(`
    *,
    assignments:work_order_assignments(
      id,
      technician_id,
      scheduled_date,
      status
    )
  `)
  .order('created_at', { ascending: false });
```

---

## Validation

```bash
# Type check
npx tsc --noEmit

# Build check
npm run build

# Manual testing:
# 1. Load /work-orders
# 2. Click "Emergency" - only priority 1 shows
# 3. Click again - filter clears
# 4. Click "Today's Schedule" - only today's scheduled work shows
# 5. Refresh page - filters persist via URL
```

---

## Edge Cases

- No emergency work orders exist → Show empty state with message
- No work scheduled for today → Show empty state
- Work order has no assignments yet → Excluded from "Today's Schedule" filter
- Both filters active → Show emergency work orders scheduled for today only

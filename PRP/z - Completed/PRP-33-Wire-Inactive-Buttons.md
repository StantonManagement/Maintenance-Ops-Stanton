# PRP-33: Wire Inactive Buttons

## Goal
Audit and connect all inactive/stub buttons across the application.

## Problem
Many buttons exist in UI but their onClick handlers are empty, missing, or show "coming soon" when they should navigate or take action.

---

## Known Inactive Buttons

### Technicians Page (`/technicians`)
| Button | Expected Action | Current State |
|--------|-----------------|---------------|
| "View Schedule" | Navigate to `/calendar?technician={id}` | Does nothing |
| "Assign Work Order" | Open assignment modal | Unknown |
| "View on Map" | Navigate to `/dispatch?view=map&technician={id}` | Unknown |
| "Performance Report" | Open report modal or navigate | Unknown |
| "Manage Schedules" | Navigate to calendar management | Unknown |

### Dispatch Page (`/dispatch`)
| Button | Expected Action | Current State |
|--------|-----------------|---------------|
| "Assign Work" | Open work order selector modal | Unknown |

### Other Pages (Audit Needed)
- Voice Queue: "Create Work Order", "Discard"
- Vendors: "Add Vendor", "Request Vendor"
- Rules: "New Rule", "Edit"
- Preventive: "New Schedule", "Generate Work Order"
- Sensors: "Configure Thresholds", "Acknowledge"
- Portfolio: "View" on properties

---

## Tasks

### Task 1: Fix Technician Page Buttons

FIND: `src/pages/TechniciansPage.tsx` or `src/components/technicians/TechnicianCard.tsx`

**View Schedule button:**
```typescript
// BEFORE (broken)
<Button onClick={() => {}}>View Schedule</Button>
// or
<Button>View Schedule</Button>

// AFTER (working)
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

<Button onClick={() => navigate(`/calendar?technician=${technician.id}`)}>
  View Schedule
</Button>
```

**Assign Work Order button:**
```typescript
// Should open a modal to select work order
const [showAssignModal, setShowAssignModal] = useState(false);

<Button onClick={() => setShowAssignModal(true)}>
  Assign Work Order
</Button>

{showAssignModal && (
  <AssignWorkOrderModal 
    technicianId={technician.id}
    onClose={() => setShowAssignModal(false)}
  />
)}
```

**View on Map:**
```typescript
<Button onClick={() => navigate(`/dispatch?view=map&focus=${technician.id}`)}>
  View on Map
</Button>
```

### Task 2: Fix Calendar Page to Read Filter

FIND: `src/pages/CalendarPage.tsx`

```typescript
import { useSearchParams } from 'react-router-dom';

const [searchParams] = useSearchParams();
const technicianFilter = searchParams.get('technician');

// Use in query/filter
const { events } = useCalendarEvents({ 
  technicianId: technicianFilter || undefined 
});

// Show filter indicator
{technicianFilter && (
  <Badge>
    Filtered by: {technicianName}
    <button onClick={() => navigate('/calendar')}>Clear</button>
  </Badge>
)}
```

### Task 3: Fix Dispatch Page Buttons

FIND: `src/pages/DispatchPage.tsx` or components

**Assign Work button:**
```typescript
// Open modal to pick from unassigned work orders
<Button onClick={() => openAssignModal(technician.id)}>
  Assign Work
</Button>
```

### Task 4: Audit All Button Handlers

Run this search in your codebase:
```bash
# Find empty onClick handlers
grep -rn "onClick={() => {}}" src/
grep -rn "onClick={()=>{}}" src/

# Find buttons without onClick
grep -rn "<Button>" src/ | grep -v "onClick"

# Find "coming soon" toasts
grep -rn "coming soon" src/
```

### Task 5: Create Missing Modals

If modals don't exist, create minimal versions:

**AssignWorkOrderModal.tsx:**
```typescript
interface Props {
  technicianId: string;
  onClose: () => void;
  onAssign: (workOrderId: string) => void;
}

export function AssignWorkOrderModal({ technicianId, onClose, onAssign }: Props) {
  const { workOrders } = useWorkOrders({ status: 'unassigned' });
  
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Work Order</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {workOrders.map(wo => (
            <button 
              key={wo.id}
              onClick={() => {
                onAssign(wo.id);
                onClose();
              }}
              className="w-full p-2 text-left hover:bg-gray-100 rounded"
            >
              {wo.id} - {wo.description}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Quick Fix Pattern

For any button that should navigate:
```typescript
// 1. Import
import { useNavigate } from 'react-router-dom';

// 2. Get navigate function
const navigate = useNavigate();

// 3. Wire button
<Button onClick={() => navigate('/target-route')}>
  Button Text
</Button>
```

For any button that should open modal:
```typescript
// 1. Add state
const [showModal, setShowModal] = useState(false);

// 2. Wire button
<Button onClick={() => setShowModal(true)}>
  Button Text
</Button>

// 3. Render modal conditionally
{showModal && <TheModal onClose={() => setShowModal(false)} />}
```

---

## Validation

After fixes, each button should:
1. Show cursor:pointer on hover
2. Produce console log or network activity on click
3. Navigate OR open modal OR perform action

Test checklist:
- [ ] Technicians → View Schedule → Calendar shows filtered
- [ ] Technicians → Assign Work Order → Modal opens
- [ ] Technicians → View on Map → Dispatch map focused
- [ ] Dispatch → Assign Work → Modal opens
- [ ] All "coming soon" buttons either work or are visually disabled

---

## Files to Check/Modify

Priority order:
1. `src/pages/TechniciansPage.tsx`
2. `src/components/technicians/TechnicianCard.tsx`
3. `src/pages/CalendarPage.tsx`
4. `src/pages/DispatchPage.tsx`
5. `src/components/dispatch/TechnicianCard.tsx`

Create if missing:
- `src/components/modals/AssignWorkOrderModal.tsx`

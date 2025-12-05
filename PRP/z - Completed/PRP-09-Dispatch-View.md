# PRP-09: Technician Dispatch View (Phase 2)

## Goal
Build the dispatch command center showing all technicians, their current status, location, and workload at a glance.

## Success Criteria
- [ ] Grid/list of all technicians with status
- [ ] Real-time status updates
- [ ] Workload capacity visualization
- [ ] Quick assign from dispatch view
- [ ] Map view showing technician locations (optional)
- [ ] Filter by status, skills, availability

---

## Context

**Purpose:** Coordinator's bird's-eye view for making assignment decisions

**Data sources:**
- Technicians table
- Work orders (grouped by assigned_technician_id)
- Location data (if tracked)

---

## Tasks

### Task 1: Dispatch Page
CREATE `src/pages/DispatchPage.tsx`
- Remove Phase lock overlay
- Toggle: Card view | Map view
- Filter bar: Status, Skills
- Summary stats: Available, Busy, Off-duty

### Task 2: Technician Grid
CREATE `src/components/dispatch/TechnicianGrid.tsx`
- Grid of TechnicianDispatchCard components
- Responsive: 3 cols desktop, 2 tablet, 1 mobile
- Sort by: availability, workload, name

### Task 3: Technician Dispatch Card
CREATE `src/components/dispatch/TechnicianDispatchCard.tsx`
- Avatar + name
- Status badge (Available, On Job, Traveling, Off)
- Capacity ring: visual of daily workload
- Current job: property, description snippet
- Skills chips
- "Assign Work" button

### Task 4: Capacity Ring Component
CREATE `src/components/dispatch/CapacityRing.tsx`
- Circular progress indicator
- Shows X/6 jobs
- Color: green (<50%), yellow (50-80%), red (>80%)
- Center shows count

### Task 5: Quick Assign Panel
CREATE `src/components/dispatch/QuickAssignPanel.tsx`
- Triggered from "Assign Work" button
- Shows unscheduled work orders
- Filter by skills match
- Drag or click to assign
- Closes after assignment

### Task 6: Map View (Optional)
CREATE `src/components/dispatch/DispatchMap.tsx`
- Uses Mapbox or Google Maps
- Markers for each technician
- Color = status
- Click marker shows tech details
- Work order locations as secondary markers

---

## Validation Checkpoints

1. Navigate to `/dispatch` - technician cards load
2. See real-time status changes
3. Click "Assign Work" - panel opens with work orders
4. Assign work order - updates tech's workload
5. Toggle to map view - markers display (if implemented)

---

## Files to Create
- src/pages/DispatchPage.tsx
- src/components/dispatch/TechnicianGrid.tsx
- src/components/dispatch/TechnicianDispatchCard.tsx
- src/components/dispatch/CapacityRing.tsx
- src/components/dispatch/QuickAssignPanel.tsx
- src/components/dispatch/DispatchMap.tsx (optional)

---

## Anti-Patterns
- ❌ Don't show stale location data without timestamp
- ❌ Don't assign to unavailable technicians without warning
- ❌ Don't forget skill matching logic
- ❌ Don't block UI while fetching locations

---

## Next
PRP-10: Automated Communications

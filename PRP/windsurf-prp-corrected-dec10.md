# Windsurf PRP Bundle - CORRECTED
**Date:** December 10, 2025  
**Actual Gaps:** UI cleanup, navigation reorganization, polish

---

## PRP 1: Remove Dev Toolbar & Phase Badges (QUICK WIN)

### Goal
Remove the bottom dev toolbar and Phase 2 badges since all features are unlocked.

### Cascade Prompt

```
I need to clean up development UI artifacts that shouldn't be in production.

## What to Remove

### 1. Bottom Toolbar
There's a toolbar at the bottom of the app with buttons:
- "Phase 2: Dispatch →"
- "Future Features" 
- "Design System"
- "Mobile View"

Find this component and remove it entirely. It's likely in:
@src/App.tsx or
@src/components/Layout.tsx or
@src/components/DevToolbar.tsx

### 2. Phase 2 Badges
In the navigation sidebar, remove the "Phase 2" badges from:
- Calendar
- Technicians  
- Dispatch
- Property

These are in @src/components/NavigationSidebar.tsx

Look for anything like:
- `<Badge>Phase 2</Badge>`
- `phase === 2` conditionals
- `isPhase2` or `locked` props
- Orange/coral colored badges next to nav items

### 3. "Coming Soon" Section
In the sidebar, there's a "Coming Soon" section showing:
- "Phase 2 (4 features) - Estimated: 4 weeks"
- "Phase 3 (2 features) - Estimated: 12 weeks"
- "View Roadmap" button

Remove this entire section since all features are unlocked.

### 4. "All features unlocked" Badge
At the bottom of sidebar there's a green "All features unlocked" indicator.
Remove this too - it's no longer needed.

## Keep Everything Else
Don't modify any functional components, just remove these dev/roadmap UI elements.
```

### Validation
```bash
npm run build
npm run dev
# Check: No bottom toolbar
# Check: No Phase 2 badges on nav items
# Check: No Coming Soon section
# Check: Clean sidebar
```

---

## PRP 2: Navigation Reorganization (Dropdown Groups)

### Goal
Reorganize flat navigation into grouped dropdowns per system definition v2.0.

### Target Structure
```
Operations (dropdown)
├── Dispatch
├── Morning Queue
├── Work Orders
├── Approval Queue
├── Duplicates

Communication (dropdown)
├── Tenant Messages
├── Tech Messages
├── Voice Queue

Team (dropdown)
├── Technicians
├── Calendar
├── Override Log

Vendors (dropdown)
├── Vendor Directory
├── Vendor Requests

Properties (dropdown)
├── Property Ops
├── Portfolio
├── Units
├── Preventive Maintenance
├── IoT Sensors

Intelligence (dropdown)
├── Analytics
├── Financials
├── Rules Engine

Settings (single item, no dropdown)
```

### Cascade Prompt

```
I need to reorganize the navigation sidebar from a flat list into grouped dropdowns.

## Context
@src/components/NavigationSidebar.tsx - Current flat navigation
@src/AppRouter.tsx - Available routes

## Current State
The sidebar has a flat list of nav items. I need collapsible dropdown groups.

## New Navigation Structure

Create collapsible section groups with these items:

### Operations (expanded by default)
- Dispatch → /dispatch
- Morning Queue → /morning-queue  
- Work Orders → /work-orders
- Approval Queue → /approval-queue
- Duplicates → /duplicates

### Communication
- Messages → /messages (rename from "Tenant Messages" if needed)
- Voice Queue → /voice-queue (may not exist yet, that's ok)

### Team
- Technicians → /technicians
- Calendar → /calendar
- Override Log → /overrides

### Vendors
- Vendor Directory → /vendors
- Vendor Requests → /vendor-requests (or combine into /vendors)

### Properties
- Property Ops → /property-operations
- Portfolio → /portfolio (may not exist)
- Units → /units (may not exist)
- Preventive Maintenance → /preventive (may not exist)

### Intelligence
- Analytics → /analytics
- Financials → /financials

### Settings (not a dropdown, single item)
- Settings → /settings

## UI Pattern

Each group header should:
- Show group name with chevron icon (down when expanded, right when collapsed)
- Click to toggle expand/collapse
- Remember expanded state (localStorage or just default expanded)
- Indent child items slightly

Keep existing:
- Active state highlighting on current route
- Badge counts on Messages and Approval Queue
- Icons for each nav item

## Implementation Notes
- Use Lucide icons for chevrons: ChevronDown, ChevronRight
- Group state can be local useState, doesn't need persistence
- If a route doesn't exist yet, still show the nav item (it can 404 or show placeholder)
- "Operations" group should be expanded by default, others collapsed
```

### Validation
```bash
npm run build
npm run dev
# Check: Groups collapse/expand
# Check: Active route still highlights correctly
# Check: Badges still show on Messages/Approval Queue
```

---

## PRP 3: Deadline Granularity (30/14/7/3/1 Days)

### Goal
Enhance the deadline warning system with specific stages and suggested actions per the system definition.

### Current State
- SLA badges show "warning" vs "overdue"
- System definition wants: 30 → 14 → 7 → 3 → 1 → 0 day stages with specific actions

### Cascade Prompt

```
I need to enhance the deadline warning system with more granular stages.

## Context
@src/types/index.ts - Current SLAStatus type
@src/components/DeadlineWarningBadge.tsx - Current badge (or similar)
@src/hooks/useWorkOrders.ts - Where SLA data comes from

## Current State
SLA status is: 'on_track' | 'warning' | 'overdue' | 'completed'

## New Stages Needed

Update to use these deadline stages based on days remaining:

| Days Out | Stage | Badge Color | Suggested Action |
|----------|-------|-------------|------------------|
| >30 | planning | gray | "Calculate exposure, estimate hours" |
| 14-30 | scheduled_check | blue | "Verify scheduled, confirm materials" |
| 7-14 | attention | yellow | "Confirm tech assigned, parts ready" |
| 3-7 | urgent | orange | "Check if work started" |
| 1-3 | critical | red | "Escalate if not in progress" |
| 0-1 | emergency | dark red | "Pull resources if needed" |
| <0 | overdue | dark red + pulse | "Loss occurring" |

## Changes Needed

### 1. Update Types
In @src/types/index.ts, update SLAStatus:
```typescript
export type DeadlineStage = 
  | 'planning'      // >30 days
  | 'scheduled'     // 14-30 days  
  | 'attention'     // 7-14 days
  | 'urgent'        // 3-7 days
  | 'critical'      // 1-3 days
  | 'emergency'     // 0-1 days
  | 'overdue'       // past due
  | 'completed';

export interface DeadlineInfo {
  stage: DeadlineStage;
  daysRemaining: number;
  hoursRemaining: number;
  suggestedAction: string;
}
```

### 2. Update Badge Component
Enhance the deadline badge to:
- Show stage-appropriate color
- On hover/click, show tooltip with suggested action
- For 'overdue', add subtle pulse animation

### 3. Update Calculation
Either in the SQL view or in the hook, calculate the stage based on days remaining.

## Don't Break Existing
- Keep backward compatibility with existing slaStatus usage
- The core "is this overdue?" logic should still work
```

---

## PRP 4: Access Report PDF Export

### Goal
Add "Generate Report" button to access tracking that exports PDF for caseworker.

### Cascade Prompt

```
I need to add PDF export for tenant access obstruction documentation.

## Context
@src/components/AccessAttemptPanel.tsx - Where the button should go
@src/hooks/useAccessTracking.ts - Has the data

## Current State
- Access attempts are logged and displayed
- Escalation stage is tracked
- No export functionality exists

## What I Need

### 1. Add Export Button
In AccessAttemptPanel, add a "Generate Report" button that:
- Only shows when there are 2+ failed access attempts
- Is styled as secondary/outline button
- Shows "Generating..." state while processing

### 2. Create PDF Generation
Create @src/services/accessReportService.ts or add to existing service:

The report should include:
- Header: "Tenant Access Documentation Report"
- Property info: Address, Unit number
- Tenant info: Name (from work order)
- Work order info: ID, Description, Created date
- Timeline of access attempts:
  - Attempt #, Date/Time, Method, Result, Notes
- Current escalation stage
- Summary statement: "X attempts made over Y days with no successful access"
- Footer: Generated date, "MaintenanceOps Center"

### 3. Use Browser Print or Library
Options:
- Simple: Use window.print() with a print-styled div
- Better: Use a library like jsPDF or react-pdf

For MVP, the simple window.print() approach is fine:
- Create a hidden printable div with report content
- Style it for print (@media print)
- Call window.print()

### 4. Integration
When user clicks "Generate Report":
1. Fetch all access attempts for the work order
2. Format into report structure
3. Open print dialog or download PDF
```

---

## PRP 5: Auto-Calculate Financial Exposure

### Goal
Automatically calculate rent at risk from units × rent instead of manual entry.

### Cascade Prompt

```
I need the compliance deadline financial exposure to auto-calculate from unit data.

## Context
@supabase tables/ - compliance_deadlines table
@src/hooks/useComplianceDeadlines.ts - Current hook

## Current State
- compliance_deadlines has `units_at_risk` and `monthly_rent_at_risk`
- These are manually entered
- We have unit rent data in Supabase (likely in a units or properties table)

## What I Need

### 1. Find Rent Data
First, identify where unit rent is stored. It's likely in:
- AF_units table with a rent column
- Or properties table with avg_rent
- Or a separate rents table

Search the schema for rent-related columns.

### 2. Update SQL View
Create or update a view that calculates exposure:

```sql
-- If we have individual unit rents:
CREATE OR REPLACE VIEW v_compliance_with_exposure AS
SELECT 
  cd.*,
  COALESCE(cd.units_at_risk, 0) as units_at_risk,
  COALESCE(
    cd.monthly_rent_at_risk,
    cd.units_at_risk * (
      SELECT AVG(rent) FROM units WHERE property_id = cd.property_id
    )
  ) as calculated_rent_at_risk
FROM compliance_deadlines cd;
```

### 3. Update Hook
In useComplianceDeadlines, use the calculated value:
- If monthly_rent_at_risk is set, use it (manual override)
- If not, use calculated value from units × avg rent

### 4. Show Calculation in UI
In the compliance display, show:
- "{X} units × ${Y} avg rent = ${Z}/mo at risk"
- Or if manually set: "${Z}/mo at risk (manual)"

## If Rent Data Doesn't Exist
If there's no rent data in the database yet, instead:
1. Add a `default_unit_rent` column to properties table
2. Use that for calculation
3. Show a warning in UI: "Using estimated rent - update property settings for accuracy"
```

---

## Execution Order

1. **PRP 1: Remove Dev UI** (15 min) - Quick win, immediate visual cleanup
2. **PRP 2: Navigation Reorganization** (1-2 hours) - Biggest UX improvement
3. **PRP 3: Deadline Granularity** (30-45 min) - Polish existing feature
4. **PRP 4: Access Report Export** (45 min) - Completes access tracking feature
5. **PRP 5: Financial Auto-Calc** (30 min) - Depends on finding rent data

**Total: ~4-5 hours**

Start with PRP 1 - it's the fastest win and will immediately make the app look more production-ready.

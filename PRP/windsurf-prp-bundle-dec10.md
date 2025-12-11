# Windsurf PRP Bundle - Maintenance Ops Center
**Date:** December 10, 2025  
**Target:** Close 6 critical gaps using Windsurf Cascade

---

## Setup: Create `.windsurfrules` First

Before running any PRPs, create this rules file in your project root:

**File: `.windsurfrules`**
```
# Maintenance Ops Center - Windsurf Rules

## Project Context
This is a React/TypeScript property maintenance coordination system.
- Frontend: React 18 + TypeScript + Tailwind + shadcn/ui
- Backend: Supabase (PostgreSQL)
- State: React hooks, no Redux

## Database Rules
- Tables prefixed with `AF_` are READ-ONLY (synced from AppFolio)
- All write operations go to `work_order_actions` table
- Use JSONB for flexible action_data storage

## Code Patterns
- Hooks go in `src/hooks/` with `use` prefix
- Components go in `src/components/` organized by feature
- Types go in `src/types/index.ts`
- Services go in `src/services/`

## TypeScript Rules
- No `any` types - use proper interfaces
- Export types from `src/types/index.ts`
- Use existing patterns from similar files

## Component Patterns
- Follow existing card patterns from `PropertyHealthCard.tsx`
- Follow existing list patterns from `WorkOrderList.tsx`
- Use Tailwind utilities, match existing color scheme

## Naming Conventions
- Coordinator name: Kristine (not Christine)
- Work order statuses use exact strings from WorkOrderStatus type
```

---

## PRP 1: Deadline Warning System

### Cascade Prompt (Write Mode)

```
I need to implement a deadline warning system that shows SLA breach risk on work orders.

## Context Files
@src/types/index.ts - Current type definitions
@src/hooks/useWorkOrders.ts - Current work order fetching
@src/services/analyticsService.ts - Has hardcoded SLA rules
@src/components/WorkOrderList.tsx - Where badges will appear

## Current State
- SLA calculation is client-side in analyticsService.ts
- WorkOrder type has `hoursUntilSLABreach` but it's never populated
- Rules: Emergency=2h, High=24h, Medium/Normal=72h, Low=168h

## What I Need

### Step 1: Create SQL View
Create file `supabase tables/sla_calculation.sql` with a view called `v_work_orders_with_sla` that:
- Calculates hours_until_sla_breach based on Priority and CreatedDate
- Adds sla_status column: 'on_track', 'warning' (>75% elapsed), 'overdue', 'completed'
- Only includes non-completed work orders

### Step 2: Update Types
In @src/types/index.ts:
- Add type: `SLAStatus = 'on_track' | 'warning' | 'overdue' | 'completed'`
- Add `slaStatus?: SLAStatus` to WorkOrder interface

### Step 3: Update Hook
In @src/hooks/useWorkOrders.ts:
- Change query from AF_work_order_new to v_work_orders_with_sla
- Map hours_until_sla_breach to hoursUntilSLABreach
- Map sla_status to slaStatus

### Step 4: Create Badge Component
Create @src/components/DeadlineWarningBadge.tsx:
- Props: hoursUntilBreach (number | null), slaStatus (SLAStatus), size ('sm' | 'lg')
- on_track: subtle green or no badge
- warning: amber badge showing "Xh remaining"
- overdue: red badge showing "OVERDUE +Xh"
- Use Tailwind, match existing badge styles

### Step 5: Integrate Badge
In @src/components/WorkOrderList.tsx:
- Import DeadlineWarningBadge
- Add badge next to priority indicator in both card and table views
```

### Validation After Completion
```bash
# Run SQL in Supabase SQL editor first
# Then:
npm run build
npm run dev
# Verify: Work orders show deadline badges
```

---

## PRP 2: Emergency Override Audit Trail

### Cascade Prompt (Write Mode)

```
I need to track when managers pull technicians for emergencies, with full audit trail and coordinator notification.

## Context Files
@src/types/index.ts - Add override types here
@src/hooks/useWorkOrders.ts - Pattern for actions
@src/pages/DispatchPage.tsx - Where "Pull Tech" action will live
@src/components/NavigationSidebar.tsx - For notification badge

## Business Context
- Dean (manager) sometimes pulls techs like Ramon for turnovers/emergencies
- Kristine (coordinator) MUST be notified immediately
- We need to track: who made override, why, which work orders displaced
- This uses existing work_order_actions table with action_type = 'override'

## What I Need

### Step 1: Add Types
In @src/types/index.ts add:
```typescript
export type OverrideReason = 'turnover' | 'emergency' | 'inspection' | 'other';

export interface OverrideAction {
  id: string;
  workOrderId: string;
  overrideBy: string;
  overrideReason: OverrideReason;
  reasonDetails?: string;
  technicianId: string;
  technicianName: string;
  displacedWorkOrders: string[];
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  createdAt: string;
}
```

### Step 2: Create Hook
Create @src/hooks/useOverrides.ts with functions:
- fetchOverrides(): Get all override actions from work_order_actions where action_type='override'
- fetchUnacknowledgedOverrides(): Filter for acknowledgedBy is null
- createOverride(data): Insert new override action
- acknowledgeOverride(overrideId): Update acknowledgedBy and acknowledgedAt
- getDisplacedWorkOrders(technicianId): Find WOs assigned to tech that need reassignment

### Step 3: Create Override Modal
Create @src/components/OverrideModal.tsx:
- Opens when user clicks "Pull Tech" button
- Fields: Technician dropdown, Reason dropdown (turnover/emergency/inspection/other), Details textarea
- Shows list of work orders that will be displaced (fetch from current assignments)
- Confirm button logs override and notifies coordinator

### Step 4: Create Notification Banner
Create @src/components/OverrideNotificationBanner.tsx:
- Shows at top of app when unacknowledged overrides exist
- Yellow/amber background
- Text: "⚠️ {techName} pulled for {reason} by {overrideBy} - {count} work orders displaced"
- "View Details" link and "Acknowledge" button

### Step 5: Add Badge to Sidebar
In @src/components/NavigationSidebar.tsx:
- Add badge to "Overrides" nav item showing count of unacknowledged overrides
- Use same badge pattern as Messages

### Step 6: Integrate into Dispatch
In @src/pages/DispatchPage.tsx:
- Add "Pull Tech" button to TechnicianCard or tech dropdown
- Opens OverrideModal when clicked
```

### Validation
```bash
npm run build
npm run dev
# Test: Click Pull Tech, fill modal, verify notification banner appears
```

---

## PRP 3: Tenant Access Obstruction Tracking

### Cascade Prompt (Write Mode)

```
I need to track tenant access attempts for Section 8 caseworker documentation when tenants block repairs.

## Context Files
@src/types/index.ts - Add access tracking types
@src/components/WorkOrderPreview.tsx - Where panel will show
@supabase tables/ - Where to put new SQL

## Business Context
- Section 8 tenants sometimes block repairs intentionally
- We need to document every access attempt (date, method, result)
- 4-step escalation: phone call → written notice → caseworker → legal
- Need to generate report package for caseworker proving non-cooperation

## What I Need

### Step 1: Create Database Table
Create @supabase tables/access_tracking.sql:
```sql
CREATE TABLE IF NOT EXISTS access_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id TEXT NOT NULL,
  attempt_number INT NOT NULL,
  attempt_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  attempt_method TEXT NOT NULL, -- 'phone', 'text', 'email', 'in_person', 'letter'
  contact_result TEXT NOT NULL, -- 'no_answer', 'refused', 'rescheduled', 'successful', 'voicemail'
  notes TEXT,
  photo_urls TEXT[],
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_access_attempts_wo ON access_attempts(work_order_id);

CREATE VIEW v_access_escalation_status AS
SELECT 
  work_order_id,
  COUNT(*) as attempt_count,
  MAX(attempt_date) as last_attempt,
  CASE 
    WHEN COUNT(*) >= 4 THEN 'legal_escalation'
    WHEN COUNT(*) >= 3 THEN 'caseworker_contact'
    WHEN COUNT(*) >= 2 THEN 'written_notice'
    WHEN COUNT(*) >= 1 THEN 'initial_attempt'
    ELSE 'not_started'
  END as escalation_stage
FROM access_attempts
WHERE contact_result != 'successful'
GROUP BY work_order_id;
```

### Step 2: Add Types
In @src/types/index.ts add:
```typescript
export type AttemptMethod = 'phone' | 'text' | 'email' | 'in_person' | 'letter';
export type ContactResult = 'no_answer' | 'refused' | 'rescheduled' | 'successful' | 'voicemail';
export type EscalationStage = 'not_started' | 'initial_attempt' | 'written_notice' | 'caseworker_contact' | 'legal_escalation';

export interface AccessAttempt {
  id: string;
  workOrderId: string;
  attemptNumber: number;
  attemptDate: string;
  attemptMethod: AttemptMethod;
  contactResult: ContactResult;
  notes?: string;
  photoUrls?: string[];
  createdBy: string;
  createdAt: string;
}

export interface AccessEscalationStatus {
  workOrderId: string;
  attemptCount: number;
  lastAttempt: string;
  escalationStage: EscalationStage;
}
```

### Step 3: Create Hook
Create @src/hooks/useAccessTracking.ts:
- fetchAccessAttempts(workOrderId): Get all attempts for a work order
- logAccessAttempt(data): Insert new attempt, auto-increment attempt_number
- getEscalationStatus(workOrderId): Query v_access_escalation_status
- getWorkOrdersNeedingEscalation(): WOs at each stage for dashboard

### Step 4: Create Access Attempt Panel
Create @src/components/AccessAttemptPanel.tsx:
- Shows timeline of all access attempts
- Current escalation stage badge with color coding
- "Log Attempt" button opens modal
- "Generate Report" button (placeholder for now)

### Step 5: Create Log Attempt Modal
Create @src/components/LogAccessAttemptModal.tsx:
- Method dropdown, Result dropdown, Notes textarea
- Optional photo upload (just URL input for now)
- Shows what next escalation step will be

### Step 6: Create Escalation Badge
Create @src/components/AccessEscalationBadge.tsx:
- Small badge showing stage
- gray=not_started, blue=initial, yellow=written, orange=caseworker, red=legal

### Step 7: Integrate into WorkOrderPreview
In @src/components/WorkOrderPreview.tsx:
- Show AccessAttemptPanel when work order status is 'Waiting for Access'
- Show AccessEscalationBadge in header area
```

---

## PRP 4: Inspection & Compliance Deadlines

### Cascade Prompt (Write Mode)

```
I need to wire compliance/inspection deadlines into the property dashboard so we can see upcoming Section 8 inspections and rent at risk.

## Context Files
@src/types/index.ts - PropertyHealthMetrics already has inspection fields but they're null
@src/components/PropertyOperations/PropertyOperationsDashboard.tsx - Main dashboard
@src/components/PropertyOperations/PropertyHealthCard.tsx - Property cards
@supabase tables/preventive_maintenance.sql - Has compliance_deadlines table

## Current State
- compliance_deadlines table exists but isn't joined to property health view
- PropertyHealthMetrics type has nextInspectionDate but it's always null
- Need to show days until inspection and rent at risk

## What I Need

### Step 1: Update Database
Create @supabase tables/compliance_deadlines_update.sql:
```sql
-- Ensure columns exist
ALTER TABLE compliance_deadlines ADD COLUMN IF NOT EXISTS 
  property_id TEXT;
ALTER TABLE compliance_deadlines ADD COLUMN IF NOT EXISTS 
  deadline_type TEXT NOT NULL DEFAULT 'section_8_annual';
ALTER TABLE compliance_deadlines ADD COLUMN IF NOT EXISTS 
  deadline_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE compliance_deadlines ADD COLUMN IF NOT EXISTS 
  status TEXT DEFAULT 'pending';
ALTER TABLE compliance_deadlines ADD COLUMN IF NOT EXISTS 
  units_at_risk INT DEFAULT 0;
ALTER TABLE compliance_deadlines ADD COLUMN IF NOT EXISTS 
  monthly_rent_at_risk DECIMAL(10,2) DEFAULT 0;

-- Update property health view
CREATE OR REPLACE VIEW v_property_health_with_compliance AS
SELECT 
  ph.*,
  cd.deadline_type as next_inspection_type,
  cd.deadline_date as next_inspection_date,
  cd.deadline_date - CURRENT_DATE as days_until_inspection,
  cd.units_at_risk,
  cd.monthly_rent_at_risk as inspection_rent_at_risk
FROM v_property_health_metrics ph
LEFT JOIN LATERAL (
  SELECT * FROM compliance_deadlines 
  WHERE property_id = ph.property_code 
    AND status = 'pending'
    AND deadline_date >= CURRENT_DATE
  ORDER BY deadline_date ASC
  LIMIT 1
) cd ON true;
```

### Step 2: Update Types
In @src/types/index.ts add:
```typescript
export type ComplianceDeadlineType = 'section_8_annual' | 'section_8_special' | 'cao_license' | 'city_code';
export type ComplianceStatus = 'pending' | 'passed' | 'failed' | 'rescheduled';

export interface ComplianceDeadline {
  id: string;
  propertyId: string;
  deadlineType: ComplianceDeadlineType;
  deadlineDate: string;
  status: ComplianceStatus;
  unitsAtRisk: number;
  monthlyRentAtRisk: number;
  notes?: string;
}
```

And update PropertyHealthMetrics to include:
- nextInspectionType?: ComplianceDeadlineType
- daysUntilInspection?: number
- unitsAtRisk?: number
- inspectionRentAtRisk?: number

### Step 3: Create Hook
Create @src/hooks/useComplianceDeadlines.ts:
- fetchPropertyDeadlines(propertyId): All deadlines for property
- fetchUpcomingDeadlines(days): All deadlines within X days across portfolio
- createDeadline(data): Add new inspection deadline
- updateDeadlineStatus(id, status): Mark passed/failed

### Step 4: Create Compliance Badge
Create @src/components/ComplianceDeadlineBadge.tsx:
- Shows days until inspection with urgency colors
- >30 days: gray, 14-30: blue, 7-14: yellow, <7: red
- Shows deadline type icon/label

### Step 5: Update PropertyHealthCard
In @src/components/PropertyOperations/PropertyHealthCard.tsx:
- Add ComplianceDeadlineBadge when inspection is upcoming
- Show rent at risk amount: "$X,XXX/mo at risk"
- Sort indicator for compliance urgency

### Step 6: Update Dashboard Sorting
In @src/components/PropertyOperations/PropertyOperationsDashboard.tsx:
- Properties with inspection <14 days should sort to top
- Add "Upcoming Inspections" summary stat card
```

---

## PRP 5: Vendor Request System

### Cascade Prompt (Write Mode)

```
I need to implement vendor requests where vendors receive requests (not assignments) and can accept/decline. Coordinator selects winning vendor.

## Context Files
@src/types/index.ts - Add vendor request types
@supabase tables/ - vendor_requests table exists but needs updates
@src/pages/VendorsPage.tsx - Existing page to enhance

## Business Context
- Vendors are REQUESTED, not assigned (they can decline)
- Qualified vendors receive the request based on category
- Vendors respond with timeline and quote
- Coordinator reviews responses and selects vendor
- Same documentation requirements as internal techs

## What I Need

### Step 1: Update Database
Create @supabase tables/vendor_requests_update.sql:
```sql
-- Update vendor_requests table
ALTER TABLE vendor_requests ADD COLUMN IF NOT EXISTS request_details TEXT;
ALTER TABLE vendor_requests ADD COLUMN IF NOT EXISTS max_budget DECIMAL(10,2);
ALTER TABLE vendor_requests ADD COLUMN IF NOT EXISTS response_deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE vendor_requests ADD COLUMN IF NOT EXISTS building_access_info TEXT;

-- Create responses table
CREATE TABLE IF NOT EXISTS vendor_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES vendor_requests(id),
  vendor_id UUID REFERENCES vendors(id),
  response_status TEXT NOT NULL, -- 'accepted', 'declined', 'quoted', 'needs_info'
  proposed_timeline TEXT,
  quoted_amount DECIMAL(10,2),
  decline_reason TEXT,
  notes TEXT,
  responded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE VIEW v_vendor_requests_with_responses AS
SELECT 
  vr.*,
  COUNT(vresp.id) as response_count,
  COUNT(CASE WHEN vresp.response_status IN ('accepted', 'quoted') THEN 1 END) as positive_responses,
  MIN(vresp.quoted_amount) as lowest_quote
FROM vendor_requests vr
LEFT JOIN vendor_responses vresp ON vresp.request_id = vr.id
GROUP BY vr.id;
```

### Step 2: Add Types
In @src/types/index.ts:
```typescript
export type VendorRequestStatus = 'pending' | 'responses_received' | 'vendor_selected' | 'completed' | 'cancelled';
export type VendorResponseStatus = 'accepted' | 'declined' | 'quoted' | 'needs_info';

export interface VendorRequest {
  id: string;
  workOrderId: string;
  category: string;
  urgency: 'emergency' | 'standard' | 'project';
  status: VendorRequestStatus;
  requestDetails: string;
  maxBudget?: number;
  responseDeadline: string;
  buildingAccessInfo?: string;
  selectedVendorId?: string;
  responseCount?: number;
  lowestQuote?: number;
  createdBy: string;
  createdAt: string;
}

export interface VendorResponse {
  id: string;
  requestId: string;
  vendorId: string;
  vendorName?: string;
  responseStatus: VendorResponseStatus;
  proposedTimeline?: string;
  quotedAmount?: number;
  declineReason?: string;
  notes?: string;
  respondedAt: string;
}
```

### Step 3: Create Hook
Create @src/hooks/useVendorRequests.ts:
- createVendorRequest(workOrderId, data): Create request
- fetchVendorRequests(filters): Get requests with status filters
- fetchRequestResponses(requestId): Get all responses
- selectVendor(requestId, vendorId): Mark vendor as selected
- cancelRequest(requestId): Cancel open request
- getQualifiedVendors(category, isEmergency): Find matching vendors

### Step 4: Create Request Modal
Create @src/components/VendorRequestModal.tsx:
- Opens from work order when requesting vendor help
- Category dropdown, Urgency selector, Details textarea
- Max budget input, Response deadline picker
- Building access info textarea
- Shows qualified vendors who will receive request
- Confirm sends to all qualified vendors

### Step 5: Create Responses Panel
Create @src/components/VendorResponsesPanel.tsx:
- Shows all responses for a request
- Compare table: Vendor name, Timeline, Quote, Rating
- "Select This Vendor" button on each response
- Status indicator for selected vendor

### Step 6: Create Request Badge
Create @src/components/VendorRequestBadge.tsx:
- Small badge for work orders with vendor requests
- pending=yellow, responses_received=blue, vendor_selected=green

### Step 7: Integrate into Work Order Preview
In @src/components/WorkOrderPreview.tsx:
- Add "Request Vendor" button when no assignee
- Show VendorRequestBadge if request exists
- Show VendorResponsesPanel if responses exist
```

---

## PRP 6: Morning Queue Enhancement

### Cascade Prompt (Write Mode)

```
I need to enhance the Morning Queue to be the "accountability gate" - all incomplete work from yesterday must be addressed before starting the day.

## Context Files
@src/pages/MorningQueuePage.tsx - Existing page to enhance
@src/hooks/useCoordinatorMorningQueue.ts - Existing hook
@src/types/index.ts - Add queue types

## Business Context
- Shows all work scheduled yesterday that didn't complete
- Shows SLA overdue work orders
- Actions: Approve Reschedule, Reassign, Escalate
- Sorted by deadline urgency (most critical first)
- Stats showing yesterday's completion rate

## What I Need

### Step 1: Add Types
In @src/types/index.ts:
```typescript
export type QueueReason = 'incomplete_yesterday' | 'sla_overdue' | 'stuck' | 'access_issue';
export type SuggestedAction = 'reschedule' | 'reassign' | 'escalate';

export interface MorningQueueItem {
  workOrder: WorkOrder;
  queueReason: QueueReason;
  originalScheduledDate?: string;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  suggestedAction: SuggestedAction;
  suggestedReason: string;
}

export interface MorningQueueStats {
  totalItems: number;
  incompleteFromYesterday: number;
  slaOverdue: number;
  stuckWorkOrders: number;
  accessIssues: number;
  yesterdayCompletionRate: number;
}
```

### Step 2: Update Hook
In @src/hooks/useCoordinatorMorningQueue.ts add/update:
- fetchMorningQueueItems(): Returns MorningQueueItem[] sorted by urgency
- fetchMorningQueueStats(): Returns MorningQueueStats
- approveReschedule(workOrderId, newDate, reason): Log reschedule action
- reassignWorkOrder(workOrderId, newTechId, reason): Change assignment
- escalateWorkOrder(workOrderId, escalationType): Flag for manager
- dismissFromQueue(workOrderId, reason): Mark as addressed

Logic for queue items:
- Include WOs scheduled for yesterday (check scheduledDate) not completed
- Include WOs where slaStatus = 'overdue'
- Include WOs stuck >72 hours (no status change)
- Include WOs with status 'Waiting for Access'

### Step 3: Create Stats Component
Create @src/components/MorningQueueStats.tsx:
- Grid of stat cards at top of page
- Total items, By category breakdown
- Yesterday's completion rate with visual indicator (target 85%)
- Color: green if >85%, yellow 70-85%, red <70%

### Step 4: Create Queue Card
Create @src/components/MorningQueueCard.tsx:
- Shows work order summary
- Queue reason badge (color coded)
- Suggested action with explanation
- Action buttons: Reschedule, Reassign, Escalate, Dismiss
- Expandable to show full work order details
- Deadline badge integration (from PRP 1)

### Step 5: Update Page
In @src/pages/MorningQueuePage.tsx:
- Add MorningQueueStats at top
- Replace current list with MorningQueueCard components
- Sort by: SLA overdue first, then incomplete, then stuck, then access
- Add bulk actions bar: "Approve All Reschedules", "Assign All to [Tech dropdown]"
- Empty state: "✅ All caught up! No items need attention."
```

---

## Execution Order

Run these PRPs in Windsurf Cascade one at a time. Wait for each to complete before starting next.

**Recommended sequence:**

1. **Create .windsurfrules first** (copy from top of document)

2. **PRP 1: Deadline Warning** 
   - Run SQL in Supabase first
   - Then run Cascade prompt
   - Verify badges appear on work orders

3. **PRP 2: Override Audit**
   - No new SQL needed
   - Run Cascade prompt
   - Test override flow

4. **PRP 4: Compliance Deadlines**
   - Run SQL in Supabase first
   - Then run Cascade prompt
   - Verify property cards show inspection dates

5. **PRP 3: Access Tracking**
   - Run SQL in Supabase first
   - Then run Cascade prompt
   - Test on a 'Waiting for Access' work order

6. **PRP 6: Morning Queue** (depends on PRP 1)
   - Run Cascade prompt
   - Verify stats and sorting work

7. **PRP 5: Vendor Requests** (most complex, do last)
   - Run SQL in Supabase first
   - Then run Cascade prompt
   - Test full request→response→select flow

**After each PRP:**
```bash
npm run build  # Must pass
npm run dev    # Check for console errors
```

---

## Windsurf Tips

1. **Use @ references** - Reference files directly: `@src/types/index.ts`

2. **One PRP at a time** - Don't paste multiple PRPs, let Cascade finish

3. **Check Problems tab** - Windsurf auto-detects issues, fix them

4. **Use inline edit (Ctrl+I)** - For small fixes after PRP completes

5. **Run SQL separately** - Supabase SQL editor, not through Cascade

6. **Preview feature** - Use Windsurf's preview to test UI changes live

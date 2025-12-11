# PRP-06: Approval Queue

## Problem Statement

When technicians mark work as "Ready for Review," it should appear in an approval queue for the coordinator. The coordinator reviews photos, verifies work quality, and either approves (marking complete) or rejects (sending back for rework). This enforces the rule that technicians cannot close work orders themselves.

**Current State:**
- May have approval queue page
- May not show photos inline
- Approve/reject buttons may not work
- Queue may not filter correctly
- No tracking of time in queue

**Required State:**
- Clear list of all items awaiting approval
- Inline photo display (before/after/cleanup)
- One-click approve for straightforward completions
- Reject with reason that notifies technician
- Urgency indicators for items waiting too long
- Efficient workflow to process many approvals quickly

---

## Core Principle

**The coordinator is the gatekeeper.** No work order is complete until Kristine (or another coordinator) says it is. This prevents:
- Technicians closing work without proper documentation
- Incomplete work being marked complete
- Bypassing quality control

---

## Queue Contents

### What Appears in Queue

Work orders where:
- status = 'ready_review'
- assigned to a technician in this portfolio
- active = true

Or if using separate approvals table:
- approval.status = 'pending'
- approval.type = 'completion'

### Queue Priority Order

1. **Time Waiting** - Oldest first (FIFO)
2. **Work Order Priority** - Emergency > High > Medium > Low
3. **Deadline Pressure** - Items with approaching deadlines

### Urgency Indicators

Based on time since technician submitted:
- Under 4 hours: Normal
- 4-12 hours: Attention (amber)
- 12-24 hours: Urgent (orange)
- Over 24 hours: Critical (red)

---

## Queue Layout Options

### Option A: List with Expand

List of items, click to expand and see photos:
- Compact view shows many items
- Click expands inline to show photos
- Approve/reject in expanded view

### Option B: Card Grid

Cards showing thumbnail of completion photo:
- Visual scan of work quality
- Click card for full review
- More visual but takes more space

### Option C: Quick Review Mode (Recommended)

Split view:
- Left: scrollable list of queue items
- Right: selected item with full photos
- Keyboard navigation (up/down to select, A to approve, R to reject)

This allows fastest processing - coordinator can work through queue with minimal clicking.

---

## Quick Review Interface

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Approval Queue                           12 pending        │
├──────────────────┬──────────────────────────────────────────┤
│  Queue Items     │  Review: WO-2024-0142                    │
│                  │  ─────────────────────────────────────   │
│  ● WO-0142 🟠    │  Bathroom faucet replacement             │
│    2372 Main 204 │  Tech: Ramon | Submitted: 3 hours ago   │
│    Ramon         │  Property: 2372 Main St | Unit: 204     │
│                  │  ─────────────────────────────────────   │
│  ○ WO-0156      │  PHOTOS                                  │
│    567 Oak 101   │  ┌────────┐ ┌────────┐ ┌────────┐       │
│    Kishan        │  │ Before │ │ After  │ │Cleanup │       │
│                  │  │  📷    │ │  📷    │ │  📷    │       │
│  ○ WO-0167      │  └────────┘ └────────┘ └────────┘       │
│    2372 Main 102 │                                          │
│    Ramon         │  CHECKLIST                               │
│                  │  ☑ Before photos present                 │
│                  │  ☑ After photos show completed work      │
│                  │  ☑ Work area clean                       │
│                  │  ☐ Location verified (GPS)               │
│                  │  ─────────────────────────────────────   │
│                  │  TECH NOTES                              │
│                  │  "Replaced faucet cartridge. Tested,     │
│                  │   no more leaks."                        │
│                  │  ─────────────────────────────────────   │
│                  │  [Approve ✓]  [Reject with Reason]       │
└──────────────────┴──────────────────────────────────────────┘
```

### Queue Item Card (Left)

Each item shows:
- Work order number
- Property/unit
- Technician name
- Time waiting (with urgency color)
- Quick status icons (photos count, has notes)

### Review Panel (Right)

**Header:**
- Work order number
- Description
- Technician and submission time
- Location

**Photos Section:**
- Before, After, Cleanup thumbnails
- Click to enlarge (lightbox)
- Missing photos highlighted in red

**Checklist Section:**
- System-verified items (auto-checked):
  - Before photos present
  - After photos present
  - Cleanup photos present
  - GPS location matches property
  - Photos taken within work window
- Manual verification (coordinator checks):
  - Work appears complete
  - Quality acceptable
  - Area clean

**Tech Notes:**
- What the technician wrote
- Parts used
- Time spent

**Actions:**
- **Approve** - Big green button, marks complete
- **Reject** - Opens rejection modal with reason field

---

## Approval Action

### What Happens on Approve

1. Update work_order.status = 'completed'
2. Update work_order.completed_at = now()
3. Update work_order.completed_by = coordinator user_id
4. Create audit log entry
5. Update approval record (if using separate table)
6. Trigger tenant satisfaction survey (optional)
7. Update technician stats (first_time_fix, completion count)

### UI Behavior

- Item removed from queue
- Next item auto-selected
- Success toast notification
- Queue count decrements

---

## Rejection Action

### Rejection Flow

1. Coordinator clicks "Reject"
2. Modal appears with:
   - Rejection reason (required)
   - Checkbox: Notify technician (default checked)
   - What needs to be fixed (text field)
3. Coordinator fills and confirms
4. Work order returns to 'in_progress' status
5. Technician notified via SMS/app
6. Work order flagged as "needs rework"

### What Happens on Reject

1. Update work_order.status = 'failed_review'
2. Create rework record with reason
3. Notify technician with feedback
4. Create audit log entry
5. Update approval record

### Rejection Reasons (Preset Options)

- Photos missing or unclear
- Work incomplete
- Quality not acceptable
- Cleanup needed
- Wrong location/unit
- Other (free text)

---

## Photo Requirements Enforcement

### Minimum Requirements (from config_rules.json)

- At least 2 photos minimum
- Before photo required
- After photo required
- Cleanup photo required (if applicable)

### Photo Validation

System checks:
- [ ] Has at least one before photo
- [ ] Has at least one after photo
- [ ] Has cleanup photo (if category requires)
- [ ] Photos have GPS metadata
- [ ] GPS matches property location (within 100m)
- [ ] Photos taken within work time window

If any fail, show warning but allow coordinator override.

---

## Lightbox for Photos

When clicking a photo thumbnail:
- Full-screen lightbox opens
- Navigation between photos (arrows or swipe)
- Zoom capability (pinch or scroll)
- Photo metadata shown: timestamp, GPS, type
- Compare mode: Before/After side by side

---

## Keyboard Navigation

For efficient queue processing:

| Key | Action |
|-----|--------|
| ↑/↓ | Navigate queue list |
| Enter | Select item for review |
| A | Approve current item |
| R | Open reject modal |
| 1/2/3 | Quick jump to photo 1/2/3 |
| Esc | Close lightbox/modal |

---

## Bulk Actions

For processing many similar items:

### Bulk Approve
- Select multiple items (checkboxes)
- "Approve Selected" button
- Confirmation modal: "Approve 5 items?"
- All selected marked complete

### Bulk Review Not Recommended
- Each item needs individual inspection
- Bulk approve only for clearly complete items

---

## Filters

### Status Filters
- All Pending (default)
- Urgent (waiting >12h)
- By Technician

### Priority Filters
- Emergency completions first
- High priority
- All

### Date Filters
- Submitted today
- Submitted this week

---

## Edge Cases

### No Photos Uploaded
- Show warning: "No photos attached"
- Prevent approval without override
- Coordinator can override with documented reason

### GPS Mismatch
- Show warning: "Location doesn't match property"
- Could be valid (tech took photo later)
- Coordinator decides whether to accept

### Technician Added Notes Requesting More Work
- Notes say "Also found broken outlet, needs electrician"
- Coordinator sees this, may:
  - Approve current work
  - Create new work order for additional issue
  - Assign same tech for follow-up

### Work Order Has Multiple Assignments
- Work order assigned to 2 technicians
- Each tech submits their portion
- Each appears as separate approval item
- Approving one doesn't complete the WO
- WO complete only when ALL assignments approved

### Tech Resubmits After Rejection
- Tech fixes issues, marks ready_review again
- Shows in queue with "Resubmitted" flag
- Shows rejection history so coordinator knows what was wrong

---

## Approval vs Completion

Clarifying the distinction:

**Approval** = Coordinator reviews technician's submitted work
**Completion** = Work order status becomes 'completed'

If using separate approvals table:
- approval.status: pending → approved
- work_order.status: ready_review → completed

If not using separate table:
- Just track status on work order
- Approval metadata stored in audit log or work order fields

---

## Data Model

### If Using Approvals Table (from PRP-01)

```
approvals:
  id, portfolio_id, work_order_id
  type: 'completion' | 'expense' | 'vendor'
  status: 'pending' | 'approved' | 'rejected'
  submitted_by, submitted_at
  reviewed_by, reviewed_at
  rejection_reason
  before_photos[], after_photos[], cleanup_photos[]
  checklist: JSONB
```

### If Using Work Order Status Only

Work order fields:
- status = 'ready_review' means pending approval
- status = 'completed' means approved
- Rejection creates audit log entry and sets status = 'failed_review'

Photos stored in:
- work_order_photos table, or
- photos[] JSONB field on work order

---

## Performance

### Many Items in Queue

If 50+ pending approvals:
- Virtual scrolling for queue list
- Paginate: show 20 at a time
- Don't load all photos upfront

### Photo Loading

- Show thumbnails first (compressed)
- Load full resolution on demand (lightbox)
- Lazy load photos not in viewport

---

## Validation Criteria

### Queue Display
- [ ] Shows all ready_review work orders
- [ ] Sorted by oldest first
- [ ] Urgency indicators correct
- [ ] Count matches actual pending

### Review Panel
- [ ] Photos display correctly
- [ ] Clicking photo opens lightbox
- [ ] Checklist items show
- [ ] Tech notes visible

### Approve Action
- [ ] Work order status changes to completed
- [ ] completed_at and completed_by set
- [ ] Item removed from queue
- [ ] Audit log created
- [ ] Success feedback shown

### Reject Action
- [ ] Modal opens with reason field
- [ ] Reason required before submit
- [ ] Work order status changes to failed_review
- [ ] Tech notified
- [ ] Item removed from queue

### Keyboard Navigation
- [ ] Arrow keys navigate list
- [ ] A key approves
- [ ] R key opens reject
- [ ] Esc closes modals

---

## Dependencies

**Requires:**
- PRP-01 (Data Layer) - work orders, approvals queries
- PRP-02 (Auth) - only coordinator+ can approve
- PRP-03 (Interactions) - photo lightbox component

**External:**
- Photo storage (Supabase storage or S3)
- Notification system for rejection alerts

---

## Implementation Checklist

### Phase 1: Queue Display
- [ ] Create ApprovalQueue page
- [ ] Fetch pending approvals
- [ ] Display queue list
- [ ] Show urgency indicators

### Phase 2: Review Panel
- [ ] Create review panel component
- [ ] Display work order details
- [ ] Load and display photos
- [ ] Show checklist

### Phase 3: Photo Lightbox
- [ ] Create or integrate lightbox component
- [ ] Navigation between photos
- [ ] Zoom functionality
- [ ] Photo metadata display

### Phase 4: Approve Action
- [ ] Approve button and handler
- [ ] Database update
- [ ] UI update (remove from queue)
- [ ] Success feedback

### Phase 5: Reject Action
- [ ] Reject modal component
- [ ] Reason input and validation
- [ ] Database update
- [ ] Tech notification
- [ ] UI update

### Phase 6: Keyboard Navigation
- [ ] Keyboard event listeners
- [ ] Navigate queue
- [ ] Quick approve/reject

### Phase 7: Polish
- [ ] Bulk approve (optional)
- [ ] Filters
- [ ] Performance optimization
- [ ] Mobile responsiveness

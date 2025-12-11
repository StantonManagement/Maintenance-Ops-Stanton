# PRP-07: Deadline Warning System

## Problem Statement

The core problem the system solves: "We don't know in time if we're going to miss a deadline until it's too late to fix it."

Currently, work orders may have deadline information but it's not surfaced prominently. The coordinator can't see at a glance which items are approaching deadlines and what the financial exposure is if they're missed.

**Current State:**
- Deadline dates may exist on work orders
- No visual countdown or urgency indicators
- No grouping by deadline urgency
- Financial exposure not calculated or shown
- No warning system for approaching deadlines

**Required State:**
- Every work order with a deadline shows countdown
- Color-coded urgency (gray → amber → red)
- Morning queue groups by deadline urgency
- Financial exposure calculated and visible
- Proactive warnings before deadlines hit

---

## Deadline Types

From the system definition, these deadline types exist:

| Type | Clock | Risk |
|------|-------|------|
| Section 8 HQS 24-hour | 24 hours | Abatement = lost rent |
| Section 8 HQS 30-day | 30 days | Abatement = lost rent |
| Section 8 Annual Inspection | Scheduled date | Fail → violation cycle |
| City Code Violation | Varies | Fines, legal action |
| Certificate of Occupancy | Deadline | Can't rent unit |
| Unit Turn (Make-ready) | ASAP | Vacancy loss per day |
| Internal SLA | By difficulty | Tenant complaints |
| Seasonal (Boiler prep) | Before cold | No heat = emergency |

---

## Deadline Countdown Component

### Visual Design

A reusable component that shows deadline pressure:

**States:**
- **30+ days:** Gray, low urgency, text: "28 days"
- **14-30 days:** Light amber, "14 days"
- **7-14 days:** Amber, "7 days"
- **3-7 days:** Orange, "5 days"
- **1-3 days:** Red, "2 days"
- **Today:** Dark red, "TODAY"
- **Past due:** Dark red with icon, "OVERDUE (3 days)"

**Size Variants:**
- **Compact:** Just the badge (for list views)
- **Standard:** Badge + deadline type label
- **Expanded:** Badge + type + exposure amount

### Component Props

```typescript
interface DeadlineCountdownProps {
  deadlineDate: Date;
  deadlineType?: string;
  exposureAmount?: number;
  variant?: 'compact' | 'standard' | 'expanded';
}
```

### Usage

This component appears:
- On every work order card in lists
- In work order detail panel header
- In morning queue items
- On calendar event blocks
- In approval queue items

---

## Urgency Tiers

Based on days until deadline:

| Tier | Days Out | Color | Action |
|------|----------|-------|--------|
| 5: Distant | 30+ | Gray | Monitor |
| 4: Upcoming | 14-30 | Light Amber | Schedule soon |
| 3: Approaching | 7-14 | Amber | Schedule now |
| 2: Imminent | 3-7 | Orange | Assign today |
| 1: Critical | 1-3 | Red | Drop everything |
| 0: Overdue | Past | Dark Red + icon | Emergency |

---

## Financial Exposure Calculation

### Formula

```
exposure_amount = unit_rent × risk_multiplier × days_at_risk
```

**For Section 8:**
- If deadline missed → abatement starts
- Abatement = portion or all of rent until fixed
- Risk = monthly rent × expected abatement duration

**For Vacancy:**
- Each day vacant = 1/30 of monthly rent lost
- Risk = days until can rent × (rent / 30)

**For Code Violations:**
- Fines vary by jurisdiction
- Risk = estimated fine amount

### Exposure Display

- Show as currency: "$1,450"
- Aggregate for views: "Total exposure: $12,400"
- Don't make it the headline - one metric among several
- Only show if above threshold (e.g., >$100)

---

## Morning Queue Redesign

The Morning Queue becomes deadline-aware:

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Morning Queue                            Mon, Dec 11       │
├─────────────────────────────────────────────────────────────┤
│  CAPACITY: 14 items | 28h needed | 32h available | ✓ OK    │
│  EXPOSURE: $12,400 if deadlines missed                      │
├─────────────────────────────────────────────────────────────┤
│  🔴 OVERDUE (2)                                             │
│  ├─ WO-0134  Smoke detector - 2372 Main 204   3 days over  │
│  └─ WO-0145  Door lock - 567 Oak 101          1 day over   │
├─────────────────────────────────────────────────────────────┤
│  🟠 CRITICAL - 1-3 DAYS (3)                                 │
│  ├─ WO-0156  No heat - 890 Pine 301           2 days left  │
│  ├─ WO-0167  HQS violation - 2372 Main 102    2 days left  │
│  └─ WO-0178  Ceiling leak - 567 Oak 205       3 days left  │
├─────────────────────────────────────────────────────────────┤
│  🟡 THIS WEEK - 3-7 DAYS (5)                                │
│  ├─ ...                                                     │
└─────────────────────────────────────────────────────────────┘
```

### Grouping

Items grouped by urgency tier:
1. Overdue (red section)
2. Critical 1-3 days (orange section)
3. This week 3-7 days (amber section)
4. Upcoming 7-14 days (collapsed by default)
5. Future 14+ days (collapsed)

### Capacity Summary

Top bar shows:
- **Items:** Count of work orders needing attention
- **Hours needed:** Sum of estimated_duration
- **Hours available:** Sum of tech capacity
- **Status:** ✓ OK / ⚠️ Tight / ❌ Over

---

## Warning System

### Proactive Alerts

The system should warn BEFORE deadlines hit:

**14 Days Out:**
- Flag work orders without schedule
- "WO-0134 has Section 8 deadline in 14 days, not scheduled"

**7 Days Out:**
- More urgent flag
- If unscheduled: "⚠️ Needs immediate scheduling"

**3 Days Out:**
- Critical warning
- If unassigned: "🚨 3 days to deadline, no tech assigned"

**1 Day Out:**
- Emergency
- Coordinator notification
- Consider reassigning from lower priority work

### Notification Triggers

When to notify coordinator:
- Work order enters "critical" tier (3 days)
- Work order becomes overdue
- Deadline changed to sooner date
- Scheduled work displaced by override

---

## Work Order Deadline Fields

### Required Fields

```sql
deadline_date DATE,          -- When it must be done
deadline_type TEXT,          -- section_8_24hr, code_violation, etc.
exposure_amount DECIMAL,     -- Calculated risk in dollars
deadline_source TEXT,        -- inspection, violation_notice, internal
```

### Deadline Type Values

```
section_8_24hr       -- Life safety, 24 hour max
section_8_30day      -- Standard HQS, 30 day max
section_8_annual     -- Annual inspection date
code_violation       -- City code enforcement
certificate_occupancy -- CO deadline
unit_turn            -- Make-ready for new tenant
internal_sla         -- Internal service level
seasonal             -- Boiler prep, winterization
vendor_contract      -- Contractor deadline
```

### Auto-Setting Deadlines

Some deadlines can be auto-calculated:
- Section 8 violation uploaded → +30 days (or +24hr if life safety)
- Move-out notice received → +14 days (or lease end)
- Internal SLA by priority: Emergency +1 day, High +3 days, Medium +7 days

---

## List View Integration

Every list that shows work orders should include deadline info:

### Work Orders Table

Add deadline column:
| ... | Deadline | Exposure | ... |
|-----|----------|----------|-----|
| ... | 🔴 2 days | $1,450 | ... |
| ... | 🟡 12 days | - | ... |
| ... | - | - | ... |

Sortable by deadline (default sort option).

### Filters

Add deadline filters:
- Overdue
- Due this week
- Due this month
- No deadline set

---

## Calendar Integration

Calendar event blocks show deadline pressure:

- Color-code blocks by deadline urgency (not just priority)
- Or add small deadline indicator on block
- Overdue work shows prominently

### Unscheduled Panel

Sort unscheduled work orders by:
1. Overdue first
2. Then by days until deadline ascending
3. Then by priority

---

## Edge Cases

### No Deadline Set
- Work order without deadline_date
- Don't show countdown
- Optionally flag: "No deadline set"
- Sort to bottom when sorting by deadline

### Deadline in Past (Overdue)
- Show "OVERDUE" with days past
- Always show in red
- Always sort to top
- Track cumulative exposure

### Deadline Changed
- Inspection rescheduled → deadline moves
- Audit log entry for change
- Recalculate urgency tier

### Work Completed Before Deadline
- Completed date < deadline date
- Good! Track success metrics
- Don't show deadline warning after completion

### Multiple Deadlines
- Some work orders might have multiple deadlines
- Use earliest deadline for primary display
- Show all in detail view

---

## Reporting

### Deadline Performance Report

Track:
- % of deadlines met
- Average days before deadline completed
- Exposure avoided (completed before deadline)
- Exposure incurred (missed deadlines)

### Weekly Summary

"This week: 24 deadlines, 22 met (92%), $4,200 exposure avoided"

---

## Validation Criteria

### Countdown Component
- [ ] Shows correct days until deadline
- [ ] Color matches urgency tier
- [ ] Updates when date changes
- [ ] Handles past dates (overdue)

### Morning Queue
- [ ] Groups by urgency tier
- [ ] Shows correct counts per tier
- [ ] Capacity summary accurate
- [ ] Exposure total calculated

### Warning System
- [ ] Flags work orders at threshold days
- [ ] Notifications trigger at right times
- [ ] Unscheduled items flagged

### Integration
- [ ] Deadline shows in work order lists
- [ ] Deadline sortable as column
- [ ] Deadline shows in detail panel
- [ ] Calendar shows deadline urgency

---

## Dependencies

**Requires:**
- PRP-01 (Data Layer) - deadline fields on work_orders
- PRP-03 (Interactions) - integration with work order displays

**Integrates With:**
- Morning Queue page
- Work Orders page
- Calendar/Dispatch page
- Approval Queue

---

## Implementation Checklist

### Phase 1: Data
- [ ] Add deadline fields to work_orders if missing
- [ ] Create deadline_type enum or check constraint
- [ ] Backfill existing data where possible

### Phase 2: Countdown Component
- [ ] Create DeadlineCountdown component
- [ ] Implement urgency tier logic
- [ ] Style all tiers with correct colors
- [ ] Add variant props (compact/standard/expanded)

### Phase 3: Morning Queue
- [ ] Redesign with deadline grouping
- [ ] Add capacity summary
- [ ] Add exposure total
- [ ] Group items by tier

### Phase 4: List Integration
- [ ] Add deadline column to work orders table
- [ ] Make sortable
- [ ] Add deadline filters

### Phase 5: Warnings
- [ ] Create warning logic for approaching deadlines
- [ ] Add notifications or flags
- [ ] Surface unscheduled items with deadlines

### Phase 6: Exposure Calculation
- [ ] Implement exposure formula
- [ ] Calculate per work order
- [ ] Aggregate for views
- [ ] Only show above threshold

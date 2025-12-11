# PRP-IWO-04: Coordinator Queue & Notifications

## Goal
Give Kristine visibility into incomplete work orders, a queue for manual reschedule decisions, and a morning summary notification.

## Dependencies
- PRP-IWO-01 (database schema)
- PRP-IWO-03 (auto-reschedule logic)

## Success Criteria
- [ ] Morning summary shows count of auto-rescheduled vs needs-review
- [ ] Reschedule Review queue in sidebar/dashboard
- [ ] Queue shows high/emergency WOs awaiting manual reschedule
- [ ] Each item shows tech's reason, notes, voice transcription
- [ ] Kristine can assign new date/time/tech
- [ ] Notification on new items added to queue

---

## Morning Summary Notification

Delivered via:
- In-app notification (bell icon badge)
- Optional: SMS/email (Phase 2)

Content:
```
Yesterday's Incomplete Work Orders

✓ 2 auto-rescheduled (normal priority)
⚠️ 1 awaiting your review (high priority)

[View Details]
```

Triggered: Daily at configured time (e.g., 6am) OR on first coordinator login

---

## Reschedule Review Queue

### Location
- New sidebar item: "Reschedule Review" with badge count
- OR: Section in existing Approvals page
- Badge shows count of items needing action

### Queue Item Display

```
┌─────────────────────────────────────────────────────────┐
│ WO #2195 - HVAC not cooling          HIGH PRIORITY     │
│ Building C, Unit 101                                    │
│ Originally scheduled: Mon Dec 9                         │
├─────────────────────────────────────────────────────────┤
│ Tech: Ramon                                             │
│ Reason: Ran out of time                                 │
│ Notes: "Previous job in 302 took 4 hours, water damage │
│         was worse than reported"                        │
│                                                         │
│ 🔊 [Play voice note]                                    │
├─────────────────────────────────────────────────────────┤
│ Reschedule to:                                          │
│ [Date picker] [Time picker] [Tech dropdown]             │
│                                                         │
│ [Assign to Different Tech]  [Schedule with Ramon]       │
└─────────────────────────────────────────────────────────┘
```

### Fields Shown
- Work order summary (ID, title, property, unit)
- Priority badge (prominent for high/emergency)
- Original scheduled date
- Technician who had it
- Reason code + display label
- Tech's notes
- Voice note player (if exists)
- Transcription text (if exists)
- Parts expected date (if parts_needed)

### Actions
- Select new date/time
- Keep same tech OR reassign
- "Schedule" button executes reschedule
- Optional: "Call Tenant First" action

---

## New View: `v_coordinator_reschedule_queue`

Returns:
- All items from `incomplete_wo_reasons`
- WHERE assignment.priority IN ('high', 'emergency')
- OR reason_code = 'additional_issues_found'
- AND no reschedule_event exists yet
- JOIN work order details, tech name, etc.

---

## New Hook: `useRescheduleQueue`

```typescript
interface QueueItem {
  assignmentId: string;
  workOrder: WorkOrder;
  technician: Technician;
  reason: IncompleteReason;
  originalDate: Date;
}

// Returns
{
  items: QueueItem[];
  loading: boolean;
  reschedule: (assignmentId, newDate, newTime, techId?) => Promise<void>;
  markReviewed: (assignmentId) => Promise<void>;
}
```

---

## Morning Summary Hook: `useMorningSummary`

```typescript
interface MorningSummary {
  autoRescheduledCount: number;
  awaitingReviewCount: number;
  autoRescheduledItems: SummaryItem[];
  awaitingReviewItems: SummaryItem[];
  generatedAt: Date;
}
```

Query: Yesterday's reschedule_events grouped by rescheduled_by ('system' vs 'coordinator' pending)

---

## Components

### `RescheduleQueuePage` or `RescheduleQueueSection`
- List of QueueItems
- Filter by priority, tech, date
- Sort by priority (emergency first), then date

### `RescheduleQueueCard`
- Single queue item display
- Inline reschedule form
- Voice note player
- Action buttons

### `MorningSummaryBanner`
- Dismissible banner at top of dashboard
- Shows summary counts
- Link to queue

### `MorningSummaryNotification`
- Bell icon notification
- Click expands to summary
- "View Queue" action

---

## Implementation Tasks

### Task 1: Create coordinator queue view
- SQL view `v_coordinator_reschedule_queue`
- Join all needed data

### Task 2: Create queue hook
- `useRescheduleQueue`
- Fetch, reschedule, mark reviewed actions

### Task 3: Create morning summary hook
- `useMorningSummary`
- Calculate counts from yesterday's data

### Task 4: Build queue UI
- RescheduleQueuePage or section
- RescheduleQueueCard component
- Add to sidebar navigation

### Task 5: Build notification UI
- MorningSummaryBanner
- Badge on sidebar item
- Bell notification integration

### Task 6: Add real-time updates
- Subscribe to new queue items
- Update badge count live

---

## Notification Triggers

| Event | Notification |
|-------|--------------|
| High/Emergency routed to queue | Badge increment + optional toast |
| Morning summary time | Summary notification appears |
| Queue item > 4 hours old | Escalation reminder |

---

## Validation
- [ ] Queue only shows items needing coordinator action
- [ ] Auto-rescheduled items NOT in queue (just in summary)
- [ ] Reschedule action updates assignment and logs event
- [ ] Badge count accurate and updates in real-time
- [ ] Voice notes playable inline
- [ ] Can reassign to different tech

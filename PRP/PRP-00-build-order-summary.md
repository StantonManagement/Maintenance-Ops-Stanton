# UX Redesign PRPs - Build Order & Summary

## Overview

Five PRPs to transform the Maintenance Operations Center from an entity-based app into a deadline-driven resource allocation command center.

## Build Sequence

```
PRP-01: Deadline Countdown Component
    ↓
    ├──→ PRP-02: Morning Queue Redesign
    ├──→ PRP-03: Dispatch Split View  
    ├──→ PRP-04: Work Orders Data Grid
    └──→ PRP-05: Approval Queue Quick Mode
```

**PRP-01 must be completed first** - it's the foundational component used by all others.

PRPs 02-05 can be done in any order after 01, but recommended sequence:
1. **PRP-04 (Work Orders Grid)** - Highest impact, fixes the most common view
2. **PRP-03 (Dispatch)** - Enables assignment workflow
3. **PRP-02 (Morning Queue)** - Command center for daily ops
4. **PRP-05 (Approval Queue)** - Speed improvement for reviews

## Time Estimates

| PRP | Complexity | Estimated Hours |
|-----|------------|-----------------|
| 01 - Deadline Component | Simple | 2-4 hours |
| 02 - Morning Queue | Medium | 6-10 hours |
| 03 - Dispatch Split | Medium-High | 8-12 hours |
| 04 - Work Orders Grid | High | 10-14 hours |
| 05 - Approval Quick Mode | Medium | 6-10 hours |

**Total: ~32-50 hours** depending on existing component reuse

## Key Design Decisions

### Financial Exposure Treatment
- Shown as ONE metric among several, not the headline
- Badge format: "$1.2k" - compact, not screaming
- Only displayed if > $500 threshold
- Sortable column, not default sort
- Tooltip for full breakdown

### Deadline as Primary Indicator
- DeadlineCountdown component is the visual anchor
- Color-coded urgency tiers (gray → amber → red)
- Default sort in all lists
- Groups items by deadline tier in Morning Queue

### Bulk Actions Everywhere
- Checkbox columns on all grids
- Toolbar appears when items selected
- Common actions: Assign, Change Status, Export
- Reduces click-by-click tedium

### Detail Panels as Overlays
- Slide in from right, don't push content
- Only opened when needed
- Keyboard dismissable (ESC)
- Quick actions stay inline

## Files That Will Be Created/Modified

### New Files
```
src/lib/deadline-utils.ts
src/components/ui/DeadlineCountdown.tsx
src/components/morning-queue/CapacitySummary.tsx
src/components/morning-queue/DeadlineGroup.tsx
src/components/morning-queue/QueueItemRow.tsx
src/components/dispatch/DemandPanel.tsx
src/components/dispatch/SupplyPanel.tsx
src/components/dispatch/DemandCard.tsx
src/components/dispatch/SupplyCard.tsx
src/components/work-orders/WorkOrderGrid.tsx
src/components/work-orders/WorkOrderRow.tsx
src/components/work-orders/BulkActionsToolbar.tsx
src/components/work-orders/WorkOrderDetailPanel.tsx
src/components/approval-queue/QuickReviewCard.tsx
src/components/approval-queue/PhotoThumbnailGrid.tsx
src/components/approval-queue/QuickRejectModal.tsx
src/components/ui/PhotoLightbox.tsx
src/hooks/useMorningQueue.ts
src/hooks/useDispatchData.ts
src/hooks/useDispatchAssignment.ts
src/hooks/useBulkActions.ts
src/hooks/useApprovalKeyboard.ts
src/hooks/useGridKeyboard.ts
```

### Modified Files
```
src/pages/MorningQueue.tsx
src/pages/Dispatch.tsx
src/pages/WorkOrders.tsx
src/pages/ApprovalQueue.tsx
src/components/ui/index.ts (add exports)
```

## Validation Strategy

Each PRP has checkpoints. Key validation commands:

```bash
# Type checking
npm run build  # or npx tsc --noEmit

# Run dev server
npm run dev

# Visual verification
# Navigate to each page, verify layouts
```

## What Success Looks Like

### For Kristine (Coordinator)
- Morning: Open Morning Queue, see capacity vs demand at a glance
- "Will we make it?" answered in 10 seconds
- Bulk reschedule stuck items in 3 clicks
- Approve 20 work orders in 5 minutes

### For the System
- Deadline pressure is the organizing principle
- Assignment happens where you can see both sides
- High-volume operations are fast, not clicky
- Financial exposure informs but doesn't dominate

## Notes for Windsurf

- Each PRP is self-contained with validation checkpoints
- Follow the dependency order (01 first)
- Check existing component patterns before creating new ones
- Use existing hooks/utilities where available
- Test each checkpoint before proceeding

## Questions to Resolve Before Building

1. What table component library is currently in use? (shadcn? custom?)
2. Is there an existing lightbox/modal pattern?
3. Are there existing photo components to reuse?
4. What's the current state management approach? (context? zustand? redux?)
5. Is Supabase realtime already configured?

# UX Audit Report - Maintenance Operations Center

**Date:** December 10, 2025
**Evaluator:** Windsurf Cascade

## Executive Summary
The application has strong functional foundations but suffers from significant screen real estate inefficiency and navigation friction. The "Dispatch Center" has been recently improved with a split view, but other core pages like "Work Orders" and "Approvals" rely on a list-detail pattern that often leaves 50%+ of the screen empty when no item is selected. There is a lack of bulk actions across the board, which is critical for a high-volume coordinator role.

---

## 1. Dispatch Center (`/dispatch`)

**Current State:**
- recently updated to a split view (Map 60% / List 40%).
- Contains "Pull Tech" and "Filter" actions.
- Shows map visualization and tech list.

**Actionability:**
- **Good:** Can assign work orders from the grid.
- **Missing:** Drag-and-drop assignment from map markers or list items is not evident.
- **Missing:** Clear indication of *unassigned* work orders on this screen. It focuses on Technicians, but the "Demand" side (Work Orders) is hidden in modals or other pages.

**Layout:**
- **Improved:** The new split layout uses screen real estate much better than the previous toggle.

**Recommended Fix:**
- Add a "Unassigned Work Orders" side panel or overlay to allow drag-and-drop assignment directly on the Dispatch map/list.
- Ensure the map pins show current status color (Available/Busy).

**Priority:** High

---

## 2. Morning Queue (`/morning-queue`)

**Current State:**
- Lists items requiring attention.
- Uses `MorningQueueCard` for items.
- Stats at the top.

**Information Density:**
- **Issue:** Uses a generic card list. On a large monitor, a single column of cards wastes left/right space.
- **Good:** "Alert" banner highlights count.

**Operational Purpose:**
- **Gap:** "What's my exposure today?" - Financial exposure isn't prominent on individual items unless clicked/expanded.

**Recommended Fix:**
- Switch to a dense table view or multi-column card grid for larger screens.
- Add a prominent "Total Financial Exposure" metric at the top.
- Add bulk "Approve All" or "Reschedule All" actions for specific categories (e.g., "Reschedule all 'No Access'").

**Priority:** Medium

---

## 3. Work Orders (`/work-orders`)

**Current State:**
- Master-detail view (`WorkOrderList` left, `WorkOrderPreview` right).
- When no WO is selected, the right side (preview) is likely empty or static placeholder.

**Screen Real Estate:**
- **Wasted Space:** The preview panel is fixed width (`w-[480px]`). On a 1920px screen, this leaves a lot of empty space or forces the list to be overly wide.
- **Empty State:** If no ID selected, right side is just a placeholder.

**Actionability:**
- **Missing:** Bulk select checkboxes in the list.
- **Missing:** Quick filters for "My Assignees" or "Urgent".

**Recommended Fix:**
- Implement a true data grid (table) for the main view with sortable columns.
- Make the detail panel sliding/resizable or a modal to allow the list to consume full width when searching.
- Add "Batch Action" toolbar when multiple items selected.

**Priority:** High

---

## 4. Approval Queue (`/approval-queue`)

**Current State:**
- Similar structure to Work Orders (List + Detail Preview).
- `ApprovalInterface` component handles the logic.

**Actionability:**
- **Good:** Explicit Approve/Reject actions.
- **Missing:** Inline "Before/After" photo comparison in the list view itself (thumbnail) to allow 1-second approvals without opening full detail.

**Recommended Fix:**
- Add "Quick Review" mode: Show Before/After photos directly in the list row with "Approve" button, expanding detail only if rejected.

**Priority:** Medium

---

## 5. Technicians (`/technicians`)

**Current State:**
- Grid of `TechnicianCard` components.
- Shows status, rating, contact info.

**Information Density:**
- **Good:** Cards are dense and informative.
- **Missing:** "Schedule for the week" is hidden behind a click.

**Operational Purpose:**
- **Gap:** "Who's overloaded?" - The card shows "Today's Stats" but doesn't clearly flag overload/burnout risk across the week.

**Recommended Fix:**
- Add a "Weekly Load" mini-chart to the card.
- Add a "Skills Matrix" view to quickly find who has a specific certification.

**Priority:** Low (Polish)

---

## 6. Calendar (`/calendar`)

**Current State:**
- Uses `react-big-calendar`.
- Sidebar for `UnscheduledQueue`.

**Usability:**
- **Issue:** `UnscheduledQueue` sidebar takes up 300px fixed.
- **Good:** Drag and drop is implemented (conceptually).

**Missing Features:**
- **Conflict Highlighting:** No obvious visual indicator of double-booking (unless overlapping events do this automatically, but explicit "Conflict" warnings are better).
- **Travel Time:** No visualization of travel time between jobs.

**Recommended Fix:**
- Add "Travel Buffer" visualization between events.
- Allow filtering calendar by Technician Skills (e.g., "Show me only Plumbers").

**Priority:** Medium

---

## 7. Property Operations (`/property-operations`)

**Current State:**
- Dashboard with Summary Stats and `PropertyHealthCard` list.
- Sorts by operational urgency.

**Information Density:**
- **Good:** Sorting by urgency bubbles problems to top.
- **Issue:** List of cards can get long.

**Missing Features:**
- **Bulk Compliance:** Cannot see a "Master Compliance Schedule" across all properties, only per-property cards.

**Recommended Fix:**
- Add a "Compliance View" (Calendar/Table) to see all expiring licenses across portfolio in one list.

**Priority:** Low

---

## 8. Analytics (`/analytics`)

**Current State:**
- Tabbed interface (Overview, Techs, Properties).
- Uses Chart.js (or similar) wrappers.

**Actionability:**
- **Missing:** "Export Report" is present but likely needs date range customization.
- **Missing:** Drill-down (Click bar chart -> see work orders).

**Recommended Fix:**
- Make charts interactive (click to filter list).

**Priority:** Low

---

## Prioritized Fix List

1.  **Critical**: **Work Orders List View** - Convert to a dense, sortable Data Grid with bulk actions. The current list-detail is too slow for volume.
2.  **High**: **Dispatch Unassigned View** - Add a clear list of unassigned work orders to the Dispatch screen so the coordinator knows what needs assignment without switching pages.
3.  **High**: **Approval Queue "Quick Mode"** - Inline photos/actions to speed up the review loop.
4.  **Medium**: **Morning Queue Layout** - optimize for desktop width (table view).
5.  **Low**: **Technician Weekly Load** - Add visualization to cards.


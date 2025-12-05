# PRP-06: Approvals Queue

## Goal
Build the approvals view where coordinators review and approve/reject completed work, expenses, and vendor requests.

## Success Criteria
- [ ] Shows pending approvals in list
- [ ] Filter by type: All, Completion, Expense, Vendor
- [ ] Detail view shows evidence (photos, notes)
- [ ] Approve button with confirmation
- [ ] Reject button requires reason
- [ ] Approved/Rejected items move to history tab
- [ ] Badge count updates in nav

---

## Context

**Business rule:** Only coordinators can approve. Technicians mark "ready_review", coordinators complete.

**Approval types:**
- Completion: Work order ready for final approval
- Expense: Cost over threshold needs approval
- Vendor: External vendor selection needs approval
- Override: Emergency override needs acknowledgment

---

## Tasks

### Task 1: Approvals Page
CREATE `src/pages/ApprovalsPage.tsx`
- Uses MainLayout
- Tabs: Pending, Approved, Rejected
- Left: ApprovalList
- Right: ApprovalDetail (when selected)
- Route: /approvals, /approvals/:id

### Task 2: Approval List
CREATE `src/components/approvals/ApprovalList.tsx`
- Uses useApprovals hook
- Filter chips by type
- Sort by submitted_at (oldest first = most urgent)
- Shows urgency indicator (>24h waiting = red)

### Task 3: Approval Card
CREATE `src/components/approvals/ApprovalCard.tsx`
- Type badge (Completion, Expense, etc.)
- Work order ID + description snippet
- Submitted by + time ago
- Amount (if expense type)
- Urgency indicator
- Click to select

### Task 4: Approval Detail
CREATE `src/components/approvals/ApprovalDetail.tsx`
- Header: type, work order link, submitted by
- Work order summary section
- Evidence section: photos grid, notes
- For expenses: amount, vendor, invoice number
- Action buttons at bottom

### Task 5: Photo Review Grid
CREATE `src/components/approvals/PhotoReviewGrid.tsx`
- Before/After side-by-side comparison
- Cleanup photo
- Click to enlarge
- Checklist overlay: "Work appears complete", "Area is clean"

### Task 6: Approval Actions
CREATE `src/components/approvals/ApprovalActions.tsx`
- Approve button (green, primary)
- Reject button (red, secondary)
- Approve: confirmation modal, then calls approve()
- Reject: modal with required reason textarea, then calls reject()
- Loading state during API call

### Task 7: Rejection Modal
CREATE `src/components/approvals/RejectionModal.tsx`
- "Why are you rejecting this?" prompt
- Textarea for reason (required, min 10 chars)
- Common reasons as quick-select chips
- Cancel and Confirm buttons

---

## Validation Checkpoints

1. Navigate to `/approvals` - pending items load
2. Click approval - detail panel shows
3. Approve - item moves to Approved tab
4. Reject without reason - blocked
5. Reject with reason - item moves to Rejected tab
6. Nav badge updates after actions

---

## Files to Create
- src/pages/ApprovalsPage.tsx
- src/components/approvals/ApprovalList.tsx
- src/components/approvals/ApprovalCard.tsx
- src/components/approvals/ApprovalDetail.tsx
- src/components/approvals/PhotoReviewGrid.tsx
- src/components/approvals/ApprovalActions.tsx
- src/components/approvals/RejectionModal.tsx

---

## Anti-Patterns
- ❌ Don't allow approve without viewing photos
- ❌ Don't allow reject without reason
- ❌ Don't auto-refresh (manual for Phase 1)
- ❌ Don't lose rejection reason on modal close

---

## Phase 1 Complete
After PRP-06, Phase 1 is functionally complete. All core views working with Supabase data.

## Next Phase
PRP-07 begins Phase 2: Calendar & Scheduling

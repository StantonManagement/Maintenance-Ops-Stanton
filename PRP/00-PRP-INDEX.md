# PRP-00: Implementation Index & Dependencies

## Overview

These PRPs provide a comprehensive implementation path for the Maintenance Operations Center. They are designed to be executed by AI coding tools (Windsurf, Cursor) with clear context and validation criteria.

---

## Document Set

| PRP | Name | Purpose |
|-----|------|---------|
| 01 | Data Layer Foundation | Database schema, multi-portfolio architecture, RLS |
| 02 | Auth & Permissions | Roles, permissions, login flow, protected routes |
| 03 | Work Order Interactions | Dropdowns, filters, detail panel, sorting |
| 04 | Scheduling & Calendar | Drag-drop assignment, calendar grid, tech rows |
| 05 | Messages & Communication | SMS integration, translation, reply workflow |
| 06 | Approval Queue | Completion review, photos, approve/reject |
| 07 | Deadline Warning System | Countdown indicators, urgency tiers, exposure |

---

## Dependency Graph

```
PRP-01: Data Layer Foundation
    │
    └──► PRP-02: Auth & Permissions
              │
              └──► PRP-03: Work Order Interactions
              │         │
              │         └──► PRP-06: Approval Queue
              │
              └──► PRP-04: Scheduling & Calendar
              │
              └──► PRP-05: Messages & Communication
```

**Execution Order:**
1. PRP-01 first (everything depends on it)
2. PRP-02 second (auth needed for permissions)
3. PRP-03, 04, 05, 06 can be done in parallel after 01+02

---

## Recommended Build Sequence

### Week 1: Foundation
- **PRP-01** - Create all database tables, set up RLS policies
- **PRP-02** - Implement auth flow, role context, permission checks

### Week 2: Core Interactions
- **PRP-03** - Wire all work order interactions (dropdowns, filters, detail)
- **PRP-06** - Approval queue (depends on detail panel patterns from 03)

### Week 3: Scheduling
- **PRP-04** - Calendar and drag-drop (most complex)

### Week 4: Communication
- **PRP-05** - Messages integration with SMS

---

## Shared Components

These components are used across multiple PRPs:

| Component | Used In | Created In |
|-----------|---------|------------|
| PermissionGate | 03, 04, 05, 06 | 02 |
| WorkOrderDetailPanel | 03, 04, 06 | 03 |
| PhotoLightbox | 03, 06 | 03 or 06 |
| StatusBadge | 03, 04, 05, 06 | 03 |
| TechnicianSelect | 03, 04 | 03 |
| FilterChips | 03, 05, 06 | 03 |

---

## Database Tables Summary

From PRP-01:
- portfolios
- portfolio_users
- properties
- units
- work_orders
- technicians
- messages
- approvals
- vendors
- audit_log

From PRP-02:
- profiles (extends auth.users)

---

## Key Business Rules

These rules must be enforced across all PRPs:

1. **Coordinator Authority**
   - Only coordinator+ can mark work orders complete
   - Technicians can only mark "ready_review"
   - Enforced in PRP-02 (permissions), validated in PRP-06 (approval)

2. **Portfolio Scoping**
   - All queries must filter by active portfolio
   - RLS policies enforce this at database level
   - UI must never show data from other portfolios

3. **Photo Requirements**
   - Before/after/cleanup photos required for completion
   - GPS verification where possible
   - Enforced in PRP-06

4. **Workload Limits**
   - Max 6 work orders per technician per day
   - System warns but coordinator can override
   - Tracked in PRP-04

5. **Status Transitions**
   - Only valid transitions allowed (from config_rules.json)
   - Role-restricted transitions
   - Enforced in PRP-03

---

## Validation Strategy

Each PRP has validation criteria. After implementing each:

1. **Type Check:** `npm run build` or `npx tsc --noEmit`
2. **Functional Test:** Manual verification of each criteria
3. **Permission Test:** Try actions with different roles
4. **Edge Cases:** Test empty states, errors, conflicts

---

## External Dependencies

| Service | Used For | Required By |
|---------|----------|-------------|
| Supabase | Database, Auth, Storage | All |
| Twilio | SMS send/receive | PRP-05 |
| Translation API | Message translation | PRP-05 |
| FullCalendar | Calendar component | PRP-04 |

---

## Questions to Answer Before Starting

1. **Calendar Library:** FullCalendar or custom implementation?
2. **Drag Library:** React DnD, dnd-kit, or native HTML5?
3. **State Management:** React context, Zustand, or other?
4. **Existing Components:** What's already built that can be reused?
5. **SMS Agent:** Is it running? What's the API interface?

---

## Definition of Done

A PRP is complete when:
- [ ] All implementation checklist items checked
- [ ] All validation criteria pass
- [ ] Code builds without errors
- [ ] Works for all defined roles
- [ ] Edge cases handled
- [ ] No console errors

---

## Notes for AI Coding Tools

**For Windsurf:**
- Work through one implementation checklist item at a time
- Verify each phase before moving to next
- Reference existing patterns in codebase
- Ask for clarification if requirements are ambiguous

**For Cursor:**
- Use PRPs as context in chat
- Reference with @file to specific sections
- Build incrementally with checkpoints

---

## File Location

When implementing, create files in:
```
src/
├── components/
│   ├── work-orders/
│   ├── scheduling/
│   ├── messages/
│   └── approvals/
├── hooks/
├── lib/
├── pages/
└── types/
```

Follow existing project patterns for naming and structure.

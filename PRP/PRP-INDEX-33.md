# Maintenance Operations Center - PRP Index

## Overview
25 Production-Ready Patterns (PRPs) organized across 3 phases. Execute in order within each phase.

---

## Phase 1: Communication Core (Foundation) ✅ COMPLETE
**Goal:** Centralize communication and basic ticket tracking

| PRP | Name | Complexity | Status |
|-----|------|------------|--------|
| PRP-01 | Foundation & Data Layer | Tier 2 | ✅ Complete |
| PRP-02 | Layout & Navigation | Tier 2 | ✅ Complete |
| PRP-03 | Work Order List & Filtering | Tier 2 | ✅ Complete |
| PRP-04 | Work Order Detail Panel | Tier 2 | ✅ Complete |
| PRP-05 | Messages UI Shell | Tier 2 | ✅ Complete |
| PRP-06 | Approvals Queue | Tier 2 | ✅ Complete |

**Phase 1 Deliverables:**
- Supabase connected with 4 tables
- 3-column responsive layout with routing
- Work order CRUD with filtering
- Message threads (manual refresh)
- Approval workflow

---

## Phase 2: Intelligence & Automation ✅ COMPLETE
**Goal:** Reduce manual coordination effort

| PRP | Name | Complexity | Status |
|-----|------|------------|--------|
| PRP-07 | Calendar & Scheduling | Tier 3 | ✅ Complete |
| PRP-08 | Real-Time Updates | Tier 2 | ✅ Complete |
| PRP-09 | Technician Dispatch View | Tier 2 | ✅ Complete |
| PRP-10 | Automated Communications | Tier 2 | ✅ Complete |
| PRP-11 | Workload Protection | Tier 2 | ✅ Complete |
| PRP-16 | Voice Work Order Creation | Tier 2 | ✅ Complete (UI) |
| PRP-17 | Vendor Management System | Tier 3 | ✅ Complete (UI) |
| PRP-18 | Mobile Technician App | Tier 3 | ✅ Complete (UI) |
| PRP-19 | GPS Location Tracking | Tier 2 | ✅ Complete (UI) |
| PRP-21 | Settings & Configuration | Tier 2 | ✅ Complete (UI) |

**Phase 2 Deliverables:**
- Drag-and-drop scheduling
- Live updates via Supabase Realtime
- Dispatch command center
- Auto-send notifications
- Capacity limits with override tracking
- Voice work order creation
- Vendor request workflow
- Mobile technician interface
- GPS tracking and ETA
- System configuration UI

---

## Phase 3: Enterprise Scale ✅ COMPLETE (Core)
**Goal:** Business intelligence and predictive operations

| PRP | Name | Complexity | Status |
|-----|------|------------|--------|
| PRP-12 | Analytics Dashboard | Tier 2 | ✅ Complete |
| PRP-13 | Financial Intelligence | Tier 3 | ✅ Complete (UI) |
| PRP-14 | Unit & Tenant Profiles | Tier 2 | ✅ Complete |
| PRP-15 | AI Suggestions & Automation | Tier 3 | ✅ Complete (UI) |
| PRP-20 | Preventive Maintenance Scheduling | Tier 2 | ✅ Complete (UI) |
| PRP-22 | Rules Engine Configuration UI | Tier 3 | ✅ Complete (UI) |
| PRP-23 | Multi-Property Portfolio Management | Tier 3 | ✅ Complete (UI) |
| PRP-24 | Tenant Self-Service Portal | Tier 3 | ✅ Complete (UI) |
| PRP-25 | IoT Sensor Integration | Tier 3 | ✅ Complete (UI) |

**Phase 3 Deliverables:**
- Operational metrics dashboard
- CapEx vs Maintenance classification
- Section 8 four-tier categorization
- Equipment lifecycle tracking
- AI-powered suggestions with confidence scores
- Preventive maintenance automation
- Visual rules editor
- Multi-property/region support
- Tenant self-service portal
- IoT sensor alerts

---

## Execution Guidelines

### For Each PRP:
1. Read entire PRP before starting
2. Verify dependencies are complete
3. Complete tasks in sequence
4. Run validation checkpoints
5. Don't proceed if validation fails

### Complexity Tiers:
- **Tier 1:** <100 lines, ~30 min
- **Tier 2:** 100-500 lines, ~2-4 hours
- **Tier 3:** 500+ lines, ~1-2 days

### Key Constraints (All Phases):
- AF_ tables are READ ONLY
- Only coordinators can mark work complete
- Emergency overrides require notification
- All AI suggestions need human approval

### Critical Import Rules (Prevents TypeScript Errors):
- **ALWAYS** import types from `../types` or `../../types`, NEVER from component files
- **NEVER** `import { WorkOrder } from './WorkOrderCard'` → use `import { WorkOrder } from '../types'`
- **NEVER** `import { Technician } from './TechnicianCard'` → use `import { Technician } from '../types'`
- Supabase client is at `src/services/supabase.ts` (NOT `src/lib/`)
- `src/vite-env.d.ts` MUST exist for `import.meta.env` to work

### Async Hook Rules:
- `useCapacityCheck().checkCapacity()` is ASYNC - must `await` it
- Pass `technicianId: string` NOT `technician: Technician` object
- Example: `const capacity = await checkCapacity(tech.id);`

---

## File Summary

```
PRPs/
├── Phase 1/
│   ├── PRP-01-Foundation-Data-Layer.md
│   ├── PRP-02-Layout-Navigation.md
│   ├── PRP-03-WorkOrder-List.md
│   ├── PRP-04-WorkOrder-Detail.md
│   ├── PRP-05-Messages-UI.md
│   └── PRP-06-Approvals-Queue.md
├── Phase 2/
│   ├── PRP-07-Calendar-Scheduling.md
│   ├── PRP-08-RealTime-Updates.md
│   ├── PRP-09-Dispatch-View.md
│   ├── PRP-10-Automated-Communications.md
│   ├── PRP-11-Workload-Protection.md
│   ├── PRP-16-Voice-Work-Orders.md
│   ├── PRP-17-Vendor-Management.md
│   ├── PRP-18-Mobile-Technician-App.md
│   ├── PRP-19-GPS-Location-Tracking.md
│   └── PRP-21-Settings-Configuration.md
├── Phase 3/
│   ├── PRP-12-Analytics-Dashboard.md
│   ├── PRP-13-Financial-Intelligence.md
│   ├── PRP-14-Unit-Tenant-Profiles.md
│   ├── PRP-15-AI-Suggestions.md
│   ├── PRP-20-Preventive-Maintenance.md
│   ├── PRP-22-Rules-Engine-UI.md
│   ├── PRP-23-Multi-Property-Portfolio.md
│   ├── PRP-24-Tenant-Portal.md
│   └── PRP-25-IoT-Sensors.md
└── PRP-INDEX.md (this file)
```

---

## Quick Start

**To begin Phase 1:**
1. Copy PRP-01 into Cursor
2. Let Cursor implement
3. Validate checkpoints
4. Move to PRP-02
5. Repeat through PRP-06

**Phase 1 estimated time:** 2-3 days
**Phase 2 estimated time:** 5-8 days
**Phase 3 estimated time:** 7-10 days

---

## Notes

- PRPs are instructions, not code. Cursor generates the implementation.
- Each PRP should be executable independently within its phase.
- Validation checkpoints must pass before proceeding.
- Anti-patterns section prevents common mistakes.
- PRPs 16-25 cover future features from project roadmap.

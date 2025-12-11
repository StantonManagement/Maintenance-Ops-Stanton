# WINDSURF SESSION CONTEXT - Maintenance Ops Center

## PROJECT OVERVIEW

**Project Name:** Maintenance Operations Center  
**Purpose:** Property maintenance dispatch and work order management system for multi-family residential properties  
**Users:** Maintenance coordinators, technicians, and property managers managing work orders, scheduling, and tenant requests  
**Scale:** Multi-property portfolio management with real-time dispatch capabilities

---

## TECH STACK

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18.3 + TypeScript 5.2 |
| **Build** | Vite 6.3 |
| **Styling** | TailwindCSS 3.3 |
| **Components** | shadcn/ui (Radix UI primitives) |
| **Icons** | Lucide React |
| **State** | React hooks + Supabase realtime subscriptions |
| **Backend** | Supabase (PostgreSQL + Auth + Realtime) |
| **Routing** | React Router DOM 7.10 |
| **Calendar** | react-big-calendar |
| **Charts** | Recharts |
| **Drag & Drop** | @dnd-kit |
| **Forms** | react-hook-form |

---

## UI WIREFRAME

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  HEADER BAR                                                    [Search] [User]  │
├────────────┬────────────────────────────────────────────────────────────────────┤
│            │                                                                    │
│  SIDEBAR   │  MAIN CONTENT AREA                                                 │
│            │                                                                    │
│  ┌──────┐  │  ┌─────────────────────────────────┬──────────────────────────┐   │
│  │ Logo │  │  │                                 │                          │   │
│  └──────┘  │  │  LIST / TABLE VIEW              │  DETAIL PANEL            │   │
│            │  │                                 │                          │   │
│  ────────  │  │  • Work Order Cards             │  • Selected WO Details   │   │
│  Work      │  │  • Filterable/Sortable          │  • Message Thread        │   │
│  Orders    │  │  • Priority Badges              │  • Actions               │   │
│  ────────  │  │  • Status Indicators            │  • Assignment Info       │   │
│  Messages  │  │                                 │                          │   │
│  ────────  │  │                                 │                          │   │
│  Approvals │  │                                 │                          │   │
│  ────────  │  │                                 │                          │   │
│  Calendar  │  │                                 │                          │   │
│  ────────  │  │                                 │                          │   │
│  Dispatch  │  │                                 │                          │   │
│  ────────  │  │                                 │                          │   │
│  Techs     │  │                                 │                          │   │
│  ────────  │  └─────────────────────────────────┴──────────────────────────┘   │
│  Analytics │                                                                    │
│  ────────  │                                                                    │
│  Settings  │                                                                    │
│            │                                                                    │
└────────────┴────────────────────────────────────────────────────────────────────┘

DISPATCH VIEW LAYOUT:
┌────────────┬────────────────────────────────────────────────────────────────────┐
│  SIDEBAR   │  ┌─────────────────────┐  ┌─────────────────────────────────────┐  │
│            │  │  UNASSIGNED QUEUE   │  │  TECHNICIAN COLUMNS                 │  │
│            │  │                     │  │                                     │  │
│            │  │  [Drag WO Cards]    │  │  Mike    Sarah    James    Maria    │  │
│            │  │                     │  │  ┌───┐   ┌───┐    ┌───┐    ┌───┐   │  │
│            │  │  • Emergency        │  │  │WO │   │WO │    │WO │    │   │   │  │
│            │  │  • High Priority    │  │  ├───┤   ├───┤    ├───┤    │   │   │  │
│            │  │  • Normal           │  │  │WO │   │WO │    │   │    │   │   │  │
│            │  │                     │  │  ├───┤   │   │    │   │    │   │   │  │
│            │  │                     │  │  │WO │   │   │    │   │    │   │   │  │
│            │  │                     │  │  └───┘   └───┘    └───┘    └───┘   │  │
│            │  │                     │  │  4/6     2/6      1/6      0/6     │  │
│            │  └─────────────────────┘  └─────────────────────────────────────┘  │
└────────────┴────────────────────────────────────────────────────────────────────┘

CALENDAR VIEW LAYOUT:
┌────────────┬────────────────────────────────────────────────────────────────────┐
│  SIDEBAR   │  ┌─────────────────────────────────────────────────────────────┐   │
│            │  │  [< Prev]  December 2024  [Next >]    [Day][Week][Month]    │   │
│            │  ├─────────────────────────────────────────────────────────────┤   │
│            │  │  Mon    Tue    Wed    Thu    Fri    Sat    Sun              │   │
│            │  │  ┌────┬────┬────┬────┬────┬────┬────┐                       │   │
│            │  │  │    │    │    │ 5  │ 6  │ 7  │ 8  │                       │   │
│            │  │  │    │    │    │[WO]│[WO]│    │    │                       │   │
│            │  │  ├────┼────┼────┼────┼────┼────┼────┤                       │   │
│            │  │  │ 9  │ 10 │ 11 │ 12 │ 13 │ 14 │ 15 │                       │   │
│            │  │  │[WO]│[WO]│    │[WO]│    │    │    │                       │   │
│            │  │  └────┴────┴────┴────┴────┴────┴────┘                       │   │
│            │  └─────────────────────────────────────────────────────────────┘   │
└────────────┴────────────────────────────────────────────────────────────────────┘
```

### Key UI Components
- **NavigationSidebar** - Collapsible left nav with route links
- **MainLayout** - Wraps all authenticated routes with sidebar
- **WorkOrderList** - Master list with filters, search, sorting
- **WorkOrderDetailView** - Slide-out panel with full WO details
- **DispatchInterface** - Kanban-style drag-drop assignment board
- **TechnicianCard** - Capacity bar, skills, assigned WOs

---

## DATA MODEL

### Core Entities

**work_orders** (via AppFolio sync - `AF_work_order_new`)
- `id`: TEXT (primary key)
- `title`, `description`, `status`, `priority`
- `property_code`, `property_address`, `unit`
- `resident_name`, `assignee`

**technicians**
- `id`: UUID
- `name`, `phone`, `email`, `role`
- `status`: available | busy | off_duty | in-transit
- `skills`: TEXT[]
- `max_daily_workload`: INTEGER (default 6)
- `current_load`: INTEGER

**work_order_assignments**
- `id`: UUID
- `work_order_id` → work_orders
- `technician_id` → technicians
- `scheduled_date`, `scheduled_time_start/end`
- `status`: scheduled | in_progress | ready_for_review | completed | cancelled

**messages**
- `id`: UUID
- `work_order_id` → work_orders
- `sender_type`: coordinator | technician | tenant | system
- `content`, `is_read`

**override_history** - Capacity override audit trail  
**audit_logs** - General action logging

### Key Relationships
- Work Orders → many Assignments → one Technician
- Work Orders → many Messages
- Technicians have max 6 daily assignments (capacity rule)

---

## ARCHITECTURE PATTERNS

### Data Fetching
- Custom hooks in `src/hooks/` fetch from Supabase
- `useWorkOrders`, `useTechnicians`, `useMessages` are primary data hooks
- `useRealtimeSubscription` provides live updates via Supabase channels
- Many Phase 2/3 features still use mock data fallbacks

### State Management
- **Server state**: Supabase queries via hooks
- **UI state**: Local React state + URL params for filters
- **Real-time**: Supabase subscriptions for work orders and messages

### API/Backend Logic
- Business logic split between client hooks and Supabase RPC functions
- Capacity enforcement: `check_technician_capacity()` RPC
- Views: `v_todays_schedule`, `v_pending_approvals`, `v_technician_workload`

---

## FILE STRUCTURE

```
src/
├── AppRouter.tsx         # Route definitions
├── main.tsx              # Entry point
├── index.css             # Global styles + Tailwind
├── components/
│   ├── layout/           # MainLayout wrapper
│   ├── ui/               # shadcn/ui components (49 items)
│   ├── NavigationSidebar.tsx
│   ├── WorkOrderList.tsx
│   ├── WorkOrderDetailView.tsx
│   ├── DispatchInterface.tsx
│   ├── TechniciansView.tsx
│   ├── calendar/         # Calendar components
│   ├── dispatch/         # Dispatch board components
│   ├── analytics/        # Dashboard charts
│   └── [feature]/        # Feature-specific components
├── hooks/                # 25 custom hooks
│   ├── useWorkOrders.ts
│   ├── useTechnicians.ts
│   ├── useMessages.ts
│   ├── useCapacityCheck.ts
│   └── ...
├── pages/                # 22 page components
│   ├── WorkOrdersPage.tsx
│   ├── DispatchPage.tsx
│   ├── CalendarPage.tsx
│   └── ...
├── portal/               # Tenant Portal (separate flow)
├── services/             # API services (aiService is mock)
└── types/index.ts        # Core TypeScript types
```

---

## DOMAIN TERMINOLOGY

| Term | Meaning |
|------|---------|
| **Work Order (WO)** | A maintenance request/task to be completed |
| **Coordinator** | Staff who assigns and manages work orders |
| **Technician** | Field worker who completes maintenance tasks |
| **Capacity** | Max 6 work orders per technician per day |
| **Override** | Bypassing capacity limit with documented reason |
| **Ready for Review** | Technician marks complete, awaiting coordinator approval |
| **Dispatch** | Assigning technicians to work orders |
| **PTE** | Permission to Enter (tenant consent) |
| **Turnover** | Unit preparation between tenants |
| **Portfolio** | Collection of properties under management |

---

## CURRENT PHASE

### What's Built ✅
- **Work Order Management** - List, detail, filter, search (real Supabase)
- **AI Work Order Classification** - Priority, skills, time estimate, parts prediction (OpenAI integration)
- **Technician List** - Capacity display, skills, status
- **Calendar View** - Drag-drop scheduling
- **Dispatch Board** - Visual assignment interface
- **Override Flow** - Capacity bypass with reason/notes

### Functional UI with Mock Data 🔶
- **Messaging** - UI exists but data is mocked/disconnected from DB
- **Sidebar Stats** - Counters are hardcoded
- **Voice Queue** - Transcription display, AI extraction (mock)
- **Vendor Management** - Directory, requests (mock)
- **GPS Tracking** - Map with simulated positions
- **Preventive Maintenance** - Schedules, compliance (mock)
- **Rules Engine** - View/toggle rules (mock)
- **Portfolio Dashboard** - Hierarchy view (mock)
- **Tenant Portal** - Request flow (mock, code: 123456)
- **IoT Sensors** - Dashboard, alerts (mock)
- **Future Features** - Roadmap preview (mock)

### UI Placeholders Only 🔴
- "New Rule" / "Edit Rule" buttons
- "Add Vendor" button
- "New Schedule" button
- "Configure Thresholds" button

### Key Constraints/Decisions
- **Capacity limit of 6** enforced client-side (needs server enforcement)
- **AppFolio sync** provides work order data to `AF_work_order_new` table
- **AI Service** uses OpenAI (gpt-4o-mini) via `src/services/aiClassificationService.ts`
- **RLS policies** are permissive for development

---

## PATTERNS TO FOLLOW

### Do This ✅
```tsx
// Use existing hooks for data fetching
const { workOrders, loading, error } = useWorkOrders();
const { classify } = useAIClassification(); // Use for AI features

// Use shadcn/ui components from src/components/ui/
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Type everything with src/types/index.ts
import type { WorkOrder, Technician, Priority } from "@/types";

// Toast notifications via sonner
import { toast } from "sonner";
toast.success("Work order assigned");
```

### Don't Do This ❌
```tsx
// Don't create new mock data files - use existing hooks
const mockData = [...]; // Bad

// Don't bypass capacity checks
if (tech.current_load >= 6) return; // Check exists, don't skip

// Don't hardcode IDs
const techId = "11111111-1111-1111-1111-111111111111"; // Use from data
```

---

## CURRENT TASK

[Describe what you're trying to accomplish in this session]

### Acceptance Criteria
- [ ] [Specific outcome 1]
- [ ] [Specific outcome 2]

### Files Likely Involved
```
src/hooks/useXxx.ts
src/pages/XxxPage.tsx
src/components/Xxx.tsx
```

---

## REFERENCE DOCS

| Document | Purpose |
|----------|---------|
| `CURRENT_ISSUES.md` | Known bugs and broken data flows (Messages, Sidebar) |
| `FEATURE_STATUS.md` | What's functional vs mock |
| `PROJECT-REVIEW.md` | Gap analysis and remediation needs |
| `DATA_FLOW_AUDIT.md` | Data flow documentation |
| `PRP/PRP-INDEX.md` | Remediation plan index |
| `PRP/PRP-DATABASE-SCHEMA.md` | Supabase table definitions |
| `PRP/PRP-DATABASE-FUNCTIONS.md` | RPC functions and views |
| `PRP/PRP-HOOK-CLEANUP.md` | Hook refactoring guide |
| `PRP/PRP-USER-STORIES.md` | End-to-end user flow specs |
| `supabase tables/*.sql` | SQL schema files |

---

## QUICK COMMANDS

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

*Last Updated: December 8, 2025*

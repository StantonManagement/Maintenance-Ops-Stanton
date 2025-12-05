# PRP-01: Foundation & Data Layer

## Goal
Establish Supabase connection, TypeScript interfaces, and data hooks. Everything downstream depends on this.

## Success Criteria
- [x] Supabase client configured and connecting
- [x] TypeScript interfaces defined for: WorkOrder, Technician, FilterState, SortState
- [x] Read from AF_work_order_new table (READ ONLY)
- [x] work_order_actions table for write operations
- [x] Data hooks working: useWorkOrders, useMessages, useTechnicians, useApprovals, useCapacityCheck
- [x] `tsc --noEmit` passes
- [x] `src/vite-env.d.ts` exists for Vite types

---

## Context

**Dependencies to install:** `@supabase/supabase-js`

**Environment variables needed:**
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

**Constraints:**
- AF_ tables are READ ONLY - never write to them
- All new tables use UUID primary key
- PascalCase columns in AF_ tables → camelCase in TypeScript

---

## Tasks

### Task 1: Supabase Client
CREATE `src/services/supabase.ts` (NOT src/lib/)
- Initialize Supabase client with env vars
- Export typed client
- Throw error if env vars missing
- Export `WorkOrderFromDB` type matching AF_work_order_new columns
- Export `WorkOrderAction` type for writable actions table

### Task 2: TypeScript Interfaces
CREATE `src/types/index.ts` (single file, no database.ts needed)

**IMPORTANT: Use these EXACT property names to avoid type errors:**

**WorkOrder interface (matches UI components):**
```typescript
export interface WorkOrder {
  id: string;
  serviceRequestId: string;
  workOrderNumber: number;
  title: string;
  description: string;
  propertyCode: string;
  propertyAddress: string;
  unit: string;
  ownerEntity?: string;
  residentName: string;
  priority: Priority;
  status: WorkOrderStatus;
  createdDate: string;
  createdTime?: string;
  vendor?: string;
  assignee?: string;
  permissionToEnter?: "yes" | "no" | "n/a";
  residentAvailability?: string;
  unread?: boolean;
  messageCount?: number;
  lastMessage?: string;
  originalLanguage?: string;
  // ... additional optional fields
}
```

**Technician interface:**
```typescript
export interface Technician {
  id: string;
  name: string;
  capacity: { current: number; max: number };
  skills: string[];
  currentLocation: string;
  inTransit: boolean;
  status: "available" | "in-transit" | "unavailable";
  assignedWorkOrders: Array<{ id: string; title: string; status: string; }>;
}
```

**Also export:** Priority, WorkOrderStatus, FilterState, SortState

### Task 3: Database Schema
**NOTE: AF_work_order_new already exists and is READ ONLY**

Only create writable tables:
- `work_order_actions` - for status changes, notes, assignments
- RPC function `check_technician_capacity` for capacity checks

DO NOT create work_orders, messages, technicians, approvals tables - use AF_ tables for reads.

### Task 4: AF_ Sync View
Create SQL view `v_af_work_orders` that:
- Selects from AF_work_order_new
- Transforms PascalCase to snake_case
- Normalizes status and priority values

### Task 5: Data Hooks
CREATE `src/hooks/useWorkOrders.ts`
- Fetch with filtering (status, priority, assignedTo, dateRange, hasUnreadMessages)
- Sorting support
- Return: workOrders, loading, error, refetch, totalCount

CREATE `src/hooks/useMessages.ts`
- Fetch by work_order_id
- sendMessage function
- Return: messages, loading, error, refetch, sendMessage

CREATE `src/hooks/useTechnicians.ts`
- Fetch all technicians
- Computed: availableTechnicians (is_available AND under capacity)
- Return: technicians, loading, error, refetch, availableTechnicians

CREATE `src/hooks/useApprovals.ts`
- Fetch with status filter
- approve() and reject() functions
- Return: approvals, pendingCount, loading, error, refetch, approve, reject

CREATE `src/hooks/index.ts` - barrel export

---

## Validation Checkpoints

1. `npx tsc --noEmit` - zero errors
2. Supabase tables visible in dashboard
3. `SELECT * FROM work_orders LIMIT 1` runs without error
4. Hook imports work without TypeScript errors

---

## Files to Create
- src/services/supabase.ts (NOT src/lib/)
- src/types/index.ts (single file)
- src/vite-env.d.ts (REQUIRED for import.meta.env)
- src/hooks/useWorkOrders.ts
- src/hooks/useMessages.ts
- src/hooks/useTechnicians.ts
- src/hooks/useApprovals.ts
- src/hooks/useCapacityCheck.ts
- src/hooks/useRealtimeSubscription.ts

---

## Anti-Patterns
- ❌ Don't write to AF_ tables (READ ONLY)
- ❌ Don't use `any` type
- ❌ Don't skip error handling in hooks
- ❌ Don't hardcode Supabase credentials
- ❌ Don't import types from component files (always from `../types`)
- ❌ Don't forget `src/vite-env.d.ts` for Vite env types

---

## Next
PRP-02: Layout & Navigation Shell (depends on this completing)

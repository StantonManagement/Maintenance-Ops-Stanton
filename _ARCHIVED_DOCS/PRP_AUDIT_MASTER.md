# PRP Audit Master

This document contains the verified current state of the codebase to support the generation of accurate Product Requirements Packages (PRPs).

## 1. File Structure & Paths

### Core Directories
- **Components**: `src/components/`
- **Hooks**: `src/hooks/`
- **Services**: `src/services/`
- **Pages**: `src/pages/`
- **Types**: `src/types/`
- **SQL**: `supabase tables/`

### Key Verified Components
- `src/components/WorkOrderList.tsx` (Shared list/table view)
- `src/components/PropertyOperations/PropertyHealthCard.tsx` (Dashboard card)
- `src/components/PropertyOperations/PropertyOperationsDashboard.tsx` (Container)
- `src/pages/ApprovalsPage.tsx` (Existing approval queue)

## 2. Component Patterns

### WorkOrderList Pattern
**Features:**
- Handles "cards" vs "table" view modes.
- Supports bulk actions (Assign, Message).
- Filters: Unread, Priority Groups (Emergency, High, etc.).
- Props: `selectedWorkOrderId`, `onSelectWorkOrder`, `viewMode`.

### Card Pattern (PropertyHealthCard)
**Features:**
- Visual status indicators via border colors and emojis.
- Grid layout for metrics (Open, Emergency, Overdue).
- Click handler for drill-down.

## 3. Database Schema Status

### Work Order Actions (`work_order_actions`)
The source of truth for all write operations on work orders.
- **Table Name**: `work_order_actions`
- **Columns**: `id`, `work_order_id`, `action_type`, `action_data` (JSONB), `created_by`, `created_at`, `photos`.
- **Action Types**:
  - `assignment`
  - `status_change`
  - `note`
  - `photo`
  - `scheduling`
  - `approval`
  - `message`

### Vendors (`vendors` & `vendor_requests`)
**Status**: Tables defined in SQL but may need migration run.
- **Vendors**: `name`, `company`, `phone`, `email`, `categories` (Array), `emergency_available`, `hourly_rate`.
- **Requests**: `work_order_id`, `category`, `urgency`, `status`, `selected_vendor_id`.

### Compliance / Inspections
**Status**: **Partial / Planned**.
- **View**: `v_property_health_metrics` currently returns `NULL` for `nextInspectionDate`.
- **Table**: `compliance_deadlines` exists in `preventive_maintenance.sql` but is not yet joined to the health view.

## 4. Business Logic & Constants

### SLA / Deadlines
**Status**: Client-side calculation.
- **Location**: `src/services/analyticsService.ts` -> `calculateOverdueCount`.
- **Rules**:
  - **Emergency**: 2 hours
  - **High**: 24 hours
  - **Medium**: 72 hours
  - **Low**: 168 hours (1 week)
- **Breach Flag**: `hoursUntilSLABreach` exists on `WorkOrder` type but is not yet populated by the backend view.

### Approval Queue
**Status**: **Functional**.
- **Route**: `/approval-queue`
- **Logic**: Filters `AF_work_order_new` for status `['Ready for Review', 'READY_REVIEW', 'ready_review']`.
- **Actions**: Approve (sets status 'Completed'), Reject (sets status 'In Progress').

## 5. Routing (`src/AppRouter.tsx`)

**Existing Routes**:
- `/work-orders` & `/work-orders/:id`
- `/messages` & `/messages/:id`
- `/approval-queue` & `/approval-queue/:id`
- `/duplicates`
- `/morning-queue`
- `/dispatch`
- `/property-operations`
- `/technicians`
- `/calendar`
- `/vendors`
- `/analytics`, `/financials`, `/settings`, `/overrides`
- `/tenant-portal` (Standalone)

## 6. Type Definitions

### Work Order Status
Defined in `src/types/index.ts` as `WorkOrderStatus`:
- `NEW`
- `ASSIGNED`
- `IN PROGRESS`
- `Ready for Review`
- `COMPLETED`
- `Waiting for Access`

### Priority
- `emergency`, `high`, `normal`, `low`

## 7. Missing / Needs Construction
1.  **Inspection Data Connection**: The `property_health_view.sql` needs to be updated to join with `compliance_deadlines` to populate inspection dates.
2.  **SLA Calculation in DB**: Move SLA logic from `analyticsService.ts` to a SQL view/function so `hoursUntilSLABreach` is populated on fetch.
3.  **Vendor Integration**: UI exists (`VendorsPage`) but needs to be fully wired to `vendor_requests` table.

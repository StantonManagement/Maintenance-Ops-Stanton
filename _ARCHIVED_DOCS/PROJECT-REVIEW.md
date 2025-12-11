# Project Review & Gap Analysis

## Overview
This document outlines the current state of the Maintenance Operations Center application following the completion of Phase 3. It identifies data flow gaps, architectural blind spots, and areas requiring attention before production deployment.

---

## 🔴 Critical Data Layer Gaps

### 1. Mock Data Dependency
The application currently relies heavily on mock data for Phase 2 and Phase 3 features. While acceptable for design, this disconnects the UI from the actual backend.

| Feature | Current State | Required Action |
|---------|---------------|-----------------|
| **Technicians** | `useTechnicians` attempts Supabase connection but falls back to `MOCK_TECHNICIANS` if table is missing. | Create `technicians` table in Supabase and seed data. |
| **Analytics** | `AnalyticsPage` uses hardcoded `MOCK_METRICS` and `MOCK_TRENDS`. | Refactor to calculate metrics from `useWorkOrders` data or create Supabase Views. |
| **Financials** | `FinancialReportsPage` uses static constants (`BUDGETS`, `TENANT_CHARGES`). | Create `financial_records` table and connect hooks. |
| **Profiles** | `UnitProfilePage` and `TenantProfilePage` display static mock data. | Create `units`, `tenants`, and `equipment` tables in Supabase. |
| **Capacity** | `useCapacityCheck` calculates load based on client-side array filters. | Implement database-level count query or RPC function for accuracy. |

### 2. AI Service Stub
The `src/services/aiService.ts` is a complete mock using `setTimeout`.
- **Issue:** No actual AI analysis is performed.
- **Fix:** Integrate OpenAI/Anthropic API or a local LLM endpoint.

---

## 🟠 Architectural & Navigation Blind Spots

### 1. Sidebar Navigation Gaps
Several new pages created in Phase 3 are registered in the Router but missing from the `NavigationSidebar`. Users cannot navigate to them easily.
- **Missing Link:** `/financials` (Financial Intelligence)
- **Missing Link:** `/overrides` (Override History Log)
- **Missing Link:** `/ai-settings` (AI Configuration)

### 2. Client-Side Logic Risks
Critical business logic currently resides in the frontend:
- **Capacity Enforcement:** The "Max 6 Work Orders" rule is enforced by `useCapacityCheck` in the UI. A user calling the Supabase API directly could bypass this.
- **Override Logging:** The override action just logs to console/toast in some paths. It needs to insert a record into an `audit_logs` table.

### 3. Route Parameter Handling
- `UnitProfilePage` and `TenantProfilePage` are set up to receive `:id` params, but the components currently ignore the ID and render static "Unit 205" / "Maria Lopez" data.

---

## 🟡 UI/UX Polish

### 1. Empty States
- **History Tabs:** In `UnitProfilePage` and `TenantProfilePage`, the "History" tabs display "Coming soon" placeholders instead of actual lists.
- **Map View:** The Dispatch "Map View" is a placeholder div.

### 2. Performance
- **Recharts:** The analytics charts load all data at once. For a production dataset, this should be paginated or aggregated on the server.

---

## ✅ Strong Points (Retain)
- **Foundation Injection:** The Router + Layout architecture is solid and scalable.
- **Type Safety:** Centralized `types/index.ts` is used consistently (with minor exceptions).
- **Real-Time:** The `useRealtimeSubscription` hook is correctly implemented for the core `work_orders` table.
- **Component Modularity:** The breakdown of large views (like `CalendarPage`) into smaller components (`ScheduleCalendar`, `UnscheduledQueue`) makes the codebase maintainable.

---

## Recommended Remediation Plan

1.  **Database Migration:** Run SQL scripts to create the missing tables (`technicians`, `units`, `tenants`, `financials`).
2.  **Navigation Update:** Add missing items to `NavigationSidebar.tsx`.
3.  **Hook Connection:** Update `useTechnicians` and `useFinancials` to strictly read from Supabase.
4.  **Aggregator Functions:** Create Supabase Database Functions (RPC) for the analytics calculations to offload heavy lifting from the client.

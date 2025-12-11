# Current Issues & Data Flow Gaps

This document outlines the current discrepancies in the application, specifically focusing on why data isn't flowing properly between the sidebar, list views, and detail views.

## 1. Sidebar vs. Message List Discrepancy
**Issue:** The Sidebar shows "4" messages (3 waiting), but the Message list says "No messages yet".

**Root Cause:**
- **Sidebar Data is Mocked:** The counts in `NavigationSidebar.tsx` are hardcoded static values. They do not query the database.
  - *Code Reference:* `NavigationSidebar.tsx` lines 165-171 (`4`, `3 waiting for reply`).
- **Message List is Real (but incomplete):** The `WorkOrderList` component tries to fetch *real* work orders and filter them by `messageCount > 0`.
- **Missing Data Mapping:** The `useWorkOrders` hook fetches work orders from the database, but it does **not** fetch or map a `messageCount` field. As a result, `messageCount` is always `undefined`, the filter fails, and the list remains empty.

## 2. Conversation Thread Data
**Issue:** Clicking a work order (if one were visible) would show the same conversation for every order.

**Root Cause:**
- **Mocked Conversations:** The `ConversationThread` component uses a static `mockMessages` array. It does not fetch messages from the database based on the selected `workOrder.id`.
- **No Message Database Table:** While there is a `work_order_actions` table that might store notes, there isn't a dedicated `messages` table or view integrated into the frontend yet.

## 3. Overview Stats Discrepancy
**Issue:** "Today's Overview" numbers (New Requests: 12, etc.) do not match the actual work order list.

**Root Cause:**
- **Hardcoded Stats:** The stats card in `NavigationSidebar.tsx` uses hardcoded numbers and does not calculate them from the actual `workOrders` data.

## 4. Phase Locking Logic
**Issue:** Features appear locked/unlocked based on UI flags rather than user permissions.

**Root Cause:**
- **Static Locking:** The locking logic is purely frontend-based in `NavigationSidebar.tsx` using a hardcoded `phase` property on navigation items.

## 5. Future Features Preview Status
**Issue:** The "Future Features Preview" page shows a mix of functional and placeholder content.

**Root Cause:**
- **Incomplete Implementation:** The `FutureFeatures.tsx` component only implements specific views (like Calendar and Analytics previews).
- **Hardcoded Roadmap:** The list of features for Phase 2 and Phase 3 is hardcoded in the component (`phase2Features`, `phase3Features` arrays) and does not reflect dynamic system capabilities or enabled modules. Most tabs result in a generic "Coming Soon" placeholder.

## Summary of "Why data isn't flowing"
The application is currently in a **hybrid state**:
1.  **Work Order List** is reading from the real `AF_work_order_new` database table.
2.  **Sidebar & Stats** are completely static (mock data).
3.  **Messages** do not exist in the connected database tables yet, or aren't being fetched.
4.  **Future Features** are largely UI mocks designed to show the roadmap.

## Recommended Fixes
1.  **Sidebar:** Create a `useSidebarStats` hook to fetch real counts (unread messages, active alerts, approval queue) from Supabase.
2.  **Messages:** 
    - Ensure a `messages` table exists in Supabase.
    - Update `useWorkOrders` to join/count messages for each work order.
    - Update `ConversationThread` to fetch real messages by `work_order_id`.
3.  **Overview:** Update sidebar to calculate stats from the `useWorkOrders` hook or a dedicated stats endpoint.
4.  **Feature Flags:** Move phase/feature locking logic to a backend configuration or database table (e.g., `app_settings`) so features can be enabled/disabled dynamically without code changes.

# Missing Implementation Requirements
To "make it work" (fix data flow and replace mocks with real functionality), the following specific components must be built:

## 1. Database Schema
- [ ] **Messages Table**: Create a `messages` table to store tenant-coordinator communication.
    - Fields: `id`, `work_order_id`, `sender_type` (tenant/coordinator), `content`, `translated_content`, `language`, `read_at`, `created_at`.
- [ ] **Message Counts**: Update `AF_work_order_new` view (or create a wrapper view) to include a `message_count` and `unread_message_count` column for each work order.
- [ ] **Sidebar Stats RPC**: Create a Supabase RPC function `get_dashboard_stats()` that returns aggregated counts for:
    - Unread messages
    - Work orders ready for approval
    - Active alerts
    - New requests today

## 2. API & Hooks
- [ ] **`useMessages` Hook**: Create hook to fetch/send messages from the new `messages` table.
- [ ] **`useSidebarStats` Hook**: Create hook to call `get_dashboard_stats()` and refresh periodically.
- [ ] **Update `useWorkOrders`**: Ensure the `message_count` field is properly fetched and mapped to the frontend model.

## 3. UI Integration
- [ ] **Connect Sidebar**: Replace hardcoded "4" and "3 waiting" with data from `useSidebarStats`.
- [ ] **Connect Message List**: Update filter logic to use the real `message_count` property.
- [ ] **Connect Conversation Thread**: Replace `mockMessages` with data from `useMessages`.
- [ ] **Real-time Updates**: Subscribe to the `messages` table changes to update counts instantly.

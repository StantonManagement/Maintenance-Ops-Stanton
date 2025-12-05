# PRP-08: Real-Time Updates (Phase 2)

## Goal
Add Supabase Realtime subscriptions so the UI updates instantly when data changes. No more manual refresh.

## Success Criteria
- [ ] Work order list updates when new WO created
- [ ] Status changes reflect immediately
- [ ] Messages appear in thread without refresh
- [ ] Approval count badge updates in real-time
- [ ] Calendar updates when work scheduled
- [ ] Multiple browser tabs stay in sync

---

## Context

**Technology:** Supabase Realtime (postgres_changes)

**Subscription strategy:**
- Subscribe at page/view level
- Unsubscribe on unmount
- Optimistic updates for user actions

**Performance:** Don't subscribe to entire tables, filter by relevant criteria

---

## Tasks

### Task 1: Realtime Hook Factory
CREATE `src/hooks/useRealtimeSubscription.ts`
- Generic hook for subscribing to table changes
- Parameters: table, filter, event types (INSERT, UPDATE, DELETE)
- Returns: subscribe(), unsubscribe()
- Handles reconnection

### Task 2: Work Orders Realtime
MODIFY `src/hooks/useWorkOrders.ts`
- Add Supabase realtime subscription
- On INSERT: add to list
- On UPDATE: update in list
- On DELETE: remove from list
- Maintain sort order after updates

### Task 3: Messages Realtime
MODIFY `src/hooks/useMessages.ts`
- Subscribe filtered by work_order_id
- On INSERT: append to messages array
- Auto-scroll to new message
- Play notification sound (optional)

### Task 4: Approvals Realtime
MODIFY `src/hooks/useApprovals.ts`
- Subscribe to approvals table
- Update pending count on changes
- Notify nav badge component

### Task 5: Notification Toast System
CREATE `src/components/ui/ToastNotification.tsx`
- Shows when relevant real-time event occurs
- "New work order created"
- "Message received from [tenant]"
- "Approval waiting"
- Auto-dismiss after 5 seconds
- Click navigates to item

### Task 6: Connection Status Indicator
CREATE `src/components/ui/ConnectionStatus.tsx`
- Shows in header/footer
- Green dot = connected
- Yellow dot = reconnecting
- Red dot = disconnected
- Tooltip with details

---

## Validation Checkpoints

1. Open two browser tabs
2. Create work order in tab 1 - appears in tab 2
3. Send message - appears in conversation without refresh
4. Change work order status - list updates immediately
5. Disconnect wifi - status indicator shows disconnected
6. Reconnect - catches up on missed changes

---

## Files to Create
- src/hooks/useRealtimeSubscription.ts
- src/components/ui/ToastNotification.tsx
- src/components/ui/ConnectionStatus.tsx

## Files to Modify
- src/hooks/useWorkOrders.ts
- src/hooks/useMessages.ts
- src/hooks/useApprovals.ts

---

## Anti-Patterns
- ❌ Don't subscribe without cleanup on unmount
- ❌ Don't refetch entire dataset on every event
- ❌ Don't ignore connection failures
- ❌ Don't process events for wrong work order

---

## Next
PRP-09: Technician Dispatch View

# PRP-004: Message Counts on Work Orders

## Goal
Add message counts to work orders so the message filter in WorkOrderList works.

## Dependencies
- PRP-001 (messages table) must be complete

## Success Criteria
- [ ] Each work order has `messageCount` and `unreadCount` properties
- [ ] WorkOrderList filter for "has messages" works
- [ ] No N+1 query problems

---

## The Problem

Currently, `useWorkOrders` fetches work orders but doesn't include message counts:

```typescript
// Current: No message counts
const workOrders = [
  { id: 'WO-001', title: '...', messageCount: undefined }, // undefined!
];

// WorkOrderList filter fails:
const withMessages = workOrders.filter(wo => wo.messageCount > 0); // Always empty
```

---

## Solution: Supabase View

**Create a view that joins work orders with message counts:**

```sql
-- ============================================
-- PRP-004: Work Orders with Message Counts
-- Run in Supabase SQL Editor
-- ============================================

-- Create view that adds message counts to work orders
CREATE OR REPLACE VIEW v_work_orders_with_messages AS
SELECT 
  wo.*,
  COALESCE(msg_counts.message_count, 0)::INTEGER as message_count,
  COALESCE(msg_counts.unread_count, 0)::INTEGER as unread_count,
  msg_counts.last_message_at,
  msg_counts.last_message_sender
FROM "AF_work_order_new" wo
LEFT JOIN (
  SELECT 
    work_order_id,
    COUNT(*)::INTEGER as message_count,
    COUNT(*) FILTER (WHERE is_read = FALSE)::INTEGER as unread_count,
    MAX(created_at) as last_message_at,
    (
      SELECT sender_type 
      FROM messages m2 
      WHERE m2.work_order_id = messages.work_order_id 
      ORDER BY created_at DESC 
      LIMIT 1
    ) as last_message_sender
  FROM messages
  GROUP BY work_order_id
) msg_counts ON wo."ServiceRequestId" = msg_counts.work_order_id;
```

---

## Alternative: RPC Function

If the view approach has issues with your existing queries:

```sql
-- Function to get work orders with message counts
CREATE OR REPLACE FUNCTION get_work_orders_with_messages()
RETURNS TABLE (
  id TEXT,
  title TEXT,
  description TEXT,
  status TEXT,
  priority TEXT,
  property_code TEXT,
  property_address TEXT,
  unit TEXT,
  resident_name TEXT,
  assignee TEXT,
  created_date TIMESTAMPTZ,
  message_count INTEGER,
  unread_count INTEGER,
  last_message_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wo."ServiceRequestId"::TEXT as id,
    wo."Description"::TEXT as title,
    wo."Description"::TEXT as description,
    wo."Status"::TEXT as status,
    wo."Priority"::TEXT as priority,
    wo."PropertyCode"::TEXT as property_code,
    wo."PropertyAddress"::TEXT as property_address,
    wo."Unit"::TEXT as unit,
    wo."ResidentName"::TEXT as resident_name,
    wo."Assignee"::TEXT as assignee,
    wo."CreatedDate"::TIMESTAMPTZ as created_date,
    COALESCE(msg.cnt, 0)::INTEGER as message_count,
    COALESCE(msg.unread, 0)::INTEGER as unread_count,
    msg.last_at as last_message_at
  FROM "AF_work_order_new" wo
  LEFT JOIN (
    SELECT 
      work_order_id,
      COUNT(*) as cnt,
      COUNT(*) FILTER (WHERE is_read = FALSE) as unread,
      MAX(created_at) as last_at
    FROM messages
    GROUP BY work_order_id
  ) msg ON wo."ServiceRequestId" = msg.work_order_id
  ORDER BY wo."CreatedDate" DESC;
END;
$$ LANGUAGE plpgsql;
```

---

## Part 2: Update Types

**In `src/types/index.ts`, ensure WorkOrder includes:**

```typescript
export interface WorkOrder {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: Priority;
  propertyCode: string;
  propertyAddress: string;
  unit: string;
  residentName: string;
  assignee?: string;
  createdDate: string;
  // ADD THESE:
  messageCount: number;
  unreadCount: number;
  lastMessageAt?: string;
}
```

---

## Part 3: Update useWorkOrders Hook

**Option A: Use the view**

```typescript
// In useWorkOrders.ts, change the query from:
const { data } = await supabase
  .from('AF_work_order_new')
  .select('*');

// To:
const { data } = await supabase
  .from('v_work_orders_with_messages')
  .select('*');

// And update the transform function:
function transformWorkOrder(row: any): WorkOrder {
  return {
    id: row.ServiceRequestId || row.id,
    title: row.Description || row.title,
    description: row.Description || row.description,
    status: row.Status || row.status,
    priority: row.Priority || row.priority,
    propertyCode: row.PropertyCode || row.property_code,
    propertyAddress: row.PropertyAddress || row.property_address,
    unit: row.Unit || row.unit,
    residentName: row.ResidentName || row.resident_name,
    assignee: row.Assignee || row.assignee,
    createdDate: row.CreatedDate || row.created_date,
    // ADD:
    messageCount: row.message_count || 0,
    unreadCount: row.unread_count || 0,
    lastMessageAt: row.last_message_at,
  };
}
```

**Option B: Use the RPC function**

```typescript
// In useWorkOrders.ts:
const fetchWorkOrders = async () => {
  const { data, error } = await supabase.rpc('get_work_orders_with_messages');
  
  if (error) throw error;
  
  return (data || []).map(transformWorkOrder);
};
```

---

## Part 4: Update WorkOrderList Filter

**In WorkOrderList.tsx or wherever filtering happens:**

```typescript
// The filter should now work because messageCount is a real number:
const workOrdersWithMessages = workOrders.filter(wo => wo.messageCount > 0);

// For the Messages view specifically:
const filteredForMessagesView = workOrders.filter(wo => wo.messageCount > 0);

// For showing unread indicator:
const hasUnread = wo.unreadCount > 0;
```

---

## Validation

```sql
-- Test the view
SELECT id, title, message_count, unread_count 
FROM v_work_orders_with_messages 
WHERE message_count > 0;

-- Or test the function
SELECT * FROM get_work_orders_with_messages() WHERE message_count > 0;
```

```bash
# Build check
npm run build

# Visual check:
# 1. Go to Messages view
# 2. Should show work orders that have messages
# 3. Unread badges should appear on work orders with unread messages
```

---

## Rollback

```sql
DROP VIEW IF EXISTS v_work_orders_with_messages;
DROP FUNCTION IF EXISTS get_work_orders_with_messages();
```

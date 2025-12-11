# PRP-006: Message List Filter Fix

## Goal
Fix the "No messages yet" issue in the Messages view by using real message counts.

## Dependencies
- PRP-004 (message counts on work orders)

## Success Criteria
- [ ] Messages view shows only work orders WITH messages
- [ ] Count badge matches filtered results
- [ ] "Waiting for reply" filter works

---

## The Problem

```
Sidebar: "4 messages (3 waiting for reply)"
Message List: "No messages yet"
```

The filter logic checks `messageCount > 0`, but `messageCount` is undefined because it wasn't being fetched.

---

## Fix Location

**File:** `src/components/WorkOrderList.tsx` (or wherever the Messages view filters)

---

## Current Code (Broken)

```typescript
// Filter attempts to use messageCount, but it's undefined
const messagesFilter = workOrders.filter(wo => wo.messageCount > 0);
// Result: [] (empty, because undefined > 0 is false)
```

---

## Fixed Code

**After PRP-004 is complete, messageCount will be populated.**

But we also need to handle the filter UI properly:

```typescript
// In the Messages view component:

import { useWorkOrders } from '@/hooks/useWorkOrders';

export function MessagesView() {
  const { workOrders, loading, error } = useWorkOrders();
  
  // Filter to only work orders with messages
  const workOrdersWithMessages = workOrders.filter(wo => 
    wo.messageCount !== undefined && wo.messageCount > 0
  );
  
  // Further filter for "waiting for reply" - last message was from tenant
  const waitingForReply = workOrdersWithMessages.filter(wo => 
    wo.lastMessageSender === 'tenant'
  );
  
  // Filter options
  const [filter, setFilter] = useState<'all' | 'waiting'>('all');
  
  const displayedWorkOrders = filter === 'waiting' 
    ? waitingForReply 
    : workOrdersWithMessages;

  if (loading) return <LoadingSpinner />;
  
  if (error) return <ErrorMessage error={error} />;
  
  if (workOrdersWithMessages.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No message threads yet</p>
        <p className="text-sm">
          Messages will appear here when tenants or technicians respond to work orders.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          All ({workOrdersWithMessages.length})
        </Button>
        <Button
          variant={filter === 'waiting' ? 'default' : 'outline'}
          onClick={() => setFilter('waiting')}
          size="sm"
        >
          Waiting for Reply ({waitingForReply.length})
        </Button>
      </div>

      {/* Work order list */}
      <div className="space-y-2">
        {displayedWorkOrders.map(wo => (
          <WorkOrderMessageCard 
            key={wo.id} 
            workOrder={wo}
            hasUnread={wo.unreadCount > 0}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## WorkOrderMessageCard Component

```typescript
interface WorkOrderMessageCardProps {
  workOrder: WorkOrder;
  hasUnread: boolean;
  onClick?: () => void;
}

function WorkOrderMessageCard({ workOrder, hasUnread, onClick }: WorkOrderMessageCardProps) {
  return (
    <Card 
      className={cn(
        "cursor-pointer hover:bg-muted/50 transition-colors",
        hasUnread && "border-l-4 border-l-primary"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{workOrder.id}</span>
              {hasUnread && (
                <Badge variant="default" className="text-xs">
                  {workOrder.unreadCount} new
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {workOrder.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {workOrder.residentName} • {workOrder.unit}
            </p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div>{workOrder.messageCount} messages</div>
            {workOrder.lastMessageAt && (
              <div>{formatDistanceToNow(new Date(workOrder.lastMessageAt))} ago</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## Update Routing (if needed)

Make sure the Messages route is properly connected:

```typescript
// In AppRouter.tsx or routes config:
<Route path="/messages" element={<MessagesView />} />

// Or if using existing WorkOrdersPage with a tab:
<Route path="/work-orders/messages" element={<WorkOrdersPage view="messages" />} />
```

---

## Validation

```bash
# Build check
npm run build

# Manual testing:
# 1. Add test messages to work orders (via SQL or test UI)
# 2. Navigate to Messages view
# 3. Should show work orders that have messages
# 4. Count should match sidebar badge
# 5. "Waiting for reply" filter should show subset
```

```sql
-- Verify data exists
SELECT 
  wo."ServiceRequestId",
  COUNT(m.id) as message_count
FROM "AF_work_order_new" wo
LEFT JOIN messages m ON wo."ServiceRequestId" = m.work_order_id
GROUP BY wo."ServiceRequestId"
HAVING COUNT(m.id) > 0;
```

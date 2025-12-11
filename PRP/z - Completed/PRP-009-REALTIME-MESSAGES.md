# PRP-009: Real-Time Messages

## Goal
Add Supabase real-time subscriptions so messages appear instantly without refresh.

## Dependencies
- PRP-001 (messages table)
- PRP-003 (useMessages hook)

## Success Criteria
- [ ] New messages appear instantly in conversation thread
- [ ] Unread counts update in real-time
- [ ] No manual refresh needed
- [ ] Subscription cleans up on unmount

---

## Supabase Real-Time Setup

**Enable real-time on the messages table:**

```sql
-- Run in Supabase SQL Editor
-- Enable real-time for messages table

-- Check if already enabled
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- If messages not listed, add it:
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

---

## Update useMessages Hook

**Modify `src/hooks/useMessages.ts`:**

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Message, SendMessageInput } from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ... keep existing transform function ...

interface UseMessagesOptions {
  workOrderId?: string;
  enableRealtime?: boolean; // NEW
}

export function useMessages(options: UseMessagesOptions = {}) {
  const { workOrderId, enableRealtime = true } = options;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // ... keep existing fetchMessages, sendMessage, markAsRead functions ...

  // Real-time subscription
  useEffect(() => {
    if (!enableRealtime) return;

    // Create unique channel name
    const channelName = workOrderId 
      ? `messages:wo:${workOrderId}` 
      : 'messages:all';

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          ...(workOrderId && { filter: `work_order_id=eq.${workOrderId}` }),
        },
        (payload) => {
          console.log('New message received:', payload);
          const newMessage = transformMessage(payload.new);
          setMessages(prev => {
            // Avoid duplicates (in case we just sent it)
            if (prev.some(m => m.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          ...(workOrderId && { filter: `work_order_id=eq.${workOrderId}` }),
        },
        (payload) => {
          console.log('Message updated:', payload);
          const updatedMessage = transformMessage(payload.new);
          setMessages(prev =>
            prev.map(m => m.id === updatedMessage.id ? updatedMessage : m)
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('Message deleted:', payload);
          setMessages(prev =>
            prev.filter(m => m.id !== payload.old.id)
          );
        }
      )
      .subscribe((status) => {
        console.log(`Real-time subscription status: ${status}`);
      });

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up real-time subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [workOrderId, enableRealtime]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    markAsRead,
    markAllAsRead,
    refetch,
  };
}
```

---

## Update useMessageThread

```typescript
export function useMessageThread(workOrderId: string) {
  const result = useMessages({
    workOrderId,
    enableRealtime: true, // Enable by default for active conversations
  });

  // ... rest stays the same
}
```

---

## Optimistic Updates

For even snappier UX, add optimistic updates when sending:

```typescript
const sendMessage = useCallback(async (input: SendMessageInput): Promise<Message | null> => {
  // Create optimistic message
  const optimisticId = `temp-${Date.now()}`;
  const optimisticMessage: Message = {
    id: optimisticId,
    workOrderId: input.workOrderId,
    senderType: input.senderType,
    senderName: input.senderName,
    content: input.content,
    originalLanguage: input.originalLanguage || 'en',
    isRead: true, // Own messages are read
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Add to state immediately
  setMessages(prev => [...prev, optimisticMessage]);

  try {
    const { data, error: insertError } = await supabase
      .from('messages')
      .insert({
        work_order_id: input.workOrderId,
        sender_type: input.senderType,
        sender_id: input.senderId,
        sender_name: input.senderName,
        content: input.content,
        original_language: input.originalLanguage || 'en',
        is_read: false,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    const realMessage = transformMessage(data);
    
    // Replace optimistic with real
    setMessages(prev =>
      prev.map(m => m.id === optimisticId ? realMessage : m)
    );

    return realMessage;
  } catch (err) {
    // Remove optimistic message on error
    setMessages(prev => prev.filter(m => m.id !== optimisticId));
    console.error('Error sending message:', err);
    throw err;
  }
}, []);
```

---

## Connection Status Indicator (Optional)

Show users when real-time is connected:

```typescript
// In hook
const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

// In subscription
.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    setConnectionStatus('connected');
  } else if (status === 'CLOSED') {
    setConnectionStatus('disconnected');
  } else {
    setConnectionStatus('connecting');
  }
});

// In UI
{connectionStatus === 'disconnected' && (
  <div className="text-xs text-amber-500 flex items-center gap-1">
    <WifiOff className="h-3 w-3" />
    Reconnecting...
  </div>
)}
```

---

## Validation

```bash
npm run build
npm run dev

# Test real-time:
# 1. Open app in two browser tabs
# 2. Select same work order in both
# 3. Send message from Tab 1
# 4. Message should appear in Tab 2 without refresh

# Or test via SQL:
INSERT INTO messages (work_order_id, sender_type, sender_name, content)
VALUES ('WO-001', 'tenant', 'Test', 'Real-time test message');
# Should appear instantly in UI
```

---

## Troubleshooting

**Messages not appearing in real-time:**

1. Check publication includes table:
```sql
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

2. Check RLS allows reads:
```sql
-- Temporarily disable RLS to test
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
```

3. Check browser console for subscription errors

4. Verify channel is properly subscribed (should see "SUBSCRIBED" in console)

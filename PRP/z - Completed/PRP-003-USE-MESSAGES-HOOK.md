# PRP-003: useMessages Hook

## Goal
Create the `useMessages` hook to fetch, send, and manage messages for work orders.

## Dependencies
- PRP-001 (messages table) must be complete

## Success Criteria
- [ ] Fetch messages by work_order_id
- [ ] Send new messages
- [ ] Mark messages as read
- [ ] TypeScript types complete
- [ ] Error handling works

---

## Part 1: Types

**Add to `src/types/index.ts`:**

```typescript
// ============================================
// Message Types
// ============================================

export type MessageSenderType = 'coordinator' | 'technician' | 'tenant' | 'system';

export interface Message {
  id: string;
  workOrderId: string;
  senderType: MessageSenderType;
  senderId?: string;
  senderName?: string;
  content: string;
  translatedContent?: string;
  originalLanguage: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageInput {
  workOrderId: string;
  senderType: MessageSenderType;
  senderId?: string;
  senderName?: string;
  content: string;
  originalLanguage?: string;
}

export interface MessageThread {
  workOrderId: string;
  messages: Message[];
  unreadCount: number;
  lastMessage?: Message;
}
```

---

## Part 2: Hook Implementation

**Create file:** `src/hooks/useMessages.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Message, SendMessageInput, MessageThread } from '@/types';

// Transform DB row to frontend type
function transformMessage(row: any): Message {
  return {
    id: row.id,
    workOrderId: row.work_order_id,
    senderType: row.sender_type,
    senderId: row.sender_id,
    senderName: row.sender_name,
    content: row.content,
    translatedContent: row.translated_content,
    originalLanguage: row.original_language || 'en',
    isRead: row.is_read,
    readAt: row.read_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

interface UseMessagesOptions {
  workOrderId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  error: Error | null;
  sendMessage: (input: SendMessageInput) => Promise<Message | null>;
  markAsRead: (messageId: string) => Promise<void>;
  markAllAsRead: (workOrderId: string) => Promise<void>;
  refetch: () => void;
}

export function useMessages(options: UseMessagesOptions = {}): UseMessagesReturn {
  const { workOrderId, autoRefresh = false, refreshInterval = 10000 } = options;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      let query = supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (workOrderId) {
        query = query.eq('work_order_id', workOrderId);
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      
      setMessages((data || []).map(transformMessage));
      setError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch messages'));
    } finally {
      setLoading(false);
    }
  }, [workOrderId]);

  const sendMessage = useCallback(async (input: SendMessageInput): Promise<Message | null> => {
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
      
      const newMessage = transformMessage(data);
      setMessages(prev => [...prev, newMessage]);
      
      return newMessage;
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  }, []);

  const markAsRead = useCallback(async (messageId: string): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', messageId);
      
      if (updateError) throw updateError;
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, isRead: true, readAt: new Date().toISOString() }
            : msg
        )
      );
    } catch (err) {
      console.error('Error marking message as read:', err);
      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async (woId: string): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('work_order_id', woId)
        .eq('is_read', false);
      
      if (updateError) throw updateError;
      
      setMessages(prev => 
        prev.map(msg => 
          msg.workOrderId === woId
            ? { ...msg, isRead: true, readAt: new Date().toISOString() }
            : msg
        )
      );
    } catch (err) {
      console.error('Error marking all messages as read:', err);
      throw err;
    }
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    fetchMessages();
  }, [fetchMessages]);

  // Initial fetch
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(fetchMessages, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchMessages]);

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

// ============================================
// Convenience hook for a single work order thread
// ============================================

export function useMessageThread(workOrderId: string): MessageThread & {
  loading: boolean;
  error: Error | null;
  sendMessage: (content: string, senderType: MessageSenderType, senderName?: string) => Promise<Message | null>;
  markAllAsRead: () => Promise<void>;
  refetch: () => void;
} {
  const { messages, loading, error, sendMessage, markAllAsRead, refetch } = useMessages({
    workOrderId,
    autoRefresh: true,
    refreshInterval: 5000, // More frequent for active conversation
  });

  const unreadCount = messages.filter(m => !m.isRead).length;
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : undefined;

  const sendThreadMessage = useCallback(
    async (content: string, senderType: MessageSenderType, senderName?: string) => {
      return sendMessage({
        workOrderId,
        senderType,
        senderName,
        content,
      });
    },
    [workOrderId, sendMessage]
  );

  const markThreadAsRead = useCallback(() => markAllAsRead(workOrderId), [workOrderId, markAllAsRead]);

  return {
    workOrderId,
    messages,
    unreadCount,
    lastMessage,
    loading,
    error,
    sendMessage: sendThreadMessage,
    markAllAsRead: markThreadAsRead,
    refetch,
  };
}
```

---

## Validation

```typescript
// Test in a component or console:
const { messages, sendMessage, loading } = useMessages({ workOrderId: 'WO-001' });

// Should return messages array
console.log(messages);

// Should successfully send
await sendMessage({
  workOrderId: 'WO-001',
  senderType: 'coordinator',
  senderName: 'Kristine',
  content: 'Test message',
});
```

```bash
# Build check
npm run build
```

---

## Usage Examples

```typescript
// In ConversationThread or similar component:
import { useMessageThread } from '@/hooks/useMessages';

function ConversationThread({ workOrderId }: { workOrderId: string }) {
  const { 
    messages, 
    loading, 
    sendMessage, 
    markAllAsRead 
  } = useMessageThread(workOrderId);

  // Mark as read when viewing
  useEffect(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  const handleSend = async (content: string) => {
    await sendMessage(content, 'coordinator', 'Kristine');
  };

  if (loading) return <Spinner />;

  return (
    <div>
      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      <MessageInput onSend={handleSend} />
    </div>
  );
}
```

---

## Next Steps
- PRP-005: Wire ConversationThread.tsx to use this hook
- PRP-009: Add real-time subscriptions

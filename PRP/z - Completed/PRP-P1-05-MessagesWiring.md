# PRP-P1-05: Messages Wiring

## Goal
Connect the Messages UI to real Supabase data instead of mock/fake data.

## Success Criteria
- [ ] Messages page shows real conversations from database
- [ ] Messages grouped by work order
- [ ] Real-time updates when new messages arrive
- [ ] Mark messages as read when viewed
- [ ] Send new messages (coordinator to tenant)
- [ ] Show sender type (tenant, coordinator, technician, system)
- [ ] Timestamp display on each message

---

## Context

**Files involved:**
- `src/pages/MessagesPage.tsx` or `src/components/MessagesView.tsx`
- `src/hooks/useMessages.ts`
- `src/components/ConversationThread.tsx` (or similar)
- Supabase: `messages` table

**Current state:**
- UI exists but shows fake/mock data
- Message sending logs to console
- No real-time subscriptions

**Database schema (messages table):**
```sql
messages (
  id UUID PRIMARY KEY,
  work_order_id TEXT REFERENCES work_orders(id),
  sender_type TEXT CHECK (sender_type IN ('coordinator', 'technician', 'tenant', 'system')),
  sender_id UUID, -- NULL for system messages
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

---

## Tasks

### Task 1: Verify/Create Messages Table

RUN in Supabase SQL Editor (if table doesn't exist):

```sql
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('coordinator', 'technician', 'tenant', 'system')),
  sender_id UUID,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by work order
CREATE INDEX IF NOT EXISTS idx_messages_work_order ON messages(work_order_id);

-- Index for unread messages
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(is_read) WHERE is_read = FALSE;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Insert some test data
INSERT INTO messages (work_order_id, sender_type, content, is_read)
SELECT 
  id,
  'tenant',
  'Hi, when will someone come to fix this?',
  false
FROM work_orders
LIMIT 5;
```

### Task 2: Create/Update Messages Hook

CREATE or REPLACE `src/hooks/useMessages.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Message {
  id: string;
  work_order_id: string;
  sender_type: 'coordinator' | 'technician' | 'tenant' | 'system';
  sender_id: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  work_order_id: string;
  work_order: {
    id: string;
    title: string;
    property_address: string;
    unit: string;
    resident_name: string;
  };
  messages: Message[];
  unread_count: number;
  last_message_at: string;
}

export function useMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    
    try {
      // Get all messages with work order info
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          work_order:work_orders(id, title, property_address, unit, resident_name)
        `)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Group messages by work order
      const conversationMap = new Map<string, Conversation>();
      
      messages?.forEach(msg => {
        const woId = msg.work_order_id;
        
        if (!conversationMap.has(woId)) {
          conversationMap.set(woId, {
            work_order_id: woId,
            work_order: msg.work_order,
            messages: [],
            unread_count: 0,
            last_message_at: msg.created_at,
          });
        }
        
        const conv = conversationMap.get(woId)!;
        conv.messages.push({
          id: msg.id,
          work_order_id: msg.work_order_id,
          sender_type: msg.sender_type,
          sender_id: msg.sender_id,
          content: msg.content,
          is_read: msg.is_read,
          created_at: msg.created_at,
        });
        
        if (!msg.is_read && msg.sender_type === 'tenant') {
          conv.unread_count++;
        }
        
        if (msg.created_at > conv.last_message_at) {
          conv.last_message_at = msg.created_at;
        }
      });

      // Sort conversations by last message (newest first)
      const sortedConversations = Array.from(conversationMap.values())
        .sort((a, b) => 
          new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
        );

      setConversations(sortedConversations);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          // Refetch on any change
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConversations]);

  // Mark messages as read
  const markAsRead = useCallback(async (workOrderId: string) => {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('work_order_id', workOrderId)
      .eq('sender_type', 'tenant')
      .eq('is_read', false);
  }, []);

  // Send a message
  const sendMessage = useCallback(async (
    workOrderId: string,
    content: string,
    senderType: 'coordinator' | 'technician' = 'coordinator'
  ) => {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        work_order_id: workOrderId,
        sender_type: senderType,
        content,
        is_read: true, // Coordinator's own messages are "read"
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }, []);

  return {
    conversations,
    loading,
    error,
    refetch: fetchConversations,
    markAsRead,
    sendMessage,
  };
}

// Hook for single conversation
export function useConversation(workOrderId: string) {
  const { conversations, markAsRead, sendMessage, loading } = useMessages();
  
  const conversation = conversations.find(c => c.work_order_id === workOrderId);

  useEffect(() => {
    if (workOrderId && conversation?.unread_count > 0) {
      markAsRead(workOrderId);
    }
  }, [workOrderId, conversation?.unread_count, markAsRead]);

  return {
    conversation,
    messages: conversation?.messages || [],
    loading,
    sendMessage: (content: string) => sendMessage(workOrderId, content),
  };
}
```

### Task 3: Update Messages Page

MODIFY `src/pages/MessagesPage.tsx`:

```typescript
import { useState } from 'react';
import { useMessages, Conversation } from '@/hooks/useMessages';
import { ConversationList } from '@/components/messages/ConversationList';
import { ConversationThread } from '@/components/messages/ConversationThread';

export function MessagesPage() {
  const { conversations, loading, error } = useMessages();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  if (loading) {
    return <div className="p-6">Loading conversations...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Error loading messages: {error.message}</div>;
  }

  return (
    <div className="flex h-full">
      {/* Conversation List - Left side */}
      <div className="w-[400px] border-r overflow-y-auto">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">Messages</h1>
          <p className="text-sm text-muted-foreground">
            {conversations.length} conversations
          </p>
        </div>
        
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversation?.work_order_id}
          onSelect={setSelectedConversation}
        />
      </div>

      {/* Conversation Thread - Right side */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <ConversationThread
            workOrderId={selectedConversation.work_order_id}
            workOrder={selectedConversation.work_order}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a conversation to view messages
          </div>
        )}
      </div>
    </div>
  );
}
```

### Task 4: Create Conversation List Component

CREATE `src/components/messages/ConversationList.tsx`:

```typescript
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { MessageSquare } from 'lucide-react';
import type { Conversation } from '@/hooks/useMessages';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | undefined;
  onSelect: (conversation: Conversation) => void;
}

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No conversations yet</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {conversations.map(conversation => {
        const lastMessage = conversation.messages[conversation.messages.length - 1];
        const isSelected = selectedId === conversation.work_order_id;
        
        return (
          <button
            key={conversation.work_order_id}
            onClick={() => onSelect(conversation)}
            className={`w-full text-left p-4 hover:bg-accent transition-colors ${
              isSelected ? 'bg-accent' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">
                    {conversation.work_order.resident_name}
                  </span>
                  {conversation.unread_count > 0 && (
                    <Badge variant="default" className="h-5 px-1.5">
                      {conversation.unread_count}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {conversation.work_order.property_address} • {conversation.work_order.unit}
                </p>
                <p className="text-sm truncate mt-1">
                  {lastMessage?.content}
                </p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
```

### Task 5: Create Conversation Thread Component

CREATE `src/components/messages/ConversationThread.tsx`:

```typescript
import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, User, Wrench, Building } from 'lucide-react';
import { toast } from 'sonner';
import { useConversation } from '@/hooks/useMessages';

interface ConversationThreadProps {
  workOrderId: string;
  workOrder: {
    id: string;
    title: string;
    property_address: string;
    unit: string;
    resident_name: string;
  };
}

export function ConversationThread({ workOrderId, workOrder }: ConversationThreadProps) {
  const { messages, sendMessage, loading } = useConversation(workOrderId);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      await sendMessage(newMessage.trim());
      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getSenderIcon = (senderType: string) => {
    switch (senderType) {
      case 'tenant': return <User className="h-4 w-4" />;
      case 'technician': return <Wrench className="h-4 w-4" />;
      case 'coordinator': return <Building className="h-4 w-4" />;
      default: return null;
    }
  };

  const getSenderLabel = (senderType: string) => {
    switch (senderType) {
      case 'tenant': return workOrder.resident_name;
      case 'technician': return 'Technician';
      case 'coordinator': return 'Kristine';
      case 'system': return 'System';
      default: return senderType;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="font-semibold">{workOrder.resident_name}</h2>
        <p className="text-sm text-muted-foreground">
          {workOrder.property_address} • {workOrder.unit}
        </p>
        <p className="text-sm text-muted-foreground">
          WO: {workOrder.id}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => {
          const isCoordinator = message.sender_type === 'coordinator';
          
          return (
            <div
              key={message.id}
              className={`flex ${isCoordinator ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  isCoordinator
                    ? 'bg-blue-600 text-white'
                    : 'bg-muted'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {getSenderIcon(message.sender_type)}
                  <span className="text-xs font-medium">
                    {getSenderLabel(message.sender_type)}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className={`text-xs mt-1 ${isCoordinator ? 'text-blue-200' : 'text-muted-foreground'}`}>
                  {format(new Date(message.created_at), 'MMM d, h:mm a')}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="resize-none"
            rows={2}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
```

---

## Validation

```bash
# Type check
npx tsc --noEmit

# Build
npm run build

# Manual testing:
# 1. Go to /messages
# 2. Should see list of conversations (or empty state)
# 3. Click a conversation - messages appear
# 4. Unread badge disappears after viewing
# 5. Type and send a message - appears immediately
# 6. Open another browser tab - messages sync in real-time
```

---

## Notes

- This PRP focuses on wiring existing UI to real data
- SMS integration (Twilio) is Phase 2 - this is internal messaging
- Tenant messages would come from tenant portal or SMS gateway (future)
- For now, manually insert test messages or use tenant portal to test

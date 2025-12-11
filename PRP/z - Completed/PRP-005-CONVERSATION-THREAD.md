# PRP-005: Conversation Thread Integration

## Goal
Replace mock messages in ConversationThread with real data from useMessages hook.

## Dependencies
- PRP-001 (messages table)
- PRP-003 (useMessages hook)

## Success Criteria
- [ ] ConversationThread displays real messages
- [ ] New messages can be sent
- [ ] Messages marked as read when viewed
- [ ] Auto-refresh shows new messages
- [ ] Translation display works (if available)

---

## Current State

The ConversationThread component uses `mockMessages` array:

```typescript
// CURRENT (mock):
const mockMessages = [
  { id: '1', content: 'The faucet is still leaking...', ... },
  { id: '2', content: 'I\'ll send a technician...', ... },
];
```

---

## Implementation

**Update `src/components/ConversationThread.tsx`:**

```typescript
import { useEffect, useState } from 'react';
import { useMessageThread } from '@/hooks/useMessages';
import type { Message, MessageSenderType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ConversationThreadProps {
  workOrderId: string;
  currentUserName?: string;
  currentUserType?: MessageSenderType;
}

export function ConversationThread({ 
  workOrderId,
  currentUserName = 'Kristine',
  currentUserType = 'coordinator'
}: ConversationThreadProps) {
  const { 
    messages, 
    loading, 
    error, 
    sendMessage, 
    markAllAsRead 
  } = useMessageThread(workOrderId);
  
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Mark messages as read when viewing
  useEffect(() => {
    if (messages.length > 0) {
      markAllAsRead();
    }
  }, [messages.length, markAllAsRead]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    
    setSending(true);
    try {
      await sendMessage(newMessage.trim(), currentUserType, currentUserName);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        Failed to load messages. Please try again.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble 
                key={message.id} 
                message={message}
                isCurrentUser={message.senderType === currentUserType}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1"
          />
          <Button 
            onClick={handleSend} 
            disabled={!newMessage.trim() || sending}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Message Bubble Component
// ============================================

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
}

function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
  const senderInitials = message.senderName
    ? message.senderName.split(' ').map(n => n[0]).join('').toUpperCase()
    : message.senderType[0].toUpperCase();

  const senderColor = {
    coordinator: 'bg-blue-500',
    technician: 'bg-green-500',
    tenant: 'bg-gray-500',
    system: 'bg-purple-500',
  }[message.senderType];

  return (
    <div className={cn(
      'flex gap-3',
      isCurrentUser ? 'flex-row-reverse' : 'flex-row'
    )}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className={cn(senderColor, 'text-white text-xs')}>
          {senderInitials}
        </AvatarFallback>
      </Avatar>
      
      <div className={cn(
        'flex flex-col max-w-[70%]',
        isCurrentUser ? 'items-end' : 'items-start'
      )}>
        {/* Sender name and time */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <span className="font-medium">
            {message.senderName || message.senderType}
          </span>
          <span>
            {format(new Date(message.createdAt), 'h:mm a')}
          </span>
        </div>
        
        {/* Message bubble */}
        <div className={cn(
          'rounded-lg px-3 py-2',
          isCurrentUser 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted'
        )}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Translation (if different from original) */}
        {message.translatedContent && message.translatedContent !== message.content && (
          <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
            <Globe className="h-3 w-3" />
            <span className="italic">
              Translated: {message.translatedContent}
            </span>
          </div>
        )}

        {/* Original language indicator */}
        {message.originalLanguage && message.originalLanguage !== 'en' && (
          <div className="mt-1 text-xs text-muted-foreground">
            Original: {message.originalLanguage.toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}

export default ConversationThread;
```

---

## Quick Reply Templates (Enhancement)

**Add quick reply buttons above the input:**

```typescript
const quickReplies = [
  "When can you be available?",
  "Technician is on the way",
  "Do you need emergency service?",
  "Can you send a photo?",
  "We need access to the unit",
];

// In the component:
<div className="flex flex-wrap gap-2 mb-2">
  {quickReplies.map((reply) => (
    <Button
      key={reply}
      variant="outline"
      size="sm"
      onClick={() => setNewMessage(reply)}
      className="text-xs"
    >
      {reply}
    </Button>
  ))}
</div>
```

---

## Integration Points

**Where ConversationThread is used:**

1. **WorkOrderDetailView** - Detail panel shows messages tab
2. **MessagesPage** - Full messages view with conversation
3. **MessagesView** component - If separate from page

Update the parent component to pass `workOrderId`:

```typescript
// In WorkOrderDetailView.tsx or similar:
<ConversationThread 
  workOrderId={selectedWorkOrder.id}
  currentUserName="Kristine"
  currentUserType="coordinator"
/>
```

---

## Validation

```bash
# Build check
npm run build

# Manual testing:
# 1. Select a work order with messages (WO-001 if using test data)
# 2. Conversation should display real messages from DB
# 3. Send a new message - should appear in thread
# 4. Refresh page - message should persist
# 5. Unread badge should clear after viewing
```

---

## Edge Cases Handled

- [ ] Empty conversation (no messages yet)
- [ ] Loading state
- [ ] Error state
- [ ] Very long messages (word wrap)
- [ ] Rapid message sending (prevent double-send)
- [ ] Messages from different sender types (color coding)

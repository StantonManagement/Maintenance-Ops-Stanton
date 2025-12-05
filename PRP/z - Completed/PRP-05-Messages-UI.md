# PRP-05: Messages UI Shell

## Goal
Build the messages view showing work orders with active conversations. Left panel lists conversations, right panel shows thread. No real-time yet (Phase 2).

## Success Criteria
- [ ] Messages view shows only work orders WITH messages
- [ ] Conversation list sorted by most recent message
- [ ] Unread indicator on conversations
- [ ] Thread view shows full message history
- [ ] Compose area for sending new messages
- [ ] Translation display (original + translated)
- [ ] Quick reply templates

---

## Context

**Data flow:** 
- List: work orders WHERE has_unread_messages = true OR has messages
- Thread: messages WHERE work_order_id = selected

**Real-time:** NOT in Phase 1. Use manual refresh button. Phase 2 adds Supabase Realtime.

**SMS Integration:** Messages write to DB, separate SMS agent (Valles) handles Twilio send.

---

## Tasks

### Task 1: Messages Page
CREATE `src/pages/MessagesPage.tsx`
- Uses MainLayout
- Left: ConversationList
- Right: ConversationThread (when selected)
- Route: /messages, /messages/:workOrderId

### Task 2: Conversation List
CREATE `src/components/messages/ConversationList.tsx`
- Fetches work orders that have messages
- Each item shows: tenant name, property, last message preview, time
- Unread dot indicator
- Click selects conversation
- Search/filter by tenant or property

### Task 3: Conversation Item
CREATE `src/components/messages/ConversationItem.tsx`
- Avatar placeholder (initials)
- Tenant name + property/unit
- Last message truncated (50 chars)
- Relative time ("2h ago")
- Unread count badge

### Task 4: Conversation Thread
CREATE `src/components/messages/ConversationThread.tsx`
- Header: tenant name, phone, work order link
- Message list (scrollable, newest at bottom)
- Auto-scroll to bottom on new message
- Compose area at bottom

### Task 5: Message Bubble
CREATE `src/components/messages/MessageBubble.tsx`
- Inbound: left aligned, light background
- Outbound: right aligned, brand color background
- Shows: content, timestamp, delivery status
- If translated: show original in smaller text below
- Language indicator badge

### Task 6: Compose Area
CREATE `src/components/messages/ComposeArea.tsx`
- Text input (multiline)
- Send button
- Quick reply dropdown (templates)
- Character count (SMS limit awareness: 160)
- Calls useMessages.sendMessage()

### Task 7: Quick Reply Templates
CREATE `src/components/messages/QuickReplyTemplates.tsx`
- Dropdown with common responses:
  - "When are you available?"
  - "Technician is on the way"
  - "Work has been completed"
  - "Can you send a photo?"
- Clicking inserts text into compose area

---

## Validation Checkpoints

1. Navigate to `/messages` - shows conversation list
2. Click conversation - thread loads
3. Send message - appears in thread (after refetch)
4. Quick reply - inserts template text
5. Translation shows if content_translated exists

---

## Files to Create
- src/pages/MessagesPage.tsx
- src/components/messages/ConversationList.tsx
- src/components/messages/ConversationItem.tsx
- src/components/messages/ConversationThread.tsx
- src/components/messages/MessageBubble.tsx
- src/components/messages/ComposeArea.tsx
- src/components/messages/QuickReplyTemplates.tsx

---

## Anti-Patterns
- ❌ Don't implement real-time yet (Phase 2)
- ❌ Don't assume all messages have translations
- ❌ Don't forget scroll position management
- ❌ Don't send empty messages

---

## Next
PRP-06: Approvals Queue

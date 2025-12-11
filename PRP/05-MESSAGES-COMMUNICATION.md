# PRP-05: Messages & Communication

## Problem Statement

Messages exist in the database but the UI either doesn't display them properly, doesn't allow replies, or isn't connected to the actual SMS/communication infrastructure. The coordinator needs to see tenant messages, respond in English (auto-translated to tenant's language), and track communication history.

**Current State:**
- Messages table may exist
- UI may show message threads but actions don't work
- Reply function doesn't send actual messages
- Translation may not be integrated
- Unread indicators may not update

**Required State:**
- View all messages grouped by work order
- See message threads with translation
- Send replies that actually deliver via SMS/email
- Automatic translation for non-English tenants
- Unread indicators that work
- Separate views: Tenant messages vs Tech messages

---

## Message Types

Two distinct communication streams that should be separated in UI:

### Tenant Messages
- Inbound: Tenant texts/emails about their issue
- Outbound: Coordinator responds with scheduling, questions, updates
- Language: Often non-English, requires translation
- Urgency: May contain new issues or complaints
- Action: May need to create work order, schedule, or escalate

### Technician Messages
- Inbound: Tech reports status, asks questions, requests parts
- Outbound: Coordinator sends instructions, schedule changes
- Language: English (internal)
- Urgency: Usually about active work
- Action: May need to update work order, authorize purchase

---

## Message Thread View

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Messages                                      [Filter] [Search] │
├──────────────────┬──────────────────────────────────────────┤
│  Conversations   │  Thread                                   │
│                  │                                           │
│  ● Maria Garcia  │  WO-2024-0142 - Bathroom leak            │
│    Bathroom leak │  Unit 204 - Maria Garcia                 │
│    2 min ago     │  ─────────────────────────────────────   │
│                  │                                           │
│  ○ James Wilson  │  Maria (Spanish → English):              │
│    No hot water  │  "El baño tiene una fuga de agua"        │
│    1 hour ago    │  → "The bathroom has a water leak"       │
│                  │                                           │
│  ○ Ramon (Tech)  │  You (sent in Spanish):                  │
│    Parts needed  │  "We'll send someone tomorrow at 2pm"    │
│    3 hours ago   │  → "Enviaremos a alguien mañana..."      │
│                  │                                           │
│                  │  ─────────────────────────────────────   │
│                  │  [Type reply...]              [Send]     │
└──────────────────┴──────────────────────────────────────────┘
```

### Conversation List (Left Panel)

Shows all conversations with:
- Sender name
- Work order reference (or "New Issue" if no WO yet)
- Message preview (first 50 chars)
- Time since last message
- Unread indicator (filled dot)
- Urgent flag if detected

**Sorting:**
- Unread first, then by most recent

**Filtering:**
- All
- Unread only
- Tenant messages
- Tech messages
- By property

### Thread View (Right Panel)

**Header:**
- Work order number and brief description
- Property and unit
- Tenant/tech name and contact info
- Quick actions: View Work Order, Call, Create WO (if new issue)

**Message Bubbles:**
- Inbound messages: Left-aligned, light background
- Outbound messages: Right-aligned, colored background
- Each bubble shows:
  - Original text
  - Translation (if applicable)
  - Timestamp
  - Delivery status (for outbound)

**Reply Input:**
- Text area at bottom
- Send button
- Typing in English → auto-translate if tenant speaks other language
- Quick replies dropdown (common responses)

---

## Translation Handling

### Inbound Messages

1. Message received from tenant
2. Detect language (from tenant profile or auto-detect)
3. If not English, translate via AI/Google Translate
4. Store both original and translated
5. Display: Original first, then "→ [Translated text]"

### Outbound Messages

1. Coordinator types reply in English
2. If tenant language ≠ English, translate to tenant language
3. Send translated version to tenant
4. Store both in database
5. Display: English version, then "Sent as: [Translated]"

### Language Detection

- Use tenant profile `tenant_language` if set
- Otherwise auto-detect from first message
- Allow coordinator to override/correct

---

## SMS Integration (Twilio)

### Architecture

```
App → SMS Agent Service → Twilio → Tenant Phone
                ↓
        Message stored in DB
```

The SMS Agent (mentioned as already working) handles:
- Sending messages via Twilio
- Receiving webhooks from Twilio
- Storing messages in database

### Frontend Integration

The frontend needs to:
1. Create message record via API (not direct to Twilio)
2. Mark as "pending"
3. SMS Agent picks up and sends
4. Webhook updates delivery status
5. Frontend shows updated status

### Webhook Flow (Inbound)

1. Tenant sends SMS to Twilio number
2. Twilio webhooks to SMS Agent
3. SMS Agent:
   - Looks up tenant by phone number
   - Creates message record
   - Links to work order (by active WO or creates new)
   - Translates if needed
   - Updates work_order.has_unread_messages = true
4. Frontend sees new message on refresh/realtime

---

## Unread Tracking

### When Message is Unread

- Inbound message arrives
- work_order.has_unread_messages = true
- Conversation shows unread indicator

### When Message is Read

- Coordinator opens conversation thread
- Mark messages as read (read_at = now)
- If all messages read, work_order.has_unread_messages = false

### Unread Count

- Sidebar shows total unread count
- Badge: "Messages (5)"
- Updates in real-time if possible

---

## Creating Work Order from Message

Sometimes a message is a new issue, not related to existing WO.

### Flow

1. Message arrives from known tenant phone
2. No active work order matches
3. SMS Agent creates message with work_order_id = NULL
4. Shows in "New Issues" section
5. Coordinator reviews message
6. Clicks "Create Work Order"
7. Modal pre-fills:
   - Tenant info (from phone lookup)
   - Unit (from tenant's current lease)
   - Description (from message content)
8. Coordinator adds category, priority, completes creation
9. Message now linked to new work order

---

## Quick Replies

Common responses the coordinator sends frequently:

**Scheduling:**
- "We've scheduled someone for [DATE] at [TIME]. Please confirm this works."
- "When are you available this week?"
- "The technician is on their way."

**Access:**
- "We attempted to access your unit but no one was home. Please let us know when you're available."
- "Do we have permission to enter if you're not home?"

**Follow-up:**
- "Has the issue been resolved?"
- "Is there anything else we can help with?"

**Implementation:**
- Dropdown or button row above input
- Click inserts text into input
- Can edit before sending
- Placeholders like [DATE] prompt for input

---

## Notifications

### To Coordinator

When new message arrives:
- Badge updates on Messages nav item
- If browser notifications enabled, show notification
- If dashboard is open, conversation list updates

### To Tenant

When reply is sent:
- SMS delivered (via Twilio)
- Delivery status tracked
- Failed delivery → notification to coordinator

---

## Edge Cases

### Unknown Phone Number
- Message arrives from number not in tenant database
- Create unlinked message
- Show in "Unknown Senders" 
- Coordinator can associate with tenant/WO manually

### Multiple Active Work Orders
- Tenant has 2 open work orders
- Message arrives - which one?
- Options:
  - Ask tenant which issue
  - Use AI to match content to WO descriptions
  - Show in "Needs Association" queue

### Tenant Responds After WO Closed
- Work order completed last week
- Tenant texts: "It's leaking again"
- Options:
  - Reopen work order
  - Create new work order linked to original
- Show with flag: "Response to completed WO"

### Long Delay Between Messages
- Last message was 5 days ago
- Show date separator in thread
- Consider it a new conversation segment

### Translation Failure
- Translation API unavailable
- Show original with note: "Translation unavailable"
- Allow manual translation input

---

## Data Model

### messages table (from PRP-01)

Key fields for this PRP:
- id, work_order_id (nullable), portfolio_id
- direction: inbound | outbound
- channel: sms | email | phone | portal
- sender_type: tenant | coordinator | technician | system
- sender_phone, sender_name
- content (original), content_translated, original_language
- delivery_status: pending | sent | delivered | failed
- read_at (nullable)
- created_at

### Quick Replies Storage

Option A: Config file (hardcoded quick replies)
Option B: Database table (customizable per portfolio)

```sql
CREATE TABLE quick_replies (
  id UUID PRIMARY KEY,
  portfolio_id UUID REFERENCES portfolios(id),
  category TEXT, -- scheduling, access, followup
  label TEXT,    -- Button text
  content TEXT,  -- Full message with placeholders
  sort_order INT,
  active BOOLEAN DEFAULT true
);
```

---

## Real-Time Updates

### Options

**Polling:**
- Check for new messages every 30 seconds
- Simple but not instant

**WebSocket / Supabase Realtime:**
- Subscribe to messages table changes
- Instant updates when message arrives
- More complex but better UX

**Recommendation:**
- Start with polling (simpler)
- Add realtime later if needed

### Subscription Pattern

```javascript
// Supabase realtime subscription
supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `portfolio_id=eq.${portfolioId}`
  }, handleNewMessage)
  .subscribe()
```

---

## Validation Criteria

### Message Display
- [ ] Conversation list shows all threads
- [ ] Unread messages have indicator
- [ ] Clicking conversation opens thread
- [ ] Thread shows all messages in order
- [ ] Translations displayed correctly

### Sending Messages
- [ ] Can type and send reply
- [ ] Message appears in thread immediately (optimistic)
- [ ] SMS actually sends (check Twilio logs)
- [ ] Delivery status updates
- [ ] Translation applied for non-English tenant

### Unread Tracking
- [ ] New message → unread indicator appears
- [ ] Opening thread → messages marked read
- [ ] Badge count updates correctly
- [ ] Work order has_unread_messages updates

### Quick Replies
- [ ] Quick reply dropdown appears
- [ ] Clicking inserts text
- [ ] Can edit before sending
- [ ] Placeholders work

### Work Order Creation
- [ ] New message without WO shows "Create WO" option
- [ ] Clicking opens modal with pre-filled data
- [ ] Creating WO links message correctly

---

## Dependencies

**Requires:**
- PRP-01 (Data Layer) - messages table, work_orders table
- PRP-02 (Auth) - only authorized users see messages
- SMS Agent service running and configured

**External:**
- Twilio account and webhook configured
- Translation API (OpenAI or Google Translate)

---

## Implementation Checklist

### Phase 1: Message Display
- [ ] Create Messages page layout
- [ ] Fetch conversations grouped by work order
- [ ] Display conversation list
- [ ] Display thread view
- [ ] Show translations

### Phase 2: Read/Unread
- [ ] Track read_at on messages
- [ ] Update has_unread_messages on work orders
- [ ] Show unread indicators
- [ ] Badge in navigation

### Phase 3: Sending
- [ ] Reply input and send button
- [ ] Create message via API
- [ ] Integration with SMS Agent
- [ ] Show pending/sent/delivered status

### Phase 4: Translation
- [ ] Detect tenant language
- [ ] Translate outbound messages
- [ ] Store both versions
- [ ] Display correctly

### Phase 5: Quick Replies
- [ ] Add quick reply data
- [ ] Dropdown or button UI
- [ ] Insert into input

### Phase 6: Work Order Creation
- [ ] Identify messages without WO
- [ ] Create WO modal
- [ ] Link message after creation

### Phase 7: Real-Time (Optional)
- [ ] Supabase realtime subscription
- [ ] Handle new message events
- [ ] Update UI without refresh

# PRP-10: Automated Communications (Phase 2)

## Goal
Implement automated message triggers so tenants and technicians receive updates without manual coordinator action.

## Success Criteria
- [ ] Auto-send when work order assigned
- [ ] Auto-send when technician en route
- [ ] Auto-send appointment reminders (day before)
- [ ] Auto-send completion notification
- [ ] Coordinator can preview/edit before auto-send
- [ ] Disable auto-send per work order if needed

---

## Context

**Integration:** Messages go to Supabase, SMS Agent (separate service) handles Twilio delivery

**Auto-send triggers:**
- Work order status change
- Scheduled time approaching
- Technician checks in

**Languages:** Use tenant's preferred language (stored in tenant profile)

---

## Tasks

### Task 1: Communication Templates Table
Add to Supabase:
- Table: communication_templates
- Fields: id, trigger_type, language, subject, body, is_active

### Task 2: Auto-Send Settings UI
CREATE `src/components/settings/AutoSendSettings.tsx`
- Toggle auto-send on/off globally
- Per-trigger settings:
  - Assignment notification: ON/OFF
  - En route notification: ON/OFF
  - Reminder (day before): ON/OFF
  - Completion notification: ON/OFF
- Preview template text

### Task 3: Template Editor
CREATE `src/components/settings/TemplateEditor.tsx`
- Select template by trigger type
- Edit body text
- Variable placeholders: {{tenant_name}}, {{technician_name}}, {{scheduled_date}}, {{property_address}}
- Preview with sample data
- Save updates template

### Task 4: Auto-Send Queue Hook
CREATE `src/hooks/useAutoSend.ts`
- Listens to work order status changes
- Determines if auto-send should trigger
- Generates message from template
- Creates message record in Supabase
- SMS Agent picks up and sends

### Task 5: Pre-Send Preview Modal
CREATE `src/components/messages/PreSendPreviewModal.tsx`
- Shows before auto-send executes
- "This message will be sent in 10 seconds"
- Edit button to modify
- Send Now / Cancel buttons
- Countdown timer

### Task 6: Work Order Auto-Send Toggle
MODIFY `src/components/work-orders/WorkOrderDetailPanel.tsx`
- Add "Auto-notifications" toggle
- Shows which notifications are enabled
- Override global settings for this WO

---

## Validation Checkpoints

1. Assign work order - auto-send triggers
2. Preview modal appears with message
3. Edit message - changes reflected
4. Cancel - message not sent
5. Disable auto-send - no preview appears on assign

---

## Files to Create
- src/components/settings/AutoSendSettings.tsx
- src/components/settings/TemplateEditor.tsx
- src/hooks/useAutoSend.ts
- src/components/messages/PreSendPreviewModal.tsx

## Files to Modify
- src/components/work-orders/WorkOrderDetailPanel.tsx

---

## Anti-Patterns
- ❌ Don't send without ability to cancel/preview
- ❌ Don't hardcode template text
- ❌ Don't forget language selection
- ❌ Don't send duplicate messages on rapid status changes

---

## Next
PRP-11: Workload Protection

# PRP-24: Tenant Self-Service Portal

## Goal
Enable tenants to submit maintenance requests, track status, and communicate without calling the office.

## Success Criteria
- [ ] Tenant login (phone/email verification)
- [ ] Submit new maintenance request
- [ ] View request status and history
- [ ] Message thread with maintenance team
- [ ] Schedule availability preferences
- [ ] Photo upload with request
- [ ] Multi-language support

---

## Context

**User:** Tenants (not internal staff)
**Access:** Public-facing, simple authentication
**Languages:** English, Spanish, Chinese (per tenant preference)

**Reduces:**
- Phone calls to office
- Coordinator time on intake
- Miscommunication

---

## Tasks

### Task 1: Tenant Authentication
- Phone or email verification (OTP)
- No password required
- Remember device for 30 days
- Lookup tenant by unit
- Link to existing tenant record

### Task 2: Portal Home Page
- "Submit New Request" button
- List of open requests with status
- List of past requests (collapsed)
- Unread message indicator

### Task 3: Submit Request Form
- Category selector (Plumbing, Electrical, Appliance, etc.)
- Description text area
- Photo upload (optional but encouraged)
- Urgency selection (Emergency, Normal, When convenient)
- Permission to enter toggle
- Preferred availability (day/time picker)

### Task 4: Request Status View
- Current status with explanation
- Timeline of updates
- Scheduled appointment (if any)
- Technician name (if assigned)
- Message thread

### Task 5: Tenant Messaging
- Reply to coordinator messages
- Send new message about request
- Attach photos to messages
- Delivery confirmation
- Auto-translation if needed

### Task 6: Availability Preferences
- Set general availability
- Block specific times
- Save for future requests
- "Anytime" option

### Task 7: Multi-Language Support
- Detect browser language
- Language selector
- All UI strings translated
- Messages auto-translated
- Request description can be in any language

### Task 8: Satisfaction Survey
- After request completed
- Simple 1-5 star rating
- Optional comment
- Feeds into tenant profile

---

## Files to Create
- src/portal/TenantPortal.tsx
- src/portal/pages/PortalHome.tsx
- src/portal/pages/SubmitRequest.tsx
- src/portal/pages/RequestDetail.tsx
- src/portal/components/TenantAuth.tsx
- src/portal/components/RequestForm.tsx
- src/portal/components/TenantMessages.tsx
- src/portal/components/AvailabilityPicker.tsx
- src/portal/components/SatisfactionSurvey.tsx
- src/hooks/useTenantAuth.ts

---

## Anti-Patterns
- ❌ Don't require complex passwords
- ❌ Don't show internal staff info
- ❌ Don't expose other tenant data
- ❌ Don't assume English
- ❌ Don't allow emergency-only submissions for non-emergencies

---

## Phase: 3

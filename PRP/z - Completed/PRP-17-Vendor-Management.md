# PRP-17: Vendor Management System

## Goal
Implement vendor request workflow where external contractors receive requests (not assignments) and coordinator maintains selection authority.

## Success Criteria
- [ ] Vendor directory with categories and certifications
- [ ] Create vendor request from work order
- [ ] Auto-distribute request to qualified vendors
- [ ] Vendors respond with availability/quote
- [ ] Coordinator compares and selects
- [ ] Same quality standards as internal techs
- [ ] Performance tracking per vendor

---

## Context

**Key distinction:** Vendors get REQUESTS, not assignments. They can accept/decline. Coordinator makes final selection.

**Vendor categories:**
- Emergency contractors (24/7, 2hr response)
- Specialized services (HVAC, electrical, licensed work)
- Seasonal contractors (snow, landscaping)
- Project contractors (turnovers, renovations)

**Response timeframes:**
- Emergency: 2 hours
- Specialized: 4 hours
- Standard: 24 hours

---

## Tasks

### Task 1: Vendors Table
Add to Supabase:
- vendors: id, name, company, phone, email, categories[], certifications[], emergency_available, hourly_rate, response_time_avg, quality_score, is_active

### Task 2: Vendor Requests Table
- vendor_requests: id, work_order_id, vendor_ids[], status, deadline, created_at
- vendor_responses: id, request_id, vendor_id, response (accept/decline/info_needed), proposed_time, quote_amount, notes, responded_at

### Task 3: Vendor Directory Page
- List all vendors with filters
- Filter by: category, certification, availability
- Add/edit vendor modal
- Performance metrics per vendor
- Route: /vendors

### Task 4: Create Vendor Request Flow
- From work order detail: "Request Vendor" button
- Select vendor category
- System finds qualified vendors
- Set response deadline
- Add work details and requirements
- Send request (SMS/email to vendors)

### Task 5: Vendor Response Tracking
- Dashboard showing open requests
- Which vendors responded
- Compare: timeline, quote, availability
- Select winning vendor
- Notify selected and rejected vendors

### Task 6: Vendor Portal (Simple)
- Unique link per request
- Vendor sees: work details, photos, deadline
- Respond: Accept with time, Decline with reason, Request more info
- No login required (token-based)

### Task 7: Vendor Performance Dashboard
- Response time average
- Acceptance rate
- Completion rate
- Quality score (coordinator ratings)
- Cost performance

---

## Files to Create
- src/pages/VendorsPage.tsx
- src/pages/VendorDetailPage.tsx
- src/components/vendors/VendorDirectory.tsx
- src/components/vendors/VendorRequestModal.tsx
- src/components/vendors/VendorResponseTracker.tsx
- src/components/vendors/VendorPerformance.tsx
- src/hooks/useVendors.ts
- src/hooks/useVendorRequests.ts

---

## Anti-Patterns
- ❌ Don't assign directly to vendors (request only)
- ❌ Don't auto-select without coordinator approval
- ❌ Don't forget response deadlines
- ❌ Don't skip quality verification for vendor work

---

## Phase: 2

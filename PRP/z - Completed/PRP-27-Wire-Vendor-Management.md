# PRP-27: Wire Vendor Management to Supabase

## Goal
Connect existing Vendor Management UI to Supabase for real CRUD operations.

## Current State
- UI exists: VendorsPage, VendorDirectory, VendorRequestModal
- Uses mock vendor data
- "Add Vendor" shows coming soon toast
- Vendor requests are mock

## Success Criteria
- [ ] Vendors table in Supabase with real data
- [ ] Vendor requests table tracking request/response flow
- [ ] "Add Vendor" opens modal and saves to DB
- [ ] "Request Vendor" from work order creates real request
- [ ] Vendor responses tracked in DB

---

## Tasks

### Task 1: Vendors Tables
Add to Supabase:
```sql
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  categories TEXT[] DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  emergency_available BOOLEAN DEFAULT false,
  hourly_rate NUMERIC(10,2),
  is_active BOOLEAN DEFAULT true,
  rating NUMERIC(3,2),
  response_time_avg_hours NUMERIC(5,2),
  jobs_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vendor_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES work_orders(id),
  category TEXT NOT NULL,
  description TEXT,
  urgency TEXT DEFAULT 'standard',
  deadline TIMESTAMPTZ,
  status TEXT DEFAULT 'pending', -- pending, responded, assigned, cancelled
  selected_vendor_id UUID REFERENCES vendors(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vendor_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES vendor_requests(id),
  vendor_id UUID REFERENCES vendors(id),
  response TEXT NOT NULL, -- 'accept', 'decline', 'info_needed'
  proposed_time TIMESTAMPTZ,
  quote_amount NUMERIC(10,2),
  notes TEXT,
  responded_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Task 2: Update useVendors Hook
MODIFY `src/hooks/useVendors.ts`:
- Fetch vendors from Supabase
- Add createVendor(data) function
- Add updateVendor(id, data) function
- Add deleteVendor(id) function (soft delete: is_active = false)

### Task 3: Create useVendorRequests Hook
CREATE `src/hooks/useVendorRequests.ts`:
- Fetch vendor_requests with responses joined
- createRequest(workOrderId, category, description)
- selectVendor(requestId, vendorId)
- cancelRequest(requestId)

### Task 4: Add Vendor Modal
CREATE `src/components/vendors/AddVendorModal.tsx`:
- Form: name, company, phone, email, categories (multi-select), certifications
- Emergency available toggle
- Hourly rate input
- On save: calls createVendor(), closes modal, refreshes list

### Task 5: Wire VendorDirectory
MODIFY `src/components/vendors/VendorDirectory.tsx`:
- Replace mock data with useVendors() hook
- "Add Vendor" button opens AddVendorModal
- Edit button opens modal in edit mode
- Implement real filtering

### Task 6: Wire VendorRequestModal
MODIFY `src/components/vendors/VendorRequestModal.tsx`:
- On submit: calls createRequest()
- Shows real vendors matching category
- Tracks responses from vendor_responses table

### Task 7: Seed Initial Vendors
Create seed data for testing:
- 3-5 vendors with different categories
- Emergency plumber, HVAC specialist, general contractor

---

## Validation Checkpoints
1. Vendors table has seed data
2. /vendors shows real vendor list
3. "Add Vendor" creates vendor in DB
4. Creating vendor request from WO detail works
5. Request appears in vendor requests list

---

## Files to Modify
- src/hooks/useVendors.ts
- src/components/vendors/VendorDirectory.tsx
- src/components/vendors/VendorRequestModal.tsx

## Files to Create
- src/hooks/useVendorRequests.ts
- src/components/vendors/AddVendorModal.tsx
- Supabase migration for vendor tables
- Seed data SQL

---

## Anti-Patterns
- ❌ Don't hard-delete vendors (soft delete only)
- ❌ Don't allow request without work_order_id
- ❌ Don't skip response deadline tracking

# P02-04: Vendor Request System

## Goal
Coordinator creates request → SMS to vendors → track responses → select winner

## Tables

```sql
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  categories TEXT[],
  hourly_rate DECIMAL,
  rating DECIMAL DEFAULT 5.0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE vendor_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES work_orders(id),
  category TEXT,
  message TEXT,
  deadline TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  selected_vendor_id UUID REFERENCES vendors(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE vendor_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES vendor_requests(id),
  vendor_id UUID REFERENCES vendors(id),
  response_type TEXT,
  proposed_time TIMESTAMPTZ,
  quote_amount DECIMAL,
  message TEXT,
  received_at TIMESTAMPTZ DEFAULT now()
);
```

## Files
- `src/hooks/useVendors.ts`
- `src/hooks/useVendorRequests.ts`
- `src/components/vendors/VendorRequestModal.tsx`
- `src/components/vendors/VendorResponsesPanel.tsx`

## Tasks
1. Create tables
2. useVendors: fetch active vendors, filter by category
3. useVendorRequests: fetch for WO, create, select winner
4. Modal: category, multi-select vendors, message, deadline
5. ResponsesPanel: list responses, select button per response

## Validation
- [ ] Create request with multiple vendors
- [ ] Responses show vendor, quote, availability
- [ ] Select vendor updates WO assignment

# PRP-29: Wire Tenant Portal to Real Work Orders

## Goal
Connect Tenant Portal requests to create real work orders in Supabase.

## Current State
- UI exists: TenantPortalPage, phone verification flow (code: 123456)
- Request form captures category, description, photos
- Requests don't persist to database
- Messages don't persist
- No link between tenant and real units

## Success Criteria
- [ ] Tenant sessions stored in Supabase
- [ ] Request submissions create real work orders
- [ ] Work orders appear in main coordinator list with "tenant_portal" source
- [ ] Tenant can view their actual request status
- [ ] Photos uploaded to Supabase storage

---

## Tasks

### Task 1: Tenant Portal Tables
Add to Supabase:
```sql
CREATE TABLE tenant_portal_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  verification_code TEXT,
  verified_at TIMESTAMPTZ,
  tenant_id UUID, -- Link to tenant record if found
  unit_id UUID,   -- Link to unit if tenant found
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tenant_portal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES tenant_portal_sessions(id),
  phone TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  permission_to_enter TEXT DEFAULT 'yes',
  urgency TEXT DEFAULT 'normal',
  photos TEXT[] DEFAULT '{}', -- Storage URLs
  work_order_id UUID REFERENCES work_orders(id),
  status TEXT DEFAULT 'submitted', -- submitted, work_order_created, in_progress, completed
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Task 2: Create useTenantPortal Hook
CREATE `src/hooks/useTenantPortal.ts`:
- startVerification(phone): creates session, returns code (dev: always 123456)
- verifyCode(sessionId, code): marks session verified
- submitRequest(sessionId, data): 
  - Creates tenant_portal_request
  - Creates work_order with source='tenant_portal'
  - Links work_order_id to request
  - Returns request ID
- getMyRequests(sessionId): returns requests for this session
- getRequestStatus(requestId): returns current status

### Task 3: Photo Upload
Add photo upload to Supabase Storage:
- Bucket: tenant-request-photos
- On submit: upload photos, get URLs
- Store URLs in tenant_portal_requests.photos
- Link to work_order photos

### Task 4: Wire TenantPortalPage
MODIFY `src/pages/TenantPortalPage.tsx`:
- Replace mock verification with useTenantPortal hook
- On verify: call verifyCode()
- On submit request: call submitRequest()
- Show real request status from getMyRequests()

### Task 5: Work Order Creation Logic
In submitRequest():
```typescript
// Create work order
const workOrder = await supabase.from('work_orders').insert({
  description: request.description,
  category: request.category,
  priority: request.urgency === 'emergency' ? 'emergency' : 'medium',
  source: 'tenant_portal',
  status: 'new',
  permission_to_enter: request.permission_to_enter,
  tenant_phone: session.phone,
  // unit_id and property_id if tenant found
}).select().single();

// Link to portal request
await supabase.from('tenant_portal_requests').update({
  work_order_id: workOrder.id,
  status: 'work_order_created'
}).eq('id', requestId);
```

### Task 6: Status Sync
When coordinator updates work_order status:
- Trigger/function updates tenant_portal_requests.status
- Options: Add Supabase function or check on load

### Task 7: Test Full Flow
1. Go to /tenant-portal
2. Enter phone, verify with 123456
3. Submit request with photo
4. Verify WO appears in /work-orders
5. Update WO status, verify tenant sees update

---

## Validation Checkpoints
1. Phone verification creates session
2. Request submission creates work_order
3. Work order visible in coordinator dashboard
4. Work order has source='tenant_portal'
5. Tenant sees their request status

---

## Files to Modify
- src/pages/TenantPortalPage.tsx (or components)

## Files to Create
- src/hooks/useTenantPortal.ts
- Supabase migration for portal tables
- Supabase storage bucket config

---

## Anti-Patterns
- ❌ Don't require tenant to exist in system (allow anonymous requests)
- ❌ Don't lose session on refresh (store in localStorage)
- ❌ Don't create WO without linking to portal request

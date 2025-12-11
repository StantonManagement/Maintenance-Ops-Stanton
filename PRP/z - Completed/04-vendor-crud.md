# PRP 04: Vendor Management

## Goal
Replace dead "Add Vendor" and "Create Request" buttons with working functionality.

## Pre-Check
```bash
grep -r "Vendor" src/types/ src/services/ src/hooks/
grep -r "Add Vendor\|Create Request" src/
```

## Create Files

### 1. `src/schemas/vendor.ts`
Zod schema:
- `company_name` (required)
- `contact_name` (required)
- `email` (required, email format)
- `phone` (required)
- `category` (enum: emergency, specialized, seasonal, project)
- `specialties` (array of strings)
- `hourly_rate` (number, optional)
- `response_time_hours` (number, based on category defaults from config_rules.json)
- `status` (enum: active, inactive, pending)

### 2. `src/components/vendors/AddVendorModal.tsx`
- Form for vendor details
- Category selection should auto-fill response_time_hours based on config_rules.json:
  - emergency: 2 hours
  - specialized: 4 hours
  - standard: 24 hours
  - project: 48 hours
- Insert to `vendors` table

### 3. `src/components/vendors/CreateVendorRequestModal.tsx`
- This is for RFP (Request for Proposal) to vendors
- Fields: work_order_id (select from open work orders), vendor_ids (multi-select), deadline, notes
- Insert to `vendor_requests` table
- Status flow: pending → accepted/declined

### 4. `src/hooks/useVendorMutations.ts`
- `useCreateVendor()`
- `useUpdateVendor()`
- `useCreateVendorRequest()`

## Modify Files

### Find "Add Vendor" button
- Wire to AddVendorModal

### Find "Create Request" button
- Wire to CreateVendorRequestModal

### Vendor list
- Add edit/delete functionality

## Validation
```bash
npm run build
# Manual: Add vendor, verify in database
# Manual: Create vendor request for a work order
```

## Field Names
```typescript
// vendors table
id, company_name, contact_name, email, phone, category, specialties, 
hourly_rate, response_time_hours, rating, status, created_at

// vendor_requests table
id, work_order_id, vendor_id, status, requested_at, responded_at, 
quote_amount, notes, created_by
```

## Business Rules (from Vendor_Management.md)
- Vendors receive REQUESTS not assignments
- Coordinator maintains final selection authority
- Same quality standards as internal techs (photos required)

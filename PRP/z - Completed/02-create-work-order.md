# PRP 02: Create Work Order

## Goal
Replace dead "Create Work Order" button with functional modal that saves to database.

## Pre-Check
```bash
# Find existing work order types
grep -r "WorkOrder" src/types/ src/services/
# Find where button exists
grep -r "Create Work Order" src/
```

## Install
```bash
npm install zod react-hook-form @hookform/resolvers
```

## Create Files

### 1. `src/schemas/workOrder.ts`
Zod schema for work order creation with fields:
- `description` (required, min 10 chars)
- `priority` (enum: emergency, high, medium, low, cosmetic)
- `property_code` (required)
- `unit_number` (required)
- `resident_name` (optional)
- `category` (enum: plumbing, electrical, hvac, appliance, general)

### 2. `src/components/work-orders/CreateWorkOrderModal.tsx`
- Modal dialog (use existing modal pattern if one exists, else create)
- Form with react-hook-form + zod resolver
- Fields: Description (textarea), Priority (select), Property (select), Unit (input), Category (select)
- Submit button calls Supabase insert
- Show loading state during submit
- On success: toast.success, close modal, trigger refetch
- On error: toast.error with handleApiError

### 3. `src/hooks/useCreateWorkOrder.ts`
- Mutation hook that inserts to appropriate table
- **IMPORTANT**: Check if writing to `AF_work_order_new` (might be read-only)
- If read-only, may need separate `work_orders` table for user-created orders
- Return `{ mutate, isLoading, error }`

## Modify Files

### Find and update the "Create Work Order" button location
- Import `CreateWorkOrderModal`
- Add state: `const [showModal, setShowModal] = useState(false)`
- Wire button onClick to `setShowModal(true)`
- Render modal conditionally

## Validation
```bash
npm run build
# Manual: Click button, modal opens
# Manual: Fill form, submit, verify row in Supabase
# Manual: Submit invalid data, verify error messages show
```

## Database Check
```sql
-- Run in Supabase to verify table is writable
INSERT INTO work_orders (description, priority) VALUES ('test', 'low');
DELETE FROM work_orders WHERE description = 'test';
-- If AF_work_order_new is read-only, create work_orders table first
```

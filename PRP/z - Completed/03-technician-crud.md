# PRP 03: Technician Management

## Goal
Replace dead "Add Technician" button with functional modal. Wire up assignment and reports buttons.

## Pre-Check
```bash
# Find existing technician types and hooks
grep -r "Technician" src/types/ src/services/ src/hooks/
# Find the button location
grep -r "Add Technician" src/
```

## Create Files

### 1. `src/schemas/technician.ts`
Zod schema:
- `name` (required)
- `email` (required, email format)
- `phone` (required)
- `skills` (array of strings, min 1)
- `certifications` (array of strings, optional)
- `status` (enum: available, busy, off_duty)
- `max_daily_orders` (number, default 6 per config_rules.json)

### 2. `src/components/technicians/AddTechnicianModal.tsx`
- Form with fields: Name, Email, Phone, Skills (multi-select or tags), Certifications, Status
- Insert to `technicians` table
- Success: toast + close + refetch

### 3. `src/components/technicians/EditTechnicianModal.tsx`
- Same form but pre-populated
- Update instead of insert
- Accept `technicianId` prop

### 4. `src/hooks/useTechnicianMutations.ts`
- `useCreateTechnician()` - insert
- `useUpdateTechnician()` - update
- `useDeleteTechnician()` - soft delete (set status to inactive) or hard delete

## Modify Files

### Find "Add Technician" button
- Wire to open AddTechnicianModal

### Find technician list/cards
- Add edit button that opens EditTechnicianModal
- Add delete button with confirmation

### Fix "Assign Work Order" button (in technician profile)
- Should open work order selector
- Insert to `work_order_assignments` table
- Fields: `work_order_id`, `technician_id`, `assigned_at`, `assigned_by`

### Fix "Performance Reports" button
- Navigate to `/technicians/:id/reports` or show inline stats
- Query completed work orders for that technician
- Calculate: completion rate, avg time, jobs this week

## Validation
```bash
npm run build
# Manual: Add technician, verify in database
# Manual: Edit technician, verify changes saved
# Manual: Assign work order to technician
```

## Field Names (use exactly)
```typescript
// technicians table
id, name, email, phone, skills, certifications, status, max_daily_orders, current_workload, created_at

// work_order_assignments table  
id, work_order_id, technician_id, assigned_at, assigned_by, status, notes
```

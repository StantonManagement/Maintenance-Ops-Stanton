# Master Execution Guide

## Execution Order
1. `01-error-handling.md` (1 hr) - Blocks everything
2. `02-create-work-order.md` (2 hrs)
3. `03-technician-crud.md` (2 hrs)
4. `04-vendor-crud.md` (2 hrs)
5. `05-preventive-maintenance.md` (2 hrs)
6. `06-analytics-real-data.md` (2 hrs)

## 🔒 FIELD NAME LOCK - Use Exactly

**Work Orders (AF_work_order_new - READ ONLY):**
- `ServiceRequestId`, `Description`, `Status`, `Priority`
- `PropertyCode`, `CreatedDate`, `ResidentName`, `UnitNumber`

**Technicians table:**
- `id`, `name`, `email`, `phone`, `skills`, `certifications`
- `status` ('available'|'busy'|'off_duty'), `max_daily_orders`, `current_workload`

**Vendors table:**
- `id`, `company_name`, `contact_name`, `email`, `phone`
- `category` ('emergency'|'specialized'|'seasonal'|'project')
- `specialties`, `hourly_rate`, `response_time_hours`, `rating`, `status`

**Status values (from config_rules.json):**
- `new`, `scheduled`, `in_progress`, `waiting_parts`, `waiting_access`
- `ready_review`, `completed`, `failed_review`, `cancelled`

**Priority values:**
- `emergency`, `high`, `medium`, `low`, `cosmetic`

## Windsurf Rules

**BEFORE each file change:** `npm run build`
**AFTER each file change:** `npm run build`
**If build fails:** FIX before continuing, don't chain broken changes

**DO NOT:**
- Create types that already exist in `src/services/supabase.ts`
- Use `any` type
- Rename existing fields
- Skip validation checkpoints

**DO:**
- Use `@workspace` to find existing patterns
- Match existing component structure
- Use Tailwind only (no inline styles)
- Log errors to console with context

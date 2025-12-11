# PRP 05: Preventive Maintenance & Rules

## Goal
Replace dead "New Schedule" and "New Rule" buttons with working functionality.

## Pre-Check
```bash
grep -r "Schedule\|Rule" src/components/ src/hooks/
grep -r "Coming Soon" src/  # Find all dead buttons
```

## Create Files

### 1. `src/schemas/preventiveMaintenance.ts`
Zod schema for schedule:
- `name` (required)
- `description` (optional)
- `category` (enum: hvac, plumbing, electrical, appliance, safety, general)
- `frequency_months` (number) - use defaults from config_rules.json:
  - hvac_maintenance: 6
  - appliance_inspection: 12
  - safety_inspection: 12
  - filter_replacement: 3
- `property_ids` (array of property codes)
- `unit_ids` (array, optional - if empty, applies to all units in property)
- `next_due_date` (date)
- `assigned_technician_id` (optional)

### 2. `src/components/preventive/CreateScheduleModal.tsx`
- Form for schedule details
- Frequency dropdown with preset values
- Property/unit selector
- Insert to `preventive_schedules` table

### 3. `src/schemas/businessRule.ts`
Zod schema:
- `rule_name` (required)
- `rule_type` (enum: assignment, escalation, notification, validation)
- `conditions` (JSON object)
- `actions` (JSON object)
- `priority` (number)
- `active` (boolean)

### 4. `src/components/rules/RuleEditorModal.tsx`
- Form for rule definition
- Condition builder (simplified - key/operator/value)
- Action selector
- Insert/update to `business_rules` table

## Modify Files

### Find "New Schedule" button
- Wire to CreateScheduleModal

### Find "New Rule" / "Edit Rule" buttons
- Wire to RuleEditorModal

## Database Tables Needed
```sql
-- preventive_schedules
id, name, description, category, frequency_months, property_ids, 
unit_ids, next_due_date, last_completed_date, assigned_technician_id,
status, created_at

-- business_rules
id, rule_name, rule_type, conditions, actions, priority, active, 
created_at, updated_at
```

## Validation
```bash
npm run build
# Manual: Create schedule, verify in database
# Manual: Create/edit rule, verify saved
```

## Reference
- See `config_rules.json` for existing rule structure
- See `preventive_maintenance` section for frequency defaults

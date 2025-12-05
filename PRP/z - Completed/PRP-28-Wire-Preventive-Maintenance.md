# PRP-28: Wire Preventive Maintenance to Work Orders

## Goal
Connect existing Preventive Maintenance UI to create real work orders when schedules are due.

## Current State
- UI exists: PreventiveMaintenancePage, ScheduleList, ComplianceCalendar
- Uses mock schedule data
- "Generate Work Order" updates mock next_due but doesn't create real WO
- "New Schedule" shows coming soon toast

## Success Criteria
- [ ] Preventive schedules stored in Supabase
- [ ] "Generate Work Order" creates real WO in work_orders table
- [ ] Generated WO tagged with preventive_maintenance category
- [ ] WO appears in main work order list
- [ ] Schedule next_due updates after generation
- [ ] "New Schedule" creates real schedule

---

## Tasks

### Task 1: Preventive Schedules Table
Add to Supabase:
```sql
CREATE TABLE preventive_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  frequency_type TEXT NOT NULL, -- 'days', 'weeks', 'months', 'seasonal'
  frequency_value INTEGER, -- e.g., 6 for "every 6 months"
  seasonal_trigger TEXT, -- 'pre_winter', 'pre_summer', null
  property_ids TEXT[] DEFAULT '{}', -- empty = all properties
  unit_ids TEXT[] DEFAULT '{}', -- empty = all units in property
  equipment_type TEXT, -- 'hvac', 'water_heater', 'boiler', etc.
  is_active BOOLEAN DEFAULT true,
  last_generated TIMESTAMPTZ,
  next_due DATE,
  work_order_template JSONB, -- {description, priority, estimated_hours, skills}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE preventive_work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES preventive_schedules(id),
  work_order_id UUID REFERENCES work_orders(id),
  generated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Task 2: Update usePreventiveSchedules Hook
MODIFY `src/hooks/usePreventiveSchedules.ts`:
- Fetch from preventive_schedules table
- Add createSchedule(data) function
- Add updateSchedule(id, data) function
- Add toggleActive(id) function
- Add generateWorkOrder(scheduleId) function:
  - Creates work_order using work_order_template
  - Sets category = 'preventive_maintenance'
  - Links in preventive_work_orders table
  - Updates last_generated and next_due
  - Returns new work order ID

### Task 3: Calculate next_due Logic
In generateWorkOrder():
- If frequency_type = 'days': next_due = today + frequency_value days
- If frequency_type = 'weeks': next_due = today + frequency_value weeks
- If frequency_type = 'months': next_due = today + frequency_value months
- If frequency_type = 'seasonal': next_due = next seasonal date

### Task 4: New Schedule Modal
CREATE `src/components/preventive/NewScheduleModal.tsx`:
- Form fields: name, description, frequency type/value, properties, equipment type
- Work order template: description, priority, estimated hours
- On save: calls createSchedule(), refreshes list

### Task 5: Wire Generate Button
MODIFY `src/components/preventive/ScheduleList.tsx`:
- "Generate Work Order" calls generateWorkOrder(scheduleId)
- Shows success toast with link to new WO
- Refreshes schedule to show updated next_due

### Task 6: Wire New Schedule Button
MODIFY `src/pages/PreventiveMaintenancePage.tsx`:
- "New Schedule" button opens NewScheduleModal
- Remove "coming soon" toast

### Task 7: Seed Initial Schedules
Create seed data:
- Boiler maintenance (seasonal: pre_winter)
- HVAC filter change (every 3 months)
- Water heater inspection (every 12 months)

---

## Validation Checkpoints
1. preventive_schedules table has seed data
2. /preventive-maintenance shows real schedules
3. "Generate Work Order" creates WO in work_orders
4. New WO visible in /work-orders with preventive tag
5. Schedule next_due updates after generation
6. "New Schedule" creates new schedule in DB

---

## Files to Modify
- src/hooks/usePreventiveSchedules.ts
- src/components/preventive/ScheduleList.tsx
- src/pages/PreventiveMaintenancePage.tsx

## Files to Create
- src/components/preventive/NewScheduleModal.tsx
- Supabase migration for preventive tables
- Seed data SQL

---

## Anti-Patterns
- ❌ Don't generate duplicate WOs for same period
- ❌ Don't lose link between schedule and generated WO
- ❌ Don't forget to update next_due after generation

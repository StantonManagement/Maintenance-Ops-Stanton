# PRP-20: Preventive Maintenance Scheduling

## Goal
Automate scheduling of recurring maintenance tasks: boiler prep, HVAC service, filter changes, inspections.

## Success Criteria
- [ ] Define recurring maintenance schedules
- [ ] Auto-generate work orders on schedule
- [ ] Seasonal triggers (boiler prep before winter)
- [ ] Equipment-based schedules (water heater flush annually)
- [ ] Compliance tracking (Section 8 inspections)
- [ ] Calendar integration showing upcoming preventive work

---

## Context

**From business docs:**
- Boiler maintenance: October-November before frost
- HVAC maintenance: Every 6 months
- Filter replacement: Every 3 months
- Safety inspection: Annual

**Trigger types:**
- Calendar-based (every X months)
- Seasonal (before winter, before summer)
- Equipment age-based (water heater > 10 years = annual inspection)
- Compliance-based (Section 8 inspection schedule)

---

## Tasks

### Task 1: Preventive Schedules Table
Add to Supabase:
- preventive_schedules: id, name, description, frequency_type, frequency_value, seasonal_trigger, property_ids[], unit_ids[], equipment_type, is_active, last_generated, next_due

### Task 2: Schedule Management Page
- List all preventive schedules
- Create/edit schedule modal
- Toggle active/inactive
- Shows: next due date, last completed
- Route: /preventive-maintenance

### Task 3: Schedule Generator Service
- Runs daily (cron or Supabase function)
- Checks which schedules are due
- Creates work orders automatically
- Tags as "preventive_maintenance"
- Notifies coordinator of generated WOs

### Task 4: Seasonal Trigger Logic
- Define seasons: Pre-Winter (Oct 1), Pre-Summer (Apr 1)
- Trigger boiler prep for all buildings before frost
- Trigger A/C check before summer
- Configurable dates per region

### Task 5: Equipment-Based Triggers
- Link to unit equipment inventory (PRP-14)
- "Water heater > 10 years old" → annual inspection
- "HVAC > 5 years" → semi-annual service
- Generate work order with equipment context

### Task 6: Compliance Calendar
- View: upcoming inspections and deadlines
- Section 8 annual inspection dates
- City code inspection dates
- Warning when deadline approaching
- Overdue highlighted red

### Task 7: Preventive Work Order Template
- Pre-fill description based on schedule type
- Include checklist items
- Link to equipment being serviced
- Estimated duration from historical data

---

## Files to Create
- src/pages/PreventiveMaintenancePage.tsx
- src/components/preventive/ScheduleList.tsx
- src/components/preventive/ScheduleEditor.tsx
- src/components/preventive/ComplianceCalendar.tsx
- src/components/preventive/SeasonalTriggers.tsx
- src/hooks/usePreventiveSchedules.ts
- src/services/scheduleGenerator.ts

---

## Anti-Patterns
- ❌ Don't generate without coordinator visibility
- ❌ Don't schedule on holidays/weekends unless configured
- ❌ Don't forget equipment context in work order
- ❌ Don't let compliance deadlines pass silently

---

## Phase: 3

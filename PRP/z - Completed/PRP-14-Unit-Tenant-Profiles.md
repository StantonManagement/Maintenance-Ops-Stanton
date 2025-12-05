# PRP-14: Unit & Tenant Profiles (Phase 3)

## Goal
Build profile systems for units and tenants to enable pattern analysis, responsibility determination, and predictive maintenance.

## Success Criteria
- [ ] Unit profile shows equipment inventory and history
- [ ] Tenant profile shows maintenance burden and patterns
- [ ] Equipment lifecycle tracking with replacement predictions
- [ ] Tenant responsibility score
- [ ] Lease renewal recommendations
- [ ] Historical cost analysis per unit/tenant

---

## Context

**Unit Profile Purpose:**
- Track equipment age and warranties
- Predict replacement needs
- Determine tenant vs owner responsibility
- Document condition at turnover

**Tenant Profile Purpose:**
- Track maintenance request frequency
- Compare cost vs building average
- Identify high-maintenance tenants
- Support lease renewal decisions

---

## Tasks

### Task 1: Unit Profile Tables
Add to Supabase:
- unit_equipment: id, unit_id, equipment_type, make, model, install_date, warranty_end, expected_lifespan_years, last_service_date
- unit_inspections: id, unit_id, inspection_type, date, passed, notes, photos

### Task 2: Tenant Profile Fields
Add to work_orders join query or separate table:
- Calculate: total WO count, monthly average, cost total
- Calculate: owner vs tenant responsibility ratio
- Calculate: comparison to building average

### Task 3: Unit Profile Page
CREATE `src/pages/UnitProfilePage.tsx`
- Route: /units/:unitId
- Sections: Equipment, Work Order History, Inspections, Photos
- Equipment table with replacement countdown
- Historical cost chart

### Task 4: Equipment Inventory Component
CREATE `src/components/units/EquipmentInventory.tsx`
- List of equipment in unit
- Shows: type, age, warranty status, next service due
- "Needs replacement soon" warnings
- Add/edit equipment modal

### Task 5: Tenant Profile Page
CREATE `src/pages/TenantProfilePage.tsx`
- Route: /tenants/:tenantId
- Sections: Contact Info, Maintenance History, Cost Analysis, Responsibility
- Charts: requests over time, cost over time
- Comparison to average tenant

### Task 6: Maintenance Burden Score
CREATE `src/components/tenants/MaintenanceBurdenScore.tsx`
- Visual score: Low, Medium, High
- Based on: request frequency, costs, damages
- Comparison: "2x building average"
- Trend: increasing/decreasing

### Task 7: Lease Renewal Recommendation
CREATE `src/components/tenants/LeaseRecommendation.tsx`
- AI-generated recommendation
- Factors: payment history, maintenance burden, damage incidents
- "Recommend renewal" / "Review before renewal" / "Consider non-renewal"
- Supporting data points

### Task 8: Predictive Replacement Widget
CREATE `src/components/units/PredictiveReplacement.tsx`
- List of equipment nearing end of life
- Based on install_date + expected_lifespan
- Shows: estimated replacement cost
- "Schedule preventive service" button

---

## Validation Checkpoints

1. Navigate to unit profile - equipment list loads
2. Add equipment with install date - calculates age
3. Navigate to tenant profile - history and score display
4. High-maintenance tenant shows warning
5. Equipment nearing EOL shows in predictions

---

## Files to Create
- src/pages/UnitProfilePage.tsx
- src/components/units/EquipmentInventory.tsx
- src/pages/TenantProfilePage.tsx
- src/components/tenants/MaintenanceBurdenScore.tsx
- src/components/tenants/LeaseRecommendation.tsx
- src/components/units/PredictiveReplacement.tsx

---

## Anti-Patterns
- ❌ Don't expose tenant scores to tenants
- ❌ Don't make lease recommendations without human review
- ❌ Don't forget data privacy (PII handling)
- ❌ Don't trust equipment dates without verification

---

## Next
PRP-15: AI Suggestions & Automation

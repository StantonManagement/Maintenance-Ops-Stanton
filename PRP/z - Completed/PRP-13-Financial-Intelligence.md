# PRP-13: Financial Intelligence (Phase 3)

## Goal
Implement financial categorization, CapEx tracking, and Section 8 classification per business rules.

## Success Criteria
- [ ] Work orders tagged as CapEx vs Maintenance
- [ ] Section 8 four-tier categorization working
- [ ] Longevity-based classification (>1 year = CapEx)
- [ ] Financial reports by category
- [ ] Tenant vs Owner responsibility tracking
- [ ] Budget tracking and alerts

---

## Context

**CapEx Rule (from docs):** If result lasts >1 year, it's CapEx
- Replace toilet → CapEx (10-15 year lifespan)
- Clear drain → Maintenance (service, not replacement)

**Section 8 Categories:**
1. Section 8 Inspection Repairs
2. Section 8 Tenant Maintenance
3. Section 8 Pre-Inspection
4. Tenant vs Owner Responsibility

---

## Tasks

### Task 1: Financial Classification Fields
Add to work_orders table:
- financial_category: 'capex' | 'maintenance' | 'unclassified'
- section_8_category: enum of 4 types
- estimated_lifespan_years: number
- is_replacement: boolean
- responsibility: 'owner' | 'tenant' | 'shared'
- cost_estimate: number
- actual_cost: number

### Task 2: Classification Helper Hook
CREATE `src/hooks/useFinancialClassification.ts`
- Input: work order description, work type
- Suggests: CapEx or Maintenance based on keywords
- Suggests: estimated lifespan
- Returns confidence score
- Coordinator can override

### Task 3: Classification UI on Work Order
CREATE `src/components/work-orders/FinancialClassification.tsx`
- Shows in work order detail panel
- AI suggestion with confidence
- Override dropdown
- Section 8 category selector (if applicable)
- Responsibility assignment

### Task 4: Financial Reports Page
CREATE `src/pages/FinancialReportsPage.tsx`
- Summary: Total CapEx, Total Maintenance
- Breakdown by property
- Breakdown by category
- Monthly trend charts
- Export to accounting format

### Task 5: Section 8 Dashboard
CREATE `src/components/financial/Section8Dashboard.tsx`
- Pie chart: 4 categories
- Table: work orders by category
- Inspection cost tracking
- Pre-inspection ROI calculation

### Task 6: Tenant Responsibility Tracker
CREATE `src/components/financial/TenantResponsibility.tsx`
- List of tenant-responsible items
- Total amount to recover
- Recovery status (billed, paid, disputed)
- Link to tenant profile

### Task 7: Budget Alerts
CREATE `src/components/financial/BudgetAlerts.tsx`
- Set budget per property per month
- Alert when approaching (80%) or exceeding (100%)
- Shows in dashboard and notifications
- Breakdown of what's driving cost

---

## Validation Checkpoints

1. Create work order "replace toilet" - suggests CapEx
2. Create work order "unclog drain" - suggests Maintenance
3. Financial reports show correct totals
4. Section 8 work orders categorized correctly
5. Budget alert triggers at threshold

---

## Files to Create
- src/hooks/useFinancialClassification.ts
- src/components/work-orders/FinancialClassification.tsx
- src/pages/FinancialReportsPage.tsx
- src/components/financial/Section8Dashboard.tsx
- src/components/financial/TenantResponsibility.tsx
- src/components/financial/BudgetAlerts.tsx

---

## Anti-Patterns
- ❌ Don't auto-classify without coordinator review option
- ❌ Don't use dollar thresholds for CapEx (use longevity)
- ❌ Don't forget audit trail for classification changes
- ❌ Don't mix property budgets

---

## Next
PRP-14: Unit & Tenant Profiles

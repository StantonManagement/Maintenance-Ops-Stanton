# PRP 06: Analytics Real Data

## Goal
Replace hardcoded MOCK data in analytics with real database queries. Fix export buttons.

## Pre-Check
```bash
# Find all mock data
grep -r "MOCK\|mock\|fake\|hardcoded" src/components/analytics/ src/hooks/useAnalytics
# Find export buttons
grep -r "Export\|Download\|CSV\|PDF" src/
```

## Issues to Fix

### 1. `avgResponseTime` - Currently hardcoded "2.4h"
**Fix:** Calculate from `event_logs` table
- Query events with type 'created' and 'assigned' 
- Calculate average time difference
- Return formatted string

### 2. `tenantSatisfaction` - Currently hardcoded "4.8"
**Fix:** Calculate from `reviews` table
- Query all reviews from last 30 days
- Average the `rating` field
- Return formatted string

### 3. `overdue` count - Currently fake
**Fix:** Calculate based on SLA from config_rules.json
- Query open work orders
- Compare `CreatedDate` + SLA hours vs now
- Count violations

### 4. Property Performance - Uses `MOCK_PROPERTY_STATS`
**Fix:** Query real property data
- Group work orders by `PropertyCode`
- Calculate completion rate, avg time per property

### 5. Budget Alerts - Uses hardcoded `BUDGETS` array
**Fix:** 
- Create `budgets` table if not exists
- Query actual budget vs spending per category
- Calculate percentage used

### 6. Export buttons - Show toast but no file
**Fix:** Actually generate files
- CSV: Use `papaparse` library
- PDF: Use `jspdf` or server-side generation

## Create/Modify Files

### 1. `src/services/analyticsService.ts`
Functions:
- `calculateAvgResponseTime(days: number): Promise<string>`
- `calculateTenantSatisfaction(days: number): Promise<string>`
- `calculateOverdueCount(slaRules: object): Promise<number>`
- `getPropertyPerformance(): Promise<PropertyStats[]>`
- `getBudgetStatus(): Promise<BudgetAlert[]>`

### 2. `src/hooks/useAnalytics.ts`
- Replace hardcoded values with calls to analyticsService
- Use loading states while fetching
- Handle errors gracefully

### 3. `src/lib/export.ts`
- `exportToCSV(data: object[], filename: string)`
- `exportToPDF(data: object[], title: string)` (optional, can be phase 2)

### 4. Fix Export button handlers
- Wire to actual export functions
- Pass current data to export

## Database Tables Needed
If not exists:
```sql
-- event_logs (for response time calculation)
id, work_order_id, event_type, event_timestamp, actor_id, actor_type

-- reviews (for satisfaction)
id, work_order_id, rating, feedback, submitted_at

-- budgets (for budget alerts)
id, category, monthly_budget, property_id, fiscal_year
```

## Install (for export)
```bash
npm install papaparse
npm install @types/papaparse --save-dev
```

## Validation
```bash
npm run build
# Manual: Check analytics page shows different numbers than before
# Manual: Click export, verify file downloads with real data
# Manual: Change date range filter, verify data changes
```

## SLA Reference (from config_rules.json)
```javascript
const SLA_HOURS = {
  emergency: 2,
  high: 24,
  medium: 72,
  low: 168,
  cosmetic: 336
}
```

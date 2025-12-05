# PRP-12: Analytics Dashboard (Phase 3)

## Goal
Build comprehensive analytics showing operational metrics, trends, and performance insights.

## Success Criteria
- [ ] Dashboard with key metric cards
- [ ] Charts: work order trends, completion rates, response times
- [ ] Technician performance leaderboard
- [ ] Property-level breakdown
- [ ] Date range filtering
- [ ] Export reports to CSV/PDF

---

## Context

**Metrics to track (from business docs):**
- First-time completion rate: >85% target
- Quality inspection pass rate: >90% target
- Schedule adherence: >92% target
- Tenant satisfaction: >88% target
- Rework rate: <15% target
- Auto-assignment rate: >70% target

---

## Tasks

### Task 1: Analytics Page
CREATE `src/pages/AnalyticsPage.tsx`
- Remove Phase lock overlay
- Date range picker (default: last 30 days)
- Tab sections: Overview, Technicians, Properties, Trends

**IMPORTANT: Correct import path for Tabs:**
```typescript
// CORRECT:
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

// WRONG (will cause build error):
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
```

### Task 2: Metrics Cards Row
CREATE `src/components/analytics/MetricsCardRow.tsx`
- Cards for each KPI
- Shows: current value, target, trend arrow (up/down)
- Color: green if meeting target, red if not
- Click card for detail drill-down

### Task 3: Work Order Trends Chart
CREATE `src/components/analytics/WorkOrderTrendsChart.tsx`
- Line chart: work orders created vs completed over time
- Bar chart: by priority level
- Toggle: daily, weekly, monthly
- Use Recharts or similar

### Task 4: Technician Leaderboard
CREATE `src/components/analytics/TechnicianLeaderboard.tsx`
- Ranked list of technicians
- Columns: name, WOs completed, first-time fix %, avg time
- Sort by different metrics
- Click row for tech detail

### Task 5: Property Performance Table
CREATE `src/components/analytics/PropertyPerformance.tsx`
- Table of properties
- Columns: property, WO count, avg completion time, cost
- Sort/filter by any column
- Identify problem properties (high WO count)

### Task 6: Response Time Analysis
CREATE `src/components/analytics/ResponseTimeChart.tsx`
- Chart showing time from created → assigned → completed
- Breakdown by priority
- Highlight where delays occur

### Task 7: Report Export
CREATE `src/components/analytics/ReportExport.tsx`
- Button to export current view
- Formats: CSV, PDF
- Include date range in filename
- PDF includes charts as images

---

## Validation Checkpoints

1. Navigate to `/analytics` - dashboard loads
2. Change date range - metrics update
3. Click metric card - shows detail
4. Export CSV - downloads with data
5. All charts render without errors

---

## Files to Create
- src/pages/AnalyticsPage.tsx
- src/components/analytics/MetricsCardRow.tsx
- src/components/analytics/WorkOrderTrendsChart.tsx
- src/components/analytics/TechnicianLeaderboard.tsx
- src/components/analytics/PropertyPerformance.tsx
- src/components/analytics/ResponseTimeChart.tsx
- src/components/analytics/ReportExport.tsx

---

## Anti-Patterns
- ❌ Don't calculate metrics on frontend (use Supabase views/functions)
- ❌ Don't load all historical data at once
- ❌ Don't forget loading states for charts
- ❌ Don't hardcode date ranges
- ❌ Don't use `../ui/tabs` from pages - use `../components/ui/tabs`

---

## Next
PRP-13: Financial Intelligence

# P02-08: Performance Analytics

## Goal
Dashboard showing operational metrics for techs, WOs, and system health.

## Views/Queries

```sql
CREATE VIEW tech_performance AS
SELECT 
  technician_id,
  COUNT(*) as total_jobs,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  AVG(CASE WHEN rework THEN 0 ELSE 1 END) as first_time_fix_rate
FROM work_orders
WHERE created_at > now() - interval '30 days'
GROUP BY technician_id;

CREATE VIEW daily_metrics AS
SELECT 
  date_trunc('day', created_at) as day,
  COUNT(*) as created,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/3600) as avg_hours_to_complete
FROM work_orders
GROUP BY 1;
```

## Files
- `src/hooks/useAnalytics.ts`
- `src/pages/AnalyticsDashboard.tsx`
- `src/components/analytics/MetricCard.tsx`
- `src/components/analytics/TechLeaderboard.tsx`
- `src/components/analytics/TrendChart.tsx`

## Tasks
1. Create views in Supabase
2. Hook: fetch metrics with date range filter
3. MetricCard: single KPI with value, trend arrow, target indicator
4. Leaderboard: techs ranked by first-time fix rate
5. TrendChart: line chart of WO volume over time (use recharts)
6. Dashboard: grid layout of cards + leaderboard + chart

## Metrics to Display
- First-time completion rate (target >85%)
- Average response time by priority
- Rework rate (target <15%)
- WOs created/completed today
- Tech utilization

## Validation
- [ ] Date range filter works
- [ ] MetricCards show correct colors vs target
- [ ] Leaderboard sorts correctly
- [ ] Chart renders with real data

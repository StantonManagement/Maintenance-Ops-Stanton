# PRP: Analytics Dashboard Enhancement

## Goal
Replace mocked analytics with real calculated metrics by:
1. Adding `event_logs` table for time-tracking
2. Adding `reviews` table for tenant satisfaction
3. Updating `useAnalytics` hook to compute real averages
4. Displaying actual trends instead of hardcoded values

## Success Criteria
- [ ] `event_logs` table captures work order lifecycle events
- [ ] `reviews` table stores tenant satisfaction surveys
- [ ] Average response time calculated from real timestamps
- [ ] Tenant satisfaction score derived from actual reviews
- [ ] Overdue count based on SLA rules in config_rules.json
- [ ] Dashboard updates in real-time as data changes

## Complete Context

### Existing Files
```
src/hooks/useAnalytics.ts         - Has some real queries, some mocked values
src/pages/Analytics.tsx           - Dashboard UI
src/services/supabase.ts          - Database types
config_rules.json                 - Contains response time SLAs by priority
```

### Current Mock Values (to replace with calculations)
```typescript
// useAnalytics.ts currently returns:
avgResponseTime: '2.4h'           // ← MOCKED
tenantSatisfaction: '4.8'         // ← MOCKED  
overdue: trends with fake data    // ← MOCKED

// Real values exist for:
completionRate, workOrderVolumes, technicianStats
```

### SLA Rules from config_rules.json
```json
{
  "priority_classification": {
    "emergency": { "response_time_hours": 2 },
    "high": { "response_time_hours": 24 },
    "medium": { "response_time_hours": 72 },
    "low": { "response_time_hours": 168 }
  }
}
```

## Implementation Tasks

### Task 1: Create event_logs Table
RUN in Supabase SQL Editor:

```sql
-- Event logs for tracking work order lifecycle timing
CREATE TABLE IF NOT EXISTS event_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id TEXT NOT NULL,
  event_type TEXT NOT NULL,  -- 'created', 'assigned', 'started', 'completed', 'cancelled'
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_id UUID REFERENCES auth.users(id),
  actor_type TEXT,  -- 'system', 'coordinator', 'technician', 'tenant'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries by work order
CREATE INDEX idx_event_logs_work_order ON event_logs(work_order_id);
CREATE INDEX idx_event_logs_type_time ON event_logs(event_type, event_timestamp);

-- Enable RLS
ALTER TABLE event_logs ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can read all events
CREATE POLICY "Authenticated users can read events"
  ON event_logs FOR SELECT
  TO authenticated
  USING (true);

-- Policy: system/coordinators can insert events
CREATE POLICY "System can insert events"
  ON event_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

VALIDATION: Table exists in Supabase dashboard

### Task 2: Create reviews Table
RUN in Supabase SQL Editor:

```sql
-- Tenant satisfaction reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id TEXT NOT NULL UNIQUE,
  tenant_id UUID,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  review_type TEXT DEFAULT 'post_completion',  -- 'post_completion', 'follow_up'
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Index for analytics queries
CREATE INDEX idx_reviews_submitted ON reviews(submitted_at);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Tenants can submit reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

VALIDATION: Table exists in Supabase dashboard

### Task 3: Add Types to supabase.ts
ADD to `src/services/supabase.ts`:

```typescript
// Add to Database interface or create separate types file

export interface EventLog {
  id: string
  work_order_id: string
  event_type: 'created' | 'assigned' | 'started' | 'completed' | 'cancelled'
  event_timestamp: string
  actor_id?: string
  actor_type?: 'system' | 'coordinator' | 'technician' | 'tenant'
  metadata?: Record<string, unknown>
}

export interface Review {
  id: string
  work_order_id: string
  tenant_id?: string
  rating: number  // 1-5
  feedback?: string
  review_type: string
  submitted_at: string
}
```

### Task 4: Create Analytics Calculation Functions
CREATE `src/services/analyticsService.ts`:

```typescript
import { supabase } from './supabase'

// Calculate average response time (created → assigned)
export async function calculateAvgResponseTime(days: number = 30): Promise<string> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  const { data: events } = await supabase
    .from('event_logs')
    .select('work_order_id, event_type, event_timestamp')
    .in('event_type', ['created', 'assigned'])
    .gte('event_timestamp', cutoff.toISOString())
    .order('event_timestamp', { ascending: true })

  if (!events || events.length < 2) return 'N/A'

  // Group by work order
  const byWorkOrder: Record<string, { created?: Date; assigned?: Date }> = {}
  for (const event of events) {
    if (!byWorkOrder[event.work_order_id]) {
      byWorkOrder[event.work_order_id] = {}
    }
    if (event.event_type === 'created') {
      byWorkOrder[event.work_order_id].created = new Date(event.event_timestamp)
    } else if (event.event_type === 'assigned') {
      byWorkOrder[event.work_order_id].assigned = new Date(event.event_timestamp)
    }
  }

  // Calculate average time between created and assigned
  let totalMinutes = 0
  let count = 0
  for (const wo of Object.values(byWorkOrder)) {
    if (wo.created && wo.assigned) {
      const diffMs = wo.assigned.getTime() - wo.created.getTime()
      totalMinutes += diffMs / (1000 * 60)
      count++
    }
  }

  if (count === 0) return 'N/A'
  
  const avgMinutes = totalMinutes / count
  if (avgMinutes < 60) return `${Math.round(avgMinutes)}m`
  if (avgMinutes < 1440) return `${(avgMinutes / 60).toFixed(1)}h`
  return `${(avgMinutes / 1440).toFixed(1)}d`
}

// Calculate tenant satisfaction from reviews
export async function calculateTenantSatisfaction(days: number = 30): Promise<string> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('rating')
    .gte('submitted_at', cutoff.toISOString())

  if (error || !reviews || reviews.length === 0) return 'N/A'

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  return avgRating.toFixed(1)
}

// Calculate overdue work orders based on SLA
export async function calculateOverdueCount(slaRules: Record<string, number>): Promise<number> {
  const { data: workOrders } = await supabase
    .from('AF_work_order_new')
    .select('ServiceRequestId, Priority, CreatedDate, Status')
    .not('Status', 'in', '("DONE","COMPLETE","CANCELLED")')

  if (!workOrders) return 0

  const now = new Date()
  let overdueCount = 0

  for (const wo of workOrders) {
    const priority = (wo.Priority || 'medium').toLowerCase()
    const slaHours = slaRules[priority] || 72  // default to medium
    const createdDate = new Date(wo.CreatedDate)
    const deadlineMs = createdDate.getTime() + (slaHours * 60 * 60 * 1000)
    
    if (now.getTime() > deadlineMs) {
      overdueCount++
    }
  }

  return overdueCount
}

// Get trend data for charts
export async function getOverdueTrend(days: number = 7): Promise<Array<{ date: string; count: number }>> {
  const trend: Array<{ date: string; count: number }> = []
  
  // For now, return current overdue count for each day
  // In production, this would query historical snapshots
  const currentOverdue = await calculateOverdueCount({
    emergency: 2,
    high: 24,
    medium: 72,
    low: 168
  })

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    trend.push({
      date: date.toISOString().split('T')[0],
      count: currentOverdue  // Placeholder - would need historical data
    })
  }

  return trend
}
```

VALIDATION: `npm run build` must pass

### Task 5: Update useAnalytics Hook
MODIFY `src/hooks/useAnalytics.ts`:

Replace mocked values with real calculations:

```typescript
import { 
  calculateAvgResponseTime, 
  calculateTenantSatisfaction,
  calculateOverdueCount,
  getOverdueTrend
} from '@/services/analyticsService'

// Inside the hook, replace hardcoded values:

// REPLACE:
// const avgResponseTime = '2.4h'
// WITH:
const [avgResponseTime, setAvgResponseTime] = useState<string>('...')

useEffect(() => {
  calculateAvgResponseTime(30).then(setAvgResponseTime)
}, [])

// REPLACE:
// const tenantSatisfaction = '4.8'
// WITH:
const [tenantSatisfaction, setTenantSatisfaction] = useState<string>('...')

useEffect(() => {
  calculateTenantSatisfaction(30).then(setTenantSatisfaction)
}, [])

// REPLACE mocked overdue with:
const [overdueCount, setOverdueCount] = useState<number>(0)
const [overdueTrend, setOverdueTrend] = useState<Array<{ date: string; count: number }>>([])

useEffect(() => {
  const slaRules = {
    emergency: 2,
    high: 24, 
    medium: 72,
    low: 168
  }
  calculateOverdueCount(slaRules).then(setOverdueCount)
  getOverdueTrend(7).then(setOverdueTrend)
}, [])
```

VALIDATION: Dashboard displays calculated values instead of hardcoded

### Task 6: Seed Test Data (Development Only)
RUN in Supabase SQL Editor (for testing):

```sql
-- Insert sample event logs
INSERT INTO event_logs (work_order_id, event_type, event_timestamp, actor_type) VALUES
('WO-001', 'created', NOW() - INTERVAL '2 hours', 'system'),
('WO-001', 'assigned', NOW() - INTERVAL '1 hour', 'coordinator'),
('WO-002', 'created', NOW() - INTERVAL '5 hours', 'system'),
('WO-002', 'assigned', NOW() - INTERVAL '4 hours', 'coordinator'),
('WO-003', 'created', NOW() - INTERVAL '1 day', 'system'),
('WO-003', 'assigned', NOW() - INTERVAL '20 hours', 'coordinator');

-- Insert sample reviews
INSERT INTO reviews (work_order_id, rating, feedback, submitted_at) VALUES
('WO-001', 5, 'Great service!', NOW() - INTERVAL '1 day'),
('WO-002', 4, 'Good but took a while', NOW() - INTERVAL '2 days'),
('WO-003', 5, 'Fixed perfectly', NOW() - INTERVAL '3 days'),
('WO-004', 3, 'Could be better', NOW() - INTERVAL '4 days'),
('WO-005', 5, 'Excellent', NOW() - INTERVAL '5 days');
```

## Validation Checkpoints

### Checkpoint 1: Tables Created
```sql
-- Run in Supabase SQL Editor
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('event_logs', 'reviews');

-- Expected: Both tables listed
```

### Checkpoint 2: Types Compile
```bash
npm run build
# Expected: No type errors for EventLog or Review
```

### Checkpoint 3: Calculations Work
```bash
npm run dev
# Open browser console
# Check for errors in analytics loading
# Dashboard should show calculated values (not 'N/A' if test data exists)
```

### Checkpoint 4: Real Values Display
```
Navigate to Analytics page
- avgResponseTime should show calculated value (e.g., "1.5h")
- tenantSatisfaction should show average (e.g., "4.4")
- overdue count should reflect actual SLA violations
```

## Anti-Patterns to Avoid
- ❌ Don't calculate analytics on every page load (implement caching)
- ❌ Don't query entire event_logs table (always filter by date range)
- ❌ Don't hardcode SLA values - read from config_rules.json
- ❌ Don't block UI while fetching analytics (use loading states)

## Future Enhancements (Not in this PRP)
- Add daily snapshots for historical trend data
- Implement Redis caching for expensive calculations
- Add technician-specific analytics
- Add building/property filtering

## Windsurf-Specific Notes
- Run SQL commands directly in Supabase dashboard, not through Windsurf
- Create `analyticsService.ts` as a new file first
- Then modify `useAnalytics.ts` to import from it
- Keep existing working calculations (completionRate, etc.) - only replace mocked ones

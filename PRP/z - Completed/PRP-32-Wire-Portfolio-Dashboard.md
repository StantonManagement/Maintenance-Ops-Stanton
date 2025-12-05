# PRP-32: Wire Portfolio Dashboard to Real Data

## Goal
Connect Portfolio Dashboard to real property/work order data and make filters work.

## Current State
- UI exists: PortfolioDashboardPage, portfolio selector, property rankings
- Uses mock portfolio/region/property hierarchy
- Stats cards show mock data
- "View" buttons navigate but don't filter work orders
- Property performance uses mock metrics

## Success Criteria
- [ ] Portfolio structure from real properties in Supabase
- [ ] Stats calculated from real work orders
- [ ] Property rankings from real metrics
- [ ] Clicking property filters work orders
- [ ] Region grouping works

---

## Tasks

### Task 1: Portfolio Structure Tables
Add to Supabase (or use existing AF_ tables):
```sql
-- If not using AF_properties, create:
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID REFERENCES portfolios(id),
  name TEXT NOT NULL,
  description TEXT
);

-- Add to existing properties table or create:
ALTER TABLE properties ADD COLUMN IF NOT EXISTS 
  portfolio_id UUID REFERENCES portfolios(id),
  region_id UUID REFERENCES regions(id);
```

Note: If using AF_properties, add portfolio mapping:
```sql
CREATE TABLE property_portfolio_mapping (
  property_id TEXT PRIMARY KEY, -- AF_ property ID
  portfolio_id UUID REFERENCES portfolios(id),
  region_id UUID REFERENCES regions(id)
);
```

### Task 2: Create usePortfolio Hook
CREATE `src/hooks/usePortfolio.ts`:
```typescript
- fetchPortfolios(): get all portfolios
- fetchRegions(portfolioId): get regions in portfolio
- fetchProperties(regionId?): get properties, optionally filtered
- getPortfolioStats(portfolioId): calculate from work_orders
  - total_units
  - active_work_orders
  - completed_this_month
  - avg_completion_time
  - monthly_cost
- getPropertyRankings(portfolioId, metric): ranked list
  - metrics: 'work_orders', 'completion_rate', 'response_time', 'cost'
```

### Task 3: Stats Calculation
For getPortfolioStats:
```sql
-- Active work orders in portfolio
SELECT COUNT(*) FROM work_orders wo
JOIN properties p ON wo.property_id = p.id
JOIN property_portfolio_mapping ppm ON p.id = ppm.property_id
WHERE ppm.portfolio_id = $1 AND wo.status NOT IN ('completed', 'cancelled');

-- Avg completion time
SELECT AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/3600) as avg_hours
FROM work_orders wo
JOIN properties p ON wo.property_id = p.id
WHERE ppm.portfolio_id = $1 AND wo.status = 'completed';
```

### Task 4: Wire PortfolioDashboardPage
MODIFY `src/pages/PortfolioDashboardPage.tsx`:
- Replace mock hierarchy with usePortfolio() data
- Stats cards show real calculated values
- Property rankings show real metrics
- Loading states while fetching

### Task 5: Property Filter Navigation
When clicking a property:
```typescript
// Navigate to work orders with property filter
navigate(`/work-orders?property=${propertyId}`);
```

In WorkOrdersPage:
- Read property param from URL
- Apply as filter to useWorkOrders query
- Show "Filtered by: [Property Name]" badge
- Clear filter button

### Task 6: Portfolio Selector Persistence
- Store selected portfolio in localStorage
- Apply as default filter across pages
- Show portfolio name in header/breadcrumb

### Task 7: Seed Portfolio Data
```sql
INSERT INTO portfolios (id, name) VALUES
('portfolio-1', 'Hartford Portfolio'),
('portfolio-2', 'New Haven Portfolio');

INSERT INTO regions (portfolio_id, name) VALUES
('portfolio-1', 'Downtown Hartford'),
('portfolio-1', 'West Hartford'),
('portfolio-2', 'Downtown New Haven');

-- Map existing properties
INSERT INTO property_portfolio_mapping (property_id, portfolio_id, region_id)
SELECT id, 'portfolio-1', 'region-downtown' FROM AF_properties LIMIT 5;
```

---

## Validation Checkpoints
1. Portfolio selector shows real portfolios
2. Stats cards show calculated values
3. Property list shows real properties
4. Click property → /work-orders filtered
5. Rankings reflect real work order data

---

## Files to Modify
- src/pages/PortfolioDashboardPage.tsx
- src/pages/WorkOrdersPage.tsx (add filter support)
- src/hooks/useWorkOrders.ts (add property filter)

## Files to Create
- src/hooks/usePortfolio.ts
- Supabase migration for portfolio tables
- Seed data SQL

---

## Anti-Patterns
- ❌ Don't hardcode portfolio structure
- ❌ Don't calculate stats client-side for large datasets
- ❌ Don't lose filter when navigating away

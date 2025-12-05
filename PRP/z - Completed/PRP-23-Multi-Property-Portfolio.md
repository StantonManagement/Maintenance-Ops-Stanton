# PRP-23: Multi-Property Portfolio Management

## Goal
Scale system to handle 5,000+ units across multiple properties, regions, and owner entities with proper data isolation and cross-portfolio views.

## Success Criteria
- [ ] Property selector/switcher in header
- [ ] Cross-portfolio dashboard view
- [ ] Property-specific rules and settings
- [ ] Regional grouping of properties
- [ ] Share technicians across properties
- [ ] Consolidated and per-property reporting

---

## Context

**Current:** 150 units, scaling to 550, then 5,000+

**Hierarchy:**
- Portfolio (top level)
- Region (geographic grouping)
- Property (building/complex)
- Unit (individual apartment)

**Data isolation:**
- Some data property-specific
- Some data crosses properties (technicians, vendors)
- Reports can be consolidated or filtered

---

## Tasks

### Task 1: Portfolio Data Model
Add to Supabase:
- portfolios: id, name, owner_entity
- regions: id, portfolio_id, name, timezone
- Modify properties table: add region_id, portfolio_id

### Task 2: Property Switcher
- Dropdown in header
- Options: "All Properties" or specific property
- Persists selection in session
- Filters all data views
- Shows property count badge

### Task 3: Cross-Portfolio Dashboard
- When "All Properties" selected
- Summary cards across entire portfolio
- Top issues by property
- Comparison metrics
- Drill down to specific property

### Task 4: Property-Specific Settings
- Override global settings per property
- Custom rules per property
- Custom notification templates
- Different business hours
- Different capacity limits

### Task 5: Regional Grouping
- Group properties by region
- Filter by region in property selector
- Regional manager role
- Regional reporting

### Task 6: Technician Property Assignment
- Technicians can work multiple properties
- Assign technician to property list
- Routing considers property when assigning
- Track time per property

### Task 7: Consolidated Reporting
- Toggle: Consolidated vs Per-Property
- Aggregate metrics across portfolio
- Compare properties on same chart
- Export with property breakdown

### Task 8: Portfolio Performance Rankings
- Rank properties by metrics
- Identify best/worst performers
- Drill into underperformers
- Track improvement over time

---

## Files to Create
- src/components/layout/PropertySwitcher.tsx
- src/pages/PortfolioDashboard.tsx
- src/components/portfolio/PropertyComparison.tsx
- src/components/portfolio/RegionalView.tsx
- src/components/settings/PropertySettings.tsx
- src/hooks/usePortfolio.ts
- src/hooks/usePropertyContext.ts

---

## Anti-Patterns
- ❌ Don't load all property data at once
- ❌ Don't forget property context in queries
- ❌ Don't allow cross-property data leaks
- ❌ Don't ignore timezone differences

---

## Phase: 3

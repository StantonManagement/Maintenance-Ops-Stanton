# PRP-01: Data Layer Foundation

## Problem Statement

The application needs to work for multiple portfolios, each containing properties, buildings, and units. Currently there may be hardcoded assumptions, no portfolio scoping, or direct queries to AppFolio tables without proper abstraction.

**Current State:**
- May be pulling data directly from AF_ tables (read-only AppFolio sync)
- No portfolio concept - assumes single-tenant operation
- No proper relationships between entities
- UI might show all work orders regardless of user's access

**Required State:**
- Multi-portfolio architecture where users can belong to multiple portfolios
- Proper entity hierarchy: Portfolio → Property → Building → Unit
- Work orders tied to units with full location context
- All queries scoped to active portfolio
- AF_ tables used as read-only source, with operational data in custom tables

---

## Why This Comes First

Everything depends on the data model:
- Auth (PRP-02) needs portfolios to define user roles
- UI components need to know what data they're displaying
- Filters need to know the entity relationships
- Scheduling needs technician-to-portfolio relationships
- Analytics need portfolio scoping

---

## Entity Hierarchy

```
Portfolio (company/management entity)
├── Properties (individual addresses/buildings)
│   ├── Units (apartments/spaces within)
│   │   └── Work Orders (maintenance requests)
│   └── Building-level equipment/issues
├── Technicians (assigned to portfolio)
├── Vendors (approved for portfolio)
└── Users (with roles per portfolio)
```

**Key Relationships:**
- A user can belong to multiple portfolios with different roles
- A technician can belong to multiple portfolios
- Work orders belong to units, which belong to properties, which belong to portfolios
- All queries must filter by portfolio_id

---

## Core Tables

### portfolios

The top-level organizational unit. In your case, this represents a property management company or portfolio of properties.

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | Primary key |
| name | TEXT | Display name (e.g., "Main Portfolio", "Northeast Region") |
| code | TEXT | Short code for references |
| settings | JSONB | Portfolio-specific configuration (timezone, defaults, thresholds) |
| appfolio_account_id | TEXT | Link to AppFolio if syncing (nullable) |
| subscription_tier | TEXT | For future billing/feature gating |
| active | BOOLEAN | Soft delete / disable |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Business Rules:**
- Portfolio settings override system defaults
- Inactive portfolios are hidden but data preserved
- One portfolio can sync from one AppFolio account

### portfolio_users

Links users to portfolios with their role. A user can have different roles in different portfolios.

| Column | Type | Purpose |
|--------|------|---------|
| portfolio_id | UUID | FK to portfolios |
| user_id | UUID | FK to auth.users |
| role | TEXT | owner, manager, coordinator, admin, technician, viewer |
| permissions | TEXT[] | Additional granular permissions beyond role |
| created_at | TIMESTAMPTZ | When access was granted |
| granted_by | UUID | Who added this user |
| PRIMARY KEY | | (portfolio_id, user_id) |

**Role Hierarchy:** owner > manager > coordinator > admin > technician > viewer

See PRP-02 for full role definitions and permission matrix.

### properties

A property is a physical address. Could be a single building or a complex with multiple buildings.

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | Primary key |
| portfolio_id | UUID | FK to portfolios (required) |
| af_property_id | TEXT | Link to AF_properties if synced (nullable) |
| name | TEXT | Display name |
| code | TEXT | Short code (e.g., "S0021") |
| address_street | TEXT | |
| address_city | TEXT | |
| address_state | TEXT | |
| address_zip | TEXT | |
| address_full | TEXT | Computed/cached full address |
| property_type | TEXT | residential, commercial, mixed |
| section_8_status | TEXT | none, partial, full |
| owner_entity | TEXT | Legal entity name |
| manager_name | TEXT | Property manager |
| manager_phone | TEXT | |
| manager_email | TEXT | |
| building_count | INT | Cached count |
| unit_count | INT | Cached count |
| settings | JSONB | Property-specific overrides |
| active | BOOLEAN | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Business Rules:**
- Property inherits portfolio settings unless overridden
- Section 8 status affects work order categorization
- Property-level stats (unit count, etc.) should be cached and updated on changes

### units

Individual rentable spaces within a property.

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | Primary key |
| property_id | UUID | FK to properties (required) |
| portfolio_id | UUID | FK to portfolios (denormalized for query performance) |
| af_unit_id | TEXT | Link to AF_units if synced |
| unit_number | TEXT | "101", "2B", etc. |
| building_number | TEXT | If property has multiple buildings |
| floor | INT | Floor number |
| bedrooms | INT | |
| bathrooms | DECIMAL | |
| square_feet | INT | |
| rent_amount | DECIMAL | Monthly rent (for exposure calculations) |
| is_section_8 | BOOLEAN | Unit-level S8 status |
| tenant_id | UUID | Current tenant (nullable if vacant) |
| tenant_name | TEXT | Cached for display |
| tenant_phone | TEXT | Cached |
| tenant_email | TEXT | Cached |
| tenant_language | TEXT | Preferred language for communication |
| lease_start | DATE | |
| lease_end | DATE | |
| status | TEXT | occupied, vacant, notice_given, make_ready |
| last_inspection_date | DATE | |
| next_inspection_date | DATE | |
| equipment | JSONB | Major equipment with install dates |
| active | BOOLEAN | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Business Rules:**
- portfolio_id is denormalized from property for query performance
- Tenant info cached here for quick display (source of truth elsewhere)
- Equipment tracking enables preventive maintenance scheduling
- Inspection dates drive deadline warnings

### work_orders

The core operational entity. Represents a maintenance request.

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | Primary key |
| portfolio_id | UUID | FK to portfolios (denormalized) |
| property_id | UUID | FK to properties |
| unit_id | UUID | FK to units (nullable for property-level work) |
| af_work_order_id | TEXT | Link to AF_work_orders if synced |
| request_number | TEXT | Human-readable number (e.g., "WO-2024-0001") |
| description | TEXT | What needs to be done |
| category | TEXT | plumbing, electrical, hvac, appliance, general, etc. |
| priority | TEXT | emergency, high, medium, low |
| status | TEXT | See status workflow below |
| source | TEXT | tenant_portal, phone, sms, email, inspection, preventive |
| | | |
| **Assignment** | | |
| assigned_technician_id | UUID | FK to technicians (nullable) |
| scheduled_date | DATE | |
| scheduled_time_start | TIME | |
| scheduled_time_end | TIME | |
| estimated_duration_hours | DECIMAL | |
| | | |
| **Tenant Context** | | |
| tenant_name | TEXT | Cached |
| tenant_phone | TEXT | Cached |
| tenant_availability | TEXT | Notes on when tenant is available |
| permission_to_enter | TEXT | yes, no, pending, not_required |
| access_instructions | TEXT | Gate code, key location, etc. |
| | | |
| **Financial** | | |
| is_capex | BOOLEAN | CapEx vs Maintenance |
| capex_reason | TEXT | Longevity justification |
| section_8_category | TEXT | inspection_repair, tenant_maintenance, pre_inspection, etc. |
| estimated_cost | DECIMAL | |
| actual_cost | DECIMAL | |
| parts_cost | DECIMAL | |
| labor_cost | DECIMAL | |
| | | |
| **Completion** | | |
| completed_at | TIMESTAMPTZ | |
| completed_by | UUID | Coordinator who approved |
| completion_notes | TEXT | |
| tenant_satisfaction | INT | 1-5 rating |
| first_time_fix | BOOLEAN | Completed without return visit? |
| | | |
| **Deadline Tracking** | | |
| deadline_date | DATE | When this must be done |
| deadline_type | TEXT | section_8_24hr, section_8_30day, code_violation, internal_sla |
| exposure_amount | DECIMAL | Dollar risk if missed |
| | | |
| **Metadata** | | |
| has_unread_messages | BOOLEAN | For UI indicators |
| message_count | INT | Cached |
| photo_count | INT | Cached |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| created_by | UUID | User who created |

**Status Values (from config_rules.json):**
- new
- assigned
- scheduled
- in_progress
- waiting_parts
- waiting_access
- waiting_dry
- ready_review
- completed
- failed_review
- cancelled

**Status Transition Rules:**
See config_rules.json `status_workflow.valid_transitions` for allowed transitions.
See PRP-02 for role-based transition permissions.

### technicians

Work resources that can be assigned to work orders.

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | Primary key |
| user_id | UUID | FK to auth.users (nullable - not all techs login) |
| portfolio_id | UUID | FK to portfolios |
| name | TEXT | Display name |
| phone | TEXT | Contact |
| email | TEXT | Contact |
| skills | TEXT[] | plumbing, electrical, hvac, general, etc. |
| certifications | JSONB | {type, number, expiration}[] |
| max_daily_orders | INT | Workload limit (default 6) |
| hourly_rate | DECIMAL | For cost calculations |
| is_available | BOOLEAN | Can receive assignments? |
| status | TEXT | available, on_job, off_duty, vacation |
| current_location | JSONB | {lat, lng, updated_at} for GPS |
| active | BOOLEAN | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Business Rules:**
- Technician can belong to multiple portfolios (separate rows per portfolio, or junction table)
- Skills determine which work orders they can be assigned
- Certifications have expirations that should trigger alerts
- max_daily_orders enforced by system (with override logging)

### messages

Communication threads attached to work orders.

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | Primary key |
| portfolio_id | UUID | FK to portfolios (denormalized) |
| work_order_id | UUID | FK to work_orders |
| direction | TEXT | inbound, outbound |
| channel | TEXT | sms, email, phone, portal |
| | | |
| sender_type | TEXT | tenant, coordinator, technician, system |
| sender_id | UUID | User ID if applicable |
| sender_phone | TEXT | Phone number |
| sender_name | TEXT | Display name |
| | | |
| content | TEXT | Original message |
| content_translated | TEXT | If auto-translated |
| original_language | TEXT | Detected language |
| | | |
| delivery_status | TEXT | pending, sent, delivered, failed |
| read_at | TIMESTAMPTZ | When coordinator read it |
| | | |
| attachments | JSONB | {type, url, filename}[] |
| created_at | TIMESTAMPTZ | |

**Business Rules:**
- Inbound messages from tenants should set work_order.has_unread_messages = true
- Coordinator reading should clear the flag
- Translation happens automatically for non-English messages
- SMS integration via Twilio (separate service handles send/receive)

### approvals

Pending approval items for coordinators (completion reviews, expense approvals, etc.)

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | Primary key |
| portfolio_id | UUID | FK to portfolios |
| work_order_id | UUID | FK to work_orders |
| type | TEXT | completion, expense, vendor, override |
| status | TEXT | pending, approved, rejected |
| | | |
| submitted_by | UUID | User who submitted |
| submitted_at | TIMESTAMPTZ | |
| reviewed_by | UUID | Coordinator who reviewed |
| reviewed_at | TIMESTAMPTZ | |
| rejection_reason | TEXT | If rejected |
| | | |
| **For expense approvals:** | | |
| amount | DECIMAL | |
| vendor_name | TEXT | |
| invoice_number | TEXT | |
| | | |
| **For completion reviews:** | | |
| before_photos | TEXT[] | URLs |
| after_photos | TEXT[] | URLs |
| cleanup_photos | TEXT[] | URLs |
| checklist | JSONB | What was verified |
| | | |
| notes | TEXT | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Business Rules:**
- When technician marks "ready_review", system creates approval record
- Coordinator must review before work order can be marked complete
- Rejected approvals return work order to "in_progress" with notes
- Photo requirements enforced at submission (see config_rules.json)

### vendors

External contractors for specialized work.

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | Primary key |
| portfolio_id | UUID | FK to portfolios |
| name | TEXT | Company name |
| contact_name | TEXT | Primary contact |
| phone | TEXT | |
| email | TEXT | |
| category | TEXT | emergency, specialized, seasonal, project |
| specialties | TEXT[] | hvac, electrical, plumbing, etc. |
| insurance_verified | BOOLEAN | |
| insurance_expiration | DATE | |
| license_number | TEXT | |
| license_expiration | DATE | |
| hourly_rate | DECIMAL | |
| emergency_rate | DECIMAL | After-hours rate |
| response_time_hours | INT | SLA for responses |
| rating | DECIMAL | Average performance rating |
| active | BOOLEAN | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Business Rules:**
- Vendors receive REQUESTS, not assignments (see Vendor_Management doc)
- Insurance/license expirations should trigger alerts
- Performance tracked over time for selection decisions

### audit_log

Every significant action recorded for accountability.

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | Primary key |
| portfolio_id | UUID | FK to portfolios |
| user_id | UUID | Who did it |
| user_email | TEXT | Cached for display |
| user_role | TEXT | Role at time of action |
| | | |
| action | TEXT | create, update, delete, assign, complete, etc. |
| entity_type | TEXT | work_order, technician, approval, etc. |
| entity_id | UUID | What was affected |
| | | |
| old_value | JSONB | Previous state |
| new_value | JSONB | New state |
| | | |
| context | JSONB | Additional info (IP, user agent, etc.) |
| created_at | TIMESTAMPTZ | |

**Business Rules:**
- NEVER delete from audit_log
- Record both old and new values for meaningful diffs
- Include enough context to answer "who did what when and why"

---

## AppFolio Sync Strategy

The AF_ tables are read-only imports from AppFolio. Strategy:

### What Comes From AppFolio
- Properties (AF_properties)
- Units (AF_units)
- Work orders (AF_work_orders) - initial creation only
- Tenant info (AF_tenants)

### What Lives in Custom Tables
- Operational work order data (status changes, assignments, etc.)
- Messages
- Approvals
- Technicians (AppFolio may not have this)
- Vendors
- Audit trail

### Sync Approach

**Option A: Shadow Tables**
- AF_ tables are raw imports
- Custom tables mirror structure with additional columns
- Sync job copies new AF_ records to custom tables
- Operational changes happen in custom tables only

**Option B: Linked Records**
- Custom work_orders has af_work_order_id column
- Query joins AF_ for tenant/property info
- Operational data stays in custom tables
- No duplication, but more complex queries

**Recommended: Option A (Shadow Tables)**
- Simpler queries (everything in one table)
- Can operate even if AppFolio sync breaks
- Custom columns coexist with synced data
- Clear separation: AF_ is source of truth for imported data, custom tables for operations

### Sync Process
1. Cron job runs every 15 minutes
2. Check AF_ tables for new/updated records
3. Upsert into custom tables based on af_*_id
4. Preserve operational data (status, assignment, etc.)
5. Update cached fields (tenant name, property address)

---

## Row-Level Security (RLS)

All tables must have RLS policies that scope queries to user's portfolios.

### Base Pattern

Every table with portfolio_id needs:
1. Users can only see rows where portfolio_id is in their portfolio list
2. Users can only insert/update/delete if they have appropriate role

### Getting User's Portfolios

Create a function that returns portfolio IDs for current user:

```sql
CREATE FUNCTION user_portfolio_ids() RETURNS UUID[] AS $$
  SELECT ARRAY_AGG(portfolio_id)
  FROM portfolio_users
  WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;
```

### Example RLS Policy

```sql
-- Users can see work orders in their portfolios
CREATE POLICY "Users can view work orders in their portfolios"
ON work_orders FOR SELECT
USING (portfolio_id = ANY(user_portfolio_ids()));
```

### Technician-Specific RLS

Technicians should only see their assigned work:

```sql
CREATE POLICY "Technicians see only assigned work"
ON work_orders FOR SELECT
USING (
  portfolio_id = ANY(user_portfolio_ids())
  AND (
    -- Not a technician, or is the assigned tech
    NOT EXISTS (
      SELECT 1 FROM portfolio_users
      WHERE user_id = auth.uid()
      AND portfolio_id = work_orders.portfolio_id
      AND role = 'technician'
    )
    OR assigned_technician_id = (
      SELECT t.id FROM technicians t
      WHERE t.user_id = auth.uid()
      AND t.portfolio_id = work_orders.portfolio_id
    )
  )
);
```

---

## Indexes

Performance-critical indexes:

```sql
-- Portfolio scoping (used in almost every query)
CREATE INDEX idx_work_orders_portfolio ON work_orders(portfolio_id);
CREATE INDEX idx_units_portfolio ON units(portfolio_id);
CREATE INDEX idx_messages_portfolio ON messages(portfolio_id);

-- Common filters
CREATE INDEX idx_work_orders_status ON work_orders(portfolio_id, status);
CREATE INDEX idx_work_orders_priority ON work_orders(portfolio_id, priority);
CREATE INDEX idx_work_orders_assigned ON work_orders(portfolio_id, assigned_technician_id);
CREATE INDEX idx_work_orders_deadline ON work_orders(portfolio_id, deadline_date);

-- For approval queue
CREATE INDEX idx_approvals_pending ON approvals(portfolio_id, status) WHERE status = 'pending';

-- For message threads
CREATE INDEX idx_messages_work_order ON messages(work_order_id, created_at);

-- For unread indicators
CREATE INDEX idx_work_orders_unread ON work_orders(portfolio_id, has_unread_messages) WHERE has_unread_messages = true;

-- For AppFolio linking
CREATE INDEX idx_work_orders_af_id ON work_orders(af_work_order_id) WHERE af_work_order_id IS NOT NULL;
```

---

## Supabase Client Setup

The frontend needs a typed Supabase client.

**Required:**
- Generate types from database schema (Supabase CLI: `supabase gen types typescript`)
- Create client singleton
- Include portfolio scoping in all queries

**Pattern for Queries:**

Every query should include portfolio filtering:

```typescript
// Hook pattern
function useWorkOrders() {
  const portfolio = useActivePortfolio();
  
  return useQuery({
    queryKey: ['work-orders', portfolio.id],
    queryFn: () => supabase
      .from('work_orders')
      .select('*')
      .eq('portfolio_id', portfolio.id)
      .order('created_at', { ascending: false })
  });
}
```

---

## Data Hooks Required

The UI needs these hooks (implementation details in separate PRPs):

| Hook | Purpose |
|------|---------|
| useActivePortfolio | Get/set current portfolio from context |
| usePortfolios | List portfolios user has access to |
| useWorkOrders | Fetch work orders with filters |
| useWorkOrder | Fetch single work order with related data |
| useMessages | Fetch messages for a work order |
| useTechnicians | Fetch technicians in portfolio |
| useApprovals | Fetch pending approvals |
| useProperties | Fetch properties in portfolio |
| useUnits | Fetch units, optionally by property |

---

## Edge Cases

### User Has No Portfolio Access
- New user with no portfolio_users entries
- Show "Waiting for access" message
- Or show portfolio creation wizard if they should be an owner

### Work Order Without Unit
- Building-level or property-level work (not unit-specific)
- unit_id is nullable
- Display should show property only, no unit number

### Technician Without User Account
- Some techs may not have logins
- technicians.user_id is nullable
- Coordinator manages their work orders for them
- They can't access the app themselves

### Portfolio Switch Mid-Session
- User switches from Portfolio A to Portfolio B
- All cached data should invalidate
- Queries should use new portfolio_id
- URL should reflect portfolio (e.g., /portfolio/abc123/work-orders)

### Deleted/Archived Records
- Use `active` boolean, not hard deletes
- Queries should filter `WHERE active = true` by default
- Archived data still accessible via explicit filter

---

## Validation Criteria

### Database
- [ ] All tables created with proper relationships
- [ ] Foreign keys enforced
- [ ] RLS policies active on all tables
- [ ] Indexes created for common queries
- [ ] user_portfolio_ids() function works

### Queries
- [ ] Work orders query returns only active portfolio's data
- [ ] Technicians query scoped to portfolio
- [ ] Messages query returns only for accessible work orders
- [ ] Filters work (status, priority, assigned_to, etc.)

### Multi-Portfolio
- [ ] User with multiple portfolios sees portfolio selector
- [ ] Switching portfolio changes all displayed data
- [ ] Data from one portfolio never leaks to another
- [ ] New work order created with correct portfolio_id

---

## Dependencies

**Requires Before Starting:**
- Supabase project created
- Auth enabled in Supabase
- Database access configured

**Blocks Until Complete:**
- PRP-02 (Auth) - needs portfolio_users table
- PRP-03+ (UI) - needs data hooks
- All operational features - need data foundation

---

## Implementation Checklist

### Database Setup (Supabase SQL Editor)
- [ ] Create portfolios table
- [ ] Create portfolio_users table
- [ ] Create properties table
- [ ] Create units table
- [ ] Create work_orders table
- [ ] Create technicians table
- [ ] Create messages table
- [ ] Create approvals table
- [ ] Create vendors table
- [ ] Create audit_log table
- [ ] Create user_portfolio_ids() function
- [ ] Enable RLS on all tables
- [ ] Create RLS policies
- [ ] Create indexes

### Frontend Setup
- [ ] Generate TypeScript types from schema
- [ ] Create Supabase client singleton
- [ ] Create PortfolioContext for active portfolio
- [ ] Create base data hooks
- [ ] Test queries return scoped data

### Seed Data (for development)
- [ ] Create test portfolio
- [ ] Create test properties and units
- [ ] Create sample work orders in various statuses
- [ ] Create test technicians
- [ ] Create sample messages
- [ ] Create pending approvals

---

## Next Steps

After PRP-01 is complete:
- PRP-02: Authentication & Authorization (uses portfolio_users)
- PRP-03: Work Order Interactions (uses data hooks)
- PRP-04: Scheduling & Calendar (uses technicians, work_orders)
